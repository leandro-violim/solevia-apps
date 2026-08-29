/**
 * Coins (§1) — the soft currency. Sits on the storage + analytics modules.
 * Every earn/spend fires a resource analytics event and can never go negative.
 */
import { CONFIG } from "./config";
import { load, update } from "./storage";
import { track } from "./analytics";

const listeners = new Set<() => void>();
/** Subscribe to balance changes (for live coin displays). Returns an unsubscribe. */
export function subscribeCoins(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function notifyCoins(): void {
  for (const fn of listeners) fn();
}

export function getCoins(): number {
  return load().coins;
}

/** Grant coins from a named source (fires coins_earned). Returns new balance. */
export function addCoins(n: number, source: string): number {
  const amount = Math.max(0, Math.round(n));
  if (amount === 0) return getCoins();
  const s = update((st) => {
    st.coins += amount;
  });
  track("coins_earned", { amount, source });
  notifyCoins();
  return s.coins;
}

/** Spend coins into a named sink. Returns true if affordable (never negative). */
export function spendCoins(n: number, sink: string): boolean {
  const amount = Math.max(0, Math.round(n));
  if (amount === 0) return true;
  if (getCoins() < amount) return false;
  update((st) => {
    st.coins -= amount;
  });
  track("coins_spent", { amount, sink });
  notifyCoins();
  return true;
}

/** Time Attack run reward: round(score / timeAttackPerScore). */
export function coinsForScore(score: number): number {
  return Math.round(score / CONFIG.coins.timeAttackPerScore);
}

/** Zen trickle: ~1 coin per `zenPerBubbles` popped. */
export function coinsForZenBubbles(bubbles: number): number {
  return Math.floor(bubbles / CONFIG.coins.zenPerBubbles);
}
