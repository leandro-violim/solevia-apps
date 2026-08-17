import { describe, it, expect } from "vitest";
import { simulateFlick, type SimCap } from "./simulate";
import { type Pitch } from "../rules/pitch";
import { type PhysicsConfig } from "../physics/world";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 }; // mouth y in [150,350]
const physics: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

const caps = (): SimCap[] => [
  { id: "f", position: { x: 100, y: 250 }, radius: 8 },
  { id: "a", position: { x: 150, y: 210 }, radius: 8 },
  { id: "b", position: { x: 150, y: 290 }, radius: 8 },
];

describe("simulateFlick", () => {
  it("predicts a gate-threading flick that rests in-bounds", () => {
    const out = simulateFlick(caps(), pitch, physics, "f", { x: 300, y: 0 });
    expect(out.result.crossedGate).toBe(true);
    expect(out.result.flickedEnding).toBe("rest");
    expect(out.result.anyCapLeftPitch).toBe(false);
  });

  it("predicts a shot into the right goal", () => {
    const shot: SimCap[] = [
      { id: "f", position: { x: 700, y: 250 }, radius: 8 },
      { id: "a", position: { x: 300, y: 210 }, radius: 8 },
      { id: "b", position: { x: 300, y: 290 }, radius: 8 },
    ];
    const out = simulateFlick(shot, pitch, physics, "f", { x: 3000, y: 0 });
    expect(out.result.flickedEnding).toBe("goalRight");
  });

  it("does not mutate the input caps and is deterministic", () => {
    const input = caps();
    const snapshot = JSON.parse(JSON.stringify(input));
    const a = simulateFlick(input, pitch, physics, "f", { x: 300, y: 0 });
    const b = simulateFlick(input, pitch, physics, "f", { x: 300, y: 0 });
    expect(input).toEqual(snapshot); // unmutated
    expect(a).toEqual(b); // deterministic
  });
});
