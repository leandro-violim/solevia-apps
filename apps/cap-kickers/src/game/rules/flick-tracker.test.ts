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

describe("FlickTracker cap-id filtering (keeper exclusion)", () => {
  it("ignores a non-cap body on the goal line for classification and rest", () => {
    const w = new PhysicsWorld({
      fixedDt: 1 / 120,
      friction: 3,
      restitution: 0.45,
      restEpsilon: 2,
      maxSubsteps: 16,
      bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
    });
    // flicked cap threads a wide gate and comes to rest in-bounds
    w.addBody({ id: "f", position: { x: 100, y: 250 }, velocity: { x: 0, y: 0 }, radius: 8, mass: 1 });
    w.addBody({ id: "a", position: { x: 150, y: 200 }, velocity: { x: 0, y: 0 }, radius: 8, mass: 1 });
    w.addBody({ id: "b", position: { x: 150, y: 300 }, velocity: { x: 0, y: 0 }, radius: 8, mass: 1 });
    // a "keeper" ON the right goal line (would classify as goalRight) that keeps moving
    const keeper: Body = {
      id: "keeper",
      position: { x: 800, y: 250 },
      velocity: { x: 0, y: 400 },
      radius: 8,
      mass: 40,
    };
    w.addBody(keeper);

    const tracker = new FlickTracker(
      w,
      pitch,
      "f",
      { x: 150, y: 200 },
      { x: 150, y: 300 },
      ["f", "a", "b"], // only the caps
    );
    w.getBody("f")!.velocity = { x: 300, y: 0 };

    let result = null;
    for (let i = 0; i < 1000 && !result; i++) {
      // keep the keeper drifting so world.atRest() would never fire if it counted
      w.getBody("keeper")!.velocity = { x: 0, y: 400 };
      w.step(1 / 60);
      result = tracker.observe();
    }
    expect(result).not.toBeNull();
    expect(result!.flickedEnding).toBe("rest"); // keeper's goal-line position ignored
    expect(result!.anyCapLeftPitch).toBe(false); // keeper leaving the mouth doesn't count
  });
});
