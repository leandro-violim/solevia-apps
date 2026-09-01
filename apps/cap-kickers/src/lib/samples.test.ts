import { describe, it, expect, vi } from "vitest";
import { playSample, CROWD_FILES, AMBIENCE_FILE, packFiles, packPreviewFile } from "./samples";

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
    expect(packFiles("stadium")).toEqual([AMBIENCE_FILE]);
    expect(packFiles("nope")).toEqual([]);
  });

  it("crowd map keeps flick/clack out (they stay synth)", () => {
    const names = Object.keys(CROWD_FILES);
    expect(names).not.toContain("flick");
    expect(names).not.toContain("clack");
  });

  it("gives a preview clip per pack", () => {
    expect(packPreviewFile("crowd")).toBe("cheer-win");
    expect(packPreviewFile("stadium")).toBe("amb-crowd");
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
