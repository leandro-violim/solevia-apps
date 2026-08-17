import { type Difficulty } from "../ai/policy";

export type CampaignLevel = {
  id: string;
  name: string;
  difficulty: Difficulty;
  goalsToWin: number;
};

export const LEVELS: CampaignLevel[] = [
  { id: "l1", name: "Rookie", difficulty: "easy", goalsToWin: 3 },
  { id: "l2", name: "Amateur", difficulty: "easy", goalsToWin: 3 },
  { id: "l3", name: "Regular", difficulty: "normal", goalsToWin: 3 },
  { id: "l4", name: "Veteran", difficulty: "normal", goalsToWin: 5 },
  { id: "l5", name: "Pro", difficulty: "hard", goalsToWin: 5 },
  { id: "l6", name: "Champion", difficulty: "hard", goalsToWin: 5 },
];

export type CampaignProgress = { completed: string[] };
export const initialProgress = (): CampaignProgress => ({ completed: [] });

export const levelIndex = (id: string): number => LEVELS.findIndex((l) => l.id === id);
export const levelById = (id: string): CampaignLevel | undefined => LEVELS.find((l) => l.id === id);

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
