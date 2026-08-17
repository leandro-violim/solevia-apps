export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.tutorial.v1";

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

export const hasSeenTutorial = (storage: StorageLike | null = defaultStorage()): boolean => {
  if (!storage) return false;
  try {
    return storage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const markTutorialSeen = (storage: StorageLike | null = defaultStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, "1");
  } catch {
    /* blocked/full -> ignore */
  }
};
