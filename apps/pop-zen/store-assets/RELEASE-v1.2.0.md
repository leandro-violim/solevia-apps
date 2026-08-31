# Zen Bubbles — v1.2.0 Release Handoff (for Cowork)

Everything needed to list and submit the **1.2.0** update on the App Store and Google
Play. The code is on branch **`feat/v1.2-mega`**, built and synced to both `ios/` and
`android/`. This release was reviewed for correctness, performance, privacy, store
compliance, and battery — findings and the two **must-do** items are near the bottom.

---

## 1. Identity & versions (already set — just confirm)

| | Value |
|---|---|
| App name | **Zen Bubbles** |
| Bundle / package | `app.solevia.zenbubbles` |
| iOS version / build | **1.2.0 / 6** (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`) |
| Android versionName / versionCode | **1.2.0 / 2** |
| App Store adam id | 6797921737 |
| AdMob account | `pub-9628521678374705` (iOS app `~5486523715`, Android app `~9477972092`) |
| Developer | Sole Via Entertainment LLC (Florida) · support: hello@solevia.app |
| Availability | **US, Canada, New Zealand, Australia, India, Brazil** (same as today). None are EEA/UK, so the ads/analytics consent gating is not required for this list. |

Versions are correctly incremented over the shipped 1.0.x — no bump needed. If you
re-upload a build, bump only the build number (iOS `CURRENT_PROJECT_VERSION`, Android
`versionCode`).

---

## 2. What's in 1.2.0 (for the store description + your context)

A big content update. Headline, player-facing:

- **Two clear modes** — **Pop Challenge** (timed, goal-driven) and **Pop for Fun** (relaxed, endless).
- **Four escalating "worlds"** in Pop Challenge: World 1 classic grid → World 2 off-grid → World 3 drifting bubbles (tap the center) → World 4 sliding shields. A Candy-Crush-style intro announces each world.
- **Daily Challenge** with rotating goals, a once-a-day **Daily Bonus**, and **streaks**.
- **Coins economy + Shop**: 8 collectible **bubble styles** (4 glossy: Neon/Ocean/Sunset/Night; 4 solid candy: Gold/Pastel/Mint/Lavender — Pastel & Lavender are multi-colour), plus **power-ups**: **Bomb** and **Time Freeze**, usable mid-stage and buyable in the shop or between stages.
- **Watch-a-video** rewards to earn coins (opt-in), and a **Revive** (+time) when the clock runs out.
- **Calm background music**, a **celebratory score count-up** between stages, and **realistic per-skin bubble art** with a crinkled "popped" look.
- Lots of polish: crisp How-to-Play, readable playfield (dimmed bubble-wrap + soft bubble shadows), smoother/snappier popping on dense phases, no accidental text-selection.

Copy for the store "What's New" field (EN + PT, warm tone, no ads/version mentions):
see **`store-assets/whats-new.md`**.

---

## 3. Store listing to update

- **Screenshots** — the current App Store / Play screenshots are from 1.0 and don't
  show the new features. Capture fresh ones (device frames as before — iPhone 6.9",
  iPad 13"; Android phone) featuring: the **Shop** (skins + power-ups), a **world with
  a twist** (e.g. World 4 shields), the **daily challenge goals**, a **coloured skin**
  in play, and the **between-stage reward**. The screenshot pipeline is documented in
  the repo root `CLAUDE.md` (headless Chromium; ad banner hidden via CSS).
- **Description** — refresh to mention the modes, worlds, daily challenge, shop, and
  power-ups (see §2). Keep the calm/relaxation positioning.
- **Age rating** — still 4+/Everyone; content unchanged. Max ad content rating = G.

---

## 4. ⚠️ Must do before submitting — Cowork tasks

**A. Create the rewarded ad units, and produce a master ad-unit list.**
`apps/pop-zen/src/lib/ads.ts` still has Google's **sample/test** ids for the *rewarded*
placements (`LIVE_IDS.ios.rewarded` / `LIVE_IDS.android.rewarded` =
`ca-app-pub-3940256099942544/…`). Sample units always serve a "Test Ad," so in
production the Revive / earn-coins rewarded ads would show a **test ad to real users**
(AdMob policy risk + zero rewarded revenue).

> **Cowork:** In the AdMob console for account `pub-9628521678374705`, **create real
> Rewarded ad units** for both the **iOS** app (`~5486523715`) and the **Android** app
> (`~9477972092`). Then produce a clean, well-formatted **master document listing every
> Pop Zen (Zen Bubbles) ad unit id** — for each platform (iOS + Android) and each format
> (Banner, Interstitial, Rewarded) — with the unit name and its `ca-app-pub-…/…` id.
> Hand that list back so the two new Rewarded ids get pasted into `ads.ts` (a
> `// TODO(admob): paste real rewarded unit id` marker is already at each spot).
> Confirm the existing banner/interstitial live ids in the file still match the console.

**B. Complete the store privacy declarations, then do your own compliance pass.**
This version added **Google Analytics for Firebase** (anonymous gameplay/usage events).
The in-app Privacy Policy is already updated in code (discloses analytics + the Settings
opt-out). The **store-side** declarations still need updating:
- **iOS App Privacy label (App Store Connect)** — add **Usage Data → Product Interaction / Analytics** (alongside the existing AdMob advertising data). Not linked to identity; not used for tracking.
- **Android Data Safety form (Play Console)** — add **App activity / Analytics** and the analytics identifier, on top of the AdMob Advertising ID already declared.
- If the hosted privacy page (solevia.app) mirrors the in-app policy, update it too. `app-ads.txt` is unchanged.

> **Cowork:** Please treat the two lists above as the known minimum, then do your **own
> final compliance review** of both stores' current requirements (App Store Review
> Guidelines + App Privacy; Google Play Data Safety, Ads, Families/Target-audience,
> and the DSA trader status for the target countries) and **add anything else you
> believe the stores now require** on top of what's here. Flag any gap back to Leandro
> before submitting.

---

## 5. Decisions — RESOLVED (recorded here for the file)

1. **Availability** = US, Canada, New Zealand, Australia, India, Brazil (unchanged).
   None are EEA/UK, so analytics/ads run with the in-app opt-out and ATT/UMP as today;
   no consent-gating code change is needed for this country list. (If the list ever
   adds an EEA/UK country, analytics must first be gated behind UMP consent.)
2. **App size** — **keep the ~2.3 MB near-lossless skin art as-is** (lazy-loaded, no
   launch cost, best quality / no iOS banding). No change.
3. **Per-world best scores** — **DONE in this release.** Records are now keyed per stage,
   so each of the four worlds tracks its own best score/time, and the Records screen is
   grouped by world (World 1–4, each with its 8 phases).
4. **Android `allowBackup = true`** — **keep it.** This lets Android auto-back-up the
   local game data (coins, streak, owned skins, inventory) to the player's own Google
   Drive, so progress restores after a reinstall or a new phone. No personal info is in
   that data — only game state — so leaving it on is the player-friendly choice. (Set it
   to `false` only if you specifically want progress to be lost on uninstall.)

---

## 6. Verified clean (no action needed)

Consent flow (UMP → ATT, only where required), `Info.plist` (ATT string, encryption
exempt, portrait-only iPad valid, SKAdNetwork list), `PrivacyInfo.xcprivacy`, TEST↔LIVE
ad switching (release ships LIVE), no unexpected network (fully offline except
Google ads/analytics), no PII in local storage, **no dev/cheat helpers in production**
(they're `import.meta.env.DEV`-gated), i18n EN/PT at exact parity (167 keys each),
memoization holds under dense phases, no timer/listener/rAF leaks, audio hard-stops on
minimize. Correctness review found **no launch blockers**; the handful of low-severity
edge cases it surfaced were fixed in this release (double-tap finish guard, timeup race,
world-ad cap) or are noted in Decisions.

---

## 7. Build & submit (reference)

- **iOS:** open `apps/pop-zen/ios/App/App.xcodeproj` (SPM project, no .xcworkspace) →
  Product ▸ Archive ▸ Distribute ▸ App Store Connect ▸ Upload. Native-only changes
  don't need a web rebuild; if web code changed, run `bun run build:mobile` +
  `bunx cap sync ios` first. The GoogleMobileAds dSYM upload warning is harmless.
- **Android:** `bun run build:mobile` + `bunx cap sync android`, then build the signed
  AAB (Play App Signing) and upload as a new release (versionCode 2).
- **Post-approval:** confirm `app-ads.txt` is live on solevia.app and the AdMob app is
  linked to the store listing so live ads serve.
