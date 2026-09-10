import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_VERSION, useSoundSetting, useVibrationSetting } from "../lib/settings";
import { usePhaseRecords } from "../lib/records";
import { track, setAnalyticsEnabled, isAnalyticsEnabled } from "../lib/analytics";
import { t } from "../lib/i18n";
import { HowToPlay } from "../components/Onboarding";
import { PlayIcon } from "../components/icons";
import { ScreenShell } from "../components/gameshell";
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
      { property: "og:description", content: "Sound, records, and app info." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

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
        <div className="text-sm font-bold" style={{ color: "var(--gs-ink)" }}>
          {label}
        </div>
        {desc && <div className="text-xs gs-muted">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[color:var(--gs-green-2)]" : "bg-black/20"
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

function SettingsPage() {
  const { enabled, toggle } = useSoundSetting();
  const { enabled: vibrationEnabled, toggle: toggleVibration } = useVibrationSetting();
  const { reset } = usePhaseRecords();
  const [howToOpen, setHowToOpen] = useState(false);

  const [musicOn, setMusicOn] = useState(true);
  useEffect(() => setMusicOn(isMusicEnabled()), []);
  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
    track("setting_changed", { key: "music", value: next });
  };

  const [analyticsOn, setAnalyticsOn] = useState(true);
  useEffect(() => setAnalyticsOn(isAnalyticsEnabled()), []);
  const toggleAnalytics = () => {
    const next = !analyticsOn;
    setAnalyticsOn(next);
    setAnalyticsEnabled(next);
    track("setting_changed", { key: "analytics", value: next });
  };

  const ink = { color: "var(--gs-ink)" };

  return (
    <ScreenShell title={t("settings.title")} nav="settings">
      <div className="space-y-4 pt-2">
        <section className="gs-panel p-4">
          <ToggleRow
            label={t("settings.popSound")}
            desc={t("settings.popSoundDesc")}
            checked={enabled}
            onToggle={() => {
              toggle(!enabled);
              track("setting_changed", { key: "sound", value: !enabled });
            }}
          />
          <div className="mt-3 border-t border-black/10 pt-3">
            <ToggleRow
              label={t("settings.music")}
              desc={t("settings.musicDesc")}
              checked={musicOn}
              onToggle={toggleMusic}
            />
          </div>
          <p className="mt-3 text-[11px] gs-muted">{t("settings.reduceMotion")}</p>
        </section>

        <section className="gs-panel p-4">
          <ToggleRow
            label={t("settings.vibration")}
            desc={t("settings.vibrationDesc")}
            checked={vibrationEnabled}
            onToggle={() => {
              toggleVibration(!vibrationEnabled);
              track("setting_changed", { key: "vibration", value: !vibrationEnabled });
            }}
          />
          <p className="mt-3 text-[11px] gs-muted">{t("settings.vibrationFollow")}</p>
        </section>

        <section className="gs-panel p-4">
          <ToggleRow
            label={t("settings.analytics")}
            desc={t("settings.analyticsDesc")}
            checked={analyticsOn}
            onToggle={toggleAnalytics}
          />
        </section>

        <section className="gs-panel p-4">
          <button
            type="button"
            onClick={() => setHowToOpen(true)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div className="min-w-0">
              <div className="text-sm font-bold" style={ink}>
                {t("onboarding.title")}
              </div>
              <div className="text-xs gs-muted">{t("settings.howToPlayDesc")}</div>
            </div>
            <PlayIcon size={18} className="shrink-0" style={{ color: "var(--gs-green-2)" }} />
          </button>
        </section>

        <section className="gs-panel p-4">
          <div className="text-sm font-bold" style={ink}>
            {t("settings.yourData")}
          </div>
          <p className="mt-1 text-xs gs-muted">{t("settings.dataDesc")}</p>
          <button
            onClick={() => {
              if (confirm(t("settings.resetConfirm"))) {
                reset();
                alert(t("settings.resetDone"));
              }
            }}
            className="gs-btn gs-btn--coral mt-3 w-full px-4 py-2.5 text-sm"
          >
            {t("settings.resetBtn")}
          </button>
        </section>

        <section className="gs-panel p-4">
          <div className="text-sm font-bold" style={ink}>
            {t("settings.about")}
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link
                to="/about"
                className="font-semibold underline"
                style={{ color: "var(--gs-blue-2)" }}
              >
                {t("link.aboutSupport")}
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="font-semibold underline"
                style={{ color: "var(--gs-blue-2)" }}
              >
                {t("link.privacyPolicy")}
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="font-semibold underline"
                style={{ color: "var(--gs-blue-2)" }}
              >
                {t("link.termsOfUse")}
              </Link>
            </li>
          </ul>
          <div className="mt-4 text-[11px] gs-muted">Zen Bubbles · v{APP_VERSION}</div>
        </section>
      </div>

      <HowToPlay open={howToOpen} onClose={() => setHowToOpen(false)} />
    </ScreenShell>
  );
}
