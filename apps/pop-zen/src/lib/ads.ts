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
  RewardAdPluginEvents,
  type BannerAdOptions,
} from "@capacitor-community/admob";
import { runConsentAndTracking } from "@solevia/consent";
import { CONFIG } from "./config";
import { track } from "./analytics";

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
    rewarded: "ca-app-pub-3940256099942544/1712485313",
  },
  android: {
    banner: "ca-app-pub-3940256099942544/6300978111",
    interstitial: "ca-app-pub-3940256099942544/1033173712",
    rewarded: "ca-app-pub-3940256099942544/5224354917",
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
    // TODO(admob): real rewarded unit (iOS) — placeholder = Google test id so it
    // never soft-locks before the real unit exists.
    rewarded: "ca-app-pub-3940256099942544/1712485313",
  },
  android: {
    // Sole Via — Bubble Pop Calm (Android). AdMob App ID:
    // ca-app-pub-9628521678374705~9477972092
    banner: "ca-app-pub-9628521678374705/3973580155",
    interstitial: "ca-app-pub-9628521678374705/1211685446",
    // TODO(admob): real rewarded units (iOS+Android) — create in AdMob console,
    // paste here. Until then production rewarded falls back to the test id below
    // so it never soft-locks (test id kept as a safe placeholder value).
    rewarded: "ca-app-pub-3940256099942544/5224354917",
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

    // Warm up the first interstitial + rewarded so they're ready at a break.
    setupInterstitialListeners();
    void preloadInterstitial();
    setupRewardedListeners();
    void preloadRewarded();

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
export async function showInterstitial(): Promise<boolean> {
  if (!IS_NATIVE) return false;

  if (!interstitialReady) {
    // Nothing ready to show — never block the game. Try to have one next time.
    void preloadInterstitial();
    return false;
  }

  return await new Promise<boolean>((resolve) => {
    const handles: PluginListenerHandle[] = [];
    let settled = false;
    let shown = false; // true only if an ad was actually displayed (Dismissed)
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      interstitialReady = false;
      handles.forEach((h) => h.remove());
      resolve(shown);
      // Warm up the next one for the following ad break.
      void preloadInterstitial();
    };
    // Safety net: if the SDK never fires Dismissed/FailedToShow (rare, but it
    // would leave the caller hung), resolve anyway after 15s.
    const timer = setTimeout(finish, 15000);
    Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        shown = true;
        finish();
      }),
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

// ── §2 Interstitial cadence gate (Better Ads Experiences) ─────────────────
// Interstitials only at natural breaks, and rate-limited: ≤1 per N completed
// runs AND a cooldown, with the first run of a session always free. All numbers
// live in CONFIG.ads.interstitial. Session-scoped counters (reset each launch).
let runsThisSession = 0;
let runsSinceInterstitial = 0;
let lastInterstitialAt = 0;

/** Call once when a run (a full play session) completes. */
export function noteRunCompleted(): void {
  runsThisSession += 1;
  runsSinceInterstitial += 1;
}

/**
 * Show an interstitial at a natural break IF the cadence allows it. Returns
 * whether one was shown. Never called mid-play / at app-open / at run-start.
 */
export async function maybeShowInterstitial(placement: string): Promise<boolean> {
  if (!IS_NATIVE) return false;
  const cfg = CONFIG.ads.interstitial;
  if (cfg.skipFirstRunOfSession && runsThisSession <= 1) return false; // first run free
  if (Date.now() - lastInterstitialAt < cfg.cooldownMs) return false; // cooldown
  if (runsSinceInterstitial < cfg.minRunsBetween) return false; // frequency cap
  const shown = await showInterstitial();
  if (shown) {
    lastInterstitialAt = Date.now();
    runsSinceInterstitial = 0;
    track("ad_interstitial_shown", { placement });
  }
  return shown;
}

// ── §3 Rewarded ads (opt-in) ──────────────────────────────────────────────
// Placements: revive (+time), double coins, shop unlock/discount. On the web/dev
// build (no native AdMob) a watch is SIMULATED as success so the reward flow is
// testable in the browser; the device build exercises the real ad. Skip / close
// / no-fill / load-fail all resolve `false` so a caller never soft-locks.
let rewardedReady = false;
let rewardedLoading = false;
let rewardedListenersAdded = false;

function setupRewardedListeners() {
  if (rewardedListenersAdded) return;
  rewardedListenersAdded = true;
  AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
    rewardedReady = true;
    rewardedLoading = false;
  }).catch(() => {});
  AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
    rewardedReady = false;
    rewardedLoading = false;
  }).catch(() => {});
}

/** Warm up a rewarded ad. No-ops if ready/loading, offline, or on web. */
export async function preloadRewarded(): Promise<void> {
  if (!IS_NATIVE || rewardedReady || rewardedLoading || !isOnline()) return;
  setupRewardedListeners();
  rewardedLoading = true;
  try {
    await AdMob.prepareRewardVideoAd({ adId: unitIds().rewarded, isTesting: USE_TEST_ADS });
  } catch (e) {
    rewardedLoading = false;
    console.warn("[ads] rewarded preload failed (offline?):", e);
  }
}

/**
 * Offer a rewarded ad for `placement`. Resolves TRUE only if the user earned the
 * reward (watched to completion). Any skip / close / no-fill / error → FALSE,
 * and the caller proceeds normally.
 */
export async function showRewarded(placement: string): Promise<boolean> {
  track("rewarded_offered", { placement });

  // Web/dev: no native AdMob — simulate a successful watch so the flow previews.
  if (!IS_NATIVE) {
    await new Promise((r) => setTimeout(r, 400));
    track("rewarded_watched", { placement, simulated: true });
    return true;
  }

  if (!rewardedReady) {
    void preloadRewarded(); // not ready → graceful decline, warm up for next time
    track("rewarded_skipped", { placement, reason: "not_ready" });
    return false;
  }

  return await new Promise<boolean>((resolve) => {
    const handles: PluginListenerHandle[] = [];
    let settled = false;
    let earned = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rewardedReady = false;
      handles.forEach((h) => h.remove());
      track(earned ? "rewarded_watched" : "rewarded_skipped", { placement });
      resolve(earned);
      void preloadRewarded(); // warm up the next one
    };
    const timer = setTimeout(finish, 40000); // safety net for a stuck SDK
    Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        earned = true;
      }),
      AdMob.addListener(RewardAdPluginEvents.Dismissed, finish),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, finish),
    ])
      .then((hs) => {
        handles.push(...hs);
        if (settled) hs.forEach((h) => h.remove());
        return AdMob.showRewardVideoAd();
      })
      .catch(finish);
  });
}
