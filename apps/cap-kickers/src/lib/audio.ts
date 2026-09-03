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
  CROWD_FILES,
  FREE_SFX_FILES,
  AMBIENCE_FILE,
  packFiles,
  type CrowdSfx,
} from "./samples";

export type SfxName = "flick" | "clack" | "whistle" | "horn" | "cheer" | "ohh";
export type AudioSettings = { sound: boolean; music: boolean; ambience: boolean };
/** Which unlocked audio packs may play (from the Trophy Cabinet inventory). */
export type AudioPacks = { crowd: boolean; stadium: boolean };

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
  private packs: AudioPacks = { crowd: false, stadium: false };
  private inGame = false; // true while a match is on-screen (ambience plays)
  private music: { stop: () => void } | null = null;
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
    if (this.inGame) this.startAmbience();
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
    this.stopMusic();
    this.prefetchFree();
    this.startAmbience();
  }

  /** Warm the always-free match recordings so the first whistle/goal plays real. */
  private prefetchFree(): void {
    if (!this.settings.sound || !this.ensure() || !this.ctx) return;
    for (const id of Object.values(FREE_SFX_FILES)) void loadSample(this.ctx, id);
  }

  // ---- SFX -------------------------------------------------------------

  sfx(name: SfxName): void {
    if (!this.settings.sound) return;
    if (!this.ensure() || !this.ctx || !this.sfxGain) return;
    // A non-running context (post-interruption) would swallow the sound — nudge it.
    if (this.ctx.state !== "running") this.ctx.resume().catch(() => {});
    try {
      // Sample layer IN FRONT of the synth: a real crowd recording when the buffer
      // is already decoded, else the synth baseline. The crowd pack covers every
      // one-shot; without it, the free whistle + goal roar still play real. flick/
      // clack are in neither map, so they always stay synthesised.
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
    const buf = cachedSample(AMBIENCE_FILE);
    if (!buf) {
      // Lazy-load once, then start if still in a match.
      void loadSample(this.ctx, AMBIENCE_FILE).then(() => {
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

  // ---- Music -----------------------------------------------------------

  startMusic(): void {
    if (!this.settings.music || !this.wantMusic) return;
    if (this.music) return;
    if (!this.ensure() || !this.ctx || !this.musicGain) return;
    try {
      this.music = startTune(this.ctx, this.musicGain);
    } catch {
      this.music = null;
    }
  }

  stopMusic(): void {
    this.music?.stop();
    this.music = null;
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

// ---- Placeholder menu music (upbeat I–V–vi–IV loop) --------------------

type Bar = { bass: number; arp: [number, number, number, number] };
const BARS: Bar[] = [
  { bass: 48, arp: [60, 64, 67, 72] }, // C
  { bass: 43, arp: [59, 62, 67, 71] }, // G
  { bass: 45, arp: [57, 60, 64, 69] }, // Am
  { bass: 41, arp: [53, 57, 60, 65] }, // F
];
const STEP = 0.2; // eighth-note ~150 BPM feel

const startTune = (ctx: Ctx, out: AudioNode): { stop: () => void } => {
  let step = 0;
  let stopped = false;
  const oscs: OscillatorNode[] = [];
  const play = (f: number, dur: number, type: OscillatorType, peak: number) => {
    oscs.push(tone(ctx, out, f, ctx.currentTime + 0.01, dur, type, peak));
    if (oscs.length > 24) oscs.splice(0, oscs.length - 24);
  };
  const tick = () => {
    if (stopped) return;
    const bar = BARS[Math.floor(step / 4) % BARS.length];
    const beat = step % 4;
    play(freq(bar.arp[beat]), STEP * 0.9, "triangle", 0.5); // arpeggio lead
    if (beat === 0) play(freq(bar.bass), STEP * 3.6, "sine", 0.55); // bass on the bar
    if (beat % 2 === 1) noise(ctx, out, ctx.currentTime + 0.01, 0.03, 0.1, { type: "highpass", from: 6000, to: 6000 }); // hat
    step++;
  };
  tick();
  const id = setInterval(tick, STEP * 1000);
  return {
    stop: () => {
      stopped = true;
      clearInterval(id);
      for (const o of oscs) {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      }
    },
  };
};

/** App-wide singleton. */
export const gameAudio = new GameAudio();
