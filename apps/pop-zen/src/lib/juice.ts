/**
 * ─────────────────────────────────────────────────────────────────────────
 * P1-T1 "Juice the pop" — TUNABLES
 * ─────────────────────────────────────────────────────────────────────────
 * Every game-feel value that JavaScript reads lives here so it's trivial to
 * fine-tune from the live preview. The two VISUAL knobs that live in CSS
 * instead (squash-&-stretch curve + the pop flash) are the `--zb-pop-*`
 * variables in src/styles.css, right above the `.zb` block — documented there.
 *
 * Nothing here changes game rules (timer, score, phases, spawn) — pure feel.
 */
export const JUICE = {
  /** Particle burst emitted from a bubble's centre on each pop. */
  particles: {
    countMin: 6, // particles per pop (inclusive)
    countMax: 10,
    maxAlive: 120, // hard cap across the whole field; oldest are dropped past this
    lifeMs: 150, // how long each particle drifts + fades
    speedMin: 45, // outward launch speed, px/sec
    speedMax: 170,
    sizeMin: 2, // particle radius, px
    sizeMax: 5,
    drag: 4.2, // velocity damping per second (higher = stops sooner)
    gravityY: 70, // gentle downward pull, px/sec² (0 = pure radial)
    /** One soft plastic-highlight tint per bubble variant (0–3). */
    tints: ["#cfeaff", "#e8f6ff", "#d7f0ff", "#f2fbff"],
    brightnessJitter: 0.18, // ± per-particle brightness so a burst isn't flat
  },

  /** Recorded pop SFX variation (see src/lib/pop-sound.ts). */
  sound: {
    pitchJitter: 0.08, // ±8% playbackRate so repeats don't sound identical
    volumeJitter: 0.1, // ±10% gain
  },

  /**
   * P1-T2 combo system (see src/lib/combo.ts). FEEDBACK-ONLY — the combo does
   * NOT affect score/timer/spawn. Keep it CALM: the pitch rise is hard-capped so
   * a long chain never turns shrill; flourishes stay gentle and "zen".
   */
  combo: {
    windowMs: 1200, // max gap between pops that keeps a chain alive; lapse → reset
    minShown: 2, // combo readout appears at this value ("x2" = 2 pops in the window)
    milestones: [5, 10, 20, 30, 50], // combo values that fire the bigger flourish
    pitchStep: 0.018, // playbackRate added per combo step (rising pitch)
    pitchCeil: 0.22, // HARD cap on the added rate → never shrill (max ≈ 1.3× with jitter)
    milestoneParticles: 16, // base extra particles in a milestone burst (+4 per higher tier)
    milestoneHoldMs: 1100, // how long the "Combo x10!" popup stays on screen
    readoutFadeMs: 500, // combo readout fade-out on reset
  },
} as const;
