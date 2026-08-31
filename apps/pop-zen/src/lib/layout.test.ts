import { describe, it, expect } from "vitest";
import { layoutBubbles } from "./layout";

// Deterministic: (0.5 - 0.5) => zero jitter, so positions are exact.
const noJitter = () => 0.5;

describe("layoutBubbles", () => {
  it("returns exactly `count` bubbles with unique 0..n-1 ids", () => {
    const b = layoutBubbles(32, 62, 360, 640, noJitter);
    expect(b).toHaveLength(32);
    expect(new Set(b.map((x) => x.id)).size).toBe(32);
    expect(b.map((x) => x.id)).toEqual([...Array(32).keys()]);
  });

  it("keeps every bubble inside a roomy field (spread mode)", () => {
    const w = 800;
    const h = 600;
    const b = layoutBubbles(10, 40, w, h, noJitter);
    for (const bub of b) {
      expect(bub.x).toBeGreaterThanOrEqual(0);
      expect(bub.y).toBeGreaterThanOrEqual(0);
      expect(bub.x + bub.size).toBeLessThanOrEqual(w + 0.01);
      expect(bub.y + bub.size).toBeLessThanOrEqual(h + 0.01);
    }
  });

  it("preserves the requested bubble size and starts all un-popped", () => {
    const b = layoutBubbles(20, 82, 360, 640, noJitter);
    expect(b.every((x) => x.size === 82)).toBe(true);
    expect(b.every((x) => x.popped === false)).toBe(true);
  });

  it("is deterministic for a fixed rand", () => {
    const a = layoutBubbles(15, 50, 400, 500, noJitter);
    const c = layoutBubbles(15, 50, 400, 500, noJitter);
    expect(a).toEqual(c);
  });

  it("keeps bubbles in-bounds even at full round-2 jitter", () => {
    const w = 400;
    const h = 700;
    const size = 48;
    // rand()=>1 pushes every jitter to its positive maximum; =>0 to its minimum.
    for (const rand of [() => 1, () => 0]) {
      const b = layoutBubbles(20, size, w, h, rand, { phase: 3, specialsMul: 0, jitter: 1 });
      for (const bub of b) {
        // Allow the tiny baseline (~2.4px) jitter slack beyond the cell edge.
        expect(bub.x).toBeGreaterThanOrEqual(-3);
        expect(bub.y).toBeGreaterThanOrEqual(-3);
        expect(bub.x + size).toBeLessThanOrEqual(w + 3);
        expect(bub.y + size).toBeLessThanOrEqual(h + 3);
      }
    }
  });

  it("does not throw on a zero-size field", () => {
    expect(() => layoutBubbles(10, 40, 0, 0, noJitter)).not.toThrow();
    expect(layoutBubbles(10, 40, 0, 0, noJitter)).toHaveLength(10);
  });
});
