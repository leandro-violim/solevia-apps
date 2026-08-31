/**
 * Objective cards (§8) — per-run goals (Pop Challenge) that create the Session
 * Loop. A run starts with 1–3, and every time one is COMPLETED it's replaced with
 * a fresh, harder goal (target raised above current progress), so there's always
 * something to chase. Each grants coins on completion.
 */
import { CONFIG } from "./config";
import { addCoins } from "./economy";
import { track } from "./analytics";
import { getRunStats, type RunStats } from "./run-stats";

export type Objective = {
  id: string;
  labelKey: string; // i18n key, interpolated with { n }
  n: number; // the target shown in the label
  reward: number; // coins
  done: (s: RunStats) => boolean;
  /** Current count toward `n` for a progress readout (null = a yes/no goal). */
  current: (s: RunStats) => number | null;
};

/** A goal family — its stat, first target, and how much harder each new one gets. */
type ObjType = {
  key: string;
  labelKey: string;
  stat: (s: RunStats) => number;
  base: number;
  step: (rand: () => number) => number;
  round?: number; // round the escalated target to a tidy multiple
};

const randInt = (min: number, max: number, rand: () => number) =>
  min + Math.floor(rand() * (max - min + 1));

const TYPES: ObjType[] = [
  {
    key: "pop",
    labelKey: "obj.pop",
    stat: (s) => s.popped,
    base: 40,
    step: (r) => randInt(20, 40, r),
    round: 10,
  },
  {
    key: "combo",
    labelKey: "obj.combo",
    stat: (s) => s.maxCombo,
    base: 12,
    step: (r) => randInt(4, 8, r),
  },
  {
    key: "golden",
    labelKey: "obj.golden",
    stat: (s) => s.goldenPopped,
    base: 4,
    step: (r) => randInt(2, 4, r),
  },
  { key: "phases", labelKey: "obj.phases", stat: (s) => s.phasesCleared, base: 3, step: () => 1 },
];

let seq = 0; // keeps ids unique even for the same type+target across a run

function makeObjective(type: ObjType, target: number, rand: () => number): Objective {
  seq += 1;
  return {
    id: `${type.key}-${target}-${seq}`,
    labelKey: type.labelKey,
    n: target,
    reward: randInt(CONFIG.objectives.rewardMin, CONFIG.objectives.rewardMax, rand),
    done: (s) => type.stat(s) >= target,
    current: (s) => type.stat(s),
  };
}

/** Pick 1–3 starting objectives for a run (each type at its base target). */
export function rollObjectives(rand: () => number = Math.random): Objective[] {
  const count = randInt(CONFIG.objectives.minPerRun, CONFIG.objectives.maxPerRun, rand);
  const shuffled = [...TYPES].sort(() => rand() - 0.5).slice(0, count);
  return shuffled.map((t) => makeObjective(t, t.base, rand));
}

/**
 * A fresh, harder goal to REPLACE a just-completed one — target set above current
 * progress (so it's never already done), preferring a family not already active so
 * the set stays varied. Retries a few times, then falls back to a big pop goal.
 */
export function nextObjective(active: Objective[], rand: () => number = Math.random): Objective {
  const s = getRunStats();
  const activeKeys = new Set(active.map((o) => o.id.split("-")[0]));
  for (let attempt = 0; attempt < 8; attempt++) {
    const avail = attempt < 4 ? TYPES.filter((t) => !activeKeys.has(t.key)) : TYPES;
    const pool = avail.length > 0 ? avail : TYPES;
    const type = pool[Math.floor(rand() * pool.length)];
    let target = type.stat(s) + type.step(rand);
    if (type.round) target = Math.ceil(target / type.round) * type.round;
    target = Math.max(type.base, target);
    const obj = makeObjective(type, target, rand);
    if (!obj.done(s)) return obj; // never hand back an already-complete goal
  }
  return makeObjective(TYPES[0], Math.ceil((s.popped + 40) / 10) * 10, rand);
}

/**
 * Check the run's objectives against live stats. Marks newly-completed ones in
 * `completed` (mutated), grants their coins, logs, and returns them for a toast.
 */
export function checkObjectives(objectives: Objective[], completed: Set<string>): Objective[] {
  const s = getRunStats();
  const newly: Objective[] = [];
  for (const o of objectives) {
    if (!completed.has(o.id) && o.done(s)) {
      completed.add(o.id);
      addCoins(o.reward, `objective:${o.id}`);
      track("objective_completed", { objective_id: o.id, coins: o.reward });
      newly.push(o);
    }
  }
  return newly;
}
