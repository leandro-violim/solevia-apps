import { type Vec2 } from "../physics/vec";
import { PhysicsWorld } from "../physics/world";
import { segmentsIntersect } from "./geometry";
import { type Pitch, classifyCap } from "./pitch";

export type FlickEnding = "rest" | "out" | "goalLeft" | "goalRight";

export type FlickResult = {
  crossedGate: boolean; // did the flicked cap pass between the other two?
  flickedEnding: FlickEnding; // how the FLICKED cap itself ended
  anyCapLeftPitch: boolean; // did ANY cap (incl. the flicked one) leave the pitch?
};

export type ResolveOpts = { dt?: number; maxSteps?: number };

/**
 * Apply `velocity` to the flicked cap, then simulate until the flicked cap
 * leaves the pitch or the world comes to rest. Reports whether the flicked cap
 * crossed the gate (segment between the other two caps at flick time), how the
 * FLICKED cap itself ended, and whether ANY cap left the pitch during the flick.
 * The physics world MUST have bounds far larger than the pitch (see Global
 * Constraints) so its walls never mask a cap leaving the field.
 */
export const resolveFlick = (
  world: PhysicsWorld,
  pitch: Pitch,
  flickedId: string,
  otherIds: [string, string],
  velocity: Vec2,
  opts: ResolveOpts = {},
): FlickResult => {
  const dt = opts.dt ?? 1 / 60;
  const maxSteps = opts.maxSteps ?? 1000;

  const flicked = world.getBody(flickedId);
  const otherA = world.getBody(otherIds[0]);
  const otherB = world.getBody(otherIds[1]);
  if (!flicked || !otherA || !otherB) {
    throw new Error("resolveFlick: unknown cap id");
  }

  // Gate = segment between the other two caps' centers, captured at flick time.
  const gateA: Vec2 = { x: otherA.position.x, y: otherA.position.y };
  const gateB: Vec2 = { x: otherB.position.x, y: otherB.position.y };

  flicked.velocity = { x: velocity.x, y: velocity.y };

  let crossedGate = false;
  let anyCapLeftPitch = false;
  let prev: Vec2 = { x: flicked.position.x, y: flicked.position.y };

  for (let step = 0; step < maxSteps; step++) {
    world.step(dt);

    // Gate crossing: test the flicked cap's most recent travel segment.
    const cur: Vec2 = { x: flicked.position.x, y: flicked.position.y };
    if (!crossedGate && segmentsIntersect(prev, cur, gateA, gateB)) {
      crossedGate = true;
    }
    prev = cur;

    // Any cap leaving the pitch (goal mouths count as leaving) sets the flag.
    if (!anyCapLeftPitch) {
      for (const b of world.bodies) {
        if (classifyCap(b, pitch) !== "in") {
          anyCapLeftPitch = true;
          break;
        }
      }
    }

    // The flicked cap's OWN fate decides the flick once it leaves the pitch.
    const flickedZone = classifyCap(flicked, pitch);
    if (flickedZone !== "in") {
      return { crossedGate, flickedEnding: flickedZone, anyCapLeftPitch: true };
    }

    if (world.atRest()) break;
  }

  return { crossedGate, flickedEnding: "rest", anyCapLeftPitch };
};
