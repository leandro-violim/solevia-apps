import { DEFAULT_PITCH_STYLE, pitchStyleById } from "./styles";

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.pitch.v1";

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

/** The chosen pitch-style id (falls back to the default on missing/unknown/blocked storage). */
export const loadPitchStyleId = (storage: StorageLike | null = defaultStorage()): string => {
  if (!storage) return DEFAULT_PITCH_STYLE;
  try {
    const raw = storage.getItem(KEY);
    if (raw && pitchStyleById(raw).id === raw) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_PITCH_STYLE;
};

export const savePitchStyleId = (id: string, storage: StorageLike | null = defaultStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, id);
  } catch {
    /* blocked/full -> ignore */
  }
};
