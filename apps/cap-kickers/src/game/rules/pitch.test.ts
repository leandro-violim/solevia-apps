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

  it("keeps a cap that only PARTLY crossed a line as 'in' (some pixels still on the pitch)", () => {
    // r = 10. Center on/just past a line = still straddling it → in play, not out/goal.
    expect(classifyCap(cap(800, 250), pitch)).toBe("in"); // half over the right goal line
    expect(classifyCap(cap(0, 250), pitch)).toBe("in"); // half over the left goal line
    expect(classifyCap(cap(400, 0), pitch)).toBe("in"); // half over the top sideline
    expect(classifyCap(cap(400, 500), pitch)).toBe("in"); // half over the bottom sideline
    expect(classifyCap(cap(805, 250), pitch)).toBe("in"); // near edge (795) still inside
  });

  it("classifies the WHOLE cap past the right end line inside the mouth as goalRight", () => {
    expect(classifyCap(cap(810, 250), pitch)).toBe("goalRight"); // near edge 800 == line
    expect(classifyCap(cap(830, 250), pitch)).toBe("goalRight");
  });

  it("classifies the WHOLE cap past the left end line inside the mouth as goalLeft", () => {
    expect(classifyCap(cap(-10, 250), pitch)).toBe("goalLeft");
  });

  it("classifies the whole cap past an end line OUTSIDE the mouth as out", () => {
    expect(classifyCap(cap(810, 100), pitch)).toBe("out"); // above the mouth
    expect(classifyCap(cap(-10, 400), pitch)).toBe("out"); // below the mouth
  });

  it("classifies the whole cap past top/bottom sidelines as out", () => {
    expect(classifyCap(cap(400, -10), pitch)).toBe("out");
    expect(classifyCap(cap(400, 510), pitch)).toBe("out");
  });
});
