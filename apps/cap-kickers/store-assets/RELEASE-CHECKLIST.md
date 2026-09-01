# Release checklist — run this before EVERY store update

Sole Via Entertainment · Cap Kickers / Zen Bubbles
Last verified: 2026-09-01

The point of this file: most of the store paperwork is **declarations**, not code. A declaration
that was true for 1.0 and is no longer true for 1.1 is a policy violation even when the app itself
is fine. Google and Apple do not re-ask — they assume your old answers still hold. Walk this list
whenever the diff touches anything in the "Trigger" column.

---

## 1. IARC content rating (Google Play → Policy → App content → Content rating)

The IARC certificate (Global Rating ID `e96f3ab6-57ee-8727-8d10-3f87250872e2` for Cap Kickers)
is bound to the *answers*, not to the app. Change an answer and the rating must be re-taken, or
IARC can revoke it — which pulls the app from Play.

**Re-take the questionnaire if the update adds any of these:**

| Trigger | Currently declared |
|---|---|
| In-app purchases / paid items / currency | **No** |
| User-to-user interaction (chat, comments, multiplayer with strangers) | **No** |
| User-generated content shown to others | **No** |
| Sharing the user's location with other users | **No** |
| Sharing personal info with third parties | **No** |
| Violence, blood, scary imagery, gambling/simulated gambling, alcohol/drug/tobacco references | **No** |
| Leaderboards / profiles with user-chosen names | **No** — a nickname field counts as user-generated content |
| Ads | **Yes** (already declared — changing ad formats does *not* require re-taking) |

Same questionnaire also feeds Apple's age rating. If you change an answer on Play, change it on
App Store Connect → App Information → Age Rating too, or the two stores disagree.

## 2. Google Play — Data safety (Policy → App content → Data safety)

**Trigger:** any new SDK, any new network call, any new stored field, analytics, crash reporting,
login, or a change in what AdMob collects.

Data safety is a *declaration of what the binary does*. Adding one analytics SDK invalidates it.

## 3. Google Play — Target audience, Ads, Government apps, News, COVID, Financial features

**Trigger:** changing the age bands you target (Families policy attaches below 13), removing ads,
adding a paid tier.

## 4. Apple — App Privacy nutrition label (App Store Connect → App Privacy)

**Trigger:** same as Data safety. Also: the **privacy policy URL is per-language**. If you add a
new localisation, that localisation's URL field starts empty and Apple only validates it at
"Add for Review" — this is exactly what blocked the 1.0 submission.
Current URL: `https://solevia.app/privacy/cap-kickers/`

## 5. Apple — Encryption declaration

`ITSAppUsesNonExemptEncryption` in Info.plist. **Trigger:** adding any crypto beyond HTTPS.

## 6. Apple — Privacy manifest (`PrivacyInfo.xcprivacy`)

**Trigger:** adding any SDK, or using a new "required reason" API (file timestamps, disk space,
system boot time, active keyboards, UserDefaults).

## 7. Android developer verification (Play Console → Android developer verification)

Both package names are **Registered** as of Aug 31 2026, 3 keys each; identity verified Aug 20 2026.

**Trigger:** a brand-new app (new package name → must be registered before Sep 30 2026 rules bite),
or signing something **outside** Play with a key Google doesn't hold — then add that key's SHA-256
under the package's "Add key". Rotating the upload key also means adding the new fingerprint.

## 8. Target API level / SDK deadlines

Play raises the required `targetSdkVersion` every August. **Trigger:** the calendar. Check
Play Console → Policy status before each release; a stale target level blocks new uploads.

## 9. Ads / consent (`src/lib/ads.ts`)

The UMP consent form is **off**. It must be **on before shipping to the EEA, UK or Switzerland**
(Google mandates a certified CMP there). Not needed for Brazil or India — AdMob offers no message
type for either. **Trigger:** adding any EEA/UK/CH country to the release countries.

Also: live ad unit IDs vs TEST_IDS auto-switch — confirm a release build carries the live IDs
(`3371706669` interstitial, `6237543151` banner) and **zero** occurrences of `3940256099942544`.

## 10. Version bookkeeping

- Android `versionCode` must strictly increase (`android/version.properties`).
- iOS build number must increase within the same version string.
- Release notes in **both** en-US and pt-BR on Play; "What's New" on Apple.

## 11. Keystore hygiene

- Keystore lives at `~/keys/capkickers-upload.jks`. **Never** commit `.aab` or `keystore.properties`.
- Upload cert SHA-256: `C6:13:58:DC:AB:A6:8C:3B:C5:21:57:96:22:7B:05:32:8D:34:43:73:27:CF:EE:82:CA:BA:2A:2B:BE:5B:22:DF`
- Back up the keystore + password somewhere that is not this laptop. Losing it ends the app.

---

## Quick pass/fail

Before hitting "Submit for review" on either store, all of these must be true:

- [ ] No new SDK, network call, or stored field since last release — or Data safety **and** App Privacy updated
- [ ] No new IAP / chat / UGC / location sharing — or IARC questionnaire re-taken on Play and age rating updated on Apple
- [ ] No new store language — or its privacy URL filled in on Apple
- [ ] targetSdkVersion still meets Play's current floor
- [ ] versionCode / build number incremented
- [ ] Release build greps clean for test ad IDs
- [ ] If shipping to EEA/UK/CH: UMP consent form re-enabled

---

## 12. First launch only — link the store listing in AdMob

A new AdMob app sits at **"Requires review · Limited ad serving"** until its store listing is
public and linked. Do it from **AdMob ▸ Apps ▸ the app's row ▸ "Add store"** — this edits the
*existing* app ID. Do **not** use the "Finish setup" prompt on the Apps-to-confirm tab: its
pre-selected default creates a **new** AdMob app, orphaning the ID already compiled into the
shipped binary.

Then AdMob reviews for 2–3 days, the app flips to **Ready · Ad serving enabled**, and app-ads.txt
starts verifying against the store listing's website URL automatically.

Done for Cap Kickers Android on 2026-08-31 (`ca-app-pub-9628521678374705~4321826253`) —
reached **Ready · Ad serving enabled** the same day.

Done for Cap Kickers iOS on 2026-09-01 (`~1368359859`, App Store ID `6805625628`).

**Gotcha found doing the iOS one:** AdMob's store search would NOT find the app by name or by
its numeric App Store ID, even though the listing was live. Pasting the full App Store URL
(`https://apps.apple.com/us/app/cap-kickers/id6805625628`) found it immediately. Try the URL
before concluding the listing isn't live.

**Second gotcha:** after saving the store link, AdMob reports *"We couldn't verify Cap Kickers
(iOS) — your details don't match the information in your AdMob account."* This is app-ads.txt
crawl lag, not a misconfiguration: AdMob's own banner says it can take **up to 7 days** to detect
domain URLs from Apple App Store listings. Verified on 2026-09-01 that everything on our side is
correct — `https://solevia.app/app-ads.txt` serves exactly
`google.com, pub-9628521678374705, DIRECT, f08c47fec0942fa0`, and the listing's Developer Website
is `https://solevia.app/`. Nothing to fix; the row flips to Ready on its own once Google re-crawls.
Do not re-run the store link or edit app-ads.txt in response to this message.


---

## 13. Analytics — added 2026-09-01

Cap Kickers now ships **Google Analytics for Firebase** plus the AdMob→Firebase revenue link.

**Correction (2026-09-01):** an earlier version of this section said Zen Bubbles has no Firebase.
That was wrong. Zen Bubbles has had GA4 analytics, an opt-out and matching store declarations since
v1.2 — the work simply isn't on the `solevia-cap-kickers` worktree's branch, which is the only
checkout Cowork can see. The reference is
`~/Downloads/zen-pop-analytics-privacy-reference.md`; the code is in `apps/pop-zen/src/lib/analytics.ts`
on the main branch.

⚠️ **Consequence: the Pop Zen privacy pages on solevia-web are out of date.**
`solevia-web/privacy/pop-zen/index.html` has no analytics section at all, even though the app
collects analytics. That is an under-disclosure and should be fixed — copy the "Usage analytics"
section from `privacy/cap-kickers/index.html`, adjusted for Pop Zen's own event set.

**Setup and verification:** `solevia-cap-kickers/apps/cap-kickers/FIREBASE-SETUP.md`
**Store declarations:** `store-assets/ANALYTICS-LATAM-DISCLOSURE-PLAN.md`

New standing triggers for future releases:

| Trigger | What it breaks |
|---|---|
| Adding an event to `EventName` in `src/lib/analytics.ts` | Nothing, if it stays anonymous. Adding anything free-text or identifying re-opens Data safety + App Privacy. |
| Calling `setUserId` anywhere | Flips every Play/Apple row from *not linked* to *linked to the user*. Don't. |
| Enabling **Google Signals** in Firebase → Analytics → Data settings | Flips Apple's *Used for Tracking* to Yes on Product Interaction. Full re-declaration. |
| Adding Crashlytics or Performance Monitoring | Adds *Crash logs* / *Diagnostics* rows on both stores. |
| Adding a manual `ad_impression` event | Double-counts revenue against the AdMob link. The Google Mobile Ads SDK already emits it. |
| Removing the **Settings → Usage Analytics** toggle | Changes Play's *"users can choose"* answer to *"collection is required"*. |

## 14. Languages — Spanish added 2026-09-01

In-app locales are now **en · pt-BR · es** (116 keys each; `i18n.test.ts` fails the build if they
drift apart). On-device app name is localized in all three
(`values-es/strings.xml`, `es.lproj/InfoPlist.strings`).

**Trigger:** every new locale needs (a) its 116 in-app strings, (b) a Play store listing
translation, (c) an Apple localization — and (d) **that Apple localization's privacy, support and
marketing URLs filled in by hand**, because they start empty and are only validated at
"Add for Review". Store locales in use: Play `en-US`, `pt-BR`, `es-419` · Apple English,
Portuguese (Brazil), Spanish (Mexico).
