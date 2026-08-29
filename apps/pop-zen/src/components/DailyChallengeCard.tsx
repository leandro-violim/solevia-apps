import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { playedToday, dailyBestToday } from "../lib/daily-challenge";
import { unlockAudio } from "../lib/pop-sound";
import { t } from "../lib/i18n";
import { CalendarIcon } from "./icons";

/**
 * Home "Daily Challenge" entry (§12). Shows today's status (best or not-yet-played)
 * and launches the date-seeded Time Attack run. Client-only read (no SSR mismatch).
 */
export function DailyChallengeCard() {
  const [status, setStatus] = useState<{ played: boolean; best: number } | null>(null);
  useEffect(() => {
    setStatus({ played: playedToday(), best: dailyBestToday() });
  }, []);

  return (
    <Link
      to="/play"
      search={{ mode: "time-attack", phase: 1, difficulty: "normal", daily: 1 }}
      onClick={() => unlockAudio()}
      className="glass-chip w-full justify-between px-4 py-3"
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        <CalendarIcon size={16} className="text-aqua" />
        {t("home.daily")}
      </span>
      <span className="text-xs text-muted-foreground">
        {status?.played ? t("home.dailyBest", { score: status.best }) : t("home.dailyPlay")}
      </span>
    </Link>
  );
}
