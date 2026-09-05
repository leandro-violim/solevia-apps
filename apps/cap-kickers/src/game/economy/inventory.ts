// Inventory — the set of unlockable item ids the player has UNLOCKED (owned).
//
// Deliberately just the owned set. "Equipped" for pitches and caps stays in the
// existing per-type stores (pitches/storage.ts, caps/storage.ts) so the render
// loop keeps reading the same source it always has; the Cabinet equips by calling
// those. Items the catalog marks `free` are always available and are NOT stored
// here — this only records what was earned.
//
// Defensive + injectable, matching src/game/settings/storage.ts.

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.inventory.v1";

const defaultStorage = (): StorageLike | null => {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
      return (globalThis as { localStorage: StorageLike }).localStorage;
    }
  } catch {
    /* fall through */
  }
  return null;
};

/** Owned unlockable ids (deduped, strings only; empty on missing/blocked/corrupt). */
export const loadOwned = (storage: StorageLike | null = defaultStorage()): string[] => {
  if (!storage) return [];
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { owned?: unknown };
    if (!Array.isArray(parsed.owned)) return [];
    return [...new Set(parsed.owned.filter((v): v is string => typeof v === "string"))];
  } catch {
    return [];
  }
};

const saveOwned = (owned: string[], storage: StorageLike | null): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify({ owned }));
  } catch {
    /* blocked/full -> ignore */
  }
};

export const isOwned = (id: string, storage: StorageLike | null = defaultStorage()): boolean =>
  loadOwned(storage).includes(id);

/** Mark an item unlocked (idempotent). Returns the new owned set. */
export const unlock = (id: string, storage: StorageLike | null = defaultStorage()): string[] => {
  const owned = loadOwned(storage);
  if (id && !owned.includes(id)) {
    owned.push(id);
    saveOwned(owned, storage);
  }
  return owned;
};
