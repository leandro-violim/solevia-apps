import { describe, it, expect } from "vitest";
import { computeViewport, pitchToCanvas, canvasToPitch } from "./viewport";
import { vec } from "./physics/vec";

describe("viewport", () => {
  it("letterboxes with a uniform scale and centers the pitch", () => {
    // pitch 1000x500 into canvas 1200x500: scale limited by height (500/500=1)
    // vs width (1200/1000=1.2) -> scale 1, horizontal padding (1200-1000)/2=100.
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 1200, height: 500 });
    expect(vp.scale).toBe(1);
    expect(vp.offsetX).toBe(100);
    expect(vp.offsetY).toBe(0);
  });

  it("scales down to fit a smaller canvas", () => {
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 500, height: 500 });
    expect(vp.scale).toBe(0.5); // width-limited
    expect(vp.offsetY).toBe(125); // (500 - 500*0.5)/2
  });

  it("round-trips pitch -> canvas -> pitch", () => {
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 1200, height: 800 });
    const p = vec(321, 111);
    const back = canvasToPitch(pitchToCanvas(p, vp), vp);
    expect(back.x).toBeCloseTo(321, 6);
    expect(back.y).toBeCloseTo(111, 6);
  });

  it("maps pitch origin to the top-left of the letterboxed area", () => {
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 1200, height: 500 });
    expect(pitchToCanvas(vec(0, 0), vp)).toEqual({ x: 100, y: 0 });
  });
});
