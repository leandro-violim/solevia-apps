# Zen Bubbles — Analytics review & upgrade plan (v1.3)

Goal: measure how users navigate the app, where they drop off, and how far they get in the phases — and add anything else that helps understand the user journey.

## How your analytics is actually set up (important context)
- The app logs via the **Firebase JS (web) SDK** — `firebaseConfig` is a **web** app (`appId …:web:…`, `measurementId G-0MY4L3KEDF`, project `zen-bubbles-a0a14`). There is **no native Firebase** (no `google-services.json` / `GoogleService-Info.plist`).
- Consequence 1 — **You analyze this in GA4, not the Firebase console.** A web data stream reports to GA4 (analytics.google.com). The Firebase console "Analytics" tab shows an "add an app" state because no *mobile* app is registered — that's expected, not a bug. Use **analytics.google.com → property for G-0MY4L3KEDF** (and its **DebugView** for QA).
- Consequence 2 — **No automatic screen tracking.** The web SDK does not auto-log meaningful screens in a single-page app, and there's no native SDK to do it. So today **navigation is essentially not measured** — the #1 thing you asked for.
- Consequence 3 — **Event parameters are not usable in reports until registered as GA4 custom dimensions.** You currently log useful params (`mode`, `phase`, `difficulty`, `placement`, `item_id`, …) but until each is registered as a **custom dimension** in GA4, you can't break events down by them — including "phase_cleared by phase," which is exactly "how far they go."

## What you already have (good base — ~28 events)
`game_ready`, `run_start{mode,difficulty,phase_start}`, `phase_cleared{mode,phase,time_left_s}`, `time_up{mode,phase}`, `revive_used{mode,phase}`, `combo_milestone`, `special_bubble_popped`, `mode_selected`, `skin_unlocked/equipped`, `consumable_bought/used/granted`, `achievement_unlocked`, `objective_completed`, `streak_milestone`, `daily_bonus_shown/claimed`, `daily_challenge_played`, `ad_interstitial_shown`, `rewarded_offered/watched/skipped`, `coins_earned/spent`, `setting_changed`. Opt-out (LGPD/GDPR) is correctly wired.

## Gaps (prioritized)

### P0 — needed to answer your questions
1. **No `screen_view`/navigation events.** Add a `screen_view {screen_name, previous_screen}` on every route change (home, map, play, finish, shop, settings, records, achievements, about, privacy, terms). This unlocks navigation Path/Funnel analysis.
2. **Register GA4 custom dimensions** for the params you care about — otherwise nothing above is sliceable.
3. **Phase/World progression depth.** Add a per-phase `phase_start {mode, world, phase}` (today `run_start` only fires at run entry, so you can't see drop-off *between* phases), add `world` to `phase_cleared`/`time_up`, and add `world_completed {world}` and `portal_used {from_world,to_world}` for the new v1.3 map. Set a **`max_phase_reached` / `max_world_reached` user property** so you can segment "how far players ever got."
4. **Run abandonment.** `run_abandoned {mode, world, phase, reason}` when a player leaves Play without finishing (navigates away / backgrounds mid-run). This is where you'll see the real drop-off.

### P1 — strong journey/funnel value
5. **Onboarding / first-time funnel:** `tutorial_shown` / `tutorial_completed` (How-to-play), `first_pop`, `first_run_completed`. (`first_open`/`session_start` are auto in GA4.)
6. **Monetization funnel:** `shop_item_viewed {item_id,rarity,price}`, `purchase_blocked_insufficient_coins {item_id, short_by}` (signals pricing pain / future IAP), and confirm the real reward path — `rewarded_watched` currently logs `simulated:true`, so verify it fires on the **actual** completion callback, not a stub.
7. **Ad reliability:** `ad_banner_shown`, `ad_failed {format, reason}` / `ad_no_fill {format}` — to separate "policy/no-fill" from "shown," relevant right after the AdMob fix.
8. **User properties for segmentation:** `app_language` (pt/es/en — important for the LatAm launch), `highest_world`, `total_runs_bucket`, `is_spender`.

### P2 — nice to have
9. `pause_opened`, `resume`, `share_tapped` (if/when share exists), `rate_prompt_shown`, `notification_opt_in`.
10. `app_error {where, code}` for quality (e.g., asset/ad load failures).

## GA4 console setup (do these once, in analytics.google.com → property G-0MY4L3KEDF)
1. **Admin → Custom definitions → Create custom dimensions** (event-scoped) for: `screen_name`, `previous_screen`, `mode`, `difficulty`, `world`, `phase`, `phase_start`, `placement`, `item_id`, `rarity`, `source`, `sink`, `reason`, `objective_id`, `achievement_id`, `milestone`, `type`, `day_count`. (User-scoped) for: `app_language`, `highest_world`, `is_spender`. *(≤50 event-scoped, ≤25 user-scoped — you're well under.)*
2. **Admin → Events → Mark as key event (conversion):** `run_start`, `phase_cleared`, `world_completed`, `rewarded_watched`, `daily_bonus_claimed`, `skin_unlocked`. (Add `first_run_completed` once added.)
3. **Admin → Data settings → Data retention → 14 months** (default is 2 months; without this your exploration history is short).
4. **Explore → build these:**
   - *Navigation:* Path exploration on `screen_view` / `screen_name` (see where users go and bounce).
   - *Progression:* Funnel exploration: `phase_start` phase=1 → phase=2 → … (open funnel) to see exactly where they stop. Also a free-form table: `phase_cleared` count by `world` × `phase`.
   - *Onboarding:* Funnel: `first_open` → `screen_view(home)` → `run_start` → `first_run_completed`.
   - *Monetization:* Funnel: `screen_view(shop)` → `shop_item_viewed` → `coins_spent` / `skin_unlocked`; and `rewarded_offered` → `rewarded_watched`.
5. Turn on **Google signals** (optional, for demographics/cross-device) and confirm the AdMob↔Firebase link so ad revenue shows in GA4.

## Verify it's actually flowing
Use **GA4 DebugView** with a debug build (the web SDK: append `?firebase_analytics_debug=true` or use the GA Debug flag) and confirm `screen_view` + the new events land with their params. Given only ~61 users so far, low counts are expected — correctness matters more than volume right now.

---

## Copy-paste prompt for Code

> **Task: upgrade Firebase/GA4 analytics for the v1.3 user-journey (Pop Zen, `apps/pop-zen`).** Keep the existing `track()` helper (fire-and-forget, opt-out aware). Add events + user properties below; don't remove existing ones. Keep everything no-throw on hot paths.
>
> 1. **Screen tracking.** Add a `logScreenView(name)` that calls `track("screen_view", { screen_name: name, previous_screen: <last> })` and remembers the last screen. Fire it on every TanStack Router navigation — subscribe to the router (`router.subscribe('onResolved', …)`) in `__root.tsx`, mapping each route to a stable `screen_name`: `home, map, play, finish, shop, settings, records, achievements, about, privacy, terms`. Fire once per navigation (dedupe identical consecutive).
> 2. **Progression.** In `play.tsx`, add `track("phase_start", { mode, world, phase })` when each phase begins (not only run start). Add `world` to the existing `phase_cleared` and `time_up` payloads (derive world from phase). In `map.tsx`, add `track("world_completed", { world })` when the last phase of a world is cleared, and `track("portal_used", { from_world, to_world })` when the portal advances a world.
> 3. **Abandonment.** Fire `track("run_abandoned", { mode, world, phase, reason })` when the player leaves an in-progress run — on route change away from `/play` before finish, and on `visibilitychange`→hidden / `pagehide` during a run (`reason: "nav" | "background"`).
> 4. **Onboarding.** `track("tutorial_shown")` / `track("tutorial_completed")` in the How-to-play flow; `track("first_pop")` the first time a bubble is popped ever (guard with a localStorage flag); `track("first_run_completed")` on the first finish ever (localStorage flag).
> 5. **Monetization.** In `shop.tsx`: `track("shop_item_viewed", { item_id, rarity, price })` when an item is focused/opened, and `track("purchase_blocked_insufficient_coins", { item_id, short_by })` when a buy is attempted without enough coins. Verify `rewarded_watched` fires on the **real** AdMob reward callback (remove/replace the `simulated:true` stub).
> 6. **Ads reliability.** `track("ad_banner_shown")` on first banner show; `track("ad_failed", { format, reason })` on load/show failure and `ad_no_fill` where distinguishable (`ads.ts`).
> 7. **User properties.** Add a `setUserProps(props)` wrapper over Firebase `setUserProperties` and set: `app_language` (pt/es/en) at startup; `highest_world` / `highest_phase` whenever a new max is reached; `is_spender` first time coins are spent on a purchase. (These persist across sessions in GA4.)
> 8. Keep param names snake_case and stable (they'll be registered as GA4 custom dimensions). Add a short `EVENTS.md` in the app documenting the full event list + params. Tests green.
>
> Do not change the consent/opt-out behavior or the Firebase config.

After Code ships this, I (or you) register the custom dimensions + key events + explorations in GA4 per the section above, and validate in DebugView.
