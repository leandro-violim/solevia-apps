export type PhaseConfig = {
  phase: number;
  bubbles: number;
  /** Bubble diameter in px on a ~360px-wide play area. */
  size: number;
  label: string;
};

export const PHASES: PhaseConfig[] = [
  { phase: 1, bubbles: 10, size: 110, label: "Extra Large" },
  { phase: 2, bubbles: 20, size: 82, label: "Large" },
  { phase: 3, bubbles: 32, size: 62, label: "Medium" },
  { phase: 4, bubbles: 45, size: 48, label: "Small" },
  { phase: 5, bubbles: 60, size: 38, label: "Tiny" },
];

export const TOTAL_PHASES = PHASES.length;

export function getPhase(phase: number): PhaseConfig {
  return PHASES[Math.min(Math.max(phase, 1), TOTAL_PHASES) - 1];
}

/**
 * Score = base + speed bonus.
 *   base       = bubbles * 10
 *   speedBonus = max(0, 600 - elapsedSec * 5) * (bubbles / 10)
 * Faster clears → higher bonus.
 */
export function computeScore(bubbles: number, elapsedMs: number): number {
  const base = bubbles * 10;
  const seconds = elapsedMs / 1000;
  const bonus = Math.max(0, 600 - seconds * 5) * (bubbles / 10);
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
