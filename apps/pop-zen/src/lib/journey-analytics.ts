/**
 * User-journey analytics helpers (v1.3) — first-time funnel flags + progression
 * user-properties. All localStorage-guarded and no-throw; safe on hot paths.
 * Event params stay snake_case + stable (registered as GA4 custom dimensions).
 */
import { track, setUserProps } from "./analytics";

/** Read a localStorage flag, treating any storage error as "not set". */
function once(key: string): boolean {
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch {
    // Storage blocked (private mode): fire every time rather than never — better
    // to slightly over-count a rare event than to lose the funnel entirely.
    return true;
  }
}

/** The very first bubble a player ever pops (onboarding funnel). */
export function markFirstPop(): void {
  if (once("zb_first_pop")) track("first_pop");
}

/** The first full run a player ever completes (onboarding funnel). */
export function markFirstRunCompleted(): void {
  if (once("zb_first_run_completed")) track("first_run_completed");
}

/**
 * Record how far the player has ever progressed. Sets `highest_world` /
 * `highest_phase` GA4 user-properties whenever a new maximum is reached, so
 * players can be segmented by "how far they ever got".
 */
export function noteMaxProgress(world: number, phase: number): void {
  try {
    const prevW = Number(localStorage.getItem("zb_highest_world") ?? 0);
    const prevP = Number(localStorage.getItem("zb_highest_phase") ?? 0);
    const props: Record<string, number> = {};
    if (world > prevW) {
      localStorage.setItem("zb_highest_world", String(world));
      props.highest_world = world;
    }
    if (phase > prevP) {
      localStorage.setItem("zb_highest_phase", String(phase));
      props.highest_phase = phase;
    }
    if (Object.keys(props).length > 0) setUserProps(props);
  } catch {
    /* storage blocked — skip */
  }
}

/** First time coins are spent on a purchase — segments spenders. */
export function markSpender(): void {
  if (once("zb_is_spender")) setUserProps({ is_spender: true });
}
