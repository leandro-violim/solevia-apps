import { describe, it, expect } from "vitest";
import { chooseAiFlick, type AiContext } from "./policy";
import { simulateFlick, type SimCap } from "./simulate";
import { type PhysicsConfig } from "../physics/world";
import { type Pitch } from "../rules/pitch";

const pitch: Pitch = { width: 1000, height: 620, goalWidth: 220 };
const physics: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

// side 0 attacks the RIGHT goal. A triangle in front of the left goal.
const triangle = (): SimCap[] => [
  { id: "c0", position: { x: 64, y: 262 }, radius: 16 },
  { id: "c1", position: { x: 64, y: 358 }, radius: 16 },
  { id: "c2", position: { x: 128, y: 310 }, radius: 16 },
];

const ctx = (over: Partial<AiContext> = {}): AiContext => ({
  pitch,
  physics,
  attacker: 0,
  touch: 1,
  shotTouch: 5,
  difficulty: "hard",
  maxSpeed: 2600,
  ...over,
});

const goalX = pitch.width; // side 0 attacks right
const goalCenter = { x: goalX, y: pitch.height / 2 };
const d = (p: { x: number; y: number }) => Math.hypot(p.x - goalCenter.x, p.y - goalCenter.y);

describe("chooseAiFlick", () => {
  it("returns a legal build-up flick that advances toward the target goal", () => {
    const caps = triangle();
    const move = chooseAiFlick(caps, ctx({ touch: 1 }));
    expect(move).not.toBeNull();
    const sim = simulateFlick(caps, pitch, physics, move!.capId, move!.velocity);
    // legal: threaded the gate, stayed in-bounds, came to rest
    expect(sim.result.crossedGate).toBe(true);
    expect(sim.result.flickedEnding).toBe("rest");
    expect(sim.result.anyCapLeftPitch).toBe(false);
    // advanced: the flicked cap ended closer to the goal than it started
    const before = caps.find((c) => c.id === move!.capId)!.position;
    const after = sim.caps.find((c) => c.id === move!.capId)!.position;
    expect(d(after)).toBeLessThan(d(before));
  });

  it("chooses a scoring shot on the shot touch when one is available", () => {
    // a cap near the right goal mouth with a clear shot
    const shotCaps: SimCap[] = [
      { id: "c0", position: { x: 860, y: 310 }, radius: 16 },
      { id: "c1", position: { x: 500, y: 200 }, radius: 16 },
      { id: "c2", position: { x: 500, y: 420 }, radius: 16 },
    ];
    const move = chooseAiFlick(shotCaps, ctx({ touch: 5 }));
    expect(move).not.toBeNull();
    const sim = simulateFlick(shotCaps, pitch, physics, move!.capId, move!.velocity);
    expect(sim.result.flickedEnding).toBe("goalRight");
  });

  it("is deterministic", () => {
    const caps = triangle();
    expect(chooseAiFlick(caps, ctx())).toEqual(chooseAiFlick(caps, ctx()));
  });
});
