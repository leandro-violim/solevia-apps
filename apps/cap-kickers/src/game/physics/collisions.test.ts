import { describe, it, expect } from "vitest";
import { PhysicsWorld, type PhysicsConfig, type Body } from "./world";

const cfg = (over: Partial<PhysicsConfig> = {}): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 0,
  restitution: 0.5,
  restEpsilon: 0.0001,
  maxSubsteps: 16,
  bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
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

describe("wall collisions", () => {
  it("bounces a body off the right wall with restitution", () => {
    const w = new PhysicsWorld(cfg({ restitution: 0.5 }));
    w.addBody(body({ position: { x: 180, y: 100 }, velocity: { x: 100, y: 0 } }));
    for (let i = 0; i < 120; i++) w.step(1 / 120); // ~1s
    const a = w.getBody("a")!;
    expect(a.velocity.x).toBeLessThan(0); // now moving left
    expect(a.position.x + a.radius).toBeLessThanOrEqual(200 + 1e-6); // inside bounds
  });

  it("keeps a body within all four walls", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ position: { x: 20, y: 20 }, velocity: { x: -400, y: -400 } }));
    for (let i = 0; i < 240; i++) w.step(1 / 120);
    const a = w.getBody("a")!;
    expect(a.position.x - a.radius).toBeGreaterThanOrEqual(0 - 1e-6);
    expect(a.position.y - a.radius).toBeGreaterThanOrEqual(0 - 1e-6);
    expect(a.position.x + a.radius).toBeLessThanOrEqual(200 + 1e-6);
    expect(a.position.y + a.radius).toBeLessThanOrEqual(200 + 1e-6);
  });
});
