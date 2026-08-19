import { useCallback, useEffect, useState } from "react";

/** App version shown in Settings & About. Bump on each store submission. */
export const APP_VERSION = "1.0.0";

const SOUND_KEY = "bubble-sound-enabled-v1";

function readSound(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SOUND_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

/** Module-level cache so pop-sound can read without a hook. */
let cachedSound = true;
if (typeof window !== "undefined") {
  cachedSound = readSound();
}

export function isSoundEnabled(): boolean {
  return cachedSound;
}

export function useSoundSetting() {
  const [enabled, setEnabled] = useState<boolean>(() => cachedSound);

  useEffect(() => {
    const v = readSound();
    cachedSound = v;
    setEnabled(v);
  }, []);

  const toggle = useCallback((next: boolean) => {
    cachedSound = next;
    setEnabled(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  return { enabled, toggle };
}

// ── Vibration (haptics) ─────────────────────────────────────────────────────
const VIBE_KEY = "bubble-vibration-enabled-v1";

function readVibe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(VIBE_KEY);
    if (raw === null) return true; // default ON
    return raw === "1";
  } catch {
    return true;
  }
}

/** Module-level cache so haptics can read without a hook. */
let cachedVibe = true;
if (typeof window !== "undefined") {
  cachedVibe = readVibe();
}

export function isVibrationEnabled(): boolean {
  return cachedVibe;
}

export function useVibrationSetting() {
  const [enabled, setEnabled] = useState<boolean>(() => cachedVibe);

  useEffect(() => {
    const v = readVibe();
    cachedVibe = v;
    setEnabled(v);
  }, []);

  const toggle = useCallback((next: boolean) => {
    cachedVibe = next;
    setEnabled(next);
    try {
      window.localStorage.setItem(VIBE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  return { enabled, toggle };
}
