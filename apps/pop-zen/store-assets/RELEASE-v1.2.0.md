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
| Availability | **US-only** today (keep US-only unless we consciously expand — see Decisions) |

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

## 4. ⚠️ Must do before submitting (2 items)

**A. Replace the placeholder rewarded ad unit IDs.**
`apps/pop-zen/src/lib/ads.ts` — `LIVE_IDS.ios.rewarded` and `LIVE_IDS.android.rewarded`
are still Google's **sample/test** unit ids (`ca-app-pub-3940256099942544/…`). Google
sample units always serve a "Test Ad," so in production every rewarded placement
(Revive, earn-coins) would show a **test ad to real users** — an AdMob policy risk and
zero rewarded revenue. **Create real rewarded units** in the AdMob console for both the
iOS and Android app, then paste the two ids into `ads.ts` and rebuild. (Banner and
interstitial LIVE ids are already real — only rewarded is affected.)

**B. Update the privacy disclosures for the new analytics.**
This version added **Google Analytics for Firebase** (anonymous gameplay/usage events).
The in-app Privacy Policy is already updated in code (discloses it + the Settings
opt-out). You still need to update the **store-side** declarations:
- **iOS App Privacy label (App Store Connect)** — add **Usage Data → Product Interaction / Analytics** (in addition to the existing AdMob advertising data). Not linked to identity; not used for tracking.
- **Android Data Safety form (Play Console)** — add **App activity / Analytics** and the analytics identifier, on top of the AdMob Advertising ID already declared.
- If the hosted privacy page (solevia.app) mirrors the in-app policy, update it too. `app-ads.txt` is unchanged.

---

## 5. Decisions for Leandro (not blockers — your call)

1. **Keep US-only, or expand?** Analytics currently initializes without gating on the
   consent prompt. That's fine for the US launch, but before shipping to the **EEA/UK**
   we should gate analytics behind the UMP consent signal (and the EU DSA trader-status
   requirement kicks in). Recommendation: **stay US-only for 1.2.0**, expand in a later
   pass once analytics-consent gating is added.
2. **App size (~5 MB).** The equipped-skin bubble art is ~2.3 MB (near-lossless WebP,
   kept lossless to avoid iOS gradient banding). It's **lazy-loaded** (only the equipped
   skin downloads; default "Classic" doesn't touch it), so no launch cost. Leave as-is
   for quality, or I can trim to ~256px lossy (~0.5 MB) and re-verify banding on device.
3. **Worlds 2–4 "best score".** Per-phase records are aggregated across worlds, so the
   harder worlds rarely register a new "best" (World 1 usually holds it). Intentional,
   but if you'd rather each world track its own best, I can key records per stage.
4. **Android `allowBackup`** is `true` (cloud-backs-up coins/streak; no PII). Fine, or
   set `false` if you'd prefer local-only.

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
