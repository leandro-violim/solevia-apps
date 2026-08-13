import { describe, it, expect } from "vitest";
import { resolveFlick } from "./flick";
import { PhysicsWorld, type PhysicsConfig, type Body } from "../physics/world";
import { type Pitch } from "./pitch";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 }; // mouth y in [150,350]

// Physics bounds MUCH larger than the pitch so the engine walls never fire and
// never mask a cap leaving the field — the rules layer owns boundary logic.
const cfg = (): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.5,
  restEpsilon: 1,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
});

const cap = (id: string, x: number, y: number): Body => ({
  id,
  position: { x, y },
  velocity: { x: 0, y: 0 },
  radius: 8,
  mass: 1,
});

// A world with the flicked cap plus two "gate" caps at the given y positions.
const world = (flickPos: { x: number; y: number }, gateY: [number, number], gateX = 150) => {
  const w = new PhysicsWorld(cfg());
  w.addBody(cap("f", flickPos.x, flickPos.y));
  w.addBody(cap("a", gateX, gateY[0]));
  w.addBody(cap("b", gateX, gateY[1]));
  return w;
};

describe("resolveFlick", () => {
  it("reports crossedGate=true when the cap threads between the other two, ending at rest", () => {
    const w = world({ x: 100, y: 250 }, [210, 290]); // wide gap around y=250 at x=150
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 300, y: 0 });
    expect(r.crossedGate).toBe(true);
    expect(r.flickedEnding).toBe("rest");
    expect(r.anyCapLeftPitch).toBe(false);
  });

  it("reports crossedGate=false when the cap misses the gap", () => {
    // gate entirely above the y=250 path -> the flicked cap passes below it
    const w = world({ x: 100, y: 250 }, [300, 360]);
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 300, y: 0 });
    expect(r.crossedGate).toBe(false);
    expect(r.flickedEnding).toBe("rest");
  });

  it("ends 'out' when a cap leaves the pitch over a sideline", () => {
    const w = world({ x: 400, y: 250 }, [210, 290], 200);
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 0, y: -3000 }); // slam toward y=0
    expect(r.flickedEnding).toBe("out");
    expect(r.anyCapLeftPitch).toBe(true);
  });

  it("ends 'goalRight' when the flicked cap enters the right goal mouth", () => {
    const w = world({ x: 700, y: 250 }, [210, 290]);
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 3000, y: 0 }); // into x=800 at y=250
    expect(r.flickedEnding).toBe("goalRight");
    expect(r.anyCapLeftPitch).toBe(true);
  });

  it("is deterministic for identical setups", () => {
    const make = () => resolveFlick(world({ x: 100, y: 250 }, [210, 290]), pitch, "f", ["a", "b"], { x: 300, y: 0 });
    expect(make()).toEqual(make());
  });

  it("attributes the ending to the FLICKED cap, not a teammate it pushes into a goal", () => {
    // "a" sits just inside the right goal line, in the mouth [150,350]. "f" hits
    // it head-on, knocking "a" over the line while "f" stops short in-bounds.
    // The flicked cap's own ending must be "rest" even though a cap scored.
    const w = new PhysicsWorld(cfg());
    w.addBody(cap("f", 750, 250));
    w.addBody(cap("a", 790, 250));
    w.addBody(cap("b", 150, 250));
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 250, y: 0 });
    expect(r.flickedEnding).toBe("rest");
    expect(r.anyCapLeftPitch).toBe(true);
  });
});
