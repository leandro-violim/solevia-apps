/**
 * ─────────────────────────────────────────────────────────────────────────
 * v1.2 "BIG" — THE single balance/config module.
 * ─────────────────────────────────────────────────────────────────────────
 * Every tunable balance number for the v1.2 features lives here (coins, ad
 * cadence, streak table, skin prices, special-bubble rates, objectives, phases,
 * difficulty, achievements, daily challenge). One place to tune the economy.
 *
 * (Pop/combo game-FEEL tunables — particle counts, pitch, durations — live in
 * `juice.ts`. This file is the gameplay/economy balance.)
 */
export const CONFIG = {
  /** §1 Coins */
  coins: {
    timeAttackPerScore: 25, // Time Attack: coins = round(score / this)
    zenPerBubbles: 15, // Zen: ~1 coin per this many bubbles popped
  },

  /** §2/§3 Ads (test IDs are chosen in ads.ts; this is only cadence/behavior) */
  ads: {
    interstitial: {
      minRunsBetween: 3, // ≤ 1 interstitial per this many completed runs
      cooldownMs: 75_000, // …AND at least this long since the last one
      skipFirstRunOfSession: true, // never on the first run of a session
    },
    rewarded: {
      maxRevivesPerRun: 1, // Time Attack revive cap (tunable to 2)
      reviveSeconds: 15, // +time granted by a revive
      shopUnlock: "discount" as "discount" | "dayPass", // how the shop rewarded works
      shopDiscountPct: 0.5, // discount mode: fraction knocked off the price
      coinReward: 40, // §3 "watch a video → earn coins" (shop + between-phase)
      coinRewardMaxPerRun: 3, // between-phase earn-coins cap per run (anti-abuse)
    },
  },

  /** §5 Streaks — escalating coins by streak day (D1..D7), then repeats weekly. */
  streak: {
    coinTable: [20, 30, 45, 65, 90, 120, 175], // D1..D7; D7 is the weekly milestone
    freezeEnabled: true, // one missed day is forgiven…
    freezeRefreshDays: 7, // …and the freeze refreshes this often
  },

  /** §6 Shop prices by rarity. */
  skins: {
    prices: { common: 150, uncommon: 350, rare: 600, premium: 900, background: 250 },
    premiumStreakMilestone: 7, // premium skin also unlockable at this streak day
  },

  /** Consumable power-ups (Bombs, Time Freeze) — premium-priced (~2 runs each). */
  consumables: {
    prices: { bomb: 250, freeze: 300 },
    freezeMs: 2000, // Time Freeze extends the Time Attack countdown by this much
    bombRadiusFactor: 1.9, // used-item bomb blast: neighbours within size×this pop
  },

  /** §7 Special bubbles — spawn rate (fraction) + earliest phase. Zen scales down. */
  specials: {
    golden: { rate: 0.03, fromPhase: 1 },
    bomb: { rate: 0.02, fromPhase: 2 },
    // Mystery "?" bubble disabled — players found it unclear what it did. Set a
    // rate > 0 to bring it back (its reward logic in play.tsx still exists).
    mystery: { rate: 0, fromPhase: 2 },
    frozen: { rate: 0.03, fromPhase: 4, taps: 2 },
    chain: { rate: 0.015, fromPhase: 3, minLen: 3, maxLen: 5 },
    zenMultiplier: 0.15, // specials are rare in Zen (rate × this); 0 = off
    goldenBonusPoints: 25,
    goldenBonusCoins: 2,
    bombRadiusFactor: 1.6, // neighbours within size×this get popped
    mysteryRewards: ["coins", "time", "points"] as const,
  },

  /** §8 Objectives (Time Attack). */
  objectives: {
    minPerRun: 1,
    maxPerRun: 3,
    rewardMin: 15,
    rewardMax: 40,
  },

  /** §9 Phases & difficulty. */
  phases: {
    total: 8, // extended 5 → 8 (authored 6–8)
    endlessEnabled: true,
  },
  difficulty: {
    // multipliers applied to time / bubble size / spawn speed
    easy: { time: 1.25, size: 1.15, spawn: 0.85 },
    normal: { time: 1.0, size: 1.0, spawn: 1.0 },
    hard: { time: 0.8, size: 0.85, spawn: 1.25 },
  },

  /** §10 Achievements — default coin reward (per-achievement override in its list). */
  achievements: {
    defaultReward: 50,
  },

  /** §12 Daily challenge. */
  dailyChallenge: {
    bonusCoins: 40,
    historyLength: 14,
  },
} as const;

export type Difficulty = keyof typeof CONFIG.difficulty;
