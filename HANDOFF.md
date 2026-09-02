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
