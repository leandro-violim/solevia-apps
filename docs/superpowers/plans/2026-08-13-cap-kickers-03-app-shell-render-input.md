# Cap Kickers — Plan 3: App Shell + Canvas Render + Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the tested physics + rules foundation into a human-playable single-device match: a TanStack/Capacitor app rendering the pitch and caps on a `<canvas>`, with tap-to-select + swipe-to-flick input, watchable (animated) flicks, and a live score/touch HUD.

**Architecture:** Two layers. (1) A **testable core** of pure logic: `viewport` (pitch↔canvas coordinate transform), `input-mapping` (swipe→flick velocity, cap hit-testing), `FlickTracker` (step-wise gate/boundary accumulator that `resolveFlick` is refactored to reuse), and `GameSession` (owns the world + match + caps and drives an **animated** flick via `tick(dt)`). (2) A **run-verified** app layer: the app scaffold (adapted from `apps/pop-zen`) and a `/play` canvas route with a `requestAnimationFrame` loop and pointer handlers, wired to `GameSession`. Open goal (keeper is Plan 5); one device; the hotseat "rotate the phone" transition is Plan 4.

**Tech Stack:** React 19 + TanStack Start/Router + Vite + Tailwind v4 + Capacitor; TypeScript (strict); Vitest (node) for the core; bun.

## Global Constraints

- **Package manager:** bun. Core tests: `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`. Dev server: `bun run dev` (plain `vite dev`).
- **Determinism (hard requirement):** No `Math.random()`, `Date.now()`, `new Date()` in `src/game/`. (The render loop in `src/routes/` MAY read frame time from `requestAnimationFrame`'s timestamp — that is UI, not game logic, and must never leak into `src/game/`.)
- **Do not regress the foundation:** the existing 46 physics+rules tests MUST stay green after the `resolveFlick` refactor in Task 3.
- **Physics bounds ≫ pitch:** the shared physics config (`PHYSICS` constant) MUST use bounds far larger than the pitch so engine walls never mask a cap leaving the field (rules own boundary logic).
- **Scaffold hygiene (Task 5):** adapt from `apps/pop-zen` but DROP all game/ad-specific code — no `@capacitor-community/admob`, no `lib/ads`, no `AdBanner`, no bubble assets/copy. Keep only generic app-shell infra (router, root shell, error components, TanStack Start entries). Ads are Plan 8.
- **TypeScript:** `strict: true`. **Core location:** `apps/cap-kickers/src/game/`. **App location:** `apps/cap-kickers/src/routes/`, `src/router.tsx`, etc.
- **Commits:** conventional-commit style; end body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit after each task's deliverable is verified. Stay on the `cap-kickers` branch.

---

## File Structure

- `src/game/viewport.ts` (+ test) — letterbox pitch↔canvas transform.
- `src/game/input-mapping.ts` (+ test) — `capAtPoint`, `swipeToVelocity`.
- `src/game/rules/flick-tracker.ts` (+ test) — `FlickTracker` step-wise accumulator.
- `src/game/rules/flick.ts` (modified) — `resolveFlick` refactored to use `FlickTracker`.
- `src/game/constants.ts` — `PITCH`, `CAP_RADIUS`, `PHYSICS`, `MATCH`, `SWIPE`.
- `src/game/session.ts` (+ test) — `GameSession` animated turn orchestration.
- App shell (Task 5, adapted from pop-zen): `package.json` (extended), `vite.config.ts`, `vite.config.mobile.ts`, `tsconfig.json` (extended), `capacitor.config.ts`, `bunfig.toml`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `src/styles.css`, `src/start.ts`, `src/router.tsx`, `src/server.ts`, `src/lib/error-*.ts`, `src/routes/__root.tsx`, `src/routes/index.tsx`.
- `src/routes/play.tsx` (Task 6) — the canvas game route.

Task order: viewport → input-mapping → flick-tracker(+refactor) → constants+session → scaffold → play route.

---

### Task 1: Viewport coordinate transform

**Files:**
- Create: `apps/cap-kickers/src/game/viewport.ts`
- Test: `apps/cap-kickers/src/game/viewport.test.ts`

**Interfaces:**
- Consumes: `Vec2` from `./physics/vec`.
- Produces:
  - `type Size = { width: number; height: number }`
  - `type Viewport = { scale: number; offsetX: number; offsetY: number }`
  - `computeViewport(pitch: Size, canvas: Size): Viewport` — letterbox fit (uniform scale = min of the two axis ratios, centered).
  - `pitchToCanvas(p: Vec2, vp: Viewport): Vec2`, `canvasToPitch(p: Vec2, vp: Viewport): Vec2`.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/viewport.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeViewport, pitchToCanvas, canvasToPitch } from "./viewport";
import { vec } from "./physics/vec";

describe("viewport", () => {
  it("letterboxes with a uniform scale and centers the pitch", () => {
    // pitch 1000x500 into canvas 1200x500: scale limited by height (500/500=1)
    // vs width (1200/1000=1.2) -> scale 1, horizontal padding (1200-1000)/2=100.
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 1200, height: 500 });
    expect(vp.scale).toBe(1);
    expect(vp.offsetX).toBe(100);
    expect(vp.offsetY).toBe(0);
  });

  it("scales down to fit a smaller canvas", () => {
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 500, height: 500 });
    expect(vp.scale).toBe(0.5); // width-limited
    expect(vp.offsetY).toBe(125); // (500 - 500*0.5)/2
  });

  it("round-trips pitch -> canvas -> pitch", () => {
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 1200, height: 800 });
    const p = vec(321, 111);
    const back = canvasToPitch(pitchToCanvas(p, vp), vp);
    expect(back.x).toBeCloseTo(321, 6);
    expect(back.y).toBeCloseTo(111, 6);
  });

  it("maps pitch origin to the top-left of the letterboxed area", () => {
    const vp = computeViewport({ width: 1000, height: 500 }, { width: 1200, height: 500 });
    expect(pitchToCanvas(vec(0, 0), vp)).toEqual({ x: 100, y: 0 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/viewport.test.ts`
Expected: FAIL — cannot resolve `./viewport`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/viewport.ts`:

```ts
import { type Vec2 } from "./physics/vec";

export type Size = { width: number; height: number };
export type Viewport = { scale: number; offsetX: number; offsetY: number };

/** Uniform letterbox fit of the pitch inside the canvas, centered. */
export const computeViewport = (pitch: Size, canvas: Size): Viewport => {
  const scale = Math.min(canvas.width / pitch.width, canvas.height / pitch.height);
  const offsetX = (canvas.width - pitch.width * scale) / 2;
  const offsetY = (canvas.height - pitch.height * scale) / 2;
  return { scale, offsetX, offsetY };
};

export const pitchToCanvas = (p: Vec2, vp: Viewport): Vec2 => ({
  x: vp.offsetX + p.x * vp.scale,
  y: vp.offsetY + p.y * vp.scale,
});

export const canvasToPitch = (p: Vec2, vp: Viewport): Vec2 => ({
  x: (p.x - vp.offsetX) / vp.scale,
  y: (p.y - vp.offsetY) / vp.scale,
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/viewport.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/viewport.ts apps/cap-kickers/src/game/viewport.test.ts
git commit -m "feat(cap-kickers): letterbox pitch<->canvas viewport transform

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Input mapping (cap hit-test + swipe→velocity)

**Files:**
- Create: `apps/cap-kickers/src/game/input-mapping.ts`
- Test: `apps/cap-kickers/src/game/input-mapping.test.ts`

**Interfaces:**
- Consumes: `Vec2`, `sub`, `len`, `scale` from `./physics/vec`.
- Produces:
  - `type CapHit = { id: string; position: Vec2; radius: number }`
  - `capAtPoint(point: Vec2, caps: CapHit[]): string | null` — id of the cap whose circle contains `point` (nearest center wins ties); `null` if none.
  - `type SwipeOpts = { power: number; maxSpeed: number; minSpeed: number }`
  - `swipeToVelocity(start: Vec2, end: Vec2, opts: SwipeOpts): Vec2` — direction = `end - start`; speed = `|end-start| * power` clamped to `[minSpeed, maxSpeed]`; a zero-length swipe returns `{x:0,y:0}`.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/input-mapping.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { capAtPoint, swipeToVelocity } from "./input-mapping";
import { vec, len } from "./physics/vec";

const caps = [
  { id: "a", position: vec(100, 100), radius: 16 },
  { id: "b", position: vec(200, 100), radius: 16 },
];

describe("capAtPoint", () => {
  it("returns the cap whose circle contains the point", () => {
    expect(capAtPoint(vec(105, 100), caps)).toBe("a");
    expect(capAtPoint(vec(200, 108), caps)).toBe("b");
  });
  it("returns null when no cap contains the point", () => {
    expect(capAtPoint(vec(150, 100), caps)).toBeNull();
  });
  it("picks the nearest center when circles overlap the point", () => {
    const tight = [
      { id: "a", position: vec(100, 100), radius: 40 },
      { id: "b", position: vec(130, 100), radius: 40 },
    ];
    expect(capAtPoint(vec(122, 100), tight)).toBe("b"); // 8 from b, 22 from a
  });
});

describe("swipeToVelocity", () => {
  const opts = { power: 5, maxSpeed: 2400, minSpeed: 100 };
  it("points in the swipe direction", () => {
    const v = swipeToVelocity(vec(0, 0), vec(10, 0), opts);
    expect(v.y).toBe(0);
    expect(v.x).toBeGreaterThan(0);
  });
  it("scales magnitude with swipe length, clamped to maxSpeed", () => {
    const small = len(swipeToVelocity(vec(0, 0), vec(40, 0), opts)); // 40*5=200
    expect(small).toBeCloseTo(200, 4);
    const big = len(swipeToVelocity(vec(0, 0), vec(1000, 0), opts)); // 5000 -> clamped
    expect(big).toBeCloseTo(2400, 4);
  });
  it("floors a tiny non-zero swipe to minSpeed", () => {
    const v = len(swipeToVelocity(vec(0, 0), vec(2, 0), opts)); // 2*5=10 -> min 100
    expect(v).toBeCloseTo(100, 4);
  });
  it("returns zero for a zero-length swipe", () => {
    expect(swipeToVelocity(vec(5, 5), vec(5, 5), opts)).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/input-mapping.test.ts`
Expected: FAIL — cannot resolve `./input-mapping`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/input-mapping.ts`:

```ts
import { type Vec2, sub, len, scale } from "./physics/vec";

export type CapHit = { id: string; position: Vec2; radius: number };

/** Id of the cap whose circle contains `point`; nearest center wins ties; null if none. */
export const capAtPoint = (point: Vec2, caps: CapHit[]): string | null => {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of caps) {
    const d = len(sub(point, c.position));
    if (d <= c.radius && d < bestDist) {
      best = c.id;
      bestDist = d;
    }
  }
  return best;
};

export type SwipeOpts = { power: number; maxSpeed: number; minSpeed: number };

/**
 * Map a swipe (start→end, in PITCH coordinates) to a flick velocity: direction is
 * the swipe direction; speed is `|end-start| * power` clamped to [minSpeed, maxSpeed].
 * A zero-length swipe returns the zero vector.
 */
export const swipeToVelocity = (start: Vec2, end: Vec2, opts: SwipeOpts): Vec2 => {
  const delta = sub(end, start);
  const dLen = len(delta);
  if (dLen === 0) return { x: 0, y: 0 };
  const speed = Math.min(opts.maxSpeed, Math.max(opts.minSpeed, dLen * opts.power));
  return scale({ x: delta.x / dLen, y: delta.y / dLen }, speed);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/input-mapping.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/input-mapping.ts apps/cap-kickers/src/game/input-mapping.test.ts
git commit -m "feat(cap-kickers): cap hit-testing and swipe->flick velocity mapping

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: FlickTracker (step-wise) + refactor resolveFlick

**Files:**
- Create: `apps/cap-kickers/src/game/rules/flick-tracker.ts`
- Test: `apps/cap-kickers/src/game/rules/flick-tracker.test.ts`
- Modify: `apps/cap-kickers/src/game/rules/flick.ts` (refactor `resolveFlick` to use `FlickTracker`; keep its exported types + behavior identical)

**Interfaces:**
- Consumes: `Vec2` from `../physics/vec`; `PhysicsWorld` from `../physics/world`; `segmentsIntersect` from `./geometry`; `Pitch`, `classifyCap` from `./pitch`; `FlickResult`, `FlickEnding` from `./flick`.
- Produces:
  - `class FlickTracker` with `constructor(world: PhysicsWorld, pitch: Pitch, flickedId: string, gateA: Vec2, gateB: Vec2)` and `observe(): FlickResult | null` — call once AFTER each `world.step(dt)`; returns the `FlickResult` when the flick has ended (the FLICKED cap left the pitch, or the world is at rest), else `null`. Latches `crossedGate` and `anyCapLeftPitch` across calls.
- `resolveFlick` keeps its exact signature and returns identical results (it now steps the world and calls `tracker.observe()` each step).

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/rules/flick-tracker.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FlickTracker } from "./flick-tracker";
import { PhysicsWorld, type PhysicsConfig, type Body } from "../physics/world";
import { type Pitch } from "./pitch";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 };
const cfg = (): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.5,
  restEpsilon: 1,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
});
const cap = (id: string, x: number, y: number): Body => ({
  id,
  position: { x, y },
  velocity: { x: 0, y: 0 },
  radius: 8,
  mass: 1,
});

describe("FlickTracker", () => {
  it("returns null until the flick ends, then reports rest + crossedGate", () => {
    const w = new PhysicsWorld(cfg());
    const f = w.addBody(cap("f", 100, 250));
    w.addBody(cap("a", 150, 210));
    w.addBody(cap("b", 150, 290));
    const t = new FlickTracker(w, pitch, "f", { x: 150, y: 210 }, { x: 150, y: 290 });
    f.velocity = { x: 300, y: 0 };
    let result = null;
    for (let i = 0; i < 1000 && result === null; i++) {
      w.step(1 / 60);
      result = t.observe();
    }
    expect(result).not.toBeNull();
    expect(result!.crossedGate).toBe(true);
    expect(result!.flickedEnding).toBe("rest");
    expect(result!.anyCapLeftPitch).toBe(false);
  });

  it("reports the flicked cap's own goal ending", () => {
    const w = new PhysicsWorld(cfg());
    const f = w.addBody(cap("f", 700, 250));
    w.addBody(cap("a", 150, 210));
    w.addBody(cap("b", 150, 290));
    const t = new FlickTracker(w, pitch, "f", { x: 150, y: 210 }, { x: 150, y: 290 });
    f.velocity = { x: 3000, y: 0 };
    let result = null;
    for (let i = 0; i < 1000 && result === null; i++) {
      w.step(1 / 60);
      result = t.observe();
    }
    expect(result!.flickedEnding).toBe("goalRight");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/flick-tracker.test.ts`
Expected: FAIL — cannot resolve `./flick-tracker`.

- [ ] **Step 3: Implement FlickTracker**

Create `apps/cap-kickers/src/game/rules/flick-tracker.ts`:

```ts
import { type Vec2 } from "../physics/vec";
import { PhysicsWorld } from "../physics/world";
import { segmentsIntersect } from "./geometry";
import { type Pitch, classifyCap } from "./pitch";
import { type FlickResult, type FlickEnding } from "./flick";

/**
 * Step-wise accumulator for a single flick. Construct it (capturing the gate),
 * then call `observe()` once after every `world.step(dt)`. It latches whether the
 * flicked cap crossed the gate and whether any cap left the pitch, and returns the
 * FlickResult when the flick ends (the flicked cap leaves the pitch, or the world
 * comes to rest) — otherwise null.
 */
export class FlickTracker {
  private crossedGate = false;
  private anyCapLeftPitch = false;
  private prev: Vec2;

  constructor(
    private readonly world: PhysicsWorld,
    private readonly pitch: Pitch,
    private readonly flickedId: string,
    private readonly gateA: Vec2,
    private readonly gateB: Vec2,
  ) {
    const f = world.getBody(flickedId);
    if (!f) throw new Error("FlickTracker: unknown flicked cap id");
    this.prev = { x: f.position.x, y: f.position.y };
  }

  observe(): FlickResult | null {
    const flicked = this.world.getBody(this.flickedId)!;
    const cur: Vec2 = { x: flicked.position.x, y: flicked.position.y };
    if (!this.crossedGate && segmentsIntersect(this.prev, cur, this.gateA, this.gateB)) {
      this.crossedGate = true;
    }
    this.prev = cur;

    let flickedEnding: FlickEnding | null = null;
    for (const b of this.world.bodies) {
      const zone = classifyCap(b, this.pitch);
      if (zone !== "in") {
        this.anyCapLeftPitch = true;
        if (b.id === this.flickedId) flickedEnding = zone;
      }
    }

    if (flickedEnding) {
      return { crossedGate: this.crossedGate, flickedEnding, anyCapLeftPitch: this.anyCapLeftPitch };
    }
    if (this.world.atRest()) {
      return { crossedGate: this.crossedGate, flickedEnding: "rest", anyCapLeftPitch: this.anyCapLeftPitch };
    }
    return null;
  }

  /** Latched state so far — used by resolveFlick's maxSteps-exhausted fallback. */
  snapshot(): { crossedGate: boolean; anyCapLeftPitch: boolean } {
    return { crossedGate: this.crossedGate, anyCapLeftPitch: this.anyCapLeftPitch };
  }
}
```

- [ ] **Step 4: Run the tracker test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/flick-tracker.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Refactor `resolveFlick` to reuse FlickTracker**

Replace the body of `resolveFlick` in `apps/cap-kickers/src/game/rules/flick.ts` so it delegates the per-step logic to `FlickTracker` (keep the exported `FlickEnding`/`FlickResult`/`ResolveOpts` types and the function signature EXACTLY as they are). New `flick.ts` (types unchanged at top; import and rewrite the function):

```ts
import { type Vec2 } from "../physics/vec";
import { PhysicsWorld } from "../physics/world";
import { type Pitch } from "./pitch";
import { FlickTracker } from "./flick-tracker";

export type FlickEnding = "rest" | "out" | "goalLeft" | "goalRight";

export type FlickResult = {
  crossedGate: boolean;
  flickedEnding: FlickEnding;
  anyCapLeftPitch: boolean;
};

export type ResolveOpts = { dt?: number; maxSteps?: number };

/**
 * Apply `velocity` to the flicked cap, then simulate the world until it comes to
 * rest or the flicked cap leaves the pitch. Reports whether the flicked cap crossed
 * the gate (segment between the other two caps at flick time), the flicked cap's own
 * ending, and whether ANY cap left the pitch. The physics world MUST have bounds far
 * larger than the pitch so its walls never mask a cap leaving the field.
 */
export const resolveFlick = (
  world: PhysicsWorld,
  pitch: Pitch,
  flickedId: string,
  otherIds: [string, string],
  velocity: Vec2,
  opts: ResolveOpts = {},
): FlickResult => {
  const dt = opts.dt ?? 1 / 60;
  const maxSteps = opts.maxSteps ?? 1000;

  const flicked = world.getBody(flickedId);
  const otherA = world.getBody(otherIds[0]);
  const otherB = world.getBody(otherIds[1]);
  if (!flicked || !otherA || !otherB) {
    throw new Error("resolveFlick: unknown cap id");
  }

  const gateA: Vec2 = { x: otherA.position.x, y: otherA.position.y };
  const gateB: Vec2 = { x: otherB.position.x, y: otherB.position.y };
  const tracker = new FlickTracker(world, pitch, flickedId, gateA, gateB);

  flicked.velocity = { x: velocity.x, y: velocity.y };

  for (let step = 0; step < maxSteps; step++) {
    world.step(dt);
    const result = tracker.observe();
    if (result) return result;
  }

  // maxSteps exhausted before rest: preserve the latched gate/boundary state.
  const s = tracker.snapshot();
  return { crossedGate: s.crossedGate, flickedEnding: "rest", anyCapLeftPitch: s.anyCapLeftPitch };
};
```

Note: the fall-through return (maxSteps exhausted) reports `rest`; with the shipped `friction` configs the world always reaches rest first. `FlickResult` shape is unchanged from the current repo (post-Plan-2-fix): `{ crossedGate, flickedEnding, anyCapLeftPitch }` — `match.ts` and the flick tests already expect exactly this.

- [ ] **Step 6: Run the full suite to verify no regression**

Run: `cd apps/cap-kickers && bunx vitest run`
Expected: PASS — all 46 prior tests (incl. `flick.test.ts`'s 6 and `match.test.ts`) plus the 2 new tracker tests → **48 total**. If `flick.test.ts` fails, the refactor changed observable behavior — fix the refactor, not the tests.

- [ ] **Step 7: Commit**

```bash
git add apps/cap-kickers/src/game/rules/flick-tracker.ts apps/cap-kickers/src/game/rules/flick-tracker.test.ts apps/cap-kickers/src/game/rules/flick.ts
git commit -m "refactor(cap-kickers): extract FlickTracker; resolveFlick reuses it

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Constants + animated GameSession

**Files:**
- Create: `apps/cap-kickers/src/game/constants.ts`
- Create: `apps/cap-kickers/src/game/session.ts`
- Test: `apps/cap-kickers/src/game/session.test.ts`

**Interfaces:**
- Consumes: `PhysicsWorld`, `PhysicsConfig`, `Body` from `./physics/world`; `Vec2` from `./physics/vec`; `Pitch`, `PlayerSide` from `./rules/pitch`; `makeTriangle` from `./rules/setup`; `FlickTracker` from `./rules/flick-tracker`; `applyFlick`, `initialMatch`, `MatchState`, `MatchConfig`, `TurnResult` from `./rules/match`.
- Produces:
  - `constants.ts`: `PITCH: Pitch`, `CAP_RADIUS: number`, `PHYSICS: PhysicsConfig`, `MATCH: MatchConfig`, `SWIPE: SwipeOpts`.
  - `session.ts`:
    - `type SessionPhase = "aiming" | "resolving"`
    - `type FlickReport = { result: TurnResult; match: MatchState }`
    - `class GameSession` with: `constructor(cfg?: Partial<SessionConfig>)`, `readonly world`, `match: MatchState`, `phase: SessionPhase`, `selectedCapId: string | null`, `caps(): { id; position: Vec2; radius }[]`, `selectCap(id)`, `beginFlick(capId, velocity): void` (starts an animated flick; no-op unless `phase==="aiming"`), `tick(dt): FlickReport | null` (steps the animated flick; returns a report the frame it finalizes, else null), and the batch helper is NOT needed here (the render loop uses `beginFlick`+`tick`).

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/session.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { GameSession } from "./session";

// Run an animated flick to completion, returning the finalizing report.
const runFlick = (s: GameSession, capId: string, v: { x: number; y: number }) => {
  s.beginFlick(capId, v);
  let report = null;
  for (let i = 0; i < 2000 && report === null; i++) report = s.tick(1 / 60);
  return report;
};

describe("GameSession", () => {
  it("starts with 3 caps in side-0 triangle, touch 1, aiming", () => {
    const s = new GameSession();
    expect(s.caps()).toHaveLength(3);
    expect(s.match.attacker).toBe(0);
    expect(s.match.touch).toBe(1);
    expect(s.phase).toBe("aiming");
    // side-0 triangle sits in the left half
    for (const c of s.caps()) expect(c.position.x).toBeLessThan(s /* pitch */ .world.cfg.bounds.maxX);
  });

  it("advances the touch on a legal build-up flick without repositioning", () => {
    const s = new GameSession();
    // apex cap c2 flicked left, threading the vertical gate between c0 and c1,
    // resting in-bounds (see plan notes for the geometry).
    const apex = s.caps().find((c) => c.id === "c2")!;
    const report = runFlick(s, "c2", { x: -300, y: 0 });
    expect(report!.result).toBe("advance");
    expect(s.match.touch).toBe(2);
    expect(s.match.attacker).toBe(0);
    // c2 moved left from its apex, not reset to a triangle
    expect(s.caps().find((c) => c.id === "c2")!.position.x).toBeLessThan(apex.position.x);
  });

  it("turns over and repositions to side 1 when a cap flies out during build-up", () => {
    const s = new GameSession();
    const report = runFlick(s, "c2", { x: 0, y: -5000 }); // straight out the top
    expect(report!.result).toBe("turnover");
    expect(s.match.attacker).toBe(1);
    expect(s.match.touch).toBe(1);
    // side-1 triangle sits in the right half
    expect(s.caps().some((c) => c.position.x > 500)).toBe(true);
  });

  it("scores on a 4th-touch shot into the right goal, then kicks off to side 1", () => {
    const s = new GameSession();
    s.match = { ...s.match, touch: 4 };
    const report = runFlick(s, "c2", { x: 6000, y: 0 }); // across the pitch into the right goal
    expect(report!.result).toBe("goal");
    expect(s.match.scores).toEqual([1, 0]);
    expect(s.match.attacker).toBe(1);
  });

  it("ignores beginFlick while already resolving", () => {
    const s = new GameSession();
    s.beginFlick("c2", { x: -300, y: 0 });
    expect(s.phase).toBe("resolving");
    s.beginFlick("c0", { x: 5000, y: 0 }); // ignored
    let report = null;
    for (let i = 0; i < 2000 && report === null; i++) report = s.tick(1 / 60);
    expect(report).not.toBeNull(); // the first flick still resolves normally
  });
});
```

Note: the first test's last line is intentionally loose (just asserts caps exist within world bounds). If it reads awkwardly, replace it with `expect(s.caps().every((c) => c.position.x < 500)).toBe(true)` — side-0 triangle is in the left half of the 1000-wide pitch.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/session.test.ts`
Expected: FAIL — cannot resolve `./session`.

- [ ] **Step 3: Implement constants**

Create `apps/cap-kickers/src/game/constants.ts`:

```ts
import { type PhysicsConfig } from "./physics/world";
import { type Pitch } from "./rules/pitch";
import { type MatchConfig } from "./rules/match";
import { type SwipeOpts } from "./input-mapping";

// Landscape pitch, ~1.6:1. Goal mouth is the middle 220 of the 620-tall end lines.
export const PITCH: Pitch = { width: 1000, height: 620, goalWidth: 220 };
export const CAP_RADIUS = 16;

export const PHYSICS: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  // Bounds far larger than the pitch: engine walls never fire; rules own boundaries.
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

export const MATCH: MatchConfig = { goalsToWin: 3 };

// Swipe feel — tune by playing. power multiplies swipe length (pitch units).
export const SWIPE: SwipeOpts = { power: 5, maxSpeed: 2600, minSpeed: 120 };
```

- [ ] **Step 4: Implement GameSession**

Create `apps/cap-kickers/src/game/session.ts`:

```ts
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

  private flickedId: string | null = null;
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
    if (this.phase !== "aiming" || !(CAP_IDS as readonly string[]).includes(capId)) return;
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
    this.flickedId = capId;
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
    this.flickedId = null;
    this.phase = "aiming";
    if (result === "turnover" || result === "goal") {
      this.positionTriangle(state.attacker);
    }
    return { result, match: state };
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/session.test.ts`
Expected: PASS (5 tests). Geometry note for the "advance" test: side-0 triangle at `CAP_RADIUS=16` is `c0=(64,262)`, `c1=(64,358)`, `c2=(128,310)` (margin 64, spread 48, depth 64, mid 310). Flicking `c2` with `{x:-300,y:0}` moves it left through the gate segment `c0–c1` (a vertical line at x=64, y∈[262,358]) at y=310 — between them, no collision (48 > 32 radii sum) — and rests near x≈28 (travel ≈ v/friction = 100), in-bounds. So `crossedGate` true, `flickedEnding` "rest" → advance. If physics tuning shifts the rest point, keep the asserted `result` semantics and adjust only the velocity constant, documenting it.

- [ ] **Step 6: Run the full suite**

Run: `cd apps/cap-kickers && bunx vitest run`
Expected: PASS — 48 prior + 5 session = **53 total**.

- [ ] **Step 7: Commit**

```bash
git add apps/cap-kickers/src/game/constants.ts apps/cap-kickers/src/game/session.ts apps/cap-kickers/src/game/session.test.ts
git commit -m "feat(cap-kickers): animated GameSession turn orchestration + constants

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: App scaffold (adapted from pop-zen, no ads/game code)

**Goal:** Extend `apps/cap-kickers` from a test-only package into a runnable TanStack Start + Capacitor app whose home route renders in the browser — WITHOUT any ad/game-specific code. Verified by build + boot, not unit tests.

**Files (create/adapt — see the "copy source" for each):**
- `package.json` — extend the existing one: keep `name` `@solevia/cap-kickers`, keep the `test` script and `typescript`/`vitest` devDeps, and ADD the app-shell deps + scripts from pop-zen. Copy pop-zen's `dependencies` **except `@capacitor-community/admob`**, and pop-zen's `devDependencies`, and its scripts (`dev`, `build`, `build:mobile`, `build:dev`, `preview`, `lint`, `format`, `test`, `test:watch`).
- `bunfig.toml` — copy pop-zen's verbatim (the `@lovable.dev/*` release-age excludes are required for install).
- `vite.config.ts`, `vite.config.mobile.ts` — copy pop-zen's verbatim.
- `tsconfig.json` — replace cap-kickers' minimal one with pop-zen's (has `jsx`, `paths`), but DROP the `@solevia/consent` path unless needed (cap-kickers doesn't import it yet). Ensure `include` still covers `src/**/*.ts` and `src/**/*.tsx` (the `src/game/**` code + tests are under `src`).
- `eslint.config.js`, `.prettierrc`, `.gitignore` — copy pop-zen's verbatim.
- `capacitor.config.ts` — copy pop-zen's and change `appId` to `app.solevia.capkickers`, `appName` to `"Cap Kickers"`. Keep `webDir: "dist/client"`, `ios.contentInset: "never"`.
- `src/styles.css` — copy pop-zen's Tailwind v4 header structure (`@import "tailwindcss" source(none)`, `@source "../src"`, `@import "tw-animate-css"`, `@custom-variant dark`, the `@theme inline` token block, and a `:root` with sensible neutral color values) — but DROP pop-zen's `bubbleFloat` keyframe and any bubble-specific rules. A minimal token set is fine; the canvas draws its own colors.
- `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `src/lib/lovable-error-reporting.ts` — copy pop-zen's verbatim (generic app-shell error infra used by `server.ts`/`__root.tsx`).
- `src/start.ts`, `src/router.tsx`, `src/server.ts` — copy pop-zen's verbatim.
- `src/routes/__root.tsx` — copy pop-zen's, then DROP: the `initAds`/`showBanner` import + the `useEffect` that calls them (in `RootComponent`, leave just the `QueryClientProvider` + `Outlet`); change the title/description/og meta to Cap Kickers; change `theme-color` to a pitch-appropriate color (e.g. `#0f6b3a`). Keep `reportLovableError`, the shell/error/not-found components.
- `src/routes/index.tsx` — replace pop-zen's bubble home with a minimal Cap Kickers home: a title, a one-line description, and a `<Link to="/play">Play</Link>` button. NO ad components, NO bubble asset. Keep the `createFileRoute("/")({ head, component })` pattern and the `safe-area-inset-top` padding pattern.

Do NOT copy: `routeTree.gen.ts` (regenerated by the router plugin on `dev`/`build`), `bun.lock` (regenerated by install), `dist/`, `ios/`, `.lovable/`, `ADMOB.md`, `NATIVE.md`, `components.json` (optional — only if you want shadcn later), any `src/components/*` or game `src/lib/*` from pop-zen.

**Steps:**

- [ ] **Step 1: Extend `package.json`** with the app deps + scripts (per the file note above; drop `@capacitor-community/admob`). Keep the existing `test` script.
- [ ] **Step 2: Copy the config files** (`bunfig.toml`, both vite configs, `tsconfig.json` adapted, `eslint.config.js`, `.prettierrc`, `.gitignore`, `capacitor.config.ts` adapted).
- [ ] **Step 3: Copy the app-shell src** (`styles.css` trimmed, `lib/error-*.ts`, `start.ts`, `router.tsx`, `server.ts`, `routes/__root.tsx` de-added, `routes/index.tsx` minimal).
- [ ] **Step 4: Install.** Run `cd apps/cap-kickers && bun install`. Expected: resolves all deps including `@lovable.dev/vite-tanstack-config`. **If the private `@lovable.dev/*` packages fail to resolve, STOP and report BLOCKED** — the scaffold can't proceed without them; the controller will decide (they are installed in `apps/pop-zen`, so a workspace/registry issue is the likely cause).
- [ ] **Step 5: Verify the core still tests green.** Run `cd apps/cap-kickers && bunx vitest run`. Expected: the 53 `src/game` tests still pass (adding app deps must not disturb them). If vitest now tries to run in a DOM context or picks up new config, ensure `vitest.config.ts` still sets `environment: "node"` and `include: ["src/**/*.test.ts"]`.
- [ ] **Step 6: Boot the dev server.** Run `cd apps/cap-kickers && bun run dev` (background it). Expected: Vite starts and serves the app. Capture the URL/port from the output.
- [ ] **Step 7: Verify the home route renders.** Open the dev URL in the browser preview (`mcp__Claude_Browser__preview_start` with the dev URL, or navigate to it) and confirm the Cap Kickers home page shows the title + Play link with no console errors. Take a screenshot.
- [ ] **Step 8: Commit** the scaffold:

```bash
git add apps/cap-kickers
git commit -m "feat(cap-kickers): scaffold TanStack/Capacitor app shell (no ads)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Reviewer/verification note:** this task has no unit tests; its deliverable is "install succeeds, 53 core tests still green, dev server boots, home route renders without console errors (screenshot attached in the report)."

---

### Task 6: The `/play` canvas route (render loop + input + HUD)

**Goal:** A playable single-device match on `/play`: a `<canvas>` renders the pitch, goals, caps, selection, and an aim hint; pointer input selects a cap and swipes to flick; the render loop animates flicks via `GameSession.tick(dt)`; a HUD shows the score, whose turn, and the touch pips. Verified by playing in the browser preview.

**Files:**
- Create: `apps/cap-kickers/src/routes/play.tsx`
- (Update `src/routes/index.tsx`'s Play link target if needed — it already points to `/play`.)

**Interfaces consumed:** `GameSession`, `SWIPE`, `PITCH`, `CAP_RADIUS` from `../game/*`; `computeViewport`, `pitchToCanvas`, `canvasToPitch` from `../game/viewport`; `capAtPoint`, `swipeToVelocity` from `../game/input-mapping`.

**Design (implement as one route component):**
- `createFileRoute("/play")({ component: PlayPage })`, orientation via CSS (the game area fills `100dvh`/`100dvw`; landscape is assumed — a portrait hint is a Plan 4 nicety).
- A `useRef` holds one `GameSession` (created once). A `<canvas>` ref sized to its container with `devicePixelRatio` (set `canvas.width/height` to CSS size × dpr; scale the 2D context by dpr).
- A `requestAnimationFrame` loop: compute `dt` from the rAF timestamp (clamp to ≤ 1/30 to avoid huge steps), call `session.tick(dt)` (animates any in-flight flick; when it returns a report, stash it to update the HUD via React state — score/turn/last-result), then render.
- **Render** each frame: clear; compute `viewport = computeViewport(PITCH, {canvas css size})`; draw the pitch rectangle (green fill, white boundary), the two goal mouths (as gaps/rectangles on the end lines), each cap (circle; the selected cap highlighted; during aiming, tint the current attacker's caps), and — while the player is dragging — an **aim hint** line + power tint from the selected cap in the swipe direction.
- **Input** (pointer events on the canvas, converted to pitch coords via `canvasToPitch`):
  - `pointerdown`: if `phase==="aiming"`, `capAtPoint(pitchPoint, session.caps())`; if it hits a cap, select it and record the drag start.
  - `pointermove`: if dragging a selected cap, update the drag-current point (for the aim hint).
  - `pointerup`: if dragging, `velocity = swipeToVelocity(dragStart, dragCurrent, SWIPE)`; if non-zero, `session.beginFlick(selectedId, velocity)`; clear drag state. (A swipe anywhere on the canvas after selecting counts; direction is start→current.)
- **HUD** (React DOM overlay, absolutely positioned): score `A – B`, "Player 1/2 to shoot" or "attacking", and touch pips `●●●●` with the current touch filled (from `session.match.touch`). On a `goal`/`win` report, briefly flash a banner ("GOAL!" / "Player N wins!"). A "New match" button that reconstructs the session.
- Keep it dependency-light: plain canvas 2D, no game framework. Colors are the route's own concern (a readable default: pitch `#1f7a44`, lines `#eaf6ee`, caps for attacker tinted vs neutral, selection ring `#ffd54a`).

**Steps:**

- [ ] **Step 1: Implement `src/routes/play.tsx`** per the design above. (No unit test — verified by running. Keep the render/input pure of game logic; all rules go through `GameSession`.)
- [ ] **Step 2: Type/lint check.** Run `cd apps/cap-kickers && bunx tsc --noEmit` (expect clean) and `bunx vitest run` (expect the 53 core tests still green — the route isn't tested but must not break the build).
- [ ] **Step 3: Boot + play in the browser preview.** With `bun run dev` running, open `/play` in the browser preview. Verify: caps render in a triangle; tapping a cap selects it (ring); swiping flicks it and you SEE it slide; threading the gate on touches 1–3 advances the pips; missing/going out passes the turn and resets the triangle to the other side; on touch 4 a shot into a goal increments the score and flashes GOAL. Capture 1–2 screenshots.
- [ ] **Step 4: Tune feel if needed.** If flicks feel too weak/strong, adjust `SWIPE`/`PHYSICS.friction` in `constants.ts` (re-run the 53 tests after — the session tests use explicit velocities and should stay green, but confirm). Document any constant changes.
- [ ] **Step 5: Commit:**

```bash
git add apps/cap-kickers/src/routes/play.tsx apps/cap-kickers/src/game/constants.ts
git commit -m "feat(cap-kickers): playable /play canvas route (render, swipe input, HUD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Reviewer/verification note:** deliverable is "a playable match on `/play`: select→swipe→watch flick, gate rule enforced, turns/score/pips update, screenshots attached." Rendering correctness is judged from screenshots + the report, not unit tests.

---

## Self-Review

**Spec coverage (design spec section 4/5/9 + build-order step 3):**
- Canvas render of pitch + caps (Option A) → Task 6. ✅
- Swipe-to-flick with aim hint → Task 2 (mapping) + Task 6 (hint render). ✅
- Coordinate transform for a responsive/letterboxed landscape canvas → Task 1. ✅
- Watchable (animated) flicks → Task 3 (FlickTracker) + Task 4 (`GameSession.tick`). ✅
- Turn loop wired end-to-end (resolve → apply → reposition), score/touch HUD → Task 4 + Task 6. ✅
- App shell reusing the PopZen stack, no ads yet → Task 5. ✅
- Out of scope (correctly deferred): keeper (Plan 5), hotseat rotate + menus/modes (Plan 4), campaign (Plan 6), tutorial (Plan 7), ads/monetization/native build (Plan 8).

**Placeholder scan:** Tasks 1–4 carry complete code + exact commands. Tasks 5–6 are run-verified (no unit tests by nature — scaffold and canvas rendering); their steps name exact copy sources, exact drops, and concrete verification (install/boot/screenshot). Not placeholders — appropriate for infra/visual work.

**Type consistency:** `Viewport`/`Size` (Task 1) used by Task 6. `CapHit`/`SwipeOpts` (Task 2) consumed by `constants.ts` (`SWIPE: SwipeOpts`) and Task 6. `FlickTracker` (Task 3) consumed by `resolveFlick` (Task 3) and `GameSession` (Task 4); its `observe()` returns the current `FlickResult` shape `{ crossedGate, flickedEnding, anyCapLeftPitch }` — matching `match.ts`. `GameSession` public surface (`caps`, `selectCap`, `beginFlick`, `tick`, `match`, `phase`) is what Task 6 calls. Constants types (`Pitch`, `PhysicsConfig`, `MatchConfig`, `SwipeOpts`) all imported from their defining modules.

**Risk called out:** Task 5 depends on the private `@lovable.dev/vite-tanstack-config` resolving via `bun install` (it is present in `apps/pop-zen`); if it can't resolve, Task 5 reports BLOCKED rather than guessing. Tasks 1–4 are independent of it and deliver the fully-tested game core regardless.

---

## Next plan

Plan 4 (2-player hotseat): the "pass the phone" 180° board flip between turns, a home/mode menu (Solo vs AI placeholder / 2-Player), and match-over flow — building on the `GameSession` and `/play` route from this plan.
