import { describe, it, expect } from "vitest";
import { getPhase, computeScore, formatTime, PHASES, TOTAL_PHASES } from "./game-config";

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
