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
import { trackInterstitialShown } from "./analytics";
import { gameAudio } from "./audio";
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

const IS_NATIVE = Capacitor.isNativePlatform();
const PLATFORM = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

const USE_TEST_ADS =
  import.meta.env.DEV ||
  (import.meta.env as unknown as { VITE_USE_TEST_ADS?: string }).VITE_USE_TEST_ADS === "true";

// Serve Google TEST CREATIVES even for the LIVE ad-unit IDs. Set
// VITE_ADMOB_TEST_DEVICE=true for a local emulator/device build to render the real
// live units safely (a "Test Ad" you can tap without invalid-traffic risk, and the
// rewarded callback still fires). NEVER set this in a store build. It only affects
// the `isTesting` request flag — the LIVE ids are still used (USE_TEST_ADS stays
// false), so this proves the live rewarded unit is wired end to end.
const TEST_CREATIVES =
  USE_TEST_ADS ||
  (import.meta.env as unknown as { VITE_ADMOB_TEST_DEVICE?: string }).VITE_ADMOB_TEST_DEVICE ===
    "true";

/** True in dev / test-ad / test-device builds. UI can relax ad gates in this mode. */
export const ADS_TEST_MODE = TEST_CREATIVES;

/** Verbose ad logging, only in test builds (visible in Logcat / Safari console). */
const dbg = (...a: unknown[]): void => {
  if (TEST_CREATIVES) console.log("[ads]", ...a);
};

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

// Live Cap Kickers ad units (AdMob account pub-9628521678374705, created 2026-08-26).
const LIVE_IDS = {
  ios: {
    banner: "ca-app-pub-9628521678374705/3371706669",
    interstitial: "ca-app-pub-9628521678374705/2058624991",
    rewarded: "ca-app-pub-9628521678374705/4750086149",
  },
  android: {
    banner: "ca-app-pub-9628521678374705/6237543151",
    interstitial: "ca-app-pub-9628521678374705/2101083525",
    rewarded: "ca-app-pub-9628521678374705/9139038667",
  },
};

const unitIds = () => {
  const set = USE_TEST_ADS ? TEST_IDS : LIVE_IDS;
  return PLATFORM === "android" ? set.android : set.ios;
};

const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine !== false;
const now = (): number => (typeof performance !== "undefined" ? performance.now() : 0);

// ── Consent + iOS ATT — inlined; run before any ad id is used ──
async function runConsentAndTracking(): Promise<void> {
  // NOTE: the Google UMP consent form is disabled at the owner's request — its
  // wording is configured in the AdMob console, not here.
  //
  // Re-enable it before launching in the EEA, the UK or Switzerland. Google
  // MANDATES a certified consent platform there, and the "European regulations"
  // message type exists in AdMob ▸ Privacy & messaging to serve it.
  //
  // It does NOT need re-enabling for Brazil or India. Checked 2026-08-26 against
  // AdMob ▸ Privacy & messaging on pub-9628521678374705: the only message types
  // offered are European regulations, US state regulations and the IDFA explainer.
  // There is no Brazil/LGPD or India/DPDP type, so turning UMP back on would show
  // those users nothing at all.
  // try {
  //   const info = await AdMob.requestConsentInfo();
  //   if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
  //     await AdMob.showConsentForm();
  //   }
  // } catch (e) {
  //   console.warn("[ads] UMP consent skipped:", e);
  // }
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
    isTesting: TEST_CREATIVES,
  };
}

// Track whether a banner is currently up. Menu→menu navigation calls showBanner
// on every route change; without this guard each call would REQUEST a brand-new
// banner, which AdMob penalizes as over-frequent loading. We instead request one
// banner when entering the menu context and keep it — the ad unit's own console
// auto-refresh (set to a compliant 30–120s) rotates the creative from there.
let bannerVisible = false;

export async function showBanner(): Promise<void> {
  if (!IS_NATIVE) return;
  if (bannerVisible) return; // already up — don't re-request (refresh-rate policy)
  bannerVisible = true;
  trackBannerSize();
  try {
    await AdMob.showBanner(bannerOptions());
  } catch (e) {
    bannerVisible = false;
    console.warn("[ads] showBanner failed:", e);
  }
}

export async function hideBanner(): Promise<void> {
  if (typeof document !== "undefined") document.documentElement.style.setProperty("--ad-banner-h", "0px");
  if (!IS_NATIVE || !bannerVisible) return;
  bannerVisible = false;
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
    await AdMob.prepareInterstitial({ adId: unitIds().interstitial, isTesting: TEST_CREATIVES });
    // prepareInterstitial resolves once the ad is loaded. Trust that resolution
    // instead of depending only on the Loaded event, which can fire before its
    // async listener is attached (fast test ads) and be missed → stuck "not ready".
    interstitialReady = true;
    interstitialLoading = false;
  } catch (e) {
    interstitialReady = false;
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
      // The ad suspended the WebAudio context; bring game sound back now that the
      // ad is gone (a native ad overlay may not fire the page-visibility resume).
      gameAudio.resumeIfSuspended();
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
    trackInterstitialShown();
    await showInterstitial();
  } else {
    void preloadInterstitial();
  }
}

/**
 * Show ONE interstitial as a casual session (2-Players / Practice) begins, then
 * hand off to notifyMatchEnded's cadence for the rest. Non-intrusive by design:
 * it only shows if an ad is already preloaded (never blocks the player waiting)
 * and obeys the same INTERSTITIAL_MIN_MS gap, so bouncing in and out of a mode
 * can't stack ads. Shown before the first flick, so no gameplay is interrupted.
 */
export async function notifyCasualStart(): Promise<void> {
  if (!IS_NATIVE) return;
  if (now() - lastInterstitialAt > INTERSTITIAL_MIN_MS) {
    lastInterstitialAt = now();
    matchesSinceAd = 0;
    trackInterstitialShown();
    await showInterstitial();
  } else {
    void preloadInterstitial();
  }
}

// ── Rewarded: an optional extra shot (wired into gameplay in step B) ─────────
let rewardedReady = false;
let rewardedLoading = false;
let rewardedListenersAdded = false;

let rewardedInflight: Promise<void> | null = null;

function setupRewardedListeners() {
  if (rewardedListenersAdded) return;
  rewardedListenersAdded = true;
  AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
    rewardedReady = true;
    rewardedLoading = false;
    dbg("rewarded Loaded (event)");
  }).catch(() => {});
  AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
    rewardedReady = false;
    rewardedLoading = false;
    dbg("rewarded FailedToLoad (event):", err);
  }).catch(() => {});
}

export function preloadRewarded(): Promise<void> {
  // In test mode ignore navigator.onLine (emulators sometimes report it wrong).
  if (!IS_NATIVE || rewardedReady || (!isOnline() && !TEST_CREATIVES)) return Promise.resolve();
  if (rewardedInflight) return rewardedInflight; // await the in-flight load, don't start a 2nd
  setupRewardedListeners();
  rewardedLoading = true;
  dbg("rewarded preload → prepare", unitIds().rewarded, "test:", TEST_CREATIVES);
  rewardedInflight = (async () => {
    try {
      // prepareRewardVideoAd RESOLVES once the ad is loaded — trust that rather than
      // depending only on the Loaded event, which can fire before its async listener
      // is attached (fast test ads) and be missed → the rewarded surfaces (retry
      // offer + Cabinet button) would then never appear.
      await AdMob.prepareRewardVideoAd({ adId: unitIds().rewarded, isTesting: TEST_CREATIVES });
      rewardedReady = true;
      dbg("rewarded ready ✓");
    } catch (e) {
      rewardedReady = false;
      console.warn("[ads] rewarded preload failed:", e);
    } finally {
      rewardedLoading = false;
      rewardedInflight = null;
    }
  })();
  return rewardedInflight;
}

/** True if a rewarded ad is loaded and ready to show right now. */
export const rewardedAvailable = (): boolean => IS_NATIVE && rewardedReady;

/**
 * Show a rewarded ad, LOADING one first if needed (awaits an in-flight load or
 * starts one). Use this for the retry/Cabinet CTAs so a tap still shows an ad that
 * wasn't preloaded yet, instead of silently doing nothing. On web returns the DEV
 * flag so the retry flow stays testable in the browser.
 */
export async function showRewardedNow(): Promise<boolean> {
  if (!IS_NATIVE) return import.meta.env.DEV;
  if (!rewardedReady) await preloadRewarded();
  dbg("showRewardedNow → ready:", rewardedReady);
  return rewardedReady ? showRewarded() : false;
}

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
      // Bring game sound back after the rewarded ad (see the interstitial note).
      gameAudio.resumeIfSuspended();
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
