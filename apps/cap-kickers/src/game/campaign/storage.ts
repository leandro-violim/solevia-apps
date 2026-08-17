import { type CampaignProgress, initialProgress } from "./ladder";

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.campaign.v1";

const defaultStorage = (): StorageLike | null => {
  try {
    // localStorage access can throw in sandboxed/SSR contexts.
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
      return (globalThis as { localStorage: StorageLike }).localStorage;
    }
  } catch {
    /* fall through */
  }
  return null;
};

const isValid = (v: unknown): v is CampaignProgress =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as { completed?: unknown }).completed) &&
  (v as { completed: unknown[] }).completed.every((x) => typeof x === "string");

export const loadProgress = (storage: StorageLike | null = defaultStorage()): CampaignProgress => {
  if (!storage) return initialProgress();
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return initialProgress();
    const parsed: unknown = JSON.parse(raw);
    if (isValid(parsed)) return { completed: [...parsed.completed] };
  } catch {
    /* corrupt -> reset */
  }
  return initialProgress();
};

export const saveProgress = (
  p: CampaignProgress,
  storage: StorageLike | null = defaultStorage(),
): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota/full/blocked -> ignore */
  }
};
