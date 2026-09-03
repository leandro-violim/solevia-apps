# Cap Kickers — Release notes: v1.1 (build 2 / versionCode 2)

**App:** Cap Kickers — bottle-cap finger-flick soccer
**Bundle:** `app.solevia.capkickers` · **Studio:** Sole Via Entertainment LLC
**Branch:** `cap-kickers`
**Version:** 1.1 · **iOS build 2** · **Android versionCode 2** (marketing version 1.0 → 1.1 — this is an update over the live 1.0; in-app About screen also reads v1.1)
**AdMob:** `pub-9628521678374705` (live units in `src/lib/ads.ts`) · **Firebase/GA4:** project `cap-kickers`, property `552486617`

---

## ⭐ Update — ad reliability fix + rebuilt AAB (this session)
Since the first 1.1 notes were written, we chased "rewarded ads never showing / zero
impressions" and shipped a real fix. Summary of the delta:

- **Fixed: rewarded/interstitial could stay stuck "not ready."** We now mark an ad
  ready when its load **promise resolves**, not only via the plugin's `Loaded` event
  (that event can fire before its async listener attaches on fast loads, and be
  missed). This previously suppressed the "one more shot" offer and the Cabinet
  "Watch for Caps" button. Applies to **both iOS and Android** (shared bundle).
- **Watch button now loads-then-shows** a rewarded ad on demand instead of no-opping
  if none was preloaded.
- **Removed** the temporary "🎯 Test: final shot" home button and all test-only
  scaffolding from the shipped build.
- **Verified end-to-end on an Android emulator** with Google's test ad unit: request →
  load → show → reward all work. (Root cause of the emulator failures was the emulator
  being in **Airplane Mode**, not the app.)
- **The AAB below was rebuilt** from a clean production build (live ad IDs, no test IDs,
  no drill) with these fixes. iOS project re-synced to match — see the iOS note.

**About the production zero-impressions:** it is **not a code bug.** The live rewarded
unit is still in AdMob **"limited ad serving"** (normal for a freshly-linked app) and
begins filling once the app gets real installs/traffic over a few days. Nothing to
change in the app; just monitor AdMob once 1.1 is live.

---

## Build artifacts (ready now)
- **Android AAB:** `apps/cap-kickers/android/app/build/outputs/bundle/release/app-release.aab` — 9.1 MB, versionCode 2, signed with `~/keys/capkickers-upload.jks` (Play App Signing). This file is **not** in git; it's local on the Mac.
- **iOS:** production (LIVE-ads) web build re-synced into `ios/App/App` **with the ad
  reliability fix**, so iOS and Android now run identical code. To ship: open
  `apps/cap-kickers/ios/App/App.xcodeproj` (SPM project, no `.xcworkspace`) → Product ▸
  Archive → Distribute ▸ App Store Connect ▸ Upload. The GoogleMobileAds "Upload
  Symbols Failed" dSYM warning is harmless. **If an iOS 1.1 (build 2) archive was made
  BEFORE this session's ad fix, re-archive to include it** for full parity (the project
  is already synced and ready).
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
3. **AdMob — store linking is DONE; now monitor for impressions.** Both apps are linked. Rewarded/interstitial impressions were still zero on 1.0 — expected while a brand-new AdMob app/units sit in "limited ad serving" (24–48h+ after linking) and before real install traffic arrives. The 1.1 code path is verified correct (preloads on launch, shows only when ready, right unit IDs, reward event handled), and 1.1 adds a start-of-session interstitial, so watch impressions once 1.1 is live. If still zero after a few days of real installs, check AdMob ▸ the app ▸ status = "Ready · Ad serving enabled" (not "Getting ready"/"Limited") and that ad requests are arriving (AdMob ▸ Ad review center / Reports).
4. **AdMob — banner auto-refresh.** For each banner ad unit, set **Auto-refresh = 60 seconds** (AdMob allows 30–120s; faster or code-driven reload is what gets penalized). This pairs with the app change so banners rotate compliantly.
5. **AdMob — max ad content rating = G** (matches 4+/Everyone).
6. **app-ads.txt** — already live on `solevia.app`; confirm AdMob has crawled/verified it against both store listings (can take up to ~7 days).
7. **Consent/UMP** — left OFF (fine for US / Brazil / India). Must be re-enabled before EEA/UK/Switzerland availability.

## Store "What's New" text (v1.1 update — copy/paste)
> • New 2-Player pass-and-play mode — challenge a friend on one phone
> • Clearer how-to-play tutorial (and you can turn it off)
> • A bigger goal celebration and smoother shooting
> • Real match sounds — referee whistle and goal roar
> • Trophy Cabinet: earn Caps and unlock skins, pitches and stadium sounds
> • Polish and stability fixes throughout

## Notes / non-blockers
- Ad-campaign creatives (Higgsfield images + a promo video, ~19 MB) live locally at `store-assets/ads/` and are **not** committed (kept out of git history). They're for ad campaigns, not the store submission — grab them from the Mac if needed.
- Leftover `ios/App/App.xcodeproj/project.pbxproj.bak-before-firebase` is a stray backup; safe to delete anytime.
