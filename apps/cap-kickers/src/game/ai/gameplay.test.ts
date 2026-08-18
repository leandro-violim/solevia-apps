import { describe, it, expect } from "vitest";
import { GameSession, type FlickReport } from "../session";
import { chooseAiFlick, type Difficulty } from "./policy";
import { PITCH, PHYSICS, SWIPE, MATCH } from "../constants";

// Plays ONE AI flick to completion, mirroring the /play route's rAF-driven AI
// turn loop: pick a move from the policy, fire it, then step ticks until the
// flick resolves. Returns the finalizing report, or null if the AI had no move.
function aiFlickOnce(session: GameSession, difficulty: Difficulty): FlickReport | null {
  const move = chooseAiFlick(session.caps(), {
    pitch: PITCH,
    physics: PHYSICS,
    attacker: session.match.attacker,
    touch: session.match.touch,
    shotTouch: MATCH.shotTouch,
    difficulty,
    maxSpeed: SWIPE.maxSpeed,
  });
  if (!move) return null;
  session.beginFlick(move.capId, move.velocity);
  let report: FlickReport | null = null;
  for (let i = 0; i < 5000 && !report; i++) report = session.tick(1 / 60);
  return report;
}

// Plays out a full AI turn (until the attacker changes or the match is won),
// up to a safety cap of flicks. Returns the sequence of results observed.
function playAiTurn(session: GameSession, difficulty: Difficulty, maxFlicks = 12): string[] {
  const results: string[] = [];
  let flicks = 0;
  while (session.match.attacker === 1 && session.match.phase !== "won" && flicks < maxFlicks) {
    const report = aiFlickOnce(session, difficulty);
    if (!report) break;
    results.push(report.result);
    flicks++;
  }
  return results;
}

describe("Cap Kickers AI gameplay", () => {
  it("the AI makes a legal advancing flick from the opening triangle", () => {
    const session = new GameSession({ firstAttacker: 1 });
    const report = aiFlickOnce(session, "hard");
    expect(report).not.toBeNull();
    expect(report!.result).toBe("advance");
    expect(session.match.touch).toBe(2);
    expect(session.match.attacker).toBe(1);
  });

  it("the AI completes a full turn (up to the 4th-touch shot) without stalling", () => {
    const session = new GameSession({ firstAttacker: 1 });
    const maxFlicks = 12;
    const results = playAiTurn(session, "hard", maxFlicks);

    // The loop must have terminated because the turn actually ended
    // (turnover/goal flipped the attacker, or the match was won) — not
    // because it exhausted the safety cap without making progress.
    const turnEnded = session.match.attacker !== 1 || session.match.phase === "won";
    expect(turnEnded).toBe(true);
    expect(results.length).toBeLessThan(maxFlicks);

    // The AI strung together at least one legal build-up flick, not an
    // instant turnover on the opening move.
    expect(results).toContain("advance");

    // The turn's final flick is what actually ended it.
    const last = results[results.length - 1];
    expect(["turnover", "goal", "win"]).toContain(last);
  });

  it("AI play is deterministic", () => {
    const play = () => {
      const session = new GameSession({ firstAttacker: 1 });
      return playAiTurn(session, "hard", 12);
    };
    const first = play();
    const second = play();
    expect(second).toEqual(first);
  });
});
