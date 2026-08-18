import { describe, it, expect } from "vitest";
import { makeTriangle } from "./setup";
import { type Pitch } from "./pitch";
import { dist } from "../physics/vec";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 };
const R = 12;

describe("makeTriangle", () => {
  it("places three caps strictly inside the pitch", () => {
    for (const side of [0, 1] as const) {
      for (const p of makeTriangle(pitch, side, R)) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(pitch.width);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(pitch.height);
      }
    }
  });

  it("keeps caps non-overlapping (pairwise gap > 2*radius)", () => {
    const caps = makeTriangle(pitch, 0, R);
    for (let i = 0; i < caps.length; i++) {
      for (let j = i + 1; j < caps.length; j++) {
        expect(dist(caps[i], caps[j])).toBeGreaterThan(2 * R);
      }
    }
  });

  it("sets up as a vertical line on the correct side (near own goal)", () => {
    const side0 = makeTriangle(pitch, 0, R); // own goal left -> line near the left
    expect(side0.every((c) => c.x < pitch.width / 2)).toBe(true);
    expect(side0[0].x).toBe(side0[1].x); // collinear (same x)
    expect(side0[1].x).toBe(side0[2].x);
    expect(side0[0].y).toBeLessThan(side0[1].y); // ordered top -> middle -> bottom
    expect(side0[1].y).toBeLessThan(side0[2].y);

    const side1 = makeTriangle(pitch, 1, R); // own goal right -> line near the right
    expect(side1.every((c) => c.x > pitch.width / 2)).toBe(true);
    expect(side1[0].x).toBe(side1[2].x); // collinear
  });
});
