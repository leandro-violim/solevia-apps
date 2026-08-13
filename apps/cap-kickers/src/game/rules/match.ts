import { type PlayerSide, attackingGoal, goalZone } from "./pitch";
import { type FlickResult } from "./flick";

export type MatchConfig = { goalsToWin: number };
export type MatchPhase = "playing" | "won";

export type MatchState = {
  scores: [number, number];
  attacker: PlayerSide;
  touch: number; // 1..4
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
 * Touches 1-3 (build-up): legal iff the flick crossed the gate AND every cap
 * stayed in the pitch (flickedEnding === "rest" and no cap left the pitch).
 * Legal → advance (touch+1, same attacker); illegal → turnover.
 *
 * Touch 4 (the shot): the gate does not apply. If the flicked cap entered the
 * attacker's target goal → goal (score, then kickoff to the other side, or win
 * at goalsToWin). Otherwise → turnover. Only the 4th touch can score.
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

  if (state.touch <= 3) {
    const legal = flick.crossedGate && flick.flickedEnding === "rest" && !flick.anyCapLeftPitch;
    if (legal) {
      return { state: { ...state, touch: state.touch + 1 }, result: "advance" };
    }
    return turnover();
  }

  // touch === 4: the shot.
  const scored = flick.flickedEnding === goalZone(attackingGoal(state.attacker));
  if (!scored) {
    return turnover();
  }

  const scores: [number, number] = [state.scores[0], state.scores[1]];
  scores[state.attacker] += 1;

  if (scores[state.attacker] >= config.goalsToWin) {
    return {
      state: { ...state, scores, phase: "won", winner: state.attacker },
      result: "win",
    };
  }

  // Goal (not a win): the other side attacks next with a fresh triangle.
  return {
    state: { ...state, scores, attacker: other(state.attacker), touch: 1 },
    result: "goal",
  };
};
