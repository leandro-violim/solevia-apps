import { CONFIG, type Difficulty } from "./config";

export type PhaseConfig = {
  phase: number;
  bubbles: number;
  /** Bubble diameter in px on a ~360px-wide play area. */
  size: number;
  /** Time Attack countdown budget for this phase, in ms (before difficulty). */
  timeLimitMs: number;
  /**
   * i18n key for this phase's name. Resolved via `t(key)` for the full phrase
   * (play header) and `t("phaseShort" + phase)` for the records-list label —
   * Portuguese needs whole localized phrases, not a translated adjective.
   */
  key: `phase${number}`;
};

// Phases 1–5 are the original set; 6–8 (§9) continue smaller + denser.
export const PHASES: PhaseConfig[] = [
  { phase: 1, bubbles: 10, size: 110, timeLimitMs: 13000, key: "phase1" },
  { phase: 2, bubbles: 20, size: 82, timeLimitMs: 15000, key: "phase2" },
  { phase: 3, bubbles: 32, size: 62, timeLimitMs: 17000, key: "phase3" },
  { phase: 4, bubbles: 45, size: 48, timeLimitMs: 19000, key: "phase4" },
  { phase: 5, bubbles: 60, size: 38, timeLimitMs: 21000, key: "phase5" },
  { phase: 6, bubbles: 68, size: 33, timeLimitMs: 22000, key: "phase6" },
  { phase: 7, bubbles: 76, size: 29, timeLimitMs: 23000, key: "phase7" },
  { phase: 8, bubbles: 86, size: 26, timeLimitMs: 24000, key: "phase8" },
];

export const TOTAL_PHASES = PHASES.length;

// ── Rounds / "worlds" (Pop Challenge only) ───────────────────────────────────
// The 8 phases repeat as escalating ROUNDS. Each round reuses the same per-phase
// bubble counts/sizes/time, but layers a new mechanic on top (Candy-Crush-style
// worlds). A full Pop Challenge run is TOTAL_STAGES stages (rounds × phases).
export const PHASES_PER_ROUND = TOTAL_PHASES; // 8
export const TOTAL_ROUNDS = 4;
export const TOTAL_STAGES = PHASES_PER_ROUND * TOTAL_ROUNDS; // 32

/** The extra twist a round adds. Round 1 is the classic perfect grid. */
export type RoundMechanic = "grid" | "jitter" | "moving" | "shielded";
export const ROUND_MECHANIC: readonly RoundMechanic[] = ["grid", "jitter", "moving", "shielded"];

/** Which round (1–TOTAL_ROUNDS) a global stage number belongs to. */
export function roundOf(stage: number): number {
  const s = Math.min(Math.max(stage, 1), TOTAL_STAGES);
  return Math.floor((s - 1) / PHASES_PER_ROUND) + 1;
}

/** Position within the round (1–PHASES_PER_ROUND) for a global stage number. */
export function phaseInRound(stage: number): number {
  const s = Math.min(Math.max(stage, 1), TOTAL_STAGES);
  return ((s - 1) % PHASES_PER_ROUND) + 1;
}

/** The mechanic active for a given global stage. */
export function mechanicOf(stage: number): RoundMechanic {
  return ROUND_MECHANIC[roundOf(stage) - 1];
}

export function getPhase(phase: number): PhaseConfig {
  return PHASES[Math.min(Math.max(phase, 1), TOTAL_PHASES) - 1];
}

/**
 * Config for a global stage (1–TOTAL_STAGES): the same per-phase field as its
 * position within the round, so counts/sizes/time stay tuned while the round's
 * mechanic supplies the escalating difficulty. `.phase` is the in-round phase.
 */
export function stageConfig(stage: number, difficulty: Difficulty): PhaseConfig {
  return difficultyPhase(phaseInRound(stage), difficulty);
}

/**
 * Apply a difficulty modifier to a phase (§9). Easy = bigger bubbles + more time;
 * Hard = smaller + less time. `spawn` scales bubble count (denser = harder).
 */
export function difficultyPhase(phase: number, difficulty: Difficulty): PhaseConfig {
  const base = getPhase(phase);
  const d = CONFIG.difficulty[difficulty];
  return {
    ...base,
    size: Math.round(base.size * d.size),
    bubbles: Math.max(6, Math.round(base.bubbles * d.spawn)),
    timeLimitMs: Math.round(base.timeLimitMs * d.time),
  };
}

/**
 * Original count-up score (base + speed bonus) — kept for records/back-compat.
 */
export function computeScore(bubbles: number, elapsedMs: number): number {
  const base = bubbles * 10;
  const seconds = elapsedMs / 1000;
  const bonus = Math.max(0, 600 - seconds * 5) * (bubbles / 10);
  return Math.round(base + bonus);
}

/**
 * Time Attack score (§9): base + a bonus for the countdown time LEFT when you
 * clear the phase (clear faster → keep more time → higher). 0 time left = base.
 */
export function computeTimeAttackScore(
  bubbles: number,
  timeLeftMs: number,
  limitMs: number,
): number {
  const base = bubbles * 10;
  const frac = limitMs > 0 ? Math.max(0, Math.min(1, timeLeftMs / limitMs)) : 0;
  const bonus = frac * bubbles * 12; // up to ~1.2× base for a near-instant clear
  return Math.round(base + bonus);
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 100));
  const s = Math.floor(total / 10);
  const tenths = total % 10;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}.${tenths}`;
}

/** Countdown as M:SS for the Time Attack clock. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}
