import { describe, it, expect } from "vitest";
import { FlickTracker } from "./flick-tracker";
import { PhysicsWorld, type PhysicsConfig, type Body } from "../physics/world";
import { type Pitch } from "./pitch";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 };
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

describe("FlickTracker", () => {
  it("returns null until the flick ends, then reports rest + crossedGate", () => {
    const w = new PhysicsWorld(cfg());
    const f = w.addBody(cap("f", 100, 250));
    w.addBody(cap("a", 150, 210));
    w.addBody(cap("b", 150, 290));
    const t = new FlickTracker(w, pitch, "f", { x: 150, y: 210 }, { x: 150, y: 290 });
    f.velocity = { x: 300, y: 0 };
    let result = null;
    for (let i = 0; i < 1000 && result === null; i++) {
      w.step(1 / 60);
      result = t.observe();
    }
    expect(result).not.toBeNull();
    expect(result!.crossedGate).toBe(true);
    expect(result!.flickedEnding).toBe("rest");
    expect(result!.anyCapLeftPitch).toBe(false);
  });

  it("reports the flicked cap's own goal ending", () => {
    const w = new PhysicsWorld(cfg());
    const f = w.addBody(cap("f", 700, 250));
    w.addBody(cap("a", 150, 210));
    w.addBody(cap("b", 150, 290));
    const t = new FlickTracker(w, pitch, "f", { x: 150, y: 210 }, { x: 150, y: 290 });
    f.velocity = { x: 3000, y: 0 };
    let result = null;
    for (let i = 0; i < 1000 && result === null; i++) {
      w.step(1 / 60);
      result = t.observe();
    }
    expect(result!.flickedEnding).toBe("goalRight");
  });
});
