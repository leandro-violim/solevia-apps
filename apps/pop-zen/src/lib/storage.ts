/**
 * ─────────────────────────────────────────────────────────────────────────
 * v1.2 player state — the ONE persistence module.
 * ─────────────────────────────────────────────────────────────────────────
 * All new v1.2 player state (coins, streak, owned/equipped skins, achievements,
 * stats, daily challenge) lives in a single VERSIONED document in localStorage,
 * behind this module. A future cloud sync can replace `load`/`save` without any
 * caller changing. `SCHEMA_VERSION` + `migrate()` handle forward migrations.
 *
 * (Legacy `records.ts` / `settings.ts` keep their own keys for now — safe to
 * fold in later; they're intentionally left untouched to avoid regressions.)
 */

const KEY = "zen-player-state";
const SCHEMA_VERSION = 1;

export type StreakState = {
  lastBonusDate: string | null; // YYYY-MM-DD of the last claimed/seen day
  consecutiveDays: number;
  freezeAvailable: boolean; // one-miss forgiveness token
  freezeWeek: string | null; // ISO week the freeze was last refreshed
};

export type SkinsState = {
  owned: string[]; // owned bubble-skin ids
  equippedSkin: string;
};

export type AchievementsState = {
  unlocked: string[]; // achievement ids
  progress: Record<string, number>; // id → current progress value
};

export type StatsState = {
  totalPopped: number;
  totalRuns: number;
  goldenPopped: number;
  bestCombo: number;
  revivesUsed: number;
  skinsOwned: number; // convenience mirror for the "own 3 skins" achievement
};

export type DailyChallengeState = {
  lastDate: string | null;
  bestToday: number;
  history: { date: string; best: number }[];
};

/** Owned consumable power-ups (Bombs, Time Freeze) — bought with coins, used mid-stage. */
export type InventoryState = {
  bomb: number;
  freeze: number;
};

export type PlayerState = {
  version: number;
  coins: number;
  streak: StreakState;
  skins: SkinsState;
  achievements: AchievementsState;
  stats: StatsState;
  dailyChallenge: DailyChallengeState;
  inventory: InventoryState;
};

function defaults(): PlayerState {
  return {
    version: SCHEMA_VERSION,
    coins: 0,
    streak: {
      lastBonusDate: null,
      consecutiveDays: 0,
      freezeAvailable: true,
      freezeWeek: null,
    },
    skins: {
      owned: ["skin-classic"],
      equippedSkin: "skin-classic",
    },
    achievements: { unlocked: [], progress: {} },
    stats: {
      totalPopped: 0,
      totalRuns: 0,
      goldenPopped: 0,
      bestCombo: 0,
      revivesUsed: 0,
      skinsOwned: 1,
    },
    dailyChallenge: { lastDate: null, bestToday: 0, history: [] },
    inventory: { bomb: 0, freeze: 0 },
  };
}

/** Forward-migrate an older document to the current schema. */
function migrate(raw: Partial<PlayerState> | null): PlayerState {
  const base = defaults();
  if (!raw || typeof raw !== "object") return base;
  // Deep-ish merge: keep known keys, fill missing with defaults. Future versions
  // add explicit `if (raw.version < N) { … }` steps here.
  return {
    version: SCHEMA_VERSION,
    coins: typeof raw.coins === "number" ? raw.coins : base.coins,
    streak: { ...base.streak, ...(raw.streak ?? {}) },
    skins: { ...base.skins, ...(raw.skins ?? {}) },
    achievements: { ...base.achievements, ...(raw.achievements ?? {}) },
    stats: { ...base.stats, ...(raw.stats ?? {}) },
    dailyChallenge: { ...base.dailyChallenge, ...(raw.dailyChallenge ?? {}) },
    inventory: { ...base.inventory, ...(raw.inventory ?? {}) },
  };
}

let cache: PlayerState | null = null;

export function load(): PlayerState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = migrate(raw ? (JSON.parse(raw) as Partial<PlayerState>) : null);
  } catch {
    cache = defaults();
  }
  return cache;
}

export function save(state: PlayerState): void {
  cache = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage disabled — state stays in-memory for the session */
  }
}

/** Read-modify-write helper: mutate the draft, it's persisted + returned. */
export function update(mutate: (draft: PlayerState) => void): PlayerState {
  const next = load();
  mutate(next);
  save(next);
  return next;
}

/** Wipe all v1.2 player state (used by the dev "reset" helper). */
export function resetPlayerState(): void {
  cache = defaults();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
