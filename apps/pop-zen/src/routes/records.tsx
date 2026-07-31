import { createFileRoute, Link } from "@tanstack/react-router";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { formatTime, PHASES } from "../lib/game-config";
import { usePhaseRecords } from "../lib/records";

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
      className="flex min-h-dvh flex-col px-5 pb-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Your records</h1>
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
                    Phase {p.phase}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {p.label} · {p.bubbles} bubbles
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {hasRecord ? r.bestScore : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasRecord ? formatTime(r.bestTimeMs) : "no time yet"}
                  </div>
                </div>
              </div>
              {hasLast && (
                <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                  <span className="text-muted-foreground">
                    Last: {r.lastScore} · {formatTime(r.lastTimeMs)}
                  </span>
                  {!hasPrevScore && !hasPrevTime ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      New!
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
          search={{ phase: 1 }}
          className="rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground shadow"
        >
          Play from Phase 1
        </Link>
        <button
          onClick={() => {
            if (confirm("Reset all records?")) reset();
          }}
          className="rounded-full border border-border bg-background py-3 text-center text-sm text-muted-foreground"
        >
          Reset records
        </button>
      </div>

      <AdBannerSpacer />
      <AdBanner />
    </div>
  );
}
