# Cap Kickers — Publishing Handoff Prompt

Copy everything below the line into a new **Claude Task** (or a fresh Claude Code session) to drive the
AdMob setup + Android (Google Play) + Apple (App Store) publishing. It is self-contained.

Keep this file for yourself as the checklist; the agent you hand it to gets the same text.

---

## CONTEXT (read first)

You are helping publish **Cap Kickers**, the 2nd mobile game from **Sole Via Entertainment LLC** — a
casual bottle-cap finger-flick soccer game (Brazilian "futebol de tampinhas"). It's a React 19 +
TanStack Start + Vite web app wrapped with **Capacitor** into native iOS + Android. It is a monorepo
under `apps/cap-kickers`, on the **`cap-kickers` git branch** (a worktree at
`/Users/leandroviolim/Developer/solevia-cap-kickers`). Its sibling game Zen Bubbles (`apps/pop-zen`,
`main` branch) is already on the App Store — reuse its patterns; do NOT cross branches.

**Identity**
- App name: **Cap Kickers**
- Bundle / applicationId: **`app.solevia.capkickers`**
- Version: **1.0** (iOS build 1, Android versionCode 1)
- AdMob publisher: **pub-9628521678374705** (same account as Zen Bubbles)
- Support email: **hello@solevia.app** · Marketing site: **https://solevia.app**

**What the game contains (for the store listing):** single-player vs-AI campaign (difficulty ladder) +
practice mode; flick physics (harder/faster flick = farther); 5 touches per turn; "thread the gate"
passing; shoot past a keeper; rewarded "one more shot"; selectable pitch skins (grass / school desk /
table / cement) and cap skins; English + Brazilian Portuguese; sound/music/vibration toggles; works
offline. Ads: bottom **banner on menus only**, **interstitial** every few matches (capped), opt-in
**rewarded** video for an extra shot. No IAP, no accounts, no login.

**Build commands (run inside `apps/cap-kickers`):**
```
bun install
bun run build:mobile        # vite.config.mobile.ts → static SPA in dist/client
bunx cap sync ios           # copy web + update native iOS (SPM project, no .xcworkspace)
bunx cap sync android       # copy web + update native Android
```
Toolchain on this Mac: Bun, Xcode (iOS), Java 21 + Android SDK (`~/Library/Android/sdk`) + Android
Studio. The iOS Simulator's GPU is broken on this machine — test iOS on a real iPhone.

**What has ALREADY been done in code (don't redo):**
- iOS: `PrivacyInfo.xcprivacy` present & wired into the target; `ITSAppUsesNonExemptEncryption=false`;
  ATT usage string + `requestTrackingAuthorization()`; 50 SKAdNetwork IDs; GADApplicationIdentifier key
  present (holding Google's TEST id — see step A).
- Android: `android/` project created, AdMob `APPLICATION_ID` meta-data in the manifest (Google TEST id),
  launcher icons generated, `INTERNET` permission, targetSdk 36.
- Ads engine `src/lib/ads.ts`: banner/interstitial/rewarded with frequency caps, all no-ops on web,
  test/live auto-switch. UMP consent form is intentionally commented out (US-first launch).
- Full EN + pt-BR localization incl. legal pages; in-app About/Privacy/Terms; app icons.
- Legal governing-law state set to **Florida** (`-legal-doc.tsx`); tutorial illustrations use the real
  gameplay cap art.
- **Store screenshots generated** at exact sizes in `store-assets/screenshots/` (iPhone 6.9", iPad 13",
  Play phone). Video is recorded on-device by the owner (`store-assets/VIDEO-GUIDE.md`).
- `tsc` clean, 131 unit tests pass, both platforms sync & build.

**Read `store-assets/STORE-VALIDATION.md` in this repo for the full compliance audit.** The blockers
below map to it.

---

## STEP A — AdMob (do this FIRST; the store builds need the real IDs)

1. Sign in to AdMob (account **pub-9628521678374705**). Create **two apps**: "Cap Kickers" for **iOS**
   and "Cap Kickers" for **Android** (bundle/appId `app.solevia.capkickers` on both).
2. For each app, create **3 ad units**: Banner, Interstitial, Rewarded. Collect the 6 unit IDs and the
   2 App IDs (format `ca-app-pub-9628521678374705~XXXXXXXXXX` for apps, `.../XXXXXXXXXX` for units).
3. Put them into the code (this is the only code change needed for real ads):
   - `ios/App/App/Info.plist` → replace the `GADApplicationIdentifier` string with the iOS **App ID**.
   - `android/app/src/main/AndroidManifest.xml` → replace the `com.google.android.gms.ads.APPLICATION_ID`
     value with the Android **App ID**.
   - `src/lib/ads.ts` → fill the `LIVE_IDS` object (ios & android → banner/interstitial/rewarded) with
     the 6 **unit IDs**. (Leave `TEST_IDS` alone.)
4. AdMob app settings: set **max ad content rating = G**; set the app as a **general-audience** app
   (NOT child-directed — see the age-rating note in the validation doc). Under "Link to app store",
   you can only link **after** the app is live — do it post-launch to trigger AdMob approval.
5. Publish **`app-ads.txt`** at the root of `solevia.app` (in the `solevia-web` repo) containing:
   `google.com, pub-9628521678374705, DIRECT, f08c47fec0942fa0` — commit & let Cloudflare deploy.
6. Rebuild after editing IDs: `bun run build:mobile && bunx cap sync ios && bunx cap sync android`.

> Until the real IDs are in, you can still build and test with test ads by exporting
> `VITE_USE_TEST_ADS=true` before `build:mobile`. NEVER tap your own LIVE ads (invalid-traffic risk).

---

## STEP B — Apple App Store

**Prereqs:** Apple Developer Program membership; access to App Store Connect (ASC).

1. **Archive & upload the build:**
   - Open `apps/cap-kickers/ios/App/App.xcodeproj` in Xcode (it's an **SPM** project — there is no
     `.xcworkspace`).
   - Select a **Team** under Signing & Capabilities (automatic signing is fine) for the `App` target.
   - Set the run destination to **Any iOS Device (arm64)**.
   - **Product ▸ Archive** → Organizer ▸ **Distribute App ▸ App Store Connect ▸ Upload**.
   - The GoogleMobileAds "Upload Symbols Failed" dSYM warning is harmless — ignore it.
   - For a re-upload, bump `CURRENT_PROJECT_VERSION` (build number) in `project.pbxproj` (keep
     `MARKETING_VERSION = 1.0`).
2. **Create the app record in ASC** (if not already): New App → iOS → name "Cap Kickers", bundle
   `app.solevia.capkickers`, SKU, primary language English (U.S.).
3. **Listing metadata** (draft copy is in `store-assets/` if present; otherwise write from the CONTEXT
   feature list): name, subtitle, promotional text, description, keywords, support URL
   (`https://solevia.app`), marketing URL, **privacy policy URL** (host the in-app text — see validation
   blocker #2), category **Games ▸ Sports** (secondary Arcade/Casual), **Age rating 4+** (answer the
   questionnaire as a general-audience game — not Kids category).
4. **Screenshots — already generated** at exact sizes in `store-assets/screenshots/`:
   `ios-iphone-6.9/` (1290×2796, required) and `ios-ipad-13/` (2048×2732, required because the build is
   universal). Upload those. (5 shots each: home, campaign, gameplay, pitch skins, cap skins.) Optional:
   add marketing captions before uploading.
   **App preview video (optional):** the owner records ~20–25s on-device — see `store-assets/VIDEO-GUIDE.md`
   for specs + a shot-list. Upload it to the 6.9" iPhone (and optionally 13" iPad) preview slot.
5. **App Privacy "nutrition label":** declare what AdMob collects — typically **Identifiers (Device ID)**
   and **Usage Data**, "used for Third-Party Advertising / Analytics", **linked to identity = No**,
   **tracking = Yes** (because ATT + IDFA). Mirror the Zen Bubbles answers.
6. **App Review notes:** state it's a single-player casual game, no account needed, ads via AdMob with an
   ATT prompt. No demo credentials required.
7. Attach the uploaded build, set pricing = **Free**, availability (US-first is fine), and **Submit for
   Review**.

---

## STEP C — Google Play

**Prereqs:** Google Play Console developer account (owner already approved to publish).

1. **Release signing** — Play needs a signed **AAB** + Play App Signing:
   - Create an upload keystore (owner keeps the password safe), e.g.
     `keytool -genkey -v -keystore capkickers-upload.jks -alias capkickers -keyalg RSA -keysize 2048 -validity 10000`
   - Add a `signingConfigs { release { ... } }` block to `android/app/build.gradle` reading the keystore
     from a **gitignored** `keystore.properties` (never commit the keystore or passwords), and point
     `buildTypes.release.signingConfig` at it. (`minifyEnabled false` is fine for this app.)
   - Build the bundle: `cd android && ./gradlew :app:bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
2. **Create the app in Play Console:** name "Cap Kickers", default language English, category **Games ▸ Sports**
   (or Casual), free.
3. **Store listing:** short + full description (from the CONTEXT feature list), app icon (512×512),
   feature graphic (1024×500 — still needs to be made), phone screenshots from
   `store-assets/screenshots/play-phone/` (1080×1920), optional tablet screenshots from
   `store-assets/screenshots/ios-ipad-13/`. Promo video (optional) = a **YouTube URL**: upload the
   on-device clip from `store-assets/VIDEO-GUIDE.md` to YouTube and paste the link.
4. **Content rating questionnaire:** answer as a casual sports game with ads → **Everyone / PEGI 3**.
   Do NOT enrol in **"Designed for Families"** (it restricts ads and adds child-privacy duties).
5. **Data safety form:** declare AdMob's collection — **Device or other IDs** + **App activity**, shared
   with a third party (Google) for advertising; data is **encrypted in transit**; not used for tracking
   in the Play sense beyond ads. Link the **privacy policy URL**.
6. **Advertising ID declaration:** answer **Yes, the app uses an advertising ID** (AdMob), purpose =
   advertising. Target API level is 36 (already compliant).
7. **App access:** "All functionality available without special access" (no login).
8. Upload the AAB to a **track** (start with **Internal testing** to smoke-test on a device, then promote
   to **Production**). Roll out.

---

## FINAL PRE-SUBMIT CHECKLIST (both stores)

- [ ] Real AdMob App IDs in Info.plist + AndroidManifest; 6 real unit IDs in `ads.ts` LIVE_IDS.
- [ ] `bun run build:mobile && bunx cap sync ios && bunx cap sync android` run **after** the ID edits.
- [ ] `GOVERNING_STATE` set in `src/routes/-legal-doc.tsx` line 13 (no more `[the LLC's home state]`).
- [ ] Privacy policy hosted at a public URL; `app-ads.txt` deployed on solevia.app.
- [ ] Age rating = general-audience 4+/Everyone; NOT child-directed / Kids / Designed-for-Families.
- [ ] Apple: privacy nutrition label + ATT reviewed; iPad (or iPhone-only) screenshots decided.
- [ ] Android: release-signed AAB; Data Safety + Advertising-ID declarations filled.
- [ ] Screenshots uploaded (ready in `store-assets/screenshots/`); **Play feature graphic 1024×500 still
      to be created**; app-preview video recorded on-device per `store-assets/VIDEO-GUIDE.md` (optional).
- [ ] Tested a production-config build on a real device (ads load, gameplay unaffected offline).
- [ ] (Before EU/Brazil later) re-enable the UMP consent block in `src/lib/ads.ts`.
