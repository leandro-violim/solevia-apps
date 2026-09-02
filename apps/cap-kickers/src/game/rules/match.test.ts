import { describe, it, expect } from "vitest";
import { initialMatch, applyFlick, type MatchConfig } from "./match";
import { type FlickResult } from "./flick";

const config: MatchConfig = { goalsToWin: 3, shotTouch: 5 }; // earlyShot = 4, final = 5
const legalBuildup: FlickResult = { crossedGate: true, flickedEnding: "rest", anyCapLeftPitch: false };
const at = (attacker: 0 | 1, touch: number) => ({ ...initialMatch(attacker), touch });

describe("applyFlick — build-up (touches 1-3)", () => {
  it("advances the touch on a legal build-up flick, same attacker", () => {
    const { state, result } = applyFlick(initialMatch(0), legalBuildup, config);
    expect(result).toBe("advance");
    expect(state.touch).toBe(2);
    expect(state.attacker).toBe(0);
  });

  it("turns over when the flick misses the gate", () => {
    const miss: FlickResult = { crossedGate: false, flickedEnding: "rest", anyCapLeftPitch: false };
    const { result, state } = applyFlick(initialMatch(0), miss, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
    expect(state.touch).toBe(1);
  });

  it("turns over when a cap leaves the pitch during build-up, even if the gate was crossed", () => {
    const teammateOut: FlickResult = { crossedGate: true, flickedEnding: "rest", anyCapLeftPitch: true };
    expect(applyFlick(initialMatch(0), teammateOut, config).result).toBe("turnover");
  });
});

describe("applyFlick — early shot (touch 4, optional, vs a hard keeper)", () => {
  it("scores when the cap enters the goal — no gate required on the early shot", () => {
    const shot: FlickResult = { crossedGate: false, flickedEnding: "goalRight", anyCapLeftPitch: true };
    const { state, result } = applyFlick(at(0, 4), shot, config);
    expect(result).toBe("goal");
    expect(state.scores).toEqual([1, 0]);
  });

  it("a miss that keeps every cap in play advances to the final shot (the rebound stays alive)", () => {
    const rebound: FlickResult = { crossedGate: false, flickedEnding: "rest", anyCapLeftPitch: false };
    const { state, result } = applyFlick(at(0, 4), rebound, config);
    expect(result).toBe("advance");
    expect(state.touch).toBe(5);
    expect(state.attacker).toBe(0);
  });

  it("turns over only if a cap leaves the pitch on the early shot", () => {
    const out: FlickResult = { crossedGate: false, flickedEnding: "out", anyCapLeftPitch: true };
    const { result, state } = applyFlick(at(0, 4), out, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
  });
});

describe("applyFlick — the final shot (touch 5, must thread the gate)", () => {
  it("scores when the cap threads the gate AND enters the right goal", () => {
    const shot: FlickResult = { crossedGate: true, flickedEnding: "goalRight", anyCapLeftPitch: true };
    const { state, result } = applyFlick(at(0, 5), shot, config);
    expect(result).toBe("goal");
    expect(state.scores).toEqual([1, 0]);
    expect(state.attacker).toBe(1);
    expect(state.touch).toBe(1);
  });

  it("does NOT score when the cap enters the goal WITHOUT threading the gate", () => {
    const noGate: FlickResult = { crossedGate: false, flickedEnding: "goalRight", anyCapLeftPitch: true };
    expect(applyFlick(at(0, 5), noGate, config).result).toBe("turnover");
  });

  it("turns over on a plain missed shot (rest in-bounds)", () => {
    const miss: FlickResult = { crossedGate: false, flickedEnding: "rest", anyCapLeftPitch: false };
    expect(applyFlick(at(0, 5), miss, config).result).toBe("turnover");
  });

  it("treats a threaded shot into the wrong (own) goal as a turnover", () => {
    const ownGoal: FlickResult = { crossedGate: true, flickedEnding: "goalLeft", anyCapLeftPitch: true };
    const { result, state } = applyFlick(at(0, 5), ownGoal, config);
    expect(result).toBe("turnover");
    expect(state.scores).toEqual([0, 0]);
  });

  it("declares a win when the scoring goal reaches goalsToWin", () => {
    const s = { ...at(1, 5), scores: [0, 2] as [number, number] };
    const shot: FlickResult = { crossedGate: true, flickedEnding: "goalLeft", anyCapLeftPitch: true }; // side 1 attacks left
    const { state, result } = applyFlick(s, shot, config);
    expect(result).toBe("win");
    expect(state.phase).toBe("won");
    expect(state.winner).toBe(1);
    expect(state.scores).toEqual([0, 3]);
  });

  it("still scores when the cap threads and enters the goal even if another cap left the pitch", () => {
    const shot: FlickResult = { crossedGate: true, flickedEnding: "goalRight", anyCapLeftPitch: true };
    expect(applyFlick(at(0, 5), shot, config).result).toBe("goal");
  });

  it("is a no-op once the match is won", () => {
    const won = { ...initialMatch(0), phase: "won" as const, winner: 0 as const, scores: [3, 0] as [number, number] };
    const { state, result } = applyFlick(won, legalBuildup, config);
    expect(result).toBe("win");
    expect(state).toEqual(won);
  });
});
