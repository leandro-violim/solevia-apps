import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { playedToday, dailyBestToday } from "../lib/daily-challenge";
import { unlockAudio } from "../lib/pop-sound";
import { trackModeSelected } from "../lib/mode";
import { t } from "../lib/i18n";
import { CalendarIcon } from "./icons";

/**
 * Home "Daily Challenge" — the timed mode (§12). It's the Time Attack engine on a
 * date-seeded board (same for everyone each day), which is the retention loop:
 * a new challenge daily, a running best + streak + the daily coin reward, and it's
 * replayable through the day. Rendered as the prominent second mode button next to
 * Zen. Client-only status read (no SSR mismatch).
 */
export function DailyChallengeCard() {
  const [status, setStatus] = useState<{ played: boolean; best: number } | null>(null);
  useEffect(() => {
    setStatus({ played: playedToday(), best: dailyBestToday() });
  }, []);

  return (
    <div className="w-full">
      <Link
        to="/play"
        search={{ mode: "time-attack", phase: 1, difficulty: "normal", daily: 1 }}
        onClick={() => {
          unlockAudio();
          trackModeSelected("time-attack");
        }}
        className="btn btn-primary w-full gap-2 py-4 text-base"
      >
        <CalendarIcon size={18} />
        {t("home.daily")}
      </Link>
      <div className="mt-1.5 text-xs text-muted-foreground">
        {status?.played ? t("home.dailyBest", { score: status.best }) : t("home.dailyNew")}
      </div>
    </div>
  );
}
