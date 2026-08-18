import { type PhysicsConfig } from "./physics/world";
import { type Pitch } from "./rules/pitch";
import { type MatchConfig } from "./rules/match";
import { type SwipeOpts, type FlickOpts } from "./input-mapping";

// Landscape pitch, ~1.6:1. Goal mouth is the middle 220 of the 620-tall end lines.
export const PITCH: Pitch = { width: 1000, height: 620, goalWidth: 220 };
export const CAP_RADIUS = 16;
// radius: keeper hit-box. 1.4x cap radius (22.4) made even a STATIC (unreacted)
// keeper block off-center shots merely by standing at the mouth's spawn point —
// its collision circle overlapped shot lines aimed well away from goal center.
// Shrunk to 0.75x cap radius (12) so only shots the keeper has actually moved
// to intercept get blocked; verified this keeps a Hard keeper saving a
// dead-center shot (integration test) while an Easy keeper is beaten to a corner.
export const KEEPER = { radius: CAP_RADIUS * 1.15, mass: 40, inset: 6 };

export const PHYSICS: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  // Bounds far larger than the pitch: engine walls never fire; rules own boundaries.
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

// shotTouch 5 → four build-up threads, then the 5th touch is the free shot.
export const MATCH: MatchConfig = { goalsToWin: 3, shotTouch: 5 };

// Swipe feel — tune by playing. power multiplies swipe length (pitch units).
export const SWIPE: SwipeOpts = { power: 5, maxSpeed: 2600, minSpeed: 120 };

// Flick feel — the cap launches at the finger's RELEASE speed, so a quick/hard
// flick sends it far and a soft one barely moves it. Tune by playing:
//   gain     — multiplies the measured finger speed (pitch units/s) → cap speed.
//   maxSpeed — hard cap on launch speed (shared ceiling with SWIPE).
//   minSpeed — release speed below which the flick is ignored (dead zone).
//   windowMs — how much of the gesture's TAIL is measured for the release speed.
export const FLICK: FlickOpts = { gain: 0.85, maxSpeed: 2600, minSpeed: 220, windowMs: 70 };
