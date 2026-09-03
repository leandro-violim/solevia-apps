# HANDOFF — rolling log between Claude Code and Cowork

Two Claudes work on this repo and they cannot see each other's conversations:

- **Claude Code** (terminal, on the Mac) — writes code, runs `bun`, `git`, Xcode, builds.
- **Cowork** (Claude app, cloud + a bridge to the Mac) — browser automation (Play Console,
  App Store Connect, AdMob, Firebase, Google Ads), media generation, store paperwork,
  and editing files through the bridge.

**The rule: whoever finishes a chunk of work appends an entry here before stopping.**
Newest entry at the top. Read the top 2–3 entries before starting anything.

An entry is worth writing when you changed the working tree, changed something in a console
that the code depends on, or discovered something the other one would otherwise re-learn.
Do not log routine reads or one-line tweaks.

### Entry format

```
## YYYY-MM-DD · <WHO> · <one-line summary>
**Did:** what actually changed — files, console settings, IDs
**Left for the other one:** specific, actionable
**Gotchas:** things that will waste their time if they don't know
**Uncommitted:** yes/no — and whether it's safe to commit
```

### Standing division of labour

| Task | Owner |
|---|---|
| Anything needing `git`, `bun`, Xcode, a device build | **Code** — Cowork's bridge has no `git` (the connected folder is a worktree whose `.git` lives outside it) and its `node_modules` is macOS-native, so Cowork cannot run `bun test` |
| Play Console, App Store Connect, AdMob, Firebase, Google Ads, any web console | **Cowork** — it drives the browser |
| Store copy, screenshots, ad creative, audio/image generation | **Cowork** |
| Store *declarations* (Data safety, App Privacy, IARC) | **Cowork** decides + files them; **Code** must not change app behaviour that invalidates them without saying so here |

---

## 2026-09-02 · CODE · Committed the rebuilt-project config files; re-synced native

**Did:**
- Verified the replaced config files carry the **new** `cap-kickers` / `84399764334` ids —
  Android app `…android:19fd4b460b1a4b8ae7877f`, iOS `…ios:7fb32ff2c908e9fae7877f`,
  sender `84399764334`, project `cap-kickers`, bundle/package `app.solevia.capkickers`.
  `grep` confirms **no** stale `solevia-games` / `137916049902` in either config file.
- `bun test` green — **157 pass**.
- Ran `bunx cap sync ios/android` (produced no pbxproj/Gradle diff — paths didn't move).
  Did **not** touch the plist pbxproj wiring, as instructed.
- Committed the two config files + `HANDOFF.md` + `FIREBASE-SETUP.md` and pushed.

**Left for Cowork:** nothing new. DebugView + the Google Ads conversion import now target the
**`cap-kickers`** GA4 property (`552486617`). The orphaned `solevia-games` project is still
Leandro's to delete (FIREBASE-SETUP.md "Still to do" §4).

**Uncommitted:** no — committed + pushed.

---

## 2026-09-02 · COWORK · Firebase project rebuilt as `cap-kickers`; GA renamed to one-account-per-company

**Did — console (all under `leandroviolim7@gmail.com`):**
- **The Firebase project was recreated.** The old one was named after the *company*
  (*Solevia Games* / `solevia-games`), which does not scale to several games. Nothing was in
  production, so it was rebuilt as **one project per game**. New ids — treat every
  `solevia-games` / `137916049902` value as stale:

  | | old (dead) | new |
  |---|---|---|
  | project | `solevia-games` · `137916049902` | **`cap-kickers`** · **`84399764334`** |
  | Android app | `1:137916049902:android:fb8c4cb0e44c8f479346ff` | **`1:84399764334:android:19fd4b460b1a4b8ae7877f`** |
  | iOS app | `1:137916049902:ios:55cc3167ca9a243f9346ff` | **`1:84399764334:ios:7fb32ff2c908e9fae7877f`** |
  | GA4 property | `552448669` | **`552486617`** |

- Re-registered both apps (`app.solevia.capkickers`; iOS App Store ID `6805625628`) and
  **replaced both config files in the working tree** — see below.
- **AdMob:** both apps *unlinked* from `solevia-games` and *relinked* to `cap-kickers`.
  Verified from the Firebase side: Integrations shows AdMob "2 linked apps".
  Impression-level ad revenue is account-wide and was untouched — still ON.
- **Google Ads link recreated** on property `552486617` → *Solve Via Entertainment*
  (`625-425-0746`), with **Enable Personalized Advertising OFF** again (it would flip
  Product Interaction to *Used for Tracking* on the Apple label — see FIREBASE-SETUP.md).
- **GA naming now matches the company structure Leandro wants** — account = company,
  property = game:
  - account `406365671`: "Default Account for Firebase" → **"Sole Via Entertainment"**
  - property `552486617`: `cap-kickers` → **"Cap Kickers"**
  - property `552089130`: `zen-bubbles-a0a14` → **"Zen Bubbles"** *(this is Pop Zen's live
    property — display name only, no data or stream touched)*
  - GA4 requires Business details to save a rename; all three were set to
    Games / Small 1–10 / "Understand app traffic" + "View user engagement & retention".
    Cosmetic reporting metadata only.

**Did — working tree (via the bridge, no git):**
- `apps/cap-kickers/android/app/google-services.json` — **replaced**; verified project
  `cap-kickers`, number `84399764334`, package `app.solevia.capkickers`.
- `apps/cap-kickers/ios/App/App/GoogleService-Info.plist` — **replaced**; verified bundle
  `app.solevia.capkickers`, App Store ID `6805625628`, sender `84399764334`.
- `grep` across the repo for `solevia-games` / `137916049902`: clean apart from the historical
  notes in this file and the changelog line in FIREBASE-SETUP.md.
- `apps/cap-kickers/FIREBASE-SETUP.md` — rewritten header table + a "Still to do" item 4.

**Left for Code:**
1. `bun test`, then commit. The two config files changed content but not path, so no Xcode or
   Gradle change is needed — the pbxproj wiring from 2026-09-01 still applies. Do **not**
   re-run the plist pbxproj edit.
2. Worth a `bunx cap sync` before the next device build so the native projects pick the new
   config files up.
3. DebugView verification now has to happen against the **`cap-kickers`** project, not the old one.

**Gotchas:**
- The Google Ads *account* is spelled "Sol**ve** Via Entertainment" (`625-425-0746`) — that typo
  is Google's, in Leandro's Ads account, and is unrelated to the GA account we just named
  "Sole Via Entertainment". Don't "fix" one to match the other.
- The conversion import is still blocked on real data (unchanged), and it must now be done from
  the **new** property.
- Reporting time zone on both properties was Google's default, "United Kingdom (GMT-04:00)".
  **Fixed the same day**, before any data arrived, to **United States — (GMT-04:00) New York
  Time** on *both* Cap Kickers (`552486617`) and Zen Bubbles (`552089130`). GA warns the change
  only affects data going forward; there was none, so there is no seam. Report days now break at
  US Eastern midnight — that is the boundary any day-over-day retention or ARPDAU number uses.
- The old `solevia-games` project was **deleted by Leandro on 2026-09-01 (ET)**, after Cowork
  set up the confirmation dialog for him. Firebase now returns "This project has been recently
  deleted" for it, and its GA4 property (`552448669`) is in the GA Trash with final deletion
  **Oct 6, 2026**. Google Cloud keeps the project restorable for 30 days if anything turns out
  to have depended on it — nothing should. Verified afterwards that `cap-kickers` was unaffected:
  Analytics **Enabled**, AdMob **2 linked apps**, Google Ads **1 linked account**.

**Uncommitted:** yes — the two config files and the two docs. Safe to commit.

---

## 2026-09-01 · CODE · Committed the Firebase checkpoint; verified the plist wiring + tests

**Did:**
- Verified Cowork's Firebase wiring on the Mac: `project.pbxproj` lints clean (`plutil`),
  `GoogleService-Info.plist` is in the App target (FileRef + BuildFile + group child + Resources
  phase, UUIDs `…40003/40004`). Config IDs match: plist bundle `app.solevia.capkickers`,
  `GCM_SENDER_ID 137916049902`, `GOOGLE_APP_ID …ios:55cc…9346ff`; `google-services.json` package
  matches too. My earlier `es` InfoPlist.strings entries survived Cowork's edit (still 3 refs).
- **`bun test` green — 157 pass.** `tsc` clean, `build:mobile` + `cap sync ios/android` succeed.
- **Committed the checkpoint** (was overdue): both config files, `project.pbxproj`, the cap-sync
  gradle + `Package.resolved` artifacts, `HANDOFF.md`, `CLAUDE.md`, `FIREBASE-SETUP.md`.
- Deleted `AppDelegate.swift.bak-before-firebase` (identical). **Kept**
  `project.pbxproj.bak-before-firebase` (untracked) until a device build succeeds.
- Earlier today, already committed on this branch: the **Trophy Cabinet** — soft currency "Caps"
  earned by playing + rewarded ads (NO IAP, cosmetics only, nothing gates the core loop),
  `src/game/economy/` (currency/inventory/catalog + tests), `cabinet.tsx`, new unlockable pitch/cap
  styles with picker-gating, a **real-audio sample layer IN FRONT of the synth** (`src/lib/samples.ts`
  + ambience with its own Settings toggle), and the reward-loop analytics events (added to the
  closed union — no setUserId). All strings in en/pt-BR/es (parity test passes).

**Left for Cowork:**
- Nothing blocking. The Cabinet added an in-app soft currency + cosmetic unlocks (earned by play +
  rewarded ads, **no real-money purchase**) — this keeps "In-app purchases: No" true and changes no
  store declaration. Flag it if you refile anything.
- Owner is testing on iPhone now (test-ads build synced). The Google Ads conversion import still
  waits on GA4 receiving `level_complete`/`campaign_complete` from a real device (your note).

**Gotchas:**
- Respected every DO-NOT: no setUserId / Crashlytics / Google Signals / manual `ad_impression`;
  the Settings → Usage Analytics toggle is intact.
- The 17 MB `store-assets/ads/video` + `ads/image` are intentionally left **untracked** (public-repo
  bloat) — not committed.

**Uncommitted:** no — checkpoint committed. `project.pbxproj.bak-before-firebase` left on disk
(untracked) until a device build confirms, then it can go.

---

## 2026-09-01 · COWORK · Firebase Analytics live end-to-end; Google Ads linked; audio + Xcode wiring done

**Did — console (all under `leandroviolim7@gmail.com`):**
- Created Firebase project **Solevia Games** — id `solevia-games`, number `137916049902`.
  Google Analytics enabled on the existing "Default Account for Firebase" account but with a
  **new, separate GA4 property**, so Cap Kickers data never mixes with Zen Bubbles'.
- Registered both apps:
  - Android `app.solevia.capkickers` → `1:137916049902:android:fb8c4cb0e44c8f479346ff`
  - iOS `app.solevia.capkickers` (App Store ID `6805625628`) → `1:137916049902:ios:55cc3167ca9a243f9346ff`
- **AdMob → Firebase linked for both apps**, and **impression-level ad revenue turned ON**
  (account-wide). This is what produces revenue-per-country.
- **Firebase/GA4 → Google Ads linked** to *Solve Via Entertainment* (`625-425-0746`).
- Deliberately left OFF: **Google Signals**, **Personalized Advertising** on the Ads link,
  Gemini in Firebase, Google Developer Program. See Gotchas.

**Did — working tree:**
- `apps/cap-kickers/android/app/google-services.json` — added (verified: project + package match)
- `apps/cap-kickers/ios/App/App/GoogleService-Info.plist` — added (verified: bundle + store ID match)
- `apps/cap-kickers/ios/App/App.xcodeproj/project.pbxproj` — **hand-edited** to put the plist in
  the App target: PBXFileReference + PBXBuildFile + App group child + **Resources build phase**.
  Followed the existing `PrivacyInfo.xcprivacy` pattern; UUIDs `A1B2C3D4E5F6A1B2C3D40003/40004`.
  Backup: `project.pbxproj.bak-before-firebase`. Braces/parens verified balanced.
- Earlier the same day (also Cowork): `src/lib/analytics.ts`, the 16-event vocabulary wired into
  play/tutorial/caps/pitches/settings/`__root`, the Settings → Usage Analytics opt-out,
  Spanish locale (117 keys × 3), five licence-verified audio files in `public/audio/`,
  and the docs listed below.

**Left for Code:**
1. **`bun test`** — the only build step not confirmed green. `bun install` and `bunx cap sync ios`
   are already done (verified: `Package.swift` declares `CapacitorFirebaseAnalytics`).
2. **Commit.** Two agents are editing this tree; a checkpoint is overdue.
3. **Do not** add `setUserId`, Crashlytics, Google Signals, or a manual `ad_impression` event —
   each one changes a store declaration. See `store-assets/ANALYTICS-LATAM-DISCLOSURE-PLAN.md`.
4. Delete `AppDelegate.swift.bak-before-firebase` (identical copy, no edit was needed).
   Keep `project.pbxproj.bak-before-firebase` until a build succeeds.

**Gotchas:**
- `GoogleService-Info.plist` contains `IS_ANALYTICS_ENABLED: false`. That is what the console
  emits; it is a legacy key the modern SDK ignores, and `analytics.ts` calls
  `setEnabled({enabled: true})` at startup anyway. **Do not hand-edit the plist.**
- `AppDelegate.swift` already had `FirebaseApp.configure()`, guarded on the plist existing.
  Nothing to add.
- Spanish iOS localization was already fully wired (`es` in `knownRegions` + the
  `InfoPlist.strings` variant group). Don't re-add it.
- **The Google Ads conversion import cannot be done yet and this is not an oversight.** GA4 will
  not let an event be marked a key event until it has actually received it, and Google Ads only
  lists key events GA4 has recorded. Order: ship → play a campaign level on a real device →
  wait ≤24 h → star `level_complete` + `campaign_complete` in GA4 → import in Google Ads.
- Nothing is logged on web or in `bun dev` — `Capacitor.isNativePlatform()` is false there.
  Test on a device or emulator, with DebugView.

**Uncommitted:** yes — everything above, plus Code's own economy/cabinet/samples work. Safe to commit.

**Docs:** `apps/cap-kickers/FIREBASE-SETUP.md` (setup + verification),
`apps/cap-kickers/REWARDS-AND-AUDIO-PLAN.md` (Cabinet + audio spec),
`store-assets/ANALYTICS-LATAM-DISCLOSURE-PLAN.md` (store declarations),
`store-assets/RELEASE-CHECKLIST.md` §13–14 (standing triggers).

---

## 2026-08-04 · COWORK · Zen Bubbles v1.0 App Store submission
Superseded detail lives in `CLAUDE.md`. Kept here only as a pointer so the log is complete.
