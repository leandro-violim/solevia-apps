import { createFileRoute, Link } from "@tanstack/react-router";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { formatTime, PHASES } from "../lib/game-config";
import { usePhaseRecords } from "../lib/records";
import { t } from "../lib/i18n";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Your Records — Zen Bubbles" },
      {
        name: "description",
        content: "Your best score and best time for every bubble-popping phase.",
      },
      { property: "og:title", content: "Your Records — Zen Bubbles" },
      { property: "og:description", content: "Your best score and time per phase." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { records, reset, hydrated } = usePhaseRecords();

  return (
    <div
      className="screen-fade flex min-h-dvh flex-col px-5 pb-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground">
          {t("common.home")}
        </Link>
        <h1 className="text-lg font-semibold text-foreground">{t("records.title")}</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-3">
        {PHASES.map((p) => {
          const r = records[p.phase];
          const hasRecord = hydrated && r && r.bestScore > 0;
          const hasLast = hydrated && r && r.lastScore > 0;
          const scoreDelta = hasLast ? r.lastScore - r.prevBestScore : 0;
          // Time delta: negative = faster (improved). If no previous time, treat as improvement.
          const timeDelta = hasLast && r.prevBestTimeMs > 0 ? r.lastTimeMs - r.prevBestTimeMs : 0;
          // Only compare against a metric that actually has a previous best.
          // On a phase's first-ever run there's nothing to compare, so we show
          // a "New!" badge instead of confusing "=" markers.
          const hasPrevScore = hasLast && r.prevBestScore > 0;
          const hasPrevTime = hasLast && r.prevBestTimeMs > 0;
          return (
            <div
              key={p.phase}
              className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("records.phase", { n: p.phase })}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {t("records.phaseLine", {
                      label: t(`phaseShort${p.phase}`),
                      bubbles: p.bubbles,
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {hasRecord ? r.bestScore : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasRecord ? formatTime(r.bestTimeMs) : t("records.noTime")}
                  </div>
                </div>
              </div>
              {hasLast && (
                <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                  <span className="text-muted-foreground">
                    {t("records.last", { score: r.lastScore, time: formatTime(r.lastTimeMs) })}
                  </span>
                  {!hasPrevScore && !hasPrevTime ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {t("records.new")}
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      {hasPrevScore && (
                        <span
                          className={
                            scoreDelta > 0
                              ? "font-semibold text-emerald-600"
                              : scoreDelta < 0
                                ? "font-semibold text-rose-600"
                                : "text-muted-foreground"
                          }
                        >
                          {scoreDelta > 0 ? "▲" : scoreDelta < 0 ? "▼" : "="}
                          {scoreDelta !== 0 ? Math.abs(scoreDelta) : ""} pts
                        </span>
                      )}
                      {hasPrevTime && (
                        <span
                          className={
                            timeDelta < 0
                              ? "font-semibold text-emerald-600"
                              : timeDelta > 0
                                ? "font-semibold text-rose-600"
                                : "text-muted-foreground"
                          }
                        >
                          {timeDelta < 0 ? "▲" : timeDelta > 0 ? "▼" : "="}
                          {timeDelta !== 0 ? formatTime(Math.abs(timeDelta)) : ""}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          to="/play"
          search={{ phase: 1, mode: "time-attack", difficulty: "normal", daily: 1 }}
          className="btn btn-primary w-full text-sm"
        >
          {t("records.playFrom")}
        </Link>
        <button
          onClick={() => {
            if (confirm(t("records.resetConfirmShort"))) reset();
          }}
          className="btn btn-ghost w-full text-sm text-muted-foreground"
        >
          {t("settings.resetBtn")}
        </button>
      </div>

      <AdBannerSpacer />
      <AdBanner />
    </div>
  );
}
