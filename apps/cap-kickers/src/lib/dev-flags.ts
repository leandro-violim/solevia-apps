// Build-time test conveniences. All OFF in a normal production build (no env vars);
// set the VITE_* var for a local test build only. Never ship with these enabled.

// Show/equip EVERY cap + pitch in the pickers, bypassing ownership/progress — so you
// can test all cosmetics without earning Caps (i.e. without the rewarded ads).
export const UNLOCK_ALL =
  import.meta.env.DEV ||
  (import.meta.env as unknown as { VITE_UNLOCK_ALL?: string }).VITE_UNLOCK_ALL === "true";
