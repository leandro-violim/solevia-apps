import { type PlayerSide, attackingGoal, goalZone } from "./pitch";
import { type FlickResult } from "./flick";

// shotTouch: the FINAL shot touch (default 5). The touch before it
// (earlyShotTouch = shotTouch - 1, default 4) is an OPTIONAL early shot against a
// near-perfect keeper. Touches 1..earlyShotTouch-1 are build-up (thread the gate).
export type MatchConfig = { goalsToWin: number; shotTouch: number };
export type MatchPhase = "playing" | "won";

export type MatchState = {
  scores: [number, number];
  attacker: PlayerSide;
  touch: number; // 1..shotTouch
  phase: MatchPhase;
  winner: PlayerSide | null;
};

export type TurnResult = "advance" | "turnover" | "goal" | "win";
export type ApplyOutcome = { state: MatchState; result: TurnResult };

export const initialMatch = (firstAttacker: PlayerSide = 0): MatchState => ({
  scores: [0, 0],
  attacker: firstAttacker,
  touch: 1,
  phase: "playing",
  winner: null,
});

const other = (s: PlayerSide): PlayerSide => (s === 0 ? 1 : 0);

/**
 * Advance the match by one resolved flick. Pure reducer.
 *
 * Build-up (touches 1..earlyShotTouch-1, default 1-3): legal iff the flick crossed
 * the gate AND every cap stayed in the pitch. Legal → advance; illegal → turnover.
 *
 * Early shot (touch === earlyShotTouch, default 4): an OPTIONAL shot against a
 * near-perfect keeper. Into the goal → goal (no gate needed). Otherwise, keep every
 * cap on the pitch → advance to the final shot (a rebound in play doesn't cost the
 * turn); a cap off the pitch → turnover.
 *
 * Final shot (touch === shotTouch, default 5): must thread the gate AND enter the
 * goal to score; otherwise turnover.
 *
 * On turnover/goal the caller repositions caps for the new attacker (makeTriangle).
 */
export const applyFlick = (
  state: MatchState,
  flick: FlickResult,
  config: MatchConfig,
): ApplyOutcome => {
  if (state.phase === "won") {
    return { state, result: "win" };
  }

  const turnover = (): ApplyOutcome => ({
    state: { ...state, attacker: other(state.attacker), touch: 1 },
    result: "turnover",
  });
  const advance = (): ApplyOutcome => ({
    state: { ...state, touch: state.touch + 1 },
    result: "advance",
  });
  const score = (): ApplyOutcome => {
    const scores: [number, number] = [state.scores[0], state.scores[1]];
    scores[state.attacker] += 1;
    if (scores[state.attacker] >= config.goalsToWin) {
      return { state: { ...state, scores, phase: "won", winner: state.attacker }, result: "win" };
    }
    return { state: { ...state, scores, attacker: other(state.attacker), touch: 1 }, result: "goal" };
  };

  const earlyShotTouch = config.shotTouch - 1;
  const enteredGoal = flick.flickedEnding === goalZone(attackingGoal(state.attacker));

  // Build-up.
  if (state.touch < earlyShotTouch) {
    const legal = flick.crossedGate && flick.flickedEnding === "rest" && !flick.anyCapLeftPitch;
    return legal ? advance() : turnover();
  }

  // Early shot (optional). Score, or keep the ball for the final shot, or turnover.
  if (state.touch === earlyShotTouch) {
    if (enteredGoal) return score();
    return flick.anyCapLeftPitch ? turnover() : advance();
  }

  // Final shot: gate + goal required.
  return enteredGoal && flick.crossedGate ? score() : turnover();
};
