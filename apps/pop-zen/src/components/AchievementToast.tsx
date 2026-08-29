import { useEffect, useState } from "react";
import type { Achievement } from "../lib/achievements";
import { t } from "../lib/i18n";
import { TrophyIcon } from "./icons";

/**
 * Global achievement-unlock toast (§10). Listens for the "zen-achievement"
 * window event fired by checkAchievements() and shows a brief gold banner. Lives
 * in the root layout so it appears from any screen.
 */
export function AchievementToast() {
  const [ach, setAch] = useState<Achievement | null>(null);
  useEffect(() => {
    const onUnlock = (e: Event) => {
      const a = (e as CustomEvent<Achievement>).detail;
      setAch(a);
      window.setTimeout(() => setAch(null), 3200);
    };
    window.addEventListener("zen-achievement", onUnlock);
    return () => window.removeEventListener("zen-achievement", onUnlock);
  }, []);
  if (!ach) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="zc-milestone inline-flex items-center gap-1.5">
        <TrophyIcon size={16} />
        {t("ach.unlocked")} · {t(ach.labelKey, { n: ach.goal })}
      </div>
    </div>
  );
}
