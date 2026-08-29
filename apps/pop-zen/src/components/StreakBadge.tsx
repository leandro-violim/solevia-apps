import { useEffect, useState } from "react";
import { getStreakDay } from "../lib/daily-bonus";
import { t } from "../lib/i18n";
import { FlameIcon } from "./icons";

/**
 * Home-screen streak badge ("Day N · 🔥"). Client-only (reads localStorage in an
 * effect) so there's no SSR hydration mismatch; renders nothing until a streak
 * exists.
 */
export function StreakBadge({ className = "" }: { className?: string }) {
  const [day, setDay] = useState(0);
  useEffect(() => {
    setDay(getStreakDay());
  }, []);
  if (day < 1) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold text-foreground ${className}`}
    >
      <FlameIcon size={14} className="text-coral" />
      {t("home.streak", { n: day })}
    </span>
  );
}
