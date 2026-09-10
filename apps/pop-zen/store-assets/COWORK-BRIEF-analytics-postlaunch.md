# Cowork — what to check in GA4 after v1.3 ships (Zen Bubbles, `p552089130`)

Read this ~1 week after the v1.3 update is live and has traffic. Goal: judge whether
the revamp + new features worked, using the baseline we already have.

## Baseline to beat (pre-v1.3, from your setup pass)
Onboarding & progression funnel: **517 open → 356 run started (69%) → 214 phase cleared (41%)**.
Treat this as the "before" number — small sample, old build, so it's a comparison point,
not a verdict.

## 1. Did the Home / journey revamp lift the entry funnel? (top priority)
- Re-open the **Onboarding & progression funnel** and compare **open → run_started**.
  Hypothesis: the new Home + journey map + clearer Play button should raise the 69%.
- Segment by `app_language` (pt / es / en) — the LatAm audience is the launch focus.

## 2. Phase-1 drop-off: quitting vs losing? (highest-value diagnosis)
The baseline shows ~40% of players who START never clear even phase 1. Phase 1 is 10
bubbles in 13s, so that's more likely *leaving* than *losing*. Split it:
- Compare, among runs that started, counts of `run_abandoned {reason}` (`nav` = left via
  a button, `background` = app backgrounded) vs `time_up {phase=1}`.
- If **abandoned ≫ time_up** → it's attention/UX (people bail, not fail) → a product fix.
- If **time_up is large** → phase 1 timing/difficulty is the culprit → a tuning fix.
- Also look at `phase_start` → `phase_cleared` for `phase=1` specifically.

## 3. Do the two new v1.3 features earn their keep?
Build one small funnel / table for each (needs the 4 Pop Challenge dims registered — see
the analytics follow-up note):
- **Equip:** rate of `phase_equipped` per run; distribution of `bombs` / `freeze`; and
  `boost=1` share (rewarded-ad uptake at the equip popup). Low usage → the popup isn't
  landing; high `boost` → the free-boost ad is popular.
- **Pop Challenge:** `challenge_started` → `challenge_completed`, split by `success` and
  `reward_kind`. Key question: do players who complete a challenge come back / spend more?
  Cross-check with a return-visit or `coins_spent` view. This is the comeback-booster bet.

## 4. Ad reliability (especially right after Android goes live)
Dashboard `ad_no_fill` vs `ad_failed` by `format` (`banner` / `interstitial` / `rewarded`).
Android serves *limited* until AdMob's readiness review clears, so expect `ad_no_fill`
early — this view separates "expected, temporary" from "actually broken."

## 5. Housekeeping while you're in there
- Star `world_completed` and `first_run_completed` as key events once they appear under
  **Events → Recent events** (they need a post-update player to trigger them).
- Confirm `mission_kind` / `reward_kind` / `reward_amount` / `success` dimensions are
  registered and populating (from the follow-up note).
- Sanity-check the AdMob↔Firebase link so ad-revenue shows once the app is live.

## Leave as-is
- Google signals OFF (owner's call; LGPD/GDPR + Brazil launch).
- `(not set)` on older rows — dimensions aren't retroactive; ignore, it self-heals.
