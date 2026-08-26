import { describe, it, expect } from "vitest";
import { GameSession } from "./session";
import { PITCH } from "./constants";

const SHOT_SPEED = 5000; // raw velocity that crosses the pitch (see session-keeper.test)

function flickToEnd(s: GameSession, capId: string, v: { x: number; y: number }) {
  s.beginFlick(capId, v);
  let r = null;
  for (let i = 0; i < 6000 && !r; i++) r = s.tick(1 / 60);
  return r;
}
function shootFrom(s: GameSession, capId: string, target: { x: number; y: number }) {
  const c = s.caps().find((cap) => cap.id === capId)!;
  const dx = target.x - c.position.x, dy = target.y - c.position.y;
  const len = Math.hypot(dx, dy) || 1;
  return flickToEnd(s, capId, { x: (dx / len) * SHOT_SPEED, y: (dy / len) * SHOT_SPEED });
}
// A central shot a Hard keeper saves -> turnover (a "missed" shot).
const missShot = (s: GameSession) => shootFrom(s, "c1", { x: PITCH.width, y: PITCH.height / 2 });

describe("rewarded extra shot", () => {
  it("lets a missed shot be replayed, restoring the pre-shot setup", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "hard" });
    s.match = { ...s.match, touch: 5 };
    const before = s.caps().map((c) => ({ id: c.id, x: c.position.x, y: c.position.y }));

    const r = missShot(s);
    expect(r!.result).toBe("turnover");
    expect(s.match.attacker).toBe(1); // possession flipped on the miss
    expect(s.canRetryShot()).toBe(true);

    expect(s.retryShot()).toBe(true);
    expect(s.match.attacker).toBe(0); // handed back to the shooter
    expect(s.match.touch).toBe(5); // shot touch again
    expect(s.phase).toBe("aiming");
    for (const b of before) {
      const now = s.caps().find((c) => c.id === b.id)!;
      expect(now.position.x).toBeCloseTo(b.x, 3);
      expect(now.position.y).toBeCloseTo(b.y, 3);
    }
  });

  it("allows only ONE retry per possession", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "hard" });
    s.match = { ...s.match, touch: 5 };
    missShot(s);
    expect(s.retryShot()).toBe(true);
    // Miss the replayed shot too -> no further retry.
    const r2 = missShot(s);
    expect(r2!.result).toBe("turnover");
    expect(s.canRetryShot()).toBe(false);
    expect(s.retryShot()).toBe(false);
  });

  it("is not offered after a build-up turnover", () => {
    const s = new GameSession(); // touch 1
    const r = flickToEnd(s, "c2", { x: 0, y: -9000 }); // straight out of bounds
    expect(r!.result).toBe("turnover");
    expect(s.canRetryShot()).toBe(false);
  });

  it("is not offered after a goal", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "easy" });
    s.match = { ...s.match, touch: 5 };
    const half = PITCH.goalWidth / 2;
    const r = shootFrom(s, "c1", { x: PITCH.width, y: PITCH.height / 2 - half + 12 }); // corner beats easy keeper
    expect(r!.result).toBe("goal");
    expect(s.canRetryShot()).toBe(false);
  });

  it("declineRetry clears eligibility and proceeds", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "hard" });
    s.match = { ...s.match, touch: 5 };
    missShot(s);
    expect(s.canRetryShot()).toBe(true);
    s.declineRetry();
    expect(s.canRetryShot()).toBe(false);
    expect(s.match.attacker).toBe(1); // stays turned over
  });
});
