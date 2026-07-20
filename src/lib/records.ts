import { useCallback, useEffect, useState } from "react";
import { TOTAL_PHASES } from "./game-config";

export type PhaseRecord = { bestScore: number; bestTimeMs: number };
export type RecordsMap = Record<number, PhaseRecord>;

const STORAGE_KEY = "bubble-records-v1";

function emptyRecords(): RecordsMap {
  const out: RecordsMap = {};
  for (let i = 1; i <= TOTAL_PHASES; i++) {
    out[i] = { bestScore: 0, bestTimeMs: 0 };
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
        merged[i] = r;
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
      const cur = prev[phase] ?? { bestScore: 0, bestTimeMs: 0 };
      const next: PhaseRecord = {
        bestScore: Math.max(cur.bestScore, score),
        bestTimeMs:
          cur.bestTimeMs === 0 ? timeMs : Math.min(cur.bestTimeMs, timeMs),
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