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
  touch: number; // 1..4
  difficulty: Difficulty;
  maxSpeed: number;
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
): number => {
  const d = dist(finalFlicked, goal);
  if (touch <= 3) {
    const legal = result.crossedGate && result.flickedEnding === "rest" && !result.anyCapLeftPitch;
    if (!legal) {
      // Among illegal candidates, prefer ones that at least threaded the gate.
      return -1e9 + (result.crossedGate ? 1e5 : 0) - d;
    }
    return -d; // legal: closer to the goal is better
  }
  // Shot (touch 4): a goal dominates everything.
  if (result.flickedEnding === targetZone) return 1e9 - d;
  return -d;
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

  let best: AiFlick | null = null;
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
        const score = scoreOutcome(sim.result, finalFlicked, goal, targetZone, ctx.touch);
        if (score > bestScore) {
          bestScore = score;
          best = { capId: cap.id, velocity };
        }
      }
    }
  }
  return best;
};
