import { type Vec2 } from "../physics/vec";
import { PhysicsWorld } from "../physics/world";
import { segmentsIntersect } from "./geometry";
import { type Pitch, classifyCap } from "./pitch";
import { type FlickResult, type FlickEnding } from "./flick";

/**
 * Step-wise accumulator for a single flick. Construct it (capturing the gate),
 * then call `observe()` once after every `world.step(dt)`. It latches whether the
 * flicked cap crossed the gate and whether any cap left the pitch, and returns the
 * FlickResult when the flick ends (the flicked cap leaves the pitch, or the world
 * comes to rest) — otherwise null.
 */
export class FlickTracker {
  private crossedGate = false;
  private anyCapLeftPitch = false;
  private prev: Vec2;

  constructor(
    private readonly world: PhysicsWorld,
    private readonly pitch: Pitch,
    private readonly flickedId: string,
    private readonly gateA: Vec2,
    private readonly gateB: Vec2,
    private readonly capIds?: string[],
  ) {
    const f = world.getBody(flickedId);
    if (!f) throw new Error("FlickTracker: unknown flicked cap id");
    this.prev = { x: f.position.x, y: f.position.y };
  }

  private classifiedBodies() {
    if (!this.capIds) return this.world.bodies;
    return this.world.bodies.filter((b) => this.capIds!.includes(b.id));
  }

  observe(): FlickResult | null {
    const flicked = this.world.getBody(this.flickedId)!;
    const cur: Vec2 = { x: flicked.position.x, y: flicked.position.y };
    if (!this.crossedGate && segmentsIntersect(this.prev, cur, this.gateA, this.gateB)) {
      this.crossedGate = true;
    }
    this.prev = cur;

    const caps = this.classifiedBodies();
    let flickedEnding: FlickEnding | null = null;
    for (const b of caps) {
      const zone = classifyCap(b, this.pitch);
      if (zone !== "in") {
        this.anyCapLeftPitch = true;
        if (b.id === this.flickedId) flickedEnding = zone;
      }
    }

    if (flickedEnding) {
      return { crossedGate: this.crossedGate, flickedEnding, anyCapLeftPitch: this.anyCapLeftPitch };
    }
    // "At rest" = the CAPS have stopped (ignore a still-moving keeper).
    const capsAtRest = caps.every((b) => b.velocity.x === 0 && b.velocity.y === 0);
    if (capsAtRest) {
      return { crossedGate: this.crossedGate, flickedEnding: "rest", anyCapLeftPitch: this.anyCapLeftPitch };
    }
    return null;
  }

  snapshot(): { crossedGate: boolean; anyCapLeftPitch: boolean } {
    return { crossedGate: this.crossedGate, anyCapLeftPitch: this.anyCapLeftPitch };
  }
}
