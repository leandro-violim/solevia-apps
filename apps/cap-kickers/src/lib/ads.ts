/**
 * AdMob integration for the native (Capacitor) builds. Everything here is a
 * NO-OP on web/dev, so `bun dev` and the web deploy are unaffected — AdMob only
 * runs inside the native iOS/Android app.
 *
 * Placement (per owner):
 *   • Banner  — anchored bottom, shown on MENU screens only (hidden in a game).
 *   • Interstitial — every few completed matches (any mode), frequency-capped.
 *   • Rewarded — an optional "one more shot" after a missed shot (wired later).
 *
 * TEST vs LIVE is automatic: dev build → Google TEST ads (safe to tap);
 * production build → your real LIVE ads. Force test ads in a prod build with
 * VITE_USE_TEST_ADS=true. NEVER tap your own LIVE ads (invalid-traffic risk).
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
  RewardAdPluginEvents,
  type BannerAdOptions,
} from "@capacitor-community/admob";

const IS_NATIVE = Capacitor.isNativePlatform();
const PLATFORM = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

const USE_TEST_ADS =
  import.meta.env.DEV ||
  (import.meta.env as unknown as { VITE_USE_TEST_ADS?: string }).VITE_USE_TEST_ADS === "true";

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

// TODO(owner): register "Cap Kickers" in AdMob (account pub-9628521678374705) to
// get its App ID (goes in Info.plist GADApplicationIdentifier) + create banner /
// interstitial / rewarded ad units, then paste their ids here. Format: ca-app-pub-…/…
const LIVE_IDS = {
  ios: {
    banner: "ca-app-pub-9628521678374705/0000000001",
    interstitial: "ca-app-pub-9628521678374705/0000000002",
    rewarded: "ca-app-pub-9628521678374705/0000000003",
  },
  android: {
    banner: "ca-app-pub-9628521678374705/0000000004",
    interstitial: "ca-app-pub-9628521678374705/0000000005",
    rewarded: "ca-app-pub-9628521678374705/0000000006",
  },
};

const unitIds = () => {
  const set = USE_TEST_ADS ? TEST_IDS : LIVE_IDS;
  return PLATFORM === "android" ? set.android : set.ios;
};

const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine !== false;
const now = (): number => (typeof performance !== "undefined" ? performance.now() : 0);

// ── Consent (UMP GDPR/LGPD) + iOS ATT — inlined; run before any ad id is used ──
async function runConsentAndTracking(): Promise<void> {
  try {
    const info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
  } catch (e) {
    console.warn("[ads] UMP consent skipped:", e);
  }
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
}

let initialized = false;

/** Initialize AdMob, run consent + ATT, and warm up the first interstitial. Call once at app start. */
export async function initAds(): Promise<void> {
  if (!IS_NATIVE || initialized) return;
  initialized = true;
  try {
    await AdMob.initialize();
    await runConsentAndTracking();
    setupInterstitialListeners();
    setupRewardedListeners();
    void preloadInterstitial();
    void preloadRewarded();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        void preloadInterstitial();
        void preloadRewarded();
      });
    }
  } catch (e) {
    console.warn("[ads] initialize failed:", e);
  }
}

// ── Banner (menus only) ──────────────────────────────────────────────────
// The banner is a native overlay, not DOM. Publish its height to a CSS var so a
// menu screen can reserve bottom space (padding-bottom: var(--ad-banner-h)).
let sizeListenerAdded = false;
function trackBannerSize() {
  if (sizeListenerAdded || typeof document === "undefined") return;
  sizeListenerAdded = true;
  AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { height: number }) => {
    const h = Math.max(0, Math.round(info?.height ?? 0));
    document.documentElement.style.setProperty("--ad-banner-h", `${h}px`);
  }).catch(() => {});
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

export async function showBanner(): Promise<void> {
  if (!IS_NATIVE) return;
  trackBannerSize();
  try {
    await AdMob.showBanner(bannerOptions());
  } catch (e) {
    console.warn("[ads] showBanner failed:", e);
  }
}

export async function hideBanner(): Promise<void> {
  if (typeof document !== "undefined") document.documentElement.style.setProperty("--ad-banner-h", "0px");
  if (!IS_NATIVE) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.warn("[ads] hideBanner failed:", e);
  }
}

// ── Interstitial: preload ahead, show only if loaded, never block gameplay ──
let interstitialReady = false;
let interstitialLoading = false;
let interstitialListenersAdded = false;

function setupInterstitialListeners() {
  if (interstitialListenersAdded) return;
  interstitialListenersAdded = true;
  AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
    interstitialReady = true;
    interstitialLoading = false;
  }).catch(() => {});
  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
    interstitialReady = false;
    interstitialLoading = false;
  }).catch(() => {});
}

export async function preloadInterstitial(): Promise<void> {
  if (!IS_NATIVE || interstitialReady || interstitialLoading || !isOnline()) return;
  setupInterstitialListeners();
  interstitialLoading = true;
  try {
    await AdMob.prepareInterstitial({ adId: unitIds().interstitial, isTesting: USE_TEST_ADS });
  } catch (e) {
    interstitialLoading = false;
    console.warn("[ads] interstitial preload failed (offline?):", e);
  }
}

async function showInterstitial(): Promise<void> {
  if (!IS_NATIVE) return;
  if (!interstitialReady) {
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
      void preloadInterstitial();
    };
    timer = setTimeout(finish, 15000); // never hang the game if the SDK goes quiet
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

// Frequency-cap: an interstitial every N completed matches, and not within
// INTERSTITIAL_MIN_MS of the last one, so it never feels spammy.
const MATCHES_PER_AD = 3;
const INTERSTITIAL_MIN_MS = 90_000;
let matchesSinceAd = 0;
let lastInterstitialAt = -Infinity;

/** Call when a match ends (win) or the player starts a new one. */
export async function notifyMatchEnded(): Promise<void> {
  matchesSinceAd += 1;
  if (matchesSinceAd >= MATCHES_PER_AD && now() - lastInterstitialAt > INTERSTITIAL_MIN_MS) {
    matchesSinceAd = 0;
    lastInterstitialAt = now();
    await showInterstitial();
  } else {
    void preloadInterstitial();
  }
}

// ── Rewarded: an optional extra shot (wired into gameplay in step B) ─────────
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

/** True if a rewarded ad is loaded and ready to show right now. */
export const rewardedAvailable = (): boolean => IS_NATIVE && rewardedReady;

/** Show a rewarded ad; resolves true only if the reward was actually earned. */
export async function showRewarded(): Promise<boolean> {
  if (!IS_NATIVE || !rewardedReady) return false;
  return await new Promise<boolean>((resolve) => {
    const handles: PluginListenerHandle[] = [];
    let earned = false;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      rewardedReady = false;
      handles.forEach((h) => h.remove());
      resolve(earned);
      void preloadRewarded();
    };
    timer = setTimeout(finish, 60000);
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
