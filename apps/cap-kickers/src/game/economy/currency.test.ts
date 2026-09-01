import { describe, it, expect } from "vitest";
import {
  loadBalance,
  earn,
  spend,
  firstWinAvailable,
  claimFirstWin,
  rewardedEarnsLeft,
  recordRewardedEarn,
  REWARDED_DAILY_CAP,
  type StorageLike,
} from "./currency";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("currency — wallet", () => {
  it("starts empty and earns/spends", () => {
    const s = fakeStorage();
    expect(loadBalance(s)).toBe(0);
    expect(earn(10, s)).toBe(10);
    expect(earn(5, s)).toBe(15);
    expect(loadBalance(s)).toBe(15);
  });

  it("spend succeeds only when affordable and debits exactly", () => {
    const s = fakeStorage();
    earn(30, s);
    expect(spend(50, s)).toBe(false); // too expensive — no change
    expect(loadBalance(s)).toBe(30);
    expect(spend(20, s)).toBe(true);
    expect(loadBalance(s)).toBe(10);
    expect(spend(10, s)).toBe(true); // exact balance
    expect(loadBalance(s)).toBe(0);
  });

  it("ignores junk earn/spend amounts", () => {
    const s = fakeStorage();
    expect(earn(-5, s)).toBe(0);
    expect(earn(NaN, s)).toBe(0);
    expect(earn(3.9, s)).toBe(3); // floored
    expect(spend(0, s)).toBe(false);
    expect(spend(-1, s)).toBe(false);
    expect(loadBalance(s)).toBe(3);
  });

  it("is safe with null storage and corrupt/negative stored data", () => {
    expect(loadBalance(null)).toBe(0);
    const s = fakeStorage();
    s.setItem("capkickers.wallet.v1", "{not json");
    expect(loadBalance(s)).toBe(0);
    s.setItem("capkickers.wallet.v1", JSON.stringify({ balance: -99 }));
    expect(loadBalance(s)).toBe(0);
  });
});

describe("currency — daily bonuses", () => {
  it("first-win bonus is once per day and resets the next day", () => {
    const s = fakeStorage();
    expect(firstWinAvailable("2026-09-01", s)).toBe(true);
    expect(claimFirstWin("2026-09-01", s)).toBe(true);
    expect(firstWinAvailable("2026-09-01", s)).toBe(false);
    expect(claimFirstWin("2026-09-01", s)).toBe(false); // already claimed today
    // Next day — available again.
    expect(firstWinAvailable("2026-09-02", s)).toBe(true);
    expect(claimFirstWin("2026-09-02", s)).toBe(true);
  });

  it("rewarded earns are capped per day and reset the next day", () => {
    const s = fakeStorage();
    expect(rewardedEarnsLeft("2026-09-01", s)).toBe(REWARDED_DAILY_CAP);
    for (let i = 0; i < REWARDED_DAILY_CAP; i++) expect(recordRewardedEarn("2026-09-01", s)).toBe(true);
    expect(rewardedEarnsLeft("2026-09-01", s)).toBe(0);
    expect(recordRewardedEarn("2026-09-01", s)).toBe(false); // over the cap
    expect(rewardedEarnsLeft("2026-09-02", s)).toBe(REWARDED_DAILY_CAP); // new day
  });

  it("refuses claims when the clock is set BACKWARDS (stored date in the future)", () => {
    const s = fakeStorage();
    // Establish today, consume the daily.
    claimFirstWin("2026-09-10", s);
    recordRewardedEarn("2026-09-10", s);
    // Player sets the device date back to farm again.
    expect(firstWinAvailable("2026-09-05", s)).toBe(false);
    expect(claimFirstWin("2026-09-05", s)).toBe(false);
    expect(rewardedEarnsLeft("2026-09-05", s)).toBe(0);
    expect(recordRewardedEarn("2026-09-05", s)).toBe(false);
    // Moving forward again past the stored date works normally.
    expect(firstWinAvailable("2026-09-11", s)).toBe(true);
  });
});
