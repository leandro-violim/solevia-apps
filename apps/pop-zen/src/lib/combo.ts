/**
 * P1-T2 combo state machine — FEEDBACK-ONLY. It counts consecutive fast pops and
 * notifies subscribers so the HUD / sound / particles can react. It deliberately
 * does NOT touch score, timer, phases, or spawn logic (that scoring payoff is a
 * later ticket, with the v1.4 mode split).
 *
 * A chain lives while pops land within `windowMs` of each other. The first two
 * pops in a window make "x2"; each further in-window pop bumps it. A gap longer
 * than the window (a real setTimeout, so it fires even with no further input)
 * resets the chain to 0. There's no "miss" concept in this game (tapping empty
 * space is a no-op), so only the time window can break a chain.
 *
 * Imperative + subscription (like the isolated Timer) so combo updates never
 * re-render the bubble field.
 */
import { JUICE } from "./juice";

const CFG = JUICE.combo;

export type ComboEvent = {
  /** Current combo (0 when idle/reset). */
  combo: number;
  /** Set to the milestone value on the pop that reaches 5/10/20/30/50, else null. */
  milestone: number | null;
  /** True when this event is a reset (window lapsed or explicit reset). */
  reset: boolean;
};

type Listener = (e: ComboEvent) => void;
const listeners = new Set<Listener>();

let combo = 0;
let lastAt = 0;
let resetTimer: ReturnType<typeof setTimeout> | undefined;

export function subscribeCombo(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit(e: ComboEvent): void {
  for (const fn of listeners) fn(e);
}

/** Call on each successful pop. Returns the combo info for driving sound/particles. */
export function registerPop(): ComboEvent {
  const now = Date.now();
  if (lastAt !== 0 && now - lastAt <= CFG.windowMs) combo += 1;
  else combo = 1; // start a fresh chain (not shown until it reaches minShown)
  lastAt = now;

  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(expire, CFG.windowMs);

  const milestone = (CFG.milestones as readonly number[]).includes(combo) ? combo : null;
  const e: ComboEvent = { combo, milestone, reset: false };
  emit(e);
  return e;
}

function expire(): void {
  resetTimer = undefined;
  combo = 0;
  lastAt = 0;
  emit({ combo: 0, milestone: null, reset: true });
}

/** Reset the chain immediately (new phase / restart). */
export function resetCombo(): void {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = undefined;
  combo = 0;
  lastAt = 0;
  emit({ combo: 0, milestone: null, reset: true });
}
