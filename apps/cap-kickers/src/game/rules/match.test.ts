import { describe, it, expect } from "vitest";
import { initialMatch, applyFlick, type MatchConfig } from "./match";
import { type FlickResult } from "./flick";

const config: MatchConfig = { goalsToWin: 3 };
const legalBuildup: FlickResult = { crossedGate: true, flickedEnding: "rest", anyCapLeftPitch: false };

describe("applyFlick — build-up (touches 1-3)", () => {
  it("advances the touch on a legal build-up flick, same attacker", () => {
    const s = initialMatch(0); // attacker 0, touch 1
    const { state, result } = applyFlick(s, legalBuildup, config);
    expect(result).toBe("advance");
    expect(state.touch).toBe(2);
    expect(state.attacker).toBe(0);
  });

  it("turns over when the flick misses the gate", () => {
    const s = initialMatch(0);
    const miss: FlickResult = { crossedGate: false, flickedEnding: "rest", anyCapLeftPitch: false };
    const { state, result } = applyFlick(s, miss, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
    expect(state.touch).toBe(1);
  });

  it("turns over when a cap leaves the pitch during build-up, even if the gate was crossed", () => {
    const s = initialMatch(0);
    const out: FlickResult = { crossedGate: true, flickedEnding: "out", anyCapLeftPitch: true };
    const { state, result } = applyFlick(s, out, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
  });

  it("turns over in build-up when a teammate cap leaves the pitch, even though the flicked cap threaded and rested", () => {
    const s = initialMatch(0);
    const teammateOut: FlickResult = { crossedGate: true, flickedEnding: "rest", anyCapLeftPitch: true };
    const { state, result } = applyFlick(s, teammateOut, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
  });
});

describe("applyFlick — the shot (touch 4)", () => {
  const atShot = (attacker: 0 | 1) => ({ ...initialMatch(attacker), touch: 4 });

  it("scores when attacker 0 puts the cap in the right goal, then kicks off to side 1", () => {
    const shot: FlickResult = { crossedGate: false, flickedEnding: "goalRight", anyCapLeftPitch: true };
    const { state, result } = applyFlick(atShot(0), shot, config);
    expect(result).toBe("goal");
    expect(state.scores).toEqual([1, 0]);
    expect(state.attacker).toBe(1);
    expect(state.touch).toBe(1);
  });

  it("does NOT require the gate on the shot (goal counts even with crossedGate=false)", () => {
    const shot: FlickResult = { crossedGate: false, flickedEnding: "goalRight", anyCapLeftPitch: true };
    expect(applyFlick(atShot(0), shot, config).result).toBe("goal");
  });

  it("turns over on a missed shot (rest in-bounds)", () => {
    const miss: FlickResult = { crossedGate: false, flickedEnding: "rest", anyCapLeftPitch: false };
    const { result, state } = applyFlick(atShot(0), miss, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
  });

  it("treats scoring in the wrong (own) goal as a turnover, not a score", () => {
    const ownGoal: FlickResult = { crossedGate: false, flickedEnding: "goalLeft", anyCapLeftPitch: true };
    const { result, state } = applyFlick(atShot(0), ownGoal, config);
    expect(result).toBe("turnover");
    expect(state.scores).toEqual([0, 0]);
  });

  it("declares a win when the scoring goal reaches goalsToWin", () => {
    const s = { ...initialMatch(1), touch: 4, scores: [0, 2] as [number, number] };
    const shot: FlickResult = { crossedGate: false, flickedEnding: "goalLeft", anyCapLeftPitch: true }; // side 1 attacks left
    const { state, result } = applyFlick(s, shot, config);
    expect(result).toBe("win");
    expect(state.phase).toBe("won");
    expect(state.winner).toBe(1);
    expect(state.scores).toEqual([0, 3]);
  });

  it("is a no-op once the match is won", () => {
    const won = { ...initialMatch(0), phase: "won" as const, winner: 0 as const, scores: [3, 0] as [number, number] };
    const { state, result } = applyFlick(won, legalBuildup, config);
    expect(result).toBe("win");
    expect(state).toEqual(won);
  });

  it("still scores on the shot when the flicked cap enters the goal even if another cap left the pitch", () => {
    const shot: FlickResult = { crossedGate: false, flickedEnding: "goalRight", anyCapLeftPitch: true };
    const { state, result } = applyFlick({ ...initialMatch(0), touch: 4 }, shot, config);
    expect(result).toBe("goal");
    expect(state.scores).toEqual([1, 0]);
  });
});
