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

/** A timestamped finger position in PITCH coordinates (t in ms, perf clock). */
export type FlickSample = { pos: Vec2; t: number };
export type FlickOpts = { maxSpeed: number; minSpeed: number; gain: number; windowMs: number };

/**
 * Map a real finger flick to a launch velocity from the finger's RELEASE speed,
 * not the total drag distance. Given the gesture's timestamped positions, it
 * measures the finger's velocity over the last `windowMs` of travel: a quick,
 * snappy flick launches the cap fast and far; a slow, smooth drag barely nudges
 * it. Direction is that recent travel direction, scaled by `gain` and clamped to
 * [0, maxSpeed]. Returns null when the flick is too soft (release speed below
 * `minSpeed`) or there isn't enough motion to measure — i.e. no launch.
 */
export const flickToVelocity = (samples: FlickSample[], opts: FlickOpts): Vec2 | null => {
  if (samples.length < 2) return null;
  const last = samples[samples.length - 1];

  // Earliest sample still within the release window; always keep at least the
  // final pair so a brief flick with sparse samples still yields a delta.
  let firstIdx = samples.length - 1;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (last.t - samples[i].t <= opts.windowMs) firstIdx = i;
    else break;
  }
  if (firstIdx === samples.length - 1) firstIdx = samples.length - 2;
  const first = samples[firstIdx];

  const dtSec = (last.t - first.t) / 1000;
  if (dtSec <= 0) return null;
  const dx = last.pos.x - first.pos.x;
  const dy = last.pos.y - first.pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return null;

  const speed = (dist / dtSec) * opts.gain;
  if (speed < opts.minSpeed) return null; // too soft — treat as no flick
  const clamped = Math.min(speed, opts.maxSpeed);
  return { x: (dx / dist) * clamped, y: (dy / dist) * clamped };
};
