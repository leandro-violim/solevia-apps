import { describe, it, expect } from "vitest";
import {
  getPhase,
  computeScore,
  formatTime,
  PHASES,
  TOTAL_PHASES,
  roundOf,
  phaseInRound,
  mechanicOf,
  stageConfig,
  TOTAL_STAGES,
  TOTAL_ROUNDS,
} from "./game-config";

describe("getPhase", () => {
  it("clamps below and above the valid range", () => {
    expect(getPhase(0)).toBe(PHASES[0]);
    expect(getPhase(-5)).toBe(PHASES[0]);
    expect(getPhase(999)).toBe(PHASES[TOTAL_PHASES - 1]);
  });

  it("returns the requested phase in range", () => {
    expect(getPhase(3).phase).toBe(3);
  });
});

describe("rounds / worlds", () => {
  it("maps global stages to the right world + in-round phase", () => {
    expect([roundOf(1), phaseInRound(1)]).toEqual([1, 1]);
    expect([roundOf(8), phaseInRound(8)]).toEqual([1, 8]);
    expect([roundOf(9), phaseInRound(9)]).toEqual([2, 1]);
    expect([roundOf(17), phaseInRound(17)]).toEqual([3, 1]);
    expect([roundOf(32), phaseInRound(32)]).toEqual([4, 8]);
  });

  it("assigns one mechanic per round", () => {
    expect(mechanicOf(1)).toBe("grid");
    expect(mechanicOf(9)).toBe("jitter");
    expect(mechanicOf(17)).toBe("moving");
    expect(mechanicOf(25)).toBe("shielded");
  });

  it("clamps out-of-range stages into the valid window", () => {
    expect(roundOf(0)).toBe(1);
    expect(roundOf(999)).toBe(TOTAL_ROUNDS);
    expect(TOTAL_STAGES).toBe(TOTAL_PHASES * TOTAL_ROUNDS);
  });

  it("reuses the in-round phase's field config across worlds", () => {
    // Stage 3 (world 1 phase 3) and stage 11 (world 2 phase 3) share geometry.
    const a = stageConfig(3, "normal");
    const b = stageConfig(11, "normal");
    expect(b.bubbles).toBe(a.bubbles);
    expect(b.size).toBe(a.size);
  });
});

describe("computeScore", () => {
  it("is base + full speed bonus at t=0", () => {
    // base 10*10=100, bonus 600*(10/10)=600
    expect(computeScore(10, 0)).toBe(700);
  });

  it("floors the bonus at 0 once it fully decays (score never below base)", () => {
    // 600s * 5 = 3000 > 600 → bonus clamped to 0
    expect(computeScore(10, 600_000)).toBe(100);
  });

  it("scales the bonus by bubble density", () => {
    // base 200, bonus 600*(20/10)=1200
    expect(computeScore(20, 0)).toBe(1400);
  });
});

describe("formatTime", () => {
  it("formats minutes:seconds.tenths", () => {
    expect(formatTime(0)).toBe("0:00.0");
    expect(formatTime(1234)).toBe("0:01.2");
    expect(formatTime(65_000)).toBe("1:05.0");
  });

  it("clamps negative input to zero", () => {
    expect(formatTime(-100)).toBe("0:00.0");
  });
});
