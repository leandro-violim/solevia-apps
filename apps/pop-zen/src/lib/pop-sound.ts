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
  master.gain.setValueAtTime(1, now);
  master.connect(ac.destination);

  // Slight per-pop variation so repeated pops feel natural, not machine-gun.
  const v = 0.9 + Math.random() * 0.25;

  // 1) Body "pock" — the resonant air-cavity thump of the plastic dome
  //    collapsing. A fast downward pitch snap with a very tight envelope is
  //    what makes it read as a real bubble-wrap pop rather than a beep. This
  //    is now the dominant layer (the old sound was mostly broadband noise,
  //    which is why it sounded "hissy").
  const bodyStart = 440 * v;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(bodyStart, now);
  osc.frequency.exponentialRampToValueAtTime(85, now + 0.045);
  const bodyGain = ac.createGain();
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.95, now + 0.004); // sharp attack
  bodyGain.gain.exponentialRampToValueAtTime(0.0006, now + 0.085); // quick decay
  osc.connect(bodyGain);
  bodyGain.connect(master);
  osc.start(now);
  osc.stop(now + 0.1);

  // 2) A short mid resonance layered under the body adds "plastic" character.
  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(1100 * v, now);
  sub.frequency.exponentialRampToValueAtTime(260, now + 0.03);
  const subGain = ac.createGain();
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.28, now + 0.003);
  subGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.05);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(now);
  sub.stop(now + 0.06);

  // 3) Tiny high-frequency "snap" transient — the plastic film breaking.
  //    Only ~5ms of high-passed noise, so it's a click, not a hiss.
  const clickBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.005), ac.sampleRate);
  const cd = clickBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) {
    cd[i] = (Math.random() * 2 - 1) * (1 - i / cd.length);
  }
  const click = ac.createBufferSource();
  click.buffer = clickBuf;
  const clickHP = ac.createBiquadFilter();
  clickHP.type = "highpass";
  clickHP.frequency.value = 2800;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.3, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
  click.connect(clickHP);
  clickHP.connect(clickGain);
  clickGain.connect(master);
  click.start(now);
  click.stop(now + 0.02);
}