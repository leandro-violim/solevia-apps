import { describe, it, expect } from "vitest";
import { loadProgress, saveProgress, type StorageLike } from "./storage";
import { initialProgress } from "./ladder";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("campaign storage", () => {
  it("round-trips progress", () => {
    const s = fakeStorage();
    saveProgress({ completed: ["l1", "l2"] }, s);
    expect(loadProgress(s)).toEqual({ completed: ["l1", "l2"] });
  });

  it("returns initial progress when nothing is stored", () => {
    expect(loadProgress(fakeStorage())).toEqual(initialProgress());
  });

  it("returns initial progress on corrupt data (no throw)", () => {
    const s = fakeStorage();
    s.map.set("capkickers.campaign.v1", "{not json");
    expect(loadProgress(s)).toEqual(initialProgress());
    s.map.set("capkickers.campaign.v1", JSON.stringify({ completed: [1, 2, 3] })); // wrong types
    expect(loadProgress(s)).toEqual(initialProgress());
  });

  it("is a no-op / safe when storage is null", () => {
    expect(loadProgress(null)).toEqual(initialProgress());
    expect(() => saveProgress({ completed: ["l1"] }, null)).not.toThrow();
  });
});
