import { describe, it, expect } from "vitest";
import { hasSeenTutorial, markTutorialSeen, type StorageLike } from "./storage";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("tutorial storage", () => {
  it("reports unseen until marked, then seen", () => {
    const s = fakeStorage();
    expect(hasSeenTutorial(s)).toBe(false);
    markTutorialSeen(s);
    expect(hasSeenTutorial(s)).toBe(true);
  });

  it("is safe with null storage", () => {
    expect(hasSeenTutorial(null)).toBe(false);
    expect(() => markTutorialSeen(null)).not.toThrow();
  });
});
