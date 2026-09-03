// Real audio sample loading/playback — the unlockable layer that sits IN FRONT of
// the synth in audio.ts (REWARDS-AND-AUDIO-PLAN.md §3). The synth stays the free
// baseline; these buffers are the reward.
//
// Efficiency rules (the point of the exercise):
//  • Decode ONCE. decodeAudioData is the expensive call; cache the AudioBuffer and
//    replay it. Never decode the same file twice, never `new Audio()`.
//  • Lazy-load. Callers fetch a pack's files only when it is unlocked AND sound is
//    on — cold start pays nothing for audio the player has not earned.

const cache = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer | null>>();

const sampleUrl = (id: string): string => `/audio/${id}.m4a`;

/** Decode a sample once and cache it. Returns null on any failure (never throws). */
export async function loadSample(ctx: AudioContext, id: string): Promise<AudioBuffer | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  const pending = inflight.get(id);
  if (pending) return pending;
  const p = (async (): Promise<AudioBuffer | null> => {
    try {
      const res = await fetch(sampleUrl(id));
      if (!res.ok) return null;
      const bytes = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(bytes);
      cache.set(id, buf);
      return buf;
    } catch {
      return null;
    } finally {
      inflight.delete(id);
    }
  })();
  inflight.set(id, p);
  return p;
}

/** The already-decoded buffer for `id`, if it has been loaded. Cheap, sync. */
export const cachedSample = (id: string): AudioBuffer | undefined => cache.get(id);

/** Play a one-shot buffer through `out`. Returns the source so callers can stop it. */
export function playSample(
  ctx: AudioContext,
  out: GainNode,
  buf: AudioBuffer,
  gain = 1,
  loop = false,
): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = loop;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(out);
  src.start();
  return src;
}

// ── Pack → file mappings ──────────────────────────────────────────────────────

/** The "crowd" pack: a real recording per one-shot sfx name (flick/clack stay synth). */
export type CrowdSfx = "whistle" | "horn" | "cheer" | "ohh";
export const CROWD_FILES: Record<CrowdSfx, string> = {
  whistle: "whistle", // turnover / kickoff
  horn: "cheer-goal", // goal scored (replaces the synth air-horn)
  cheer: "cheer-win", // match / campaign won
  ohh: "cheer-near", // shot saved — "so close"
};

/**
 * The two real recordings everyone gets for FREE during a match — the referee
 * whistle (turnover / kickoff) and the goal roar — so the game sounds real out of
 * the box. The paid "crowd" pack extends this to the win + near-miss moments and
 * the "stadium" pack adds the looping ambience bed.
 */
export const FREE_SFX_FILES: Partial<Record<CrowdSfx, string>> = {
  whistle: "whistle",
  horn: "cheer-goal",
};

/** The "stadium" pack: one seamless-looping murmur bed under matches. */
export const AMBIENCE_FILE = "amb-crowd";

/** All files a pack needs, for prefetching once it's unlocked. */
export const packFiles = (packId: string): string[] => {
  if (packId === "crowd") return Object.values(CROWD_FILES);
  if (packId === "stadium") return [AMBIENCE_FILE];
  return [];
};

/** The representative clip to play when previewing a pack in the Cabinet. */
export const packPreviewFile = (packId: string): string | null => {
  if (packId === "crowd") return CROWD_FILES.cheer;
  if (packId === "stadium") return AMBIENCE_FILE;
  return null;
};
