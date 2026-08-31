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
import { isSoundEnabled } from "./settings";
import { JUICE } from "./juice";
import pop1 from "../assets/sounds/pop-1.mp3";
import pop2 from "../assets/sounds/pop-2.mp3";
import pop3 from "../assets/sounds/pop-3.mp3";

const SOURCES = [pop1, pop2, pop3];

let ctx: AudioContext | null = null;
let bus: AudioNode | null = null;
let buffers: AudioBuffer[] = [];
let loading = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
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

/** Call from the first user gesture to unlock iOS audio AND warm the samples. */
export function unlockAudio(): void {
  const ac = getCtx();
  if (ac) {
    getBus(ac);
    void loadBuffers(ac);
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
  const ac = getCtx(); // getCtx() resumes a non-running context
  if (!ac) return;
  getBus(ac);
  if (buffers.length !== SOURCES.length) void loadBuffers(ac); // re-decode if dropped
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeAudio();
  });
}

/**
 * Play a pop. `combo` (P1-T2) nudges the pitch UP per combo step, hard-capped by
 * JUICE.combo.pitchCeil so a long chain rises musically but never goes shrill.
 */
export function playPop(combo = 0): void {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  if (buffers.length !== SOURCES.length) {
    void loadBuffers(ac); // not ready this tap; ready by the next
    return;
  }
  const out = getBus(ac);
  const buf = buffers[(Math.random() * buffers.length) | 0];
  // A fresh one-shot source per pop → overlapping pops always play together and
  // never cut each other off (Web Audio is inherently polyphonic).
  const src = ac.createBufferSource();
  src.buffer = buf;
  const { pitchJitter, volumeJitter } = JUICE.sound;
  // Rising pitch: +pitchStep per combo step, clamped to pitchCeil (calm ceiling).
  const rise = Math.min(Math.max(combo - 1, 0) * JUICE.combo.pitchStep, JUICE.combo.pitchCeil);
  src.playbackRate.value = 1 + rise + (Math.random() * 2 - 1) * pitchJitter;
  const g = ac.createGain();
  g.gain.value = 1 + (Math.random() * 2 - 1) * volumeJitter; // ±10%
  src.connect(g);
  g.connect(out);
  src.start();
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
