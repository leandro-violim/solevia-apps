// Persistent game settings. Audio/haptics aren't wired yet (placeholder-first),
// but the toggles persist here so the sound/music/vibration systems read them
// once added. Defensive + injectable, mirroring the caps/pitch stores.

export type Settings = {
  sound: boolean; // sound effects (pops, whistle, crowd)
  music: boolean; // menu / background music
  vibration: boolean; // haptic feedback
  analytics: boolean; // anonymous usage analytics (Firebase); player can opt out
};

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  vibration: true,
  analytics: true,
};

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.settings.v1";

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

const asBool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);

/** Load settings, merging stored values over defaults (unknown/missing/blocked -> defaults). */
export const loadSettings = (storage: StorageLike | null = defaultStorage()): Settings => {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      sound: asBool(parsed.sound, DEFAULT_SETTINGS.sound),
      music: asBool(parsed.music, DEFAULT_SETTINGS.music),
      vibration: asBool(parsed.vibration, DEFAULT_SETTINGS.vibration),
      analytics: asBool(parsed.analytics, DEFAULT_SETTINGS.analytics),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (s: Settings, storage: StorageLike | null = defaultStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* blocked/full -> ignore */
  }
};

/** Merge a partial update into the stored settings and persist; returns the new value. */
export const patchSettings = (
  patch: Partial<Settings>,
  storage: StorageLike | null = defaultStorage(),
): Settings => {
  const next = { ...loadSettings(storage), ...patch };
  saveSettings(next, storage);
  return next;
};
