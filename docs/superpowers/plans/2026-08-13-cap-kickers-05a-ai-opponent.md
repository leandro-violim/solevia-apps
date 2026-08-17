# Cap Kickers — Plan 5a: Solo vs AI (Attacker AI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-player "Solo vs AI" mode: a deterministic, simulation-based AI opponent that plays its own attacking turns (choosing which cap to flick and with what velocity), with Easy/Normal/Hard difficulty — enabling the menu item Plan 4 left disabled. Open goal (the goalkeeper is Plan 5b).

**Architecture:** Two **testable** pure modules under `src/game/ai/`: (1) `simulate.ts` runs a candidate flick on a throwaway `PhysicsWorld` built from the current caps, reusing the exported batch `resolveFlick` — because the engine is deterministic, the simulation is an *exact* prediction of the real outcome; (2) `policy.ts` (`chooseAiFlick`) generates a deterministic spread of candidate flicks (cap × direction × power, breadth scaled by difficulty), simulates and scores each, and returns the best. Then **run-verified** wiring: the `/play` rAF loop, in `mode="ai"`, detects the AI's turn and (after a short think delay) calls `chooseAiFlick` → `session.beginFlick`, gating human input during the AI's turn; and the menu gains Solo-vs-AI difficulty entries. Human is Player 1 (side 0), AI is Player 2 (side 1); the board never flips in solo (human always watches from their own orientation).

**Tech Stack:** TypeScript (strict); Vitest (node) for the AI core; React 19 + canvas for the wiring; bun.

## Global Constraints

- **Package manager:** bun. Core tests `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`; types `bunx tsc --noEmit`. Dev: `bun run dev`.
- **Determinism (hard requirement):** no `Math.random()`/`Date.now()`/`new Date()` in `src/game/` — including the AI. The AI must be a pure function of (caps, context): same inputs → same chosen flick. (`Math.cos`/`atan2`/`hypot` are fine.)
- **Do not regress:** the existing 69 tests stay green. The AI reuses the *exported* batch `resolveFlick(world, pitch, flickedId, otherIds, velocity, opts?)` (signature confirmed in `src/game/rules/flick.ts`) — it does not modify the rules/physics layers.
- **Reuse live config:** the AI simulates with the same `PHYSICS`/`PITCH` the game uses, so predictions match reality exactly.
- **Sides:** human = Player 1 = side 0 (attacks right); AI = Player 2 = side 1 (attacks left). No board flip in `ai` mode.
- **TypeScript:** `strict: true`. **Core:** `apps/cap-kickers/src/game/ai/`. **UI:** `apps/cap-kickers/src/routes/`.
- **Commits:** conventional-commit; body ends `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit per verified deliverable. Stay on `cap-kickers`.

## Product decisions (this plan)
- Difficulty affects **search breadth** (Easy 4 / Normal 8 / Hard 16 aim samples) — more candidates = better play. (Feel-tunable later; the user will assess.)
- AI **think delay** ≈ 0.5s before each AI flick, so its moves are watchable (not instant).
- Menu: **Solo vs AI** row with three difficulty buttons (Easy / Normal / Hard) → `/play?mode=ai&difficulty=<d>`.
- Keeper is Plan 5b — until then the AI shoots at an **open goal**.

---

## File Structure

- `src/game/ai/simulate.ts` (+ test) — `SimCap`, `SimOutcome`, `simulateFlick`.
- `src/game/ai/policy.ts` (+ test) — `Difficulty`, `AiFlick`, `AiContext`, `chooseAiFlick`.
- `src/routes/play.tsx` (modified) — `mode="ai"` + `difficulty` search params; AI-turn detection/trigger in the rAF loop; input gating during the AI's turn.
- `src/routes/index.tsx` (modified) — enable Solo vs AI with difficulty entries.

Task order: simulate → policy → route wiring → menu.

---

### Task 1: Flick simulation helper

**Files:**
- Create: `apps/cap-kickers/src/game/ai/simulate.ts`
- Test: `apps/cap-kickers/src/game/ai/simulate.test.ts`

**Interfaces:**
- Consumes: `PhysicsWorld`, `PhysicsConfig` from `../physics/world`; `Vec2` from `../physics/vec`; `Pitch` from `../rules/pitch`; `resolveFlick`, `FlickResult`, `ResolveOpts` from `../rules/flick`.
- Produces:
  - `type SimCap = { id: string; position: Vec2; radius: number }`
  - `type SimOutcome = { result: FlickResult; caps: { id: string; position: Vec2 }[] }`
  - `simulateFlick(caps: SimCap[], pitch: Pitch, physics: PhysicsConfig, flickedId: string, velocity: Vec2, opts?: ResolveOpts): SimOutcome` — builds a throwaway world from `caps` (mass 1), runs `resolveFlick`, returns the result + final positions. Does not mutate `caps`.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/ai/simulate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { simulateFlick, type SimCap } from "./simulate";
import { type Pitch } from "../rules/pitch";
import { type PhysicsConfig } from "../physics/world";

const pitch: Pitch = { width: 800, height: 500, goalWidth: 200 }; // mouth y in [150,350]
const physics: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

const caps = (): SimCap[] => [
  { id: "f", position: { x: 100, y: 250 }, radius: 8 },
  { id: "a", position: { x: 150, y: 210 }, radius: 8 },
  { id: "b", position: { x: 150, y: 290 }, radius: 8 },
];

describe("simulateFlick", () => {
  it("predicts a gate-threading flick that rests in-bounds", () => {
    const out = simulateFlick(caps(), pitch, physics, "f", { x: 300, y: 0 });
    expect(out.result.crossedGate).toBe(true);
    expect(out.result.flickedEnding).toBe("rest");
    expect(out.result.anyCapLeftPitch).toBe(false);
  });

  it("predicts a shot into the right goal", () => {
    const shot: SimCap[] = [
      { id: "f", position: { x: 700, y: 250 }, radius: 8 },
      { id: "a", position: { x: 300, y: 210 }, radius: 8 },
      { id: "b", position: { x: 300, y: 290 }, radius: 8 },
    ];
    const out = simulateFlick(shot, pitch, physics, "f", { x: 3000, y: 0 });
    expect(out.result.flickedEnding).toBe("goalRight");
  });

  it("does not mutate the input caps and is deterministic", () => {
    const input = caps();
    const snapshot = JSON.parse(JSON.stringify(input));
    const a = simulateFlick(input, pitch, physics, "f", { x: 300, y: 0 });
    const b = simulateFlick(input, pitch, physics, "f", { x: 300, y: 0 });
    expect(input).toEqual(snapshot); // unmutated
    expect(a).toEqual(b); // deterministic
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/ai/simulate.test.ts`
Expected: FAIL — cannot resolve `./simulate`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/ai/simulate.ts`:

```ts
import { PhysicsWorld, type PhysicsConfig } from "../physics/world";
import { type Vec2 } from "../physics/vec";
import { type Pitch } from "../rules/pitch";
import { resolveFlick, type FlickResult, type ResolveOpts } from "../rules/flick";

export type SimCap = { id: string; position: Vec2; radius: number };
export type SimOutcome = {
  result: FlickResult;
  caps: { id: string; position: Vec2 }[];
};

/**
 * Simulate one flick on a throwaway world built from `caps`, using the SAME
 * physics config as the live game — because the engine is deterministic, the
 * outcome is an exact prediction. Does not mutate `caps`.
 */
export const simulateFlick = (
  caps: SimCap[],
  pitch: Pitch,
  physics: PhysicsConfig,
  flickedId: string,
  velocity: Vec2,
  opts: ResolveOpts = {},
): SimOutcome => {
  const world = new PhysicsWorld(physics);
  for (const c of caps) {
    world.addBody({
      id: c.id,
      position: { x: c.position.x, y: c.position.y },
      velocity: { x: 0, y: 0 },
      radius: c.radius,
      mass: 1,
    });
  }
  const otherIds = caps.filter((c) => c.id !== flickedId).map((c) => c.id);
  const result = resolveFlick(
    world,
    pitch,
    flickedId,
    [otherIds[0], otherIds[1]],
    velocity,
    opts,
  );
  return {
    result,
    caps: world.bodies.map((b) => ({
      id: b.id,
      position: { x: b.position.x, y: b.position.y },
    })),
  };
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/ai/simulate.test.ts` (3 pass), then `cd apps/cap-kickers && bunx vitest run` (full suite green — 69 + 3 = 72).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/ai/simulate.ts apps/cap-kickers/src/game/ai/simulate.test.ts
git commit -m "feat(cap-kickers): AI flick simulation helper (deterministic prediction)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: AI policy (choose the best flick)

**Files:**
- Create: `apps/cap-kickers/src/game/ai/policy.ts`
- Test: `apps/cap-kickers/src/game/ai/policy.test.ts`

**Interfaces:**
- Consumes: `Vec2`, `dist` from `../physics/vec`; `PhysicsConfig` from `../physics/world`; `Pitch`, `PlayerSide`, `attackingGoal`, `goalZone` from `../rules/pitch`; `simulateFlick`, `SimCap` from `./simulate`.
- Produces:
  - `type Difficulty = "easy" | "normal" | "hard"`
  - `type AiFlick = { capId: string; velocity: Vec2 }`
  - `type AiContext = { pitch: Pitch; physics: PhysicsConfig; attacker: PlayerSide; touch: number; difficulty: Difficulty; maxSpeed: number }`
  - `chooseAiFlick(caps: SimCap[], ctx: AiContext): AiFlick | null` — deterministic; returns the best-scoring candidate flick (or null if fewer than 2 caps). The route calls this then `session.beginFlick(capId, velocity)`.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/ai/policy.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chooseAiFlick, type AiContext } from "./policy";
import { simulateFlick, type SimCap } from "./simulate";
import { type PhysicsConfig } from "../physics/world";
import { type Pitch } from "../rules/pitch";

const pitch: Pitch = { width: 1000, height: 620, goalWidth: 220 };
const physics: PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 3,
  restitution: 0.45,
  restEpsilon: 2,
  maxSubsteps: 16,
  bounds: { minX: -100000, minY: -100000, maxX: 100000, maxY: 100000 },
};

// side 0 attacks the RIGHT goal. A triangle in front of the left goal.
const triangle = (): SimCap[] => [
  { id: "c0", position: { x: 64, y: 262 }, radius: 16 },
  { id: "c1", position: { x: 64, y: 358 }, radius: 16 },
  { id: "c2", position: { x: 128, y: 310 }, radius: 16 },
];

const ctx = (over: Partial<AiContext> = {}): AiContext => ({
  pitch,
  physics,
  attacker: 0,
  touch: 1,
  difficulty: "hard",
  maxSpeed: 2600,
  ...over,
});

const goalX = pitch.width; // side 0 attacks right
const goalCenter = { x: goalX, y: pitch.height / 2 };
const d = (p: { x: number; y: number }) => Math.hypot(p.x - goalCenter.x, p.y - goalCenter.y);

describe("chooseAiFlick", () => {
  it("returns a legal build-up flick that advances toward the target goal", () => {
    const caps = triangle();
    const move = chooseAiFlick(caps, ctx({ touch: 1 }));
    expect(move).not.toBeNull();
    const sim = simulateFlick(caps, pitch, physics, move!.capId, move!.velocity);
    // legal: threaded the gate, stayed in-bounds, came to rest
    expect(sim.result.crossedGate).toBe(true);
    expect(sim.result.flickedEnding).toBe("rest");
    expect(sim.result.anyCapLeftPitch).toBe(false);
    // advanced: the flicked cap ended closer to the goal than it started
    const before = caps.find((c) => c.id === move!.capId)!.position;
    const after = sim.caps.find((c) => c.id === move!.capId)!.position;
    expect(d(after)).toBeLessThan(d(before));
  });

  it("chooses a scoring shot on the 4th touch when one is available", () => {
    // a cap near the right goal mouth with a clear shot
    const shotCaps: SimCap[] = [
      { id: "c0", position: { x: 860, y: 310 }, radius: 16 },
      { id: "c1", position: { x: 500, y: 200 }, radius: 16 },
      { id: "c2", position: { x: 500, y: 420 }, radius: 16 },
    ];
    const move = chooseAiFlick(shotCaps, ctx({ touch: 4 }));
    expect(move).not.toBeNull();
    const sim = simulateFlick(shotCaps, pitch, physics, move!.capId, move!.velocity);
    expect(sim.result.flickedEnding).toBe("goalRight");
  });

  it("is deterministic", () => {
    const caps = triangle();
    expect(chooseAiFlick(caps, ctx())).toEqual(chooseAiFlick(caps, ctx()));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/ai/policy.test.ts`
Expected: FAIL — cannot resolve `./policy`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/ai/policy.ts`:

```ts
import { type Vec2, dist } from "../physics/vec";
import { type PhysicsConfig } from "../physics/world";
import {
  type Pitch,
  type PlayerSide,
  type CapZone,
  attackingGoal,
  goalZone,
} from "../rules/pitch";
import { type FlickResult } from "../rules/flick";
import { simulateFlick, type SimCap } from "./simulate";

export type Difficulty = "easy" | "normal" | "hard";
export type AiFlick = { capId: string; velocity: Vec2 };

export type AiContext = {
  pitch: Pitch;
  physics: PhysicsConfig;
  attacker: PlayerSide;
  touch: number; // 1..4
  difficulty: Difficulty;
  maxSpeed: number;
};

const DIFFS: Record<Difficulty, { samples: number }> = {
  easy: { samples: 4 },
  normal: { samples: 8 },
  hard: { samples: 16 },
};

const POWER_LEVELS = [0.45, 0.7, 1.0];
const ANGLE_SPREAD = 0.7; // radians; half-spread around the cap->goal aim

const goalCenter = (ctx: AiContext): Vec2 => {
  const side = attackingGoal(ctx.attacker);
  return { x: side === "left" ? 0 : ctx.pitch.width, y: ctx.pitch.height / 2 };
};

const scoreOutcome = (
  result: FlickResult,
  finalFlicked: Vec2,
  goal: Vec2,
  targetZone: CapZone,
  touch: number,
): number => {
  const d = dist(finalFlicked, goal);
  if (touch <= 3) {
    const legal =
      result.crossedGate && result.flickedEnding === "rest" && !result.anyCapLeftPitch;
    if (!legal) {
      // Among illegal candidates, prefer ones that at least threaded the gate.
      return -1e9 + (result.crossedGate ? 1e5 : 0) - d;
    }
    return -d; // legal: closer to the goal is better
  }
  // Shot (touch 4): a goal dominates everything.
  if (result.flickedEnding === targetZone) return 1e9 - d;
  return -d;
};

/**
 * Deterministically choose the AI's flick for the current touch by simulating a
 * spread of candidate (cap × direction × power) flicks and scoring each. Search
 * breadth scales with difficulty. Same inputs → same output (no randomness).
 */
export const chooseAiFlick = (caps: SimCap[], ctx: AiContext): AiFlick | null => {
  if (caps.length < 2) return null;
  const goal = goalCenter(ctx);
  const targetZone = goalZone(attackingGoal(ctx.attacker));
  const samples = DIFFS[ctx.difficulty].samples;

  let best: AiFlick | null = null;
  let bestScore = -Infinity;

  for (const cap of caps) {
    const base = Math.atan2(goal.y - cap.position.y, goal.x - cap.position.x);
    for (let i = 0; i < samples; i++) {
      const frac = samples === 1 ? 0.5 : i / (samples - 1);
      const angle = base + (frac - 0.5) * 2 * ANGLE_SPREAD;
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };
      for (const pf of POWER_LEVELS) {
        const speed = ctx.maxSpeed * pf;
        const velocity = { x: dir.x * speed, y: dir.y * speed };
        const sim = simulateFlick(caps, ctx.pitch, ctx.physics, cap.id, velocity);
        const finalFlicked = sim.caps.find((c) => c.id === cap.id)!.position;
        const score = scoreOutcome(sim.result, finalFlicked, goal, targetZone, ctx.touch);
        if (score > bestScore) {
          bestScore = score;
          best = { capId: cap.id, velocity };
        }
      }
    }
  }
  return best;
};
```

Note: if `../rules/pitch` does not export `CapZone`, import it or replace the `targetZone: CapZone` annotation with `string` (the comparison is a plain equality). Verify the export before implementing; `goalZone` returns a `CapZone`.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/ai/policy.test.ts` (3 pass), then `cd apps/cap-kickers && bunx vitest run` (full suite green — 72 + 3 = 75). If the build-up "advances" assertion is flaky for the chosen constants, the fix is in the test's start geometry, not the policy — keep the policy scoring intact and report any test-geometry adjustment.

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/ai/policy.ts apps/cap-kickers/src/game/ai/policy.test.ts
git commit -m "feat(cap-kickers): simulation-based AI flick policy with difficulty

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire the AI into `/play` (mode="ai")

**Goal:** In `mode="ai"`, the AI auto-plays its turns; human input is gated during the AI's turn. Run-verified.

**Files:** Modify `apps/cap-kickers/src/routes/play.tsx`.

**Design / changes:**
- **Search schema:** extend to `mode: z.enum(["2p","practice","ai"]).catch("practice")` and add `difficulty: z.enum(["easy","normal","hard"]).catch("normal")`. Read both via `Route.useSearch()`.
- **Constants:** `const AI_SIDE = 1;` (human is side 0). `const AI_THINK_SECONDS = 0.5;`
- **`modeRef`** already mirrors mode; add a `difficultyRef` mirrored the same way (so the rAF loop reads the latest without re-running). Import `chooseAiFlick` from `../game/ai/policy` and `PITCH, PHYSICS, SWIPE` (already imported PITCH/SWIPE; add PHYSICS).
- **AI trigger in the rAF `loop`** (after `render(session)` / after the tick block): add an `aiThinkRef = useRef(0)`. Each frame:
  ```ts
  if (
    modeRef.current === "ai" &&
    session.phase === "aiming" &&
    session.match.phase !== "won" &&
    session.match.attacker === AI_SIDE
  ) {
    aiThinkRef.current += dt;
    if (aiThinkRef.current >= AI_THINK_SECONDS) {
      aiThinkRef.current = 0;
      const move = chooseAiFlick(session.caps(), {
        pitch: PITCH,
        physics: PHYSICS,
        attacker: session.match.attacker,
        touch: session.match.touch,
        difficulty: difficultyRef.current,
        maxSpeed: SWIPE.maxSpeed,
      });
      if (move) session.beginFlick(move.capId, move.velocity);
    }
  } else {
    aiThinkRef.current = 0;
  }
  ```
  (Place this where `dt` is in scope — inside the `if (last !== null)` block after `session.tick(dt)`, or compute `dt` once and reuse. Ensure it runs whether or not `tick` returned a report, and only while aiming.)
- **Input gating:** in `handlePointerDown` and `endDrag`, additionally early-return when `mode === "ai" && session.match.attacker === AI_SIDE` (human can only flick on their own turn). Practice/2p unaffected.
- **No flip in ai mode:** `flipped` already `= mode === "2p" && viewAttacker === 1`, so it is false in `ai` — correct (human always views from their orientation). No handoff in ai mode (handoff is gated on `mode === "2p"`).
- **HUD:** optional — when it's the AI's turn, the turn line may read "AI — touch k of 4" instead of "Player 2 — …". Minimal: keep "Player 2" or special-case side 1 to "AI" in `ai` mode. Either is acceptable; note which you did.

**Steps:**
- [ ] **Step 1:** Implement the changes. Keep all AI logic in `chooseAiFlick`; the route only decides WHEN to call it and gates input.
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `cd apps/cap-kickers && bunx vitest run` (75 core tests still green).
- [ ] **Step 3 (controller live-verify):** open `/play?mode=ai&difficulty=normal`. Human (blue caps) attacks right. After the human completes a turn (or immediately if the AI ever attacks), confirm the AI takes its turn automatically after ~0.5s per flick, threading gates and shooting; confirm human input is ignored during the AI's turn and accepted on the human's turn; confirm a win still shows the winner overlay. Screenshots for the report.
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/play.tsx
git commit -m "feat(cap-kickers): solo vs AI mode — AI plays its turns in /play

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Verification note:** deliverable = "in ai mode the AI plays legal, goal-seeking turns on its own with a visible think delay, human input gated to the human's turn." Judged from the running app.

---

### Task 4: Enable Solo vs AI in the menu

**Goal:** The disabled "Solo vs AI" becomes three difficulty entries. Run-verified.

**Files:** Modify `apps/cap-kickers/src/routes/index.tsx`.

**Steps:**
- [ ] **Step 1:** Replace the disabled "Solo vs AI — Coming soon" control with a labeled **"Solo vs AI"** group of three buttons — `<Link to="/play" search={{ mode: "ai", difficulty: "easy" }}>Easy</Link>`, `…"normal"…>Normal`, `…"hard"…>Hard` — styled as a row of three smaller buttons under a "Solo vs AI" caption. Keep Pass & Play and Practice as-is (their `search` may now also carry the default `difficulty` implicitly; the schema's `.catch("normal")` covers omission, so leaving them as `search={{ mode: "2p" }}` / `{ mode: "practice" }` is fine). Keep heading/description/layout.
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean — the `search={{ mode: "ai", difficulty }}` typechecks against Task 3's schema) and `bunx vitest run` (75 green).
- [ ] **Step 3 (controller live-verify):** home shows Solo vs AI with Easy/Normal/Hard; each navigates to `/play?mode=ai&difficulty=<d>`.
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/index.tsx
git commit -m "feat(cap-kickers): enable Solo vs AI (Easy/Normal/Hard) in the menu

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (design spec section 7 "AI" — attacker AI + Easy/Normal/Hard; build-order step 5, AI-attacker half):**
- Simulation-based attacker AI exploiting determinism → Task 1 (`simulateFlick`) + Task 2 (`chooseAiFlick`). ✅
- Easy/Normal/Hard → Task 2 (`DIFFS` search breadth). ✅
- Solo vs AI mode wired + menu enabled → Tasks 3–4. ✅
- Keeper is **Plan 5b** (open goal here) — correctly out of scope; the AI shoots at an open goal for now.
- Determinism preserved (AI is pure, no randomness) → enforced in Task 2 + tested.

**Placeholder scan:** Tasks 1–2 carry full code + commands. Tasks 3–4 are run-verified UI with concrete search-schema, exact constant names, the AI-trigger snippet, and browser steps — not placeholders.

**Type consistency:** `SimCap`/`SimOutcome`/`simulateFlick` (Task 1) consumed by Task 2 and the route. `Difficulty`/`AiFlick`/`AiContext`/`chooseAiFlick` (Task 2) consumed by the route (Task 3); the `difficulty` search-param enum (Task 3) matches `Difficulty` and the menu links (Task 4). `resolveFlick`/`FlickResult` reused unchanged from `rules/flick.ts` (confirmed signature). `goalZone` returns `CapZone`; verify `CapZone` is exported from `rules/pitch` (it is) before annotating.

---

## Next plan

Plan 5b (Goalkeeper): a mass-heavy keeper body constrained to the defended goal line, moved by a keeper AI (reaction delay + max speed by difficulty) during shots to block/deflect — integrated so it participates in physics collisions but is excluded from the caps' gate/boundary classification (restrict `resolveFlick`/`FlickTracker` boundary checks to the three cap ids). Then the shot must beat the keeper to score.
