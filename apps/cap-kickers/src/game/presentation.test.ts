import { describe, it, expect } from "vitest";
import { makePresentation, pitchToScreen, screenToPitch } from "./presentation";
import { pitchToCanvas } from "./viewport";
import { vec } from "./physics/vec";
import { type Pitch } from "./rules/pitch";

const pitch: Pitch = { width: 1000, height: 620, goalWidth: 220 };
const canvas = { width: 1000, height: 620 }; // scale 1, no letterbox, for easy math

describe("presentation", () => {
  it("matches the plain viewport transform when not flipped", () => {
    const pres = makePresentation(pitch, canvas, false);
    expect(pitchToScreen(vec(100, 200), pres)).toEqual(pitchToCanvas(vec(100, 200), pres.viewport));
  });

  it("reflects through the pitch center when flipped", () => {
    const pres = makePresentation(pitch, canvas, true);
    // center maps to itself
    expect(pitchToScreen(vec(500, 310), pres)).toEqual({ x: 500, y: 310 });
    // pitch origin (0,0) draws where (width,height) would unflipped -> (1000,620)
    expect(pitchToScreen(vec(0, 0), pres)).toEqual({ x: 1000, y: 620 });
    // a right-goal point draws on the left, and vice versa
    expect(pitchToScreen(vec(1000, 310), pres)).toEqual({ x: 0, y: 310 });
  });

  it("round-trips screen->pitch->screen for both orientations", () => {
    for (const flipped of [false, true]) {
      const pres = makePresentation(pitch, { width: 1280, height: 800 }, flipped);
      const p = vec(321, 111);
      const back = screenToPitch(pitchToScreen(p, pres), pres);
      expect(back.x).toBeCloseTo(321, 6);
      expect(back.y).toBeCloseTo(111, 6);
    }
  });
});
