/**
 * Daily bonus + streaks (§4/§5). Once-a-day gift that grants coins scaled by the
 * streak day, with one-miss "freeze" forgiveness. State lives in the shared
 * storage module (`storage.ts` → `streak`), not its own key.
 *
 * Streak rule: consecutive days grow the count; the coin reward follows
 * CONFIG.streak.coinTable (D1..D7, repeating with D7 as the weekly milestone).
 * A single missed day is forgiven ONCE by an auto-freeze that refreshes weekly;
 * a miss with no freeze — or a 2+ day gap — resets to Day 1.
 */
import { CONFIG } from "./config";
import { load, update, resetPlayerState, type StreakState } from "./storage";
import { track } from "./analytics";
import { addCoins } from "./economy";
import { grantOwned, ALL_COSMETICS } from "./skins";
import { checkAchievements } from "./achievements";

/* ── local-date helpers (device timezone) ─────────────────────────────────── */
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const todayStr = (): string => dateStr(new Date());
function offsetStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateStr(d);
}
/** Days since epoch for a YYYY-MM-DD local date (offsets cancel in differences). */
function dayNumber(s: string): number {
  return Math.floor(new Date(`${s}T00:00:00`).getTime() / 86_400_000);
}
const weekIdOf = (s: string): string => String(Math.floor(dayNumber(s) / 7));

export const DAILY_BONUS = {
  claimParticles: 30, // gold particles in the claim flourish
  claimSpeedMul: 1.6,
  claimSoundLevel: 20, // playMilestone tier for the reward chime
};

/** True on the first open of a new calendar day. */
export function isBonusAvailable(): boolean {
  return load().streak.lastBonusDate !== todayStr();
}

/** Coins granted for a given streak day (D1..D7, repeating). */
export function coinsForDay(day: number): number {
  const table = CONFIG.streak.coinTable;
  return table[(Math.max(1, day) - 1) % table.length];
}

/** What the streak day + coins WOULD be if consumed today (for the popup label). */
function computeNext(streak: StreakState): { day: number; freezeConsumed: boolean } {
  const today = todayStr();
  if (!streak.lastBonusDate) return { day: 1, freezeConsumed: false };
  if (streak.lastBonusDate === today) return { day: streak.consecutiveDays, freezeConsumed: false };
  const gap = dayNumber(today) - dayNumber(streak.lastBonusDate);
  if (gap === 1) return { day: streak.consecutiveDays + 1, freezeConsumed: false };
  if (gap === 2 && CONFIG.streak.freezeEnabled && streak.freezeAvailable) {
    return { day: streak.consecutiveDays + 1, freezeConsumed: true }; // one-miss forgiveness
  }
  return { day: 1, freezeConsumed: false }; // reset
}

export function getPendingDayCount(): number {
  return computeNext(load().streak).day;
}
export function getPendingCoins(): number {
  return coinsForDay(getPendingDayCount());
}
/** Current stored streak (for the home-screen "Day N · 🔥"). */
export function getStreakDay(): number {
  return load().streak.consecutiveDays;
}

/**
 * Consume today's bonus: refresh the weekly freeze, advance/reset the streak,
 * grant the coins, and log. Called on BOTH claim and dismiss (the gift is always
 * credited for showing up); Claim just adds the flourish. Returns day + coins.
 */
export function claimDailyBonus(): { day: number; coins: number } {
  const today = todayStr();
  let out = { day: 1, coins: 0 };
  update((st) => {
    const wk = weekIdOf(today);
    if (CONFIG.streak.freezeEnabled && st.streak.freezeWeek !== wk) {
      st.streak.freezeAvailable = true; // weekly freeze refresh
      st.streak.freezeWeek = wk;
    }
    const { day, freezeConsumed } = computeNext(st.streak);
    if (freezeConsumed) st.streak.freezeAvailable = false;
    st.streak.lastBonusDate = today;
    st.streak.consecutiveDays = day;
    out = { day, coins: coinsForDay(day) };
  });
  addCoins(out.coins, "daily_bonus"); // fires coins_earned
  // §6 premium gating: reaching the streak milestone unlocks the premium skin.
  if (out.day >= CONFIG.skins.premiumStreakMilestone) grantOwned("gold", "streak_milestone");
  track("streak_day", { day: out.day });
  track("daily_bonus_claimed", { day: out.day, coins: out.coins });
  checkAchievements(); // §10 — streak milestones
  return out;
}

export function trackBonusShown(day: number): void {
  track("daily_bonus_shown", { day });
}

/* ── Dev-only helpers (stripped from release) ─────────────────────────────── */
export function installBonusDevHelpers(): void {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  const w = window as unknown as { zenBonus?: Record<string, unknown> };
  if (w.zenBonus) return;
  w.zenBonus = {
    peek: () => load().streak,
    reset: () => {
      resetPlayerState();
      location.reload();
    },
    simulateNextDay: () => {
      update((st) => {
        st.streak.lastBonusDate = offsetStr(-1); // claimed "yesterday"
      });
      location.reload();
    },
    simulateGap: () => {
      update((st) => {
        st.streak.lastBonusDate = offsetStr(-3); // 3-day hole → reset (freeze can't save it)
      });
      location.reload();
    },
    // §13 test helpers: grant coins / unlock every cosmetic.
    grantCoins: (n = 1000) => {
      addCoins(n, "dev");
      location.reload();
    },
    unlockAll: () => {
      for (const c of ALL_COSMETICS) grantOwned(c.id, "dev");
      location.reload();
    },
  };
  console.info(
    "%c[zenBonus]",
    "color:#82d",
    "simulateNextDay() · simulateGap() · reset() · peek() · grantCoins(n) · unlockAll()",
  );
}
