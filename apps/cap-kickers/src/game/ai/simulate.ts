import { PhysicsWorld, type PhysicsConfig } from "../physics/world";
import { type Vec2 } from "../physics/vec";
import { type Pitch, goalPosts } from "../rules/pitch";
import { POST_RADIUS } from "../constants";
import { resolveFlick, type FlickResult, type ResolveOpts } from "../rules/flick";

export type SimCap = { id: string; position: Vec2; radius: number };
export type SimOutcome = {
  result: FlickResult;
  caps: { id: string; position: Vec2 }[];
};

/**
 * Simulate one flick on a throwaway world built from `caps`, using the SAME
 * physics config as the live game — because the engine is deterministic, the
 * outcome is an exact prediction. Does not mutate `caps`.
 */
export const simulateFlick = (
  caps: SimCap[],
  pitch: Pitch,
  physics: PhysicsConfig,
  flickedId: string,
  velocity: Vec2,
  opts: ResolveOpts = {},
): SimOutcome => {
  const world = new PhysicsWorld(physics);
  for (const c of caps) {
    world.addBody({
      id: c.id,
      position: { x: c.position.x, y: c.position.y },
      velocity: { x: 0, y: 0 },
      radius: c.radius,
      mass: 1,
    });
  }
  // Solid goal posts, matching the live world — so a predicted shot bounces off a
  // post exactly as it will in the real game (the AI won't aim through one).
  for (const p of goalPosts(pitch)) {
    world.addBody({ id: p.id, position: { x: p.x, y: p.y }, velocity: { x: 0, y: 0 }, radius: POST_RADIUS, mass: Infinity });
  }
  const otherIds = caps.filter((c) => c.id !== flickedId).map((c) => c.id);
  const result = resolveFlick(
    world,
    pitch,
    flickedId,
    [otherIds[0], otherIds[1]],
    velocity,
    opts,
  );
  const capIds = new Set(caps.map((c) => c.id));
  return {
    result,
    caps: world.bodies
      .filter((b) => capIds.has(b.id)) // exclude the static posts
      .map((b) => ({
        id: b.id,
        position: { x: b.position.x, y: b.position.y },
      })),
  };
};
