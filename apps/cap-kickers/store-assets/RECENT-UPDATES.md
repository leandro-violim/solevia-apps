# Cap Kickers — updates to tell Claude Task (as of 2026-08-26)

Paste this into Claude Task so it works from current state. All committed on branch `cap-kickers`
(public repo `github.com/leandro-violim/solevia-apps`). **These are DONE — don't redo them.**

## Code + config changes (done on the Mac, committed)
- **Real AdMob IDs applied** (account pub-9628521678374705): iOS app id `~1368359859`, Android app id
  `~4321826253`, and all 6 live ad-unit IDs in `src/lib/ads.ts` LIVE_IDS. Test/live auto-switch still
  works (`VITE_USE_TEST_ADS=true` for device testing; a plain build ships live ads).
- **Support email is `contact@solevia.app`** everywhere (was hello@). Matches the hosted legal pages.
- **Cap-grab fix**: caps stay tappable (~48pt target) even at the widest camera zoom (fifth touch) —
  owner-verified better on a real iPhone.
- **On-device app name localized**: Portuguese devices show **"Futebol de Tampinha"**, others
  "Cap Kickers" (store listing names already match).
- **Splash "unassigned children" Xcode warning fixed** (removed 3 orphaned splash PNGs).
- **iOS**: privacy manifest + `ITSAppUsesNonExemptEncryption=false` in place. Xcode 26.3 / iOS SDK 26.2
  (meets Apple's Xcode-26 archive requirement).
- Tests now **133 pass**, `tsc` clean, both platforms build.

## Android release build (done)
- **Upload keystore** created at `~/keys/capkickers-upload.jks`; `android/keystore.properties` holds the
  secrets (gitignored — never committed). `build.gradle` is wired with a `signingConfigs.release` that
  reads it.
- **Signed AAB built**: `cd android && ./gradlew :app:bundleRelease` →
  `app/build/outputs/bundle/release/app-release.aab` (~8.6 MB, versionCode 1).
- **Signing cert (upload key, NOT debug)** — owner `CN=Leandro Violim, Sole Via Entertainment LLC,
  Miami, Florida`; **SHA-256** `C6:13:58:DC:AB:A6:8C:3B:C5:21:57:96:22:7B:05:32:8D:34:43:73:27:CF:EE:82:CA:BA:2A:2B:BE:5B:22:DF`.
- **Version bumps**: `android/version.properties` (committed) is the single source — bump `VERSION_CODE`
  +1 for every Play upload, `VERSION_NAME` on user-visible changes; the build reads it.
- ⚠️ Never commit the `.aab` or `keystore.properties` (both gitignored). Back up the keystore + passwords.

## Store assets (all in `store-assets/`)
- Screenshots: iPhone 6.9" (1290×2796), iPad 13" (2048×2732), Play phone (1080×1920), **Play 7" tablet
  (1200×1920)**, **Play 10" tablet (1600×2560)** — 5 shots each.
- Feature graphics `feature-graphic-en.png` + `-pt.png` (1024×500).
- Listing copy `STORE-LISTING.md` (EN "Cap Kickers" + pt-BR "Futebol de Tampinha").
- `app-ads.txt` already LIVE on solevia.app; privacy/terms pages live (contact@).

## Known-benign (do NOT chase)
- JS console logs **React #418** on startup — a TanStack Start SPA-shell hydration warning. Reproduces
  even in English, React recovers, the app works, invisible to store review. Not a fix-before-launch item.

## Still to do (owner + Task guidance)
1. **Upload the AAB to Google Play** (accept Play App Signing on first upload); add the 7"/10" tablet
   screenshots; complete **Play "App content"** declarations (privacy, ads, data safety, target
   audience = general/Everyone, NOT child-directed); then submit.
2. **iOS**: archive in Xcode (Product ▸ Archive) → upload to App Store Connect; finish/submit the listing.
3. Optional: record the on-device gameplay video (`VIDEO-GUIDE.md`).
4. Confirm `contact@solevia.app` is a monitored mailbox before submitting.
