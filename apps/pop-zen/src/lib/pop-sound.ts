/**
 * Realistic plastic bubble-wrap pop synthesized with the Web Audio API.
 * Two layers:
 *  1. Filtered white-noise burst (the "crack")
 *  2. Fast downward pitch chirp (the "plop")
 * Voice-stealing: reuses a single AudioContext, allows overlapping pops.
 */
import { isSoundEnabled } from "./settings";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/** Call once from a user gesture to unlock audio on iOS Safari. */
export function unlockAudio() {
  getCtx();
}

export function playPop() {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // Master
  const master = ac.createGain();
  master.gain.setValueAtTime(0.9, now);
  master.connect(ac.destination);

  // 1) Noise burst (the crack)
  const noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) {
    nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
  }
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ac.createBiquadFilter();
  noiseFilter.type = "bandpass";
  // Slight per-pop pitch variation for a natural feel
  const centerFreq = 1600 + Math.random() * 900;
  noiseFilter.frequency.setValueAtTime(centerFreq, now);
  noiseFilter.Q.value = 6;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.55, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);
  noise.stop(now + 0.09);

  // 2) Downward pitch chirp (the plop body)
  const osc = ac.createOscillator();
  osc.type = "sine";
  const startFreq = 620 + Math.random() * 140;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(now);
  osc.stop(now + 0.12);
}