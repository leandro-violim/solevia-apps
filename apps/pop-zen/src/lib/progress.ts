/**
 * World/phase progression (v1.3, Project C §11 step 4). Persists how far the
 * player has travelled through the 4 worlds × 8 phases so the map can show
 * done / current / locked and "Continue" can land on the current node.
 *
 * This is progression STATE, not game logic — timer/score/spawn are untouched.
 * "reached" = the furthest global stage (1..TOTAL_STAGES) the player has started;
 * it only ever moves forward.
 */
import { TOTAL_STAGES, roundOf, phaseInRound } from "./game-config";

const KEY = "zb_reached_stage";

const clamp = (n: number) => Math.min(Math.max(Math.round(n) || 1, 1), TOTAL_STAGES);

/** Furthest global stage the player has reached (1..TOTAL_STAGES; default 1). */
export function reachedStage(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? clamp(parseInt(raw, 10)) : 1;
  } catch {
    return 1;
  }
}

/** Record that the player has started `stage`; advances "reached" if it's further. */
export function noteStageReached(stage: number): void {
  if (!Number.isFinite(stage)) return;
  const s = clamp(stage);
  try {
    if (s > reachedStage()) localStorage.setItem(KEY, String(s));
  } catch {
    /* private mode / storage blocked — progression just won't persist */
  }
}

export type StageState = "done" | "current" | "locked";

/** Node state for the map: cleared (< reached), current (== reached), locked (>). */
export function stageState(stage: number, reached = reachedStage()): StageState {
  if (stage < reached) return "done";
  if (stage === reached) return "current";
  return "locked";
}

/** A stage is playable from the map if it's at or before the current node. */
export function isUnlocked(stage: number, reached = reachedStage()): boolean {
  return stage <= reached;
}

/** Current world (1..TOTAL_ROUNDS) + phase-in-world (1..8) + global stage. */
export function currentWorldPhase(): { world: number; phase: number; stage: number } {
  const stage = reachedStage();
  return { world: roundOf(stage), phase: phaseInRound(stage), stage };
}
