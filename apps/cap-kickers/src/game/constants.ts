import { type PhysicsConfig } from "./physics/world";
import { type Pitch } from "./rules/pitch";
import { type MatchConfig } from "./rules/match";
import { type SwipeOpts } from "./input-mapping";

// Landscape pitch, ~1.6:1. Goal mouth is the middle 220 of the 620-tall end lines.
export const PITCH: Pitch = { width: 1000, height: 620, goalWidth: 220 };
export const CAP_RADIUS = 16;
export const KEEPER = { radius: CAP_RADIUS * 1.4, mass: 40, inset: 6 };

export const PHYSICS: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  // Bounds far larger than the pitch: engine walls never fire; rules own boundaries.
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

export const MATCH: MatchConfig = { goalsToWin: 3 };

// Swipe feel — tune by playing. power multiplies swipe length (pitch units).
export const SWIPE: SwipeOpts = { power: 5, maxSpeed: 2600, minSpeed: 120 };
