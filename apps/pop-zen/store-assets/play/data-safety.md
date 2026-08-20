# Zen Bubbles — Google Play Data Safety answers

Copy-paste guide for the **Data safety** section of the Play Console.
The app itself collects **no** first-party personal data (best scores & settings live only
in on-device storage and never leave the device). The only data collection comes from the
**Google Mobile Ads (AdMob) SDK**. Answers below follow Google's official AdMob Data-safety
guidance — cross-check against the current AdMob guidance page before submitting, since
Google updates it.

---

## Overview questions
- **Does your app collect or share any of the required user data types?** → **Yes**
  (via the AdMob SDK — not by our own code.)
- **Is all of the user data collected by your app encrypted in transit?** → **Yes**
- **Do you provide a way for users to request that their data be deleted?** → **No**
  (No accounts and no personal data are stored by the app; point users to the privacy policy.)

---

## Data types to declare (all from AdMob)

### Location → Approximate location
- **Collected:** Yes · **Shared:** Yes
- **Purposes:** Advertising or marketing
- **Required or optional:** Optional (subject to consent)
- Reason: AdMob may infer coarse location from IP for ad delivery.

### Device or other IDs
- **Collected:** Yes · **Shared:** Yes
- **Purposes:** Advertising or marketing; Analytics; Fraud prevention, security & compliance
- **Required or optional:** Required
- Reason: the Advertising ID is used to serve and measure ads (gated behind the UMP consent flow).

### App activity → App interactions *(declare if AdMob reports it for your setup)*
- **Collected:** Yes · **Shared:** Yes
- **Purposes:** Advertising or marketing; Analytics
- Reason: ad interaction events (impressions, clicks) for measurement.

> If Google's current AdMob guidance also lists **App info and performance → Diagnostics**
> (crash/performance data) for your integration, declare it too:
> Collected: Yes · Shared: No · Purpose: Analytics.

---

## NOT collected (do not declare)
- **Best scores, phase records, sound/vibration settings** — stored only in on-device
  localStorage; never transmitted, so this is "stored on device," not "collected."
- No name, email, phone, contacts, photos, files, messages, or account data.

---

## Consistency checklist (keep these three in agreement)
1. **Data safety form** (this doc)
2. **Privacy policy** at https://solevia.app/privacy — must disclose AdMob + advertising ID use
3. **AdMob / UMP consent** — the in-app consent flow (`@solevia/consent`) must be configured
   with a UMP message before distributing in the EEA/UK. Currently US-only, which keeps this
   simple for the first release.

**Ads declaration:** on the "Ads" question set **"Yes, my app contains ads."**
