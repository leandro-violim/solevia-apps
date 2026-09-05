import { describe, it, expect, vi } from "vitest";
import {
  playSample,
  CROWD_FILES,
  STADIUM_BEDS,
  SFX_VARIANTS,
  FLICK_FILES,
  CLACK_FILES,
  packFiles,
  packPreviewFile,
} from "./samples";

// A minimal WebAudio mock — enough to prove playSample wires src -> gain -> out.
const fakeCtx = () => {
  const started: boolean[] = [];
  const ctx = {
    createBufferSource: () => {
      const node = { buffer: null as unknown, loop: false, connect: vi.fn(), start: () => started.push(true) };
      return node;
    },
    createGain: () => ({ gain: { value: 1 }, connect: vi.fn() }),
  };
  return { ctx: ctx as unknown as AudioContext, started };
};

describe("samples", () => {
  it("maps each pack to its files", () => {
    expect(packFiles("crowd").sort()).toEqual(
      ["whistle", "cheer-goal", "cheer-win", "cheer-near"].sort(),
    );
    expect(packFiles("stadium")).toEqual(STADIUM_BEDS);
    expect(packFiles("nope")).toEqual([]);
  });

  it("crowd one-shot map keeps flick/clack out (they're free cap-foley variants)", () => {
    const names = Object.keys(CROWD_FILES);
    expect(names).not.toContain("flick");
    expect(names).not.toContain("clack");
  });

  it("flick/clack map to their free multi-take variant sets", () => {
    expect(SFX_VARIANTS.flick).toBe(FLICK_FILES);
    expect(SFX_VARIANTS.clack).toBe(CLACK_FILES);
    expect(FLICK_FILES.length).toBeGreaterThan(1); // >1 so picks can vary
    expect(CLACK_FILES.length).toBeGreaterThan(1);
  });

  it("gives a preview clip per pack", () => {
    expect(packPreviewFile("crowd")).toBe("cheer-win");
    expect(packPreviewFile("stadium")).toBe(STADIUM_BEDS[0]);
    expect(packPreviewFile("nope")).toBeNull();
  });

  it("playSample connects the buffer to the output and starts it once, honouring loop", () => {
    const { ctx, started } = fakeCtx();
    const out = { gain: { value: 1 } } as unknown as GainNode;
    const buf = {} as AudioBuffer;
    const src = playSample(ctx, out, buf, 0.5, true);
    expect(src.buffer).toBe(buf);
    expect(src.loop).toBe(true);
    expect(started).toEqual([true]);
  });
});
