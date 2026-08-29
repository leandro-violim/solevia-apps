/**
 * Local daily challenge (§12) — a date-seeded Time Attack run. The seed comes
 * from the LOCAL date, so every player gets the same layout/params that day (no
 * backend). We store the player's local best for today + a short history, award
 * bonus coins for the first play of the day, and roll over at local midnight.
 */
import { load, update } from "./storage";
import { CONFIG } from "./config";
import { addCoins } from "./economy";
import { track } from "./analytics";

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Integer seed for today (YYYYMMDD in local time). */
export function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Deterministic PRNG so a given seed always yields the same field. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh seeded RNG for today (offset per phase so phases differ but repeat). */
export function seededRand(offset = 0): () => number {
  return mulberry32(dailySeed() + offset);
}

export function playedToday(): boolean {
  return load().dailyChallenge.lastDate === todayStr();
}
export function dailyBestToday(): number {
  const dc = load().dailyChallenge;
  return dc.lastDate === todayStr() ? dc.bestToday : 0;
}

/**
 * Record a daily-challenge run result. First play of the day awards bonus coins
 * and pushes yesterday's result into history; replays only raise today's best.
 */
export function recordDailyResult(score: number): { coins: number; best: number } {
  const today = todayStr();
  let coins = 0;
  let best = score;
  update((st) => {
    const dc = st.dailyChallenge;
    if (dc.lastDate === today) {
      best = Math.max(dc.bestToday, score);
      dc.bestToday = best;
    } else {
      if (dc.lastDate) {
        dc.history = [{ date: dc.lastDate, best: dc.bestToday }, ...dc.history].slice(
          0,
          CONFIG.dailyChallenge.historyLength,
        );
      }
      dc.lastDate = today;
      dc.bestToday = score;
      best = score;
      coins = CONFIG.dailyChallenge.bonusCoins; // bonus once per day
    }
  });
  if (coins > 0) addCoins(coins, "daily_challenge");
  track("daily_challenge_played", { score, best });
  return { coins, best };
}
