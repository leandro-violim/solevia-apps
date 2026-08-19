/**
 * AdMob integration for the native (Capacitor) builds.
 *
 * Everything here is a NO-OP on the web/dev build — AdMob only runs inside the
 * native iOS/Android app — so `bun dev` and the web deploy are unaffected.
 *
 * Uses the @capacitor-community/admob plugin.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TEST vs LIVE ads is now automatic:
 *   • `bun dev` / development build      → Google TEST ads (safe to tap).
 *   • production build (`build:mobile`)  → your real LIVE ads.
 * So a store build can never accidentally ship test ads. To force test ads in
 * a production build (e.g. a TestFlight smoke test where you don't want to risk
 * tapping live ads), set VITE_USE_TEST_ADS=true for that build.
 * NEVER tap your own LIVE ads — Google can suspend your AdMob account for
 * invalid traffic.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  type BannerAdOptions,
} from "@capacitor-community/admob";
import { runConsentAndTracking } from "@solevia/consent";

const IS_NATIVE = Capacitor.isNativePlatform();
const PLATFORM = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// TEST ads in development, LIVE ads in production/store builds — decided at
// build time so a release can't accidentally ship test ads. Override with
// VITE_USE_TEST_ADS=true to force test ads in a production build if needed.
// (Live ads simply won't fill until your AdMob account passes payment/review;
// gameplay is never blocked when an ad doesn't show.)
const USE_TEST_ADS = import.meta.env.DEV || import.meta.env.VITE_USE_TEST_ADS === "true";

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
    // Sole Via — Bubble Pop Calm (Android). AdMob App ID:
    // ca-app-pub-9628521678374705~9477972092
    banner: "ca-app-pub-9628521678374705/3973580155",
    interstitial: "ca-app-pub-9628521678374705/1211685446",
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

    // Google UMP (GDPR) consent, then iOS ATT — in that order, BEFORE any ad
    // identifier is used. Housed in @solevia/consent so it's shared across apps.
    await runConsentAndTracking(AdMob, {
      platform: PLATFORM,
      log: (m, e) => console.warn(m, e),
    });

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
  AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { width: number; height: number }) => {
    const h = Math.max(0, Math.round(info?.height ?? 0));
    document.documentElement.style.setProperty("--ad-banner-h", `${h}px`);
    window.dispatchEvent(new CustomEvent("ad-banner-resize"));
  }).catch(() => {
    /* ignore */
  });
}

function bannerOptions(): BannerAdOptions {
  return {
    adId: unitIds().banner,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: USE_TEST_ADS,
  };
}

// When the current banner was last (re)loaded. AdMob policy: don't refresh a
// banner faster than ~30-60s or the extra impressions can be flagged as invalid.
let lastBannerAt = 0;
const BANNER_MIN_REFRESH_MS = 60_000;

/** Show the bottom banner. Safe to call more than once. */
export async function showBanner(): Promise<void> {
  if (!IS_NATIVE) return;
  trackBannerSize();
  try {
    await AdMob.showBanner(bannerOptions());
    lastBannerAt = Date.now();
  } catch (e) {
    console.warn("[ads] showBanner failed:", e);
  }
}

/**
 * Request a FRESH banner ad — e.g. when moving to a new phase — so the player
 * doesn't stare at the same creative all run. Rate-limited to once/minute to
 * stay within AdMob's banner-refresh policy; no-ops if a refresh happened
 * recently, if offline, or on web.
 */
export async function refreshBanner(): Promise<void> {
  if (!IS_NATIVE || !isOnline()) return;
  if (Date.now() - lastBannerAt < BANNER_MIN_REFRESH_MS) return;
  try {
    await AdMob.hideBanner();
    await AdMob.showBanner(bannerOptions());
    lastBannerAt = Date.now();
  } catch (e) {
    console.warn("[ads] refreshBanner failed:", e);
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      interstitialReady = false;
      handles.forEach((h) => h.remove());
      resolve();
      // Warm up the next one for the following ad break.
      void preloadInterstitial();
    };
    // Safety net: if the SDK never fires Dismissed/FailedToShow (rare, but it
    // would leave the "Next phase" button hung), resolve anyway after 15s.
    timer = setTimeout(finish, 15000);
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
