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

export function getPhase(phase: number): PhaseConfig {
  return PHASES[Math.min(Math.max(phase, 1), TOTAL_PHASES) - 1];
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
