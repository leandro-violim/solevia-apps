import { createFileRoute, Link } from "@tanstack/react-router";
import { formatTime, PHASES, TOTAL_ROUNDS, PHASES_PER_ROUND } from "../lib/game-config";
import { usePhaseRecords } from "../lib/records";
import { ScreenShell } from "../components/gameshell";
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
    <ScreenShell title={t("records.title")} nav="records">
      <div className="space-y-5 pt-2">
        {Array.from({ length: TOTAL_ROUNDS }, (_, w) => (
          <section key={w}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] gs-muted">
              {t("world.label")} {w + 1} · {t(`world.r${w + 1}.name` as "world.r1.name")}
            </h2>
            <div className="space-y-2.5">
              {PHASES.map((p) => {
                const stage = w * PHASES_PER_ROUND + p.phase;
                const r = records[stage];
                const hasRecord = hydrated && r && r.bestScore > 0;
                const hasLast = hydrated && r && r.lastScore > 0;
                const scoreDelta = hasLast ? r.lastScore - r.prevBestScore : 0;
                const timeDelta =
                  hasLast && r.prevBestTimeMs > 0 ? r.lastTimeMs - r.prevBestTimeMs : 0;
                const hasPrevScore = hasLast && r.prevBestScore > 0;
                const hasPrevTime = hasLast && r.prevBestTimeMs > 0;
                return (
                  <div key={stage} className="gs-panel px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-widest gs-muted">
                          {t("records.phase", { n: p.phase })}
                        </div>
                        <div className="text-sm font-bold" style={{ color: "var(--gs-ink)" }}>
                          {t("records.phaseLine", {
                            label: t(`phaseShort${p.phase}`),
                            bubbles: p.bubbles,
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-lg font-extrabold"
                          style={{ color: "var(--gs-blue-2)" }}
                        >
                          {hasRecord ? r.bestScore : "—"}
                        </div>
                        <div className="text-xs gs-muted">
                          {hasRecord ? formatTime(r.bestTimeMs) : t("records.noTime")}
                        </div>
                      </div>
                    </div>
                    {hasLast && (
                      <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2 text-xs">
                        <span className="gs-muted">
                          {t("records.last", {
                            score: r.lastScore,
                            time: formatTime(r.lastTimeMs),
                          })}
                        </span>
                        {!hasPrevScore && !hasPrevTime ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700">
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
                                      : "gs-muted"
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
                                      : "gs-muted"
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
          </section>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          to="/play"
          search={{ phase: 1, mode: "time-attack", difficulty: "normal", daily: 1 }}
          className="gs-btn w-full px-4 py-3.5 text-base"
        >
          {t("records.playFrom")}
        </Link>
        <button
          onClick={() => {
            if (confirm(t("records.resetConfirmShort"))) reset();
          }}
          className="gs-btn gs-btn--ghost w-full px-4 py-3 text-sm"
        >
          {t("settings.resetBtn")}
        </button>
      </div>
    </ScreenShell>
  );
}
