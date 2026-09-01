/**
 * Google Analytics for Firebase — Cap Kickers.
 *
 * Design mirrors the Pop Zen engine (`apps/pop-zen/src/lib/analytics.ts`) —
 * fire-and-forget, never on the critical path, bounded buffer, persisted
 * opt-out that also flips the SDK's own collection switch — with ONE
 * deliberate difference, documented here so nobody "fixes" it later:
 *
 *   Pop Zen loads the **Firebase Web SDK** (`firebase/app` + `firebase/analytics`)
 *   dynamically inside `requestIdleCallback`. Cap Kickers uses the **native
 *   Capacitor plugin** (`@capacitor-firebase/analytics`) instead, because:
 *     • AdMob → Firebase ad-revenue linking only emits `ad_impression` with
 *       revenue when the NATIVE Firebase SDK is in the binary. The web SDK
 *       running inside the WKWebView/Android WebView does not see the native
 *       Google Mobile Ads SDK at all, so "ad revenue per country" — the thing
 *       we actually want — is impossible on the web path.
 *     • Cap Kickers ships on Android too, where install attribution and
 *       `first_open` need the native SDK to be meaningful.
 *     • The two live Google Ads App campaigns (Brazil, India) read conversions
 *       from the native integration.
 *   The cost: nothing is logged on web or in `bun dev` (see IS_NATIVE below).
 *   That is the correct trade for a store-only game.
 *
 * WHAT WE SEND — deliberately small and non-identifying:
 *   • no user id, no email, no name, no precise location
 *   • no `setUserId` call anywhere; Firebase's app-instance id is enough
 *   • event params are enums/booleans/small ints, never free text
 *
 * AD REVENUE: we do NOT log revenue ourselves. Linking AdMob → Firebase in the
 * AdMob console makes the Google Mobile Ads SDK emit `ad_impression` with
 * revenue automatically. Do not add a manual ad_impression event — it would
 * double-count every impression.
 *
 * The opt-out lives in the app's own settings blob (`capkickers.settings.v1`),
 * which is already app-namespaced, so Cap Kickers and Pop Zen can never share
 * analytics state on the same device.
 */
import { Capacitor } from "@capacitor/core";
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";

const IS_NATIVE = Capacitor.isNativePlatform();

/**
 * `null` until `initAnalytics` has run. Events fired before that are buffered
 * rather than sent, so an opted-out player can never leak a single event in the
 * window between first paint and `setEnabled(false)` resolving.
 */
let enabled: boolean | null = null;
let ready = false;

/** Bounded so a broken init can never grow this without limit. */
const MAX_QUEUE = 100;
const queue: Array<{ name: EventName; params: EventParams }> = [];

/** The full event vocabulary. Adding an event here is the only way to send one. */
export type EventName =
  | "game_ready"
  | "tutorial_begin"
  | "tutorial_complete"
  | "tutorial_skip"
  | "match_start"
  | "match_end"
  | "level_complete"
  | "campaign_complete"
  | "cap_selected"
  | "pitch_selected"
  | "language_set"
  | "setting_changed"
  | "rewarded_offered"
  | "rewarded_watched"
  | "rewarded_skipped"
  | "ad_interstitial_shown"
  // ── Trophy Cabinet / reward loop (REWARDS-AND-AUDIO-PLAN.md §4) ──
  | "cabinet_opened"
  | "locked_item_tapped"
  | "item_unlocked"
  | "item_equipped"
  | "currency_earned"
  | "currency_spent"
  | "audio_previewed"
  | "rewarded_unlock_offered"
  | "rewarded_unlock_taken";

export type EventParams = Record<string, string | number | boolean>;

const emit = (name: EventName, params: EventParams): void => {
  void FirebaseAnalytics.logEvent({ name, params }).catch(() => {
    /* never let telemetry break gameplay */
  });
};

/** Fire-and-forget. Never awaits, never throws into game code. */
const send = (name: EventName, params: EventParams = {}): void => {
  if (!IS_NATIVE) return;
  if (enabled === null) {
    // Not initialised yet — buffer, dropping the newest once full.
    if (queue.length < MAX_QUEUE) queue.push({ name, params });
    return;
  }
  if (!enabled) return;
  emit(name, params);
};

/**
 * Call once at app start with the persisted setting. Safe to call repeatedly.
 * When the player has opted out we tell the SDK to collect nothing at all,
 * rather than merely skipping our own logEvent calls — that is what lets us
 * answer Play's "users can choose" question honestly.
 */
export const initAnalytics = async (optedIn: boolean): Promise<void> => {
  if (!IS_NATIVE) {
    enabled = false;
    queue.length = 0;
    return;
  }
  try {
    await FirebaseAnalytics.setEnabled({ enabled: optedIn });
    ready = true;
  } catch {
    ready = false;
  }
  enabled = optedIn;
  // Flush whatever happened during startup — or bin it if they opted out.
  const buffered = queue.splice(0, queue.length);
  if (optedIn) for (const e of buffered) emit(e.name, e.params);
};

/** Flip the player's opt-in at runtime (Settings → Usage Analytics). */
export const setAnalyticsEnabled = async (optedIn: boolean): Promise<void> => {
  enabled = optedIn;
  if (!optedIn) queue.length = 0;
  if (!IS_NATIVE) return;
  try {
    await FirebaseAnalytics.setEnabled({ enabled: optedIn });
  } catch {
    /* ignore */
  }
};

export const isAnalyticsEnabled = (): boolean => enabled === true;
export const analyticsReady = (): boolean => ready;

/** Screen views — Firebase's own screen_view, so funnels line up with events. */
export const trackScreen = (screenName: string): void => {
  if (!IS_NATIVE || enabled !== true) return;
  void FirebaseAnalytics.setCurrentScreen({ screenName }).catch(() => {});
};

// ── The event vocabulary, one thin function each ────────────────────────────

export const trackGameReady = (): void => send("game_ready");

export const trackTutorialBegin = (): void => send("tutorial_begin");
export const trackTutorialComplete = (): void => send("tutorial_complete");
/** `step` = 0-based index of the step the player bailed on. */
export const trackTutorialSkip = (step: number): void => send("tutorial_skip", { step });

export type GameMode = "campaign" | "pass_play" | "practice" | "solo_ai";
export type Difficulty = "easy" | "normal" | "hard";

export const trackMatchStart = (mode: GameMode, difficulty?: Difficulty): void =>
  send("match_start", difficulty ? { mode, difficulty } : { mode });

/** `result` from the local player's point of view; `seconds` rounded. */
export const trackMatchEnd = (mode: GameMode, result: "win" | "loss", seconds: number): void =>
  send("match_end", { mode, result, seconds: Math.round(seconds) });

export const trackLevelComplete = (level: number): void => send("level_complete", { level });
export const trackCampaignComplete = (): void => send("campaign_complete");

export const trackCapSelected = (capId: string): void => send("cap_selected", { cap_id: capId });
export const trackPitchSelected = (pitchId: string): void =>
  send("pitch_selected", { pitch_id: pitchId });
export const trackLanguageSet = (locale: string): void => send("language_set", { locale });

/** Mirrors Pop Zen's `setting_changed` so the two apps' dashboards match. */
export const trackSettingChanged = (key: string, value: string | number | boolean): void =>
  send("setting_changed", { key, value });

export const trackRewardedOffered = (): void => send("rewarded_offered");
/** Fired only when the reward was actually earned — matches Pop Zen's naming. */
export const trackRewardedWatched = (): void => send("rewarded_watched");
export const trackRewardedSkipped = (): void => send("rewarded_skipped");

export const trackInterstitialShown = (): void => send("ad_interstitial_shown");

// ── Trophy Cabinet / reward loop (§4). Every param is an enum, id, or number. ──

export type ItemType = "pitch" | "cap" | "audio";
export type UnlockMethod = "progress" | "coins" | "rewarded";

export const trackCabinetOpened = (from: string): void => send("cabinet_opened", { from });
/** The intent signal: what players want but can't afford yet. */
export const trackLockedItemTapped = (itemId: string, itemType: ItemType, affordable: boolean): void =>
  send("locked_item_tapped", { item_id: itemId, item_type: itemType, affordable });
export const trackItemUnlocked = (itemId: string, itemType: ItemType, method: UnlockMethod): void =>
  send("item_unlocked", { item_id: itemId, item_type: itemType, method });
export const trackItemEquipped = (itemId: string, itemType: ItemType): void =>
  send("item_equipped", { item_id: itemId, item_type: itemType });
export const trackCurrencyEarned = (source: string, amount: number): void =>
  send("currency_earned", { source, amount });
export const trackCurrencySpent = (itemId: string, amount: number): void =>
  send("currency_spent", { item_id: itemId, amount });
export const trackAudioPreviewed = (packId: string): void => send("audio_previewed", { pack_id: packId });
export const trackRewardedUnlockOffered = (itemId: string): void =>
  send("rewarded_unlock_offered", { item_id: itemId });
export const trackRewardedUnlockTaken = (itemId: string): void =>
  send("rewarded_unlock_taken", { item_id: itemId });

/** Test seam: reset module state between unit tests. */
export const __resetAnalyticsForTests = (): void => {
  enabled = null;
  ready = false;
  queue.length = 0;
};
