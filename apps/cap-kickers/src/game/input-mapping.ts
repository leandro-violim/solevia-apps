import { type Vec2, sub, len, scale } from "./physics/vec";

export type CapHit = { id: string; position: Vec2; radius: number };

/** Id of the cap whose circle contains `point`; nearest center wins ties; null if none. */
export const capAtPoint = (point: Vec2, caps: CapHit[]): string | null => {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of caps) {
    const d = len(sub(point, c.position));
    if (d <= c.radius && d < bestDist) {
      best = c.id;
      bestDist = d;
    }
  }
  return best;
};

export type SwipeOpts = { power: number; maxSpeed: number; minSpeed: number };

/**
 * Map a swipe (start→end, in PITCH coordinates) to a flick velocity: direction is
 * the swipe direction; speed is `|end-start| * power` clamped to [minSpeed, maxSpeed].
 * A zero-length swipe returns the zero vector.
 */
export const swipeToVelocity = (start: Vec2, end: Vec2, opts: SwipeOpts): Vec2 => {
  const delta = sub(end, start);
  const dLen = len(delta);
  if (dLen === 0) return { x: 0, y: 0 };
  const speed = Math.min(opts.maxSpeed, Math.max(opts.minSpeed, dLen * opts.power));
  return scale({ x: delta.x / dLen, y: delta.y / dLen }, speed);
};
