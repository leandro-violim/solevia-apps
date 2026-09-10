/**
 * §13 Pop Challenge — a comeback booster available once every 3 hours.
 *
 * Each challenge rolls a RANDOM mission (pop N bubbles / hit a combo / clear the
 * sheet / clear fast) and a RANDOM reward (a big pile of coins, or bombs, or
 * snowflakes). Finishing it — passing OR failing — grants the reward (full on a
 * win, a consolation on a miss), which the result popup shows before an
 * interstitial. Rewards are richer than a normal run so players return on the
 * timer. All local: a cooldown timestamp + the active roll live in localStorage.
 */
import { CONFIG } from "./config";
import { getPhase } from "./game-config";
import { addCoins } from "./economy";
import { grantConsumables } from "./consumables";
import { track } from "./analytics";

export type ChallengeMissionKind = "pop" | "combo" | "clear" | "fast";
export type ChallengeRewardKind = "coins" | "bomb" | "freeze";

export type ChallengeMission = {
  kind: ChallengeMissionKind;
  /** Target: bubbles to pop / combo to hit / seconds to clear under. Unused for "clear". */
  target: number;
  /** Round-1 global stage (1–8) whose field the challenge uses. */
  phase: number;
};

export type ChallengeReward = { kind: ChallengeRewardKind; amount: number };

export type ActiveChallenge = {
  mission: ChallengeMission;
  reward: ChallengeReward;
  rolledAt: number;
};

/** Live run signals the mission is graded against (from run-stats + phase state). */
export type ChallengeOutcomeInput = {
  popped: number;
  maxCombo: number;
  cleared: boolean;
  elapsedMs: number;
};

const LAST_KEY = "zb_challenge_last"; // ms timestamp of last completion (drives the gate)
const ACTIVE_KEY = "zb_challenge_active"; // JSON of the in-progress ActiveChallenge

function readNum(key: string): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/** ms remaining until the next Pop Challenge unlocks (0 = available now). */
export function msUntilChallenge(): number {
  const last = readNum(LAST_KEY);
  if (last <= 0) return 0;
  return Math.max(0, CONFIG.challenge.cooldownMs - (Date.now() - last));
}

export function challengeAvailable(): boolean {
  return msUntilChallenge() <= 0;
}

/** Format a remaining duration as H:MM:SS or M:SS (seconds always tick) for the tile countdown. */
export function formatCooldown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function rollMission(): ChallengeMission {
  const c = CONFIG.challenge;
  const phase = randInt(c.phaseMin, c.phaseMax);
  const { bubbles, timeLimitMs } = getPhase(phase);
  const kind = (["pop", "combo", "clear", "fast"] as const)[randInt(0, 3)];
  let target = 0;
  if (kind === "pop") {
    // A high fraction of the sheet — only reachable if you pop fast enough.
    target = Math.max(8, Math.round(bubbles * (0.75 + Math.random() * 0.2)));
  } else if (kind === "combo") {
    target = randInt(6, 10);
  } else if (kind === "fast") {
    // Clear the whole sheet under this many seconds (~55–70% of the budget).
    target = Math.max(4, Math.round((timeLimitMs / 1000) * (0.55 + Math.random() * 0.15)));
  } // "clear" needs no numeric target (success = sheet cleared).
  return { kind, target, phase };
}

function rollReward(): ChallengeReward {
  const c = CONFIG.challenge;
  const r = Math.random();
  const w = c.rewardWeights;
  if (r < w.coins) {
    const span = c.coinsMax - c.coinsMin;
    const amount = Math.round((c.coinsMin + Math.random() * span) / 10) * 10;
    return { kind: "coins", amount };
  }
  if (r < w.coins + w.bomb) return { kind: "bomb", amount: randInt(c.bombMin, c.bombMax) };
  return { kind: "freeze", amount: randInt(c.freezeMin, c.freezeMax) };
}

/**
 * Roll a fresh challenge and persist it as the active one. Called when the player
 * taps the tile to start. Does NOT start the cooldown — that begins at completion.
 */
export function startChallenge(): ActiveChallenge {
  const active: ActiveChallenge = {
    mission: rollMission(),
    reward: rollReward(),
    rolledAt: Date.now(),
  };
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
  } catch {
    /* storage blocked — play.tsx will roll a transient one */
  }
  track("challenge_started", {
    mission_kind: active.mission.kind,
    reward_kind: active.reward.kind,
    phase: active.mission.phase,
  });
  return active;
}

/** The active (in-progress) challenge, or null. play.tsx reads this on load. */
export function getActiveChallenge(): ActiveChallenge | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as ActiveChallenge;
    if (a && a.mission && a.reward) return a;
    return null;
  } catch {
    return null;
  }
}

function clearActiveChallenge(): void {
  try {
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

/** Did the run satisfy the mission? */
export function evaluateMission(m: ChallengeMission, o: ChallengeOutcomeInput): boolean {
  switch (m.kind) {
    case "pop":
      return o.popped >= m.target;
    case "combo":
      return o.maxCombo >= m.target;
    case "clear":
      return o.cleared;
    case "fast":
      return o.cleared && o.elapsedMs <= m.target * 1000;
    default:
      return false;
  }
}

/**
 * Grant the challenge reward, start the 3-hour cooldown, and clear the active
 * roll. Idempotent per active challenge (clearing the active key guards a
 * double-grant). Returns what was ACTUALLY granted, for the result popup.
 */
export function completeChallenge(
  active: ActiveChallenge,
  outcome: ChallengeOutcomeInput,
): { success: boolean; granted: ChallengeReward } {
  const success = evaluateMission(active.mission, outcome);
  const c = CONFIG.challenge;
  const { kind, amount } = active.reward;

  let grantedAmount = amount;
  if (kind === "coins") {
    grantedAmount = success ? amount : Math.round(amount * c.failCoinFactor);
    addCoins(grantedAmount, "pop_challenge");
  } else {
    grantedAmount = success ? amount : c.failItems;
    grantConsumables(kind, grantedAmount, "pop_challenge");
  }

  // Start the cooldown from completion and consume the active roll.
  try {
    localStorage.setItem(LAST_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  clearActiveChallenge();

  track("challenge_completed", {
    mission_kind: active.mission.kind,
    success,
    reward_kind: kind,
    reward_amount: grantedAmount,
  });

  return { success, granted: { kind, amount: grantedAmount } };
}
