import { type Vec2, vec } from "../physics/vec";
import { type Pitch, type PlayerSide } from "./pitch";

/**
 * Three caps in a straight vertical line just in front of `side`'s OWN goal,
 * spaced evenly around the pitch mid-line. Flicking the middle cap up-field is
 * an easy, legal opening move (it starts on the gate between the outer two).
 */
export const makeTriangle = (pitch: Pitch, side: PlayerSide, capRadius: number): [Vec2, Vec2, Vec2] => {
  const margin = capRadius * 4.5; // distance from the goal line
  const spread = capRadius * 3.4; // vertical gap between adjacent caps on the line
  const mid = pitch.height / 2;

  const lineX = side === 0 ? margin : pitch.width - margin;

  return [vec(lineX, mid - spread), vec(lineX, mid), vec(lineX, mid + spread)];
};
