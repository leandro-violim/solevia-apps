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
| `ios-ipad-13/` | 2048×2732 | Apple iPad 13" (required — app is universal) + reuse for Play tablet |
| `play-phone/` | 1080×1920 | Google Play phone |

5 shots each: `01-home` · `02-campaign` · `03-play` · `04-pitches` · `05-caps`.
Regenerate: `bun run dev` (port 8080) → `bun <scratchpad>/capture.js store-assets/screenshots`
(uses the `playwright` devDependency + system Chrome).

## Status dashboard

**✅ Done & committed (in this repo, branch `cap-kickers`):**
- App code: gameplay, modes, AdMob engine (test/live auto-switch), EN+pt-BR i18n, in-app legal
  (governing law = **Florida**), tutorial with real cap art.
- iOS compliance: `PrivacyInfo.xcprivacy` (wired into the target) + `ITSAppUsesNonExemptEncryption=false`.
- Android: `android/` project, AdMob meta-data, launcher icons, targetSdk 36, builds an APK.
- Store assets: screenshots, feature graphics, listing copy (all in this folder).
- `tsc` clean · 131 unit tests pass · `build:mobile` + `cap sync ios/android` succeed.

**⛔ Remaining — owner actions (needs your accounts/assets/logins; see PUBLISHING-PROMPT.md):**
1. Register Cap Kickers (iOS + Android) in **AdMob** → get App IDs + 6 ad-unit IDs.
2. Paste those IDs into `Info.plist`, `AndroidManifest.xml`, `src/lib/ads.ts` LIVE_IDS **← do this in
   Claude Code on the Mac**, then rebuild + `cap sync`.
3. Host the **privacy-policy URL** + **`app-ads.txt`** on solevia.app.
4. Create the **Android upload keystore** and build a signed **AAB**.
5. Record the **on-device video** (VIDEO-GUIDE.md).
6. Fill listings (STORE-LISTING.md), upload assets, complete privacy/data-safety + age questionnaires
   (general-audience 4+/Everyone — NOT child-directed), and **Submit** in ASC + Play Console.

**Key decisions already locked:** general-audience rating (keeps all AdMob formats) · ship **universal
incl. iPad** · US-first launch with UMP consent disabled (re-enable before EU/Brazil).

## The three actors (don't let sessions collide)
- **Claude Code (this Mac):** code edits + builds/archives + asset regen. All code is done here.
- **Claude Task (cloud):** guidance + drafting only; can't see this repo or your logins — attach files
  from this folder if it needs them; it must not rewrite app code.
- **You:** authenticated console clicks, on-device video, hosting URLs, keystore secret.
