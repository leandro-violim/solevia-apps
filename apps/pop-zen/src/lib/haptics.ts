/**
 * Light haptic feedback for bubble pops, via the Capacitor Haptics plugin.
 *
 * No-op on web / non-native. On iOS it only fires when the phone's System
 * Haptics setting is on, so it automatically respects the user's device
 * preference. Note: iPhones have a single Taptic Engine, so the tap is felt
 * device-wide — it can't be localized to where the bubble was on screen.
 */
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const IS_NATIVE = Capacitor.isNativePlatform();

/** A crisp, light tap — fired the instant a bubble pops. */
export function popHaptic() {
  if (!IS_NATIVE) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    /* haptics unavailable / disabled — ignore */
  });
}
