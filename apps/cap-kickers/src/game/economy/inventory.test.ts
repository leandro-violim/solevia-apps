import { describe, it, expect } from "vitest";
import { loadOwned, isOwned, unlock, type StorageLike } from "./inventory";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("inventory", () => {
  it("starts empty and records unlocks", () => {
    const s = fakeStorage();
    expect(loadOwned(s)).toEqual([]);
    expect(isOwned("night-stadium", s)).toBe(false);
    unlock("night-stadium", s);
    expect(isOwned("night-stadium", s)).toBe(true);
    expect(loadOwned(s)).toEqual(["night-stadium"]);
  });

  it("unlock is idempotent (no duplicates)", () => {
    const s = fakeStorage();
    unlock("cap-metal-red", s);
    unlock("cap-metal-red", s);
    expect(loadOwned(s)).toEqual(["cap-metal-red"]);
  });

  it("ignores an empty id", () => {
    const s = fakeStorage();
    unlock("", s);
    expect(loadOwned(s)).toEqual([]);
  });

  it("is safe with null storage, corrupt JSON, and non-string entries", () => {
    expect(loadOwned(null)).toEqual([]);
    const s = fakeStorage();
    s.setItem("capkickers.inventory.v1", "{not json");
    expect(loadOwned(s)).toEqual([]);
    s.setItem("capkickers.inventory.v1", JSON.stringify({ owned: ["a", 3, null, "a", "b"] }));
    expect(loadOwned(s).sort()).toEqual(["a", "b"]);
  });
});
