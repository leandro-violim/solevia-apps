import { describe, it, expect } from "vitest";
import { classifyCap, attackingGoal, defendingGoal, goalZone, type Pitch } from "./pitch";
import { type Body } from "../physics/world";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 }; // mouth y in [150,350]

const cap = (x: number, y: number): Body => ({
  id: "c",
  position: { x, y },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
});

describe("pitch classification", () => {
  it("maps attacking/defending goals per side", () => {
    expect(attackingGoal(0)).toBe("right");
    expect(attackingGoal(1)).toBe("left");
    expect(defendingGoal(0)).toBe("left");
    expect(defendingGoal(1)).toBe("right");
    expect(goalZone("left")).toBe("goalLeft");
    expect(goalZone("right")).toBe("goalRight");
  });

  it("classifies a center inside the pitch as 'in'", () => {
    expect(classifyCap(cap(400, 250), pitch)).toBe("in");
  });

  it("classifies crossing the right end line inside the mouth as goalRight", () => {
    expect(classifyCap(cap(800, 250), pitch)).toBe("goalRight");
    expect(classifyCap(cap(810, 250), pitch)).toBe("goalRight");
  });

  it("classifies crossing the left end line inside the mouth as goalLeft", () => {
    expect(classifyCap(cap(0, 250), pitch)).toBe("goalLeft");
  });

  it("classifies crossing an end line OUTSIDE the mouth as out", () => {
    expect(classifyCap(cap(800, 100), pitch)).toBe("out"); // above the mouth
    expect(classifyCap(cap(0, 400), pitch)).toBe("out"); // below the mouth
  });

  it("classifies crossing top/bottom sidelines as out", () => {
    expect(classifyCap(cap(400, 0), pitch)).toBe("out");
    expect(classifyCap(cap(400, 500), pitch)).toBe("out");
  });
});
