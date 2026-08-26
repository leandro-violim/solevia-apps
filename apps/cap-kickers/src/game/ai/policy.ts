import { type Vec2, dist } from "../physics/vec";
import { type PhysicsConfig } from "../physics/world";
import { type Pitch, type PlayerSide, type CapZone, attackingGoal, goalZone } from "../rules/pitch";
import { type FlickResult } from "../rules/flick";
import { simulateFlick, type SimCap } from "./simulate";

export type Difficulty = "easy" | "normal" | "hard";
export type AiFlick = { capId: string; velocity: Vec2 };

export type AiContext = {
  pitch: Pitch;
  physics: PhysicsConfig;
  attacker: PlayerSide;
  touch: number; // 1..shotTouch
  shotTouch: number; // which touch is the scoring shot
  difficulty: Difficulty;
  maxSpeed: number;
  // Optional randomness source (0..1). When present, the AI picks at random
  // among its near-best candidate flicks instead of always the single best —
  // so a human opponent sees varied play, not the same move every match. Omit
  // for fully deterministic behaviour (tests, replays).
  rng?: () => number;
};

const DIFFS: Record<Difficulty, { samples: number }> = {
  easy: { samples: 4 },
  normal: { samples: 8 },
  hard: { samples: 16 },
};

const POWER_LEVELS = [0.45, 0.7, 1.0];
const ANGLE_SPREAD = 0.7; // radians; half-spread around the cap->goal aim

const goalCenter = (ctx: AiContext): Vec2 => {
  const side = attackingGoal(ctx.attacker);
  return { x: side === "left" ? 0 : ctx.pitch.width, y: ctx.pitch.height / 2 };
};

const scoreOutcome = (
  result: FlickResult,
  finalFlicked: Vec2,
  goal: Vec2,
  targetZone: CapZone,
  touch: number,
  shotTouch: number,
): number => {
  const d = dist(finalFlicked, goal);
  if (touch < shotTouch) {
    const legal = result.crossedGate && result.flickedEnding === "rest" && !result.anyCapLeftPitch;
    if (!legal) {
      // Among illegal candidates, prefer ones that at least threaded the gate.
      return -1e9 + (result.crossedGate ? 1e5 : 0) - d;
    }
    return -d; // legal: closer to the goal is better
  }
  // Shot: a goal dominates everything.
  if (result.flickedEnding === targetZone) return 1e9 - d;
  return -d;
};

// A candidate flick's score is "near-best" if it's within this margin of the
// top score — the pool the RNG picks from. In the score's units (roughly pitch
// units of distance-to-goal), so ~a cap-and-a-half of slack among good moves.
const NEAR_BEST_MARGIN = 90;

// Human-like aiming error (radians) added to the AI's chosen flick, scaled by
// difficulty. Easy fluffs shots and build-ups noticeably (misses / turnovers,
// and centred stray shots the keeper saves) while still scoring sometimes; Hard
// is near-perfect. Only applied when an RNG is supplied (live play, not tests).
const AIM_ERROR: Record<Difficulty, number> = { easy: 0.14, normal: 0.06, hard: 0.02 };

/** Perturb a flick's direction (and shave a little speed) by the difficulty's error. */
const addAimError = (flick: AiFlick, difficulty: Difficulty, rng: () => number): AiFlick => {
  const err = AIM_ERROR[difficulty];
  const angle = Math.atan2(flick.velocity.y, flick.velocity.x) + (rng() * 2 - 1) * err;
  const speed = Math.hypot(flick.velocity.x, flick.velocity.y) * (1 - rng() * err);
  return { capId: flick.capId, velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed } };
};

/**
 * Deterministically choose the AI's flick for the current touch by simulating a
 * spread of candidate (cap × direction × power) flicks and scoring each. Search
 * breadth scales with difficulty. Same inputs → same output (no randomness).
 */
export const chooseAiFlick = (caps: SimCap[], ctx: AiContext): AiFlick | null => {
  if (caps.length < 2) return null;
  const goal = goalCenter(ctx);
  const targetZone = goalZone(attackingGoal(ctx.attacker));
  const samples = DIFFS[ctx.difficulty].samples;

  const candidates: { flick: AiFlick; score: number }[] = [];
  let bestScore = -Infinity;

  for (const cap of caps) {
    const base = Math.atan2(goal.y - cap.position.y, goal.x - cap.position.x);
    for (let i = 0; i < samples; i++) {
      const frac = samples === 1 ? 0.5 : i / (samples - 1);
      const angle = base + (frac - 0.5) * 2 * ANGLE_SPREAD;
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };
      for (const pf of POWER_LEVELS) {
        const speed = ctx.maxSpeed * pf;
        const velocity = { x: dir.x * speed, y: dir.y * speed };
        const sim = simulateFlick(caps, ctx.pitch, ctx.physics, cap.id, velocity);
        const finalFlicked = sim.caps.find((c) => c.id === cap.id)!.position;
        const score = scoreOutcome(sim.result, finalFlicked, goal, targetZone, ctx.touch, ctx.shotTouch);
        candidates.push({ flick: { capId: cap.id, velocity }, score });
        if (score > bestScore) bestScore = score;
      }
    }
  }
  if (candidates.length === 0) return null;

  // Deterministic: always the single best. With an RNG: pick at random among the
  // near-best moves (varied, non-repetitive), then add difficulty-scaled aiming
  // error so Easy makes visible mistakes while Hard stays sharp.
  if (!ctx.rng) {
    return candidates.reduce((a, b) => (b.score > a.score ? b : a)).flick;
  }
  const pool = candidates.filter((c) => c.score >= bestScore - NEAR_BEST_MARGIN);
  const pick = pool[Math.floor(ctx.rng() * pool.length) % pool.length].flick;
  return addAimError(pick, ctx.difficulty, ctx.rng);
};
