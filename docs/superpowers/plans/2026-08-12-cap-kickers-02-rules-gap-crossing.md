# Cap Kickers — Plan 2: Rules & Gap-Crossing State Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the game-rules layer on top of the Plan 1 physics engine — the pitch model, the "flick must pass between the other two caps" geometry, the flick-resolution engine that ties physics to rules, and the match state machine (4-touch turns, out-of-bounds turn loss, goal scoring, first-to-N) — all as pure, deterministic, unit-tested TypeScript.

**Architecture:** New `src/game/rules/` package that consumes `src/game/physics/` (`Vec2`, `Body`, `PhysicsWorld`). Rules never own rendering. The flick-resolution engine drives the physics world to rest while sampling positions to answer two questions — did the flicked cap cross the "gate" (the segment between the other two caps captured at flick time), and how did the flick end (rest in-bounds / out of pitch / into a goal). The match state machine is a pure reducer over flick results. Physical cap repositioning on turnover/goal is left to the orchestration/render plan (Plan 3); this plan produces the pure logic those layers call.

**Tech Stack:** TypeScript (strict), Vitest (node), bun. No new dependencies.

## Global Constraints

- **Package manager:** bun. Tests: `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`.
- **Determinism (hard requirement):** No `Math.random()`, `Date.now()`, `new Date()` anywhere in `src/game/`. Iterate bodies/pairs in stable array order.
- **Physics bounds ≫ pitch:** The rules layer detects out-of-bounds/goals against the *pitch* rectangle. The `PhysicsWorld` used for flick resolution MUST be configured with `bounds` far larger than the pitch (e.g. pitch expanded by ±100000) so the engine's reflecting walls never fire inside the pitch and never mask a cap leaving the field. Rules own all boundary logic.
- **Rules confirmed for v1 (encode exactly):**
  - 3 identical caps; all three belong to and are moved by the current attacker.
  - A turn is up to 4 touches. Each touch: select a cap, flick it.
  - **Touches 1–3 (build-up):** the flick is legal iff the flicked cap passed **between the other two caps** (crossed the gate) AND every cap stayed inside the pitch. A cap crossing ANY pitch boundary during build-up — sidelines OR goal lines — is out of bounds = **turn loss**. Legal build-up flick → next touch, same attacker, caps stay where they rest.
  - **Touch 4 (the shot):** the gate does NOT apply. If the flicked cap enters the attacker's **target goal** (the opponent's goal) → **goal**. Otherwise (rest / out / wrong goal) → turn passes. **Only the 4th touch can score.**
  - Player 0 defends the **left** goal and attacks the **right**; player 1 defends **right**, attacks **left**.
  - On turn loss or goal, the new attacker starts a fresh triangle in front of their own goal.
  - **First to N goals wins** (N = `goalsToWin`, configurable).
- **TypeScript:** `strict: true`. **Location:** all code under `apps/cap-kickers/src/game/rules/`.
- **Commits:** conventional-commit style; end body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit after each task's tests pass. Stay on the `cap-kickers` branch.

---

## File Structure

- `src/game/rules/geometry.ts` — segment-intersection primitive (`segmentsIntersect`). Pure math.
- `src/game/rules/geometry.test.ts`
- `src/game/rules/pitch.ts` — `Pitch`, `PlayerSide`, `GoalSide`, `CapZone`, `attackingGoal`/`defendingGoal`, `classifyCap`, `goalZone`. Pure.
- `src/game/rules/pitch.test.ts`
- `src/game/rules/setup.ts` — `makeTriangle`. Pure.
- `src/game/rules/setup.test.ts`
- `src/game/rules/flick.ts` — `FlickResult`, `resolveFlick` (drives `PhysicsWorld`, samples path, detects gate crossing + ending). Consumes physics + geometry + pitch.
- `src/game/rules/flick.test.ts`
- `src/game/rules/match.ts` — `MatchState`, `MatchConfig`, `TurnResult`, `initialMatch`, `applyFlick`. Pure reducer over `FlickResult`.
- `src/game/rules/match.test.ts`

Dependency order: geometry → pitch → setup → flick (uses geometry+pitch+physics) → match (uses flick types + pitch).

---

### Task 1: Segment-intersection geometry

**Files:**
- Create: `apps/cap-kickers/src/game/rules/geometry.ts`
- Test: `apps/cap-kickers/src/game/rules/geometry.test.ts`

**Interfaces:**
- Consumes: `Vec2` from `../physics/vec`.
- Produces: `segmentsIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean` — true iff segment p1→p2 intersects segment p3→p4 (including endpoint touches and collinear overlap). Used by Task 4 to detect the flicked cap crossing the gate.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/rules/geometry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { segmentsIntersect } from "./geometry";
import { vec } from "../physics/vec";

describe("segmentsIntersect", () => {
  it("detects a clean X crossing", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 10), vec(0, 10), vec(10, 0))).toBe(true);
  });

  it("returns false for parallel non-touching segments", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 0), vec(0, 5), vec(10, 5))).toBe(false);
  });

  it("returns false for disjoint segments", () => {
    expect(segmentsIntersect(vec(0, 0), vec(1, 0), vec(5, 5), vec(6, 6))).toBe(false);
  });

  it("detects a shared endpoint (T-touch)", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 0), vec(10, 0), vec(10, 10))).toBe(true);
  });

  it("detects collinear overlap", () => {
    expect(segmentsIntersect(vec(0, 0), vec(10, 0), vec(5, 0), vec(15, 0))).toBe(true);
  });

  it("detects a segment crossing a vertical gate", () => {
    // horizontal path at y=5 crossing a vertical gate x=5 from y=0..10
    expect(segmentsIntersect(vec(0, 5), vec(10, 5), vec(5, 0), vec(5, 10))).toBe(true);
    // same path but gate entirely above the path -> no crossing
    expect(segmentsIntersect(vec(0, 5), vec(10, 5), vec(5, 6), vec(5, 16))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/geometry.test.ts`
Expected: FAIL — cannot resolve `./geometry`.

- [ ] **Step 3: Implement the geometry module**

Create `apps/cap-kickers/src/game/rules/geometry.ts`:

```ts
import { type Vec2 } from "../physics/vec";

// Signed area * 2 of triangle (p1, p2, p3): >0 CCW, <0 CW, 0 collinear.
const orient = (p1: Vec2, p2: Vec2, p3: Vec2): number =>
  (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

// Assuming p, q, r are collinear, is q within the bounding box of segment p..r?
const onSegment = (p: Vec2, q: Vec2, r: Vec2): boolean =>
  Math.min(p.x, r.x) <= q.x &&
  q.x <= Math.max(p.x, r.x) &&
  Math.min(p.y, r.y) <= q.y &&
  q.y <= Math.max(p.y, r.y);

/**
 * Do segments p1..p2 and p3..p4 intersect? Includes endpoint touches and
 * collinear overlap. Standard orientation test (CLRS).
 */
export const segmentsIntersect = (p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean => {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p1, p4)) return true;
  if (d2 === 0 && onSegment(p3, p2, p4)) return true;
  if (d3 === 0 && onSegment(p1, p3, p2)) return true;
  if (d4 === 0 && onSegment(p1, p4, p2)) return true;

  return false;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/geometry.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/rules/geometry.ts apps/cap-kickers/src/game/rules/geometry.test.ts
git commit -m "feat(cap-kickers): segment-intersection geometry for gate crossing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Pitch model + cap classification

**Files:**
- Create: `apps/cap-kickers/src/game/rules/pitch.ts`
- Test: `apps/cap-kickers/src/game/rules/pitch.test.ts`

**Interfaces:**
- Consumes: `Body` from `../physics/world`.
- Produces:
  - `type PlayerSide = 0 | 1`
  - `type GoalSide = "left" | "right"`
  - `type CapZone = "in" | "out" | "goalLeft" | "goalRight"`
  - `type Pitch = { width: number; height: number; goalWidth: number }`
  - `attackingGoal(side: PlayerSide): GoalSide` (0→"right", 1→"left"), `defendingGoal(side): GoalSide`
  - `classifyCap(body: Body, pitch: Pitch): CapZone` — classify a cap by its CENTER against `[0,width]×[0,height]`; crossing an end line within the goal mouth → `goalLeft`/`goalRight`, crossing any other boundary → `out`, else `in`.
  - `goalZone(side: GoalSide): CapZone` ("left"→"goalLeft", "right"→"goalRight")

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/rules/pitch.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { classifyCap, attackingGoal, defendingGoal, goalZone, type Pitch } from "./pitch";
import { type Body } from "../physics/world";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 }; // mouth y in [150,350]

const cap = (x: number, y: number): Body => ({
  id: "c",
  position: { x, y },
  velocity: { x: 0, y: 0 },
  radius: 10,
  mass: 1,
});

describe("pitch classification", () => {
  it("maps attacking/defending goals per side", () => {
    expect(attackingGoal(0)).toBe("right");
    expect(attackingGoal(1)).toBe("left");
    expect(defendingGoal(0)).toBe("left");
    expect(defendingGoal(1)).toBe("right");
    expect(goalZone("left")).toBe("goalLeft");
    expect(goalZone("right")).toBe("goalRight");
  });

  it("classifies a center inside the pitch as 'in'", () => {
    expect(classifyCap(cap(400, 250), pitch)).toBe("in");
  });

  it("classifies crossing the right end line inside the mouth as goalRight", () => {
    expect(classifyCap(cap(800, 250), pitch)).toBe("goalRight");
    expect(classifyCap(cap(810, 250), pitch)).toBe("goalRight");
  });

  it("classifies crossing the left end line inside the mouth as goalLeft", () => {
    expect(classifyCap(cap(0, 250), pitch)).toBe("goalLeft");
  });

  it("classifies crossing an end line OUTSIDE the mouth as out", () => {
    expect(classifyCap(cap(800, 100), pitch)).toBe("out"); // above the mouth
    expect(classifyCap(cap(0, 400), pitch)).toBe("out"); // below the mouth
  });

  it("classifies crossing top/bottom sidelines as out", () => {
    expect(classifyCap(cap(400, 0), pitch)).toBe("out");
    expect(classifyCap(cap(400, 500), pitch)).toBe("out");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/pitch.test.ts`
Expected: FAIL — cannot resolve `./pitch`.

- [ ] **Step 3: Implement the pitch module**

Create `apps/cap-kickers/src/game/rules/pitch.ts`:

```ts
import { type Body } from "../physics/world";

export type PlayerSide = 0 | 1;
export type GoalSide = "left" | "right";
export type CapZone = "in" | "out" | "goalLeft" | "goalRight";

export type Pitch = {
  width: number;
  height: number;
  goalWidth: number; // vertical extent of each goal mouth, centered on height/2
};

// Player 0 defends the left goal and attacks the right; player 1 is mirrored.
export const attackingGoal = (side: PlayerSide): GoalSide => (side === 0 ? "right" : "left");
export const defendingGoal = (side: PlayerSide): GoalSide => (side === 0 ? "left" : "right");
export const goalZone = (side: GoalSide): CapZone => (side === "left" ? "goalLeft" : "goalRight");

const inGoalMouth = (y: number, pitch: Pitch): boolean => {
  const half = pitch.goalWidth / 2;
  const mid = pitch.height / 2;
  return y >= mid - half && y <= mid + half;
};

/**
 * Classify a cap by its CENTER against the pitch rectangle [0,width]×[0,height].
 * Crossing an end line (x≤0 or x≥width) within the goal mouth → goalLeft/goalRight;
 * crossing any other boundary → out; otherwise in.
 */
export const classifyCap = (body: Body, pitch: Pitch): CapZone => {
  const { x, y } = body.position;
  if (x <= 0) return inGoalMouth(y, pitch) ? "goalLeft" : "out";
  if (x >= pitch.width) return inGoalMouth(y, pitch) ? "goalRight" : "out";
  if (y <= 0 || y >= pitch.height) return "out";
  return "in";
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/pitch.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/rules/pitch.ts apps/cap-kickers/src/game/rules/pitch.test.ts
git commit -m "feat(cap-kickers): pitch model and cap zone classification

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Triangle setup

**Files:**
- Create: `apps/cap-kickers/src/game/rules/setup.ts`
- Test: `apps/cap-kickers/src/game/rules/setup.test.ts`

**Interfaces:**
- Consumes: `Vec2`, `vec` from `../physics/vec`; `Pitch`, `PlayerSide` from `./pitch`.
- Produces: `makeTriangle(pitch: Pitch, side: PlayerSide, capRadius: number): [Vec2, Vec2, Vec2]` — three positions forming a triangle just in front of `side`'s own goal (base pair near the goal line, apex up-field). Used by orchestration (Plan 3) to place caps at kickoff/turnover.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/rules/setup.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { makeTriangle } from "./setup";
import { type Pitch } from "./pitch";
import { dist } from "../physics/vec";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 };
const R = 12;

describe("makeTriangle", () => {
  it("places three caps strictly inside the pitch", () => {
    for (const side of [0, 1] as const) {
      for (const p of makeTriangle(pitch, side, R)) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(pitch.width);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(pitch.height);
      }
    }
  });

  it("keeps caps non-overlapping (pairwise gap > 2*radius)", () => {
    const caps = makeTriangle(pitch, 0, R);
    for (let i = 0; i < caps.length; i++) {
      for (let j = i + 1; j < caps.length; j++) {
        expect(dist(caps[i], caps[j])).toBeGreaterThan(2 * R);
      }
    }
  });

  it("sets up on the correct side (near own goal, apex up-field)", () => {
    const side0 = makeTriangle(pitch, 0, R); // own goal left -> near left, apex to the right
    expect(side0[0].x).toBeLessThan(pitch.width / 2);
    expect(side0[2].x).toBeGreaterThan(side0[0].x); // apex further up-field (right)

    const side1 = makeTriangle(pitch, 1, R); // own goal right -> near right, apex to the left
    expect(side1[0].x).toBeGreaterThan(pitch.width / 2);
    expect(side1[2].x).toBeLessThan(side1[0].x); // apex further up-field (left)
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/setup.test.ts`
Expected: FAIL — cannot resolve `./setup`.

- [ ] **Step 3: Implement the setup module**

Create `apps/cap-kickers/src/game/rules/setup.ts`:

```ts
import { type Vec2, vec } from "../physics/vec";
import { type Pitch, type PlayerSide } from "./pitch";

/**
 * Three caps in a triangle just in front of `side`'s OWN goal: two base caps
 * near the goal line (spread vertically around the pitch mid-line) and an apex
 * cap up-field (toward the goal this side attacks).
 */
export const makeTriangle = (pitch: Pitch, side: PlayerSide, capRadius: number): [Vec2, Vec2, Vec2] => {
  const margin = capRadius * 4; // base distance from the goal line
  const spread = capRadius * 3; // vertical half-spread of the base pair
  const depth = capRadius * 4; // apex distance up-field from the base
  const mid = pitch.height / 2;

  const baseX = side === 0 ? margin : pitch.width - margin;
  const apexX = side === 0 ? margin + depth : pitch.width - margin - depth;

  return [vec(baseX, mid - spread), vec(baseX, mid + spread), vec(apexX, mid)];
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/setup.test.ts`
Expected: PASS (3 tests). (With R=12: margin=48, spread=36, depth=48, mid=250 → base (48,214)&(48,286), apex (96,250); all inside; base-base gap 72>24, base-apex gap 60>24.)

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/rules/setup.ts apps/cap-kickers/src/game/rules/setup.test.ts
git commit -m "feat(cap-kickers): triangle cap setup in front of own goal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Flick-resolution engine

**Files:**
- Create: `apps/cap-kickers/src/game/rules/flick.ts`
- Test: `apps/cap-kickers/src/game/rules/flick.test.ts`

**Interfaces:**
- Consumes: `Vec2` from `../physics/vec`; `PhysicsWorld` from `../physics/world`; `segmentsIntersect` from `./geometry`; `Pitch`, `classifyCap`, `CapZone` from `./pitch`.
- Produces:
  - `type FlickEnding = "rest" | "out" | "goalLeft" | "goalRight"`
  - `type FlickResult = { crossedGate: boolean; ending: FlickEnding; endingCapId: string | null }`
  - `type ResolveOpts = { dt?: number; maxSteps?: number }`
  - `resolveFlick(world: PhysicsWorld, pitch: Pitch, flickedId: string, otherIds: [string, string], velocity: Vec2, opts?: ResolveOpts): FlickResult` — sets the flicked cap's velocity, captures the gate (segment between the other two caps at flick time), simulates to rest or until a cap leaves the pitch, and reports whether the flicked cap crossed the gate and how the flick ended. `FlickResult` is what Task 5's `applyFlick` consumes.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/rules/flick.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveFlick } from "./flick";
import { PhysicsWorld, type PhysicsConfig, type Body } from "../physics/world";
import { type Pitch } from "./pitch";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 }; // mouth y in [150,350]

// Physics bounds MUCH larger than the pitch so the engine walls never fire and
// never mask a cap leaving the field — the rules layer owns boundary logic.
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

// A world with the flicked cap plus two "gate" caps at the given y positions.
const world = (flickPos: { x: number; y: number }, gateY: [number, number], gateX = 150) => {
  const w = new PhysicsWorld(cfg());
  w.addBody(cap("f", flickPos.x, flickPos.y));
  w.addBody(cap("a", gateX, gateY[0]));
  w.addBody(cap("b", gateX, gateY[1]));
  return w;
};

describe("resolveFlick", () => {
  it("reports crossedGate=true when the cap threads between the other two, ending at rest", () => {
    const w = world({ x: 100, y: 250 }, [210, 290]); // wide gap around y=250 at x=150
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 300, y: 0 });
    expect(r.crossedGate).toBe(true);
    expect(r.ending).toBe("rest");
    expect(r.endingCapId).toBeNull();
  });

  it("reports crossedGate=false when the cap misses the gap", () => {
    // gate entirely above the y=250 path -> the flicked cap passes below it
    const w = world({ x: 100, y: 250 }, [300, 360]);
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 300, y: 0 });
    expect(r.crossedGate).toBe(false);
    expect(r.ending).toBe("rest");
  });

  it("ends 'out' when a cap leaves the pitch over a sideline", () => {
    const w = world({ x: 400, y: 250 }, [210, 290], 200);
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 0, y: -3000 }); // slam toward y=0
    expect(r.ending).toBe("out");
    expect(r.endingCapId).toBe("f");
  });

  it("ends 'goalRight' when the flicked cap enters the right goal mouth", () => {
    const w = world({ x: 700, y: 250 }, [210, 290]);
    const r = resolveFlick(w, pitch, "f", ["a", "b"], { x: 3000, y: 0 }); // into x=800 at y=250
    expect(r.ending).toBe("goalRight");
    expect(r.endingCapId).toBe("f");
  });

  it("is deterministic for identical setups", () => {
    const make = () => resolveFlick(world({ x: 100, y: 250 }, [210, 290]), pitch, "f", ["a", "b"], { x: 300, y: 0 });
    expect(make()).toEqual(make());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/flick.test.ts`
Expected: FAIL — cannot resolve `./flick`.

- [ ] **Step 3: Implement the flick engine**

Create `apps/cap-kickers/src/game/rules/flick.ts`:

```ts
import { type Vec2 } from "../physics/vec";
import { PhysicsWorld } from "../physics/world";
import { segmentsIntersect } from "./geometry";
import { type Pitch, classifyCap } from "./pitch";

export type FlickEnding = "rest" | "out" | "goalLeft" | "goalRight";

export type FlickResult = {
  crossedGate: boolean; // did the flicked cap pass between the other two caps?
  ending: FlickEnding; // how the flick ended
  endingCapId: string | null; // cap that left the pitch / entered a goal (null if "rest")
};

export type ResolveOpts = { dt?: number; maxSteps?: number };

/**
 * Apply `velocity` to the flicked cap, then simulate the world until it comes to
 * rest or a cap leaves the pitch. Reports whether the flicked cap crossed the
 * "gate" (the segment between the other two caps captured at flick time) and how
 * the flick ended. The physics world MUST have bounds far larger than the pitch
 * (see Global Constraints) so its walls never mask a cap leaving the field.
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

  // Gate = segment between the other two caps' centers, captured at flick time.
  const gateA: Vec2 = { x: otherA.position.x, y: otherA.position.y };
  const gateB: Vec2 = { x: otherB.position.x, y: otherB.position.y };

  flicked.velocity = { x: velocity.x, y: velocity.y };

  let crossedGate = false;
  let prev: Vec2 = { x: flicked.position.x, y: flicked.position.y };

  for (let step = 0; step < maxSteps; step++) {
    world.step(dt);

    // Gate crossing: test the flicked cap's most recent travel segment.
    const cur: Vec2 = { x: flicked.position.x, y: flicked.position.y };
    if (!crossedGate && segmentsIntersect(prev, cur, gateA, gateB)) {
      crossedGate = true;
    }
    prev = cur;

    // Boundary / goal: the first cap to leave the pitch ends the flick.
    for (const b of world.bodies) {
      const zone = classifyCap(b, pitch);
      if (zone !== "in") {
        return { crossedGate, ending: zone, endingCapId: b.id };
      }
    }

    if (world.atRest()) break;
  }

  return { crossedGate, ending: "rest", endingCapId: null };
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/flick.test.ts`
Expected: PASS (5 tests). Notes for the implementer if a case is flaky: the gate caps are placed clear of the flicked cap's path (gap ≥ diameter) so they don't collide; the flicked cap's travel distance under `friction: 3` is ≈ `v0/3` (linear damping), so `v0=300` travels ≈100u and rests in-bounds, while `v0≥3000` clears the ~100u to the goal line / sideline before stopping. If you must adjust a constant to make physics behave, keep the asserted `crossedGate`/`ending` semantics identical and note the change in your report.

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/rules/flick.ts apps/cap-kickers/src/game/rules/flick.test.ts
git commit -m "feat(cap-kickers): flick-resolution engine (gate crossing + ending)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Match state machine

**Files:**
- Create: `apps/cap-kickers/src/game/rules/match.ts`
- Test: `apps/cap-kickers/src/game/rules/match.test.ts`

**Interfaces:**
- Consumes: `PlayerSide`, `attackingGoal`, `goalZone` from `./pitch`; `FlickResult` from `./flick`.
- Produces:
  - `type MatchConfig = { goalsToWin: number }`
  - `type MatchPhase = "playing" | "won"`
  - `type MatchState = { scores: [number, number]; attacker: PlayerSide; touch: number; phase: MatchPhase; winner: PlayerSide | null }`
  - `type TurnResult = "advance" | "turnover" | "goal" | "win"`
  - `type ApplyOutcome = { state: MatchState; result: TurnResult }`
  - `initialMatch(firstAttacker?: PlayerSide): MatchState`
  - `applyFlick(state: MatchState, flick: FlickResult, config: MatchConfig): ApplyOutcome` — pure reducer encoding the v1 rules. On `turnover`/`goal` the caller (Plan 3 orchestration) is responsible for repositioning caps via `makeTriangle` for the new attacker.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/rules/match.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { initialMatch, applyFlick, type MatchConfig } from "./match";
import { type FlickResult } from "./flick";

const config: MatchConfig = { goalsToWin: 3 };
const legalBuildup: FlickResult = { crossedGate: true, ending: "rest", endingCapId: null };

describe("applyFlick — build-up (touches 1-3)", () => {
  it("advances the touch on a legal build-up flick, same attacker", () => {
    const s = initialMatch(0); // attacker 0, touch 1
    const { state, result } = applyFlick(s, legalBuildup, config);
    expect(result).toBe("advance");
    expect(state.touch).toBe(2);
    expect(state.attacker).toBe(0);
  });

  it("turns over when the flick misses the gate", () => {
    const s = initialMatch(0);
    const miss: FlickResult = { crossedGate: false, ending: "rest", endingCapId: null };
    const { state, result } = applyFlick(s, miss, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
    expect(state.touch).toBe(1);
  });

  it("turns over when a cap leaves the pitch during build-up, even if the gate was crossed", () => {
    const s = initialMatch(0);
    const out: FlickResult = { crossedGate: true, ending: "out", endingCapId: "f" };
    const { state, result } = applyFlick(s, out, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
  });
});

describe("applyFlick — the shot (touch 4)", () => {
  const atShot = (attacker: 0 | 1) => ({ ...initialMatch(attacker), touch: 4 });

  it("scores when attacker 0 puts the cap in the right goal, then kicks off to side 1", () => {
    const shot: FlickResult = { crossedGate: false, ending: "goalRight", endingCapId: "f" };
    const { state, result } = applyFlick(atShot(0), shot, config);
    expect(result).toBe("goal");
    expect(state.scores).toEqual([1, 0]);
    expect(state.attacker).toBe(1);
    expect(state.touch).toBe(1);
  });

  it("does NOT require the gate on the shot (goal counts even with crossedGate=false)", () => {
    const shot: FlickResult = { crossedGate: false, ending: "goalRight", endingCapId: "f" };
    expect(applyFlick(atShot(0), shot, config).result).toBe("goal");
  });

  it("turns over on a missed shot (rest in-bounds)", () => {
    const miss: FlickResult = { crossedGate: false, ending: "rest", endingCapId: null };
    const { result, state } = applyFlick(atShot(0), miss, config);
    expect(result).toBe("turnover");
    expect(state.attacker).toBe(1);
  });

  it("treats scoring in the wrong (own) goal as a turnover, not a score", () => {
    const ownGoal: FlickResult = { crossedGate: false, ending: "goalLeft", endingCapId: "f" };
    const { result, state } = applyFlick(atShot(0), ownGoal, config);
    expect(result).toBe("turnover");
    expect(state.scores).toEqual([0, 0]);
  });

  it("declares a win when the scoring goal reaches goalsToWin", () => {
    const s = { ...initialMatch(1), touch: 4, scores: [0, 2] as [number, number] };
    const shot: FlickResult = { crossedGate: false, ending: "goalLeft", endingCapId: "f" }; // side 1 attacks left
    const { state, result } = applyFlick(s, shot, config);
    expect(result).toBe("win");
    expect(state.phase).toBe("won");
    expect(state.winner).toBe(1);
    expect(state.scores).toEqual([0, 3]);
  });

  it("is a no-op once the match is won", () => {
    const won = { ...initialMatch(0), phase: "won" as const, winner: 0 as const, scores: [3, 0] as [number, number] };
    const { state, result } = applyFlick(won, legalBuildup, config);
    expect(result).toBe("win");
    expect(state).toEqual(won);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/match.test.ts`
Expected: FAIL — cannot resolve `./match`.

- [ ] **Step 3: Implement the match state machine**

Create `apps/cap-kickers/src/game/rules/match.ts`:

```ts
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
 * stayed in the pitch (ending === "rest"). Legal → advance (touch+1, same
 * attacker); illegal → turnover.
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
    const legal = flick.crossedGate && flick.ending === "rest";
    if (legal) {
      return { state: { ...state, touch: state.touch + 1 }, result: "advance" };
    }
    return turnover();
  }

  // touch === 4: the shot.
  const scored = flick.ending === goalZone(attackingGoal(state.attacker));
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/match.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Run the full suite**

Run: `cd apps/cap-kickers && bunx vitest run`
Expected: PASS — all Plan 1 physics tests (14) plus the new rules tests (geometry 6 + pitch 6 + setup 3 + flick 5 + match 10 = 30) → 44 total.

- [ ] **Step 6: Commit**

```bash
git add apps/cap-kickers/src/game/rules/match.ts apps/cap-kickers/src/game/rules/match.test.ts
git commit -m "feat(cap-kickers): match state machine (4-touch turns, scoring, win)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (this plan's slice — design spec section 3 "Rules & match model" + build-order step 2):**
- 3-cap triangle setup in front of own goal → Task 3 (`makeTriangle`). ✅
- "Flick must pass between the other two caps" gate rule → Task 1 (`segmentsIntersect`) + Task 4 (gate captured at flick time, path sampled). ✅
- 4-touch turn machine; shoot on the 4th → Task 5 (`applyFlick`, touch 1..4, shot branch). ✅
- Turn loss on failed gate or out-of-bounds → Task 5 (build-up legality) + Task 2/4 (`classifyCap`/ending). ✅
- Goal detection + scoring; first-to-N; kickoff/turnover attacker switch → Task 5. ✅
- Confirmed rules refinements (gate only on 1-3; only the 4th scores; boundary incl. goal lines during build-up is out) → encoded in Task 5 and Global Constraints. ✅
- Keeper is Plan 5; cap repositioning/rendering/input is Plan 3 — correctly out of scope. The match reducer is pure and leaves world mutation to the caller.

**Placeholder scan:** No "TBD"/"add validation"/"write tests for the above". Every step carries concrete code and exact commands. The Task 4 note about tuning physics constants is guidance, not a placeholder — the code and asserts are complete.

**Type consistency:** `PlayerSide`/`GoalSide`/`CapZone`/`Pitch` defined once in Task 2 and reused in Tasks 3/4/5. `FlickResult`/`FlickEnding` defined in Task 4 and consumed by Task 5. `classifyCap` returns `CapZone`; `resolveFlick`'s `ending` is `FlickEnding` (the non-"in" subset) — `classifyCap`'s non-"in" results (`out`/`goalLeft`/`goalRight`) are exactly `FlickEnding` minus `rest`, and the loop only assigns `zone` when `zone !== "in"`, so the assignment is sound. `goalZone(attackingGoal(side))` yields `goalLeft`/`goalRight`, matching `FlickResult.ending` values compared in Task 5. `makeTriangle` returns `[Vec2,Vec2,Vec2]` consuming `Pitch`/`PlayerSide`.

---

## Next plan

Plan 3 (App shell + input + canvas render) wires these pure units into a playable turn: it scaffolds the TanStack/Capacitor app (from the PopZen template), renders the pitch + caps + gate hint on a `<canvas>`, captures swipe → flick velocity, and runs the loop — `resolveFlick` → `applyFlick` → on turnover/goal reposition caps via `makeTriangle`. That is where the first human-playable single-device match appears.
