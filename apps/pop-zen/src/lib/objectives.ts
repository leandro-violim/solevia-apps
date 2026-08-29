/**
 * Objective cards (§8) — 1–3 optional per-run goals (Time Attack) that create the
 * Session Loop. Drawn from a pool, they vary each run, track live off run-stats,
 * and grant coins on completion.
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
};

type ObjectiveTemplate = Omit<Objective, "reward">;

const POOL: ObjectiveTemplate[] = [
  { id: "pop40", labelKey: "obj.pop", n: 40, done: (s) => s.popped >= 40 },
  { id: "combo15", labelKey: "obj.combo", n: 15, done: (s) => s.maxCombo >= 15 },
  { id: "golden5", labelKey: "obj.golden", n: 5, done: (s) => s.goldenPopped >= 5 },
  { id: "phases3", labelKey: "obj.phases", n: 3, done: (s) => s.phasesCleared >= 3 },
  { id: "fast8", labelKey: "obj.fast", n: 8, done: (s) => s.fastestPhaseMs <= 8000 },
];

const randInt = (min: number, max: number, rand: () => number) =>
  min + Math.floor(rand() * (max - min + 1));

/** Pick 1–3 objectives for a run, each with a randomized coin reward. */
export function rollObjectives(rand: () => number = Math.random): Objective[] {
  const count = randInt(CONFIG.objectives.minPerRun, CONFIG.objectives.maxPerRun, rand);
  const shuffled = [...POOL].sort(() => rand() - 0.5).slice(0, count);
  return shuffled.map((o) => ({
    ...o,
    reward: randInt(CONFIG.objectives.rewardMin, CONFIG.objectives.rewardMax, rand),
  }));
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
      track("objective_completed", { id: o.id, reward: o.reward });
      newly.push(o);
    }
  }
  return newly;
}
