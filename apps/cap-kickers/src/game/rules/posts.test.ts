import { describe, it, expect } from "vitest";
import { simulateFlick } from "../ai/simulate";
import { PITCH, PHYSICS, CAP_RADIUS } from "../constants";

// Right goal: mouth y in [200, 420] (mid 310, half 110); posts at (1000,200)/(1000,420).
const others = [
  { id: "c1", position: { x: 500, y: 60 }, radius: CAP_RADIUS }, // parked out of the way
  { id: "c2", position: { x: 500, y: 560 }, radius: CAP_RADIUS },
];
const shoot = (from: { x: number; y: number }, vx: number, vy = 0) =>
  simulateFlick(
    [{ id: "c0", position: from, radius: CAP_RADIUS }, ...others],
    PITCH,
    PHYSICS,
    "c0",
    { x: vx, y: vy },
    { dt: 1 / 120, maxSteps: 2000 },
  );

describe("goal posts as obstacles", () => {
  it("a shot straight into a post does NOT score — it bounces off", () => {
    const out = shoot({ x: 900, y: 200 }, 2200); // aimed dead at the top post
    expect(out.result.flickedEnding).not.toBe("goalRight");
  });

  it("a shot through the middle of the mouth still scores", () => {
    const out = shoot({ x: 900, y: 310 }, 2200); // clean through the centre
    expect(out.result.flickedEnding).toBe("goalRight");
  });

  it("the post bounces the cap back toward the pitch (doesn't pass through)", () => {
    const out = shoot({ x: 900, y: 200 }, 2200);
    const c0 = out.caps.find((c) => c.id === "c0")!;
    // After hitting the post it must not end up beyond the goal line.
    expect(c0.position.x).toBeLessThan(PITCH.width + CAP_RADIUS);
  });
});
