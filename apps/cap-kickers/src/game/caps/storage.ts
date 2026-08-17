import { DEFAULT_PLAYER_STYLE, styleById } from "./styles";

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.cap.v1";

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

/** The chosen cap-style id (falls back to the default on missing/unknown/blocked storage). */
export const loadCapStyleId = (storage: StorageLike | null = defaultStorage()): string => {
  if (!storage) return DEFAULT_PLAYER_STYLE;
  try {
    const raw = storage.getItem(KEY);
    // Validate against the known set (styleById falls back to the first style).
    if (raw && styleById(raw).id === raw) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_PLAYER_STYLE;
};

export const saveCapStyleId = (id: string, storage: StorageLike | null = defaultStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, id);
  } catch {
    /* blocked/full -> ignore */
  }
};
