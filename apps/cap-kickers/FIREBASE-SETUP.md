# Firebase Analytics — Cap Kickers

Status as of 2026-09-02: **everything is done except three commands on the Mac,
one follow-up that has to wait for real data, and one deletion only Leandro can do.**
See "Still to do" below.

> **2026-09-02 — the project was rebuilt.** The first project was called
> *Solevia Games* (`solevia-games`), which named the *company*, not the game. Since
> nothing was in production yet it was recreated as one-project-per-game. Every id
> below is new; anything quoting `solevia-games` or `137916049902` is stale.

### ✅ Done in the console (2026-09-01, redone 2026-09-02, via Cowork)

| Item | Result |
|---|---|
| Firebase project | **Cap Kickers** — project id `cap-kickers`, number `84399764334` |
| Google Analytics | Enabled, with its **own new GA4 property** — *Cap Kickers*, property id `552486617` |
| Reporting time zone | **United States — New York Time**, set on both properties before any data arrived (Google's default was "United Kingdom GMT-04:00") |
| GA account | `406365671`, renamed **"Sole Via Entertainment"** (was "Default Account for Firebase"). One account = the company; one property per game: *Cap Kickers* (`552486617`), *Zen Bubbles* (`552089130`) |
| Android app | `app.solevia.capkickers` — app id `1:84399764334:android:19fd4b460b1a4b8ae7877f` |
| iOS app | `app.solevia.capkickers`, App Store ID `6805625628` — app id `1:84399764334:ios:7fb32ff2c908e9fae7877f` |
| `google-services.json` | downloaded, verified, committed to `android/app/` |
| `GoogleService-Info.plist` | downloaded, verified, committed to `ios/App/App/` |
| AdMob → Firebase | **both apps linked** |
| Impression-level ad revenue | **turned on** (account-wide) — this is what produces revenue-per-country |
| Google Signals | **left off**, deliberately — see §6 |
| Gemini in Firebase | left **off** (its terms allow prompts to be used for model training) |
| Google Developer Program | left **off** (unrelated enrollment, opt-in by default) |

### ✅ Also done (2026-09-01)

| Item | Result |
|---|---|
| Firebase → Google Ads | **Linked** to *Solve Via Entertainment* (`625-425-0746`) — recreated on the new property 2026-09-02 |
| Personalized Advertising on that link | **Disabled** — see below |
| `GoogleService-Info.plist` in the Xcode **App target** | **Done by editing `project.pbxproj` directly** — file reference, build file, App group membership and Resources build phase, mirroring how `PrivacyInfo.xcprivacy` was already wired. Backup at `App.xcodeproj/project.pbxproj.bak-before-firebase`. |
| `FirebaseApp.configure()` in `AppDelegate.swift` | Already present, guarded on the plist existing |
| Spanish (`es`) iOS localization | Already fully wired — `es` is in `knownRegions` and in the `InfoPlist.strings` variant group |

**Why Personalized Advertising was switched off.** The GA4↔Google Ads link offers it
on by default. It publishes Analytics audience lists and event parameters to Google
Ads *for personalisation* — which is the same effect the "don't enable Google Signals"
rule exists to prevent: it would move **Product Interaction** from *Not Used for
Tracking* to *Used for Tracking* on the Apple label and force a store re-declaration
(`ANALYTICS-LATAM-DISCLOSURE-PLAN.md` §2). Conversion import does **not** need it.
Turn it on only as a deliberate decision, with the re-declaration done first.

### ⬜ Still to do

Claude Code has since run `bun install` and `bunx cap sync ios` — verified:
`package.json` + `bun.lock` carry `@capacitor-firebase/analytics ^8.5.0` and
`firebase ^12.6.0`, and `ios/App/CapApp-SPM/Package.swift` now declares the
`CapacitorFirebaseAnalytics` package and product. So the native side is wired.

1. **`bun test`** on the Mac — the only build step not yet confirmed green here.
2. **Import the conversions in Google Ads — only after first data.** GA4 will not let
   an event be marked a key event until it has actually received it ("To mark an event
   as a key event, select the star next to the event name"), and Google Ads only lists
   key events GA4 has recorded. So the order is: ship the build → play a campaign level
   on a real device → wait up to 24 h → **GA4 Admin ▸ Data display ▸ Events ▸ star
   `level_complete` and `campaign_complete`** → then import them in
   **Google Ads ▸ Tools ▸ Conversions**. Optimise toward those, not `first_open`.
3. **Verify in DebugView** (§5) before shipping.
4. **Leandro only — delete the old `solevia-games` Firebase project.** It is orphaned:
   its apps are unlinked from AdMob and nothing in the repo points at it. Deleting a
   project is irreversible, so Cowork deliberately did not do it.
   → <https://console.firebase.google.com/u/1/project/solevia-games/settings/general>
   ▸ scroll to the bottom ▸ **Delete project** ▸ type `solevia-games` to confirm.
   Its GA4 property `solevia-games` (`552448669`) goes with it; if it lingers, bin it
   from GA Admin ▸ Property details ▸ **Move to Trash Can**.

Housekeeping: `project.pbxproj.bak-before-firebase` is the pre-edit backup — keep it
until a build succeeds, then delete. `AppDelegate.swift.bak-before-firebase` is an
identical copy (no edit was needed) and can be deleted now.

> **Note on `IS_ANALYTICS_ENABLED: false`** inside `GoogleService-Info.plist`: that
> is what the console emits and it is a legacy key the modern SDK ignores. Our code
> calls `setEnabled({enabled: true})` at startup anyway, so collection is switched on
> explicitly. Do not hand-edit the plist.

**Prior art:** Zen Bubbles already does all of this. See
`~/Downloads/zen-pop-analytics-privacy-reference.md` and
`apps/pop-zen/src/lib/analytics.ts` on the main branch. Cap Kickers copies its
design guarantees (fire-and-forget, bounded buffer, persisted opt-out that also
flips `setAnalyticsCollectionEnabled`) with one deliberate difference:

| | Pop Zen | Cap Kickers |
|---|---|---|
| SDK | Firebase **Web** SDK, dynamic import in `requestIdleCallback` | **Native** Capacitor plugin `@capacitor-firebase/analytics` |
| Config | `firebase-config.ts` (web config object) | `google-services.json` + `GoogleService-Info.plist` |
| Works on web/dev | yes | no — native builds only |
| AdMob ad-revenue linking | **not possible** | **yes** — this is why |

The web SDK runs inside the WebView and cannot see the native Google Mobile Ads
SDK, so `ad_impression` with revenue never fires. Cap Kickers needs that (two
live Google Ads campaigns, and "ad revenue per country" was the point), and it
ships on Android where install attribution needs the native SDK too. Do not
"simplify" this back to the web SDK.

**Cap Kickers needs its OWN Firebase project / GA4 property.** Reusing Pop Zen's
would mix the two apps' data. The opt-out is stored in Cap Kickers' own settings
blob (`capkickers.settings.v1`), so the two apps can never share state on-device.

---

## 1. What is already done (in this repo, uncommitted)

| File | Change |
|---|---|
| `package.json` | added `@capacitor-firebase/analytics ^8.5.0` and `firebase ^12.6.0` |
| `src/lib/analytics.ts` | **new** — the whole analytics surface. No-op on web/dev, honours the opt-out, swallows every error |
| `src/routes/__root.tsx` | `initAnalytics(settings.analytics)` at startup; `trackScreen()` on every route change |
| `src/game/settings/storage.ts` | new persisted `analytics: boolean` setting, defaults to `true` |
| `src/routes/settings.tsx` | "Usage Analytics" toggle wired to `setAnalyticsEnabled`; `language_set` event; EN/PT/ES buttons |
| `src/routes/play.tsx` | `match_start`, `match_end`, `level_complete`, `campaign_complete`, `rewarded_offered/accepted/declined` |
| `src/routes/tutorial.tsx` | `tutorial_begin`, `tutorial_complete`, `tutorial_skip{step}` |
| `src/routes/caps.tsx` / `pitches.tsx` | `cap_selected`, `pitch_selected` |
| `src/routes/privacy.tsx` | new "Usage analytics" section |
| `src/lib/i18n.ts` | analytics strings in en / pt-BR / es, plus the whole **es** locale |

**First thing to run on your Mac:**

```bash
cd apps/cap-kickers
bun install          # picks up the two new dependencies
bun test             # i18n parity test now covers all three locales
```

> The tests could not be run from the Cowork side — `node_modules` here is macOS-native
> (`@rollup/rollup-darwin-arm64`), so vitest can't start in the Linux bridge VM.
> Run `bun test` locally before building.

---

## 2. Firebase console (DONE — kept as reference)

1. <https://console.firebase.google.com> — sign in as **leandroviolim7@gmail.com**
   (the account that owns Play and AdMob; using the other account makes the
   AdMob link in step 4 impossible).
2. **Add project** → name it `Solevia Games` (one project can hold Cap Kickers,
   Zen Bubbles and anything later — do *not* make one project per app).
   Enable Google Analytics when it asks, and attach it to a Google Analytics
   account. Accept the terms yourself; do not let anyone accept them for you.
3. **Add app → Android**
   - Package name: `app.solevia.capkickers` (must match exactly)
   - Nickname: `Cap Kickers Android`
   - SHA-1: paste your **upload key** SHA-1. Not required for Analytics, but
     needed later if you ever add Google sign-in or Play Games. Get it with:
     `keytool -list -v -keystore <your keystore> -alias <your alias>`
   - Download **`google-services.json`** → put it at
     `apps/cap-kickers/android/app/google-services.json`
4. **Add app → iOS**
   - Bundle ID: `app.solevia.capkickers`
   - App Store ID: `6805625628`
   - Download **`GoogleService-Info.plist`** → put it at
     `apps/cap-kickers/ios/App/App/GoogleService-Info.plist`

> ⚠️ Both files carry API keys that are *meant* to ship inside the app binary, so
> committing them is normal and safe. What is **not** safe is a service-account
> JSON from Project settings → Service accounts — never commit one of those.

---

## 3. Native wiring (DONE except `cap sync` — kept as reference)

### Android — nothing to do

`android/build.gradle` already carries `com.google.gms:google-services:4.4.4`, and
`android/app/build.gradle` already ends with a conditional
`apply plugin: 'com.google.gms.google-services'` that fires as soon as
`google-services.json` exists. Dropping the file in is the whole step.

### iOS — two steps

1. `bunx cap sync ios` — the Capacitor CLI rewrites
   `ios/App/CapApp-SPM/Package.swift` to add the
   `CapacitorFirebaseAnalytics` package. That file is CLI-managed; never hand-edit it.
2. Add `FirebaseApp.configure()` to `ios/App/App/AppDelegate.swift`:

```swift
import UIKit
import Capacitor
import FirebaseCore          // ← add

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()   // ← add, before returning
        return true
    }
    // …rest unchanged
}
```

3. In Xcode, drag `GoogleService-Info.plist` into the **App** target (Copy items
   if needed, target membership = App). Dropping it in Finder alone is not enough —
   it must be in "Copy Bundle Resources" or Firebase crashes at launch with
   *"Could not locate configuration file"*.

### Also for iOS: the Spanish localization (DONE — already in the project)

`ios/App/App/es.lproj/InfoPlist.strings` has been created with the Spanish app
name (`Fútbol de Tapitas`). In Xcode, select the project → **Info → Localizations
→ + → Spanish**, and tick `InfoPlist.strings`, or the folder will be ignored.

---

## 4. Link AdMob → Firebase (DONE — kept as reference)

In **AdMob** (`pub-9628521678374705`) → Apps → Cap Kickers (Android) → **App
settings → Link to Firebase**, pick the `Solevia Games` project and the matching
Firebase app. Repeat for Cap Kickers (iOS).

Once both SDKs are in the same binary, the Google Mobile Ads SDK emits
`ad_impression` with estimated revenue **by itself**. Do **not** add a manual
`ad_impression` event in `analytics.ts` — you would double-count every impression
and poison the ARPDAU numbers.

---

## 4b. Link Firebase → Google Ads (link DONE; conversion import pending first data)

You have two live App campaigns — **Cap Kickers Brazil** (`24203160719`, $8/day) and
**Cap Kickers India** (`24197362737`, $7/day). Linking Firebase to Google Ads is what
closes the loop between what you spend and what those installs are worth:

1. **Firebase console → ⚙ Project settings → Integrations → Google Ads → Link.**
   Use the Google Ads account that owns both campaigns.
2. Tick **"Import conversions"** and **"Share audiences"**.
3. In **Google Ads → Tools → Conversions**, import the Firebase events worth
   optimising toward. Start with **`level_complete`** and **`campaign_complete`** —
   not `first_open`. Optimising for installs buys you installs; optimising for a
   player who finished a level buys you players.
4. Leave bidding on Install volume for now. Only switch to an in-app-action bid
   strategy once the imported conversion has ~30 events/week, or the algorithm has
   nothing to learn from.

With §4 (AdMob→Firebase) and this done, GA4 gives you **revenue per install by
country**, which is the number that says whether the ~$0.08 CPI is worth paying.
That was the open question in `store-assets/ads/CAMPAIGN-PLAN.md`, and this is what
finally answers it.

⚠️ Do **not** turn on **Google Signals** while doing any of this. Google Ads will
suggest it. It converts anonymous reporting into ads-personalisation data and flips
Apple's *Used for Tracking* answer on Product Interaction — a full store
re-declaration. Audience sharing for your own campaigns does not require it.

---

## 5. Verify before you ship

```bash
# Android — enable debug mode on a connected device
adb shell setprop debug.firebase.analytics.app app.solevia.capkickers
```

For iOS, add `-FIRDebugEnabled` in Xcode → Product → Scheme → Edit Scheme →
Run → Arguments Passed On Launch.

Then open **Firebase console → Analytics → DebugView** and walk the app:

- [ ] app open → `game_ready`, then `screen_view` with `home`
- [ ] finish the tutorial → `tutorial_begin` then `tutorial_complete`
- [ ] skip the tutorial on step 3 → `tutorial_skip` with `step = 2`
- [ ] play a campaign level → `match_start{mode:campaign}` → `level_complete{level:1}`
- [ ] lose a vs-AI match → `match_end{mode:solo_ai, result:loss, seconds:…}`
- [ ] miss a shot vs AI → `rewarded_offered`, then `rewarded_skipped` on "No thanks"
- [ ] watch the rewarded ad through → `rewarded_watched` (only when the reward lands)
- [ ] three matches → `ad_interstitial_shown`
- [ ] toggle Sound off → `setting_changed{key:sound, value:false}`
- [ ] change the language → `language_set{locale:es}`
- [ ] **Settings → Usage Analytics off** → `setting_changed{key:analytics, value:false}` lands
      first, then DebugView goes silent within a few seconds
- [ ] `ad_impression` appears after a real ad shows (release build only)

The 16 events are the whole vocabulary: `game_ready`, `tutorial_begin/complete/skip`,
`match_start/end`, `level_complete`, `campaign_complete`, `cap_selected`,
`pitch_selected`, `language_set`, `setting_changed`,
`rewarded_offered/watched/skipped`, `ad_interstitial_shown`. Pop Zen's naming
backbone (`*_start`/`*_end`, `setting_changed`, `rewarded_*`) is preserved so the
two apps' dashboards read the same way.

DebugView is the only reliable check — the standard Realtime report is delayed
and aggregated. Events take up to 24 h to reach the normal reports, so do not
panic on day one.

---

## 6. Things that will bite

- **Nothing is logged on web or in `bun dev`.** `Capacitor.isNativePlatform()`
  is false there. This is deliberate; test on a device or emulator.
- **Event and parameter names are frozen once data lands.** Firebase will not
  let you rename them later without losing history. The vocabulary lives in
  `EventName` in `analytics.ts` — add there, don't rename.
- **500 distinct event names, 25 parameters per event, 40 characters per name**
  are Firebase's hard limits. We are at 13 events, nowhere near.
- **No `setUserId` call exists anywhere and none should be added** — it would
  change the Play Data safety and Apple privacy answers from "not linked to you"
  to "linked to you", which means a store re-declaration.
- **Do not enable Google Signals** (Analytics → Data settings) without redoing
  the store disclosures. It turns anonymous reporting into ads personalization
  data and changes the Apple label.
