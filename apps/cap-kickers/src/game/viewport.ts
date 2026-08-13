import { type Vec2 } from "./physics/vec";

export type Size = { width: number; height: number };
export type Viewport = { scale: number; offsetX: number; offsetY: number };

/** Uniform letterbox fit of the pitch inside the canvas, centered. */
export const computeViewport = (pitch: Size, canvas: Size): Viewport => {
  const scale = Math.min(canvas.width / pitch.width, canvas.height / pitch.height);
  const offsetX = (canvas.width - pitch.width * scale) / 2;
  const offsetY = (canvas.height - pitch.height * scale) / 2;
  return { scale, offsetX, offsetY };
};

export const pitchToCanvas = (p: Vec2, vp: Viewport): Vec2 => ({
  x: vp.offsetX + p.x * vp.scale,
  y: vp.offsetY + p.y * vp.scale,
});

export const canvasToPitch = (p: Vec2, vp: Viewport): Vec2 => ({
  x: (p.x - vp.offsetX) / vp.scale,
  y: (p.y - vp.offsetY) / vp.scale,
});
