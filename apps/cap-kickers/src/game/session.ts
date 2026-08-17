import { PhysicsWorld, type PhysicsConfig } from "./physics/world";
import { type Vec2 } from "./physics/vec";
import { type Pitch, type PlayerSide } from "./rules/pitch";
import { makeTriangle } from "./rules/setup";
import { FlickTracker } from "./rules/flick-tracker";
import {
  applyFlick,
  initialMatch,
  type MatchState,
  type MatchConfig,
  type TurnResult,
} from "./rules/match";
import { PITCH, CAP_RADIUS, PHYSICS, MATCH } from "./constants";

export type SessionConfig = {
  pitch: Pitch;
  capRadius: number;
  physics: PhysicsConfig;
  match: MatchConfig;
  firstAttacker: PlayerSide;
};

export type SessionPhase = "aiming" | "resolving";
export type FlickReport = { result: TurnResult; match: MatchState };

const CAP_IDS = ["c0", "c1", "c2"] as const;
type CapId = (typeof CAP_IDS)[number];

const defaults = (): SessionConfig => ({
  pitch: PITCH,
  capRadius: CAP_RADIUS,
  physics: PHYSICS,
  match: MATCH,
  firstAttacker: 0,
});

export class GameSession {
  readonly cfg: SessionConfig;
  readonly world: PhysicsWorld;
  match: MatchState;
  phase: SessionPhase = "aiming";
  selectedCapId: string | null = null;

  private tracker: FlickTracker | null = null;

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
    return this.world.bodies.map((b) => ({
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
    const others = CAP_IDS.filter((id) => id !== capId) as CapId[];
    const a = this.world.getBody(others[0])!;
    const b = this.world.getBody(others[1])!;
    this.tracker = new FlickTracker(
      this.world,
      this.cfg.pitch,
      capId,
      { x: a.position.x, y: a.position.y },
      { x: b.position.x, y: b.position.y },
    );
    this.world.getBody(capId)!.velocity = { x: velocity.x, y: velocity.y };
    this.phase = "resolving";
    this.selectedCapId = null;
  }

  /** Step an in-progress flick by dt. Returns a report the frame it finalizes, else null. */
  tick(dt: number): FlickReport | null {
    if (this.phase !== "resolving" || !this.tracker) return null;
    this.world.step(dt);
    const flick = this.tracker.observe();
    if (!flick) return null;

    const { state, result } = applyFlick(this.match, flick, this.cfg.match);
    this.match = state;
    this.tracker = null;
    this.phase = "aiming";
    if (result === "turnover" || result === "goal") {
      this.positionTriangle(state.attacker);
    }
    return { result, match: state };
  }
}
