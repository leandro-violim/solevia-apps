import { type Vec2 } from "./physics/vec";
import {
  type Size,
  type Viewport,
  computeViewport,
  pitchToCanvas,
  canvasToPitch,
} from "./viewport";
import { type Pitch } from "./rules/pitch";

export type Presentation = {
  pitch: Pitch;
  viewport: Viewport;
  flipped: boolean; // 180° rotation about the pitch center (Player 2's turn)
};

export const makePresentation = (pitch: Pitch, canvas: Size, flipped: boolean): Presentation => ({
  pitch,
  viewport: computeViewport(pitch, canvas),
  flipped,
});

// Rotate a pitch point 180° about the pitch center.
const reflect = (p: Vec2, pitch: Pitch): Vec2 => ({ x: pitch.width - p.x, y: pitch.height - p.y });

export const pitchToScreen = (p: Vec2, pres: Presentation): Vec2 =>
  pitchToCanvas(pres.flipped ? reflect(p, pres.pitch) : p, pres.viewport);

export const screenToPitch = (s: Vec2, pres: Presentation): Vec2 => {
  const p = canvasToPitch(s, pres.viewport);
  return pres.flipped ? reflect(p, pres.pitch) : p;
};
