import { describe, it, expect } from "vitest";
import {
  LEVELS,
  initialProgress,
  isUnlocked,
  isCompleted,
  completeLevel,
  nextLevelId,
  levelById,
} from "./ladder";

describe("campaign ladder", () => {
  it("has an ordered ladder with rising difficulty", () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(6);
    expect(LEVELS[0].difficulty).toBe("easy");
    expect(LEVELS[LEVELS.length - 1].difficulty).toBe("hard");
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length); // unique ids
  });

  it("unlocks only the first level initially", () => {
    const p = initialProgress();
    expect(isUnlocked(LEVELS[0].id, p)).toBe(true);
    expect(isUnlocked(LEVELS[1].id, p)).toBe(false);
    expect(isUnlocked("nope", p)).toBe(false);
  });

  it("completing a level unlocks the next and is idempotent", () => {
    let p = initialProgress();
    p = completeLevel(LEVELS[0].id, p);
    expect(isCompleted(LEVELS[0].id, p)).toBe(true);
    expect(isUnlocked(LEVELS[1].id, p)).toBe(true);
    const again = completeLevel(LEVELS[0].id, p);
    expect(again.completed).toEqual(p.completed); // no duplicate
    expect(completeLevel("nope", p)).toEqual(p); // unknown id unchanged
  });

  it("nextLevelId walks the ladder and ends at null", () => {
    expect(nextLevelId(LEVELS[0].id)).toBe(LEVELS[1].id);
    expect(nextLevelId(LEVELS[LEVELS.length - 1].id)).toBeNull();
    expect(nextLevelId("nope")).toBeNull();
  });

  it("levelById resolves known ids", () => {
    expect(levelById(LEVELS[2].id)?.id).toBe(LEVELS[2].id);
    expect(levelById("nope")).toBeUndefined();
  });
});
