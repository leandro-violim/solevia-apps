# Zen Bubbles v1.3 — Shipping handoff (Claude Code → Cowork / Leandro)

**Branch:** `feat/pop-zen-1.3` (all work pushed to origin). **App:** `app.solevia.zenbubbles`.
**Status:** Code complete, QA'd, versioned to **1.3.0**, native projects synced, **Android
signed AAB built**. Ready for store submission pending the human/console steps below.

This doc is the source of truth for shipping v1.3. It lists (A) what v1.3 contains,
(B) exactly what Claude Code already did, and (C) what Cowork / Leandro still need to do
(consoles + Xcode + LatAm), with detailed steps.

---

## A. What's in v1.3 ("Project C") — full changelog

Visual overhaul
- New game-style shell + Home screen; realistic clay/3D bubbles; **clearer/more
  transparent gameplay bubbles** (0.40 opacity so the wrap shows through).
- Photoreal, seamless **bubble-wrap gameplay background** (native-sharp encoded).
- **"Your journey" map**: 4 island worlds, **pads removed** (cleaner) with a **code-drawn
  rope** through the level markers, **oval node sprites** (locked/done/current) sized to
  each node, and a **code-rendered portal** (full-colour, movable) at the end of World 1.
- Mascot **hops** node→node between phases; **sad mascot** on Time's Up / Run Complete;
  Home mascot **jumps** when tapped.

Gameplay / features
- **Equip power-ups per phase** ("Gear up" popup): buy bombs/snowflakes with coins (price
  shown, deducted live; **cancel refunds**) or use ones you own; **+1** free boost via
  rewarded ad. Only equipped power-ups appear on the board (no random specials).
- **Pop Challenge** (3-hour comeback booster): random mission + random reward (coins/bombs/
  snowflakes), reward popup → interstitial; Home tile shows a live `H:MM:SS` cooldown.
- **Snowflake** bubble pauses the countdown 2s.
- **Revive** reliability fixed (watched ad always grants +15s) + **tap-to-continue** after
  a revive (timer paused until you tap). **End run** never shows an ad → straight to Run
  Complete (sad mascot). **Run Complete** has Try Again (same phase) / View Records / Back
  Home as real buttons.
- Prices **+75%** (economy rebalance).

Localization / a11y / battery
- Full **EN / ES / PT** coverage + in-app **language switcher** in Settings.
- Aurora background pauses under prefers-reduced-motion; audio session recovers after ads.

Ads / compliance
- AdMob **"ads obscuring content" fix** (banner never overlaps UI; hidden on full-screen
  routes).

Analytics
- GA4 (`G-0MY4L3KEDF`, property `p552089130`) screen-view + progression funnel,
  monetization, ad-reliability, onboarding, user properties. See `EVENTS.md`.

---

## B. What Claude Code already did (this session)

- Implemented/verified all of the above; **tsc + eslint + 39 unit tests pass**.
- Pre-ship audits (performance/memory/leaks + store-compliance) — fixed the findings
  (equip refund-on-cancel currency bug, map tap-propagation + pan-rAF cleanup, WorldIntro
  memo, achievement-toast timer, reduced-motion aurora).
- **Versioned to 1.3.0:** Android `versionCode 3` / `versionName 1.3.0`; iOS
  `MARKETING_VERSION 1.3.0` / `CURRENT_PROJECT_VERSION 7`.
- **App icon v2** (finger + bubble-wrap on the Home sunset gradient) swapped in;
  regenerated ALL iOS/Android icon sizes with `@capacitor/assets`.
- `bun run build:mobile` + `npx cap sync ios android` done (native projects up to date).
- **Built + signed the Android release AAB** with the upload key:
  `ZenBubbles-1.3.0-vc3-release.aab` (versionName 1.3.0, versionCode 3, ~18 MB) — sent to
  Leandro. (Rebuild anytime with: `cd apps/pop-zen/android && ./gradlew :app:bundleRelease`.)
- Browser-QA'd every mode: Zen, Time-Attack (clear → journey advance → Play), Pop
  Challenge, revive/resume, end-run/finish, equip buy/refund, new-user gating.

Native config verified OK (no blockers): AdMob app IDs + live ad units, ATT usage string +
UMP/ATT flow, SKAdNetwork list, PrivacyInfo (NSPrivacyTracking=false is intentional),
Android AD_ID permission, `android:exported`, targetSdk 36. Details in the audit notes.

---

## C. What Cowork / Leandro still need to do

### C1. VERIFY VERSION NUMBERS before uploading (do first)
- **Android:** confirm in Play Console that the highest versionCode ever uploaded is **< 3**
  (docs say last shipped was 1). If a `2` was ever uploaded, `3` is still fine. If `3+`
  exists, bump `android/app/build.gradle` `versionCode` and rebuild the AAB.
- **iOS:** confirm in App Store Connect that build **7** of **1.3.0** is unique / higher
  than anything uploaded for 1.3.0. If not, bump `CURRENT_PROJECT_VERSION` in
  `ios/App/App.xcodeproj/project.pbxproj`.
- Note: the earlier iOS pipeline mentioned 1.0.1/1.0.2/1.1.0. v1.3.0 supersedes them —
  confirm you're OK jumping the marketing version to 1.3.0.

### C2. Android — upload (Claude Code already built the AAB)
1. Verify versionCode (C1).
2. Play Console → Zen Bubbles → Production → Create new release → upload
   `ZenBubbles-1.3.0-vc3-release.aab` (Play App Signing is on; it's signed with the UPLOAD
   key — correct).
3. Add release notes (see C7), review, roll out.
   - Managed publishing is OFF → it auto-publishes on approval (same as v1.0).
   - The AAB grew to ~18 MB (photoreal art) — still well under limits.

### C3. iOS — archive & upload (needs Leandro's Mac + Xcode; Claude Code can't drive Xcode)
Detailed steps for Leandro:
1. `cd apps/pop-zen && bun run build:mobile && npx cap sync ios` (already done this session,
   but re-run if you pull new web changes).
2. Open **`apps/pop-zen/ios/App/App.xcodeproj`** in Xcode (SPM project — there is NO
   `.xcworkspace`).
3. Confirm target **App**: General → Version = **1.3.0**, Build = **7** (already set).
   Signing & Capabilities → your team, automatic signing.
4. Select destination **Any iOS Device (arm64)**.
5. **Product ▸ Archive**. When it finishes, in the Organizer: **Distribute App ▸ App Store
   Connect ▸ Upload**. Accept defaults; the "Upload Symbols" / GoogleMobileAds dSYM warning
   is harmless.
6. In App Store Connect: attach build 7 to a new **1.3.0** version, fill "What's New"
   (C7), and submit for review.

### C4. Store console policy actions (Cowork can drive via browser)
- **iOS App Privacy label (ASC):** v1.3 added first-party GA4 analytics. Update the App
  Privacy "nutrition label" so *Analytics / Product Interaction* data collection is
  declared (in addition to the existing Ads/IDFA declarations). Required by Apple.
- **AdMob console:** set **max ad content rating = G** (matches the 4+/Everyone rating) so
  served ads match the audience.
- **AdMob UMP:** ensure a GDPR/consent message exists before enabling any consent-required
  region (see LatAm note — mostly not required in LatAm, but Brazil LGPD is handled by the
  in-app UMP/ATT flow already).

### C5. LatAm publishing follow-through (already built in code — needs console rollout)
The app is **fully ready for LatAm**: Spanish + Portuguese in-app, device-language auto-
select + a manual language switcher, and the UMP/ATT consent flow is wired
(`packages/consent`). To actually publish in LatAm:
- **Android (Play Console → Countries/regions):** add the LatAm markets (e.g. Mexico,
  Argentina, Colombia, Chile, Peru, Uruguay, + others; Brazil is already live). No code
  change needed.
- **iOS (ASC → Availability):** iOS currently ships **US-only** (chosen to avoid the EU DSA
  trader-status requirement). Expanding to LatAm (non-EU) does **not** trigger EU DSA —
  safe to add the LatAm countries. Confirm the Paid Apps/tax agreements cover them (free
  app, so minimal).
- Optional polish: add **pt-BR** and **es-419** *store-listing pages* (screenshots +
  description) in each console. The app UI is already localized regardless of the listing
  language.
- Keep AdMob's max-ad-content-rating = G and confirm ad fill in the new regions after
  going live.

### C6. Post-approval TODO (once v1.3 is live) — carried over, still relevant
- Ensure `app-ads.txt` is served at `https://solevia.app/app-ads.txt`
  (`google.com, pub-9628521678374705, DIRECT, f08c47fec0942fa0`) — in the solevia-web repo.
- AdMob → each app → **Link to store** so ad serving goes from limited → full (Android had
  this pending after v1.0; confirm it's done for both platforms).

### C7. Suggested "What's New" (v1.3)
> A big update! ✨ A brand-new look, a world-map journey with 4 islands, and a new Pop
> Challenge that drops in every few hours with surprise rewards. Gear up each level with
> bombs and snowflakes, play in English, Spanish or Portuguese, and enjoy smoother, calmer
> bubble-popping. Thanks for playing!

---

## Open art item (non-blocking)
None outstanding — the icon v2 and clean islands are all delivered and wired.

## Branch / merge
Everything is on `feat/pop-zen-1.3`. Recommended: merge to `main` (and reconcile the
Android release lineage) as part of tagging the v1.3 release, so the shipped artifacts trace
to a tagged commit. The AAB above was built from `feat/pop-zen-1.3`.
