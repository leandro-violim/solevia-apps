import { type Vec2, vec } from "../physics/vec";
import { type Pitch, type PlayerSide } from "./pitch";

/**
 * Three caps in a triangle just in front of `side`'s OWN goal: two base caps
 * near the goal line (spread vertically around the pitch mid-line) and an apex
 * cap up-field (toward the goal this side attacks).
 */
export const makeTriangle = (pitch: Pitch, side: PlayerSide, capRadius: number): [Vec2, Vec2, Vec2] => {
  const margin = capRadius * 4; // base distance from the goal line
  const spread = capRadius * 5.2; // wide base = big gate = easy first thread
  const depth = capRadius * 5.6; // apex distance up-field
  const mid = pitch.height / 2;

  const baseX = side === 0 ? margin : pitch.width - margin;
  const apexX = side === 0 ? margin + depth : pitch.width - margin - depth;

  return [vec(baseX, mid - spread), vec(baseX, mid + spread), vec(apexX, mid)];
};
