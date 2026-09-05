import { describe, it, expect } from "vitest";
import {
  CATALOG,
  itemById,
  itemsByType,
  progressSatisfied,
  isItemUnlocked,
  isStyleEquippable,
  isAudioPackUnlocked,
} from "./catalog";

describe("catalog", () => {
  it("has unique ids and unique style ids per type", () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const type of ["pitch", "cap", "audio"] as const) {
      const styleIds = itemsByType(type).map((i) => i.styleId);
      expect(new Set(styleIds).size).toBe(styleIds.length);
    }
  });

  it("every coins item has a positive cost; every route is play-only (no ad-only item)", () => {
    for (const item of CATALOG) {
      if (item.unlock.kind === "coins") expect(item.unlock.cost).toBeGreaterThan(0);
      // progress, coins, or reward — all earnable by playing; no ad-only route.
      expect(["progress", "coins", "reward"]).toContain(item.unlock.kind);
    }
  });

  it("progress gates map to the right campaign levels", () => {
    expect(progressSatisfied("beat-veteran", [])).toBe(false);
    expect(progressSatisfied("beat-veteran", ["l1", "l6"])).toBe(true); // Veteran = l6
    expect(progressSatisfied("campaign-complete", ["l6", "l7"])).toBe(false);
    expect(progressSatisfied("campaign-complete", ["l14"])).toBe(true); // final phase
  });

  it("reward items unlock via ownership; progress items via completion", () => {
    const night = itemById("pitch-night")!; // awarded phase reward
    const legend = itemById("cap-gold-legendary")!; // campaign-complete progress
    expect(isItemUnlocked(night, [], [])).toBe(false);
    expect(isItemUnlocked(night, ["pitch-night"], [])).toBe(true); // awarded
    expect(isItemUnlocked(legend, [], [])).toBe(false);
    expect(isItemUnlocked(legend, [], ["l14"])).toBe(true); // progress
  });

  it("base styles are always equippable; catalog styles gate on unlock", () => {
    expect(isStyleEquippable("pitch", "grass", [], [])).toBe(true); // base — no catalog entry
    expect(isStyleEquippable("cap", "soda-blue", [], [])).toBe(true); // base
    expect(isStyleEquippable("pitch", "night", [], [])).toBe(false); // locked
    expect(isStyleEquippable("pitch", "night", ["pitch-night"], [])).toBe(true); // awarded
    expect(isStyleEquippable("cap", "metal-red", [], [])).toBe(false);
    expect(isStyleEquippable("cap", "metal-red", ["cap-metal-red"], [])).toBe(true); // bought
  });

  it("audio packs gate on unlock", () => {
    expect(isAudioPackUnlocked("crowd", [], [])).toBe(false);
    expect(isAudioPackUnlocked("crowd", ["audio-crowd"], [])).toBe(true);
    expect(isAudioPackUnlocked("nope", [], [])).toBe(false); // unknown pack
  });
});
