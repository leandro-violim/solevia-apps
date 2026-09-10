import { useEffect, useRef, useState } from "react";
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
  const hideTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const onUnlock = (e: Event) => {
      const a = (e as CustomEvent<Achievement>).detail;
      setAch(a);
      // Re-arm the hide timer for the LATEST toast so back-to-back unlocks each
      // get their full display time (an earlier timer must not clear a later one).
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setAch(null), 3200);
    };
    window.addEventListener("zen-achievement", onUnlock);
    return () => {
      window.removeEventListener("zen-achievement", onUnlock);
      window.clearTimeout(hideTimer.current);
    };
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
