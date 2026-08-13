import { type Body } from "../physics/world";

export type PlayerSide = 0 | 1;
export type GoalSide = "left" | "right";
export type CapZone = "in" | "out" | "goalLeft" | "goalRight";

export type Pitch = {
  width: number;
  height: number;
  goalWidth: number; // vertical extent of each goal mouth, centered on height/2
};

// Player 0 defends the left goal and attacks the right; player 1 is mirrored.
export const attackingGoal = (side: PlayerSide): GoalSide => (side === 0 ? "right" : "left");
export const defendingGoal = (side: PlayerSide): GoalSide => (side === 0 ? "left" : "right");
export const goalZone = (side: GoalSide): CapZone => (side === "left" ? "goalLeft" : "goalRight");

const inGoalMouth = (y: number, pitch: Pitch): boolean => {
  const half = pitch.goalWidth / 2;
  const mid = pitch.height / 2;
  return y >= mid - half && y <= mid + half;
};

/**
 * Classify a cap by its CENTER against the pitch rectangle [0,width]×[0,height].
 * Crossing an end line (x≤0 or x≥width) within the goal mouth → goalLeft/goalRight;
 * crossing any other boundary → out; otherwise in.
 */
export const classifyCap = (body: Body, pitch: Pitch): CapZone => {
  const { x, y } = body.position;
  if (x <= 0) return inGoalMouth(y, pitch) ? "goalLeft" : "out";
  if (x >= pitch.width) return inGoalMouth(y, pitch) ? "goalRight" : "out";
  if (y <= 0 || y >= pitch.height) return "out";
  return "in";
};
