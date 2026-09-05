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

/** The four goal-post centres — the two ends of each goal mouth, on the end lines.
 *  Callers add them to the physics world as immovable obstacles (radius/mass their
 *  own concern). Shared by the live session and the AI's prediction sim so both
 *  model the same solid posts. */
export const goalPosts = (pitch: Pitch): Array<{ id: string; x: number; y: number }> => {
  const mid = pitch.height / 2;
  const half = pitch.goalWidth / 2;
  return [
    { id: "post-lt", x: 0, y: mid - half },
    { id: "post-lb", x: 0, y: mid + half },
    { id: "post-rt", x: pitch.width, y: mid - half },
    { id: "post-rb", x: pitch.width, y: mid + half },
  ];
};

/**
 * Classify a cap against the pitch rectangle [0,width]×[0,height], by the WHOLE
 * cap — not just its center. A cap is only "out"/a goal once EVERY pixel of it has
 * cleared the line (its near edge is fully past): while any part still overlaps the
 * field it stays "in play". Fully past an end line within the goal mouth →
 * goalLeft/goalRight; fully past any other line → out; otherwise in.
 */
export const classifyCap = (body: Body, pitch: Pitch): CapZone => {
  const { x, y } = body.position;
  const r = body.radius;
  if (x + r <= 0) return inGoalMouth(y, pitch) ? "goalLeft" : "out"; // whole cap past the left line
  if (x - r >= pitch.width) return inGoalMouth(y, pitch) ? "goalRight" : "out"; // past the right line
  if (y + r <= 0 || y - r >= pitch.height) return "out"; // whole cap past a sideline
  return "in";
};
