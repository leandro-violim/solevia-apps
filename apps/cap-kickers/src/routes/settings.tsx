import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { loadSettings, patchSettings, type Settings } from "../game/settings/storage";
import { gameAudio } from "../lib/audio";
import { pitchStyleById } from "../game/pitches/styles";
import { loadPitchStyleId } from "../game/pitches/storage";
import { styleById } from "../game/caps/styles";
import { loadCapStyleId } from "../game/caps/storage";
import { APP_VERSION } from "./-legal-doc";
import { useT, useLocale, setLocale, LOCALES } from "../lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Cap Kickers — Settings" }] }),
  component: SettingsPage,
});

/** Chunky arcade on/off switch row. */
function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_4px_0_#cdddd3] transition active:translate-y-0.5"
    >
      <span className="font-display text-lg uppercase tracking-wide text-foreground">{label}</span>
      <span
        className="relative h-8 w-14 rounded-full transition-colors"
        style={{
          background: on ? "#1fb457" : "#cbd8cf",
          boxShadow: on ? "inset 0 2px 0 #128040" : "inset 0 2px 0 #b3c4b9",
        }}
      >
        <span
          className="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all"
          style={{ left: on ? 30 : 4 }}
        />
      </span>
    </button>
  );
}

/** A row that navigates to a picker, showing the current selection. */
function NavRow({ to, label, value }: { to: string; label: string; value: string }) {
  return (
    <Link
      to={to}
      className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_4px_0_#cdddd3] transition active:translate-y-0.5"
    >
      <span className="font-display text-lg uppercase tracking-wide text-foreground">{label}</span>
      <span className="font-display text-sm uppercase tracking-wide text-muted-foreground">{value} ›</span>
    </Link>
  );
}

function SettingsPage() {
  const t = useT();
  const locale = useLocale();
  const [s, setS] = useState<Settings>(() => loadSettings());
  const update = (patch: Partial<Settings>) => {
    const next = patchSettings(patch);
    setS(next);
    gameAudio.setSettings(next); // apply mute/music live
  };

  // Current selections (read once; these persist in their own stores).
  const pitch = pitchStyleById(loadPitchStyleId());
  const cap = styleById(loadCapStyleId());

  return (
    <div
      className="flex min-h-dvh flex-col items-center px-6 py-8"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
    >
      <h1 className="font-display text-5xl uppercase tracking-tight text-foreground">
        {t("settings.title")}
      </h1>

      <div className="mt-7 flex w-full max-w-sm flex-col gap-3">
        <Toggle label={t("settings.soundFx")} on={s.sound} onToggle={() => update({ sound: !s.sound })} />
        <Toggle label={t("settings.music")} on={s.music} onToggle={() => update({ music: !s.music })} />
        <Toggle label={t("settings.vibration")} on={s.vibration} onToggle={() => update({ vibration: !s.vibration })} />

        {/* Language: device-detected default, override here. */}
        <div className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_4px_0_#cdddd3]">
          <span className="font-display text-lg uppercase tracking-wide text-foreground">
            {t("settings.language")}
          </span>
          <div className="flex gap-1.5">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className="font-display rounded-full px-3.5 py-1.5 text-sm uppercase tracking-wide transition"
                style={
                  locale === l
                    ? { background: "#1fb457", color: "#fff", boxShadow: "0 3px 0 #128040" }
                    : { background: "#eef4f0", color: "#5f7869" }
                }
              >
                {l === "en" ? "EN" : "PT"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 h-px w-full bg-border" />

        <NavRow to="/pitches" label={t("settings.pitch")} value={t(`pitch.${pitch.id}`)} />
        <NavRow to="/caps" label={t("settings.yourCap")} value={cap.name} />

        <div className="mt-2 h-px w-full bg-border" />

        <NavRow to="/about" label={t("settings.aboutLegal")} value={`v${APP_VERSION}`} />
      </div>

      <Link
        to="/"
        className="font-display mt-8 w-full max-w-sm rounded-full bg-white py-3.5 text-center text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
      >
        {t("common.back")}
      </Link>
    </div>
  );
}
