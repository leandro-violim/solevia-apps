/**
 * Per-run stats (§8/§10). A run = one full Time Attack play session. play.tsx
 * feeds these; objectives read them live, and at run end they're accumulated
 * into the persistent stats (storage) for achievements.
 */
import type { SpecialType } from "./specials";
import { update } from "./storage";

export type RunStats = {
  popped: number;
  maxCombo: number;
  goldenPopped: number;
  phasesCleared: number;
  fastestPhaseMs: number; // best single-phase clear time this run
  misses: number; // reserved (no miss signal yet); kept for "no-miss" objectives
  noMiss: boolean;
  revives: number; // P1-T4 — revives used this run (cap = CONFIG.ads.rewarded.maxRevivesPerRun)
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
    revives: 0,
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

/** P1-T4 — count a Time Attack revive: run-scoped (for the per-run cap) AND the
 *  lifetime stat (for the "first revive" achievement). */
export function registerRevive(): void {
  stats.revives += 1;
  update((st) => {
    st.stats.revivesUsed += 1;
  });
}
export function getRunRevives(): number {
  return stats.revives;
}

/**
 * Fold popped/golden/combo into the cumulative persistent stats (§10). Called at
 * a Time Attack run end (countRun) and on each Zen field clear.
 */
export function commitStats(
  popped: number,
  golden: number,
  maxCombo: number,
  countRun: boolean,
): void {
  update((st) => {
    st.stats.totalPopped += popped;
    st.stats.goldenPopped += golden;
    if (maxCombo > st.stats.bestCombo) st.stats.bestCombo = maxCombo;
    if (countRun) st.stats.totalRuns += 1;
  });
}
