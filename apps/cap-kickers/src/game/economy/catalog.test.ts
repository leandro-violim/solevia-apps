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
      // progress or coins — both are earnable without paying money; no ad-only route.
      expect(["progress", "coins"]).toContain(item.unlock.kind);
    }
  });

  it("progress gates map to the right campaign levels", () => {
    expect(progressSatisfied("beat-veteran", [])).toBe(false);
    expect(progressSatisfied("beat-veteran", ["l1", "l4"])).toBe(true);
    expect(progressSatisfied("campaign-complete", ["l4", "l5"])).toBe(false);
    expect(progressSatisfied("campaign-complete", ["l6"])).toBe(true);
  });

  it("coins items unlock via ownership; progress items via completion", () => {
    const night = itemById("pitch-night")!;
    const beach = itemById("pitch-beach")!;
    expect(isItemUnlocked(night, [], [])).toBe(false);
    expect(isItemUnlocked(night, [], ["l4"])).toBe(true); // progress
    expect(isItemUnlocked(beach, [], [])).toBe(false);
    expect(isItemUnlocked(beach, ["pitch-beach"], [])).toBe(true); // bought
  });

  it("base styles are always equippable; catalog styles gate on unlock", () => {
    expect(isStyleEquippable("pitch", "grass", [], [])).toBe(true); // base — no catalog entry
    expect(isStyleEquippable("cap", "soda-blue", [], [])).toBe(true); // base
    expect(isStyleEquippable("pitch", "night", [], [])).toBe(false); // locked
    expect(isStyleEquippable("pitch", "night", [], ["l4"])).toBe(true); // progress met
    expect(isStyleEquippable("cap", "metal-red", [], [])).toBe(false);
    expect(isStyleEquippable("cap", "metal-red", ["cap-metal-red"], [])).toBe(true); // bought
  });

  it("audio packs gate on unlock", () => {
    expect(isAudioPackUnlocked("crowd", [], [])).toBe(false);
    expect(isAudioPackUnlocked("crowd", ["audio-crowd"], [])).toBe(true);
    expect(isAudioPackUnlocked("nope", [], [])).toBe(false); // unknown pack
  });
});
