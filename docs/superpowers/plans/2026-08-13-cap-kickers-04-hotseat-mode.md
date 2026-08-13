# Cap Kickers — Plan 4: 2-Player Hotseat + Mode Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Cap Kickers a real two-player game on one device: a home mode menu, a "pass & play" hotseat mode that flips the board 180° for Player 2 with a "pass the phone" handoff between turns, and a win/rematch flow — plus hardening the `GameSession` to be self-protecting after a win.

**Architecture:** Build on Plan 3's `GameSession` + `/play` canvas. Two small **testable** additions: (1) a post-win guard inside `GameSession.beginFlick`, and (2) a pure `presentation` module that adds a flip-aware pitch↔screen transform (180° rotation about the pitch center) on top of the Plan 3 viewport. Then **run-verified** UI: a home mode menu and the `/play` route reading a `mode` search param — in `2p` mode it orients the board for the current attacker, shows a "pass the phone" overlay when the turn changes hands, and names the winner. Keeper stays absent (open goal; Plan 5). `GameSession` remains coordinate-only and untouched by orientation — the flip lives entirely in presentation/render.

**Tech Stack:** React 19 + TanStack Router + canvas 2D; TypeScript (strict); Vitest (node) for the core; bun.

## Global Constraints

- **Package manager:** bun. Core tests: `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`; types `bunx tsc --noEmit`. Dev server: `bun run dev`.
- **Determinism:** no `Math.random()`/`Date.now()`/`new Date()` in `src/game/` (the rAF render loop in `src/routes/` may read frame time — UI only).
- **Do not regress:** the existing 65 tests must stay green.
- **Orientation lives in presentation/render only:** `GameSession` and all of `src/game/rules` + `src/game/physics` stay coordinate-only (pitch space). Player 0 always attacks the right goal, Player 1 the left, in pitch coordinates — the 180° flip is purely how Player 2's turn is DRAWN and how their taps are mapped back.
- **Player labels:** side 0 = "Player 1", side 1 = "Player 2" (1-indexed in UI copy).
- **TypeScript:** `strict: true`. **Core location:** `apps/cap-kickers/src/game/`. **UI:** `apps/cap-kickers/src/routes/`.
- **Commits:** conventional-commit style; end body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit after each task's deliverable is verified. Stay on the `cap-kickers` branch.

## Product decisions (v1 for this plan)
- **Modes offered on the menu:** **"Pass & Play (2 Players)"** (functional hotseat) and **"Practice (1 device)"** (current Plan 3 behavior — one person controls whoever attacks, no flip/handoff). **"Solo vs AI"** is shown **disabled ("Coming soon")** — it needs the AI from Plan 5.
- **Board flip:** during **Player 2's turn** the board is rotated **180°** so Player 2 also attacks "up-field, away from themselves." Player 1's turn is unflipped.
- **Pass the phone:** when a turn changes hands in 2p mode (turnover or goal), a full-screen overlay "**Pass the phone to Player N**" + a **"Ready"** button pauses play; tapping Ready flips the board to the new attacker's orientation and resumes. The board does not visibly flip until Ready is tapped (no flash for the outgoing player).
- **Win:** on a win, a full-screen overlay names the winner ("**Player N wins!**") with a **"Rematch"** button.

---

## File Structure

- `src/game/session.ts` (modified) — add `match.phase === "won"` to `beginFlick`'s guard. `session.test.ts` (add 1 test).
- `src/game/presentation.ts` (+ test) — `Presentation`, `makePresentation`, `pitchToScreen`, `screenToPitch` (flip-aware).
- `src/routes/index.tsx` (modified) — home mode menu.
- `src/routes/play.tsx` (modified) — read `mode` search param; use `presentation` (flip when 2p + current view is Player 2); pass-the-phone handoff overlay; winner overlay with player names.

Task order: session guard → presentation → menu → hotseat route.

---

### Task 1: GameSession post-win guard

**Files:**
- Modify: `apps/cap-kickers/src/game/session.ts` (the `beginFlick` guard)
- Test: `apps/cap-kickers/src/game/session.test.ts` (append 1 test)

**Interfaces:** no signature change. `beginFlick` becomes a no-op when `match.phase === "won"` (in addition to the existing `phase !== "aiming"` and unknown-id guards), so the session is self-protecting once the match is over — the route's overlay is then a second layer, not the only guard.

- [ ] **Step 1: Write the failing test** — append to `apps/cap-kickers/src/game/session.test.ts`:

```ts
describe("GameSession post-win guard", () => {
  it("ignores beginFlick once the match is won", () => {
    const s = new GameSession();
    s.match = { ...s.match, phase: "won", winner: 0 };
    const before = s.caps().map((c) => ({ ...c.position }));
    s.beginFlick("c2", { x: 5000, y: 0 });
    expect(s.phase).toBe("aiming"); // did not enter "resolving"
    const report = s.tick(1 / 60);
    expect(report).toBeNull(); // nothing is resolving
    expect(s.caps().map((c) => c.position)).toEqual(before); // no cap moved
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/session.test.ts`
Expected: FAIL — currently `beginFlick` only checks `phase !== "aiming"`, so on a won match (still `phase === "aiming"`) it would enter "resolving".

- [ ] **Step 3: Implement** — in `apps/cap-kickers/src/game/session.ts`, change the first line of `beginFlick`:

```ts
  beginFlick(capId: string, velocity: Vec2): void {
    if (
      this.phase !== "aiming" ||
      this.match.phase === "won" ||
      !(CAP_IDS as readonly string[]).includes(capId)
    )
      return;
```

(Leave the rest of `beginFlick` unchanged.)

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/session.test.ts` (expect all pass), then `cd apps/cap-kickers && bunx vitest run` (expect the full suite green — 65 prior + 1 new = 66).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/session.ts apps/cap-kickers/src/game/session.test.ts
git commit -m "fix(cap-kickers): make GameSession.beginFlick a no-op after a win

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Flip-aware presentation transform

**Files:**
- Create: `apps/cap-kickers/src/game/presentation.ts`
- Test: `apps/cap-kickers/src/game/presentation.test.ts`

**Interfaces:**
- Consumes: `Vec2` from `./physics/vec`; `Size`, `Viewport`, `computeViewport`, `pitchToCanvas`, `canvasToPitch` from `./viewport`; `Pitch` from `./rules/pitch`.
- Produces:
  - `type Presentation = { pitch: Pitch; viewport: Viewport; flipped: boolean }`
  - `makePresentation(pitch: Pitch, canvas: Size, flipped: boolean): Presentation`
  - `pitchToScreen(p: Vec2, pres: Presentation): Vec2` — pitch → canvas pixels, reflecting through the pitch center first when `flipped`.
  - `screenToPitch(s: Vec2, pres: Presentation): Vec2` — inverse.
  These replace the direct `viewport` calls in `play.tsx` so render and input share one flip.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/presentation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { makePresentation, pitchToScreen, screenToPitch } from "./presentation";
import { pitchToCanvas } from "./viewport";
import { vec } from "./physics/vec";
import { type Pitch } from "./rules/pitch";

const pitch: Pitch = { width: 1000, height: 620, goalWidth: 220 };
const canvas = { width: 1000, height: 620 }; // scale 1, no letterbox, for easy math

describe("presentation", () => {
  it("matches the plain viewport transform when not flipped", () => {
    const pres = makePresentation(pitch, canvas, false);
    expect(pitchToScreen(vec(100, 200), pres)).toEqual(pitchToCanvas(vec(100, 200), pres.viewport));
  });

  it("reflects through the pitch center when flipped", () => {
    const pres = makePresentation(pitch, canvas, true);
    // center maps to itself
    expect(pitchToScreen(vec(500, 310), pres)).toEqual({ x: 500, y: 310 });
    // pitch origin (0,0) draws where (width,height) would unflipped -> (1000,620)
    expect(pitchToScreen(vec(0, 0), pres)).toEqual({ x: 1000, y: 620 });
    // a right-goal point draws on the left, and vice versa
    expect(pitchToScreen(vec(1000, 310), pres)).toEqual({ x: 0, y: 310 });
  });

  it("round-trips screen->pitch->screen for both orientations", () => {
    for (const flipped of [false, true]) {
      const pres = makePresentation(pitch, { width: 1280, height: 800 }, flipped);
      const p = vec(321, 111);
      const back = screenToPitch(pitchToScreen(p, pres), pres);
      expect(back.x).toBeCloseTo(321, 6);
      expect(back.y).toBeCloseTo(111, 6);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/presentation.test.ts`
Expected: FAIL — cannot resolve `./presentation`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/presentation.ts`:

```ts
import { type Vec2 } from "./physics/vec";
import {
  type Size,
  type Viewport,
  computeViewport,
  pitchToCanvas,
  canvasToPitch,
} from "./viewport";
import { type Pitch } from "./rules/pitch";

export type Presentation = {
  pitch: Pitch;
  viewport: Viewport;
  flipped: boolean; // 180° rotation about the pitch center (Player 2's turn)
};

export const makePresentation = (pitch: Pitch, canvas: Size, flipped: boolean): Presentation => ({
  pitch,
  viewport: computeViewport(pitch, canvas),
  flipped,
});

// Rotate a pitch point 180° about the pitch center.
const reflect = (p: Vec2, pitch: Pitch): Vec2 => ({ x: pitch.width - p.x, y: pitch.height - p.y });

export const pitchToScreen = (p: Vec2, pres: Presentation): Vec2 =>
  pitchToCanvas(pres.flipped ? reflect(p, pres.pitch) : p, pres.viewport);

export const screenToPitch = (s: Vec2, pres: Presentation): Vec2 => {
  const p = canvasToPitch(s, pres.viewport);
  return pres.flipped ? reflect(p, pres.pitch) : p;
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/presentation.test.ts` (expect 3 pass), then `cd apps/cap-kickers && bunx vitest run` (full suite green — 66 prior + 3 = 69).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/presentation.ts apps/cap-kickers/src/game/presentation.test.ts
git commit -m "feat(cap-kickers): flip-aware pitch<->screen presentation transform

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Home mode menu

**Goal:** The home route offers the modes. Run-verified (no unit test).

**Files:** Modify `apps/cap-kickers/src/routes/index.tsx`.

**Steps:**
- [ ] **Step 1: Update `index.tsx`** — keep the existing `createFileRoute("/")` + heading/description, and replace the single Play link with three stacked controls:
  - `<Link to="/play" search={{ mode: "2p" }}>` labeled **"Pass & Play — 2 Players"** (primary button styling).
  - `<Link to="/play" search={{ mode: "practice" }}>` labeled **"Practice — 1 Device"** (secondary styling).
  - A **disabled** control labeled **"Solo vs AI — Coming soon"** (a `<button disabled>` or a muted `<div>`; not a link).
  Keep the `safe-area-inset-top` padding and the landscape-friendly layout. Use the existing Tailwind token classes already in the file.
- [ ] **Step 2: Verify build/types** — `cd apps/cap-kickers && bunx tsc --noEmit` (expect clean; the `search={{ mode }}` links require Task 4's search schema to typecheck — if you do Task 3 before Task 4, a temporary type error on the `search` prop is expected and resolved by Task 4; note it and proceed, or do Task 4's search schema first). `cd apps/cap-kickers && bunx vitest run` (65+ core tests still green).
- [ ] **Step 3: Commit**

```bash
git add apps/cap-kickers/src/routes/index.tsx
git commit -m "feat(cap-kickers): home mode menu (Pass & Play / Practice / Solo soon)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Verification note:** deliverable is "home shows the three mode options; Pass & Play and Practice navigate to `/play` with the right mode; Solo is visibly disabled." Controller confirms in the browser.

---

### Task 4: Hotseat `/play` (mode param, board flip, pass-the-phone, winner)

**Goal:** `/play` supports `?mode=2p|practice`. In `2p`, the board flips 180° for Player 2, a "pass the phone" overlay gates the turn handoff, and a winner overlay names the player. Run-verified (browser).

**Files:** Modify `apps/cap-kickers/src/routes/play.tsx`.

**Design / changes (implement on top of the Plan 3 route):**
- **Search param:** add a zod schema `validateSearch: (s) => ({ mode: s.mode === "2p" ? "2p" : "practice" })` (or a `z.enum(["2p","practice"]).catch("practice")`). Read `mode` via `Route.useSearch()`.
- **Presentation instead of raw viewport:** replace the route's `computeViewport`/`pitchToCanvas`/`canvasToPitch` usage with `makePresentation(PITCH, {width,height}, flipped)` + `pitchToScreen`/`screenToPitch` from `../game/presentation`. Compute `flipped = mode === "2p" && viewAttacker === 1` (see next).
- **`viewAttacker` state:** a React state (0|1) tracking which player the board is currently oriented for. It changes ONLY when a handoff completes (not the instant the session's attacker flips), so the outgoing player never sees the flipped board. Initialize to the session's starting attacker (0).
- **Handoff state:** a React state `handoffTo: 0 | 1 | null`. When `session.tick()` returns a report whose `result` is `"turnover"` or `"goal"` (attacker changed) AND `mode === "2p"` AND not a win, set `handoffTo = report.match.attacker`. While `handoffTo !== null`, render a full-screen overlay: "**Pass the phone to Player {handoffTo+1}**" + a **"Ready"** button. The overlay is `pointer-events-auto` and covers the canvas so no flick input reaches the game. Tapping **Ready** sets `viewAttacker = handoffTo` (board flips now) and `handoffTo = null` (resume).
- **Win overlay:** when a report's `result` is `"win"` (or `match.phase === "won"`), show a full-screen overlay "**Player {winner+1} wins!**" + **"Rematch"** (reuse the New-match handler: fresh `GameSession`, reset `viewAttacker` to 0, clear `handoffTo`, reset HUD state). This supersedes the handoff overlay.
- **Practice mode:** `flipped` is always false, `handoffTo` stays null (never set), no pass-the-phone — identical to Plan 3 behavior. The win overlay still applies (label "Player {winner+1} wins!").
- **HUD copy:** turn line reads "Player {attacker+1} — touch {touch} of 4". Keep the score + touch pips.
- **Input gating:** in addition to the existing `phase`/won checks, ignore pointer input while `handoffTo !== null`.

**Steps:**
- [ ] **Step 1: Implement the changes** in `play.tsx` per the design. Keep all game logic in `GameSession`; the route only adds presentation flip + handoff/win UI state.
- [ ] **Step 2: Type/lint + tests** — `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `cd apps/cap-kickers && bunx vitest run` (65+ core tests still green — this route adds no unit tests but must not break the build).
- [ ] **Step 3: Live verify in the browser** (controller): with `bun run dev` running, open `/play?mode=2p`. Confirm: Player 1 attacks rightward (unflipped); after a turnover/goal the "Pass the phone to Player 2" overlay appears; tapping Ready flips the board 180° (Player 2 now attacks toward the bottom-of-their-view / the left goal in pitch space, but visually "up-field"); a shot that wins shows "Player N wins!" + Rematch. Open `/play?mode=practice` and confirm no flip/handoff (Plan 3 behavior). Screenshots for the report.
- [ ] **Step 4: Commit**

```bash
git add apps/cap-kickers/src/routes/play.tsx
git commit -m "feat(cap-kickers): 2-player hotseat — board flip, pass-the-phone, winner

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Verification note:** deliverable is "2p mode flips for Player 2, gates handoff behind a pass-the-phone overlay, and names the winner; practice mode unchanged. Screenshots attached." Judged from the running app + report, not unit tests.

---

## Self-Review

**Spec coverage (design spec section 6 "Game modes" — 2-player hotseat + pass-the-phone; build-order step 4):**
- Mode menu (2-Player / Practice / Solo-coming-soon) → Task 3. ✅
- 2-player hotseat with 180° board flip for Player 2 → Task 2 (transform) + Task 4 (wiring). ✅
- "Pass the phone" transition between turns → Task 4. ✅
- Win/rematch flow with player names → Task 4. ✅
- Post-win hardening (carried from Plan 3 final review) → Task 1. ✅
- Out of scope (correct): AI opponent + keeper (Plan 5), campaign (Plan 6), tutorial (Plan 7), ads/native (Plan 8). Keeper stays absent → open goal.

**Placeholder scan:** Tasks 1–2 carry complete code + commands. Tasks 3–4 are run-verified UI with concrete design specs, exact copy strings, exact state names, and browser verification steps — appropriate for UI work, not placeholders.

**Type consistency:** `Presentation`/`makePresentation`/`pitchToScreen`/`screenToPitch` (Task 2) consumed by Task 4; they build on Plan 3's `Viewport`/`computeViewport`/`pitchToCanvas`/`canvasToPitch` (unchanged). `GameSession.beginFlick` signature unchanged (Task 1). The `mode` search param type (`"2p" | "practice"`) is shared between `index.tsx`'s `search` links (Task 3) and `play.tsx`'s `validateSearch` (Task 4) — Task 4's schema defines it; do Task 4's schema first if the Task 3 typecheck complains.

---

## Next plan

Plan 5 (AI opponent + keeper): a simulation-based attacker AI (exploiting the deterministic engine to try candidate flicks) and a goal-line keeper, with Easy/Normal/Hard, wired as a "Solo vs AI" mode that enables the menu item this plan left disabled.
