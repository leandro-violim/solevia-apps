import { describe, it, expect } from "vitest";
import { loadSettings, saveSettings, patchSettings, DEFAULT_SETTINGS, type StorageLike } from "./storage";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("settings storage", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips saved settings", () => {
    const s = fakeStorage();
    saveSettings({ sound: false, music: true, vibration: false, analytics: false }, s);
    expect(loadSettings(s)).toEqual({
      sound: false,
      music: true,
      vibration: false,
      analytics: false,
    });
  });

  it("patch merges over stored values and returns the new state", () => {
    const s = fakeStorage();
    saveSettings({ sound: true, music: true, vibration: true, analytics: true }, s);
    const next = patchSettings({ music: false }, s);
    expect(next).toEqual({ sound: true, music: false, vibration: true, analytics: true });
    expect(loadSettings(s)).toEqual(next);
  });

  it("fills missing/invalid fields from defaults", () => {
    const s = fakeStorage();
    s.setItem("capkickers.settings.v1", JSON.stringify({ sound: "yes" }));
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });

  it("defaults analytics to on, and keeps an explicit opt-out across a patch", () => {
    expect(DEFAULT_SETTINGS.analytics).toBe(true);
    const s = fakeStorage();
    // A build from before the analytics setting existed: the field is absent.
    s.setItem("capkickers.settings.v1", JSON.stringify({ sound: false, music: true, vibration: true }));
    expect(loadSettings(s).analytics).toBe(true);

    const off = patchSettings({ analytics: false }, s);
    expect(off.analytics).toBe(false);
    expect(patchSettings({ music: false }, s).analytics).toBe(false);
  });

  it("is safe with null storage or corrupt JSON", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    const s = fakeStorage();
    s.setItem("capkickers.settings.v1", "{not json");
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });
});
