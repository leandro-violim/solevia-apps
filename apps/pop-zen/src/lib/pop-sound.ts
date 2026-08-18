/**
 * Realistic plastic bubble-wrap pop, synthesized with the Web Audio API (no
 * audio files → zero download cost and no licensing concerns). Layers:
 *   1. Low "thock" — the air-cavity thump of the dome collapsing (body/weight).
 *   2. Mid pock — a fast downward pitch snap (the recognizable "plop").
 *   3. Short mid resonance — the plastic character.
 *   4. ~6ms high-passed noise click — the film breaking (the sharp transient).
 *
 * All pops share one bus: a DynamicsCompressor acting as a limiter + makeup
 * gain. That lets each pop be driven hot (loud, punchy) while peaks stay clamped
 * so overlapping pops never clip or sound harsh.
 */
import { isSoundEnabled } from "./settings";

let ctx: AudioContext | null = null;
let bus: DynamicsCompressorNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Resume from "suspended" AND iOS's post-interruption state (e.g. after a
  // full-screen ad grabbed the audio session).
  if (ctx.state !== "running") {
    void ctx.resume();
  }
  return ctx;
}

/** Shared limiter + makeup-gain bus. Built once, reused for every pop. */
function getBus(ac: AudioContext): AudioNode {
  if (!bus || bus.context !== ac) {
    const comp = ac.createDynamicsCompressor();
    // Fast limiter: clamp peaks so we can push the pops loud without clipping.
    comp.threshold.setValueAtTime(-14, ac.currentTime);
    comp.knee.setValueAtTime(4, ac.currentTime);
    comp.ratio.setValueAtTime(14, ac.currentTime);
    comp.attack.setValueAtTime(0.001, ac.currentTime);
    comp.release.setValueAtTime(0.09, ac.currentTime);
    const makeup = ac.createGain();
    makeup.gain.setValueAtTime(1.9, ac.currentTime); // makeup gain → makes it LOUD
    comp.connect(makeup);
    makeup.connect(ac.destination);
    bus = comp;
  }
  return bus;
}

/** Call once from a user gesture to unlock audio on iOS Safari. */
export function unlockAudio() {
  const ac = getCtx();
  if (ac) getBus(ac);
}

/**
 * Recreate the audio context after a full-screen ad. On iOS the AdMob
 * interstitial takes over the AVAudioSession, and WebAudio can stay silenced even
 * after resume(); tearing the context down so the next pop builds a fresh one
 * (inside a user gesture) reliably restores the pop sound.
 */
export function resetAudio() {
  if (ctx) void ctx.close().catch(() => {});
  ctx = null;
  bus = null;
}

// Reactivate audio whenever the app returns to the foreground (returning from an
// ad, the app switcher, a phone call, …).
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx && ctx.state !== "running") {
      void ctx.resume();
    }
  });
}

export function playPop() {
  if (!isSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const out = getBus(ac);

  // Per-pop mixer so overlapping pops each get their own envelope, then hit the
  // shared limiter together.
  const mix = ac.createGain();
  mix.gain.setValueAtTime(1, now);
  mix.connect(out);

  // Slight per-pop variation so repeated pops feel natural, not machine-gun.
  const v = 0.9 + Math.random() * 0.22;

  // 1) Low "thock" — the air-cavity thump. Gives the pop body and weight so it
  //    reads as a real bubble collapsing, not a thin beep.
  const thock = ac.createOscillator();
  thock.type = "sine";
  thock.frequency.setValueAtTime(185 * v, now);
  thock.frequency.exponentialRampToValueAtTime(55, now + 0.06);
  const thockGain = ac.createGain();
  thockGain.gain.setValueAtTime(0.0001, now);
  thockGain.gain.exponentialRampToValueAtTime(0.9, now + 0.005);
  thockGain.gain.exponentialRampToValueAtTime(0.0006, now + 0.11);
  thock.connect(thockGain);
  thockGain.connect(mix);
  thock.start(now);
  thock.stop(now + 0.12);

  // 2) Mid "pock" — the fast downward pitch snap that makes it read as a pop.
  const pock = ac.createOscillator();
  pock.type = "triangle";
  pock.frequency.setValueAtTime(470 * v, now);
  pock.frequency.exponentialRampToValueAtTime(90, now + 0.045);
  const pockGain = ac.createGain();
  pockGain.gain.setValueAtTime(0.0001, now);
  pockGain.gain.exponentialRampToValueAtTime(1.05, now + 0.004); // sharp attack
  pockGain.gain.exponentialRampToValueAtTime(0.0006, now + 0.085); // quick decay
  pock.connect(pockGain);
  pockGain.connect(mix);
  pock.start(now);
  pock.stop(now + 0.1);

  // 3) Short mid resonance — plastic character layered under the body.
  const res = ac.createOscillator();
  res.type = "sine";
  res.frequency.setValueAtTime(1150 * v, now);
  res.frequency.exponentialRampToValueAtTime(280, now + 0.03);
  const resGain = ac.createGain();
  resGain.gain.setValueAtTime(0.0001, now);
  resGain.gain.exponentialRampToValueAtTime(0.34, now + 0.003);
  resGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.05);
  res.connect(resGain);
  resGain.connect(mix);
  res.start(now);
  res.stop(now + 0.06);

  // 4) ~6ms high-passed noise click — the plastic film snapping. A click, not a
  //    hiss, so it adds sharpness/attack without sounding noisy.
  const clickBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.006), ac.sampleRate);
  const cd = clickBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) {
    cd[i] = (Math.random() * 2 - 1) * (1 - i / cd.length);
  }
  const click = ac.createBufferSource();
  click.buffer = clickBuf;
  const clickHP = ac.createBiquadFilter();
  clickHP.type = "highpass";
  clickHP.frequency.value = 2600;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.5, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
  click.connect(clickHP);
  clickHP.connect(clickGain);
  clickGain.connect(mix);
  click.start(now);
  click.stop(now + 0.024);
}
