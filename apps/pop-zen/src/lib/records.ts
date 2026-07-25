import { useCallback, useEffect, useState } from "react";
import { TOTAL_PHASES } from "./game-config";

export type PhaseRecord = {
  bestScore: number;
  bestTimeMs: number;
  /** Most recent completed run for this phase. Used to show change vs. previous. */
  lastScore: number;
  lastTimeMs: number;
  /** Snapshot of the record BEFORE the most recent run, for delta display. */
  prevBestScore: number;
  prevBestTimeMs: number;
};
export type RecordsMap = Record<number, PhaseRecord>;

const STORAGE_KEY = "bubble-records-v1";

function emptyRecords(): RecordsMap {
  const out: RecordsMap = {};
  for (let i = 1; i <= TOTAL_PHASES; i++) {
    out[i] = {
      bestScore: 0,
      bestTimeMs: 0,
      lastScore: 0,
      lastTimeMs: 0,
      prevBestScore: 0,
      prevBestTimeMs: 0,
    };
  }
  return out;
}

function readStorage(): RecordsMap {
  if (typeof window === "undefined") return emptyRecords();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRecords();
    const parsed = JSON.parse(raw) as Partial<RecordsMap>;
    const merged = emptyRecords();
    for (let i = 1; i <= TOTAL_PHASES; i++) {
      const r = parsed[i];
      if (r && typeof r.bestScore === "number" && typeof r.bestTimeMs === "number") {
        merged[i] = {
          bestScore: r.bestScore,
          bestTimeMs: r.bestTimeMs,
          lastScore: typeof r.lastScore === "number" ? r.lastScore : 0,
          lastTimeMs: typeof r.lastTimeMs === "number" ? r.lastTimeMs : 0,
          prevBestScore:
            typeof r.prevBestScore === "number" ? r.prevBestScore : 0,
          prevBestTimeMs:
            typeof r.prevBestTimeMs === "number" ? r.prevBestTimeMs : 0,
        };
      }
    }
    return merged;
  } catch {
    return emptyRecords();
  }
}

/**
 * localStorage-backed record store. Interface matches what a future
 * cloud implementation would expose so we can swap it out in one file.
 */
export function usePhaseRecords() {
  const [records, setRecords] = useState<RecordsMap>(() => emptyRecords());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(readStorage());
    setHydrated(true);
  }, []);

  const submit = useCallback((phase: number, score: number, timeMs: number) => {
    setRecords((prev) => {
      const cur =
        prev[phase] ?? {
          bestScore: 0,
          bestTimeMs: 0,
          lastScore: 0,
          lastTimeMs: 0,
          prevBestScore: 0,
          prevBestTimeMs: 0,
        };
      const next: PhaseRecord = {
        bestScore: Math.max(cur.bestScore, score),
        bestTimeMs:
          cur.bestTimeMs === 0 ? timeMs : Math.min(cur.bestTimeMs, timeMs),
        lastScore: score,
        lastTimeMs: timeMs,
        prevBestScore: cur.bestScore,
        prevBestTimeMs: cur.bestTimeMs,
      };
      const updated = { ...prev, [phase]: next };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore quota errors */
      }
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = emptyRecords();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(RUN_KEY);
      window.localStorage.removeItem(ALLTIME_KEY);
    } catch {
      /* ignore */
    }
    setRecords(fresh);
  }, []);

  return { records, submit, reset, hydrated };
}

/* ───────────────────────────────────────────────────────────────────────────
 * Full-run totals & all-time best
 *
 * A "run" is one attempt at all five phases. We accumulate each phase's score
 * as the player advances, then at the end of phase 5 compare the sum against
 * the all-time best total. These are plain functions (not a hook) so the play
 * screen can call them imperatively at the exact moment a phase settles.
 * ───────────────────────────────────────────────────────────────────────────
 */

const RUN_KEY = "bubble-run-v1";
const ALLTIME_KEY = "bubble-alltime-total-v1";

type RunScores = Record<number, number>;

function readRun(): RunScores {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RUN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RunScores;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRun(run: RunScores): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    /* ignore quota errors */
  }
}

/** Start a fresh run (call when entering phase 1). */
export function resetRun(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RUN_KEY);
  } catch {
    /* ignore */
  }
}

/** Record a phase's score into the current run. */
export function recordRunPhase(phase: number, score: number): void {
  const run = readRun();
  run[phase] = score;
  writeRun(run);
}

/** Sum of every phase score recorded in the current run so far. */
export function getRunTotal(): number {
  const run = readRun();
  return Object.values(run).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

/** The all-time best full-run total, or 0 if none yet. */
export function getAllTimeBestTotal(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(ALLTIME_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Compare a finished run's total against the all-time best. If it's a new
 * record, persist it. Returns whether the record was beaten and the previous
 * best (so the finish screen can show the delta). Ties do NOT count as beating.
 */
export function commitRunTotal(total: number): { beat: boolean; prevBest: number } {
  const prevBest = getAllTimeBestTotal();
  const beat = total > prevBest && prevBest > 0;
  const isFirstRun = prevBest === 0;
  if (total > prevBest && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ALLTIME_KEY, String(total));
    } catch {
      /* ignore */
    }
  }
  // On the very first completed run there's no prior record to "beat", so we
  // treat it as a celebration too (they just set their first all-time total).
  return { beat: beat || isFirstRun, prevBest };
}