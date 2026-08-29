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

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx && ctx.state !== "running") {
      void ctx.resume();
    }
  });
}

export function playPop(): void {
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
  src.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter; // ±8% → repeats differ
  const g = ac.createGain();
  g.gain.value = 1 + (Math.random() * 2 - 1) * volumeJitter; // ±10%
  src.connect(g);
  g.connect(out);
  src.start();
}
