import { describe, it, expect } from "vitest";
import { TUTORIAL_STEPS, stepCount, isLastStep } from "./steps";

describe("tutorial steps", () => {
  it("has an ordered set of steps with unique ids", () => {
    expect(TUTORIAL_STEPS.length).toBe(6);
    expect(stepCount).toBe(TUTORIAL_STEPS.length);
    expect(TUTORIAL_STEPS[0].id).toBe("intro");
    expect(TUTORIAL_STEPS.map((s) => s.id)).toContain("middle");
    expect(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id).toBe("shoot");
    expect(new Set(TUTORIAL_STEPS.map((s) => s.id)).size).toBe(TUTORIAL_STEPS.length);
    for (const s of TUTORIAL_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.body.length).toBeGreaterThan(0);
    }
  });

  it("isLastStep identifies the final index", () => {
    expect(isLastStep(TUTORIAL_STEPS.length - 1)).toBe(true);
    expect(isLastStep(0)).toBe(false);
  });
});
