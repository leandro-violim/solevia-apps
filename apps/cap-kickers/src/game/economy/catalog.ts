// The catalog of UNLOCKABLE cosmetics — every collectible the Cabinet shows.
// Cosmetics only: nothing here gates the core loop (REWARDS-AND-AUDIO-PLAN.md §1).
// Base styles (grass/school pitches, the starter caps) are free and are NOT listed
// here — they need no unlock. This file holds only the earned ones (awarded pitch +
// audio rewards, the coins-bought caps, and the campaign-trophy gold cap).
//
// Pure data + pure predicates. It takes the player's owned ids and completed
// campaign level ids as plain arrays, so it never imports storage and stays
// trivially testable.

import { LAST_LEVEL_ID } from "../campaign/ladder";

export type ItemType = "pitch" | "cap" | "audio";

/** A play-only progress gate. `campaign-complete` = clear the final phase. */
export type ProgressReq = "beat-veteran" | "campaign-complete";

export type Unlock =
  | { kind: "progress"; requires: ProgressReq } // free + automatic when the condition is met
  | { kind: "reward" } // AWARDED for completing a phase (tracked in inventory)
  | { kind: "coins"; cost: number }; // bought with earned Caps

export type Item = {
  id: string; // stable analytics/inventory id — never reuse or rename once shipped
  type: ItemType;
  styleId: string; // pitch/cap style id to equip, or the audio pack id
  unlock: Unlock;
};

export const CATALOG: Item[] = [
  // Pitch surfaces — AWARDED as you clear phases (see ladder.ts rewards).
  { id: "pitch-table", type: "pitch", styleId: "table", unlock: { kind: "reward" } },
  { id: "pitch-cement", type: "pitch", styleId: "cement", unlock: { kind: "reward" } },
  { id: "pitch-night", type: "pitch", styleId: "night", unlock: { kind: "reward" } },
  { id: "pitch-street", type: "pitch", styleId: "street", unlock: { kind: "reward" } },
  { id: "pitch-beach", type: "pitch", styleId: "beach", unlock: { kind: "reward" } },
  // Audio packs — also AWARDED by phases (the synth engine stays the free baseline).
  { id: "audio-crowd", type: "audio", styleId: "crowd", unlock: { kind: "reward" } },
  { id: "audio-stadium", type: "audio", styleId: "stadium", unlock: { kind: "reward" } },
  // Caps — the realistic metal set (six colourways) + the legendary gold. Still the
  // earned-Caps (coins) economy in the Cabinet; the legendary is the campaign trophy.
  { id: "cap-metal-silver", type: "cap", styleId: "metal-silver", unlock: { kind: "coins", cost: 150 } },
  { id: "cap-metal-red", type: "cap", styleId: "metal-red", unlock: { kind: "coins", cost: 150 } },
  { id: "cap-metal-blue", type: "cap", styleId: "metal-blue", unlock: { kind: "coins", cost: 150 } },
  { id: "cap-metal-green", type: "cap", styleId: "metal-green", unlock: { kind: "coins", cost: 150 } },
  { id: "cap-metal-orange", type: "cap", styleId: "metal-orange", unlock: { kind: "coins", cost: 150 } },
  { id: "cap-metal-purple", type: "cap", styleId: "metal-purple", unlock: { kind: "coins", cost: 150 } },
  { id: "cap-gold-legendary", type: "cap", styleId: "gold-legendary", unlock: { kind: "progress", requires: "campaign-complete" } },
];

export const itemById = (id: string): Item | undefined => CATALOG.find((i) => i.id === id);
export const itemsByType = (type: ItemType): Item[] => CATALOG.filter((i) => i.type === type);

/** Whether a campaign progress requirement is met, given the completed level ids. */
export const progressSatisfied = (req: ProgressReq, completed: readonly string[]): boolean =>
  req === "beat-veteran" ? completed.includes("l6") : completed.includes(LAST_LEVEL_ID);

/**
 * Is an item unlocked? Progress items are automatic once their campaign condition
 * is met; reward + coins items are unlocked once earned/bought (present in `owned`).
 */
export const isItemUnlocked = (item: Item, owned: readonly string[], completed: readonly string[]): boolean =>
  item.unlock.kind === "progress"
    ? progressSatisfied(item.unlock.requires, completed)
    : owned.includes(item.id);

/**
 * Can this pitch/cap style be equipped right now? True for any base style (no
 * catalog entry) and for an unlocked catalog style. The style pickers use this to
 * hide still-locked styles, so an unlock actually means something.
 */
export const isStyleEquippable = (
  type: "pitch" | "cap",
  styleId: string,
  owned: readonly string[],
  completed: readonly string[],
): boolean => {
  const item = CATALOG.find((i) => i.type === type && i.styleId === styleId);
  return item ? isItemUnlocked(item, owned, completed) : true;
};

/** Is an audio pack unlocked? (Used by the sample layer — samples only play when owned.) */
export const isAudioPackUnlocked = (
  packId: string,
  owned: readonly string[],
  completed: readonly string[],
): boolean => {
  const item = CATALOG.find((i) => i.type === "audio" && i.styleId === packId);
  return item ? isItemUnlocked(item, owned, completed) : false;
};
