# Disclosure + rollout plan — Analytics and the Latin America launch

Cap Kickers · Sole Via Entertainment LLC · written 2026-09-01

Two changes ship together in the next release:

1. **Google Analytics for Firebase** is added to the binary (plus the AdMob→Firebase
   revenue link).
2. **Spanish (`es`)** is added in-app and the release opens to **all of Latin America**.

Each one invalidates a store declaration on its own. Section 2 of
`RELEASE-CHECKLIST.md` is the rule this is an instance of: *"Data safety is a
declaration of what the binary does. Adding one analytics SDK invalidates it."*

---

## 0. Order of operations

Declarations first, binary second. Over-declaring is tolerated by both stores;
under-declaring is a policy violation, and Play in particular measures your
declaration against the **currently live** app.

```
① Update Play Data safety  ─────┐
② Update Apple App Privacy  ────┤  do these BEFORE the build goes live
③ Add the es store listings ────┤
④ Add the LatAm countries   ────┘
⑤ Upload the AAB / archive the iOS build
⑥ Submit both for review, release notes in en-US + pt-BR + es-419
```

Nothing here needs the IARC questionnaire re-taken — see §5.

---

## 1. Google Play → Policy → App content → **Data safety**

The only data the new SDK adds is anonymous and aggregated. There is **no
`setUserId` call in the app**, so every new row is *not linked to the user*.

### Rows to change

| Data type | Now | After | Notes |
|---|---|---|---|
| **Device or other IDs** | Collected + **Shared**, purpose *Advertising* | same, **add purpose *Analytics*** | This is Firebase's app-instance ID. AdMob already put the row there. |
| **App activity → App interactions** | not declared | **Collected**, *not shared*, purpose *Analytics* | Screen views and the 13 custom events. |
| **Location → Approximate location** | not declared | **Collected**, *not shared*, purpose *Analytics* | Firebase derives country from the IP address. Google's own Play disclosure guidance for Analytics lists this; declare it even though we never ask for a location permission. |
| App info and performance → Crash logs | not declared | **leave off** | Only true if you add Crashlytics. We did not. |
| Personal info (name, email, user IDs) | No | **stays No** | |

### The three questions Play asks about every collected type

- *Is this data collected, shared, or both?* — **Collected only** for the two new rows.
  Google acts as our processor; that is not "shared" in Play's sense.
- *Is this data processed ephemerally?* — **No** (Firebase retains it).
- *Is data collection required, or can users choose?* — **Users can choose.**
  Say this, because it is true: Settings → Usage Analytics turns it off, and when
  it is off the SDK collects nothing at all (`setEnabled(false)`), not merely
  "we stop calling logEvent". This answer is worth the toggle on its own.

Also tick **"Data is encrypted in transit"** and **"Users can request that data
be deleted"** (Firebase supports deletion; uninstalling also resets the
app-instance ID).

---

## 2. Apple → App Store Connect → **App Privacy**

Apple's label is on the app record, not the version, and takes effect when the
next version is approved.

| Category → type | Now | After | Linked to user? | Used for tracking? |
|---|---|---|---|---|
| Identifiers → **Device ID** | Third-Party Advertising | **add "Analytics"** | No | Yes *(unchanged — this is the AdMob/ATT answer, not the Firebase one)* |
| Usage Data → **Product Interaction** | not declared | **add**, purpose *Analytics* | **No** | **No** |
| Usage Data → Advertising Data | already declared | unchanged | No | Yes |
| Location → **Coarse Location** | not declared | **add**, purpose *Analytics* | **No** | **No** |
| Diagnostics → Crash Data | not declared | **leave off** | — | — |

**"Used for tracking" stays No for everything Firebase adds.** Tracking, in
Apple's definition, means linking the data to third-party data for ads or sharing
it with a data broker. Firebase Analytics as configured here does neither.
Do not tick it, and specifically:

- **Do not enable Google Signals** in Firebase (Analytics → Data settings). It
  converts anonymous reporting into ads-personalization data and would flip
  Product Interaction to *Used for Tracking*, which is a different label and a
  different ATT story.
- **Do not set `NSPrivacyTracking` to `true`** in `PrivacyInfo.xcprivacy`.
  It is `false` today for the reason documented in the file, and Firebase ships
  its own privacy manifest that Apple aggregates. Setting it true with an empty
  `NSPrivacyTrackingDomains` is exactly what caused the **ITMS-91064** rejection
  on Zen Bubbles build 1.
- The app-level `PrivacyInfo.xcprivacy` needs **no new `NSPrivacyAccessedAPITypes`
  entry** — Firebase uses UserDefaults, already declared as `CA92.1`.

### ⚠️ The per-language privacy URL trap

Adding Spanish creates a **new, empty** privacy-policy URL field for that
localization, and Apple only validates it at "Add for Review". This is the exact
thing that blocked the 1.0 submission (`RELEASE-CHECKLIST.md` §4). After adding
the Spanish localization, go to **App Information → Localizable Information →
Spanish (Mexico)** and paste:

```
https://solevia.app/privacy/cap-kickers/
```

Do the same for the Support URL and Marketing URL fields on that localization.

---

## 3. The privacy pages themselves — already updated

Both live pages now carry the analytics disclosure, and the in-app copies match
word for word in all three languages:

| Where | State |
|---|---|
| `solevia-web/privacy/cap-kickers/index.html` | ✅ new "Usage analytics" section, dated Sept 1 2026, duplicate `</head>` fixed |
| `solevia-web/terms/cap-kickers/index.html` | ✅ new "Analytics" section, same date, duplicate `</head>` fixed |
| In-app `privacy.analyticsH` / `privacy.analyticsBody` | ✅ en, pt-BR, es |
| `solevia-web/privacy/pop-zen/*` | ⚠️ **needs the same treatment** — corrected 2026-09-01. Zen Bubbles *does* collect analytics (since v1.2); its public privacy page does not say so. Under-disclosure — see §5b. |

**Deploy the web changes before submitting**, so a reviewer following the URL
sees the analytics section. `solevia-web` is a Cloudflare auto-deploy on push.

---

## 4. Latin America availability

### Google Play → Production → Countries/regions

Add all of Latin America. The Spanish listing is `es-419`.

> Argentina, Bolivia, Brazil *(already live)*, Chile, Colombia, Costa Rica, Cuba,
> Dominican Republic, Ecuador, El Salvador, Guatemala, Honduras, Mexico,
> Nicaragua, Panama, Paraguay, Peru, Uruguay, Venezuela — plus, if you want the
> Spanish-speaking Caribbean, Puerto Rico is a US territory and is covered by the
> United States entry rather than its own.

### Apple → Pricing and Availability → Availability

Same country set. Apple lists them individually; there is no "Latin America"
preset, but the country picker has a search box.

### What this does *not* touch

**No EEA, UK or Switzerland country is on that list**, so the UMP consent form
stays off and `RELEASE-CHECKLIST.md` §9 is still satisfied. The moment any
European country is added, the consent form must be built and enabled first.

---

## 5. What does *not* need re-declaring

- **IARC content rating.** None of the eight trigger answers change. Analytics
  is not "sharing personal info with third parties" in IARC's sense — that
  question is about the user's *personal* information, and we collect none.
  Ads were already declared Yes. Rating certificate
  `e96f3ab6-57ee-8727-8d10-3f87250872e2` stands.
- **Target audience and content.** Still general audience, still not
  child-directed, still Everyone / 4+.
- **Encryption declaration.** `ITSAppUsesNonExemptEncryption` stays `false`;
  Firebase is HTTPS only, which is exempt.
- **Android developer verification.** Same package, same keys.

---

## 5b. Where this differs from the Pop Zen reference — and one thing to fix there

`~/Downloads/zen-pop-analytics-privacy-reference.md` §7 lists the values Zen Bubbles
declares. Cap Kickers matches it on the mechanics and diverges on three declaration
values. Each divergence is deliberate:

| Field | Pop Zen reference says | Cap Kickers declares | Why |
|---|---|---|---|
| Apple → **Tracking** | **No** | **Yes** (on Device ID only) | See the flag below. |
| Play → App activity **shared?** | Shared with Google | **Collected only** | Play excludes transfers to a service provider processing on your behalf. Firebase Analytics is a processor; AdMob is not, which is why **Device or other IDs** stays *shared*. Declaring App activity as shared is not wrong, just broader than reality — but pick one answer and use it on both apps. |
| Play → **Approximate location** | not declared | **declared** | Google's own Firebase Play-disclosure guidance lists it (country from IP). Over-declaring is safe; omitting it is the risk. |

### ⚠️ The Apple "Tracking" answer looks wrong in the reference doc

The reference says **Tracking: No**, hedged with *"as long as AdMob isn't linking
data for cross-app tracking / IDFA-ATT."* That condition is not met — by either app:

- Cap Kickers presents the ATT prompt (`ads.ts` calls
  `AdMob.requestTrackingAuthorization()`), and `Info.plist` justifies it with
  *"Your data will be used to show you more relevant ads."*
- Pop Zen's own `CLAUDE.md` states the opposite of the reference doc:
  *"ATT prompt and the ASC 'tracking = Yes' nutrition label remain accurate."*

Under Apple's definition, presenting ATT to use the IDFA for personalised ads **is**
tracking, and the label must say so. So:

- **Cap Kickers: answer Yes**, on **Device ID only**. Everything Firebase adds —
  Product Interaction, Coarse Location — stays **Not Used for Tracking**.
- **Check Zen Bubbles' live App Privacy label in App Store Connect.** If it says
  Tracking: No, it contradicts the shipped binary and should be corrected. If it
  says Yes (as `CLAUDE.md` claims), then it is the reference *document* that is
  wrong, and it should be amended before anyone copies it a third time.

Either way one of the two is out of step with reality, and it is worth five minutes
in ASC to find out which. An inaccurate privacy label is a removal risk, not a
warning.

### Also worth fixing while you are here

`solevia-web/privacy/pop-zen/index.html` has **no analytics section**, even though
Zen Bubbles has collected analytics since v1.2. That is an under-disclosure on the
public policy page the store listing points at. The Cap Kickers wording added today
is directly reusable — swap the app name and the event examples.

---

## 6. Release-day checklist

- [ ] `bun install && bun test` pass on the Mac (three-locale parity test included)
- [ ] `google-services.json` in `android/app/`, `GoogleService-Info.plist` in the Xcode **App target**
- [ ] DebugView shows the events listed in `apps/cap-kickers/FIREBASE-SETUP.md` §5
- [ ] Settings → Usage Analytics **off** silences DebugView
- [ ] Release build greps clean for `3940256099942544` (test ad IDs)
- [ ] `versionCode` bumped in `android/version.properties`; iOS build number bumped
- [ ] Play Data safety saved **and submitted** (it needs its own review pass)
- [ ] Apple App Privacy saved; Spanish privacy/support/marketing URLs filled in
- [ ] `es-419` Play listing + Spanish (Mexico) Apple listing published, with Spanish screenshots
- [ ] LatAm countries added on both stores
- [ ] Release notes in en-US, pt-BR **and** es-419
- [ ] AdMob → Firebase linked for both the Android and the iOS app
