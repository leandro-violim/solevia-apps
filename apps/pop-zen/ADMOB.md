# AdMob integration guide — Bubble Pop Calm (iOS first)

The app code is already wired for AdMob (`src/lib/ads.ts`, initialized in
`src/routes/__root.tsx`, banner via `AdBanner`, interstitial between phases in
`src/routes/play.tsx`). What's left is the plugin install, your AdMob account
setup, and the iOS native config. Follow these in order.

> **Format chosen:** bottom **banner** (always visible) + **interstitial**
> full-screen ad after phases 2, 4, and the finale. iOS first.

---

## 1. Install the plugin

```bash
cd apps/pop-zen
bun add @capacitor-community/admob
bunx cap sync            # installs the native iOS pod
```

## 2. Create your app + ad units in the AdMob console

Go to https://apps.admob.com → **Apps → Add app**.

1. Platform **iOS**. "Is your app listed on the App Store?" → **No** (it isn't
   yet). Name it **Bubble Pop Calm**. This creates the app and gives you an
   **AdMob App ID** that looks like `ca-app-pub-0000000000000000~1111111111`
   (note the **`~`**). Save it.
2. Open the app → **Ad units → Add ad unit**:
   - Create a **Banner** unit → gives an ID like `ca-app-pub-…/2222222222`
     (note the **`/`**).
   - Create an **Interstitial** unit → gives another `ca-app-pub-…/3333333333`.

You now have three IDs: one App ID (`~`) and two ad-unit IDs (`/`).

## 3. iOS native config (in Xcode)

Open the project (`bunx cap open ios`), then in the left sidebar open
**App → App → Info.plist** and add these keys (right-click → Add Row, or edit
as source). While you're testing with test ads, use Google's **sample App ID**
for `GADApplicationIdentifier` so the app doesn't crash; swap in your real App
ID when you go live (step 6).

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-3940256099942544~1458002511</string>  <!-- Google test App ID; replace with YOUR ~ App ID for release -->

<key>NSUserTrackingUsageDescription</key>
<string>Your data will be used to show you more relevant ads.</string>

<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

Notes:

- **`GADApplicationIdentifier` is mandatory** — without it the app crashes on
  launch as soon as AdMob initializes. That's why we set the test App ID now.
- For release, add Google's **full SKAdNetwork list** (dozens of entries) so ad
  attribution works — copy it from Google's docs:
  https://developers.google.com/admob/ios/quick-start#update_your_infoplist
- `NSUserTrackingUsageDescription` is the text shown in the iOS "Allow tracking?"
  prompt. Reword it however you like, but it must be present or App Review will
  reject the ATT prompt.

## 4. Build, sync, run — you should see TEST ads

```bash
bun run build:mobile
bunx cap sync
bunx cap open ios      # ▶ Run on a simulator
```

Expected on device/simulator:

- A **test banner** ("Test Ad") pinned to the bottom.
- After phase 2, a **full-screen test interstitial**; close it and the next
  phase starts.
- On a real device (not simulator) you'll also see the **ATT prompt** the first
  launch. (The simulator often skips ATT.)

`src/lib/ads.ts` is in **test mode** (`USE_TEST_ADS = true`) so these are always
Google's safe test ads. **Do not** flip to live ads just to "see real ones" and
tap them — that's invalid traffic and can get your AdMob account suspended.

## 5. If ads don't show

- Check the Xcode console for `[ads]` warnings.
- New AdMob apps can take a few hours before even test ads fill reliably.
- Make sure `bunx cap sync` ran after `bun add` (installs the pod).

## 6. Going live (do this only when you're ready to submit)

1. In `src/lib/ads.ts`, paste your real IDs into `LIVE_IDS.ios` (banner +
   interstitial) and set `USE_TEST_ADS = false`.
2. In `Info.plist`, replace the test `GADApplicationIdentifier` with your real
   App ID (the `~` one), and add Google's full SKAdNetwork list.
3. In **App Store Connect → App Privacy**, declare data collection for ads:
   typically _Identifiers → Device ID_ and _Usage Data_, used for _Third-Party
   Advertising_, linked to the user. (This is required because AdMob collects
   the advertising identifier.)
4. Update your **Privacy Policy** — it already mentions AdMob + ATT; just make
   sure the support email placeholder is filled in.
5. Rebuild, re-sync, archive, and submit.

## 7. Android (later)

When you're ready: `bunx cap add android`, create Android ad units in AdMob,
paste them into `LIVE_IDS.android`, add your Android App ID to
`android/app/src/main/AndroidManifest.xml` as
`com.google.android.gms.ads.APPLICATION_ID` meta-data, and add the
`com.google.android.gms.permission.AD_ID` permission. The shared `ads.ts`
already picks the Android IDs automatically by platform.

## About AdSense

AdSense is for **websites**, not apps — Google policy doesn't allow it inside a
native app. It would only apply if you deploy the _web_ version of pop-zen to a
public URL and want ads there. The store app uses AdMob only.
