# Cap Kickers — Release notes: v1.0 (build 2 / versionCode 2)

**App:** Cap Kickers — bottle-cap finger-flick soccer
**Bundle:** `app.solevia.capkickers` · **Studio:** Sole Via Entertainment LLC
**Branch/commit:** `cap-kickers` @ `51346c1`
**Version:** 1.0 · **iOS build 2** · **Android versionCode 2** (marketing version stays 1.0 — this is the debut store release; only the build number was bumped so re-uploads get a unique code)
**AdMob:** `pub-9628521678374705` (live units in `src/lib/ads.ts`) · **Firebase/GA4:** project `cap-kickers`, property `552486617`

---

## Build artifacts (ready now)
- **Android AAB:** `apps/cap-kickers/android/app/build/outputs/bundle/release/app-release.aab` — 9.1 MB, versionCode 2, signed with `~/keys/capkickers-upload.jks` (Play App Signing). This file is **not** in git; it's local on the Mac.
- **iOS:** production (LIVE-ads) web build already synced into `ios/App/App`. To ship: open `apps/cap-kickers/ios/App/App.xcodeproj` (SPM project, no `.xcworkspace`) → Product ▸ Archive → Distribute ▸ App Store Connect ▸ Upload. The GoogleMobileAds "Upload Symbols Failed" dSYM warning is harmless.
- Test vs live ads is automatic: this synced build has **no** test-ad IDs — it ships the real live units. (Force test ads only for device QA with `VITE_USE_TEST_ADS=true bun run build:mobile`.)

---

## What's in this build (full scope)

### Gameplay
- **Shot rules:** the 4th touch can gamble an early shot against a near-unbeatable keeper; a rebound that stays in play earns a 5th touch; the final shot must be threaded between your own two caps to beat the keeper.
- **Goal celebration:** a big centered score card pops in, holds, then fades as the next formation arrives (a real "moment", not an instant scene-swap).
- **Touch pips** paint the current touch; **first-games tip** nudges new players to start with the middle cap.

### Modes & monetization
- **"2 Players"** local pass-and-play (renamed from "Pass & Play" so the 2-player nature is obvious), **Practice**, **Campaign**, and **Solo vs AI** (Easy/Normal/Hard).
- **Banner** (adaptive, bottom, menu screens only — hidden during a match). Now loads **once per menu session** instead of re-requesting on every navigation, so it can't trip AdMob's over-frequent-load rule.
- **Interstitial** at the start of a casual session (2 Players / Practice) — shown once before the first flick, only if already preloaded, gap-capped so it never stacks — plus the existing every-3-matches / 90-s-minimum cadence.
- **Rewarded** "one more shot" after a missed shot in vs-AI, and "watch for Caps" in the Cabinet.

### Tutorial
- Reworked into 6 clear steps (Meet your team → Start with the middle cap → Flick, don't aim → Pass between your caps → Five touches → Shoot on touch 4 or 5), auto-shown on first launch with a **"Don't show this again"** toggle. Localized EN / PT-BR / ES.

### Trophy Cabinet (cosmetic economy)
- **Caps** currency earned by playing + a daily rewarded top-up; unlockable cap skins, pitches, and audio packs. Purely cosmetic — never gates gameplay.

### Audio
- Free real recordings (referee whistle + goal roar) play in every match; **Crowd Pack** (win/near-miss) and **Stadium Ambience** loop are paid Cabinet upgrades. Sound reliably returns after an ad/interruption.

### Localization & analytics
- Full EN / PT-BR / ES (on-device name "Futebol de Tampinha" in pt). Firebase Analytics (opt-out in Settings) wired natively on iOS + Android.

---

## Store console TO-DOs (Cowork)

1. **iOS — archive & submit.** Archive build 2 in Xcode, upload, then in App Store Connect attach it and submit for review. First submission: complete the listing, screenshots (iPhone + iPad — universal build), App Privacy label (tracking = Yes via AdMob/IDFA + ATT), and age rating (4+ / Everyone).
2. **Android — upload AAB.** Upload `app-release.aab` (versionCode 2) to Play Console, complete the Data safety form, content rating (Everyone), and roll out.
3. **AdMob — link the store listings (the reason rewarded ads show ZERO impressions).** AdMob ▸ Apps ▸ **Cap Kickers (Android)** ▸ **"Add store"** → link the live Play listing (use *Add store* on the existing row, NOT "create new app", which orphans the compiled ID). AdMob then reviews 2–3 days → "Ready · Ad serving enabled". Verify the **iOS** app is linked too. Real ad units no-fill until this is done.
4. **AdMob — banner auto-refresh.** For each banner ad unit, set **Auto-refresh = 60 seconds** (AdMob allows 30–120s; faster or code-driven reload is what gets penalized). This pairs with the app change so banners rotate compliantly.
5. **AdMob — max ad content rating = G** (matches 4+/Everyone).
6. **app-ads.txt** — already live on `solevia.app`; confirm AdMob has crawled/verified it against both store listings (can take up to ~7 days).
7. **Consent/UMP** — left OFF (fine for US / Brazil / India). Must be re-enabled before EEA/UK/Switzerland availability.

## Store "What's New" text (debut — copy/paste)
> Cap Kickers is here! Flick your bottle caps across the pitch, thread them past your rivals, and score to win. Play the Campaign, challenge a friend in 2-Player pass-and-play, or take on the AI. Unlock cap skins, pitches and stadium sounds in the Trophy Cabinet. No ads during a match — just quick, satisfying flick-soccer. ⚽

## Notes / non-blockers
- Ad-campaign creatives (Higgsfield images + a promo video, ~19 MB) live locally at `store-assets/ads/` and are **not** committed (kept out of git history). They're for ad campaigns, not the store submission — grab them from the Mac if needed.
- Leftover `ios/App/App.xcodeproj/project.pbxproj.bak-before-firebase` is a stray backup; safe to delete anytime.
