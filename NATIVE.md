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

- `capacitor.config.ts` already sets the app ID (`com.bubblepop.calm`) and
  splash background. Change `appId` before your first store submission if
  you want a different bundle identifier.
- Records are stored in the device's local storage; no backend or sign-in is
  required for the store build.
- The game uses the Web Audio API for the pop sound — works fine inside a
  Capacitor WebView on both platforms.