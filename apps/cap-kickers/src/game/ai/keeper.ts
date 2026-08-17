import { type Difficulty } from "./policy";

export type KeeperParams = { maxSpeed: number; reactionDelay: number };

// Feel-tunable. Hard = fast + near-instant; Easy = slow + laggy.
export const KEEPER_DIFFS: Record<Difficulty, KeeperParams> = {
  easy: { maxSpeed: 320, reactionDelay: 0.32 },
  normal: { maxSpeed: 560, reactionDelay: 0.18 },
  hard: { maxSpeed: 920, reactionDelay: 0.06 },
};

const TRACK_GAIN = 9; // proportional gain (1/s); high enough to reach maxSpeed quickly

/** Velocity in y toward `toY`, clamped to ±maxSpeed; 0 when aligned. Pure. */
export const keeperTrackVelocityY = (fromY: number, toY: number, maxSpeed: number): number => {
  const v = (toY - fromY) * TRACK_GAIN;
  if (v > maxSpeed) return maxSpeed;
  if (v < -maxSpeed) return -maxSpeed;
  return v;
};
