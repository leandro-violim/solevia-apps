# Cap Kickers — Plan 7: Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the unusual "thread the gap" rule with a guided, illustrated, stepped tutorial that auto-shows on first run, can be skipped, and can be replayed from the menu ("How to Play"). Persist a "seen" flag so it only auto-shows once.

**Architecture:** A short sequence of illustrated steps (select a cap → thread the gap → advance → shoot), each with a small inline-SVG diagram of the pitch + caps. Two **testable** pure pieces: the step content/model (`tutorial/steps.ts`) and the seen-flag persistence (`tutorial/storage.ts`, defensive + injectable, mirroring the campaign storage pattern). Then **run-verified** UI: a `/tutorial` route rendering the stepped flow (Back / Skip / Next / Start playing), first-run auto-redirect from the home route when the flag is unset, and a "How to Play" menu entry to replay. This is DOM/SVG — no dependency on the canvas game loop — so it renders and verifies without rAF.

**Scope note:** This is a *guided illustrated* tutorial (teaches by showing), not a hands-on sandbox where the player performs each action against the live physics. That's a deliberate, verifiable scope; a hands-on interactive tutorial is a possible later enhancement.

**Tech Stack:** TypeScript (strict); Vitest (node) for steps + storage; React + TanStack Router + inline SVG for UI; bun.

## Global Constraints

- **Package manager:** bun. Core tests `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`; types `bunx tsc --noEmit`. Dev: `bun run dev`.
- **Determinism:** no `Math.random()`/`Date.now()`/`new Date()` in `src/game/`.
- **Do not regress:** the 94 existing tests stay green.
- **Persistence is defensive:** the seen-flag load/save tolerates missing/blocked storage (never throws), injectable for tests (same pattern as `campaign/storage.ts`).
- **First-run redirect fires at most once per load and only when unseen;** skipping or finishing marks it seen.
- **TypeScript:** `strict: true`. **Core:** `apps/cap-kickers/src/game/tutorial/`. **UI:** `apps/cap-kickers/src/routes/`.
- **Commits:** conventional-commit; body ends `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit per verified deliverable. Stay on `cap-kickers`.

## Product decisions (this plan)
- 5 steps (intro → select → thread → advance → shoot). Copy is fixed below.
- Storage key `capkickers.tutorial.v1`.
- First run: home auto-redirects to `/tutorial` when unseen. Skip/Start both mark seen and return home.
- Replay: a "How to Play" menu entry links to `/tutorial` (does not depend on the seen flag).

---

## File Structure

- `src/game/tutorial/steps.ts` (+test) — `TutorialStep`, `TUTORIAL_STEPS`, `isLastStep`, `stepCount`.
- `src/game/tutorial/storage.ts` (+test) — `hasSeenTutorial`, `markTutorialSeen` (injectable).
- `src/routes/tutorial.tsx` (new) — the stepped illustrated flow.
- `src/routes/index.tsx` (modified) — first-run auto-redirect + "How to Play" entry.

Task order: steps → storage → tutorial route → home wiring.

---

### Task 1: Tutorial step content + model

**Files:**
- Create: `apps/cap-kickers/src/game/tutorial/steps.ts`
- Test: `apps/cap-kickers/src/game/tutorial/steps.test.ts`

**Interfaces:**
- Produces:
  - `type TutorialStep = { id: string; title: string; body: string }`
  - `TUTORIAL_STEPS: TutorialStep[]` (the 5 steps below, verbatim)
  - `stepCount: number` (= `TUTORIAL_STEPS.length`)
  - `isLastStep(index: number): boolean` (true iff `index === stepCount - 1`)

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/tutorial/steps.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TUTORIAL_STEPS, stepCount, isLastStep } from "./steps";

describe("tutorial steps", () => {
  it("has an ordered set of steps with unique ids", () => {
    expect(TUTORIAL_STEPS.length).toBe(5);
    expect(stepCount).toBe(TUTORIAL_STEPS.length);
    expect(TUTORIAL_STEPS[0].id).toBe("intro");
    expect(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id).toBe("shoot");
    expect(new Set(TUTORIAL_STEPS.map((s) => s.id)).size).toBe(TUTORIAL_STEPS.length);
    for (const s of TUTORIAL_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.body.length).toBeGreaterThan(0);
    }
  });

  it("isLastStep identifies the final index", () => {
    expect(isLastStep(TUTORIAL_STEPS.length - 1)).toBe(true);
    expect(isLastStep(0)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/tutorial/steps.test.ts`
Expected: FAIL — cannot resolve `./steps`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/tutorial/steps.ts`:

```ts
export type TutorialStep = { id: string; title: string; body: string };

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Cap Kickers",
    body: "Flick your bottle caps across the pitch and score in the goal. Here's the trick to it.",
  },
  {
    id: "select",
    title: "Pick a cap",
    body: "You control three caps. Tap one to select it — a gold ring shows which is active.",
  },
  {
    id: "thread",
    title: "Thread the gap",
    body: "Swipe to flick the selected cap so it passes BETWEEN your other two caps. Miss the gap and you lose your turn.",
  },
  {
    id: "advance",
    title: "Advance up the pitch",
    body: "You get four touches per turn. Keep threading the gap to work the caps toward the goal.",
  },
  {
    id: "shoot",
    title: "Shoot!",
    body: "On your fourth touch, fire at the goal and beat the keeper. First to the goal target wins the match.",
  },
];

export const stepCount = TUTORIAL_STEPS.length;
export const isLastStep = (index: number): boolean => index === stepCount - 1;
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/tutorial/steps.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 94 + 2 = 96).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/tutorial/steps.ts apps/cap-kickers/src/game/tutorial/steps.test.ts
git commit -m "feat(cap-kickers): tutorial step content + model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Tutorial "seen" flag persistence

**Files:**
- Create: `apps/cap-kickers/src/game/tutorial/storage.ts`
- Test: `apps/cap-kickers/src/game/tutorial/storage.test.ts`

**Interfaces:**
- Produces:
  - `type StorageLike = { getItem(k: string): string | null; setItem(k: string, v: string): void }`
  - `hasSeenTutorial(storage?: StorageLike | null): boolean` — true iff the flag is stored; false on missing/blocked/null storage; never throws.
  - `markTutorialSeen(storage?: StorageLike | null): void` — sets the flag; no-ops when storage is unavailable/full.
  - Both default `storage` to a guarded `globalThis.localStorage`.
  - Storage key: `capkickers.tutorial.v1`.

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/tutorial/storage.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hasSeenTutorial, markTutorialSeen, type StorageLike } from "./storage";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("tutorial storage", () => {
  it("reports unseen until marked, then seen", () => {
    const s = fakeStorage();
    expect(hasSeenTutorial(s)).toBe(false);
    markTutorialSeen(s);
    expect(hasSeenTutorial(s)).toBe(true);
  });

  it("is safe with null storage", () => {
    expect(hasSeenTutorial(null)).toBe(false);
    expect(() => markTutorialSeen(null)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/tutorial/storage.test.ts`
Expected: FAIL — cannot resolve `./storage`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/tutorial/storage.ts`:

```ts
export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.tutorial.v1";

const defaultStorage = (): StorageLike | null => {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
      return (globalThis as { localStorage: StorageLike }).localStorage;
    }
  } catch {
    /* fall through */
  }
  return null;
};

export const hasSeenTutorial = (storage: StorageLike | null = defaultStorage()): boolean => {
  if (!storage) return false;
  try {
    return storage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const markTutorialSeen = (storage: StorageLike | null = defaultStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, "1");
  } catch {
    /* blocked/full -> ignore */
  }
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/tutorial/storage.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 96 + 2 = 98).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/tutorial/storage.ts apps/cap-kickers/src/game/tutorial/storage.test.ts
git commit -m "feat(cap-kickers): tutorial seen-flag persistence (localStorage, injectable)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Tutorial route (stepped illustrated flow)

**Goal:** `/tutorial` renders the steps with illustrations and navigation. Run-verified.

**Files:** Create `apps/cap-kickers/src/routes/tutorial.tsx`.

**Design:**
- `createFileRoute("/tutorial")({ component: TutorialPage })` with a `head` title "Cap Kickers — How to Play".
- State: `const [i, setI] = useState(0)` (current step index). `const step = TUTORIAL_STEPS[i]`.
- `const nav = useNavigate()`. `const finish = () => { markTutorialSeen(); nav({ to: "/" }); }`.
- Layout (centered, landscape-friendly, `min-h-dvh`, safe-area top padding):
  - A **progress row** of `stepCount` dots; the dot at `i` filled.
  - An **illustration** area: a small inline `<svg viewBox="0 0 200 130">` mini-pitch that changes per `step.id` (see below).
  - The step **title** (`step.title`) and **body** (`step.body`).
  - A **button row**:
    - **Skip** (always, unless on the last step you may hide it): `<button onClick={finish}>` — marks seen + home.
    - **Back** (only if `i > 0`): `setI(i - 1)`.
    - **Next** (if `!isLastStep(i)`): `setI(i + 1)`; on the last step show **Start playing** `<button onClick={finish}>` instead.
- **Illustrations (inline SVG, per step id):** draw a simple green pitch rect (with a goal mouth marked on the right end) and three caps (circles). Vary by step:
  - `intro`: pitch + 3 caps clustered left + a goal on the right. Plain.
  - `select`: same, but one cap has a gold ring (`stroke="#ffd54a"`).
  - `thread`: three caps with two forming a vertical "gate" and an arrow (a `<line>`/`<path>` with an arrowhead) from the third cap passing BETWEEN the gate pair. This is the key illustration — make the "between the two caps" motion obvious.
  - `advance`: caps shifted toward the goal, plus a small row of 4 touch dots with 2–3 filled.
  - `shoot`: a cap near the goal with an arrow into the goal mouth, and an amber keeper rectangle/circle in the mouth.
  Keep SVGs simple and self-contained (no external assets); use the app's colors (pitch `#1f7a44`, caps blue `#3b82f6`, keeper amber `#f4c542`, accents gold `#ffd54a`).

**Steps:**
- [ ] **Step 1:** Implement `tutorial.tsx` (state machine + per-step SVG + navigation). Import `TUTORIAL_STEPS, stepCount, isLastStep` from `../game/tutorial/steps` and `markTutorialSeen` from `../game/tutorial/storage`.
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `bunx vitest run` (98 core tests green).
- [ ] **Step 3 (controller live-verify):** open `/tutorial`. Step through all 5 with Next/Back; confirm each shows its illustration + copy and the progress dots track; confirm "Start playing" on the last and "Skip" both go home. Screenshots (esp. the "thread the gap" step).
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/tutorial.tsx
git commit -m "feat(cap-kickers): tutorial route (stepped illustrated how-to-play)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: First-run auto-show + "How to Play" menu entry

**Goal:** The tutorial auto-shows on first run and is replayable from the menu. Run-verified.

**Files:** Modify `apps/cap-kickers/src/routes/index.tsx`.

**Design:**
- **First-run redirect:** in the home component, `useEffect(() => { if (!hasSeenTutorial()) nav({ to: "/tutorial" }); }, [])` (runs once on mount; `hasSeenTutorial()` returns false when storage is unavailable, which is acceptable — it just shows the tutorial). Use `const nav = useNavigate()`. Guard: the effect's empty-dep array runs it once per mount; that's the intended "first visit this load" behavior.
- **"How to Play" menu entry:** add a small secondary/tertiary `<Link to="/tutorial">How to Play</Link>` in the menu (e.g. below the Solo vs AI row, or in a small footer nav) so it can be replayed anytime regardless of the seen flag. Keep the existing entries (Campaign, Pass & Play, Practice, Solo vs AI) + heading/layout.
- Import `hasSeenTutorial` from `../game/tutorial/storage` and `useNavigate` from `@tanstack/react-router`.

**Steps:**
- [ ] **Step 1:** Implement the redirect effect + the "How to Play" link.
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `bunx vitest run` (98 green).
- [ ] **Step 3 (controller live-verify):** clear the tutorial flag (`localStorage.removeItem("capkickers.tutorial.v1")`), load `/` → confirm it redirects to `/tutorial`; finish/skip → confirm it returns home and does NOT redirect again on the next home load (flag now set); confirm "How to Play" replays it. Screenshots.
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/index.tsx
git commit -m "feat(cap-kickers): first-run tutorial redirect + How to Play menu entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (design spec: interactive first-run tutorial, skippable; build-order step 7):**
- Teaches select → thread-the-gap → advance → shoot → first-run, skippable, replayable → Tasks 1–4. ✅
- Persisted "seen" flag → Task 2. ✅
- Scope: guided *illustrated* stepped tutorial (not a hands-on physics sandbox) — a deliberate, verifiable choice; noted in the plan header and to be surfaced to the user. A hands-on sandbox is a future enhancement.
- Determinism preserved (steps/flag are pure/I-O only). ✅

**Placeholder scan:** Tasks 1–2 carry full code/tests; Tasks 3–4 are run-verified UI with exact step copy, concrete SVG-per-step guidance, exact route/effect specs, and browser steps.

**Type consistency:** `TUTORIAL_STEPS`/`stepCount`/`isLastStep` (Task 1) consumed by `tutorial.tsx` (Task 3). `hasSeenTutorial`/`markTutorialSeen` (Task 2) consumed by `tutorial.tsx` (Task 3, mark on finish) and `index.tsx` (Task 4, first-run check). Storage mirrors `campaign/storage.ts`'s defensive/injectable shape.

---

## Next plan

Plan 8 (shared packages + monetization + iOS + store): extract PopZen's AdMob/consent into `@solevia/{ads,consent,analytics}`, wire banner/interstitial via the shared packages, set up the Capacitor iOS build + `app.solevia.capkickers`, and produce landscape App Store assets. Plus the deferred visual/layout polish pass (keeper size, colors, overall look) per user feedback.
