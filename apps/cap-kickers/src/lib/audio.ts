// Game audio: procedurally-synthesized PLACEHOLDER sounds (no asset files) so
// the whole soundscape works today; real recordings can be swapped in later.
// Everything routes through a master graph with separate SFX and Music gains so
// the Settings toggles can mute each independently.
//
// #13 (Pop Zen bug): an interstitial / rewarded video / phone call suspends the
// WebAudio context and, unhandled, leaves the game muted afterwards. This engine
// resumes the context whenever the app returns to the foreground (and on the
// next SFX), so game sound comes back on its own. See resumeIfSuspended().

import {
  loadSample,
  cachedSample,
  playSample,
  decodeDataUri,
  CROWD_FILES,
  FREE_SFX_FILES,
  SFX_VARIANTS,
  FLICK_FILES,
  CLACK_FILES,
  STADIUM_BEDS,
  packFiles,
  type CrowdSfx,
} from "./samples";
import { loadVoLang, type VoLang } from "./vo-data";

export type SfxName = "flick" | "clack" | "whistle" | "horn" | "cheer" | "ohh";
export type AudioSettings = { sound: boolean; music: boolean; ambience: boolean };
/** Which unlocked audio packs may play (from the Trophy Cabinet inventory). */
export type AudioPacks = { crowd: boolean; stadium: boolean; commentary: boolean };
/** A match beat the commentator reacts to. */
export type VoMoment = "goal" | "final" | "near";
// Which VO clips can fire for each moment; a random one is picked per event
// (never repeating the last), so goals/matches don't all sound identical.
const VO_CLIPS: Record<VoMoment, string[]> = {
  goal: ["goal-1", "goal-2", "goal-3", "big-1"],
  final: ["final-1"],
  near: ["near-1", "near-2"],
};

// Minimal WebAudio surface we rely on (lets tests inject a mock in a node env).
type Ctx = AudioContext;

const A4 = 440;
const freq = (midi: number): number => A4 * Math.pow(2, (midi - 69) / 12);

export class GameAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceSrc: AudioBufferSourceNode | null = null;
  private settings: AudioSettings = { sound: true, music: true, ambience: true };
  private packs: AudioPacks = { crowd: false, stadium: false, commentary: false };
  private inGame = false; // true while a match is on-screen (ambience plays)
  // Commentary VO: the current language, its decoded clips, and the last clip
  // played per moment (so a random pick never immediately repeats).
  private voLang: VoLang = "en";
  private voClips = new Map<string, AudioBuffer>();
  private voLoadedLang: VoLang | null = null;
  private voLoading = false;
  private voLast: Partial<Record<VoMoment, string>> = {};
  // Last free-foley variant played per sfx name, so a random pick never repeats.
  private sfxLast: Partial<Record<SfxName, string>> = {};
  private ambienceBed = ""; // the bed chosen for the current match (random per match)
  private musicSrc: AudioBufferSourceNode | null = null; // looping menu theme
  private menuBuf: AudioBuffer | null = null; // decoded menu theme (lazy, once)
  private menuLoading = false;
  private wantMusic = false; // true while on a menu-type screen
  private initialized = false;
  private makeCtx: () => Ctx;

  constructor(makeCtx?: () => Ctx) {
    this.makeCtx =
      makeCtx ??
      (() => {
        const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
        const Impl = W.AudioContext ?? W.webkitAudioContext;
        return new Impl!();
      });
  }

  /** Lazily create the audio graph. Returns false if WebAudio is unavailable. */
  private ensure(): boolean {
    if (this.ctx) return true;
    try {
      const ctx = this.makeCtx();
      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      const sfxGain = ctx.createGain();
      sfxGain.connect(master);
      const musicGain = ctx.createGain();
      musicGain.connect(master);
      const ambienceGain = ctx.createGain();
      ambienceGain.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.sfxGain = sfxGain;
      this.musicGain = musicGain;
      this.ambienceGain = ambienceGain;
      this.applyGains();
      return true;
    } catch {
      this.ctx = null;
      return false;
    }
  }

  private applyGains(): void {
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.sound ? 0.9 : 0;
    if (this.musicGain) this.musicGain.gain.value = this.settings.music ? 0.32 : 0;
    // Ambience sits ~6 dB under the one-shots (§3). Its own Settings toggle.
    if (this.ambienceGain) this.ambienceGain.gain.value = this.settings.ambience ? 0.18 : 0;
  }

  /** Apply the latest settings live (mute/unmute SFX + music + ambience, stop/restart). */
  setSettings(s: AudioSettings): void {
    this.settings = { ...s };
    this.applyGains();
    if (!s.music) this.stopMusic();
    else if (this.wantMusic) this.startMusic();
    if (!s.ambience) this.stopAmbience();
    else if (this.inGame) this.startAmbience();
  }

  /**
   * Which audio packs are unlocked (from the Cabinet inventory). Prefetch a pack's
   * samples once it's unlocked AND sound is on — never at cold start (§3 lazy-load).
   */
  setPacks(p: AudioPacks): void {
    this.packs = { ...p };
    if (p.crowd && this.settings.sound) this.prefetch("crowd");
    if (p.stadium && (this.settings.sound || this.settings.ambience)) this.prefetch("stadium");
    if (p.commentary && this.settings.sound) void this.ensureVo();
    if (this.inGame) this.startAmbience();
  }

  /** Set the commentary language (from the app locale). Reloads clips if it changed. */
  setVoiceLang(lang: VoLang): void {
    if (lang === this.voLang) return;
    this.voLang = lang;
    if (this.packs.commentary && this.settings.sound) void this.ensureVo();
  }

  /** Decode the current language's commentary clips once (lazy; safe to re-call). */
  private async ensureVo(): Promise<void> {
    if (this.voLoadedLang === this.voLang || this.voLoading) return;
    if (!this.ensure() || !this.ctx) return;
    this.voLoading = true;
    try {
      const map = await loadVoLang(this.voLang);
      const clips = new Map<string, AudioBuffer>();
      await Promise.all(
        Object.entries(map).map(async ([key, uri]) => {
          const buf = await decodeDataUri(this.ctx!, uri);
          if (buf) clips.set(key, buf);
        }),
      );
      this.voClips = clips;
      this.voLoadedLang = this.voLang;
    } finally {
      this.voLoading = false;
    }
  }

  /**
   * Play a commentator line for a match beat — a random clip for that moment,
   * layered over the crowd like a broadcast. No-op unless the Commentary pack is
   * unlocked and SFX are on; if the clips aren't decoded yet it kicks the load and
   * skips this one (so the first call right after unlocking may be silent).
   */
  vo(moment: VoMoment): void {
    if (!this.settings.sound || !this.packs.commentary) return;
    if (!this.ctx || !this.sfxGain) return;
    const avail = (VO_CLIPS[moment] ?? []).filter((k) => this.voClips.has(k));
    if (avail.length === 0) {
      void this.ensureVo();
      return;
    }
    let pick = avail[Math.floor(Math.random() * avail.length)];
    if (avail.length > 1 && pick === this.voLast[moment]) {
      pick = avail[(avail.indexOf(pick) + 1) % avail.length];
    }
    this.voLast[moment] = pick;
    const buf = this.voClips.get(pick);
    if (!buf) return;
    if (this.ctx.state !== "running") this.ctx.resume().catch(() => {});
    try {
      playSample(this.ctx, this.sfxGain, buf, 1);
    } catch {
      /* never let audio break gameplay */
    }
  }

  private prefetch(pack: string): void {
    if (!this.ensure() || !this.ctx) return;
    for (const id of packFiles(pack)) void loadSample(this.ctx, id);
  }

  /** One-time wiring: resume on foreground (#13) + unlock on the first gesture. */
  init(): void {
    if (this.initialized || typeof document === "undefined") return;
    this.initialized = true;
    const resume = () => {
      // Backgrounded: stop the ambience so a phone in a pocket isn't decoding a
      // stadium (§3 efficiency). Foregrounded: resume and restart if still in-game.
      if (typeof document !== "undefined" && document.hidden) {
        this.stopAmbience();
        return;
      }
      this.resumeIfSuspended();
      if (this.inGame) this.startAmbience();
    };
    document.addEventListener("visibilitychange", resume);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", resume);
      window.addEventListener("pageshow", resume);
      const unlock = () => {
        this.unlock();
        if (this.wantMusic) this.startMusic();
      };
      window.addEventListener("pointerdown", unlock, { once: true });
    }
  }

  /** Resume the context after a user gesture (autoplay policy). */
  async unlock(): Promise<void> {
    if (!this.ensure() || !this.ctx) return;
    try {
      if (this.ctx.state !== "running") await this.ctx.resume();
    } catch {
      /* ignore */
    }
  }

  /**
   * Resume a context an interruption (ad / call) left non-running. The #13 fix.
   * iOS can leave a WKWebView AudioContext in "suspended" OR "interrupted" after a
   * full-screen ad, so resume on any non-running state, and restart the ambience
   * if we're mid-match. Safe to call repeatedly.
   */
  resumeIfSuspended(): void {
    if (this.ctx && this.ctx.state !== "running") {
      this.ctx.resume().then(() => {
        if (this.inGame) this.startAmbience();
      }).catch(() => {});
    }
  }

  /** Menu screens call this (music plays); games call enterGame(). */
  enterMenu(): void {
    this.wantMusic = true;
    this.inGame = false;
    this.stopAmbience();
    this.startMusic();
  }

  enterGame(): void {
    this.wantMusic = false;
    this.inGame = true;
    this.ambienceBed = ""; // re-pick a random bed for this match
    this.stopMusic();
    this.prefetchFree();
    this.startAmbience();
  }

  /** Warm the always-free match recordings so the first whistle/goal/flick plays
   *  real — the free one-shots plus every cap-foley variant. */
  private prefetchFree(): void {
    if (!this.settings.sound || !this.ensure() || !this.ctx) return;
    for (const id of Object.values(FREE_SFX_FILES)) void loadSample(this.ctx, id);
    for (const id of [...FLICK_FILES, ...CLACK_FILES]) void loadSample(this.ctx, id);
  }

  // ---- SFX -------------------------------------------------------------

  sfx(name: SfxName): void {
    if (!this.settings.sound) return;
    if (!this.ensure() || !this.ctx || !this.sfxGain) return;
    // A non-running context (post-interruption) would swallow the sound — nudge it.
    if (this.ctx.state !== "running") this.ctx.resume().catch(() => {});
    try {
      // Free cap foley (flick / clack): a real bottle-cap recording, a different
      // random take each time so the caps never sound copy-pasted. Falls back to
      // the synth until the takes finish decoding.
      const variants = SFX_VARIANTS[name];
      if (variants) {
        const loaded = variants.filter((id) => cachedSample(id));
        if (loaded.length > 0) {
          let pick = loaded[Math.floor(Math.random() * loaded.length)];
          if (loaded.length > 1 && pick === this.sfxLast[name]) {
            pick = loaded[(loaded.indexOf(pick) + 1) % loaded.length];
          }
          this.sfxLast[name] = pick;
          playSample(this.ctx, this.sfxGain, cachedSample(pick)!);
        } else {
          for (const id of variants) void loadSample(this.ctx, id); // warm for next time
          synth(this.ctx, this.sfxGain, name);
        }
        return;
      }
      // Sample layer IN FRONT of the synth: a real crowd recording when the buffer
      // is already decoded, else the synth baseline. The crowd pack covers every
      // one-shot; without it, the free whistle + goal roar still play real.
      const file = this.packs.crowd
        ? CROWD_FILES[name as CrowdSfx]
        : FREE_SFX_FILES[name as CrowdSfx];
      const buf = file ? cachedSample(file) : undefined;
      if (buf) {
        playSample(this.ctx, this.sfxGain, buf);
      } else {
        if (file) void loadSample(this.ctx, file); // warm the cache for next time
        synth(this.ctx, this.sfxGain, name);
      }
    } catch {
      /* never let audio break gameplay */
    }
  }

  // ---- Ambience (looping stadium bed under a match) ----------------------

  private startAmbience(): void {
    if (!this.settings.ambience || !this.packs.stadium || !this.inGame) return;
    if (this.ambienceSrc) return; // already looping — never start a second (cf. startMusic)
    if (!this.ensure() || !this.ctx || !this.ambienceGain) return;
    // Pick a random bed for this match (kept across a mid-match resume) so no two
    // matches share the same background murmur.
    if (!this.ambienceBed) this.ambienceBed = STADIUM_BEDS[Math.floor(Math.random() * STADIUM_BEDS.length)];
    const bed = this.ambienceBed;
    const buf = cachedSample(bed);
    if (!buf) {
      // Lazy-load once, then start if still in a match.
      void loadSample(this.ctx, bed).then(() => {
        if (this.inGame) this.startAmbience();
      });
      return;
    }
    try {
      this.ambienceSrc = playSample(this.ctx, this.ambienceGain, buf, 1, true);
    } catch {
      this.ambienceSrc = null;
    }
  }

  private stopAmbience(): void {
    try {
      this.ambienceSrc?.stop();
    } catch {
      /* already stopped */
    }
    this.ambienceSrc = null;
  }

  /** Play one commentary line for the Cabinet preview button (loads the clips if
   *  needed; goes through master so it's heard even with SFX muted). */
  async previewVo(): Promise<void> {
    if (!this.ensure() || !this.ctx || !this.master) return;
    await this.unlock();
    await this.ensureVo();
    const avail = VO_CLIPS.goal.filter((k) => this.voClips.has(k));
    if (avail.length === 0) return;
    const buf = this.voClips.get(avail[Math.floor(Math.random() * avail.length)]);
    if (!buf) return;
    try {
      playSample(this.ctx, this.master, buf, 0.9);
    } catch {
      /* ignore */
    }
  }

  /** Play ~1.5 s of a sample at low volume for a Cabinet preview button. */
  async previewSample(id: string): Promise<void> {
    if (!this.ensure() || !this.ctx || !this.master) return;
    await this.unlock();
    const buf = cachedSample(id) ?? (await loadSample(this.ctx, id));
    if (!buf || !this.ctx || !this.master) return;
    try {
      const src = playSample(this.ctx, this.master, buf, 0.5);
      src.stop(this.ctx.currentTime + 1.5);
    } catch {
      /* ignore */
    }
  }

  // ---- Music (looping menu theme) --------------------------------------

  startMusic(): void {
    if (!this.settings.music || !this.wantMusic) return;
    if (this.musicSrc) return; // already looping — never start a second
    if (!this.ensure() || !this.ctx || !this.musicGain) return;
    if (!this.menuBuf) {
      void this.loadMenuMusic(); // decode once, then start from there
      return;
    }
    try {
      this.musicSrc = playSample(this.ctx, this.musicGain, this.menuBuf, 1, true);
    } catch {
      this.musicSrc = null;
    }
  }

  /** Lazy-load + decode the menu theme once (its own code-split chunk). */
  private async loadMenuMusic(): Promise<void> {
    if (this.menuBuf || this.menuLoading || !this.ensure() || !this.ctx) return;
    this.menuLoading = true;
    try {
      const uri = (await import("./menu-music")).default;
      this.menuBuf = await decodeDataUri(this.ctx, uri);
      if (this.wantMusic && this.settings.music) this.startMusic();
    } finally {
      this.menuLoading = false;
    }
  }

  stopMusic(): void {
    try {
      this.musicSrc?.stop();
    } catch {
      /* already stopped */
    }
    this.musicSrc = null;
  }
}

// ---- Synthesis helpers -------------------------------------------------

const noiseBuffer = (ctx: Ctx, dur: number): AudioBuffer => {
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
};

/** ADSR-ish gain envelope: 0 -> peak (attack) -> ~0 (decay), all exponential-safe. */
const envelope = (g: GainNode, t: number, peak: number, attack: number, decay: number): void => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
};

const tone = (
  ctx: Ctx,
  out: AudioNode,
  f: number,
  t: number,
  dur: number,
  type: OscillatorType,
  peak: number,
): OscillatorNode => {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  const g = ctx.createGain();
  envelope(g, t, peak, Math.min(0.02, dur * 0.2), dur);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.06);
  return o;
};

const noise = (
  ctx: Ctx,
  out: AudioNode,
  t: number,
  dur: number,
  peak: number,
  filter: { type: BiquadFilterType; from: number; to: number; q?: number },
): void => {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const bp = ctx.createBiquadFilter();
  bp.type = filter.type;
  bp.frequency.setValueAtTime(filter.from, t);
  bp.frequency.exponentialRampToValueAtTime(Math.max(20, filter.to), t + dur);
  bp.Q.value = filter.q ?? 1;
  const g = ctx.createGain();
  envelope(g, t, peak, dur * 0.3, dur * 0.8);
  src.connect(bp);
  bp.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
};

const synth = (ctx: Ctx, out: AudioNode, name: SfxName): void => {
  const t = ctx.currentTime;
  switch (name) {
    case "flick": // quick finger-flick "thwip"
      noise(ctx, out, t, 0.09, 0.5, { type: "bandpass", from: 1900, to: 700, q: 1.3 });
      break;
    case "clack": // cap-on-cap knock
      noise(ctx, out, t, 0.05, 0.35, { type: "highpass", from: 1200, to: 1200, q: 0.7 });
      break;
    case "whistle": // referee whistle
      { const o = tone(ctx, out, 2650, t, 0.28, "triangle", 0.28);
        o.frequency.setValueAtTime(2650, t);
        o.frequency.linearRampToValueAtTime(2780, t + 0.14);
        o.frequency.linearRampToValueAtTime(2600, t + 0.28); }
      noise(ctx, out, t, 0.28, 0.06, { type: "bandpass", from: 2600, to: 2600, q: 8 });
      break;
    case "horn": // stadium air-horn on a goal
      tone(ctx, out, freq(58), t, 1.0, "sawtooth", 0.32);
      tone(ctx, out, freq(65), t, 1.0, "square", 0.22);
      break;
    case "cheer": // crowd roar
      noise(ctx, out, t, 1.3, 0.5, { type: "bandpass", from: 700, to: 1500, q: 0.8 });
      noise(ctx, out, t + 0.05, 1.2, 0.22, { type: "highpass", from: 2000, to: 3200, q: 0.5 });
      break;
    case "ohh": // disappointed "ohh" on a miss
      noise(ctx, out, t, 0.9, 0.4, { type: "bandpass", from: 900, to: 400, q: 0.9 });
      tone(ctx, out, freq(52), t, 0.8, "sine", 0.14);
      break;
  }
};

/** App-wide singleton. */
export const gameAudio = new GameAudio();
