import { describe, it, expect } from "vitest";
import { capAtPoint, swipeToVelocity } from "./input-mapping";
import { vec, len } from "./physics/vec";

const caps = [
  { id: "a", position: vec(100, 100), radius: 16 },
  { id: "b", position: vec(200, 100), radius: 16 },
];

describe("capAtPoint", () => {
  it("returns the cap whose circle contains the point", () => {
    expect(capAtPoint(vec(105, 100), caps)).toBe("a");
    expect(capAtPoint(vec(200, 108), caps)).toBe("b");
  });
  it("returns null when no cap contains the point", () => {
    expect(capAtPoint(vec(150, 100), caps)).toBeNull();
  });
  it("picks the nearest center when circles overlap the point", () => {
    const tight = [
      { id: "a", position: vec(100, 100), radius: 40 },
      { id: "b", position: vec(130, 100), radius: 40 },
    ];
    expect(capAtPoint(vec(122, 100), tight)).toBe("b"); // 8 from b, 22 from a
  });
});

describe("swipeToVelocity", () => {
  const opts = { power: 5, maxSpeed: 2400, minSpeed: 100 };
  it("points in the swipe direction", () => {
    const v = swipeToVelocity(vec(0, 0), vec(10, 0), opts);
    expect(v.y).toBe(0);
    expect(v.x).toBeGreaterThan(0);
  });
  it("scales magnitude with swipe length, clamped to maxSpeed", () => {
    const small = len(swipeToVelocity(vec(0, 0), vec(40, 0), opts)); // 40*5=200
    expect(small).toBeCloseTo(200, 4);
    const big = len(swipeToVelocity(vec(0, 0), vec(1000, 0), opts)); // 5000 -> clamped
    expect(big).toBeCloseTo(2400, 4);
  });
  it("floors a tiny non-zero swipe to minSpeed", () => {
    const v = len(swipeToVelocity(vec(0, 0), vec(2, 0), opts)); // 2*5=10 -> min 100
    expect(v).toBeCloseTo(100, 4);
  });
  it("returns zero for a zero-length swipe", () => {
    expect(swipeToVelocity(vec(5, 5), vec(5, 5), opts)).toEqual({ x: 0, y: 0 });
  });
});
