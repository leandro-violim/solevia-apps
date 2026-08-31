/**
 * Consumable power-ups (Candy-Crush-style boosters): Bombs and Time Freeze.
 *
 * Bought with coins (premium-priced — see CONFIG.consumables.prices), owned in
 * player storage, and used mid-stage in Pop Challenge:
 *   • Bomb   — arm, then tap a bubble to detonate a blast that clears its cluster.
 *   • Freeze — instantly adds CONFIG.consumables.freezeMs to the countdown.
 *
 * Mirrors the coins module's subscribe pattern so HUD counts update live.
 */
import { CONFIG } from "./config";
import { load, update } from "./storage";
import { track } from "./analytics";
import { spendCoins } from "./economy";
import { SPECIAL_LOOK } from "./specials";

export type ConsumableId = "bomb" | "freeze";

/**
 * Emoji for each consumable — the SAME glyphs the matching special bubbles show
 * in-game (💣 bomb, ❄️ frozen), so the shop/HUD icons read identically to what
 * appears inside a bubble. Sourced from SPECIAL_LOOK so they never drift apart.
 */
export const CONSUMABLE_EMOJI: Record<ConsumableId, string> = {
  bomb: SPECIAL_LOOK.bomb.emoji,
  freeze: SPECIAL_LOOK.frozen.emoji,
};

export const CONSUMABLES: { id: ConsumableId; price: number }[] = [
  { id: "bomb", price: CONFIG.consumables.prices.bomb },
  { id: "freeze", price: CONFIG.consumables.prices.freeze },
];

const listeners = new Set<() => void>();
export function subscribeInventory(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function notify(): void {
  for (const fn of listeners) fn();
}

export function priceOfConsumable(id: ConsumableId): number {
  return CONFIG.consumables.prices[id];
}

export function getCount(id: ConsumableId): number {
  return load().inventory[id] ?? 0;
}

/** Buy one, spending coins. Returns true on success (affordable). */
export function buyConsumable(id: ConsumableId): boolean {
  if (!spendCoins(priceOfConsumable(id), `consumable:${id}`)) return false;
  update((st) => {
    st.inventory[id] = (st.inventory[id] ?? 0) + 1;
  });
  track("consumable_bought", { item: id });
  notify();
  return true;
}

/** Consume one if in stock. Returns true if one was spent. */
export function consumeItem(id: ConsumableId): boolean {
  if (getCount(id) <= 0) return false;
  update((st) => {
    st.inventory[id] = Math.max(0, (st.inventory[id] ?? 0) - 1);
  });
  track("consumable_used", { item: id });
  notify();
  return true;
}

/** Grant one for free (rewards) — no coin cost. */
export function grantConsumable(id: ConsumableId, source: string): void {
  update((st) => {
    st.inventory[id] = (st.inventory[id] ?? 0) + 1;
  });
  track("consumable_granted", { item: id, source });
  notify();
}
