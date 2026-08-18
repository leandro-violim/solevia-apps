import { describe, it, expect } from "vitest";
import { capAtPoint, swipeToVelocity, flickToVelocity, type FlickSample } from "./input-mapping";
import { vec, len } from "./physics/vec";

const caps = [
  { id: "a", position: vec(100, 100), radius: 16 },
  { id: "b", position: vec(200, 100), radius: 16 },
];

describe("capAtPoint", () => {
  it("returns the cap whose circle contains the point", () => {
    expect(capAtPoint(vec(105, 100), caps)).toBe("a");
    expect(capAtPoint(vec(200, 108), caps)).toBe("b");
  });
  it("returns null when no cap contains the point", () => {
    expect(capAtPoint(vec(150, 100), caps)).toBeNull();
  });
  it("picks the nearest center when circles overlap the point", () => {
    const tight = [
      { id: "a", position: vec(100, 100), radius: 40 },
      { id: "b", position: vec(130, 100), radius: 40 },
    ];
    expect(capAtPoint(vec(122, 100), tight)).toBe("b"); // 8 from b, 22 from a
  });
});

describe("swipeToVelocity", () => {
  const opts = { power: 5, maxSpeed: 2400, minSpeed: 100 };
  it("points in the swipe direction", () => {
    const v = swipeToVelocity(vec(0, 0), vec(10, 0), opts);
    expect(v.y).toBe(0);
    expect(v.x).toBeGreaterThan(0);
  });
  it("scales magnitude with swipe length, clamped to maxSpeed", () => {
    const small = len(swipeToVelocity(vec(0, 0), vec(40, 0), opts)); // 40*5=200
    expect(small).toBeCloseTo(200, 4);
    const big = len(swipeToVelocity(vec(0, 0), vec(1000, 0), opts)); // 5000 -> clamped
    expect(big).toBeCloseTo(2400, 4);
  });
  it("floors a tiny non-zero swipe to minSpeed", () => {
    const v = len(swipeToVelocity(vec(0, 0), vec(2, 0), opts)); // 2*5=10 -> min 100
    expect(v).toBeCloseTo(100, 4);
  });
  it("returns zero for a zero-length swipe", () => {
    expect(swipeToVelocity(vec(5, 5), vec(5, 5), opts)).toEqual({ x: 0, y: 0 });
  });
});

describe("flickToVelocity", () => {
  const opts = { gain: 1, maxSpeed: 2600, minSpeed: 200, windowMs: 70 };
  // Build a straight flick: `dist` pitch units over `dtMs`, sampled every step.
  const flick = (dist: number, dtMs: number, steps = 4): FlickSample[] => {
    const s: FlickSample[] = [];
    for (let i = 0; i <= steps; i++) {
      s.push({ pos: vec((dist * i) / steps, 0), t: (dtMs * i) / steps });
    }
    return s;
  };

  it("launches in the flick direction", () => {
    const v = flickToVelocity([{ pos: vec(0, 0), t: 0 }, { pos: vec(0, 30), t: 20 }], opts)!;
    expect(v.x).toBe(0);
    expect(v.y).toBeGreaterThan(0);
  });

  it("sends the cap faster the quicker the flick (same distance)", () => {
    const quick = len(flickToVelocity(flick(120, 40), opts)!); // 120u / 0.04s = 3000 -> clamped 2600
    const slow = len(flickToVelocity(flick(120, 300), opts)!); // 120u / 0.3s  = 400
    expect(quick).toBeGreaterThan(slow);
    expect(quick).toBeCloseTo(2600, 3); // clamped to maxSpeed
    expect(slow).toBeCloseTo(400, 0);
  });

  it("ignores a soft/slow drag below the dead zone (returns null)", () => {
    expect(flickToVelocity(flick(20, 300), opts)).toBeNull(); // ~67 u/s < 200
  });

  it("measures only the recent tail (a slow start then a fast snap still launches hard)", () => {
    // Dawdle for 500ms, then snap 100u in the last 20ms.
    const samples: FlickSample[] = [
      { pos: vec(0, 0), t: 0 },
      { pos: vec(5, 0), t: 480 },
      { pos: vec(55, 0), t: 490 },
      { pos: vec(105, 0), t: 500 },
    ];
    const v = len(flickToVelocity(samples, opts)!);
    expect(v).toBeGreaterThan(2000); // the fast tail dominates, not the 500ms average
  });

  it("returns null without enough samples or motion", () => {
    expect(flickToVelocity([{ pos: vec(0, 0), t: 0 }], opts)).toBeNull();
    expect(
      flickToVelocity([{ pos: vec(3, 3), t: 0 }, { pos: vec(3, 3), t: 20 }], opts),
    ).toBeNull();
  });

  it("applies gain to the measured speed", () => {
    const half = len(flickToVelocity(flick(60, 100), { ...opts, gain: 0.5 })!); // 600*0.5=300
    expect(half).toBeCloseTo(300, 0);
  });
});
