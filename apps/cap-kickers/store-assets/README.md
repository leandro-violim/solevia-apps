# Cap Kickers — store assets & publishing (start here)

Everything needed to publish **Cap Kickers** (`app.solevia.capkickers`, v1.0) to the App Store and
Google Play. Prepared in a Claude Code session on 2026-08-26; all committed on branch `cap-kickers`.

## Files in this folder

| File | What it is |
|------|-----------|
| **PUBLISHING-PROMPT.md** | The paste-into-Claude-Task prompt. Full step-by-step for AdMob + App Store + Play, with a "who does what" boundary. **Start any publishing session with this.** |
| **STORE-VALIDATION.md** | Store-guidelines audit (blockers / should-fix / already-good) for first-pass approval. |
| **STORE-LISTING.md** | Ready-to-paste listing copy, **EN + pt-BR** (pt-BR name = *Futebol de Tampinha*), within char limits. |
| **VIDEO-GUIDE.md** | How to record the ~20–25s gameplay video on-device (specs + shot-list). Serves App Store + Play/YouTube. |
| **feature-graphic-en.png / -pt.png** | Google Play feature graphic, 1024×500 (English + Portuguese). |
| **screenshots/** | Store screenshots at exact sizes (see below). |

## Screenshots (`screenshots/`)

| Folder | Size | For |
|--------|------|-----|
| `ios-iphone-6.9/` | 1290×2796 | Apple iPhone 6.9" (required) |
| `ios-ipad-13/` | 2048×2732 | Apple iPad 13" (required — app is universal) |
| `play-phone/` | 1080×1920 | Google Play phone |
| `play-tablet-7/` | 1200×1920 | Google Play 7-inch tablet (required) |
| `play-tablet-10/` | 1600×2560 | Google Play 10-inch tablet (required) |

5 shots each: `01-home` · `02-campaign` · `03-play` · `04-pitches` · `05-caps`.
Regenerate: `bun run dev` (port 8080) → `bun <scratchpad>/capture.js store-assets/screenshots`
(uses the `playwright` devDependency + system Chrome).

## Status dashboard

**✅ Done & committed (in this repo, branch `cap-kickers`):**
- App code: gameplay, modes, AdMob engine (test/live auto-switch), EN+pt-BR i18n, in-app legal
  (governing law = **Florida**, support email **contact@solevia.app**), tutorial with real cap art.
- **Real AdMob IDs applied** (account pub-9628521678374705): iOS app id `~1368359859`, Android app id
  `~4321826253`, and all 6 live ad-unit IDs in `src/lib/ads.ts` LIVE_IDS. A production `build:mobile`
  ships live ads automatically; `VITE_USE_TEST_ADS=true` forces test ads for device testing.
- **On-device app name localized**: pt devices show **"Futebol de Tampinha"**, others "Cap Kickers".
- **Cap-grab fix**: caps stay grabbable (≥~48pt target) even when the camera zooms out (fifth-touch
  framing) — verified better on-device by the owner.
- iOS compliance: `PrivacyInfo.xcprivacy` (wired into the target) + `ITSAppUsesNonExemptEncryption=false`.
  Splash imageset cleaned (no more "unassigned children" warning). Xcode 26.3 / iOS SDK 26.2 on the Mac
  (meets Apple's Xcode-26 archive requirement).
- Android: `android/` project, AdMob meta-data, launcher icons, targetSdk 36, builds an APK.
  `*.jks`/`*.keystore`/`keystore.properties` gitignored; `android/keystore.properties.example` added.
- Store assets: screenshots, feature graphics (`feature-graphic-en/-pt.png`), listing copy — all here.
- `tsc` clean · 133 unit tests pass · `build:mobile` + `cap sync ios/android` succeed.
- solevia-web already deployed: `privacy/cap-kickers` + `terms/cap-kickers` live, showing contact@.

**⛔ Remaining — owner actions (needs your accounts/assets/logins; see PUBLISHING-PROMPT.md):**
1. Host **`app-ads.txt`** at solevia.app root: `google.com, pub-9628521678374705, DIRECT, f08c47fec0942fa0`.
   (The privacy-policy URL is already live.) After the app is live, in AdMob use **"Link to app store"**
   and set **max ad content rating = G**.
2. Create the **Android upload keystore** (see `android/keystore.properties.example`) and build a signed
   **AAB** — do the keystore + Gradle wiring in Claude Code on the Mac with help.
3. Record the **on-device video** (VIDEO-GUIDE.md) — optional.
4. **iOS:** archive in Xcode (Product ▸ Archive) → upload to App Store Connect.
5. Fill listings (STORE-LISTING.md — EN "Cap Kickers" / pt-BR "Futebol de Tampinha"), upload the
   screenshots + feature graphics, complete App Privacy / Data safety + age questionnaires
   (general-audience 4+/Everyone — NOT child-directed), and **Submit** in ASC + Play Console.
6. Confirm **contact@solevia.app** is a real, monitored mailbox before submitting.

**Known-benign (no action needed):** the JS console prints **React #418** (a hydration warning from
TanStack Start's SPA-shell prerender). It reproduces even in English, React recovers by client-rendering,
the app works, and it's invisible to users and to store review. Not a fix-before-launch item.

**Key decisions already locked:** general-audience rating (keeps all AdMob formats) · ship **universal
incl. iPad** · UMP consent disabled — re-enable only before an EEA/UK/Switzerland launch, not for
Brazil or India.

## The three actors (don't let sessions collide)
- **Claude Code (this Mac):** code edits + builds/archives + asset regen. All code is done here.
- **Claude Task (cloud):** guidance + drafting only; can't see this repo or your logins — attach files
  from this folder if it needs them; it must not rewrite app code.
- **You:** authenticated console clicks, on-device video, hosting URLs, keystore secret.
