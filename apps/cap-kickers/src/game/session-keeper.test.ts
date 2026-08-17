import { describe, it, expect } from "vitest";
import { GameSession } from "./session";
import { chooseAiFlick } from "./ai/policy";
import { PITCH, PHYSICS, SWIPE } from "./constants";

// Play one flick to completion; returns the FlickReport (or null).
function flickToEnd(s: GameSession, capId: string, velocity: { x: number; y: number }) {
  s.beginFlick(capId, velocity);
  let r = null;
  for (let i = 0; i < 6000 && !r; i++) r = s.tick(1 / 60);
  return r;
}

// Advance an AI-controlled attacker to the 4th touch (legal build-up), returning
// the session paused at touch 4 (attacker unchanged) or null if it lost the turn.
function toShot(s: GameSession): boolean {
  for (let guard = 0; guard < 20 && s.match.touch < 4 && s.match.phase !== "won"; guard++) {
    const move = chooseAiFlick(s.caps(), {
      pitch: PITCH, physics: PHYSICS,
      attacker: s.match.attacker, touch: s.match.touch,
      difficulty: "hard", maxSpeed: SWIPE.maxSpeed,
    });
    if (!move) return false;
    const r = flickToEnd(s, move.capId, move.velocity);
    if (!r || r.result !== "advance") return false;
  }
  return s.match.touch === 4;
}

describe("goalkeeper", () => {
  it("a Hard keeper saves a shot aimed at the goal center", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "hard" });
    expect(toShot(s)).toBe(true);
    // aim the nearest cap straight at the right-goal center
    const shooter = s.caps().reduce((a, b) => (b.position.x > a.position.x ? b : a));
    const target = { x: PITCH.width, y: PITCH.height / 2 };
    const dx = target.x - shooter.position.x, dy = target.y - shooter.position.y;
    const len = Math.hypot(dx, dy);
    const v = { x: (dx / len) * SWIPE.maxSpeed, y: (dy / len) * SWIPE.maxSpeed };
    const r = flickToEnd(s, shooter.id, v);
    expect(r).not.toBeNull();
    expect(r!.result).not.toBe("goal"); // saved -> turnover
  });

  it("an Easy keeper is beaten by a shot to the top corner of the mouth", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "easy" });
    expect(toShot(s)).toBe(true);
    const shooter = s.caps().reduce((a, b) => (b.position.x > a.position.x ? b : a));
    const half = PITCH.goalWidth / 2;
    const target = { x: PITCH.width, y: PITCH.height / 2 - half + 8 }; // top corner
    const dx = target.x - shooter.position.x, dy = target.y - shooter.position.y;
    const len = Math.hypot(dx, dy);
    const v = { x: (dx / len) * SWIPE.maxSpeed, y: (dy / len) * SWIPE.maxSpeed };
    const r = flickToEnd(s, shooter.id, v);
    expect(r).not.toBeNull();
    expect(r!.result).toBe("goal");
  });
});
