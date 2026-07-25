/**
 * AdMob integration for the native (Capacitor) builds.
 *
 * Everything here is a NO-OP on the web/dev build — AdMob only runs inside the
 * native iOS/Android app — so `bun dev` and the web deploy are unaffected.
 *
 * Uses the @capacitor-community/admob plugin.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BEFORE YOU SHIP TO THE STORE:
 *   1. Paste your real AdMob ad unit ids into LIVE_IDS below.
 *   2. Set USE_TEST_ADS = false.
 * While USE_TEST_ADS is true you'll see Google's TEST ads (safe to tap).
 * NEVER tap your own LIVE ads during testing — Google can suspend your
 * AdMob account for invalid traffic. That's why this defaults to test mode.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  type BannerAdOptions,
} from "@capacitor-community/admob";

const IS_NATIVE = Capacitor.isNativePlatform();
const PLATFORM = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// While true, Google's official TEST ad units are used and `isTesting` is set,
// so you always get safe test ads. The iOS LIVE_IDS below are already your real
// units — but KEEP THIS true until BOTH: (1) your AdMob account has passed
// payment setup + review, and (2) you're building a real store release. Live
// ads won't fill on an unapproved account, and tapping your own live ads can
// get the account suspended.
const USE_TEST_ADS = true;

// Google's official sample ad unit ids — safe to build and tap.
const TEST_IDS = {
  ios: {
    banner: "ca-app-pub-3940256099942544/2934735716",
    interstitial: "ca-app-pub-3940256099942544/4411468910",
  },
  android: {
    banner: "ca-app-pub-3940256099942544/6300978111",
    interstitial: "ca-app-pub-3940256099942544/1033173712",
  },
};

// TODO(Leandro): paste your real AdMob ad unit ids here (from the AdMob
// console → your app → Ad units). Keep the format exactly: ca-app-pub-…/…
const LIVE_IDS = {
  ios: {
    // Sole Via — Bubble Pop Calm (iOS). AdMob App ID:
    // ca-app-pub-9628521678374705~5486523715
    banner: "ca-app-pub-9628521678374705/2860360372",
    interstitial: "ca-app-pub-9628521678374705/7191467566",
  },
  android: {
    // TODO: create the Android app + ad units in AdMob and paste them here.
    banner: "ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB",
    interstitial: "ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII",
  },
};

function unitIds() {
  const set = USE_TEST_ADS ? TEST_IDS : LIVE_IDS;
  return PLATFORM === "android" ? set.android : set.ios;
}

let initialized = false;

/**
 * Initialize AdMob, run the GDPR consent flow (Google UMP), and — on iOS —
 * show the App Tracking Transparency prompt. Call once at app start.
 */
export async function initAds(): Promise<void> {
  if (!IS_NATIVE || initialized) return;
  initialized = true;
  try {
    await AdMob.initialize();

    // GDPR / consent. The form is only shown where regulations require it.
    try {
      const consent = await AdMob.requestConsentInfo();
      if (
        consent.isConsentFormAvailable &&
        consent.status === AdmobConsentStatus.REQUIRED
      ) {
        await AdMob.showConsentForm();
      }
    } catch (e) {
      console.warn("[ads] consent flow skipped:", e);
    }

    // iOS App Tracking Transparency — required before the IDFA can be used.
    if (PLATFORM === "ios") {
      try {
        const att = await AdMob.trackingAuthorizationStatus();
        if (att.status === "notDetermined") {
          await AdMob.requestTrackingAuthorization();
        }
      } catch (e) {
        console.warn("[ads] ATT prompt skipped:", e);
      }
    }

    // Warm up the first interstitial so it's ready between phases.
    setupInterstitialListeners();
    void preloadInterstitial();

    // Recover ads automatically when connectivity returns (e.g. the player
    // was offline, then reconnects mid-session).
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        void showBanner();
        void preloadInterstitial();
      });
    }
  } catch (e) {
    console.warn("[ads] initialize failed:", e);
  }
}

// Publish the real (native) banner height to CSS + a DOM event so the game can
// size the play field to exactly clear the banner. The AdMob banner is a native
// overlay, not a DOM element, so this is the only reliable way to know its size.
let sizeListenerAdded = false;
function trackBannerSize() {
  if (sizeListenerAdded) return;
  sizeListenerAdded = true;
  AdMob.addListener(
    BannerAdPluginEvents.SizeChanged,
    (info: { width: number; height: number }) => {
      const h = Math.max(0, Math.round(info?.height ?? 0));
      document.documentElement.style.setProperty("--ad-banner-h", `${h}px`);
      window.dispatchEvent(new CustomEvent("ad-banner-resize"));
    },
  ).catch(() => {
    /* ignore */
  });
}

/** Show the bottom banner. Safe to call more than once. */
export async function showBanner(): Promise<void> {
  if (!IS_NATIVE) return;
  trackBannerSize();
  const options: BannerAdOptions = {
    adId: unitIds().banner,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: USE_TEST_ADS,
  };
  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.warn("[ads] showBanner failed:", e);
  }
}

export async function hideBanner(): Promise<void> {
  if (!IS_NATIVE) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.warn("[ads] hideBanner failed:", e);
  }
}

// ── Interstitial: preload ahead of time, show only if already loaded ──────
// Preloading means the play screen never waits on a network request between
// phases. If an ad isn't loaded (offline, flaky connection, or no fill) we
// simply skip it and let gameplay continue — an ad never blocks the game.
let interstitialReady = false;
let interstitialLoading = false;
let interstitialListenersAdded = false;

/** Best-effort connectivity check (no extra plugin needed). */
function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function setupInterstitialListeners() {
  if (interstitialListenersAdded) return;
  interstitialListenersAdded = true;
  AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
    interstitialReady = true;
    interstitialLoading = false;
  }).catch(() => {
    /* ignore */
  });
  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
    interstitialReady = false;
    interstitialLoading = false;
  }).catch(() => {
    /* ignore */
  });
}

/**
 * Warm up the next interstitial in the background. Safe to call often — it
 * no-ops if one is already loaded/loading, if the device is offline, or on web.
 * Call it early (e.g. when a phase starts) so an ad is ready by phase end.
 */
export async function preloadInterstitial(): Promise<void> {
  if (!IS_NATIVE || interstitialReady || interstitialLoading || !isOnline()) {
    return;
  }
  setupInterstitialListeners();
  interstitialLoading = true;
  try {
    await AdMob.prepareInterstitial({
      adId: unitIds().interstitial,
      isTesting: USE_TEST_ADS,
    });
    // `interstitialReady` flips true via the Loaded event above.
  } catch (e) {
    interstitialLoading = false;
    console.warn("[ads] interstitial preload failed (offline?):", e);
  }
}

/**
 * Show the interstitial ONLY if one is already loaded, then resolve when it's
 * dismissed. If nothing is loaded (offline / no fill / not preloaded yet),
 * resolve immediately so gameplay is never blocked, and kick off a preload for
 * next time. Awaited by the play screen between phases.
 */
export async function showInterstitial(): Promise<void> {
  if (!IS_NATIVE) return;

  if (!interstitialReady) {
    // Nothing ready to show — never block the game. Try to have one next time.
    void preloadInterstitial();
    return;
  }

  await new Promise<void>((resolve) => {
    const handles: PluginListenerHandle[] = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      interstitialReady = false;
      handles.forEach((h) => h.remove());
      resolve();
      // Warm up the next one for the following ad break.
      void preloadInterstitial();
    };
    Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finish),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finish),
    ])
      .then((hs) => {
        handles.push(...hs);
        if (settled) hs.forEach((h) => h.remove());
        return AdMob.showInterstitial();
      })
      .catch(finish);
  });
}
