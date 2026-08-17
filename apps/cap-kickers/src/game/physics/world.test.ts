import { describe, it, expect } from "vitest";
import { PhysicsWorld, type PhysicsConfig, type Body } from "./world";

const cfg = (over: Partial<PhysicsConfig> = {}): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 0,
  restitution: 1,
  restEpsilon: 1,
  maxSubsteps: 16,
  bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
  ...over,
});

const body = (over: Partial<Body> = {}): Body => ({
  id: "a",
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
  ...over,
});

describe("PhysicsWorld integration", () => {
  it("adds and retrieves bodies", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ id: "x" }));
    expect(w.getBody("x")?.id).toBe("x");
    expect(w.getBody("missing")).toBeUndefined();
  });

  it("moves a body by velocity * time with no friction", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ position: { x: 100, y: 100 }, velocity: { x: 100, y: 0 } }));
    w.step(1); // one full simulated second
    expect(w.getBody("a")!.position.x).toBeCloseTo(200, 5);
  });

  it("brings a moving body to rest under friction", () => {
    const w = new PhysicsWorld(cfg({ friction: 3, restEpsilon: 1 }));
    w.addBody(body({ position: { x: 0, y: 0 }, velocity: { x: 500, y: 0 } }));
    for (let i = 0; i < 600; i++) w.step(1 / 60);
    expect(w.getBody("a")!.velocity).toEqual({ x: 0, y: 0 });
    expect(w.atRest()).toBe(true);
  });

  it("is deterministic: identical inputs give identical output", () => {
    const make = () => {
      const w = new PhysicsWorld(cfg({ friction: 1 }));
      w.addBody(body({ position: { x: 0, y: 0 }, velocity: { x: 321, y: 123 } }));
      return w;
    };
    const w1 = make();
    const w2 = make();
    for (let i = 0; i < 100; i++) {
      w1.step(1 / 60);
      w2.step(1 / 60);
    }
    expect(w1.getBody("a")!.position).toEqual(w2.getBody("a")!.position);
    expect(w1.getBody("a")!.velocity).toEqual(w2.getBody("a")!.velocity);
  });
});

describe("PhysicsWorld.removeBody", () => {
  it("removes a body by id and is a no-op for an unknown id", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ id: "a" }));
    w.addBody(body({ id: "b" }));
    w.removeBody("a");
    expect(w.getBody("a")).toBeUndefined();
    expect(w.getBody("b")?.id).toBe("b");
    expect(w.bodies.length).toBe(1);
    w.removeBody("missing"); // no throw
    expect(w.bodies.length).toBe(1);
  });
});
