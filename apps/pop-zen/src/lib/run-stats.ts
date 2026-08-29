/**
 * Per-run stats (§8/§10). A run = one full Time Attack play session. play.tsx
 * feeds these; objectives read them live, and at run end they're accumulated
 * into the persistent stats (storage) for achievements.
 */
import type { SpecialType } from "./specials";

export type RunStats = {
  popped: number;
  maxCombo: number;
  goldenPopped: number;
  phasesCleared: number;
  fastestPhaseMs: number; // best single-phase clear time this run
  misses: number; // reserved (no miss signal yet); kept for "no-miss" objectives
  noMiss: boolean;
};

function fresh(): RunStats {
  return {
    popped: 0,
    maxCombo: 0,
    goldenPopped: 0,
    phasesCleared: 0,
    fastestPhaseMs: Number.POSITIVE_INFINITY,
    misses: 0,
    noMiss: true,
  };
}

let stats: RunStats = fresh();

export function resetRunStats(): void {
  stats = fresh();
}
export function getRunStats(): RunStats {
  return stats;
}

export function noteRunPop(special: SpecialType): void {
  stats.popped += 1;
  if (special === "golden") stats.goldenPopped += 1;
}
export function noteRunCombo(combo: number): void {
  if (combo > stats.maxCombo) stats.maxCombo = combo;
}
export function noteRunPhaseCleared(timeMs: number): void {
  stats.phasesCleared += 1;
  if (timeMs > 0 && timeMs < stats.fastestPhaseMs) stats.fastestPhaseMs = timeMs;
}
export function noteRunMiss(): void {
  stats.misses += 1;
  stats.noMiss = false;
}
