# Cap Kickers — Store-Readiness Validation (first-submission audit)

**App:** Cap Kickers · bundle `app.solevia.capkickers` · v1.0 (iOS build 1 / Android versionCode 1)
**Studio:** Sole Via Entertainment LLC · **AdMob:** pub-9628521678374705
**Audited:** 2026-08-26 against the Apple App Store Review Guidelines and Google Play policies.

The goal of this doc is **first-pass approval**. Items are grouped: 🔴 blockers (will get rejected / can't ship
real ads), 🟡 should-fix (reduces rejection risk or looks unfinished), 🟢 already good.

---

## 🔴 Blockers — must be done before you upload for review

These are **owner actions** (they need accounts/assets I can't create). The code side is ready for them.

1. **Real AdMob IDs (both platforms).** The app currently ships Google's *test* AdMob App IDs and the
   live ad-unit slots are placeholder zeros, so a production build shows test ads and real ad units
   would no-fill. This won't get you *rejected*, but you'll earn $0 and Google can flag a test App ID.
   Register "Cap Kickers" (iOS + Android) in AdMob → then replace:
   - `ios/App/App/Info.plist` → `GADApplicationIdentifier` (currently `ca-app-pub-3940256099942544~1458002511`)
   - `android/app/src/main/AndroidManifest.xml` line ~14 → `com.google.android.gms.ads.APPLICATION_ID`
   - `src/lib/ads.ts` → `LIVE_IDS` (6 unit ids: ios+android × banner/interstitial/rewarded), lines ~51–62.
   The dev/test switch is automatic (`USE_TEST_ADS = import.meta.env.DEV || VITE_USE_TEST_ADS==="true"`),
   so a normal production build ships the LIVE ids — they just have to be real.

2. **Hosted privacy policy URL.** Both stores require a public privacy-policy URL in the listing
   (Apple 5.1.1, Play Data Safety). The policy text already exists in-app (Settings → About & Legal),
   but you still need it at a crawlable URL (e.g. `https://solevia.app/capkickers/privacy`). Reuse the
   in-app text.

3. **`app-ads.txt`.** For AdMob to authorize your inventory, publish `app-ads.txt` at the domain in your
   store listing (root of `solevia.app`) containing:
   `google.com, pub-9628521678374705, DIRECT, f08c47fec0942fa0`
   (Same line Zen Bubbles uses — one file can list multiple apps under the same publisher.)

4. **Android release signing.** The debug APK builds fine, but Play needs an **AAB signed for release**
   + Play App Signing enrolled. Create/keep an upload keystore (owner-held secret). See the publishing
   prompt for the exact `signingConfigs` block.

5. ~~**Governing-law state placeholder visible in the Terms.**~~ ✅ FIXED — `GOVERNING_STATE = "Florida"`
   in `src/routes/-legal-doc.tsx`; the Terms now read "governed by the laws of Florida, USA" (EN + pt-BR).

---

## 🟡 Should-fix / decisions to make

6. **Age rating & child-directed setting — pick "everyone", NOT "made for kids".** The game is clean and
   plays as 4+ / PEGI 3 / Everyone. BUT because it shows AdMob ads with IDFA/AD_ID + ATT, do **not** mark
   it child-directed / "Designed for Families" (Play) or in the Kids category (Apple). Doing so forces
   COPPA/child-safe ad modes (TFCD/TFUA) and can disable your ad formats. Set the questionnaire answers so
   it's rated for everyone but is a *general-audience* app, not a children's app.

7. **AdMob max ad content rating = G**, to stay consistent with a 4+/Everyone rating (otherwise a mature
   ad could appear in a kid-friendly-looking game and trip a reviewer).

8. **UMP consent is intentionally disabled — and that is correct for these six countries.**
   `runConsentAndTracking()` in `src/lib/ads.ts` has the Google UMP consent-form call commented out
   (owner chose to drop the "keep this app free" popup). Google **mandates** a certified consent
   platform only in the **EEA, UK and Switzerland** — none of which are launch countries. Re-enable it
   before you go there. It is **not** needed for Brazil or India: checked 2026-08-26, AdMob ▸ Privacy &
   messaging on pub-9628521678374705 offers only European regulations, US state regulations and the
   IDFA explainer, so re-enabling UMP would show those users nothing. iOS ATT
   is still active and correct.

9. **Confirm support email.** `SUPPORT_EMAIL = "hello@solevia.app"` (`-legal-doc.tsx` line 12) — make sure
   that inbox exists and is monitored; Apple sometimes emails it and it's your listing support contact.

10. **Orientation.** Info.plist declares portrait + landscape on iPhone and all four on iPad; the game
    re-lays-out on `orientationchange` (`play.tsx`), so rotation works rather than breaking. That's
    acceptable. If you'd rather lock it (simpler screenshots, no rotation surprises), say so and I'll
    pin it — otherwise it passes as-is.

11. **iPad build.** `TARGETED_DEVICE_FAMILY` includes iPad, so Apple will review it on iPad too and you
    must upload iPad screenshots. If you want iPhone-only (fewer screenshots, no iPad edge cases), set
    the target to iPhone-only and drop iPad. Decision, not a bug.

---

## 🟢 Already compliant (verified in code)

- **iOS privacy manifest** `PrivacyInfo.xcprivacy` present & wired into the App target: `NSPrivacyTracking=false`
  with empty tracking domains (correct — the tracking is done by the Google SDKs, which ship their own
  manifests), `UserDefaults` access declared with reason `CA92.1`. *(Added in this pass.)*
- **`ITSAppUsesNonExemptEncryption=false`** set — no export-compliance prompt each upload. *(Added this pass.)*
- **ATT**: `NSUserTrackingUsageDescription` present and `requestTrackingAuthorization()` is called before
  any ad id is used — required because AdMob may use the IDFA.
- **SKAdNetwork**: 50 network IDs listed in Info.plist for ad attribution.
- **Android target API 36** (`targetSdkVersion = 36`), min 24 — exceeds Play's API-35 floor for new apps.
- **Permissions are minimal**: Android manifest requests only `INTERNET` (+ the AdMob SDK's `AD_ID` via
  manifest-merge). No location/contacts/storage over-asks — reviewers like this.
- **No IAP / no account / no login** — fewer review surfaces. Single-player, works offline; ads fail
  silently (`initAds`/preload wrapped in try/catch, no-op on web) so no ad outage ever blocks gameplay.
- **Ads are non-intrusive & placed well**: banner on menus only (hidden during a match), interstitial
  frequency-capped (every 3 completed matches, ≥90s apart), rewarded is opt-in ("one more shot").
  Matches Apple 3.x / Play ad-policy expectations.
- **Localization**: full EN + pt-BR (device-detected + in-Settings toggle), including the legal pages.
- **App identity consistent**: display name "Cap Kickers" and bundle id match across Info.plist,
  capacitor.config.ts, AndroidManifest, and strings.xml.
- **Icons**: iOS 1024 app icon + Android adaptive launcher icons generated.
- **Build health**: `tsc` clean, 131/131 unit tests pass, `bun run build:mobile` + `cap sync ios/android`
  succeed, Android `assembleDebug` produces an APK.

---

## One-line summary

The **code is store-ready**; every remaining 🔴 is an external account/asset step (real AdMob IDs,
hosted privacy URL, `app-ads.txt`, release keystore) plus one visible copy fix (governing-law state).
Do those and the tuning in 🟡, and this should clear review on the first try.
