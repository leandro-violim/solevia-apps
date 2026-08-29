/**
 * ─────────────────────────────────────────────────────────────────────────
 * Analytics (§11) — real event API, pluggable backend.
 * ─────────────────────────────────────────────────────────────────────────
 * CHOICE (owner, 2026-08-29): FIREBASE Analytics — it's Google, so it links to
 * the app's AdMob for ad-revenue-per-player, and has a first-class Capacitor
 * plugin. The event model here is name + flat params, which maps straight onto
 * Firebase `logEvent(name, params)`. The SDK is NOT bundled yet — until the
 * owner creates the Firebase app and provides keys (iOS + Android), `track()`
 * runs in no-op/sandbox mode (console in dev).
 *
 * IMPORTANT: feature code calls `track(...)` for real — these are NOT TODO stubs.
 * At the release step, wire the Firebase adapter once via `setAnalyticsBackend()`
 * (e.g. @capacitor-firebase/analytics `logEvent`) and every event starts flowing.
 * No feature code changes.
 */

export type AnalyticsEvent =
  | "session_start"
  | "run_start"
  | "run_end"
  | "rewarded_offered"
  | "rewarded_watched"
  | "rewarded_skipped"
  | "interstitial_shown"
  | "daily_bonus_shown"
  | "daily_bonus_claimed"
  | "streak_day"
  | "coins_earned"
  | "coins_spent"
  | "skin_unlocked"
  | "skin_equipped"
  | "achievement_unlocked"
  | "objective_completed"
  | "mode_selected"
  | "daily_challenge_played";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

type Backend = (event: AnalyticsEvent, params: AnalyticsParams) => void;
let backend: Backend | null = null;

/** Wire the real SDK adapter once keys are available (release step). */
export function setAnalyticsBackend(fn: Backend | null): void {
  backend = fn;
}

/** Fire an analytics event. Real call — no-op backend until an SDK is wired. */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (backend) {
    try {
      backend(event, params);
    } catch {
      /* analytics must never break gameplay */
    }
  }
  if (import.meta.env.DEV) console.debug(`%c[analytics] ${event}`, "color:#3aa", params);
}

let sessionStarted = false;
/** Fire once per app session (call from app bootstrap / first screen). */
export function startAnalyticsSession(): void {
  if (sessionStarted) return;
  sessionStarted = true;
  track("session_start");
}
