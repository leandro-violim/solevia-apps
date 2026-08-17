import { describe, it, expect } from "vitest";
import { keeperTrackVelocityY, KEEPER_DIFFS } from "./keeper";

describe("keeperTrackVelocityY", () => {
  it("moves toward the target and is zero when aligned", () => {
    expect(keeperTrackVelocityY(100, 200, 1000)).toBeGreaterThan(0); // target below -> +y
    expect(keeperTrackVelocityY(200, 100, 1000)).toBeLessThan(0); // target above -> -y
    expect(keeperTrackVelocityY(150, 150, 1000)).toBe(0);
  });

  it("clamps to ±maxSpeed", () => {
    expect(keeperTrackVelocityY(0, 100000, 500)).toBe(500);
    expect(keeperTrackVelocityY(0, -100000, 500)).toBe(-500);
  });

  it("has harder difficulties faster and less laggy than easier ones", () => {
    expect(KEEPER_DIFFS.hard.maxSpeed).toBeGreaterThan(KEEPER_DIFFS.normal.maxSpeed);
    expect(KEEPER_DIFFS.normal.maxSpeed).toBeGreaterThan(KEEPER_DIFFS.easy.maxSpeed);
    expect(KEEPER_DIFFS.hard.reactionDelay).toBeLessThan(KEEPER_DIFFS.easy.reactionDelay);
  });
});
