/**
 * Achievements (§10) — ~10 one-time goals with coin rewards. They read the
 * cumulative player stats (storage) + streak, unlock once, grant coins, and log.
 * checkAchievements() is called at natural moments (run end, daily claim, skin
 * unlock) and returns the newly-unlocked ones for a toast.
 */
import { load, update } from "./storage";
import { addCoins } from "./economy";
import { track } from "./analytics";

export type AchStats = {
  totalPopped: number;
  goldenPopped: number;
  bestCombo: number;
  revivesUsed: number;
  skinsOwned: number;
  streak: number;
};

export function achStats(): AchStats {
  const s = load();
  return {
    totalPopped: s.stats.totalPopped,
    goldenPopped: s.stats.goldenPopped,
    bestCombo: s.stats.bestCombo,
    revivesUsed: s.stats.revivesUsed,
    skinsOwned: s.stats.skinsOwned,
    streak: s.streak.consecutiveDays,
  };
}

export type Achievement = {
  id: string;
  labelKey: string; // i18n, interpolated with { n: goal }
  goal: number;
  reward: number; // coins
  value: (s: AchStats) => number; // current progress value
};

// Note vs packet: "no-miss run" + "clear all phases" need stats we don't track
// yet — substituted with pop-500 and combo-50 (both existing stats). Easy swap
// once those signals land.
export const ACHIEVEMENTS: Achievement[] = [
  { id: "pop500", labelKey: "ach.pop", goal: 500, reward: 50, value: (s) => s.totalPopped },
  { id: "pop1k", labelKey: "ach.pop", goal: 1000, reward: 80, value: (s) => s.totalPopped },
  { id: "pop10k", labelKey: "ach.pop", goal: 10000, reward: 300, value: (s) => s.totalPopped },
  { id: "streak7", labelKey: "ach.streak", goal: 7, reward: 100, value: (s) => s.streak },
  { id: "streak30", labelKey: "ach.streak", goal: 30, reward: 500, value: (s) => s.streak },
  { id: "combo25", labelKey: "ach.combo", goal: 25, reward: 80, value: (s) => s.bestCombo },
  { id: "combo50", labelKey: "ach.combo", goal: 50, reward: 150, value: (s) => s.bestCombo },
  { id: "golden100", labelKey: "ach.golden", goal: 100, reward: 200, value: (s) => s.goldenPopped },
  { id: "skins3", labelKey: "ach.skins", goal: 3, reward: 100, value: (s) => s.skinsOwned },
  { id: "revive1", labelKey: "ach.revive", goal: 1, reward: 60, value: (s) => s.revivesUsed },
];

export function isUnlocked(id: string): boolean {
  return load().achievements.unlocked.includes(id);
}

/** 0..1 progress toward an achievement (for the screen's bars). */
export function progressOf(a: Achievement): number {
  return Math.min(1, a.value(achStats()) / a.goal);
}

/** Unlock any newly-earned achievements: grant coins, log, return them. */
export function checkAchievements(): Achievement[] {
  const s = achStats();
  const unlocked = load().achievements.unlocked;
  const newly: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.includes(a.id) && a.value(s) >= a.goal) {
      update((st) => {
        st.achievements.unlocked.push(a.id);
      });
      addCoins(a.reward, `achievement:${a.id}`);
      track("achievement_unlocked", { id: a.id, reward: a.reward });
      newly.push(a);
      // Global toast (a listener lives in the root layout).
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zen-achievement", { detail: a }));
      }
    }
  }
  return newly;
}
