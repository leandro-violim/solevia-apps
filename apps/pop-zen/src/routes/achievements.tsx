import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CoinBalance } from "../components/CoinBalance";
import { ACHIEVEMENTS, achStats, isUnlocked, progressOf, type AchStats } from "../lib/achievements";
import { t } from "../lib/i18n";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Zen Bubbles" },
      { name: "description", content: "Your achievements, stats, and coin rewards." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  // Read player state on the client only (avoids SSR hydration mismatch).
  const [data, setData] = useState<{
    stats: AchStats;
    unlocked: Record<string, boolean>;
    progress: Record<string, number>;
  } | null>(null);
  useEffect(() => {
    const unlocked: Record<string, boolean> = {};
    const progress: Record<string, number> = {};
    for (const a of ACHIEVEMENTS) {
      unlocked[a.id] = isUnlocked(a.id);
      progress[a.id] = progressOf(a);
    }
    setData({ stats: achStats(), unlocked, progress });
  }, []);

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
    >
      <header className="flex items-center justify-between py-3">
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          {t("common.home")}
        </Link>
        <h1 className="text-sm font-semibold text-foreground">{t("ach.title")}</h1>
        <CoinBalance className="text-sm font-semibold text-foreground" />
      </header>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label={t("ach.statPopped")} value={data?.stats.totalPopped ?? 0} />
        <Stat label={t("ach.statCombo")} value={data?.stats.bestCombo ?? 0} />
        <Stat label={t("ach.statStreak")} value={data?.stats.streak ?? 0} />
      </div>

      <div className="flex flex-col gap-2">
        {ACHIEVEMENTS.map((a) => {
          const done = data?.unlocked[a.id] ?? false;
          const p = data?.progress[a.id] ?? 0;
          return (
            <div
              key={a.id}
              className={`rounded-2xl border p-3 ${
                done ? "border-accent/40 bg-accent/10" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${done ? "text-accent" : "text-foreground"}`}>
                  {done ? "🏆" : "🔒"} {t(a.labelKey, { n: a.goal })}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">+{a.reward} 🪙</span>
              </div>
              {!done && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.round(p * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <div className="text-lg font-bold text-foreground tabular-nums">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
