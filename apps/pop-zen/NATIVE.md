# Publishing Bubble Pop Calm to the App Store and Play Store

This project is built as a web app in Lovable and then wrapped with
[Capacitor](https://capacitorjs.com) to produce real iOS and Android binaries
you can submit to Apple and Google.

Lovable itself does not build `.ipa` / `.aab` files — the steps below run on
your Mac (for iOS) or any machine with Android Studio (for Android) after you
export this project to GitHub and clone it locally.

## One-time setup

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# 2. Initialize using the existing capacitor.config.ts in the repo
npx cap add ios
npx cap add android
```

## Every build

```bash
npm run build          # produces the web bundle in ./dist
npx cap sync           # copies ./dist into the native projects
npx cap open ios       # opens Xcode  → Archive → upload to App Store Connect
npx cap open android   # opens Android Studio → Build → Generate signed bundle
```

## Ads (AdMob)

The web version ships **placeholder** ad slots — a bottom banner and a
between-phase full-screen video ad. Once you have an AdMob account:

1. `npm install @capacitor-community/admob`
2. Add your AdMob App ID to `capacitor.config.ts` under the `AdMob` plugin
   config, and your banner + interstitial unit IDs to environment values.
3. Replace the internals of `src/components/AdBanner.tsx` with an AdMob
   banner call and `src/components/VideoAdPlaceholder.tsx` with a rewarded
   or interstitial call. The rest of the app doesn't need to change.

## Notes

- `capacitor.config.ts` already sets the app ID (`app.solevia.zenbubbles`) and
  splash background.
- Records are stored in the device's local storage; no backend or sign-in is
  required for the store build.
- The game uses the Web Audio API for the pop sound — works fine inside a
  Capacitor WebView on both platforms.

## App icon and splash screen

Both stores require a real app icon and launch screen. Capacitor has a
first-party generator that produces every size Apple and Google need from
two source images.

1. Create two square PNGs at the project root:
   - `resources/icon.png` — 1024×1024, no transparency, no rounded corners
     (the stores round them for you).
   - `resources/splash.png` — 2732×2732, artwork centered in the middle
     ~50% (edges get cropped on some devices).

   Reuse the in-app bubble artwork on the soft mint background for
   consistency with the marketing screenshots.

2. Install and run the generator:

   ```bash
   npm install --save-dev @capacitor/assets
   npx capacitor-assets generate --iconBackgroundColor "#e6f7f5" \
     --splashBackgroundColor "#e6f7f5"
   ```

   This writes every required icon/splash size into `ios/App/App/Assets.xcassets`
   and `android/app/src/main/res/`.

3. Re-run `npx cap sync` and rebuild in Xcode / Android Studio.

## Bumping the app version

The user-visible version lives in `src/lib/settings.ts` (`APP_VERSION`). The
store versions live in the native projects:

- iOS: `ios/App/App/Info.plist` → `CFBundleShortVersionString` and
  `CFBundleVersion`.
- Android: `android/app/build.gradle` → `versionName` and `versionCode`.

Keep all three in sync for each submission (increment `CFBundleVersion` /
`versionCode` on every upload, even for the same public version).
