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
/**
 * Bump when the stored shape changes. The payload is wrapped in
 * `{ schemaVersion, phases }` so we can migrate forward under one stable key
 * instead of stranding old data behind a new `-v2` key.
 *   v1 (legacy): a bare RecordsMap stored at the top level (no envelope).
 *   v2: `{ schemaVersion: 2, phases: RecordsMap }`.
 */
const SCHEMA_VERSION = 2;

type Envelope = { schemaVersion: number; phases: Record<string, unknown> };

function blank(): PhaseRecord {
  return {
    bestScore: 0,
    bestTimeMs: 0,
    lastScore: 0,
    lastTimeMs: 0,
    prevBestScore: 0,
    prevBestTimeMs: 0,
  };
}

function emptyRecords(): RecordsMap {
  const out: RecordsMap = {};
  for (let i = 1; i <= TOTAL_PHASES; i++) out[i] = blank();
  return out;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Validate/coerce one stored phase entry, or null if it isn't usable. */
function coercePhase(r: unknown): PhaseRecord | null {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  if (typeof o.bestScore !== "number" || typeof o.bestTimeMs !== "number") return null;
  return {
    bestScore: num(o.bestScore),
    bestTimeMs: num(o.bestTimeMs),
    lastScore: num(o.lastScore),
    lastTimeMs: num(o.lastTimeMs),
    prevBestScore: num(o.prevBestScore),
    prevBestTimeMs: num(o.prevBestTimeMs),
  };
}

/** Pull the phases map out of either the v2 envelope or a legacy bare map. */
function extractPhases(parsed: unknown): Record<string, unknown> {
  if (parsed && typeof parsed === "object") {
    if ("schemaVersion" in parsed && "phases" in parsed) {
      const phases = (parsed as Envelope).phases;
      return phases && typeof phases === "object" ? (phases as Record<string, unknown>) : {};
    }
    // Legacy v1: the bare RecordsMap lived at the top level.
    return parsed as Record<string, unknown>;
  }
  return {};
}

/** Pure parse+migrate, separated from localStorage so it can be unit-tested. */
export function parseStoredRecords(raw: string | null): RecordsMap {
  if (!raw) return emptyRecords();
  try {
    const phases = extractPhases(JSON.parse(raw));
    const merged = emptyRecords();
    for (let i = 1; i <= TOTAL_PHASES; i++) {
      const c = coercePhase(phases[i]);
      if (c) merged[i] = c;
    }
    return merged;
  } catch {
    return emptyRecords();
  }
}

/** Pure best/prev-best transition for one completed run. Testable without React. */
export function applyRun(
  map: RecordsMap,
  phase: number,
  score: number,
  timeMs: number,
): RecordsMap {
  const cur = map[phase] ?? blank();
  const next: PhaseRecord = {
    bestScore: Math.max(cur.bestScore, score),
    bestTimeMs: cur.bestTimeMs === 0 ? timeMs : Math.min(cur.bestTimeMs, timeMs),
    lastScore: score,
    lastTimeMs: timeMs,
    prevBestScore: cur.bestScore,
    prevBestTimeMs: cur.bestTimeMs,
  };
  return { ...map, [phase]: next };
}

function readStorage(): RecordsMap {
  if (typeof window === "undefined") return emptyRecords();
  try {
    return parseStoredRecords(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyRecords();
  }
}

function writeStorage(map: RecordsMap): void {
  try {
    const envelope: Envelope = { schemaVersion: SCHEMA_VERSION, phases: map };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    /* ignore quota errors */
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
      const updated = applyRun(prev, phase, score, timeMs);
      writeStorage(updated);
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
 * A "run" is one attempt at all phases. We accumulate each phase's score
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

/** Whether the current run already has a score recorded for `phase`. */
export function runHasPhase(phase: number): boolean {
  return readRun()[phase] !== undefined;
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
 * Pure decision for a finished run vs the all-time best. Ties do NOT beat; the
 * very first run counts as a celebration. `newBest` is the value to persist.
 * Separated from storage so it can be unit-tested.
 */
export function evaluateRun(
  total: number,
  prevBest: number,
): { beat: boolean; prevBest: number; newBest: number } {
  const beat = total > prevBest && prevBest > 0;
  const isFirstRun = prevBest === 0;
  return { beat: beat || isFirstRun, prevBest, newBest: Math.max(total, prevBest) };
}

/**
 * Compare a finished run's total against the all-time best, persist a new record
 * if beaten, and return whether it was beaten + the previous best (so the finish
 * screen can show the delta).
 */
export function commitRunTotal(total: number): { beat: boolean; prevBest: number } {
  const prevBest = getAllTimeBestTotal();
  const { beat, newBest } = evaluateRun(total, prevBest);
  if (newBest > prevBest && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ALLTIME_KEY, String(newBest));
    } catch {
      /* ignore */
    }
  }
  return { beat, prevBest };
}
