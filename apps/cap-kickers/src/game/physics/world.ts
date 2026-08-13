import { type Vec2, add, sub, scale, dot, len } from "./vec";

export type Body = {
  id: string;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  mass: number;
};

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export type PhysicsConfig = {
  fixedDt: number; // seconds per fixed step, e.g. 1/120
  friction: number; // per-second linear damping (0 = none)
  restitution: number; // 0..1 bounce factor (walls + collisions)
  restEpsilon: number; // speed below which a body snaps to rest
  maxSubsteps: number; // cap on collision substeps per fixed step
  bounds: Bounds;
};

export class PhysicsWorld {
  readonly cfg: PhysicsConfig;
  readonly bodies: Body[] = [];
  private acc = 0;

  constructor(cfg: PhysicsConfig) {
    this.cfg = cfg;
  }

  addBody(b: Body): Body {
    this.bodies.push(b);
    return b;
  }

  getBody(id: string): Body | undefined {
    return this.bodies.find((b) => b.id === id);
  }

  atRest(): boolean {
    return this.bodies.every((b) => len(b.velocity) === 0);
  }

  step(frameDt: number): void {
    this.acc += frameDt;
    while (this.acc >= this.cfg.fixedDt) {
      this.fixedStep(this.cfg.fixedDt);
      this.acc -= this.cfg.fixedDt;
    }
  }

  private fixedStep(dt: number): void {
    const subs = this.computeSubsteps(dt);
    const h = dt / subs;
    for (let s = 0; s < subs; s++) {
      this.integrate(h);
      this.resolveCollisions();
    }
    this.applyFriction(dt);
  }

  private computeSubsteps(dt: number): number {
    let maxSpeed = 0;
    let minRadius = Infinity;
    for (const b of this.bodies) {
      maxSpeed = Math.max(maxSpeed, len(b.velocity));
      minRadius = Math.min(minRadius, b.radius);
    }
    if (maxSpeed === 0 || !isFinite(minRadius)) return 1;
    const subs = Math.ceil((maxSpeed * dt) / (minRadius * 0.5));
    return Math.max(1, Math.min(this.cfg.maxSubsteps, subs));
  }

  private integrate(h: number): void {
    for (const b of this.bodies) {
      b.position = add(b.position, scale(b.velocity, h));
      this.collideWalls(b);
    }
  }

  private collideWalls(_b: Body): void {
    // Implemented in Task 3.
  }

  private resolveCollisions(): void {
    // Implemented in Task 4.
  }

  private applyFriction(dt: number): void {
    const factor = Math.max(0, 1 - this.cfg.friction * dt);
    for (const b of this.bodies) {
      b.velocity = scale(b.velocity, factor);
      if (len(b.velocity) < this.cfg.restEpsilon) {
        b.velocity = { x: 0, y: 0 };
      }
    }
  }
}
