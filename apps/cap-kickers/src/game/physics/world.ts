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
      // A collision's positional correction can push a body past a wall;
      // re-clamp so no body ever ends a substep out of bounds.
      for (const b of this.bodies) this.collideWalls(b);
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

  private collideWalls(b: Body): void {
    const { minX, minY, maxX, maxY } = this.cfg.bounds;
    const e = this.cfg.restitution;
    if (b.position.x - b.radius < minX) {
      b.position.x = minX + b.radius;
      b.velocity.x = Math.abs(b.velocity.x) * e;
    } else if (b.position.x + b.radius > maxX) {
      b.position.x = maxX - b.radius;
      b.velocity.x = -Math.abs(b.velocity.x) * e;
    }
    if (b.position.y - b.radius < minY) {
      b.position.y = minY + b.radius;
      b.velocity.y = Math.abs(b.velocity.y) * e;
    } else if (b.position.y + b.radius > maxY) {
      b.position.y = maxY - b.radius;
      b.velocity.y = -Math.abs(b.velocity.y) * e;
    }
  }

  private resolveCollisions(): void {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        this.resolvePair(bodies[i], bodies[j]);
      }
    }
  }

  private resolvePair(a: Body, b: Body): void {
    const delta = sub(b.position, a.position); // a -> b
    const distance = len(delta);
    const minDist = a.radius + b.radius;
    if (distance === 0 || distance >= minDist) return;

    const normal = scale(delta, 1 / distance); // unit, a -> b
    const invA = 1 / a.mass;
    const invB = 1 / b.mass;

    // Positional correction: push apart, split by inverse mass.
    const penetration = minDist - distance;
    const corr = penetration / (invA + invB);
    a.position = sub(a.position, scale(normal, corr * invA));
    b.position = add(b.position, scale(normal, corr * invB));

    // Impulse: skip if already separating.
    const rv = sub(b.velocity, a.velocity);
    const velAlongNormal = dot(rv, normal);
    if (velAlongNormal > 0) return;
    const e = this.cfg.restitution;
    const jImp = (-(1 + e) * velAlongNormal) / (invA + invB);
    const impulse = scale(normal, jImp);
    a.velocity = sub(a.velocity, scale(impulse, invA));
    b.velocity = add(b.velocity, scale(impulse, invB));
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
