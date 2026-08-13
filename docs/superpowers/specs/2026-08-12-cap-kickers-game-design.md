# Cap Kickers — Design Spec

**Date:** 2026-08-12
**App:** `apps/cap-kickers` (Solevia game #2, renames the `app-two` placeholder)
**Bundle id (proposed):** `app.solevia.capkickers`
**Status:** Design approved; ready for implementation planning.

---

## 1. Concept

A physics flick-soccer game based on the Brazilian schoolyard classic *Futebol de
Tampinhas*. The player flicks bottle caps across a landscape pitch; **each flick must
pass between the other two caps** ("thread the gap"); the player has **4 touches** per
turn to advance and must **shoot on the 4th**. Play **solo vs AI** or **two players on
one phone** (hotseat). Casual, physical, skill-based feel.

### Authoritative rules (source of the mechanic)

Classic *Futebol de Tampinhas* (confirmed against Brazilian school sources and the
reference video the user provided):

- 3 identical caps start in a **triangle** in front of the attacker's own goal.
- The attacker moves the caps with flicks (*petelecos*). **The flicked cap must always
  pass through the middle of the other two caps.**
- Up to **4 touches per turn**; on the **4th touch the player must attempt the goal**.
- The player **loses the turn** if the flicked cap fails to pass between the other two,
  **or** any cap leaves the pitch.
- On a lost turn, the opponent restarts with a fresh triangle in front of their own goal.
- **Objective:** score more goals than the opponent.

Reference sources: Colégio Pedro II, Colégio Benjamin, Museu do Futebol; online reference
implementation at coquinhos.com.

---

## 2. Confirmed design decisions

| Area | Decision |
|------|----------|
| Pieces / scoring | **3 identical caps** (classic). On the shooting touch the struck cap acts as "the ball" at goal. |
| Touches per turn | **4 touches**, must shoot on the 4th. |
| Goalkeeper | **AI moving keeper**, slides along the goal line. **Always AI, in both solo and 2-player.** |
| Win condition | **First to N goals** (N selectable, default 3). |
| Modes | **Solo vs AI** + **2-player hotseat** (rotate the phone). |
| Field | **Landscape**, full pitch, two goals. Orientation locked landscape. |
| Input | **Swipe to flick** (select cap → swipe for direction + power), with a subtle live aim/power hint. |
| v1 content | **Campaign** (unlockable AI ladder, ramping difficulty) + **Quick Match** + **2-player hotseat**. |
| AI difficulty | **Easy / Normal / Hard**. |
| Tutorial | **Interactive first-run tutorial** (skippable). |
| Rendering/physics | **Option A**: single `<canvas>` + lightweight custom deterministic physics. |

### Explicitly out of scope for v1 (YAGNI)

- Online / networked multiplayer.
- Separate tournament bracket (the campaign ladder is the progression).
- Rewarded-ad "retry level" (tempting v2 add).
- A visually distinct ball puck (mechanically it stays 3 caps; can be themed later).

---

## 3. Architecture & repo placement

- New app **`apps/cap-kickers`**, replacing the `app-two` placeholder, using the same
  shell as PopZen: React 19 + TanStack Start/Router + Vite + Tailwind v4 + Capacitor
  (WKWebView → native iOS), bun, Vitest.
- **Build out the shared packages** (currently skeleton READMEs) as part of this work:
  - `@solevia/ads` — lift PopZen's AdMob logic (banner, interstitial, test/live switch,
    frequency caps) into the shared package; both games consume it.
  - `@solevia/consent` — ATT + GDPR/UMP flow (already has real code; generalize for reuse).
  - `@solevia/analytics` — events + attribution.
  - `@solevia/ui` — shared menu chrome / buttons.
- Reuse PopZen's native plumbing patterns verbatim where possible: `PrivacyInfo.xcprivacy`
  (`NSPrivacyTracking=false` + empty domains), `Info.plist`
  (`ITSAppUsesNonExemptEncryption=false`, `NSUserTrackingUsageDescription`,
  `UIRequiresFullScreen`), AdMob config, and the headless-screenshot approach (re-shot in
  **landscape** for this app). Same AdMob account (`pub-9628521678374705`); **new ad units**.

---

## 4. Physics engine (Option A)

A single `<canvas>` game route driven by `requestAnimationFrame`.

- **`PhysicsWorld`**: circles (caps) with position + velocity; **fixed 60Hz timestep
  accumulator** decoupled from screen refresh (correct on 60Hz and 120Hz ProMotion alike);
  friction decay; **circle-circle elastic collisions with sub-stepping** so fast flicks
  never tunnel through another cap; pitch-wall bounds; `devicePixelRatio` scaling for crisp
  rendering; landscape safe-area insets (notch on the side, home indicator).
- **Deterministic**: identical inputs → identical outcome on every device. This is the key
  property — it enables both reproducible tests and a simulation-based AI.

### Gap-crossing rule (precise definition)

At the moment of a flick, record the line **segment joining the centers of the other two
caps**. The flick is **valid if the moving cap's center path crosses that segment** at any
point during its travel (until it comes to rest). Physical collisions still occur normally —
threading the gap and colliding with a cap are not mutually exclusive.

### Goal & keeper

- Each goal is an interval on a pitch end line. A **goal** is scored when a cap crosses the
  goal line within the goal interval (and, on the shooting touch, the shot was legal).
- The **keeper** is a constrained body sliding along the goal line, moved by the keeper AI.

---

## 5. Input & feel

- **Select cap → swipe to flick.** Tap one of the attacker's three caps to arm it; swipe to
  set direction and power. Swipe velocity/length maps to launch velocity, clamped to a max.
- **Live aim/power hint**: a short arrow + power tint appears while the finger moves, so the
  outcome is readable and skill beats luck. Still a swipe, not a slingshot.
- **Haptics** (Capacitor Haptics) on flick, collision, and goal.
- **Sound** reusing PopZen's audio-unlock pattern (flick, collision, goal, crowd cheer).

---

## 6. Game modes

- **Campaign** — an unlockable ladder of AI opponents; difficulty ramps across the ladder.
  Progress persisted in localStorage (following PopZen's `records` pattern).
- **Quick Match** — vs AI; player picks difficulty and N goals.
- **2-Player hotseat** — same phone. Between turns, a **"Pass the phone" transition** flips
  the board 180° so the new attacker always attacks away from themselves. Keeper is AI on
  both sides.

---

## 7. AI

- **Attacker AI** exploits determinism: it **simulates a spread of candidate flicks**
  (cap × direction × power), scores each on legality (threads the gap), advancement toward
  the target goal, and shot setup, then picks the best. Difficulty scales search breadth and
  adds aim noise.
- **Keeper AI** slides along the goal line to intercept the incoming cap; difficulty scales
  reaction delay and maximum keeper speed.
- **Easy / Normal / Hard** tune both attacker and keeper.

---

## 8. Module breakdown (isolated, testable units)

- `physics/` — `PhysicsWorld`, bodies, collision + friction integration. No game rules.
- `rules/` — match state machine (turn, 4-touch counter, shot enforcement, scoring, turn
  loss, kickoff) + gap-crossing geometry. No rendering.
- `ai/` — attacker planner (simulation rollouts) + keeper controller. Consumes `physics` +
  `rules`.
- `input/` — swipe capture → flick vector; cap selection.
- `render/` — canvas drawing of pitch, caps, goals, keeper, aim hint. Pure view of state.
- `campaign/` — ladder definition, unlock state, persistence.
- `modes/` — solo and hotseat orchestration (incl. pass-the-phone flip).
- Shared: `@solevia/{ads,consent,analytics,ui}`.

Each unit has one responsibility and a clean interface; internals can change without
breaking consumers.

---

## 9. Screens (TanStack routes)

Home · Play (canvas game) · Campaign ladder · Quick Match setup · Settings · Records/Stats ·
How-to + first-run **interactive tutorial** (guided select → swipe → thread → shoot) ·
About / Privacy / Terms (reused from PopZen). **Orientation locked landscape.**

---

## 10. Monetization & consent

Delivered through the shared packages:

- **Banner** on menu screens.
- **Interstitial** between matches / campaign levels, **frequency-capped**.
- Consent / ATT / UMP via `@solevia/consent`.
- Test-vs-live ads automatic (as in PopZen: `DEV || VITE_USE_TEST_ADS`), new live ad-unit IDs.

---

## 11. Testing (Vitest)

- Gap-crossing geometry: threading, near-miss, contact-but-threaded, out-of-bounds cases.
- Physics: collision response, friction to rest, no tunneling on max-power flicks.
- Rules state machine: turn loss conditions, 4-touch shot enforcement, scoring, kickoff.
- **Golden-replay tests**: recorded input sequence → expected final world/match state.
- AI decisions are testable because the simulation is deterministic.

---

## 12. Suggested build order (ships as one v1, built in this sequence)

1. `physics` engine (deterministic core) + tests.
2. `rules` state machine + gap-crossing geometry + tests.
3. `input` + `render` → a playable single-flick loop on canvas.
4. **2-player hotseat** (proves the full match loop with humans first).
5. **AI** attacker + keeper, with Easy/Normal/Hard.
6. **Campaign** ladder + persistence.
7. **Interactive tutorial**.
8. Shared packages (`ads`, `consent`, `analytics`, `ui`) + monetization + native/iOS + store assets.

---

## 13. Open items

- **Name & bundle id**: proposed **"Cap Kickers"** / `app.solevia.capkickers` — confirm or
  rename before app scaffolding.
- Landscape App Store screenshots + preview to be produced (PopZen's were portrait).
