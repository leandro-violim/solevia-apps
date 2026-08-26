import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameAudio } from "./audio";

// ---- Minimal WebAudio mock (node test env has no AudioContext) ----------
const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
});
const node = (extra: Record<string, unknown> = {}) => ({
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  ...extra,
});

type MockCtx = ReturnType<typeof makeMockCtx>;
function makeMockCtx() {
  const counts = { osc: 0, resume: 0 };
  const ctx = {
    counts,
    sampleRate: 44100,
    currentTime: 0,
    state: "suspended" as AudioContextState,
    destination: node(),
    resume: vi.fn(async () => {
      counts.resume++;
      ctx.state = "running";
    }),
    createGain: () => node({ gain: param() }),
    createOscillator: () => {
      counts.osc++;
      return node({ type: "sine", frequency: param() });
    },
    createBiquadFilter: () => node({ type: "bandpass", frequency: param(), Q: param() }),
    createBufferSource: () => node({ buffer: null }),
    createBuffer: (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) }),
  };
  return ctx;
}

const make = () => {
  const ctx = makeMockCtx();
  const audio = new GameAudio(() => ctx as unknown as AudioContext);
  return { ctx, audio };
};

describe("GameAudio", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("plays no SFX when sound is off", async () => {
    const { ctx, audio } = make();
    await audio.unlock(); // builds the graph
    audio.setSettings({ sound: false, music: false });
    const before = ctx.counts.osc;
    audio.sfx("horn");
    expect(ctx.counts.osc).toBe(before); // muted -> no oscillators created
  });

  it("plays an SFX when sound is on", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    audio.setSettings({ sound: true, music: true });
    const before = ctx.counts.osc;
    audio.sfx("horn"); // horn uses two oscillators
    expect(ctx.counts.osc).toBeGreaterThan(before);
  });

  it("recovers game sound after an interruption suspends the context (#13)", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    expect(ctx.state).toBe("running");
    // Simulate an interstitial / rewarded video / phone call.
    ctx.state = "suspended";
    const resumesBefore = ctx.counts.resume;
    audio.resumeIfSuspended(); // what the foreground handler calls
    expect(ctx.counts.resume).toBe(resumesBefore + 1);
    expect(ctx.state).toBe("running");
  });

  it("does not resume a context that is already running", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    const resumes = ctx.counts.resume;
    audio.resumeIfSuspended();
    expect(ctx.counts.resume).toBe(resumes); // already running -> no-op
  });

  it("starts music only on a menu scene and stops it in-game", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    audio.setSettings({ sound: true, music: true });
    audio.enterGame(); // wantMusic=false
    const inGame = ctx.counts.osc;
    audio.startMusic();
    expect(ctx.counts.osc).toBe(inGame); // no music in a game

    audio.enterMenu(); // wantMusic=true -> starts the loop (immediate first tick)
    expect(ctx.counts.osc).toBeGreaterThan(inGame);
    audio.stopMusic(); // clean up the interval
  });

  it("stops music when music is toggled off", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    audio.enterMenu();
    const playing = ctx.counts.osc;
    audio.setSettings({ sound: true, music: false });
    vi.advanceTimersByTime(1000); // the loop must be stopped, so no new notes
    expect(ctx.counts.osc).toBe(playing);
  });
});
