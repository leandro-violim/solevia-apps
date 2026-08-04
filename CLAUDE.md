# CLAUDE.md — project context & handoff for Claude Code

Monorepo (bun) for Sole Via Entertainment LLC. App under `apps/pop-zen` = **Zen Bubbles**
(bundle `app.solevia.zenbubbles`), a calm bubble-popping game. React 19 + TanStack Start +
Vite + Tailwind v4 + Capacitor (WKWebView → native iOS). Ads via Google AdMob
(`@capacitor-community/admob`). Mobile build: `bun run build:mobile` (uses
`vite.config.mobile.ts`, outputs static SPA to `dist/client`) then `bunx cap sync ios`.

------------------------------------------------------------------------
## ⚠️ HANDOFF — App Store submission work done 2026-08-04 (by Cowork/Claude in the Claude app)

The v1.0 App Store submission was completed in App Store Connect (ASC). Apple ID (adam id)
= **6797921737**. Current state: **v1.0 build 2 "Waiting for Review"** (US-only, Free).
Full ASC listing, screenshots, App Privacy label, and review info are already entered in ASC
(nothing to redo there).

### Uncommitted code changes made today — please review & commit
These are currently modified in the working tree (git status shows M). WHY each:

1. **`apps/pop-zen/ios/App/App/PrivacyInfo.xcprivacy`** — `NSPrivacyTracking` changed
   `true → false`.
   WHY: Apple auto-rejected build 1 with **ITMS-91064 "Invalid tracking information"** —
   `NSPrivacyTracking=true` is invalid when `NSPrivacyTrackingDomains` is empty. The app's
   OWN first-party code does no tracking; the Google Mobile Ads / UMP SDKs perform tracking
   (IDFA, gated behind ATT) and ship their OWN privacy manifests declaring tracking + domains,
   which Apple aggregates. So app-level `NSPrivacyTracking=false` + empty domains is correct
   and consistent. ATT prompt and the ASC "tracking = Yes" nutrition label remain accurate.
   DO NOT set this back to true unless you also populate `NSPrivacyTrackingDomains`.

2. **`apps/pop-zen/ios/App/App.xcodeproj/project.pbxproj`** — `CURRENT_PROJECT_VERSION` `1 → 2`
   (both configs). `MARKETING_VERSION` stays `1.0`.
   WHY: build 1 was already uploaded (then rejected); Apple requires a unique build number for
   each upload. Build 2 is the one now in review. Bump the build number again for any future
   re-upload of v1.0.

3. **`apps/pop-zen/ios/App/App/Info.plist`** — added `UIRequiresFullScreen = true`.
   WHY: the app is a universal build (`TARGETED_DEVICE_FAMILY = "1,2"`) but is portrait-only.
   Apple validation (at upload) requires iPad-multitasking apps to support all 4 orientations;
   `UIRequiresFullScreen=true` opts out of iPad multitasking so portrait-only passes, while
   keeping the app available on iPad. (If you'd rather ship iPhone-only, set
   TARGETED_DEVICE_FAMILY=1 instead and you can drop the iPad screenshots in ASC.)

Leftover backups to delete anytime: `PrivacyInfo.xcprivacy.bak`, `project.pbxproj.bak`.

### NOT changed (and why)
- **`apps/pop-zen/src/lib/ads.ts`** — NO change needed. Test vs live ads is automatic:
  `USE_TEST_ADS = import.meta.env.DEV || VITE_USE_TEST_ADS==="true"`. A production
  `build:mobile` (DEV=false, no env override) already ships LIVE ads; the live iOS ad-unit IDs
  are already in the file. (Ignore any older handoff note about "flip USE_TEST_ADS=false" —
  that's obsolete.)
- Already present from earlier compliance work: `PrivacyInfo.xcprivacy` NSPrivacyAccessedAPI
  (UserDefaults CA92.1), `Info.plist` `ITSAppUsesNonExemptEncryption=false` +
  `NSUserTrackingUsageDescription`.

### To re-archive/upload a new iOS build (native-only changes don't need a web rebuild)
Open `apps/pop-zen/ios/App/App.xcodeproj` (SPM project — there is NO .xcworkspace).
Bump build number → Product ▸ Archive → Distribute ▸ App Store Connect ▸ Upload. The
GoogleMobileAds "Upload Symbols Failed" dSYM warning is harmless.

------------------------------------------------------------------------
## Post-approval TODO (once the app is live on the App Store)
1. Push `app-ads.txt` in the **solevia-web** repo (`git add app-ads.txt && git commit && git push`;
   Cloudflare auto-deploys). File content: `google.com, pub-9628521678374705, DIRECT, f08c47fec0942fa0`.
   The ASC marketing URL is now `https://solevia.app` so Google can crawl it.
2. In AdMob → the Zen Bubbles app → App settings → **"Link to app store"** — this triggers
   AdMob's approval (it is GATED on the app being live/linkable; real ad units return no-fill
   until then). AdMob account = `pub-9628521678374705`.
3. AdMob: set **max ad content rating = G** (matches 4+); create the GDPR/UMP consent message
   before expanding availability beyond the US (currently US-only, which also avoids the EU DSA
   trader-status requirement for now).

## App Store screenshots (how they were made, if needed again)
Rendered from the web build with headless Chromium/Playwright in the cloud (the game is a web
app under Capacitor). Ad banner hidden via CSS; bubbles popped via dispatched PointerEvents;
phases advanced through the "Watch ad · Next phase" → "Continue" (5s) interstitial. iPhone at
1284×2778 (6 shots), iPad 13" at 2048×2732 (5 shots). Source assets saved at
`~/Developer/zen-appstore-assets/` (plus a 886×1920 preview video, not yet uploaded).
