# For Cowork — after the 1.2 binaries are built

Code has finished its side of Cap Kickers 1.2: release line merged + tagged
(`capkickers-v1.2` on the `cap-kickers` branch), signed Android AAB built, audio and
localization done. Below is everything Cowork owns to get 1.2 into review. **Do not press
Submit and do not tick any legal/policy/export/IARC boxes — those are Leandro's alone.**

## Versions to match on both consoles
- **Android**: versionName **1.2**, versionCode **4**
- **iOS**: **1.2**, build **3**

## 1. Upload the binaries as a draft release (coordinate with Leandro)
- **Play Console** → Cap Kickers → Production (or Internal testing first) → create release →
  upload the **signed AAB** (`android/app/build/outputs/bundle/release/app-release.aab`,
  versionCode 4). Do not roll out — leave it as a draft for Leandro to review + submit.
- **App Store Connect** → the 1.2 build (build 3) uploaded from Xcode. Create the 1.2 version,
  attach the build. Leave at "Prepare for Submission" for Leandro.

## 2. Screenshots — REPLACE the old set (biggest reviewer-risk item)
New captures are in `store-assets/screenshots-1.2/` (organized by locale, per device tier).
Replace the 1.1 screenshots on **both** stores, in all three store locales:
- Play: `en-US`, `pt-BR`, `es-419`
- Apple: English, Portuguese (Brazil), Spanish (Mexico)
Also the **Play feature graphic** (1024×500) is in there.

## 3. "What's New" — paste from `store-assets/RELEASE-NOTES-1.2.md`
Three locales, ready as-is:
- Play: en-US + pt-BR (es-419 if the listing has it)
- Apple: English + Portuguese (Brazil) + Spanish (Mexico)
The notes say "a new menu theme" and never name the track — accurate, no edit needed.

## 4. Ad creatives / campaigns
`store-assets/ads-1.2/` holds the Google Ads image assets (square/landscape/portrait) and
the feature graphic. Apple Search Ads pulls from the new App Store screenshots by default.

## 5. Things to know
- **Countries unchanged** (US, CA, NZ, AU, BR, IN, LatAm-Spanish). No EEA/UK/CH, so UMP stays
  off — do not add a European country without telling Code to re-enable UMP first.
- **AdMob rewarded-interstitial units** (iOS `…/3205796533`, Android `…/6209670726`) can take up
  to an hour to start serving; an empty ad in that window is not a bug.
- **Menu theme Content ID**: the new track ("Brazil Football Carnival Samba") is Content-ID
  registered. Fine inside the app, but don't score a YouTube ad creative with it without checking.

## Left for Leandro (not Cowork)
IARC Terms, export-compliance, the Play policy checkboxes, and **pressing Submit** on both
stores.
