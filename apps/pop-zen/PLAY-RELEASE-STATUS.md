# Zen Bubbles — Google Play release status & handoff

**Last updated: 2026-08-21 (by Cowork / Claude in the Claude app, driving Play Console via Chrome).**
This file is the source of truth for where the Android / Google Play launch stands. Read it before touching anything Android.

---

## TL;DR — SUBMITTED FOR REVIEW ✅ (do not rebuild/resubmit without reason)

The first Android production release of **Zen Bubbles: Pop & Relax** was **submitted to Google Play for review on 2026-08-21** and is currently **"Changes in review"**.

- **Managed publishing is OFF** → the app **auto-publishes to production the moment Google approves it** (no second button). Review for a first app is typically hours–7 days. Watch for Google's approval email.
- **Nothing further is needed in code or Play Console to publish.** Do NOT create another release, bump versionCode, or re-upload the AAB unless the review is rejected or a new version is intentionally being shipped.

---

## What was submitted

- **App:** package `app.solevia.zenbubbles`, Play app id `4975957838269370430`, Play developer id `6428125916833849368` (Org "Sole Via Entertainment LLC", Google account leandroviolim7@gmail.com). Account is **verified/approved to publish**.
- **App bundle (AAB):** `versionCode 1`, `versionName 1.0`, targetSdk 36, minSdk 24, ~9.52 MB.
  - Built from branch **`android-release`** (= `android-port` + `ptbr-i18n` merged; pushed to origin).
  - Contents: English + Portuguese in-app (i18n), haptic pop + Vibration toggle, `viewport-fit=cover` top safe-area fix.
- **Signing:** **Play App Signing** (Google holds the app signing key; you upload with the UPLOAD key). See `store-assets/play/SIGNING.md` + `android/keystore.properties` (gitignored). ⚠️ **Reuse the SAME upload keystore for every future upload** — losing it means you must reset the upload key with Google.
- **Rollout:** full rollout (100%).
- **Countries (6):** United States, Canada, Australia, New Zealand, India, **Brazil**.
  - Brazil is included on Android (unlike iOS) because the Android build already ships Portuguese in-app. The Brazil store page is currently the **en-US** listing (app UI is still Portuguese for BR users). A pt-BR *store listing page* can be added later.
- **Store listing (en-US default):** name "Zen Bubbles: Pop & Relax"; short + full description; app icon 512×512 (from `assets/icon-only.png` resized); feature graphic 1024×500 (`store-assets/play-feature-graphic.png`); 5 phone screenshots (see note); en-US release notes.
  - **Screenshot note:** Play requires phone screenshots ≥ 9:16. The source shots in `store-assets/play/screenshots/*` are 1080×2400 (too tall = 1:2.22). For upload they were padded to **1350×2400 (exactly 9:16)** on the app dark bg `#171326` (thin side bars, no content cropped). If you regenerate screenshots, keep them ≤ 9:16 or Play will demand cropping.
- **Category:** Game → Casual. **Contact:** support@solevia.app, website https://solevia.app.
- **App content declarations (all complete):** Privacy policy `https://solevia.app/privacy/pop-zen/`; Ads = Yes; App access = all functionality open (no login); Content rating IARC (all No except ads = Yes → Everyone); Target audience 13+ (avoids Families program); Data safety (Advertising ID collected + shared for ads, App interactions collected, encrypted in transit); Advertising ID = Yes; Government / Financial / Health = none.
- **Advanced settings:** Form factor **Google Play Games on PC = opted-in** (Google default; left as-is — harmless for a touch game, mouse acts as touch, extra reach).
- **Non-blocking warning at submit:** "no deobfuscation file associated with this App Bundle" — optional R8/proguard mapping; ignored. (If you enable R8/minify in a future build, upload the mapping.txt for readable crash stacks.)

---

## AdMob wiring — PENDING until the app is live

Once the app is approved/live, the Play Store link must be added to the AdMob **Android** app so AdMob's readiness review lifts and Android ads switch from limited to full serving (same step as iOS). **Cowork/Claude in the Claude app will handle this** (it has the AdMob browser session). No code change required.
- AdMob account: leandroviolim7@gmail.com (authuser=1), publisher `pub-9628521678374705`.
- Android AdMob App ID: `ca-app-pub-9628521678374705~9477972092`
- Android ad units: banner `ca-app-pub-9628521678374705/3973580155`, interstitial `ca-app-pub-9628521678374705/1211685446`. (Already wired in `src/lib/ads.ts` `LIVE_IDS.android`.)
- Expect limited ad serving at first — normal, clears after readiness review.

---

## What Claude Code should / should NOT do

- ✅ **Leave the current release alone.** It's in review and will auto-publish. Do not create a new release or bump versionCode unless (a) the review is rejected, or (b) we intentionally ship a new version.
- ✅ **Future Android updates:** commit code to `main`, merge into `android-release` (or rebase), `bun run build:mobile` → `npx cap sync android`, **bump `versionCode` (must be > 1)** in `android/app/build.gradle` / `variables.gradle`, build a signed AAB with the SAME upload keystore, and upload a new production release. versionName can track the iOS marketing version or stay independent.
- ⛔ Do NOT change iOS version numbers or submit anything to the App Store as part of Android work.
- ⛔ Do NOT set `NSPrivacyTracking` back to true (see the iOS handoff in root CLAUDE.md).

## iOS sequencing (unchanged — for context)
- iOS **1.0.1** = "Waiting for Review" (layout/safe-area fix).
- iOS **1.0.2** = built but NOT submitted (waiting on 1.0.1).
- iOS **1.1.0** = Portuguese (the `ptbr-i18n` work) — ships AFTER 1.0.2. On Android, Portuguese is already baked into this first build.

## Branches (all pushed to origin)
- `main` — v1.0.2 base (haptic pop, vibration toggle, viewport-fit fix).
- `android-port` — Android target + AdMob wiring + signing scaffold + Play assets.
- `ptbr-i18n` — pt-BR in-app localization (i18n layer + translations).
- `android-release` — **the shipped Android branch** = android-port + ptbr-i18n merged + `values-pt/strings.xml` ("Plástico bolha" launcher name). This is what the submitted AAB was built from.
