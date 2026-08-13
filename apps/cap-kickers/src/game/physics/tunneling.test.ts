import { describe, it, expect } from "vitest";
import { PhysicsWorld, type PhysicsConfig, type Body } from "./world";

const cfg = (over: Partial<PhysicsConfig> = {}): PhysicsConfig => ({
  fixedDt: 1 / 60, // deliberately coarse — one step would overshoot the target
  friction: 0,
  restitution: 1,
  restEpsilon: 0.0001,
  maxSubsteps: 64,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
  ...over,
});

const body = (over: Partial<Body> = {}): Body => ({
  id: "a",
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
  ...over,
});

describe("anti-tunneling", () => {
  it("a very fast body collides with a target instead of passing through", () => {
    const w = new PhysicsWorld(cfg());
    // 10000 u/s * (1/60) ≈ 167u of travel in ONE fixed step — that overshoots
    // the target's FAR edge (x=120), so a naive end-of-step-only overlap check
    // would miss it entirely. Only mid-flight substepping catches the collision.
    w.addBody(body({ id: "fast", position: { x: 0, y: 0 }, velocity: { x: 10000, y: 0 } }));
    w.addBody(body({ id: "target", position: { x: 100, y: 0 }, velocity: { x: 0, y: 0 } }));
    w.step(1 / 60);
    const fast = w.getBody("fast")!;
    const target = w.getBody("target")!;
    expect(target.velocity.x).toBeGreaterThan(0); // momentum transferred
    expect(fast.position.x).toBeLessThan(120); // stopped at impact, did NOT tunnel past
  });

  it("substepping preserves determinism at high speed", () => {
    const make = () => {
      const w = new PhysicsWorld(cfg());
      w.addBody(body({ id: "fast", position: { x: 0, y: 0 }, velocity: { x: 10000, y: 0 } }));
      w.addBody(body({ id: "target", position: { x: 100, y: 0 }, velocity: { x: 0, y: 0 } }));
      return w;
    };
    const w1 = make();
    const w2 = make();
    for (let i = 0; i < 30; i++) {
      w1.step(1 / 60);
      w2.step(1 / 60);
    }
    expect(w1.getBody("target")!.position).toEqual(w2.getBody("target")!.position);
    expect(w1.getBody("fast")!.velocity).toEqual(w2.getBody("fast")!.velocity);
  });
});
