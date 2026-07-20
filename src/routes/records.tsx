import { createFileRoute, Link } from "@tanstack/react-router";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { formatTime, PHASES } from "../lib/game-config";
import { usePhaseRecords } from "../lib/records";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Your Records — Bubble Pop Calm" },
      { name: "description", content: "Your best score and best time for every bubble-popping phase." },
      { property: "og:title", content: "Your Records — Bubble Pop Calm" },
      { property: "og:description", content: "Your best score and time per phase." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { records, reset, hydrated } = usePhaseRecords();

  return (
    <div
      className="flex min-h-screen flex-col px-5 pb-6"
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
          return (
            <div
              key={p.phase}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
            >
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