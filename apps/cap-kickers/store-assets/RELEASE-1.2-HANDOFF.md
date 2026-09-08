# Cap Kickers 1.2 — release handoff (for Cowork)

Prepared 2026-09-06 on branch `feat/project-c-graphics`. This is a **big feature update**
over the shipped 1.1 (iOS) / 1.1.1 (Android): realistic "Project C" graphics, a full real
audio layer, the reward road, and three new opt-in ad surfaces.

## Versions (already bumped in the repo)
| Platform | Version | Build / code | Was |
|---|---|---|---|
| iOS | **1.2** | build **3** | 1.1 / build 2 |
| Android | **1.2** | versionCode **4** | 1.1.1 / vc 3 |

`android/version.properties` and `ios/App/App.xcodeproj/project.pbxproj` are set. Native
projects synced with the **production** web build (live AdMob IDs, verified 0 test IDs).

## What's in 1.2 (for the "What's New")
- **New look** — photoreal bottle-cap sprites, wood/grass/concrete pitches, warm-wood UI,
  cinematic home banner.
- **Real audio** — cap-flick foley, crowd/whistle/goal recordings, localized commentary
  (EN/PT/ES), a looping menu theme, stadium/chant ambience.
- **Reward road** — Solo vs AI now shows what each phase unlocks (pitches, sound packs) with
  a "next reward" spotlight, claimed/locked chips, and a grand-prize cap.
- **Solo vs AI** replaces the old Campaign/difficulty split; difficulty auto-ramps.
- **Opt-in rewards ads** — "2× Caps" on a win, a daily Mystery Chest, and a skippable
  rewarded interstitial between phases. All opt-in, at natural breaks.
- Physics + tutorial polish (solid goal posts, whole-cap out-of-bounds, centered tutorial
  pitch, first-run middle-cap nudge).

## Compliance — verified, NO store re-declaration required
Diffed against 1.1. None of the re-declaration triggers fired:
- ✅ **No new SDK.** Firebase Analytics + AdMob were already in 1.1. The rewarded interstitial
  is the **same AdMob SDK, a new format** — the checklist says ad-format changes don't retrigger.
- ✅ **No new IAP / currency-for-money.** Caps are still earned by play + rewarded ads only,
  never bought. IARC "purchases/currency = No" stays valid.
- ✅ **No new data collection.** New analytics events are anonymous (currency-source + item-id
  labels). No `setUserId`, no Google Signals, no Crashlytics, no manual `ad_impression`. The
  Settings → Usage Analytics opt-out is intact → Play "users can choose" stays valid.
- ✅ **No new locale.** en / pt-BR / es already declared in 1.1.
- ✅ **iOS encryption** `ITSAppUsesNonExemptEncryption=false` (no new crypto) and
  **PrivacyInfo.xcprivacy** unchanged (localStorage = UserDefaults CA92.1, already declared).
- ✅ **targetSdk 36** meets Play's floor. **versionCode/build incremented.**
- ✅ Release build greps **clean of test ad IDs** (`3940256099942544` = 0); live IDs present
  for both platforms incl. the new rewarded-interstitial units.

So **IARC, Play Data safety, and Apple App Privacy do not need updating** for 1.2.

## Confirmed by Leandro (2026-09-06)
1. **Version 1.2** — confirmed. ✅
2. **Release countries — unchanged from 1.1**: USA, Canada, New Zealand, Australia, Brazil,
   India, and LatAm Spanish-speaking countries. **None are EEA/UK/Switzerland → UMP stays OFF,
   compliant.** ✅ Guard rail: keep **Spain excluded** from the Spanish set (Spain is EEA and
   would force UMP re-enable).
3. **New captures + ads** — approved; briefed for Cowork in `COWORK-CAPTURE-BRIEF.md` (store
   screenshots for the listing + Google Ads and Apple Ads image creatives).
4. **"What's New" in 3 languages** — approved; text ready in `RELEASE-NOTES-1.2.md` (EN/PT/ES).

## Resolved since 2026-09-06
- **Audio rights — CLEARED (2026-09-08).** ElevenLabs SFX/VO/ambience confirmed clear against the
  Sound Effects Terms + ToS (paid plan, commercial use, no Studio-Games exclusion for SFX). The
  menu theme "Arena of Glory" (ElevenLabs Music, Studio-Games-excluded) was **replaced** with
  "Brazil Football Carnival Samba Music" (Pixabay 260573, Pixabay Content License). Full write-up
  in `src/assets/audio/LICENCES.md`; the old track is parked at `store-assets/audio-hold/`.
  ⚠️ Content ID note: don't score a YouTube ad creative with the new menu track without checking.
- **Screenshots + ad creatives — PRODUCED.** 45 screenshots (`store-assets/screenshots-1.2/`) and
  12 ad images (`store-assets/ads-1.2/`), regenerable via `tools/store-capture`. These dirs are
  git-ignored (122 MB) — they live on disk for the upload only.

## Still outstanding before submitting
- **Store uploads + listing metadata + ad campaigns** — Cowork's (upload the produced assets +
  the `RELEASE-NOTES-1.2.md` "What's New").
- **Legal declarations at submit** — IARC Terms, export-compliance, Play policy checkboxes, and
  pressing Submit are **Leandro's alone**.
- **Release branch merge** — this work is on `feat/project-c-graphics`; merge it onto the release
  line before building the store binaries (see below).

## AdMob note (rewarded interstitial)
The new rewarded-interstitial units are created and wired (iOS `…/3205796533`,
Android `…/6209670726`, reward 5 Caps). New AdMob units can take **up to an hour to start
serving** and may sit "limited" briefly — an empty ad in the first hour is not a wiring bug.
The between-phases ad also only fires on the **2nd** qualifying phase change and **>90s** after
any other ad (shared anti-stack gap) — see `notifyPhaseChange` in `src/lib/ads.ts`.

## The push (once the above is settled)
- **Branch**: this work is on `feat/project-c-graphics`. Decide the merge/release branch before
  building the store binaries (the shipped 1.1 lived on the `cap-kickers` / `android-release`
  lines).
- **Android**: `bun run build:mobile` (no test flag) → `bunx cap sync android` → build the
  signed AAB (versionCode 4). Never commit the `.aab` or keystore.
- **iOS**: open `ios/App/App.xcodeproj` → Product ▸ Archive → Distribute ▸ App Store Connect
  (1.2 / build 3). The GoogleMobileAds dSYM "Upload Symbols Failed" warning is harmless.
- Verify once more that the archived/built binary carries **live** ad IDs (a plain
  `build:mobile` with no `VITE_USE_TEST_ADS` does this automatically).

## Quick pass/fail (release-check skill)
- [x] No new SDK / network / stored field vs 1.1 — Data safety & App Privacy unchanged
- [x] No new IAP / chat / UGC / location — IARC unchanged
- [x] No new store language — none added
- [x] targetSdkVersion meets Play floor (36)
- [x] versionCode / build incremented (Android 4, iOS build 3)
- [x] Release build clean of test ad IDs
- [ ] EEA/UK/CH: UMP re-enabled — **only if** those countries are added (confirm #2)
- [ ] New screenshots + "What's New" uploaded (#3, #4) — **owner/Cowork**
</content>
