# Cap Kickers — Plan 5b: Goalkeeper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a moving goalkeeper that defends the goal on every shot (touch 4) in every mode — a heavy circular body that slides along the defended goal line to block/deflect the shot, with reaction speed scaling by difficulty — integrated so it participates in physics collisions but is never mistaken for a cap by the rules layer.

**Architecture:** The keeper is a 4th `PhysicsWorld` body that exists only during a shot. The critical correctness change: `FlickTracker` must classify boundary/goal **and** detect rest over **only the three cap ids**, so the keeper (which sits on the goal line and moves constantly) neither falsely trips `anyCapLeftPitch`/goal detection nor blocks `atRest()`. This is behavior-preserving today (the world holds exactly 3 caps). The keeper's per-frame tracking is a pure function; its lifecycle (spawn at shot, move each tick with a reaction delay + capped speed, despawn on resolve) lives in `GameSession`. Difficulty sets the keeper's max speed + reaction delay. The AI's shot *simulation* stays keeper-free (an open-goal aim) — the keeper is a live obstacle both the human and the AI must beat, not something the AI models.

**Tech Stack:** TypeScript (strict); Vitest (node) for the core + keeper; React + canvas for rendering; bun.

## Global Constraints

- **Package manager:** bun. Core tests `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`; types `bunx tsc --noEmit`. Dev: `bun run dev`.
- **Determinism (hard requirement):** no `Math.random()`/`Date.now()`/`new Date()` in `src/game/`, keeper included. The keeper's movement is a pure function of (positions, difficulty, dt).
- **Do not regress:** the 78 existing tests stay green. All keeper-enabling core changes (`FlickTracker` cap-id filtering, `removeBody`) MUST be behavior-preserving when no keeper is present.
- **Keeper is universal:** it defends on every shot in **all** modes (2p, practice, ai) — the design's "AI moving keeper, always." Keeper difficulty = the selected difficulty in `ai` mode, else `"normal"`.
- **The 3-cap contract:** the flick outcome (gate/boundary/rest) is defined over exactly the three attacker caps `c0,c1,c2`. The keeper never participates in gate/boundary/rest logic — only in physics collisions.
- **TypeScript:** `strict: true`. **Core:** `apps/cap-kickers/src/game/`. **UI:** `apps/cap-kickers/src/routes/`.
- **Commits:** conventional-commit; body ends `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit per verified deliverable. Stay on `cap-kickers`.

## Product decisions (this plan)
- Keeper is a single circular body (radius ≈ 1.4× cap, heavy mass so the cap deflects), constrained to the defended goal line and to the goal mouth in y.
- It reacts with a delay then tracks the shot cap's y at a capped speed; **Easy** = slow + laggy, **Hard** = fast + near-instant.
- Keeper feel (speeds/delays) is tunable later — the user will assess on mobile.
- The keeper is drawn as a distinct rounded bar/circle in the goal mouth.

---

## File Structure

- `src/game/physics/world.ts` (modified, +test) — add `removeBody(id)`.
- `src/game/rules/flick-tracker.ts` (modified) — optional `capIds` to classify + rest-check over only those bodies. `flick-tracker.test.ts` (+ a keeper-exclusion test). `session.ts` passes `CAP_IDS`.
- `src/game/ai/keeper.ts` (+test) — `KeeperDifficulty`, `KEEPER_DIFFS`, `keeperTrackVelocityY`.
- `src/game/constants.ts` (modified) — `KEEPER` (radius/mass/inset).
- `src/game/session.ts` (modified, +integration test) — spawn/move/despawn the keeper on shots; `keeperDifficulty` config.
- `src/routes/play.tsx` (modified) — pass keeper difficulty; render the keeper. Run-verified.

Task order: removeBody → tracker cap-ids → keeper policy → session integration → route/render.

---

### Task 1: `PhysicsWorld.removeBody`

**Files:**
- Modify: `apps/cap-kickers/src/game/physics/world.ts`
- Test: `apps/cap-kickers/src/game/physics/world.test.ts` (append)

**Interfaces:**
- Produces: `removeBody(id: string): void` on `PhysicsWorld` — removes the body with that id from `bodies` (no-op if absent). Used to despawn the keeper after a shot resolves.

- [ ] **Step 1: Write the failing test** — append to `apps/cap-kickers/src/game/physics/world.test.ts`:

```ts
describe("PhysicsWorld.removeBody", () => {
  it("removes a body by id and is a no-op for an unknown id", () => {
    const w = new PhysicsWorld(cfg());
    w.addBody(body({ id: "a" }));
    w.addBody(body({ id: "b" }));
    w.removeBody("a");
    expect(w.getBody("a")).toBeUndefined();
    expect(w.getBody("b")?.id).toBe("b");
    expect(w.bodies.length).toBe(1);
    w.removeBody("missing"); // no throw
    expect(w.bodies.length).toBe(1);
  });
});
```

(Reuse the `cfg`/`body` helpers already at the top of `world.test.ts`; if `body` has no `id` override path, pass `{ id: "a" }` as its override — the helper spreads overrides.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/world.test.ts`
Expected: FAIL — `removeBody` is not a function.

- [ ] **Step 3: Implement** — in `apps/cap-kickers/src/game/physics/world.ts`, add after `addBody`:

```ts
  removeBody(id: string): void {
    const i = this.bodies.findIndex((b) => b.id === id);
    if (i !== -1) this.bodies.splice(i, 1);
  }
```

Note: `bodies` is declared `readonly bodies: Body[] = []` — `readonly` forbids reassigning the array, not mutating it, so `splice` is allowed.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/physics/world.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 78 + 1 = 79).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/physics/world.ts apps/cap-kickers/src/game/physics/world.test.ts
git commit -m "feat(cap-kickers): PhysicsWorld.removeBody

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: FlickTracker classifies only the caps (keeper exclusion)

**Files:**
- Modify: `apps/cap-kickers/src/game/rules/flick-tracker.ts`
- Modify: `apps/cap-kickers/src/game/session.ts` (pass `CAP_IDS` to the tracker)
- Test: `apps/cap-kickers/src/game/rules/flick-tracker.test.ts` (add a keeper-exclusion test)

**Interfaces:**
- `FlickTracker` constructor gains a trailing optional param `capIds?: string[]`. When provided, `observe()` classifies boundary/goal over **only** bodies whose id ∈ `capIds`, sets `anyCapLeftPitch` from only those, and treats the flick as "at rest" when **only those** bodies have zero velocity (instead of `world.atRest()`). When omitted, behavior is exactly as today (all bodies + `world.atRest()`) — so `resolveFlick` and existing tests are unchanged.
- `session.beginFlick` constructs the tracker with `CAP_IDS` as `capIds`, so the keeper (added in Task 4) is always excluded.

- [ ] **Step 1: Write the failing test** — add to `apps/cap-kickers/src/game/rules/flick-tracker.test.ts` a test that a non-cap body is excluded. It builds a world with the flicked cap + 2 gate caps + a "keeper" body parked ON the goal line (which would classify as a goal/out) and kept moving, then steps to rest and asserts the tracker (constructed with only the 3 cap ids) reports `flickedEnding: "rest"`, `anyCapLeftPitch: false` — i.e. the keeper neither ended the flick as a goal nor blocked rest:

```ts
import { describe, it, expect } from "vitest";
import { FlickTracker } from "./flick-tracker";
import { PhysicsWorld, type PhysicsConfig, type Body } from "../physics/world";
import { type Pitch } from "./pitch";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 };
const cfg = (): PhysicsConfig => ({
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
});
const cap = (id: string, x: number, y: number, vx = 0, vy = 0): Body => ({
  id,
  position: { x, y },
  velocity: { x: vx, y: vy },
  radius: 8,
  mass: 1,
});

describe("FlickTracker cap-id filtering (keeper exclusion)", () => {
  it("ignores a non-cap body on the goal line for classification and rest", () => {
    const w = new PhysicsWorld(cfg());
    // flicked cap threads a wide gate and comes to rest in-bounds
    w.addBody(cap("f", 100, 250));
    w.addBody(cap("a", 150, 200));
    w.addBody(cap("b", 150, 300));
    // a "keeper" ON the right goal line (would classify as goalRight) that keeps moving
    const keeper = cap("keeper", 800, 250, 0, 400);
    keeper.mass = 40;
    w.addBody(keeper);

    const tracker = new FlickTracker(
      w,
      pitch,
      "f",
      { x: 150, y: 200 },
      { x: 150, y: 300 },
      ["f", "a", "b"], // only the caps
    );
    w.getBody("f")!.velocity = { x: 300, y: 0 };

    let result = null;
    for (let i = 0; i < 1000 && !result; i++) {
      // keep the keeper drifting so world.atRest() would never fire if it counted
      w.getBody("keeper")!.velocity = { x: 0, y: 400 };
      w.step(1 / 60);
      result = tracker.observe();
    }
    expect(result).not.toBeNull();
    expect(result!.flickedEnding).toBe("rest"); // keeper's goal-line position ignored
    expect(result!.anyCapLeftPitch).toBe(false); // keeper leaving the mouth doesn't count
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/flick-tracker.test.ts`
Expected: FAIL — the constructor doesn't accept a 6th arg / the keeper still trips classification or blocks rest.

- [ ] **Step 3: Implement** — in `apps/cap-kickers/src/game/rules/flick-tracker.ts`:

Add the optional constructor param and use it in `observe()`. Replace the class internals as follows (keep the doc comment):

```ts
  constructor(
    private readonly world: PhysicsWorld,
    private readonly pitch: Pitch,
    private readonly flickedId: string,
    private readonly gateA: Vec2,
    private readonly gateB: Vec2,
    private readonly capIds?: string[],
  ) {
    const f = world.getBody(flickedId);
    if (!f) throw new Error("FlickTracker: unknown flicked cap id");
    this.prev = { x: f.position.x, y: f.position.y };
  }

  private classifiedBodies() {
    if (!this.capIds) return this.world.bodies;
    return this.world.bodies.filter((b) => this.capIds!.includes(b.id));
  }

  observe(): FlickResult | null {
    const flicked = this.world.getBody(this.flickedId)!;
    const cur: Vec2 = { x: flicked.position.x, y: flicked.position.y };
    if (!this.crossedGate && segmentsIntersect(this.prev, cur, this.gateA, this.gateB)) {
      this.crossedGate = true;
    }
    this.prev = cur;

    const caps = this.classifiedBodies();
    let flickedEnding: FlickEnding | null = null;
    for (const b of caps) {
      const zone = classifyCap(b, this.pitch);
      if (zone !== "in") {
        this.anyCapLeftPitch = true;
        if (b.id === this.flickedId) flickedEnding = zone;
      }
    }

    if (flickedEnding) {
      return { crossedGate: this.crossedGate, flickedEnding, anyCapLeftPitch: this.anyCapLeftPitch };
    }
    // "At rest" = the CAPS have stopped (ignore a still-moving keeper).
    const capsAtRest = caps.every((b) => b.velocity.x === 0 && b.velocity.y === 0);
    if (capsAtRest) {
      return { crossedGate: this.crossedGate, flickedEnding: "rest", anyCapLeftPitch: this.anyCapLeftPitch };
    }
    return null;
  }
```

(Note: when `capIds` is omitted, `classifiedBodies()` returns all bodies and `capsAtRest` equals `world.atRest()`'s condition — identical to the current behavior, so `resolveFlick` and existing tests are unaffected.)

Then in `apps/cap-kickers/src/game/session.ts`, update the `beginFlick` tracker construction to pass the cap ids (add `[...CAP_IDS]` as the 6th arg):

```ts
    this.tracker = new FlickTracker(
      this.world,
      this.cfg.pitch,
      capId,
      { x: a.position.x, y: a.position.y },
      { x: b.position.x, y: b.position.y },
      [...CAP_IDS],
    );
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/rules/flick-tracker.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 79 + 1 = 80). **All prior tests must stay green** — this is the behavior-preserving check.

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/rules/flick-tracker.ts apps/cap-kickers/src/game/session.ts apps/cap-kickers/src/game/rules/flick-tracker.test.ts
git commit -m "feat(cap-kickers): FlickTracker classifies only the caps (keeper exclusion)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Keeper tracking policy

**Files:**
- Create: `apps/cap-kickers/src/game/ai/keeper.ts`
- Test: `apps/cap-kickers/src/game/ai/keeper.test.ts`
- Modify: `apps/cap-kickers/src/game/constants.ts` (add `KEEPER`)

**Interfaces:**
- Consumes: `Difficulty` from `./policy`.
- Produces:
  - `type KeeperParams = { maxSpeed: number; reactionDelay: number }`
  - `KEEPER_DIFFS: Record<Difficulty, KeeperParams>`
  - `keeperTrackVelocityY(fromY: number, toY: number, maxSpeed: number): number` — proportional tracking velocity toward `toY`, clamped to `±maxSpeed`; `0` when aligned.
- `constants.ts` gains `export const KEEPER = { radius: CAP_RADIUS * 1.4, mass: 40, inset: 6 }` (inset = how far inside the goal line the keeper sits).

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/ai/keeper.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { keeperTrackVelocityY, KEEPER_DIFFS } from "./keeper";

describe("keeperTrackVelocityY", () => {
  it("moves toward the target and is zero when aligned", () => {
    expect(keeperTrackVelocityY(100, 200, 1000)).toBeGreaterThan(0); // target below -> +y
    expect(keeperTrackVelocityY(200, 100, 1000)).toBeLessThan(0); // target above -> -y
    expect(keeperTrackVelocityY(150, 150, 1000)).toBe(0);
  });

  it("clamps to ±maxSpeed", () => {
    expect(keeperTrackVelocityY(0, 100000, 500)).toBe(500);
    expect(keeperTrackVelocityY(0, -100000, 500)).toBe(-500);
  });

  it("has harder difficulties faster and less laggy than easier ones", () => {
    expect(KEEPER_DIFFS.hard.maxSpeed).toBeGreaterThan(KEEPER_DIFFS.normal.maxSpeed);
    expect(KEEPER_DIFFS.normal.maxSpeed).toBeGreaterThan(KEEPER_DIFFS.easy.maxSpeed);
    expect(KEEPER_DIFFS.hard.reactionDelay).toBeLessThan(KEEPER_DIFFS.easy.reactionDelay);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/ai/keeper.test.ts`
Expected: FAIL — cannot resolve `./keeper`.

- [ ] **Step 3: Implement**

Add to `apps/cap-kickers/src/game/constants.ts` (after `CAP_RADIUS`):

```ts
export const KEEPER = { radius: CAP_RADIUS * 1.4, mass: 40, inset: 6 };
```

Create `apps/cap-kickers/src/game/ai/keeper.ts`:

```ts
import { type Difficulty } from "./policy";

export type KeeperParams = { maxSpeed: number; reactionDelay: number };

// Feel-tunable. Hard = fast + near-instant; Easy = slow + laggy.
export const KEEPER_DIFFS: Record<Difficulty, KeeperParams> = {
  easy: { maxSpeed: 320, reactionDelay: 0.32 },
  normal: { maxSpeed: 560, reactionDelay: 0.18 },
  hard: { maxSpeed: 920, reactionDelay: 0.06 },
};

const TRACK_GAIN = 9; // proportional gain (1/s); high enough to reach maxSpeed quickly

/** Velocity in y toward `toY`, clamped to ±maxSpeed; 0 when aligned. Pure. */
export const keeperTrackVelocityY = (fromY: number, toY: number, maxSpeed: number): number => {
  const v = (toY - fromY) * TRACK_GAIN;
  if (v > maxSpeed) return maxSpeed;
  if (v < -maxSpeed) return -maxSpeed;
  return v;
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/ai/keeper.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 80 + 3 = 83).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/ai/keeper.ts apps/cap-kickers/src/game/ai/keeper.test.ts apps/cap-kickers/src/game/constants.ts
git commit -m "feat(cap-kickers): goalkeeper tracking policy + difficulty params

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Session keeper integration

**Files:**
- Modify: `apps/cap-kickers/src/game/session.ts`
- Test: `apps/cap-kickers/src/game/session-keeper.test.ts` (new integration test)

**Interfaces:**
- `SessionConfig` gains `keeperDifficulty: Difficulty` (default `"normal"`).
- On `beginFlick`, when `this.match.touch === 4` (the shot), the session spawns a keeper body at the **defended** goal (`attackingGoal(attacker)` is the goal being shot at) and initializes a reaction timer. The tracker is already built with `CAP_IDS` (Task 2), so the keeper is excluded from the flick outcome.
- `tick` moves the keeper each step (after the reaction delay: track the shot cap's y at `KEEPER_DIFFS[keeperDifficulty].maxSpeed`, clamp x to the goal line and y to the mouth) and despawns it (`removeBody("keeper")`) when the flick resolves.
- A method `keeper(): { position: Vec2; radius: number } | null` exposes the keeper for rendering (null when none).

**Design (concrete):**
- Add fields: `private keeperState: { defended: GoalSide; goalLineX: number; mouthMin: number; mouthMax: number; reactionElapsed: number } | null = null;` and import `KEEPER` (constants), `KEEPER_DIFFS`, `keeperTrackVelocityY` (ai/keeper), `attackingGoal` (rules/pitch), `Difficulty` (ai/policy).
- `defaults()` adds `keeperDifficulty: "normal"`.
- In `beginFlick`, after building the tracker and setting the flicked cap velocity, if `this.match.touch === 4`, call `this.spawnKeeper()`.
- `spawnKeeper()`:
  ```ts
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
  this.world.addBody({ id: "keeper", position: { x, y: midY }, velocity: { x: 0, y: 0 }, radius: KEEPER.radius, mass: KEEPER.mass });
  ```
- In `tick`, if `this.keeperState`, BEFORE `this.world.step(dt)` update the keeper:
  ```ts
  const ks = this.keeperState;
  const keeper = this.world.getBody("keeper");
  if (keeper) {
    ks.reactionElapsed += dt;
    const params = KEEPER_DIFFS[this.cfg.keeperDifficulty];
    if (ks.reactionElapsed >= params.reactionDelay) {
      // track the flicked (shot) cap's y — the shot cap is the selected/flicked one
      const shot = this.world.getBody(this.shotCapId!); // capture flickedId in beginFlick
      const targetY = shot ? Math.max(ks.mouthMin, Math.min(ks.mouthMax, shot.position.y)) : keeper.position.y;
      keeper.velocity = { x: 0, y: keeperTrackVelocityY(keeper.position.y, targetY, params.maxSpeed) };
    } else {
      keeper.velocity = { x: 0, y: 0 };
    }
  }
  ```
  Then AFTER `this.world.step(dt)` and BEFORE `this.tracker.observe()`, clamp the keeper back onto its line/mouth (a collision may have nudged it):
  ```ts
  if (keeper) {
    keeper.position.x = this.keeperState!.goalLineX + (this.keeperState!.defended === "left" ? KEEPER.inset + KEEPER.radius : -(KEEPER.inset + KEEPER.radius));
    keeper.position.y = Math.max(this.keeperState!.mouthMin, Math.min(this.keeperState!.mouthMax, keeper.position.y));
    keeper.velocity.x = 0;
  }
  ```
  Store `this.shotCapId = capId` in `beginFlick` (add a `private shotCapId: string | null`), and clear it + `this.keeperState = null` + `this.world.removeBody("keeper")` in the resolve branch of `tick` (where it currently sets `this.tracker = null; this.phase = "aiming"`).
- `keeper()` getter returns `this.keeperState ? { position: {...body.position}, radius: KEEPER.radius } : null` (reading the live body if present).

**Steps:**
- [ ] **Step 1: Write the failing integration test**

Create `apps/cap-kickers/src/game/session-keeper.test.ts`. It sets up a shot scenario (touch 4) and drives the session, asserting: (a) a Hard keeper **saves** a shot aimed straight at the goal center (no goal → turnover); (b) an Easy keeper is beaten by a shot to a corner of the mouth (goal). Use `GameSession` with a controlled setup. Because reaching exactly touch 4 through legal play is fiddly, drive the session's public surface by constructing it and using a small helper that positions a cap for a shot; if the session exposes no cap-positioning hook, test via the world directly is NOT allowed (keep it black-box) — instead advance a real session with the AI or scripted flicks to touch 4, OR add a **test-only** documented note. Concretely, use this approach: start a fresh `GameSession({ firstAttacker: 0, keeperDifficulty: "hard" })`, then play three legal build-up flicks to reach touch 4 near the goal using the AI helper (`chooseAiFlick`) to guarantee legality, then take a central shot and assert no goal; repeat with `keeperDifficulty: "easy"` and a cornerward shot and assert a goal.

```ts
import { describe, it, expect } from "vitest";
import { GameSession } from "./session";
import { chooseAiFlick } from "./ai/policy";
import { PITCH, PHYSICS, SWIPE } from "./constants";

// Play one flick to completion; returns the FlickReport (or null).
function flickToEnd(s: GameSession, capId: string, velocity: { x: number; y: number }) {
  s.beginFlick(capId, velocity);
  let r = null;
  for (let i = 0; i < 6000 && !r; i++) r = s.tick(1 / 60);
  return r;
}

// Advance an AI-controlled attacker to the 4th touch (legal build-up), returning
// the session paused at touch 4 (attacker unchanged) or null if it lost the turn.
function toShot(s: GameSession): boolean {
  for (let guard = 0; guard < 20 && s.match.touch < 4 && s.match.phase !== "won"; guard++) {
    const move = chooseAiFlick(s.caps(), {
      pitch: PITCH, physics: PHYSICS,
      attacker: s.match.attacker, touch: s.match.touch,
      difficulty: "hard", maxSpeed: SWIPE.maxSpeed,
    });
    if (!move) return false;
    const r = flickToEnd(s, move.capId, move.velocity);
    if (!r || r.result !== "advance") return false;
  }
  return s.match.touch === 4;
}

describe("goalkeeper", () => {
  it("a Hard keeper saves a shot aimed at the goal center", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "hard" });
    expect(toShot(s)).toBe(true);
    // aim the nearest cap straight at the right-goal center
    const shooter = s.caps().reduce((a, b) => (b.position.x > a.position.x ? b : a));
    const target = { x: PITCH.width, y: PITCH.height / 2 };
    const dx = target.x - shooter.position.x, dy = target.y - shooter.position.y;
    const len = Math.hypot(dx, dy);
    const v = { x: (dx / len) * SWIPE.maxSpeed, y: (dy / len) * SWIPE.maxSpeed };
    const r = flickToEnd(s, shooter.id, v);
    expect(r).not.toBeNull();
    expect(r!.result).not.toBe("goal"); // saved -> turnover
  });

  it("an Easy keeper is beaten by a shot to the top corner of the mouth", () => {
    const s = new GameSession({ firstAttacker: 0, keeperDifficulty: "easy" });
    expect(toShot(s)).toBe(true);
    const shooter = s.caps().reduce((a, b) => (b.position.x > a.position.x ? b : a));
    const half = PITCH.goalWidth / 2;
    const target = { x: PITCH.width, y: PITCH.height / 2 - half + 8 }; // top corner
    const dx = target.x - shooter.position.x, dy = target.y - shooter.position.y;
    const len = Math.hypot(dx, dy);
    const v = { x: (dx / len) * SWIPE.maxSpeed, y: (dy / len) * SWIPE.maxSpeed };
    const r = flickToEnd(s, shooter.id, v);
    expect(r).not.toBeNull();
    expect(r!.result).toBe("goal");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/session-keeper.test.ts`
Expected: FAIL — `keeperDifficulty` config unknown / no keeper spawned (both shots score, or a type error).

- [ ] **Step 3: Implement** the keeper lifecycle in `apps/cap-kickers/src/game/session.ts` per the Design above (config field + `spawnKeeper` + tick move/clamp/despawn + `shotCapId` + `keeper()` getter). Keep all existing behavior for non-shot flicks (no keeper) identical.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/session-keeper.test.ts` (both pass), then `cd apps/cap-kickers && bunx vitest run` (full suite green — 83 + 2 = 85). If the save/beat thresholds are borderline for the chosen keeper constants, you MAY tune `KEEPER_DIFFS` or `KEEPER.radius` (feel constants) so a central shot is saved on Hard and a corner shot scores on Easy — keep the assertions intact and document any tuning. Do NOT change the tracker/classification logic to pass.

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/session.ts apps/cap-kickers/src/game/session-keeper.test.ts
git commit -m "feat(cap-kickers): goalkeeper spawns on shots and blocks/deflects

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Render the keeper + pass difficulty

**Goal:** The keeper is drawn on the canvas during shots; the route passes the selected difficulty as the keeper difficulty. Run-verified.

**Files:** Modify `apps/cap-kickers/src/routes/play.tsx`.

**Steps:**
- [ ] **Step 1:** Pass keeper difficulty into the session. Where the route creates `new GameSession(...)` (initial ref + `handleNewMatch`), pass `{ keeperDifficulty: mode === "ai" ? difficulty : "normal" }`. (In 2p/practice the difficulty param defaults to "normal" via the schema, so `mode === "ai" ? difficulty : "normal"` gives a Normal keeper there.) Note: the session is created in a ref initializer and in `handleNewMatch`; thread `difficulty`/`mode` in (they're in scope in the component; `handleNewMatch` is a `useCallback` — add them to its deps).
- [ ] **Step 2:** In the render function, after drawing the caps, draw the keeper if `session.keeper()` returns non-null: a filled rounded rectangle or circle at `pitchToScreen(keeper.position)` with radius `keeper.radius * pres.viewport.scale`, in a distinct color (e.g. amber `#f4c542` with a dark outline) so it reads as the keeper, not a cap.
- [ ] **Step 3:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `cd apps/cap-kickers && bunx vitest run` (85 core tests green).
- [ ] **Step 4 (controller live-verify):** open `/play?mode=ai&difficulty=hard`, reach a shot (or use the AI's shot), and confirm the keeper appears in the defended goal during the shot and disappears after; a central shot is saved. Screenshot for the report. (Note the hidden-tab rAF limitation — a headless integration proof already exists from Task 4; the visual check confirms the keeper renders.)
- [ ] **Step 5:** Commit:

```bash
git add apps/cap-kickers/src/routes/play.tsx
git commit -m "feat(cap-kickers): render the goalkeeper and pass keeper difficulty

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (design spec section 3 keeper + section 7 keeper AI; build-order step 5 keeper half):**
- AI moving keeper defending every shot, all modes → Task 4 (universal spawn on touch 4) + Task 5 (difficulty threading). ✅
- Keeper excluded from cap gate/boundary/rest logic (the delicate correctness point) → Task 2. ✅
- Reaction + capped speed by difficulty (Easy/Normal/Hard) → Task 3 (`KEEPER_DIFFS`) + Task 4 (reaction timer). ✅
- Physics block/deflect via a heavy body + despawn → Tasks 1 (`removeBody`) + 4. ✅
- Rendered distinctly → Task 5. ✅
- Determinism preserved (keeper movement pure) → Tasks 3–4.
- The AI shot sim stays keeper-free (open-goal aim) — intentional; the keeper is a live obstacle both sides face.

**Placeholder scan:** Tasks 1–4 carry full code/tests + commands; Task 5 is run-verified UI with concrete render + threading specs. The Task 4 integration test drives the real session black-box (via the AI to reach touch 4) — not a mock.

**Type consistency:** `removeBody` (Task 1) used by Task 4. `FlickTracker`'s new `capIds?` (Task 2) is passed `[...CAP_IDS]` by the session; `resolveFlick` and existing tests omit it (unchanged). `Difficulty` (from `ai/policy`) reused by `KEEPER_DIFFS` (Task 3) and `SessionConfig.keeperDifficulty` (Task 4) and the route (Task 5). `KEEPER` constants (Task 3) used by Task 4/5. `keeper()` getter (Task 4) consumed by the render (Task 5). `attackingGoal` gives the defended goal for the attacker.

---

## Next plan

Plan 6 (Campaign): an unlockable ladder of AI opponents (rising difficulty), progress persisted in localStorage — reusing `mode="ai"` + the keeper. Then Plan 7 (tutorial), Plan 8 (shared packages + monetization + iOS + store), and a dedicated visual/layout polish pass (deferred per user feedback).
