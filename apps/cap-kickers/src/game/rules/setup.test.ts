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

  it("sets up on the correct side (near own goal, apex up-field)", () => {
    const side0 = makeTriangle(pitch, 0, R); // own goal left -> near left, apex to the right
    expect(side0[0].x).toBeLessThan(pitch.width / 2);
    expect(side0[2].x).toBeGreaterThan(side0[0].x); // apex further up-field (right)

    const side1 = makeTriangle(pitch, 1, R); // own goal right -> near right, apex to the left
    expect(side1[0].x).toBeGreaterThan(pitch.width / 2);
    expect(side1[2].x).toBeLessThan(side1[0].x); // apex further up-field (left)
  });
});
