import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_VERSION, useSoundSetting, useVibrationSetting } from "../lib/settings";
import { usePhaseRecords } from "../lib/records";
import { track, setAnalyticsEnabled, isAnalyticsEnabled } from "../lib/analytics";
import { t } from "../lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Zen Bubbles" },
      {
        name: "description",
        content: "Adjust sound, reset your records, and view app version for Zen Bubbles.",
      },
      { property: "og:title", content: "Settings — Zen Bubbles" },
      {
        property: "og:description",
        content: "Sound, records, and app info.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { enabled, toggle } = useSoundSetting();
  const { enabled: vibrationEnabled, toggle: toggleVibration } = useVibrationSetting();
  const { reset } = usePhaseRecords();

  // Analytics opt-out (P1-T6, LGPD/GDPR). Read on the client to avoid SSR mismatch.
  const [analyticsOn, setAnalyticsOn] = useState(true);
  useEffect(() => setAnalyticsOn(isAnalyticsEnabled()), []);
  const toggleAnalytics = () => {
    const next = !analyticsOn;
    setAnalyticsOn(next);
    setAnalyticsEnabled(next);
    track("setting_changed", { key: "analytics", value: next });
  };

  return (
    <main
      className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground">
          {t("common.home")}
        </Link>
        <h1 className="text-lg font-semibold text-foreground">{t("settings.title")}</h1>
        <div className="w-10" />
      </header>

      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{t("settings.popSound")}</div>
            <div className="text-xs text-muted-foreground">{t("settings.popSoundDesc")}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              toggle(!enabled);
              track("setting_changed", { key: "sound", value: !enabled });
            }}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t("settings.reduceMotion")}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{t("settings.vibration")}</div>
            <div className="text-xs text-muted-foreground">{t("settings.vibrationDesc")}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={vibrationEnabled}
            onClick={() => {
              toggleVibration(!vibrationEnabled);
              track("setting_changed", { key: "vibration", value: !vibrationEnabled });
            }}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              vibrationEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                vibrationEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t("settings.vibrationFollow")}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{t("settings.analytics")}</div>
            <div className="text-xs text-muted-foreground">{t("settings.analyticsDesc")}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={analyticsOn}
            onClick={toggleAnalytics}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              analyticsOn ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                analyticsOn ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="text-sm font-medium text-foreground">{t("settings.yourData")}</div>
        <p className="mt-1 text-xs text-muted-foreground">{t("settings.dataDesc")}</p>
        <button
          onClick={() => {
            if (confirm(t("settings.resetConfirm"))) {
              reset();
              alert(t("settings.resetDone"));
            }
          }}
          className="mt-3 w-full rounded-full border border-rose-300 bg-background py-3 text-sm font-medium text-rose-600"
        >
          {t("settings.resetBtn")}
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="text-sm font-medium text-foreground">{t("settings.about")}</div>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <Link to="/about" className="text-primary underline">
              {t("link.aboutSupport")}
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="text-primary underline">
              {t("link.privacyPolicy")}
            </Link>
          </li>
          <li>
            <Link to="/terms" className="text-primary underline">
              {t("link.termsOfUse")}
            </Link>
          </li>
        </ul>
        <div className="mt-4 text-[11px] text-muted-foreground">Zen Bubbles · v{APP_VERSION}</div>
      </section>
    </main>
  );
}
