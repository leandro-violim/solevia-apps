import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { Trophy, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { launchConfetti } from "../lib/confetti";
import { getAllTimeBestTotal } from "../lib/records";
import { pickQuote } from "../lib/quotes";

// beat is passed as 1/0 to survive URL (de)serialization cleanly.
const searchSchema = z.object({
  total: z.coerce.number().nonnegative().default(0),
  prevBest: z.coerce.number().nonnegative().default(0),
  beat: z.coerce.number().default(0),
});

export const Route = createFileRoute("/finish")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Run complete — Bubble Pop Calm" },
      {
        name: "description",
        content: "Your five-phase run is complete. See if you beat your all-time record.",
      },
    ],
  }),
  component: FinishPage,
});

function FinishPage() {
  const { total, prevBest, beat } = Route.useSearch();
  const navigate = useNavigate();
  const beatRecord = beat === 1;

  // All-time best AFTER this run has been committed (records.commitRunTotal ran
  // on the play screen before navigating here).
  const allTimeBest = getAllTimeBestTotal();
  const delta = prevBest > 0 ? total - prevBest : total;
  const pointsAway = Math.max(0, allTimeBest - total);
  const quote = pickQuote(total + prevBest);

  useEffect(() => {
    if (!beatRecord) return;
    // Two bursts for a fuller celebration.
    const stop1 = launchConfetti();
    const t = window.setTimeout(() => launchConfetti({ count: 90 }), 550);
    return () => {
      stop1?.();
      window.clearTimeout(t);
    };
  }, [beatRecord]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
      }}
    >
      {/* Icon */}
      <div
        className="mb-6"
        style={{ animation: "trophyPop 620ms cubic-bezier(.34,1.56,.64,1) both" }}
      >
        {beatRecord ? (
          <div
            className="grid h-28 w-28 place-items-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, oklch(0.9 0.16 90 / 0.35), transparent 70%)",
            }}
          >
            <Trophy
              className="h-20 w-20"
              strokeWidth={1.5}
              style={{
                color: "oklch(0.9 0.16 92)",
                animation: "trophyGlow 2.4s ease-in-out infinite",
              }}
            />
          </div>
        ) : (
          <div
            className="grid h-28 w-28 place-items-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, oklch(0.82 0.13 195 / 0.28), transparent 70%)",
            }}
          >
            <Sparkles className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Headline */}
      {beatRecord ? (
        <>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {prevBest > 0 ? "New all-time record" : "First record set"}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            You beat your best!
          </h1>
        </>
      ) : (
        <>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Run complete
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            So close!
          </h1>
        </>
      )}

      {/* Score card */}
      <div className="mt-7 w-full max-w-xs rounded-3xl bg-card p-6">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Your run · all 5 phases
        </div>
        <div className="mt-1 text-5xl font-bold text-primary tabular-nums">
          {total.toLocaleString()}
        </div>

        {beatRecord ? (
          prevBest > 0 ? (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">
              ▲ {delta.toLocaleString()} over your old best of{" "}
              {prevBest.toLocaleString()}
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">
              This is your first all-time total — now go beat it.
            </div>
          )
        ) : (
          <div className="mt-3 space-y-1">
            <div className="text-sm text-muted-foreground">
              All-time best:{" "}
              <span className="font-semibold text-foreground">
                {allTimeBest.toLocaleString()}
              </span>
            </div>
            {pointsAway > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary">
                Just {pointsAway.toLocaleString()} points away
              </div>
            )}
          </div>
        )}
      </div>

      {/* Encouragement */}
      <p
        className="mt-5 max-w-xs text-sm italic text-muted-foreground"
        style={{ animation: "floatUp 600ms ease-out 200ms both" }}
      >
        {beatRecord
          ? "Ride the momentum — see if you can push it even higher."
          : `“${quote}”`}
      </p>

      {/* Actions */}
      <div
        className="mt-8 flex w-full max-w-xs flex-col gap-3"
        style={{ animation: "floatUp 600ms ease-out 320ms both" }}
      >
        <button
          onClick={() => navigate({ to: "/play", search: { phase: 1 } })}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
        >
          {beatRecord ? (
            <>
              <ArrowRight className="h-5 w-5" /> Optimize your record
            </>
          ) : (
            <>
              <RotateCcw className="h-5 w-5" /> Try again from the start
            </>
          )}
        </button>
        <Link
          to="/records"
          className="rounded-full bg-card py-3 text-sm font-medium text-foreground"
        >
          View records
        </Link>
        <Link to="/" className="py-1 text-xs text-muted-foreground hover:underline">
          Back home
        </Link>
      </div>
    </div>
  );
}
