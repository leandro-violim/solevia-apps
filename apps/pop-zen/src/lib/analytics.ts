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
const _queue: Array<[string, Params | undefined]> = [];
const MAX_QUEUE = 100;

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
        const { getAnalytics, logEvent, setAnalyticsCollectionEnabled, isSupported } =
          await import("firebase/analytics");
        if (!(await isSupported())) return;
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        setAnalyticsCollectionEnabled(analytics, _enabled);
        _setCollection = (on) => setAnalyticsCollectionEnabled(analytics, on);
        _log = (n, p) => logEvent(analytics, n, p);
        for (const [n, p] of _queue) {
          try {
            _log(n, p);
          } catch {
            /* ignore */
          }
        }
        _queue.length = 0;
      })
      .catch(() => {});
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 0);
}
