import { PhysicsWorld, type PhysicsConfig } from "./physics/world";
import { type Vec2 } from "./physics/vec";
import { type Pitch, type PlayerSide, type GoalSide, attackingGoal } from "./rules/pitch";
import { makeTriangle } from "./rules/setup";
import { FlickTracker } from "./rules/flick-tracker";
import {
  applyFlick,
  initialMatch,
  type MatchState,
  type MatchConfig,
  type TurnResult,
} from "./rules/match";
import { PITCH, CAP_RADIUS, PHYSICS, MATCH, KEEPER } from "./constants";
import { KEEPER_DIFFS, keeperTrackVelocityY } from "./ai/keeper";
import { type Difficulty } from "./ai/policy";

export type SessionConfig = {
  pitch: Pitch;
  capRadius: number;
  physics: PhysicsConfig;
  match: MatchConfig;
  firstAttacker: PlayerSide;
  keeperDifficulty: Difficulty;
};

export type SessionPhase = "aiming" | "resolving";
export type FlickReport = { result: TurnResult; match: MatchState };

const CAP_IDS = ["c0", "c1", "c2"] as const;
type CapId = (typeof CAP_IDS)[number];

type KeeperState = {
  defended: GoalSide;
  goalLineX: number;
  mouthMin: number;
  mouthMax: number;
  reactionElapsed: number;
};

const defaults = (): SessionConfig => ({
  pitch: PITCH,
  capRadius: CAP_RADIUS,
  physics: PHYSICS,
  match: MATCH,
  firstAttacker: 0,
  keeperDifficulty: "normal",
});

export class GameSession {
  readonly cfg: SessionConfig;
  readonly world: PhysicsWorld;
  match: MatchState;
  phase: SessionPhase = "aiming";
  selectedCapId: string | null = null;

  private tracker: FlickTracker | null = null;
  private keeperState: KeeperState | null = null;
  private shotCapId: string | null = null;

  constructor(cfg: Partial<SessionConfig> = {}) {
    this.cfg = { ...defaults(), ...cfg };
    this.world = new PhysicsWorld(this.cfg.physics);
    this.match = initialMatch(this.cfg.firstAttacker);
    for (const id of CAP_IDS) {
      this.world.addBody({
        id,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: this.cfg.capRadius,
        mass: 1,
      });
    }
    this.positionTriangle(this.match.attacker);
  }

  private positionTriangle(side: PlayerSide): void {
    const tri = makeTriangle(this.cfg.pitch, side, this.cfg.capRadius);
    CAP_IDS.forEach((id, i) => {
      const b = this.world.getBody(id)!;
      b.position = { x: tri[i].x, y: tri[i].y };
      b.velocity = { x: 0, y: 0 };
    });
    this.selectedCapId = null;
  }

  caps(): { id: string; position: Vec2; radius: number }[] {
    return CAP_IDS.map((id) => this.world.getBody(id)!).map((b) => ({
      id: b.id,
      position: { x: b.position.x, y: b.position.y },
      radius: b.radius,
    }));
  }

  selectCap(id: string): void {
    if (this.phase === "aiming" && (CAP_IDS as readonly string[]).includes(id)) {
      this.selectedCapId = id;
    }
  }

  /** Begin an animated flick. No-op unless aiming and the id is a real cap. */
  beginFlick(capId: string, velocity: Vec2): void {
    if (
      this.phase !== "aiming" ||
      this.match.phase === "won" ||
      !(CAP_IDS as readonly string[]).includes(capId)
    )
      return;
    this.shotCapId = capId;
    const others = CAP_IDS.filter((id) => id !== capId) as CapId[];
    const a = this.world.getBody(others[0])!;
    const b = this.world.getBody(others[1])!;
    this.tracker = new FlickTracker(
      this.world,
      this.cfg.pitch,
      capId,
      { x: a.position.x, y: a.position.y },
      { x: b.position.x, y: b.position.y },
      [...CAP_IDS],
    );
    this.world.getBody(capId)!.velocity = { x: velocity.x, y: velocity.y };
    this.phase = "resolving";
    this.selectedCapId = null;
    if (this.match.touch === 4) {
      this.spawnKeeper();
    }
  }

  private spawnKeeper(): void {
    const defended = attackingGoal(this.match.attacker); // goal being shot at
    const goalLineX = defended === "left" ? 0 : this.cfg.pitch.width;
    const inx = defended === "left" ? KEEPER.inset + KEEPER.radius : -(KEEPER.inset + KEEPER.radius);
    const x = goalLineX + inx;
    const midY = this.cfg.pitch.height / 2;
    const half = this.cfg.pitch.goalWidth / 2;
    this.keeperState = {
      defended,
      goalLineX,
      mouthMin: midY - half + KEEPER.radius,
      mouthMax: midY + half - KEEPER.radius,
      reactionElapsed: 0,
    };
    this.world.addBody({
      id: "keeper",
      position: { x, y: midY },
      velocity: { x: 0, y: 0 },
      radius: KEEPER.radius,
      mass: KEEPER.mass,
    });
  }

  /** The live keeper body for rendering, or null when none is present. */
  keeper(): { position: Vec2; radius: number } | null {
    if (!this.keeperState) return null;
    const body = this.world.getBody("keeper");
    if (!body) return null;
    return { position: { x: body.position.x, y: body.position.y }, radius: KEEPER.radius };
  }

  /** Step an in-progress flick by dt. Returns a report the frame it finalizes, else null. */
  tick(dt: number): FlickReport | null {
    if (this.phase !== "resolving" || !this.tracker) return null;

    const ks = this.keeperState;
    const keeperBefore = ks ? this.world.getBody("keeper") : undefined;
    if (ks && keeperBefore) {
      ks.reactionElapsed += dt;
      const params = KEEPER_DIFFS[this.cfg.keeperDifficulty];
      if (ks.reactionElapsed >= params.reactionDelay) {
        const shot = this.shotCapId ? this.world.getBody(this.shotCapId) : undefined;
        const targetY = shot
          ? Math.max(ks.mouthMin, Math.min(ks.mouthMax, shot.position.y))
          : keeperBefore.position.y;
        keeperBefore.velocity = { x: 0, y: keeperTrackVelocityY(keeperBefore.position.y, targetY, params.maxSpeed) };
      } else {
        keeperBefore.velocity = { x: 0, y: 0 };
      }
    }

    this.world.step(dt);

    if (ks) {
      const keeperAfter = this.world.getBody("keeper");
      if (keeperAfter) {
        keeperAfter.position.x =
          ks.goalLineX + (ks.defended === "left" ? KEEPER.inset + KEEPER.radius : -(KEEPER.inset + KEEPER.radius));
        keeperAfter.position.y = Math.max(ks.mouthMin, Math.min(ks.mouthMax, keeperAfter.position.y));
        keeperAfter.velocity.x = 0;
      }
    }

    const flick = this.tracker.observe();
    if (!flick) return null;

    const { state, result } = applyFlick(this.match, flick, this.cfg.match);
    this.match = state;
    this.tracker = null;
    this.phase = "aiming";
    this.world.removeBody("keeper");
    this.keeperState = null;
    this.shotCapId = null;
    if (result === "turnover" || result === "goal") {
      this.positionTriangle(state.attacker);
    }
    return { result, match: state };
  }
}
