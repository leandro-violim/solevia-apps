/**
 * @solevia/consent — the shared home for user-consent gating.
 *
 * Runs, in the required order and BEFORE any advertising identifier is used:
 *   1. Google UMP (GDPR/EEA) consent — only shown where regulations require it.
 *   2. iOS App Tracking Transparency (ATT) — only if not yet determined.
 *
 * The Capacitor AdMob plugin is passed IN (dependency injection) rather than
 * imported here, so this package stays platform/plugin-agnostic and unit-testable,
 * and doesn't need the monorepo to hoist native deps into this workspace.
 */

/** The subset of the Capacitor AdMob API this flow needs. */
export interface ConsentAdMob {
  requestConsentInfo(): Promise<{
    isConsentFormAvailable?: boolean;
    status?: string;
  }>;
  showConsentForm(): Promise<unknown>;
  trackingAuthorizationStatus(): Promise<{ status?: string }>;
  requestTrackingAuthorization(): Promise<unknown>;
}

export interface ConsentOptions {
  /** Capacitor platform string: 'ios' | 'android' | 'web'. */
  platform: string;
  /** Optional logger for the best-effort (never-thrown) failures. */
  log?: (message: string, error?: unknown) => void;
}

// AdmobConsentStatus.REQUIRED and the ATT "notDetermined" status are plain
// string enum values in @capacitor-community/admob, so we compare by string and
// avoid importing the plugin.
const CONSENT_REQUIRED = "REQUIRED";
const ATT_NOT_DETERMINED = "notDetermined";

/**
 * Run the UMP consent form (where required) and then the iOS ATT prompt.
 * Both steps are best-effort: any failure is logged, never thrown, so the
 * caller's ad initialization can continue.
 */
export async function runConsentAndTracking(
  admob: ConsentAdMob,
  opts: ConsentOptions,
): Promise<void> {
  const log = opts.log ?? (() => {});

  // 1) GDPR / Google UMP consent — the form only appears where required.
  try {
    const consent = await admob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === CONSENT_REQUIRED) {
      await admob.showConsentForm();
    }
  } catch (e) {
    log("[consent] UMP consent flow skipped:", e);
  }

  // 2) iOS App Tracking Transparency — must run before the IDFA is used.
  if (opts.platform === "ios") {
    try {
      const att = await admob.trackingAuthorizationStatus();
      if (att.status === ATT_NOT_DETERMINED) {
        await admob.requestTrackingAuthorization();
      }
    } catch (e) {
      log("[consent] ATT prompt skipped:", e);
    }
  }
}
