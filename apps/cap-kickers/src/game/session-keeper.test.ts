import { describe, it, expect } from "vitest";
import { GameSession } from "./session";
import { PITCH } from "./constants";

// Raw flick speed for a full-pitch shot. beginFlick takes velocity directly (it
// is NOT clamped to SWIPE.maxSpeed), and friction eats a slower shot before it
// crosses the far goal line ~928px away — so we drive it hard on purpose.
const SHOT_SPEED = 5000;

// Play one flick to completion; returns the FlickReport (or null).
function flickToEnd(s: GameSession, capId: string, velocity: { x: number; y: number }) {
  s.beginFlick(capId, velocity);
  let r = null;
  for (let i = 0; i < 6000 && !r; i++) r = s.tick(1 / 60);
  return r;
}

// Aim a shot from `capId` at `target`, driven hard enough to reach the goal.
function shotAt(s: GameSession, capId: string, target: { x: number; y: number }) {
  const c = s.caps().find((cap) => cap.id === capId)!;
  const dx = target.x - c.position.x, dy = target.y - c.position.y;
  const len = Math.hypot(dx, dy) || 1;
  return flickToEnd(s, capId, { x: (dx / len) * SHOT_SPEED, y: (dy / len) * SHOT_SPEED });
}

describe("goalkeeper", () => {
  it("a Hard keeper saves a shot aimed at the goal center", () => {
    // Jump straight to the shot (the shot touch spawns the defending keeper). c1
    // is the central cap of the starting line, dead in line with the mouth centre.
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "hard" });
    s.match = { ...s.match, touch: 5 };
    const r = shotAt(s, "c1", { x: PITCH.width, y: PITCH.height / 2 });
    expect(r).not.toBeNull();
    expect(r!.result).not.toBe("goal"); // centred shot -> the keeper is right there -> saved
  });

  it("an Easy keeper is beaten by a shot to the top corner of the mouth", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "easy" });
    s.match = { ...s.match, touch: 5 };
    const half = PITCH.goalWidth / 2;
    // Top corner of the mouth: a slow Easy keeper can't cover it from centre.
    const r = shotAt(s, "c1", { x: PITCH.width, y: PITCH.height / 2 - half + 12 });
    expect(r).not.toBeNull();
    expect(r!.result).toBe("goal");
  });
});
