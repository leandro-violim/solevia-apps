/**
 * Firebase Analytics (P1-T6) — lightweight, fully async, fire-and-forget.
 *
 * Guarantees: `track()` never awaits, never throws into game code, and is safe on
 * any hot path. The Firebase SDK is loaded ONLY after first paint (idle) and only
 * if supported; until then events buffer in a small bounded queue and flush once
 * the SDK is ready. If loading fails or the device is offline, events are simply
 * dropped — gameplay is never affected. LGPD/GDPR opt-out via setAnalyticsEnabled.
 */
import { firebaseConfig } from "./firebase-config";

export type Params = Record<string, string | number | boolean | undefined>;

let _log: ((n: string, p?: Params) => void) | null = null;
let _enabled = true;
let _setCollection: ((on: boolean) => void) | null = null;
let _setProps: ((p: Record<string, string>) => void) | null = null;
const _queue: Array<[string, Params | undefined]> = [];
const _propsQueue: Record<string, string> = {};
const MAX_QUEUE = 100;
let _lastScreen: string | null = null;

try {
  _enabled = localStorage.getItem("zb_analytics_opt_out") !== "1";
} catch {
  /* SSR / storage disabled — default enabled */
}

/** Fire-and-forget. Safe anywhere incl. hot paths. Never throws, never awaits. */
export function track(name: string, params?: Params): void {
  if (!_enabled) return;
  if (_log) {
    try {
      _log(name, params);
    } catch {
      /* analytics must never break gameplay */
    }
    return;
  }
  if (_queue.length < MAX_QUEUE) _queue.push([name, params]);
}

/**
 * Log a navigation as GA4 `screen_view` (with `previous_screen`). Consecutive
 * duplicates are de-duped so a re-render doesn't double-count. Fire on every
 * route change.
 */
export function logScreenView(name: string): void {
  if (name === _lastScreen) return;
  const previous_screen = _lastScreen ?? undefined;
  _lastScreen = name;
  track("screen_view", { screen_name: name, previous_screen });
}

/**
 * Set GA4 user properties (persist across sessions, for segmentation). Values are
 * coerced to strings (GA4 user-property values are strings). Buffered until the
 * SDK is ready, and a no-op when analytics is opted out. Never throws.
 */
export function setUserProps(props: Record<string, string | number | boolean | undefined>): void {
  if (!_enabled) return;
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) if (v !== undefined) clean[k] = String(v);
  if (Object.keys(clean).length === 0) return;
  if (_setProps) {
    try {
      _setProps(clean);
    } catch {
      /* analytics must never break gameplay */
    }
  } else {
    Object.assign(_propsQueue, clean);
  }
}

export function isAnalyticsEnabled(): boolean {
  return _enabled;
}

export function setAnalyticsEnabled(on: boolean): void {
  _enabled = on;
  try {
    localStorage.setItem("zb_analytics_opt_out", on ? "0" : "1");
  } catch {
    /* ignore */
  }
  _setCollection?.(on);
}

/** Call ONCE, after first paint (idle). Loads Firebase off the critical path. */
export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  const start = () =>
    import("firebase/app")
      .then(async ({ initializeApp }) => {
        const {
          getAnalytics,
          logEvent,
          setAnalyticsCollectionEnabled,
          setUserProperties,
          isSupported,
        } = await import("firebase/analytics");
        if (!(await isSupported())) return;
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        setAnalyticsCollectionEnabled(analytics, _enabled);
        _setCollection = (on) => setAnalyticsCollectionEnabled(analytics, on);
        _log = (n, p) => logEvent(analytics, n, p);
        _setProps = (p) => setUserProperties(analytics, p);
        for (const [n, p] of _queue) {
          try {
            _log(n, p);
          } catch {
            /* ignore */
          }
        }
        _queue.length = 0;
        if (Object.keys(_propsQueue).length > 0) {
          try {
            _setProps(_propsQueue);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 0);
}
