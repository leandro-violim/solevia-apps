import { describe, it, expect } from "vitest";
import { PITCH_STYLES, DEFAULT_PITCH_STYLE, pitchStyleById } from "./styles";

describe("pitch styles", () => {
  it("has unique ids and a valid default", () => {
    const ids = PITCH_STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_PITCH_STYLE);
  });

  it("every style has complete fields", () => {
    for (const s of PITCH_STYLES) {
      expect(s.name.length).toBeGreaterThan(0);
      for (const hex of [s.base, s.base2, s.edge, s.line]) {
        expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
      expect(s.lineAlpha).toBeGreaterThan(0);
      expect(s.lineAlpha).toBeLessThanOrEqual(1);
      expect(["stripes", "wood", "concrete"]).toContain(s.texture);
    }
  });

  it("pitchStyleById falls back to the first style for an unknown id", () => {
    expect(pitchStyleById("nope")).toBe(PITCH_STYLES[0]);
    expect(pitchStyleById(PITCH_STYLES[1].id).id).toBe(PITCH_STYLES[1].id);
  });
});
