import { describe, it, expect } from "vitest";
import { vec, add, sub, scale, dot, len, dist, normalize } from "./vec";

describe("vec", () => {
  it("adds, subtracts, and scales", () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual({ x: 4, y: 6 });
    expect(sub(vec(5, 5), vec(1, 2))).toEqual({ x: 4, y: 3 });
    expect(scale(vec(2, -3), 2)).toEqual({ x: 4, y: -6 });
  });

  it("computes dot, length, and distance", () => {
    expect(dot(vec(1, 0), vec(0, 1))).toBe(0);
    expect(len(vec(3, 4))).toBe(5);
    expect(dist(vec(0, 0), vec(3, 4))).toBe(5);
  });

  it("normalizes, and returns zero vector for zero input", () => {
    expect(normalize(vec(0, 5))).toEqual({ x: 0, y: 1 });
    expect(normalize(vec(0, 0))).toEqual({ x: 0, y: 0 });
  });
});
