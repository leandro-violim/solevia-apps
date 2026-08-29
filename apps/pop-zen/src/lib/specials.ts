/**
 * Special bubble types (§7) — variety + light strategy, mainly Time Attack.
 * Spawn rates + earliest phase come from CONFIG.specials; Zen scales them down
 * (or off) via `specialsMul`. Each type has a distinct look (SPECIAL_LOOK) and
 * its pop EFFECT is applied in the play route's pop handler.
 *
 * Chain bubbles from the packet are intentionally deferred (noted in the status)
 * — the four below cover the strategy; chain is an easy follow-up.
 */
import { CONFIG } from "./config";

export type SpecialType = "normal" | "golden" | "bomb" | "mystery" | "frozen";

const CANDIDATES: { type: SpecialType; rate: number; fromPhase: number }[] = [
  {
    type: "golden",
    rate: CONFIG.specials.golden.rate,
    fromPhase: CONFIG.specials.golden.fromPhase,
  },
  { type: "bomb", rate: CONFIG.specials.bomb.rate, fromPhase: CONFIG.specials.bomb.fromPhase },
  {
    type: "mystery",
    rate: CONFIG.specials.mystery.rate,
    fromPhase: CONFIG.specials.mystery.fromPhase,
  },
  {
    type: "frozen",
    rate: CONFIG.specials.frozen.rate,
    fromPhase: CONFIG.specials.frozen.fromPhase,
  },
];

/**
 * Decide a bubble's type. `specialsMul` scales all rates (Time Attack = 1, Zen =
 * CONFIG.specials.zenMultiplier, or 0 to disable). `phase` gates which types can
 * appear yet.
 */
export function assignSpecial(phase: number, specialsMul: number, rand: () => number): SpecialType {
  if (specialsMul <= 0) return "normal";
  let acc = 0;
  const roll = rand();
  for (const c of CANDIDATES) {
    if (phase < c.fromPhase) continue;
    acc += c.rate * specialsMul;
    if (roll < acc) return c.type;
  }
  return "normal";
}

export const FROZEN_TAPS = CONFIG.specials.frozen.taps;

/** Per-type badge + ring styling for the bubble (readable at a glance). */
export const SPECIAL_LOOK: Record<
  Exclude<SpecialType, "normal">,
  { emoji: string; ring: string; glow: string }
> = {
  golden: { emoji: "⭐", ring: "#ffd76a", glow: "0 0 14px rgba(255,215,106,.75)" },
  bomb: { emoji: "💣", ring: "#ff7a7a", glow: "0 0 12px rgba(255,122,122,.7)" },
  mystery: { emoji: "❓", ring: "#c9a6ff", glow: "0 0 12px rgba(201,166,255,.7)" },
  frozen: { emoji: "❄️", ring: "#a6e6ff", glow: "0 0 12px rgba(166,230,255,.7)" },
};

export type MysteryReward = { kind: "coins" | "time" | "points"; amount: number };

/** Resolve a Mystery bubble's random reward. */
export function rollMysteryReward(rand: () => number): MysteryReward {
  const kinds = CONFIG.specials.mysteryRewards;
  const kind = kinds[Math.floor(rand() * kinds.length)] ?? "coins";
  if (kind === "coins") return { kind, amount: 5 + Math.floor(rand() * 20) };
  if (kind === "time") return { kind, amount: 3 + Math.floor(rand() * 5) }; // seconds
  return { kind: "points", amount: 25 + Math.floor(rand() * 75) };
}
