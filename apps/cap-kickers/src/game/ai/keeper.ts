import { type Difficulty } from "./policy";

export type KeeperParams = { maxSpeed: number; reactionDelay: number };

// Feel-tunable. Hard = fast + near-instant; Easy = slow + laggy.
export const KEEPER_DIFFS: Record<Difficulty, KeeperParams> = {
  easy: { maxSpeed: 320, reactionDelay: 0.32 },
  normal: { maxSpeed: 560, reactionDelay: 0.18 },
  hard: { maxSpeed: 920, reactionDelay: 0.06 },
};

// The near-perfect keeper on the OPTIONAL early shot (touch 4): reacts instantly
// and moves faster than any shot can be aimed away from, so only a superb corner
// gets past. This is what makes the early shot a real gamble (REWARDS/rules).
export const ELITE_KEEPER: KeeperParams = { maxSpeed: 1600, reactionDelay: 0 };

const TRACK_GAIN = 9; // proportional gain (1/s); high enough to reach maxSpeed quickly

/** Velocity in y toward `toY`, clamped to ±maxSpeed; 0 when aligned. Pure. */
export const keeperTrackVelocityY = (fromY: number, toY: number, maxSpeed: number): number => {
  const v = (toY - fromY) * TRACK_GAIN;
  if (v > maxSpeed) return maxSpeed;
  if (v < -maxSpeed) return -maxSpeed;
  return v;
};
