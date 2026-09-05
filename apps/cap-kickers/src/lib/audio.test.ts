import { describe, it, expect, vi } from "vitest";
import { GameAudio } from "./audio";

// Stub the menu-theme asset so the unit test doesn't pull the ~1 MB clip; the real
// decode is verified against the bundle in the browser. A tiny valid data URI is
// enough for decodeDataUri -> the mocked decodeAudioData.
vi.mock("./menu-music", () => ({ default: "data:audio/mp4;base64,AAAAAAAA" }));

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
  const counts = { osc: 0, resume: 0, srcStarted: 0, srcStopped: 0 };
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
    createBufferSource: () =>
      node({
        buffer: null,
        loop: false,
        start: vi.fn(() => {
          counts.srcStarted++;
        }),
        stop: vi.fn(() => {
          counts.srcStopped++;
        }),
      }),
    createBuffer: (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) }),
    decodeAudioData: vi.fn(async () => ({ duration: 60 }) as unknown as AudioBuffer),
  };
  return ctx;
}


const make = () => {
  const ctx = makeMockCtx();
  const audio = new GameAudio(() => ctx as unknown as AudioContext);
  return { ctx, audio };
};

describe("GameAudio", () => {
  it("plays no SFX when sound is off", async () => {
    const { ctx, audio } = make();
    await audio.unlock(); // builds the graph
    audio.setSettings({ sound: false, music: false, ambience: false });
    const before = ctx.counts.osc;
    audio.sfx("horn");
    expect(ctx.counts.osc).toBe(before); // muted -> no oscillators created
  });

  it("plays an SFX when sound is on", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    audio.setSettings({ sound: true, music: true, ambience: true });
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

  it("loops the menu theme on a menu scene, not in-game", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    audio.setSettings({ sound: true, music: true, ambience: true });

    audio.enterGame(); // wantMusic=false -> startMusic returns before any load kicks
    audio.startMusic();
    expect(ctx.counts.srcStarted).toBe(0); // no menu music during a game

    audio.enterMenu(); // wantMusic=true -> lazy-load + loop the theme
    await vi.waitFor(() => expect(ctx.counts.srcStarted).toBeGreaterThan(0));
    audio.stopMusic();
  });

  it("stops the menu theme when music is toggled off", async () => {
    const { ctx, audio } = make();
    await audio.unlock();
    audio.enterMenu();
    await vi.waitFor(() => expect(ctx.counts.srcStarted).toBeGreaterThan(0)); // playing
    const stoppedBefore = ctx.counts.srcStopped;
    audio.setSettings({ sound: true, music: false, ambience: false });
    expect(ctx.counts.srcStopped).toBe(stoppedBefore + 1); // the loop was stopped
  });
});
