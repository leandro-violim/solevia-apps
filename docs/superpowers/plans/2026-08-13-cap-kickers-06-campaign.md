# Cap Kickers — Plan 6: Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-player Campaign — an unlockable ladder of AI opponents at rising difficulty, with progress persisted in `localStorage`. Beating a level unlocks the next. Reuses the existing AI + goalkeeper (a campaign level is an `ai`-mode match with the level's difficulty and goal target).

**Architecture:** Two **testable** pure modules under `src/game/campaign/`: (1) `ladder.ts` — the fixed level list + pure progression functions (unlocked/completed/complete/next); (2) `storage.ts` — load/save the progress object to `localStorage`, dependency-injectable so it's testable in node and safe when storage is unavailable. Then **run-verified** UI: a `/campaign` ladder route (levels with locked/unlocked/completed states), the `/play` route gaining `goals` + `campaign` search params (a campaign game is `mode=ai` with the level's difficulty + goal target; on a human win it records completion and offers Next/Retry/Back), and a Campaign entry on the menu.

**Tech Stack:** TypeScript (strict); Vitest (node) for the campaign core; React + TanStack Router for UI; bun.

## Global Constraints

- **Package manager:** bun. Core tests `cd apps/cap-kickers && bunx vitest run <file>`; full suite `bunx vitest run`; types `bunx tsc --noEmit`. Dev: `bun run dev`.
- **Determinism:** no `Math.random()`/`Date.now()`/`new Date()` in `src/game/`.
- **Do not regress:** the 85 existing tests stay green.
- **Persistence is defensive:** loading tolerates missing/corrupt/blocked storage (returns fresh progress, never throws); saving no-ops when storage is unavailable/full. Storage access is dependency-injectable for tests.
- **Reuse, don't fork:** a campaign match is an `ai`-mode game (existing AI + keeper); the level supplies `difficulty` + `goalsToWin`. No new game/session logic.
- **TypeScript:** `strict: true`. **Core:** `apps/cap-kickers/src/game/campaign/`. **UI:** `apps/cap-kickers/src/routes/`.
- **Commits:** conventional-commit; body ends `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit per verified deliverable. Stay on `cap-kickers`.

## Product decisions (this plan)
- **6 levels**, difficulty ramping easy→hard, goal target rising: Rookie(easy,3), Amateur(easy,3), Regular(normal,3), Veteran(normal,5), Pro(hard,5), Champion(hard,5). (Content is tunable later.)
- Level 1 is always unlocked; level N unlocks when level N−1 is completed. Completing = the **human** wins the match.
- Losing a campaign match (AI wins) does not unlock; the player retries.
- Storage key `capkickers.campaign.v1`.

---

## File Structure

- `src/game/campaign/ladder.ts` (+test) — `CampaignLevel`, `LEVELS`, `CampaignProgress`, `initialProgress`, `levelById`, `levelIndex`, `isCompleted`, `isUnlocked`, `completeLevel`, `nextLevelId`.
- `src/game/campaign/storage.ts` (+test) — `loadProgress`, `saveProgress` (injectable storage).
- `src/routes/play.tsx` (modified) — `goals` + `campaign` search params; campaign win → record completion + Next/Retry/Back overlay.
- `src/routes/campaign.tsx` (new) — the ladder screen.
- `src/routes/index.tsx` (modified) — Campaign menu entry.

Task order: ladder → storage → play campaign wiring → campaign route → menu.

---

### Task 1: Campaign ladder model + progression

**Files:**
- Create: `apps/cap-kickers/src/game/campaign/ladder.ts`
- Test: `apps/cap-kickers/src/game/campaign/ladder.test.ts`

**Interfaces:**
- Consumes: `Difficulty` from `../ai/policy`.
- Produces:
  - `type CampaignLevel = { id: string; name: string; difficulty: Difficulty; goalsToWin: number }`
  - `LEVELS: CampaignLevel[]` (the 6-level ladder)
  - `type CampaignProgress = { completed: string[] }`
  - `initialProgress(): CampaignProgress`
  - `levelById(id): CampaignLevel | undefined`, `levelIndex(id): number`
  - `isCompleted(id, p): boolean`
  - `isUnlocked(id, p): boolean` — index 0 always unlocked; level N unlocked iff level N−1 completed; unknown id → false
  - `completeLevel(id, p): CampaignProgress` — adds id (idempotent; unknown id → unchanged)
  - `nextLevelId(id): string | null`

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/campaign/ladder.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  LEVELS,
  initialProgress,
  isUnlocked,
  isCompleted,
  completeLevel,
  nextLevelId,
  levelById,
} from "./ladder";

describe("campaign ladder", () => {
  it("has an ordered ladder with rising difficulty", () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(6);
    expect(LEVELS[0].difficulty).toBe("easy");
    expect(LEVELS[LEVELS.length - 1].difficulty).toBe("hard");
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length); // unique ids
  });

  it("unlocks only the first level initially", () => {
    const p = initialProgress();
    expect(isUnlocked(LEVELS[0].id, p)).toBe(true);
    expect(isUnlocked(LEVELS[1].id, p)).toBe(false);
    expect(isUnlocked("nope", p)).toBe(false);
  });

  it("completing a level unlocks the next and is idempotent", () => {
    let p = initialProgress();
    p = completeLevel(LEVELS[0].id, p);
    expect(isCompleted(LEVELS[0].id, p)).toBe(true);
    expect(isUnlocked(LEVELS[1].id, p)).toBe(true);
    const again = completeLevel(LEVELS[0].id, p);
    expect(again.completed).toEqual(p.completed); // no duplicate
    expect(completeLevel("nope", p)).toEqual(p); // unknown id unchanged
  });

  it("nextLevelId walks the ladder and ends at null", () => {
    expect(nextLevelId(LEVELS[0].id)).toBe(LEVELS[1].id);
    expect(nextLevelId(LEVELS[LEVELS.length - 1].id)).toBeNull();
    expect(nextLevelId("nope")).toBeNull();
  });

  it("levelById resolves known ids", () => {
    expect(levelById(LEVELS[2].id)?.id).toBe(LEVELS[2].id);
    expect(levelById("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/campaign/ladder.test.ts`
Expected: FAIL — cannot resolve `./ladder`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/campaign/ladder.ts`:

```ts
import { type Difficulty } from "../ai/policy";

export type CampaignLevel = {
  id: string;
  name: string;
  difficulty: Difficulty;
  goalsToWin: number;
};

export const LEVELS: CampaignLevel[] = [
  { id: "l1", name: "Rookie", difficulty: "easy", goalsToWin: 3 },
  { id: "l2", name: "Amateur", difficulty: "easy", goalsToWin: 3 },
  { id: "l3", name: "Regular", difficulty: "normal", goalsToWin: 3 },
  { id: "l4", name: "Veteran", difficulty: "normal", goalsToWin: 5 },
  { id: "l5", name: "Pro", difficulty: "hard", goalsToWin: 5 },
  { id: "l6", name: "Champion", difficulty: "hard", goalsToWin: 5 },
];

export type CampaignProgress = { completed: string[] };
export const initialProgress = (): CampaignProgress => ({ completed: [] });

export const levelIndex = (id: string): number => LEVELS.findIndex((l) => l.id === id);
export const levelById = (id: string): CampaignLevel | undefined => LEVELS.find((l) => l.id === id);

export const isCompleted = (id: string, p: CampaignProgress): boolean => p.completed.includes(id);

export const isUnlocked = (id: string, p: CampaignProgress): boolean => {
  const i = levelIndex(id);
  if (i < 0) return false;
  if (i === 0) return true;
  return isCompleted(LEVELS[i - 1].id, p);
};

export const completeLevel = (id: string, p: CampaignProgress): CampaignProgress => {
  if (levelIndex(id) < 0 || isCompleted(id, p)) return p;
  return { completed: [...p.completed, id] };
};

export const nextLevelId = (id: string): string | null => {
  const i = levelIndex(id);
  return i >= 0 && i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/campaign/ladder.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 85 + 5 = 90).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/campaign/ladder.ts apps/cap-kickers/src/game/campaign/ladder.test.ts
git commit -m "feat(cap-kickers): campaign ladder model + progression logic

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Campaign progress persistence

**Files:**
- Create: `apps/cap-kickers/src/game/campaign/storage.ts`
- Test: `apps/cap-kickers/src/game/campaign/storage.test.ts`

**Interfaces:**
- Consumes: `CampaignProgress`, `initialProgress` from `./ladder`.
- Produces:
  - `type StorageLike = { getItem(k: string): string | null; setItem(k: string, v: string): void }`
  - `loadProgress(storage?: StorageLike | null): CampaignProgress` — parses the stored JSON; returns `initialProgress()` on missing/corrupt/blocked storage (never throws).
  - `saveProgress(p: CampaignProgress, storage?: StorageLike | null): void` — writes JSON; no-ops when storage is unavailable/full.
  - Both default `storage` to `globalThis.localStorage` (guarded).

- [ ] **Step 1: Write the failing test**

Create `apps/cap-kickers/src/game/campaign/storage.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loadProgress, saveProgress, type StorageLike } from "./storage";
import { initialProgress } from "./ladder";

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
};

describe("campaign storage", () => {
  it("round-trips progress", () => {
    const s = fakeStorage();
    saveProgress({ completed: ["l1", "l2"] }, s);
    expect(loadProgress(s)).toEqual({ completed: ["l1", "l2"] });
  });

  it("returns initial progress when nothing is stored", () => {
    expect(loadProgress(fakeStorage())).toEqual(initialProgress());
  });

  it("returns initial progress on corrupt data (no throw)", () => {
    const s = fakeStorage();
    s.map.set("capkickers.campaign.v1", "{not json");
    expect(loadProgress(s)).toEqual(initialProgress());
    s.map.set("capkickers.campaign.v1", JSON.stringify({ completed: [1, 2, 3] })); // wrong types
    expect(loadProgress(s)).toEqual(initialProgress());
  });

  it("is a no-op / safe when storage is null", () => {
    expect(loadProgress(null)).toEqual(initialProgress());
    expect(() => saveProgress({ completed: ["l1"] }, null)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/cap-kickers && bunx vitest run src/game/campaign/storage.test.ts`
Expected: FAIL — cannot resolve `./storage`.

- [ ] **Step 3: Implement**

Create `apps/cap-kickers/src/game/campaign/storage.ts`:

```ts
import { type CampaignProgress, initialProgress } from "./ladder";

export type StorageLike = {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
};

const KEY = "capkickers.campaign.v1";

const defaultStorage = (): StorageLike | null => {
  try {
    // localStorage access can throw in sandboxed/SSR contexts.
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
      return (globalThis as { localStorage: StorageLike }).localStorage;
    }
  } catch {
    /* fall through */
  }
  return null;
};

const isValid = (v: unknown): v is CampaignProgress =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as { completed?: unknown }).completed) &&
  (v as { completed: unknown[] }).completed.every((x) => typeof x === "string");

export const loadProgress = (storage: StorageLike | null = defaultStorage()): CampaignProgress => {
  if (!storage) return initialProgress();
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return initialProgress();
    const parsed: unknown = JSON.parse(raw);
    if (isValid(parsed)) return { completed: [...parsed.completed] };
  } catch {
    /* corrupt -> reset */
  }
  return initialProgress();
};

export const saveProgress = (
  p: CampaignProgress,
  storage: StorageLike | null = defaultStorage(),
): void => {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota/full/blocked -> ignore */
  }
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/cap-kickers && bunx vitest run src/game/campaign/storage.test.ts` (pass), then `cd apps/cap-kickers && bunx vitest run` (full suite — 90 + 4 = 94).

- [ ] **Step 5: Commit**

```bash
git add apps/cap-kickers/src/game/campaign/storage.ts apps/cap-kickers/src/game/campaign/storage.test.ts
git commit -m "feat(cap-kickers): campaign progress persistence (localStorage, injectable)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `/play` campaign wiring (goals + campaign params, completion)

**Goal:** `/play` can play a campaign level and record completion. Run-verified.

**Files:** Modify `apps/cap-kickers/src/routes/play.tsx`.

**Design / changes:**
- **Search schema:** add `goals: z.coerce.number().int().min(1).max(20).catch(3)` and `campaign: z.string().optional()`. Read via `Route.useSearch()`.
- **Goal target:** pass `{ match: { goalsToWin: goals }, keeperDifficulty: mode === "ai" ? difficulty : "normal" }` to `new GameSession(...)` at both construction sites (ref initializer + `handleNewMatch`). (The `MatchConfig` is `{ goalsToWin }`.)
- **On win, if `campaign` is set:** the win overlay becomes campaign-aware. Determine the winner from `match.winner` (0 = human, 1 = AI). When the report result is `"win"` (or on mount if already won):
  - If `winner === 0` (human won the level): call `saveProgress(completeLevel(campaign, loadProgress()))` **once** (guard with a ref so it records a single time), then show an overlay "Level complete!" with:
    - **Next level** (only if `nextLevelId(campaign)` is non-null): a `<Link to="/play" search={{ mode: "ai", difficulty: <next.difficulty>, goals: <next.goalsToWin>, campaign: <nextId> }}>`. (Look up the next level via `levelById(nextLevelId(campaign))`.) If it was the last level, show "Campaign complete!" and no Next.
    - **Back to campaign** → `<Link to="/campaign">`.
  - If `winner === 1` (AI won): overlay "You lost" with **Try again** (a `<Link>` re-entering the same campaign level's params) and **Back to campaign** (`/campaign`).
- **Non-campaign win** (campaign undefined): keep the existing "Player N wins!" + Rematch overlay unchanged.
- Import `completeLevel`, `nextLevelId`, `levelById` from `../game/campaign/ladder` and `loadProgress`, `saveProgress` from `../game/campaign/storage`.

**Steps:**
- [ ] **Step 1:** Implement the schema + goals threading + campaign-aware win overlay + one-time completion recording (use a `recordedRef` so a re-render doesn't double-record).
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `cd apps/cap-kickers && bunx vitest run` (94 core tests still green).
- [ ] **Step 3 (controller live-verify):** deferred to Task 4/5 verification (the campaign route + menu provide entry points). Confirm `bunx tsc` + tests here; the end-to-end campaign flow is verified once the ladder route exists.
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/play.tsx
git commit -m "feat(cap-kickers): /play campaign wiring (goals target, completion, next/retry)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Campaign ladder route

**Goal:** `/campaign` shows the ladder; unlocked levels are playable. Run-verified.

**Files:** Create `apps/cap-kickers/src/routes/campaign.tsx`.

**Design:**
- `createFileRoute("/campaign")({ component: CampaignPage })`.
- On mount, read `loadProgress()` into state (client-only; guard against SSR by reading in a `useEffect` or `useState` initializer that tolerates no-localStorage — `loadProgress()` already returns initial when unavailable).
- Render the heading "Campaign" and the `LEVELS` list. For each level compute `completed`/`unlocked`:
  - **Completed:** show a check/"Done" badge; still playable (replayable) — a `<Link to="/play" search={{ mode:"ai", difficulty: level.difficulty, goals: level.goalsToWin, campaign: level.id }}>`.
  - **Unlocked (not completed):** a primary `<Link>` "Play" with the same search.
  - **Locked:** a disabled/muted row (a 🔒 or "Locked" label; not a link).
  - Show the level `name`, difficulty, and goal target ("First to N").
- A "Back" `<Link to="/">` to the menu. Landscape-friendly; scrollable if the list overflows.

**Steps:**
- [ ] **Step 1:** Implement `campaign.tsx`.
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `bunx vitest run` (94 green).
- [ ] **Step 3 (controller live-verify):** open `/campaign`. Confirm level 1 is unlocked/playable and later levels are locked; play + win level 1 vs the Easy AI (or force it), return to campaign, confirm level 2 is now unlocked and the progress persisted across a reload. Screenshots.
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/campaign.tsx
git commit -m "feat(cap-kickers): campaign ladder route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Campaign menu entry

**Goal:** The menu links to the campaign. Run-verified.

**Files:** Modify `apps/cap-kickers/src/routes/index.tsx`.

**Steps:**
- [ ] **Step 1:** Add a primary **"Campaign"** `<Link to="/campaign">` at the top of the mode list (above Pass & Play), styled as a prominent button. Keep the other entries and the heading/description/layout.
- [ ] **Step 2:** `cd apps/cap-kickers && bunx tsc --noEmit` (clean) and `bunx vitest run` (94 green).
- [ ] **Step 3 (controller live-verify):** home shows Campaign; it navigates to `/campaign`.
- [ ] **Step 4:** Commit:

```bash
git add apps/cap-kickers/src/routes/index.tsx
git commit -m "feat(cap-kickers): add Campaign to the menu

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (design spec section 6 Campaign + build-order step 6):**
- Unlockable ladder of AI opponents, rising difficulty → Task 1 (`LEVELS` + progression). ✅
- Progress persisted (localStorage) → Task 2. ✅
- Play a level (reuses ai mode + keeper), win to unlock next → Tasks 3–4. ✅
- Campaign entry point → Tasks 4–5.
- Determinism preserved (progression is pure; storage is I/O only, injectable). ✅
- Reuses the AI + keeper (a level is an ai match with difficulty + goalsToWin) — no new game logic.

**Placeholder scan:** Tasks 1–2 carry full code/tests; Tasks 3–5 are run-verified UI with concrete schema, exact search params, and overlay/route specs.

**Type consistency:** `CampaignLevel`/`LEVELS`/`CampaignProgress`/progression fns (Task 1) consumed by `storage.ts` (Task 2), `/play` (Task 3), `/campaign` (Task 4). `Difficulty` from `ai/policy` reused. The `/play` search params (`mode`,`difficulty`,`goals`,`campaign`) are shared between `campaign.tsx` links (Task 4) and `play.tsx`'s schema (Task 3). `MatchConfig` is `{ goalsToWin }` — `goals` maps to it.

---

## Next plan

Plan 7 (Tutorial): an interactive first-run tutorial teaching select-cap → swipe → thread-the-gap → shoot (skippable, replayable), with a "seen" flag persisted like campaign progress. Then Plan 8 (shared packages + monetization + iOS + store) and the deferred visual/layout polish pass.
