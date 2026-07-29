import { describe, it, expect, vi } from "vitest";
import { runConsentAndTracking, type ConsentAdMob } from "./index";

/** A mock AdMob that records call order and lets each step be configured. */
function makeAdMob(over: Partial<Record<keyof ConsentAdMob, unknown>> = {}) {
  const calls: string[] = [];
  const admob: ConsentAdMob = {
    requestConsentInfo: vi.fn(async () => {
      calls.push("requestConsentInfo");
      return { isConsentFormAvailable: true, status: "REQUIRED" };
    }),
    showConsentForm: vi.fn(async () => {
      calls.push("showConsentForm");
    }),
    trackingAuthorizationStatus: vi.fn(async () => {
      calls.push("trackingAuthorizationStatus");
      return { status: "notDetermined" };
    }),
    requestTrackingAuthorization: vi.fn(async () => {
      calls.push("requestTrackingAuthorization");
    }),
    ...(over as Partial<ConsentAdMob>),
  };
  return { admob, calls };
}

describe("runConsentAndTracking", () => {
  it("on iOS: shows UMP consent (when required) BEFORE the ATT prompt", async () => {
    const { admob, calls } = makeAdMob();
    await runConsentAndTracking(admob, { platform: "ios" });
    expect(calls).toEqual([
      "requestConsentInfo",
      "showConsentForm",
      "trackingAuthorizationStatus",
      "requestTrackingAuthorization",
    ]);
  });

  it("skips the UMP form when consent is not required", async () => {
    const { admob, calls } = makeAdMob({
      requestConsentInfo: vi.fn(async () => ({
        isConsentFormAvailable: false,
        status: "NOT_REQUIRED",
      })),
    });
    await runConsentAndTracking(admob, { platform: "ios" });
    expect(calls).not.toContain("showConsentForm");
    // ATT still runs on iOS.
    expect(calls).toContain("requestTrackingAuthorization");
  });

  it("does NOT request ATT on Android", async () => {
    const { admob, calls } = makeAdMob();
    await runConsentAndTracking(admob, { platform: "android" });
    expect(calls).not.toContain("trackingAuthorizationStatus");
    expect(calls).not.toContain("requestTrackingAuthorization");
  });

  it("does NOT re-prompt ATT when already determined", async () => {
    const { admob, calls } = makeAdMob({
      trackingAuthorizationStatus: vi.fn(async () => ({
        status: "authorized",
      })),
    });
    await runConsentAndTracking(admob, { platform: "ios" });
    expect(calls).not.toContain("requestTrackingAuthorization");
  });

  it("never throws if a consent step fails, and still runs ATT", async () => {
    const logged: string[] = [];
    const { admob, calls } = makeAdMob({
      requestConsentInfo: vi.fn(async () => {
        throw new Error("UMP boom");
      }),
    });
    await expect(
      runConsentAndTracking(admob, {
        platform: "ios",
        log: (m) => logged.push(m),
      }),
    ).resolves.toBeUndefined();
    expect(calls).toContain("requestTrackingAuthorization");
    expect(logged.some((m) => m.includes("UMP"))).toBe(true);
  });
});
