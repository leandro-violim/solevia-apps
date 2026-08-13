# Cap Kickers — Plan 1: Physics Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic 2D physics engine (circles = caps: momentum, friction, wall bounces, elastic collisions, no tunneling) as pure TypeScript, fully unit-tested — the foundation every later Cap Kickers plan depends on.

**Architecture:** A single `<canvas>` game will later drive this engine, but the engine itself is framework-free pure logic. A `PhysicsWorld` owns a list of circular `Body` objects and advances them with a **fixed-timestep accumulator** decoupled from frame rate, sub-stepping fast movers so collisions never tunnel. No `Math.random`/`Date.now` anywhere — identical inputs must produce identical output on every device, which is what makes both the tests and the future AI reliable.

**Tech Stack:** TypeScript (strict), Vitest (node environment), bun. No runtime dependencies — the engine is plain TS.

## Global Constraints

- **Package manager:** bun. Install with `bun install`; run tests with `bunx vitest run <file>`.
- **Dependency guard:** `bunfig.toml` sets `minimumReleaseAge = 86400` (skip versions <24h old). Do NOT add any new dependency without user confirmation. This plan adds only `vitest` and `typescript` as devDependencies, pinned to the versions PopZen already uses (`vitest@^3.2.4`, `typescript@^5.8.3`) — both far older than 24h.
- **Determinism (hard requirement):** No `Math.random()`, no `Date.now()`, no `new Date()` anywhere in `src/game/`. Iterate bodies and collision pairs in stable array order.
- **TypeScript:** `strict: true`. Match PopZen's tsconfig compiler options.
- **Test env:** Vitest `environment: "node"`; test files match `src/**/*.test.ts`.
- **Location:** All code under `apps/cap-kickers/` (new app, replaces the `app-two` placeholder).
- **Commits:** Conventional-commit style; end message body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit after each task's tests pass. Work stays on the `cap-kickers` branch.

---

## File Structure

- `apps/cap-kickers/package.json` — package manifest (name `@solevia/cap-kickers`, test script, dev deps).
- `apps/cap-kickers/tsconfig.json` — strict TS config (copied from PopZen).
- `apps/cap-kickers/vitest.config.ts` — node env, `src/**/*.test.ts`.
- `apps/cap-kickers/src/game/physics/vec.ts` — 2D vector value type + pure helpers.
- `apps/cap-kickers/src/game/physics/vec.test.ts` — vector tests.
- `apps/cap-kickers/src/game/physics/world.ts` — `Body`, `Bounds`, `PhysicsConfig`, `PhysicsWorld` (bodies + integration + friction + walls + collisions + substepping live together — they change together).
- `apps/cap-kickers/src/game/physics/world.test.ts` — integration/friction/determinism tests.
- `apps/cap-kickers/src/game/physics/collisions.test.ts` — wall + circle-circle collision tests.
- `apps/cap-kickers/src/game/physics/tunneling.test.ts` — anti-tunneling test.

---

### Task 1: Bootstrap package + Vector2 math

**Files:**
- Create: `apps/cap-kickers/package.json`
- Create: `apps/cap-kickers/tsconfig.json`
- Create: `apps/cap-kickers/vitest.config.ts`
- Create: `apps/cap-kickers/src/game/physics/vec.ts`
- Test: `apps/cap-kickers/src/game/physics/vec.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `type Vec2 = { x: number; y: number }`
  - `vec(x: number, y: number): Vec2`
  - `add(a: Vec2, b: Vec2): Vec2`, `sub(a, b): Vec2`, `scale(a: Vec2, s: number): Vec2`
  - `dot(a: Vec2, b: Vec2): number`, `len(a: Vec2): number`, `dist(a: Vec2, b: Vec2): number`
  - `normalize(a: Vec2): Vec2` (returns `{x:0,y:0}` for the zero vector)

- [ ] **Step 1: Create the package manifest**

Create `apps/cap-kickers/package.json`:

```json
{
  "name": "@solevia/cap-kickers",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create tsconfig and vitest config**

Create `apps/cap-kickers/tsconfig.json`:

```json
{
  "include": ["src/**/*.ts", "vitest.config.ts"],
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Create `apps/cap-kickers/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Install dependencies**

Run: `cd apps/cap-kickers && bun install`
Expected: creates `node_modules` + `bun.lock`; no errors. (vitest/typescript are well older than the 24h guard.)

- [ ] **Step 4: Write the failing vector test**

Create `apps/cap-kickers/src/game/physics/vec.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { vec, add, sub, scale, dot, len, dist, normalize } from "./vec";

describe("vec", () => {
  it("adds, subtracts, and scales", () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual({ x: 4, y: 6 });
    expect(sub(vec(5, 5), vec(1, 2))).toEqual({ x: 4, y: 3 });
    expect(scale(vec(2, -3), 2)).toEqual({ x: 4, y: -6 });
  });

  it("computes dot, length, and distance", () => {
    expect(dot(vec(1, 0), vec(0, 1))).toBe(0);
    expect(len(vec(3, 4))).toBe(5);
    expect(dist(vec(0, 0), vec(3, 4))).toBe(5);
  });

  it("normalizes, and returns zero vector for zero input", () => {
    expect(normalize(vec(0, 5))).toEqual({ x: 0, y: 1 });
    expect(normalize(vec(0, 0))).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/vec.test.ts`
Expected: FAIL — cannot resolve `./vec`.

- [ ] **Step 6: Implement the vector module**

Create `apps/cap-kickers/src/game/physics/vec.ts`:

```ts
export type Vec2 = { x: number; y: number };

export const vec = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const normalize = (a: Vec2): Vec2 => {
  const l = len(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/vec.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add apps/cap-kickers/package.json apps/cap-kickers/tsconfig.json apps/cap-kickers/vitest.config.ts apps/cap-kickers/src/game/physics/vec.ts apps/cap-kickers/src/game/physics/vec.test.ts apps/cap-kickers/bun.lock
git commit -m "feat(cap-kickers): bootstrap package and Vec2 math

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: PhysicsWorld — bodies, integration, friction, determinism

**Files:**
- Create: `apps/cap-kickers/src/game/physics/world.ts`
- Test: `apps/cap-kickers/src/game/physics/world.test.ts`

**Interfaces:**
- Consumes: `Vec2, add, scale, sub, dot, len, normalize` from `./vec`.
- Produces:
  - `type Body = { id: string; position: Vec2; velocity: Vec2; radius: number; mass: number }`
  - `type Bounds = { minX: number; minY: number; maxX: number; maxY: number }`
  - `type PhysicsConfig = { fixedDt: number; friction: number; restitution: number; restEpsilon: number; maxSubsteps: number; bounds: Bounds }`
  - `class PhysicsWorld` with: `constructor(cfg: PhysicsConfig)`, `readonly cfg`, `readonly bodies: Body[]`, `addBody(b: Body): Body`, `getBody(id: string): Body | undefined`, `atRest(): boolean`, `step(frameDt: number): void`.
  - Later tasks (rules/render/AI) read `world.bodies` and each body's `position`/`velocity`, mutate a body's `velocity` to apply a flick, and call `world.step(dt)` per frame.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/physics/world.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PhysicsWorld, type PhysicsConfig, type Body } from "./world";

const cfg = (over: Partial<PhysicsConfig> = {}): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 0,
  restitution: 1,
  restEpsilon: 1,
  maxSubsteps: 16,
  bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
  ...over,
});

const body = (over: Partial<Body> = {}): Body => ({
  id: "a",
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
  ...over,
});

describe("PhysicsWorld integration", () => {
  it("adds and retrieves bodies", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ id: "x" }));
    expect(w.getBody("x")?.id).toBe("x");
    expect(w.getBody("missing")).toBeUndefined();
  });

  it("moves a body by velocity * time with no friction", () => {
    const w = new PhysicsWorld(cfg());
    // Start inside the pitch (not on a wall) so this stays a pure free-motion
    // check once wall collisions land in Task 3.
    w.addBody(body({ position: { x: 100, y: 100 }, velocity: { x: 100, y: 0 } }));
    w.step(1); // one full simulated second
    expect(w.getBody("a")!.position.x).toBeCloseTo(200, 5);
  });

  it("brings a moving body to rest under friction", () => {
    const w = new PhysicsWorld(cfg({ friction: 3, restEpsilon: 1 }));
    w.addBody(body({ position: { x: 0, y: 0 }, velocity: { x: 500, y: 0 } }));
    for (let i = 0; i < 600; i++) w.step(1 / 60);
    expect(w.getBody("a")!.velocity).toEqual({ x: 0, y: 0 });
    expect(w.atRest()).toBe(true);
  });

  it("is deterministic: identical inputs give identical output", () => {
    const make = () => {
      const w = new PhysicsWorld(cfg({ friction: 1 }));
      w.addBody(body({ position: { x: 0, y: 0 }, velocity: { x: 321, y: 123 } }));
      return w;
    };
    const w1 = make();
    const w2 = make();
    for (let i = 0; i < 100; i++) {
      w1.step(1 / 60);
      w2.step(1 / 60);
    }
    expect(w1.getBody("a")!.position).toEqual(w2.getBody("a")!.position);
    expect(w1.getBody("a")!.velocity).toEqual(w2.getBody("a")!.velocity);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/world.test.ts`
Expected: FAIL — cannot resolve `./world`.

- [ ] **Step 3: Implement the world (integration + friction only)**

Create `apps/cap-kickers/src/game/physics/world.ts`:

```ts
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
```

Note: `sub` and `dot` are imported now because Task 4 uses them; they are unused until then. TypeScript `strict` here does NOT error on unused imports (PopZen sets `noUnusedLocals: false`), so this compiles. If your editor flags them, leave them — Task 4 consumes them.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/world.test.ts`
Expected: PASS (4 tests). The friction test reaches exact `{x:0,y:0}` because `applyFriction` snaps sub-epsilon speeds to zero.

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/physics/world.ts apps/cap-kickers/src/game/physics/world.test.ts
git commit -m "feat(cap-kickers): PhysicsWorld integration, friction, determinism

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wall collisions

**Files:**
- Modify: `apps/cap-kickers/src/game/physics/world.ts` (replace the `collideWalls` stub)
- Test: `apps/cap-kickers/src/game/physics/collisions.test.ts`

**Interfaces:**
- Consumes: `PhysicsWorld`, `PhysicsConfig`, `Body` from Task 2.
- Produces: no new exported symbols — `collideWalls` is private behavior. A body that reaches a boundary is repositioned flush against it and its normal velocity is reflected and scaled by `cfg.restitution`.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/physics/collisions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PhysicsWorld, type PhysicsConfig, type Body } from "./world";

const cfg = (over: Partial<PhysicsConfig> = {}): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 0,
  restitution: 0.5,
  restEpsilon: 0.0001,
  maxSubsteps: 16,
  bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
  ...over,
});

const body = (over: Partial<Body> = {}): Body => ({
  id: "a",
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
  ...over,
});

describe("wall collisions", () => {
  it("bounces a body off the right wall with restitution", () => {
    const w = new PhysicsWorld(cfg({ restitution: 0.5 }));
    w.addBody(body({ position: { x: 180, y: 100 }, velocity: { x: 100, y: 0 } }));
    for (let i = 0; i < 120; i++) w.step(1 / 120); // ~1s
    const a = w.getBody("a")!;
    expect(a.velocity.x).toBeLessThan(0); // now moving left
    expect(a.position.x + a.radius).toBeLessThanOrEqual(200 + 1e-6); // inside bounds
  });

  it("keeps a body within all four walls", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ position: { x: 20, y: 20 }, velocity: { x: -400, y: -400 } }));
    for (let i = 0; i < 240; i++) w.step(1 / 120);
    const a = w.getBody("a")!;
    expect(a.position.x - a.radius).toBeGreaterThanOrEqual(0 - 1e-6);
    expect(a.position.y - a.radius).toBeGreaterThanOrEqual(0 - 1e-6);
    expect(a.position.x + a.radius).toBeLessThanOrEqual(200 + 1e-6);
    expect(a.position.y + a.radius).toBeLessThanOrEqual(200 + 1e-6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/collisions.test.ts`
Expected: FAIL — the body leaves bounds / `velocity.x` never goes negative (stub does nothing).

- [ ] **Step 3: Implement `collideWalls`**

In `apps/cap-kickers/src/game/physics/world.ts`, replace the `collideWalls` method body:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/collisions.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/physics/world.ts apps/cap-kickers/src/game/physics/collisions.test.ts
git commit -m "feat(cap-kickers): wall collisions with restitution

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Circle-circle elastic collisions

**Files:**
- Modify: `apps/cap-kickers/src/game/physics/world.ts` (replace the `resolveCollisions` stub, add `resolvePair`)
- Test: `apps/cap-kickers/src/game/physics/collisions.test.ts` (append a describe block)

**Interfaces:**
- Consumes: `PhysicsWorld`, `Body`, and `sub`/`dot`/`scale`/`len` (already imported in Task 2).
- Produces: no new exported symbols. Overlapping bodies are pushed apart (split by inverse mass) and receive a mass-weighted elastic impulse scaled by `cfg.restitution`. Pairs are visited in stable `i<j` order.

- [ ] **Step 1: Write the failing test**

Append to `apps/cap-kickers/src/game/physics/collisions.test.ts`:

```ts
describe("circle-circle collisions", () => {
  it("swaps velocity on a head-on equal-mass elastic hit", () => {
    const w = new PhysicsWorld(cfg({ restitution: 1, bounds: { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 } }));
    w.addBody(body({ id: "a", position: { x: 0, y: 0 }, velocity: { x: 200, y: 0 } }));
    w.addBody(body({ id: "b", position: { x: 40, y: 0 }, velocity: { x: 0, y: 0 } }));
    for (let i = 0; i < 120; i++) w.step(1 / 120);
    const a = w.getBody("a")!;
    const b = w.getBody("b")!;
    expect(a.velocity.x).toBeCloseTo(0, 1); // a stopped
    expect(b.velocity.x).toBeCloseTo(200, 1); // b took the momentum
  });

  it("separates two overlapping resting bodies", () => {
    const w = new PhysicsWorld(cfg({ bounds: { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 } }));
    w.addBody(body({ id: "a", position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } }));
    w.addBody(body({ id: "b", position: { x: 5, y: 0 }, velocity: { x: 0, y: 0 } }));
    w.step(1 / 120);
    const a = w.getBody("a")!;
    const b = w.getBody("b")!;
    const gap = Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y);
    expect(gap).toBeGreaterThanOrEqual(a.radius + b.radius - 1e-6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/collisions.test.ts`
Expected: FAIL on the new block — `a` keeps its velocity / overlap not corrected (stub does nothing).

- [ ] **Step 3: Implement collision resolution**

In `apps/cap-kickers/src/game/physics/world.ts`, replace the `resolveCollisions` stub and add `resolvePair`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/collisions.test.ts`
Expected: PASS (4 tests total in the file).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/physics/world.ts apps/cap-kickers/src/game/physics/collisions.test.ts
git commit -m "feat(cap-kickers): elastic circle-circle collisions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Anti-tunneling (fast movers still collide)

**Files:**
- Test: `apps/cap-kickers/src/game/physics/tunneling.test.ts`

**Interfaces:**
- Consumes: `PhysicsWorld`, `PhysicsConfig`, `Body`.
- Produces: nothing new — this task verifies the substepping already implemented in Task 2's `computeSubsteps` prevents a high-velocity body from passing through a target within a single fixed step. If the test fails, the fix is in `computeSubsteps`/`fixedStep`, not new API.

- [ ] **Step 1: Write the failing-first guard test**

Create `apps/cap-kickers/src/game/physics/tunneling.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PhysicsWorld, type PhysicsConfig, type Body } from "./world";

const cfg = (over: Partial<PhysicsConfig> = {}): PhysicsConfig => ({
  fixedDt: 1 / 60, // deliberately coarse — one step would overshoot the target
  friction: 0,
  restitution: 1,
  restEpsilon: 0.0001,
  maxSubsteps: 64,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
  ...over,
});

const body = (over: Partial<Body> = {}): Body => ({
  id: "a",
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
  ...over,
});

describe("anti-tunneling", () => {
  it("a very fast body collides with a target instead of passing through", () => {
    const w = new PhysicsWorld(cfg());
    // 10000 u/s * (1/60) ≈ 167u of travel in ONE fixed step — that overshoots
    // the target's FAR edge (x=120), so a naive end-of-step-only overlap check
    // would miss it entirely. Only mid-flight substepping catches the collision.
    w.addBody(body({ id: "fast", position: { x: 0, y: 0 }, velocity: { x: 10000, y: 0 } }));
    w.addBody(body({ id: "target", position: { x: 100, y: 0 }, velocity: { x: 0, y: 0 } }));
    w.step(1 / 60);
    const fast = w.getBody("fast")!;
    const target = w.getBody("target")!;
    expect(target.velocity.x).toBeGreaterThan(0); // momentum transferred
    expect(fast.position.x).toBeLessThan(120); // stopped at impact, did NOT tunnel past
  });

  it("substepping preserves determinism at high speed", () => {
    const make = () => {
      const w = new PhysicsWorld(cfg());
      w.addBody(body({ id: "fast", position: { x: 0, y: 0 }, velocity: { x: 10000, y: 0 } }));
      w.addBody(body({ id: "target", position: { x: 100, y: 0 }, velocity: { x: 0, y: 0 } }));
      return w;
    };
    const w1 = make();
    const w2 = make();
    for (let i = 0; i < 30; i++) {
      w1.step(1 / 60);
      w2.step(1 / 60);
    }
    expect(w1.getBody("target")!.position).toEqual(w2.getBody("target")!.position);
    expect(w1.getBody("fast")!.velocity).toEqual(w2.getBody("fast")!.velocity);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/tunneling.test.ts`
Expected: PASS — `computeSubsteps` subdivides the coarse fixed step (travel ≈ 167u vs half-radius 5u → ~34 substeps, capped at 64), so the fast body meets the target mid-flight instead of tunneling past its far edge. The `fast.position.x < 120` assertion proves the collision was caught in-flight: with substepping disabled (`computeSubsteps` → 1), the fast body would jump to x≈167 in one step, find no end-of-step overlap, and the target's velocity would stay 0 — failing the test. If it FAILS, the fix is in `computeSubsteps`/`fixedStep`, not the test — do not weaken the test.

- [ ] **Step 3: Run the full suite**

Run: `cd apps/cap-kickers && bunx vitest run`
Expected: PASS — all four test files green (vec, world, collisions, tunneling).

- [ ] **Step 4: Commit**

```bash
git add apps/cap-kickers/src/game/physics/tunneling.test.ts
git commit -m "test(cap-kickers): guard against collision tunneling at high speed

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (this plan's slice — spec section 4 "Physics engine" + section 12 step 1):**
- Fixed-timestep accumulator decoupled from frame rate → Task 2 (`step`/`fixedStep`, accumulator). ✅
- Friction to rest → Task 2 (`applyFriction` + `restEpsilon` snap). ✅
- Circle-circle elastic collisions → Task 4. ✅
- Wall bounds → Task 3. ✅
- Sub-stepping / no tunneling on hard flicks → Task 2 (`computeSubsteps`) verified in Task 5. ✅
- Determinism (no random/time) → Tasks 2 & 5 assert identical outputs. ✅
- `devicePixelRatio` scaling and safe-area insets are **rendering** concerns, deferred to the render plan (step 3), not the engine — correctly out of scope here. The gap-crossing rule and goal/keeper detection belong to the **rules** plan (step 2) — out of scope here.

**Placeholder scan:** The Task 2 `collideWalls`/`resolveCollisions` stubs are intentional, filled by Tasks 3 & 4 respectively, and each has a real test that fails until filled. No "TBD"/"add error handling"/"write tests for the above" placeholders. All steps carry concrete code and exact run commands.

**Type consistency:** `Body`, `Bounds`, `PhysicsConfig`, and `PhysicsWorld`'s public methods (`addBody`, `getBody`, `atRest`, `step`) are defined once in Task 2 and used unchanged in Tasks 3-5. `Vec2` helpers (`add`, `sub`, `scale`, `dot`, `len`, `normalize`, `dist`) are defined in Task 1 and consumed consistently. Config field names (`fixedDt`, `friction`, `restitution`, `restEpsilon`, `maxSubsteps`, `bounds`) match across all test files and the implementation.

---

## Next plan

Plan 2 (Rules & gap-crossing state machine) builds on `world.bodies` + `world.step`: the 3-cap triangle setup, the 4-touch turn machine, the "flicked cap must pass between the other two" geometry test, out-of-bounds turn loss, goal detection, and scoring.
