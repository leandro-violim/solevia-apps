import { describe, it, expect } from "vitest";
import { evaluateRun } from "./records";

describe("evaluateRun (all-time best decision)", () => {
  it("treats the very first run as a celebration and sets the best", () => {
    const r = evaluateRun(500, 0);
    expect(r.beat).toBe(true);
    expect(r.prevBest).toBe(0);
    expect(r.newBest).toBe(500);
  });

  it("beats and records a new best when the total exceeds the prior best", () => {
    const r = evaluateRun(700, 500);
    expect(r.beat).toBe(true);
    expect(r.newBest).toBe(700);
  });

  it("does NOT beat on a tie (keeps the existing best)", () => {
    const r = evaluateRun(500, 500);
    expect(r.beat).toBe(false);
    expect(r.newBest).toBe(500);
  });

  it("does NOT beat when the total is lower, and keeps the prior best", () => {
    const r = evaluateRun(300, 500);
    expect(r.beat).toBe(false);
    expect(r.newBest).toBe(500);
  });
});
