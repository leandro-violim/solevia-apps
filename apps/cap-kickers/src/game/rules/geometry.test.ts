import { describe, it, expect } from "vitest";
import { segmentsIntersect } from "./geometry";
import { vec } from "../physics/vec";

describe("segmentsIntersect", () => {
  it("detects a clean X crossing", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 10), vec(0, 10), vec(10, 0))).toBe(true);
  });

  it("returns false for parallel non-touching segments", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 0), vec(0, 5), vec(10, 5))).toBe(false);
  });

  it("returns false for disjoint segments", () => {
    expect(segmentsIntersect(vec(0, 0), vec(1, 0), vec(5, 5), vec(6, 6))).toBe(false);
  });

  it("detects a shared endpoint (T-touch)", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 0), vec(10, 0), vec(10, 10))).toBe(true);
  });

  it("detects collinear overlap", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 0), vec(5, 0), vec(15, 0))).toBe(true);
  });

  it("detects a segment crossing a vertical gate", () => {
    // horizontal path at y=5 crossing a vertical gate x=5 from y=0..10
    expect(segmentsIntersect(vec(0, 5), vec(10, 5), vec(5, 0), vec(5, 10))).toBe(true);
    // same path but gate entirely above the path -> no crossing
    expect(segmentsIntersect(vec(0, 5), vec(10, 5), vec(5, 6), vec(5, 16))).toBe(false);
  });
});
