// Caps — the soft currency. Earned by PLAYING and by watching rewarded ads only;
// never bought with real money (that would force an IARC re-rating — see
// REWARDS-AND-AUDIO-PLAN.md §"keep it ads-and-play only"). Cosmetics only; nothing
// here gates the core loop.
//
// Defensive + injectable, mirroring src/game/settings/storage.ts: unknown/missing/
// blocked storage falls back to defaults and corrupt JSON never throws.
//
// Determinism: this module lives under src/game/ and must not read the clock
// itself. Every daily function takes `today` (a local YYYY-MM-DD string) from the
// caller, which keeps it testable and keeps the wall clock in the UI layer.

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const WALLET_KEY = "capkickers.wallet.v1";
const DAILY_KEY = "capkickers.daily.v1";

/** Rewarded-ad Caps earns allowed per day, before AdMob throttling / chore-feel. */
export const REWARDED_DAILY_CAP = 5;

/** Caps awarded per earn source (REWARDS-AND-AUDIO-PLAN.md §1). */
export const EARN = {
  campaignWin: 10,
  aiWin: 5,
  passPlayOrPractice: 2,
  firstLevelClear: 25,
  campaignComplete: 100,
  firstWinOfDay: 15,
  rewardedWatch: 20,
} as const;

const defaultStorage = (): StorageLike | null => {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
      return (globalThis as { localStorage: StorageLike }).localStorage;
    }
  } catch {
    /* fall through */
  }
  return null;
};

/** A non-negative integer, or the fallback for anything else (NaN, negatives, junk). */
const asCount = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;

// ── Wallet ──────────────────────────────────────────────────────────────────

export const loadBalance = (storage: StorageLike | null = defaultStorage()): number => {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(WALLET_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { balance?: unknown };
    return asCount(parsed.balance, 0);
  } catch {
    return 0;
  }
};

const saveBalance = (balance: number, storage: StorageLike | null): void => {
  if (!storage) return;
  try {
    storage.setItem(WALLET_KEY, JSON.stringify({ balance }));
  } catch {
    /* blocked/full -> ignore */
  }
};

/** Add Caps (positive integer). No-ops on junk input. Returns the new balance. */
export const earn = (amount: number, storage: StorageLike | null = defaultStorage()): number => {
  const add = asCount(amount, 0);
  const next = loadBalance(storage) + add;
  if (add > 0) saveBalance(next, storage);
  return next;
};

/** Spend Caps. Returns true only if affordable (and then the balance is debited). */
export const spend = (amount: number, storage: StorageLike | null = defaultStorage()): boolean => {
  const cost = asCount(amount, 0);
  if (cost <= 0) return false;
  const balance = loadBalance(storage);
  if (balance < cost) return false;
  saveBalance(balance - cost, storage);
  return true;
};

// ── Daily bonuses (first win of the day, rewarded-earn cap) ───────────────────

type Daily = { date: string; firstWinClaimed: boolean; rewardedCount: number };
const EMPTY_DAILY: Daily = { date: "", firstWinClaimed: false, rewardedCount: 0 };

const loadDaily = (storage: StorageLike | null): Daily => {
  if (!storage) return { ...EMPTY_DAILY };
  try {
    const raw = storage.getItem(DAILY_KEY);
    if (!raw) return { ...EMPTY_DAILY };
    const p = JSON.parse(raw) as Partial<Daily>;
    return {
      date: typeof p.date === "string" ? p.date : "",
      firstWinClaimed: typeof p.firstWinClaimed === "boolean" ? p.firstWinClaimed : false,
      rewardedCount: asCount(p.rewardedCount, 0),
    };
  } catch {
    return { ...EMPTY_DAILY };
  }
};

const saveDaily = (d: Daily, storage: StorageLike | null): void => {
  if (!storage) return;
  try {
    storage.setItem(DAILY_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
};

/**
 * Resolve the stored daily record against `today`:
 *  - same day  → use it as-is.
 *  - new day (today later than stored) → a fresh, unclaimed record for today.
 *  - stored date in the FUTURE → `blocked`: the clock has been set back to farm
 *    the daily. Refuse all claims and don't touch the record.
 */
const resolveDaily = (stored: Daily, today: string): { day: Daily; blocked: boolean } => {
  if (stored.date === today) return { day: stored, blocked: false };
  if (today > stored.date) return { day: { date: today, firstWinClaimed: false, rewardedCount: 0 }, blocked: false };
  return { day: stored, blocked: true };
};

/** Is the once-a-day "first win" bonus still available for `today`? */
export const firstWinAvailable = (today: string, storage: StorageLike | null = defaultStorage()): boolean => {
  const { day, blocked } = resolveDaily(loadDaily(storage), today);
  return !blocked && !day.firstWinClaimed;
};

/** Claim the first-win-of-day bonus. Returns true if it was newly claimed. */
export const claimFirstWin = (today: string, storage: StorageLike | null = defaultStorage()): boolean => {
  const { day, blocked } = resolveDaily(loadDaily(storage), today);
  if (blocked || day.firstWinClaimed) return false;
  saveDaily({ ...day, firstWinClaimed: true }, storage);
  return true;
};

/** Rewarded-ad Caps earns still allowed today (0..REWARDED_DAILY_CAP). */
export const rewardedEarnsLeft = (today: string, storage: StorageLike | null = defaultStorage()): number => {
  const { day, blocked } = resolveDaily(loadDaily(storage), today);
  if (blocked) return 0;
  return Math.max(0, REWARDED_DAILY_CAP - day.rewardedCount);
};

/** Record one rewarded-ad earn for today. Returns true if under the daily cap. */
export const recordRewardedEarn = (today: string, storage: StorageLike | null = defaultStorage()): boolean => {
  const { day, blocked } = resolveDaily(loadDaily(storage), today);
  if (blocked || day.rewardedCount >= REWARDED_DAILY_CAP) return false;
  saveDaily({ ...day, rewardedCount: day.rewardedCount + 1 }, storage);
  return true;
};
