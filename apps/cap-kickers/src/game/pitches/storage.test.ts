import { describe, it, expect } from "vitest";
import { loadPitchStyleId, savePitchStyleId, type StorageLike } from "./storage";
import { DEFAULT_PITCH_STYLE, PITCH_STYLES } from "./styles";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("pitch storage", () => {
  it("defaults when nothing is stored", () => {
    expect(loadPitchStyleId(fakeStorage())).toBe(DEFAULT_PITCH_STYLE);
  });

  it("round-trips a known style id", () => {
    const s = fakeStorage();
    const id = PITCH_STYLES[2].id;
    savePitchStyleId(id, s);
    expect(loadPitchStyleId(s)).toBe(id);
  });

  it("ignores an unknown stored id", () => {
    const s = fakeStorage();
    savePitchStyleId("does-not-exist", s);
    expect(loadPitchStyleId(s)).toBe(DEFAULT_PITCH_STYLE);
  });

  it("is safe with null storage", () => {
    expect(loadPitchStyleId(null)).toBe(DEFAULT_PITCH_STYLE);
    expect(() => savePitchStyleId("grass", null)).not.toThrow();
  });
});
