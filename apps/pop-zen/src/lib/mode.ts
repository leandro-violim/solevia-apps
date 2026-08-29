/**
 * Game modes (§9) — Zen vs Time Attack, first-class.
 *
 * The active mode travels as the `/play` route's `?mode=` search param (no
 * global state needed); this module gives the mode-aware behavior flags every
 * feature branches on, so "how does X differ by mode" lives in ONE place.
 */
import { track } from "./analytics";

export type GameMode = "zen" | "time-attack";

export type ModeBehavior = {
  hasTimer: boolean; // Time Attack races a clock; Zen is timeless
  comboScores: boolean; // TA: best-combo×15 feeds score; Zen: feedback-only
  specialsMultiplier: number; // special-bubble spawn scaling (Zen rare/off)
  objectives: boolean; // per-run objective cards (TA only)
  rewardedRevive: boolean; // "+15s" revive offer (TA only)
  endless: boolean; // Zen is endless generative; TA has phases (+ endless mode)
  calmerJuice: boolean; // Zen dials the flourishes down
};

export function isZen(mode: GameMode): boolean {
  return mode === "zen";
}

export function modeBehavior(mode: GameMode): ModeBehavior {
  if (mode === "zen") {
    return {
      hasTimer: false,
      comboScores: false,
      specialsMultiplier: 0.15, // CONFIG.specials.zenMultiplier (kept in sync)
      objectives: false,
      rewardedRevive: false,
      endless: true,
      calmerJuice: true,
    };
  }
  // time-attack
  return {
    hasTimer: true,
    comboScores: true,
    specialsMultiplier: 1,
    objectives: true,
    rewardedRevive: true,
    endless: false,
    calmerJuice: false,
  };
}

export function trackModeSelected(mode: GameMode): void {
  track("mode_selected", { mode });
}
