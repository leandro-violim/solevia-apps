import { type Difficulty } from "../ai/policy";

// A phase can award a cosmetic on completion (pitch surface or audio pack). The
// itemId matches a CATALOG entry so ownership + previews reuse the economy code.
export type PhaseReward = { type: "pitch" | "audio"; styleId: string; itemId: string };

export type CampaignLevel = {
  id: string;
  name: string; // shown as-is (rank names read across locales)
  difficulty: Difficulty;
  goalsToWin: number;
  reward?: PhaseReward;
};

// Difficulty ramps in runs — easy → normal → hard — and rewards (pitch surfaces +
// audio packs) drop every couple of phases so there's always a next thing to earn.
export const LEVELS: CampaignLevel[] = [
  { id: "l1", name: "Rookie", difficulty: "easy", goalsToWin: 3 },
  { id: "l2", name: "Amateur", difficulty: "easy", goalsToWin: 3, reward: { type: "pitch", styleId: "table", itemId: "pitch-table" } },
  { id: "l3", name: "Prospect", difficulty: "easy", goalsToWin: 3 },
  { id: "l4", name: "Regular", difficulty: "normal", goalsToWin: 3, reward: { type: "audio", styleId: "crowd", itemId: "audio-crowd" } },
  { id: "l5", name: "Starter", difficulty: "normal", goalsToWin: 3 },
  { id: "l6", name: "Veteran", difficulty: "normal", goalsToWin: 5, reward: { type: "pitch", styleId: "cement", itemId: "pitch-cement" } },
  { id: "l7", name: "Captain", difficulty: "normal", goalsToWin: 5, reward: { type: "audio", styleId: "commentary", itemId: "audio-commentary" } },
  { id: "l8", name: "Pro", difficulty: "hard", goalsToWin: 5, reward: { type: "pitch", styleId: "night", itemId: "pitch-night" } },
  { id: "l9", name: "All-Star", difficulty: "hard", goalsToWin: 5 },
  { id: "l10", name: "Elite", difficulty: "hard", goalsToWin: 5, reward: { type: "audio", styleId: "stadium", itemId: "audio-stadium" } },
  { id: "l11", name: "Ace", difficulty: "hard", goalsToWin: 5 },
  { id: "l12", name: "Star", difficulty: "hard", goalsToWin: 5, reward: { type: "pitch", styleId: "street", itemId: "pitch-street" } },
  { id: "l13", name: "Legend", difficulty: "hard", goalsToWin: 7 },
  { id: "l14", name: "Champion", difficulty: "hard", goalsToWin: 7, reward: { type: "pitch", styleId: "beach", itemId: "pitch-beach" } },
];

export type CampaignProgress = { completed: string[] };
export const initialProgress = (): CampaignProgress => ({ completed: [] });

export const levelIndex = (id: string): number => LEVELS.findIndex((l) => l.id === id);
export const levelById = (id: string): CampaignLevel | undefined => LEVELS.find((l) => l.id === id);
export const levelReward = (id: string): PhaseReward | undefined => levelById(id)?.reward;

export const isCompleted = (id: string, p: CampaignProgress): boolean => p.completed.includes(id);

export const isUnlocked = (id: string, p: CampaignProgress): boolean => {
  const i = levelIndex(id);
  if (i < 0) return false;
  if (i === 0) return true;
  return isCompleted(LEVELS[i - 1].id, p);
};

export const completeLevel = (id: string, p: CampaignProgress): CampaignProgress => {
  if (levelIndex(id) < 0 || isCompleted(id, p)) return p;
  return { completed: [...p.completed, id] };
};

export const nextLevelId = (id: string): string | null => {
  const i = levelIndex(id);
  return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
};

/** The last phase — clearing it completes the whole ladder. */
export const LAST_LEVEL_ID = LEVELS[LEVELS.length - 1].id;

/**
 * Reward item ids the player has EARNED (their phase is completed) but that are not
 * in `owned` yet. Used to backfill inventory for saves that cleared a phase before
 * its reward existed — so ownership always matches campaign progress and the reward
 * road doesn't dangle an already-passed prize as "next".
 */
export const missingRewardItems = (
  completed: readonly string[],
  owned: readonly string[],
): string[] => {
  const out: string[] = [];
  for (const l of LEVELS) {
    if (l.reward && completed.includes(l.id) && !owned.includes(l.reward.itemId)) {
      out.push(l.reward.itemId);
    }
  }
  return out;
};

/**
 * The nearest phase AFTER `afterId` that awards something the player hasn't earned
 * yet — the "up next" carrot shown on the win screen. Null if nothing's left.
 */
export const upcomingReward = (
  afterId: string,
  ownedItemIds: readonly string[],
): { level: CampaignLevel; index: number; reward: PhaseReward } | null => {
  const start = levelIndex(afterId);
  if (start < 0) return null;
  for (let i = start + 1; i < LEVELS.length; i++) {
    const r = LEVELS[i].reward;
    if (r && !ownedItemIds.includes(r.itemId)) return { level: LEVELS[i], index: i, reward: r };
  }
  return null;
};
