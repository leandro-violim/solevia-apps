import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_VERSION, useSoundSetting, useVibrationSetting } from "../lib/settings";
import { usePhaseRecords } from "../lib/records";
import { track, setAnalyticsEnabled, isAnalyticsEnabled } from "../lib/analytics";
import { t } from "../lib/i18n";
import { HowToPlay } from "../components/Onboarding";
import { PlayIcon } from "../components/icons";
import { isMusicEnabled, setMusicEnabled } from "../lib/music";

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

/**
 * F1: ONE toggle row for every Settings switch — identical label column, a
 * right-aligned `shrink-0` switch, and the same height/padding — so Sound,
 * Vibration, and Analytics line up exactly.
 */
function ToggleRow({
  label,
  desc,
  checked,
  onToggle,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

const CARD = "mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm";

function SettingsPage() {
  const { enabled, toggle } = useSoundSetting();
  const { enabled: vibrationEnabled, toggle: toggleVibration } = useVibrationSetting();
  const { reset } = usePhaseRecords();
  const [howToOpen, setHowToOpen] = useState(false);

  // F7 music toggle (persisted). Read on the client to avoid SSR mismatch.
  const [musicOn, setMusicOn] = useState(true);
  useEffect(() => setMusicOn(isMusicEnabled()), []);
  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
    track("setting_changed", { key: "music", value: next });
  };

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
      className="screen-fade mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10"
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
        <ToggleRow
          label={t("settings.popSound")}
          desc={t("settings.popSoundDesc")}
          checked={enabled}
          onToggle={() => {
            toggle(!enabled);
            track("setting_changed", { key: "sound", value: !enabled });
          }}
        />
        <div className="mt-3 border-t border-border/50 pt-3">
          <ToggleRow
            label={t("settings.music")}
            desc={t("settings.musicDesc")}
            checked={musicOn}
            onToggle={toggleMusic}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t("settings.reduceMotion")}</p>
      </section>

      <section className={CARD}>
        <ToggleRow
          label={t("settings.vibration")}
          desc={t("settings.vibrationDesc")}
          checked={vibrationEnabled}
          onToggle={() => {
            toggleVibration(!vibrationEnabled);
            track("setting_changed", { key: "vibration", value: !vibrationEnabled });
          }}
        />
        <p className="mt-3 text-[11px] text-muted-foreground">{t("settings.vibrationFollow")}</p>
      </section>

      <section className={CARD}>
        <ToggleRow
          label={t("settings.analytics")}
          desc={t("settings.analyticsDesc")}
          checked={analyticsOn}
          onToggle={toggleAnalytics}
        />
      </section>

      {/* F6: How to Play — on demand (no longer auto-shown on launch). */}
      <section className={CARD}>
        <button
          type="button"
          onClick={() => setHowToOpen(true)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{t("onboarding.title")}</div>
            <div className="text-xs text-muted-foreground">{t("settings.howToPlayDesc")}</div>
          </div>
          <PlayIcon size={18} className="shrink-0 text-primary" />
        </button>
      </section>

      <section className={CARD}>
        <div className="text-sm font-medium text-foreground">{t("settings.yourData")}</div>
        <p className="mt-1 text-xs text-muted-foreground">{t("settings.dataDesc")}</p>
        <button
          onClick={() => {
            if (confirm(t("settings.resetConfirm"))) {
              reset();
              alert(t("settings.resetDone"));
            }
          }}
          className="btn btn-ghost mt-3 w-full text-sm text-destructive"
        >
          {t("settings.resetBtn")}
        </button>
      </section>

      <section className={CARD}>
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

      <HowToPlay open={howToOpen} onClose={() => setHowToOpen(false)} />
    </main>
  );
}
