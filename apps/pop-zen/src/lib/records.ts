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
    } catch {
      /* ignore */
    }
    setRecords(fresh);
  }, []);

  return { records, submit, reset, hydrated };
}