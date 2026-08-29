/**
 * P1-T5 daily bonus — the "come back tomorrow" streak SEED.
 *
 * The point of this ticket is PERSISTENCE: we store `{ lastBonusDate,
 * consecutiveDays }` in localStorage so v1.3 can turn the day count into coins.
 * Today the reward is intentionally light — just the delight + the day count.
 * NOTHING here touches timer/score/spawn.
 *
 * Streak rule: opening the app on consecutive calendar days grows the count;
 * a gap of 2+ days resets it to 1. Both "Claim" and "Dismiss" consume the day
 * (you came back either way) — Claim just adds the flourish.
 */

/** ── TUNABLES (all daily-bonus knobs live here) ─────────────────────────── */
export const DAILY_BONUS = {
  storageKey: "zen-daily-bonus-v1", // bump the suffix to reset everyone's streak
  claimParticles: 30, // gold particles in the claim flourish
  claimSpeedMul: 1.6, // how far they fly
  claimSoundLevel: 20, // passed to playMilestone() → tier of the reward chime
};

export type BonusState = { lastBonusDate: string; consecutiveDays: number };

/** Local calendar day as YYYY-MM-DD (device timezone). */
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

function read(): BonusState | null {
  try {
    const raw = localStorage.getItem(DAILY_BONUS.storageKey);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<BonusState>;
    if (typeof s?.lastBonusDate === "string" && typeof s?.consecutiveDays === "number") {
      return { lastBonusDate: s.lastBonusDate, consecutiveDays: s.consecutiveDays };
    }
    return null;
  } catch {
    return null;
  }
}
function write(s: BonusState): void {
  try {
    localStorage.setItem(DAILY_BONUS.storageKey, JSON.stringify(s));
  } catch {
    /* storage disabled (private mode) — bonus simply won't persist */
  }
}

/** True on the first open of a new calendar day (or if never seen). */
export function isBonusAvailable(): boolean {
  const s = read();
  return !s || s.lastBonusDate !== todayStr();
}

/** What the day count WOULD become if consumed right now (for the popup label). */
export function getPendingDayCount(): number {
  const s = read();
  if (!s) return 1; // first ever
  if (s.lastBonusDate === todayStr()) return s.consecutiveDays; // already consumed today
  if (s.lastBonusDate === offsetStr(-1)) return s.consecutiveDays + 1; // yesterday → +1
  return 1; // gap of 2+ days → reset
}

/** Persist today's visit (called on Claim AND Dismiss). Returns the new count. */
export function consumeBonus(): number {
  const days = getPendingDayCount();
  write({ lastBonusDate: todayStr(), consecutiveDays: days });
  return days;
}

/** The raw streak record — this is what v1.3 will read to award coins. */
export function getStreakData(): BonusState | null {
  return read();
}

/** ── Analytics hook (no SDK wired yet — clearly-named TODO) ──────────────── */
export type BonusEvent = "daily_bonus_shown" | "daily_bonus_claimed";
export function trackDailyBonus(event: BonusEvent, dayCount: number): void {
  // TODO(analytics): forward to the real analytics SDK when it lands (v1.3+).
  // Event name + { dayCount } is the exact payload to send.
  if (import.meta.env.DEV) console.debug(`[analytics] ${event}`, { dayCount });
}

/** ── Dev-only testing helpers (stripped from release builds) ─────────────── */
export function installBonusDevHelpers(): void {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  const w = window as unknown as { zenBonus?: Record<string, unknown> };
  if (w.zenBonus) return; // install once
  w.zenBonus = {
    peek: () => read(),
    reset: () => {
      localStorage.removeItem(DAILY_BONUS.storageKey);
      location.reload();
    },
    // Pretend a day passed: set last claim to "yesterday", keep the streak →
    // on reload the popup reappears with the count +1.
    simulateNextDay: () => {
      const s = read();
      write({ lastBonusDate: offsetStr(-1), consecutiveDays: s?.consecutiveDays ?? 1 });
      location.reload();
    },
    // Open a 2-day hole → on reload the popup reappears and the count resets to 1.
    simulateGap: () => {
      const s = read();
      write({ lastBonusDate: offsetStr(-2), consecutiveDays: s?.consecutiveDays ?? 5 });
      location.reload();
    },
  };
  console.info(
    "%c[zenBonus] dev helpers ready:",
    "color:#82d",
    "zenBonus.simulateNextDay() · zenBonus.simulateGap() · zenBonus.reset() · zenBonus.peek()",
  );
}
