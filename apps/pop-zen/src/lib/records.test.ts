import { describe, it, expect } from "vitest";
import { parseStoredRecords, applyRun, type RecordsMap } from "./records";

describe("parseStoredRecords", () => {
  it("returns empty records for null / missing storage", () => {
    const r = parseStoredRecords(null);
    expect(r[1].bestScore).toBe(0);
    expect(r[1].bestTimeMs).toBe(0);
  });

  it("returns empty records for corrupt JSON instead of throwing", () => {
    expect(() => parseStoredRecords("{not json")).not.toThrow();
    expect(parseStoredRecords("{not json")[1].bestScore).toBe(0);
  });

  it("migrates a legacy v1 bare map (no envelope) without data loss", () => {
    const legacy = JSON.stringify({
      1: {
        bestScore: 500,
        bestTimeMs: 4200,
        lastScore: 500,
        lastTimeMs: 4200,
        prevBestScore: 0,
        prevBestTimeMs: 0,
      },
    });
    const r = parseStoredRecords(legacy);
    expect(r[1].bestScore).toBe(500);
    expect(r[1].bestTimeMs).toBe(4200);
  });

  it("reads the v2 envelope shape", () => {
    const v2 = JSON.stringify({
      schemaVersion: 2,
      phases: {
        2: {
          bestScore: 800,
          bestTimeMs: 3000,
          lastScore: 800,
          lastTimeMs: 3000,
          prevBestScore: 0,
          prevBestTimeMs: 0,
        },
      },
    });
    const r = parseStoredRecords(v2);
    expect(r[2].bestScore).toBe(800);
  });

  it("ignores malformed phase entries and keeps defaults", () => {
    const bad = JSON.stringify({ schemaVersion: 2, phases: { 1: { bestScore: "nope" } } });
    expect(parseStoredRecords(bad)[1].bestScore).toBe(0);
  });
});

describe("applyRun", () => {
  const empty = (): RecordsMap => parseStoredRecords(null);

  it("records the first run as best, with prev-best snapshot of zero", () => {
    const r = applyRun(empty(), 1, 300, 5000);
    expect(r[1].bestScore).toBe(300);
    expect(r[1].bestTimeMs).toBe(5000);
    expect(r[1].prevBestScore).toBe(0);
    expect(r[1].lastScore).toBe(300);
  });

  it("keeps the better score/time but always updates last + prev on a worse run", () => {
    let r = applyRun(empty(), 1, 300, 5000);
    r = applyRun(r, 1, 250, 6000);
    expect(r[1].bestScore).toBe(300); // better score retained
    expect(r[1].bestTimeMs).toBe(5000); // faster time retained
    expect(r[1].lastScore).toBe(250); // last always reflects the newest run
    expect(r[1].lastTimeMs).toBe(6000);
    expect(r[1].prevBestScore).toBe(300); // snapshot before this run
  });

  it("improves best time when a faster run comes in", () => {
    let r = applyRun(empty(), 1, 300, 5000);
    r = applyRun(r, 1, 400, 4000);
    expect(r[1].bestScore).toBe(400);
    expect(r[1].bestTimeMs).toBe(4000);
  });
});
