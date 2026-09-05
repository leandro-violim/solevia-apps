import { describe, it, expect } from "vitest";
import {
  LEVELS,
  initialProgress,
  isUnlocked,
  isCompleted,
  completeLevel,
  nextLevelId,
  levelById,
  levelReward,
  upcomingReward,
  missingRewardItems,
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

  it("upcomingReward finds the next UNOWNED prize after a level, skipping owned ones", () => {
    // Find the first two rewarding phases on the ladder.
    const rewarding = LEVELS.filter((l) => levelReward(l.id));
    expect(rewarding.length).toBeGreaterThanOrEqual(2);
    const first = rewarding[0];
    const second = rewarding[1];

    // From the very start, the next prize is the first rewarding phase's reward.
    const up = upcomingReward(LEVELS[0].id, []);
    expect(up?.level.id).toBe(first.id);

    // Owning that reward makes it skip to the next unowned one.
    const skipped = upcomingReward(LEVELS[0].id, [levelReward(first.id)!.itemId]);
    expect(skipped?.level.id).toBe(second.id);

    // Nothing left after the final phase.
    expect(upcomingReward(LEVELS[LEVELS.length - 1].id, [])).toBeNull();
    expect(upcomingReward("nope", [])).toBeNull();
  });

  it("missingRewardItems lists earned-but-unowned rewards for completed phases", () => {
    const rewarding = LEVELS.filter((l) => levelReward(l.id));
    const first = rewarding[0];
    const second = rewarding[1];
    // Cleared the first two rewarding phases, but owns neither reward yet.
    const missing = missingRewardItems([first.id, second.id], []);
    expect(missing).toContain(levelReward(first.id)!.itemId);
    expect(missing).toContain(levelReward(second.id)!.itemId);
    // Already owning the first reward drops it from the list.
    const after = missingRewardItems([first.id, second.id], [levelReward(first.id)!.itemId]);
    expect(after).not.toContain(levelReward(first.id)!.itemId);
    expect(after).toContain(levelReward(second.id)!.itemId);
    // No completed phases → nothing owed.
    expect(missingRewardItems([], [])).toEqual([]);
  });
});
