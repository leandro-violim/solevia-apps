/**
 * Realistic plastic bubble-wrap pop, played from Leandro's 3 real recorded
 * samples (mono, ~0.31s, ~6KB each → negligible bundle cost). We rotate between
 * them and nudge the playback rate per pop so rapid pops never sound identical.
 *
 * All pops share one bus: a DynamicsCompressor limiter + makeup gain, so
 * overlapping pops stay loud but never clip.
 *
 * Samples are decoded once into cached AudioBuffers. `resetAudio()` (after a
 * full-screen ad steals the iOS audio session) closes the context and drops the
 * cache so the next pop rebuilds and re-decodes cleanly. `unlockAudio()` must be
 * called from a real user gesture (Home "Play" / first tap) to unlock iOS audio
 * AND warm the decode so the first pop isn't silent.
 */
import { Capacitor } from "@capacitor/core";
import { isSoundEnabled } from "./settings";
import { JUICE } from "./juice";
import pop1 from "../assets/sounds/pop-1.mp3";
import pop2 from "../assets/sounds/pop-2.mp3";
import pop3 from "../assets/sounds/pop-3.mp3";

const SOURCES = [pop1, pop2, pop3];

// On native (Capacitor/WKWebView) the WebAudio audio units can't initialise in the
// web-content process ("AudioComponentRegistrar … Operation not permitted"), and a
// failed AudioContext leaves the shared iOS audio session INTERRUPTED — which then
// muted the AdMob video ads. So we NEVER create a WebAudio context on native: pops
// play via the HTMLAudio pool, and the WebAudio-only chimes (milestone/coin) simply
// stay silent on native (they still work on the web build). getCtx() returns null
// on native, which makes every WebAudio path a no-op.
const IS_NATIVE = Capacitor.isNativePlatform();

// ── Pop playback via HTMLAudio (NOT WebAudio) ────────────────────────────────
// On iOS/WKWebView the WebAudio audio units can fail to initialise inside the web
// content process ("AudioComponentRegistrar … Operation not permitted"), leaving
// the AudioContext silently interrupted — so WebAudio pops produced NO sound until
// a full-screen ad reset the audio stack. The HTMLAudio media pipeline (the same
// one the background music uses) is unaffected, so pops now play through a small
// round-robin pool of <audio> elements. The samples are tiny inlined data URIs.
const POP_POOL_SIZE = 12;
const pool: HTMLAudioElement[] = [];
let poolIdx = 0;
let poolUnlocked = false;

function buildPool(): void {
  if (pool.length || typeof Audio === "undefined") return;
  for (let i = 0; i < POP_POOL_SIZE; i++) {
    const a = new Audio(SOURCES[i % SOURCES.length]);
    a.preload = "auto";
    // Let playbackRate shift PITCH (bright combo rise), not just tempo.
    a.preservesPitch = false;
    (a as unknown as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;
    (a as unknown as { mozPreservesPitch?: boolean }).mozPreservesPitch = false;
    pool.push(a);
  }
}

// iOS unlocks HTMLAudio on the first play from a user gesture; prime each element
// muted so the first real pop is instant + audible.
function unlockPool(): void {
  if (poolUnlocked || !pool.length) return;
  poolUnlocked = true;
  for (const a of pool) {
    a.muted = true;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
      })
      .catch(() => {
        a.muted = false;
      });
  }
}

let ctx: AudioContext | null = null;
let bus: AudioNode | null = null;
let buffers: AudioBuffer[] = [];
let loading = false;

function getCtx(): AudioContext | null {
  // Never create/use a WebAudio context on native — see IS_NATIVE note above.
  if (typeof window === "undefined" || IS_NATIVE) return null;
  // iOS leaves the context "interrupted" after a full-screen ad or backgrounding;
  // resume() can't revive that, so drop it and build a fresh one. Because getCtx
  // is reached from the pop tap (a user gesture), the new context resumes and
  // plays — so pops always come back, even mid-phase after a rewarded video.
  const st = ctx?.state as string | undefined;
  if (ctx && (st === "interrupted" || st === "closed")) {
    void ctx.close().catch(() => {});
    ctx = null;
    bus = null;
    buffers = [];
  }
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    bus = null;
    buffers = []; // a fresh context needs freshly-decoded buffers
  }
  if (ctx.state !== "running") void ctx.resume();
  return ctx;
}

function getBus(ac: AudioContext): AudioNode {
  if (!bus || bus.context !== ac) {
    const comp = ac.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, ac.currentTime);
    comp.knee.setValueAtTime(4, ac.currentTime);
    comp.ratio.setValueAtTime(14, ac.currentTime);
    comp.attack.setValueAtTime(0.001, ac.currentTime);
    comp.release.setValueAtTime(0.09, ac.currentTime);
    const makeup = ac.createGain();
    makeup.gain.setValueAtTime(1.6, ac.currentTime);
    comp.connect(makeup);
    makeup.connect(ac.destination);
    bus = comp;
  }
  return bus;
}

async function loadBuffers(ac: AudioContext): Promise<void> {
  if (loading || buffers.length === SOURCES.length) return;
  loading = true;
  try {
    buffers = await Promise.all(
      SOURCES.map(async (url) => {
        const res = await fetch(url);
        const arr = await res.arrayBuffer();
        return await ac.decodeAudioData(arr);
      }),
    );
  } catch {
    buffers = []; // playPop will retry the decode
  } finally {
    loading = false;
  }
}

/**
 * Prime the output route with a 1-frame silent buffer. On iOS a freshly-created
 * AudioContext often produces NO sound for its first real source until an empty
 * buffer has been played through it once (the audio route only "wakes" then) —
 * which is why, before this, the first phase's pops were silent while a later
 * phase (whose ad rebuilt the context) had sound. Cheap + inaudible; safe to
 * repeat. Must run inside a user gesture (so the context can actually resume).
 */
function primeOutput(ac: AudioContext): void {
  try {
    const src = ac.createBufferSource();
    src.buffer = ac.createBuffer(1, 1, ac.sampleRate);
    src.connect(ac.destination);
    src.start(0);
  } catch {
    /* priming is best-effort */
  }
}

/**
 * Call from the first user gesture to unlock iOS audio AND warm the samples.
 * If the context was left "interrupted"/"closed" by backgrounding, rebuild it
 * here — inside the gesture — so the very first pop of a phase always sounds,
 * even after the app was minimized and reopened.
 */
export function unlockAudio(): void {
  // Primary: warm + unlock the HTMLAudio pop pool (the reliable path on iOS).
  buildPool();
  unlockPool();
  // Secondary: warm the WebAudio context used only by the milestone/coin/bell
  // chimes (best-effort — recovers after any ad if the web process blocked it).
  const st = ctx?.state as string | undefined;
  if (ctx && (st === "interrupted" || st === "closed")) resetAudio();
  const ac = getCtx();
  if (ac) {
    getBus(ac);
    primeOutput(ac); // wake the iOS output route so the first chime isn't swallowed
    void loadBuffers(ac);
  }
}

/**
 * Release our hold on the iOS audio session BEFORE a full-screen ad, so the ad's
 * own player can take the session and play its audio. Suspending the WebAudio
 * context deactivates its audio unit; `resumeAudio()` (called from the ad's
 * dismiss callback) brings pops back afterwards.
 */
export function suspendAudio(): void {
  try {
    if (ctx && ctx.state === "running") void ctx.suspend();
  } catch {
    /* best-effort */
  }
}

/** Rebuild the context after a full-screen ad steals the iOS audio session. */
export function resetAudio(): void {
  if (ctx) void ctx.close().catch(() => {});
  ctx = null;
  bus = null;
  buffers = [];
}

/**
 * F5: resume the audio context + re-prime the sample pool. A full-screen ad
 * (interstitial/rewarded) takes the native audio focus and leaves the WebAudio
 * context suspended; the native ad overlay doesn't fire `visibilitychange`, so
 * the ad's own dismiss callback (ads.ts) must call this or pops go silent. Also
 * used by the visibilitychange guard for web backgrounding. Cheap + idempotent.
 */
export function resumeAudio(): void {
  const state = ctx?.state as string | undefined;
  // iOS commonly leaves the context "interrupted" after the app was backgrounded
  // (or "closed" if it was torn down) — plain resume() can't recover that, so
  // rebuild it cleanly and pre-decode the samples so the first pop isn't silent.
  if (!ctx || state === "interrupted" || state === "closed") {
    resetAudio();
    unlockAudio();
    return;
  }
  const ac = getCtx(); // getCtx() resumes a merely-suspended context
  if (!ac) return;
  getBus(ac);
  if (buffers.length !== SOURCES.length) void loadBuffers(ac); // re-decode if dropped
}

// Pops are momentary one-shots (~0.3s), so there's nothing to hard-stop on
// minimize — the looping piano is what needs silencing (handled in music.ts).
// We only need to RECOVER the pop bus when the app returns to the foreground:
// iOS leaves the WebAudio context "interrupted" after backgrounding, and the
// WKWebView doesn't reliably fire `visibilitychange`, so listen to both.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeAudio();
  });
}

if (typeof window !== "undefined") {
  void import("@capacitor/app")
    .then(({ App }) => {
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) resumeAudio();
      }).catch(() => {});
      void App.addListener("resume", () => resumeAudio()).catch(() => {});
    })
    .catch(() => {});
}

/**
 * Play a pop through the HTMLAudio pool. `combo` (P1-T2) nudges the pitch UP per
 * combo step (via playbackRate with preservesPitch off), hard-capped by
 * JUICE.combo.pitchCeil so a long chain rises musically but never goes shrill.
 * A round-robin pool gives polyphony for rapid pops.
 */
export function playPop(combo = 0): void {
  if (!isSoundEnabled()) return;
  buildPool();
  if (!pool.length) return;
  const a = pool[poolIdx];
  poolIdx = (poolIdx + 1) % pool.length;
  const { pitchJitter, volumeJitter } = JUICE.sound;
  const rise = Math.min(Math.max(combo - 1, 0) * JUICE.combo.pitchStep, JUICE.combo.pitchCeil);
  try {
    a.playbackRate = 1 + rise + (Math.random() * 2 - 1) * pitchJitter;
    a.volume = Math.max(0, Math.min(1, 1 - Math.random() * volumeJitter)); // slight ≤1 jitter
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    /* ignore transient play() errors */
  }
}

/** One soft sine "bell" partial through the shared bus — the calm chime voice. */
function bell(
  ac: AudioContext,
  out: AudioNode,
  freq: number,
  at: number,
  gain: number,
  dur = 0.5,
): void {
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, at);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.02); // soft attack
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur); // gentle decay
  o.connect(g);
  g.connect(out);
  o.start(at);
  o.stop(at + dur + 0.05);
}

/**
 * Milestone flourish — a soft ASCENDING pentatonic arpeggio (a little "reward
 * jingle"), not a single beep: each note gets an octave-up shimmer, and a warm
 * low root underneath gives it body. Higher milestones play more notes so a x50
 * feels bigger than a x5 — but it stays gentle sine tones through the limiter,
 * so it's rewarding and celebratory without ever getting shrill or alarm-like.
 */
export function playMilestone(level: number): void {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  const out = getBus(ac);
  const now = ac.currentTime;
  const tier = Math.max(0, (JUICE.combo.milestones as readonly number[]).indexOf(level)); // 0..4
  const root = 523.25; // C5
  const scale = [0, 2, 4, 7, 9, 12]; // major pentatonic (C D E G A C) — bright, calm
  const notes = Math.min(3 + tier, scale.length); // 3 notes at x5 … up to 6 at x50
  // Short + light so it's a quick sparkle that punctuates the pop, not a tail
  // that sits on top of it. Faint low root for a touch of body, then a fast run.
  bell(ac, out, root / 2, now, 0.2, 0.3);
  for (let i = 0; i < notes; i++) {
    const t = now + i * 0.05; // tighter, quicker run
    const f = root * Math.pow(2, scale[i] / 12);
    bell(ac, out, f, t, 0.4, 0.2); // shorter decay → doesn't linger over the pops
    bell(ac, out, f * 2, t + 0.006, 0.09, 0.16); // faint, fast shimmer
  }
}

/**
 * A single bright "plim" — the coin/points-counter tick played rapidly as a score
 * counts up ("plim plim plim… money in your pocket"). `i` (the tick index) creeps
 * the pitch up so the run feels like it's building. Short + through the limiter.
 */
export function playCoinTick(i = 0): void {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  const out = getBus(ac);
  const now = ac.currentTime;
  const freq = 880 * Math.pow(2, Math.min(i, 16) / 24); // A5 creeping up ~a fifth
  const o = ac.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(freq, now);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.32, now + 0.004); // fast attack
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13); // short bright decay
  o.connect(g);
  g.connect(out);
  o.start(now);
  o.stop(now + 0.15);
}
