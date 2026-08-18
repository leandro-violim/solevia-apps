import { describe, it, expect } from "vitest";
import { GameSession } from "./session";
import { PITCH } from "./constants";

// Run an animated flick to completion, returning the finalizing report.
const runFlick = (s: GameSession, capId: string, v: { x: number; y: number }) => {
  s.beginFlick(capId, v);
  let report = null;
  for (let i = 0; i < 2000 && report === null; i++) report = s.tick(1 / 60);
  return report;
};

describe("GameSession", () => {
  it("starts with 3 caps in side-0 triangle, touch 1, aiming", () => {
    const s = new GameSession();
    expect(s.caps()).toHaveLength(3);
    expect(s.match.attacker).toBe(0);
    expect(s.match.touch).toBe(1);
    expect(s.phase).toBe("aiming");
    // side-0 triangle sits in the left half
    for (const c of s.caps()) expect(c.position.x).toBeLessThan(s /* pitch */ .world.cfg.bounds.maxX);
  });

  it("advances the touch on a legal build-up flick without repositioning", () => {
    const s = new GameSession();
    // From the starting line, flicking the MIDDLE cap (c1) up-field is legal: it
    // starts on the gate between the outer two (c0/c2), so it threads trivially,
    // and rests in-bounds.
    const before = s.caps().find((c) => c.id === "c1")!.position.x;
    const report = runFlick(s, "c1", { x: 250, y: 0 });
    expect(report!.result).toBe("advance");
    expect(s.match.touch).toBe(2);
    expect(s.match.attacker).toBe(0);
    // c1 moved up-field (right), not reset to the starting line.
    expect(s.caps().find((c) => c.id === "c1")!.position.x).toBeGreaterThan(before);
  });

  it("turns over and repositions to side 1 when a cap flies out during build-up", () => {
    const s = new GameSession();
    const report = runFlick(s, "c2", { x: 0, y: -5000 }); // straight out the top
    expect(report!.result).toBe("turnover");
    expect(s.match.attacker).toBe(1);
    expect(s.match.touch).toBe(1);
    // side-1 triangle sits in the right half
    expect(s.caps().some((c) => c.position.x > 500)).toBe(true);
  });

  it("scores on the shot (touch 5) into the right goal, then kicks off to side 1", () => {
    // A weak (Easy) keeper spawns on the shot touch; a corner shot from the
    // central cap beats it, so the shot scores and kicks off to side 1.
    const s = new GameSession({ keeperDifficulty: "easy" });
    s.match = { ...s.match, touch: 5 };
    const c1 = s.caps().find((c) => c.id === "c1")!;
    const half = PITCH.goalWidth / 2;
    const target = { x: PITCH.width, y: PITCH.height / 2 - half + 12 }; // top corner of right goal
    const dx = target.x - c1.position.x, dy = target.y - c1.position.y;
    const len = Math.hypot(dx, dy);
    // Raw velocity (not clamped to SWIPE.maxSpeed); driven hard to cross the pitch.
    const report = runFlick(s, "c1", { x: (dx / len) * 5000, y: (dy / len) * 5000 });
    expect(report!.result).toBe("goal");
    expect(s.match.scores).toEqual([1, 0]);
    expect(s.match.attacker).toBe(1);
  });

  it("ignores beginFlick while already resolving", () => {
    const s = new GameSession();
    s.beginFlick("c2", { x: -300, y: 0 });
    expect(s.phase).toBe("resolving");
    s.beginFlick("c0", { x: 5000, y: 0 }); // ignored
    let report = null;
    for (let i = 0; i < 2000 && report === null; i++) report = s.tick(1 / 60);
    expect(report).not.toBeNull(); // the first flick still resolves normally
  });
});

describe("GameSession post-win guard", () => {
  it("ignores beginFlick once the match is won", () => {
    const s = new GameSession();
    s.match = { ...s.match, phase: "won", winner: 0 };
    const before = s.caps().map((c) => ({ ...c.position }));
    s.beginFlick("c2", { x: 5000, y: 0 });
    expect(s.phase).toBe("aiming"); // did not enter "resolving"
    const report = s.tick(1 / 60);
    expect(report).toBeNull(); // nothing is resolving
    expect(s.caps().map((c) => c.position)).toEqual(before); // no cap moved
  });
});
