import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Trophy, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { launchConfetti } from "../lib/confetti";
import { showRewarded } from "../lib/ads";
import { addCoins } from "../lib/economy";
import { getAllTimeBestTotal } from "../lib/records";
import { pickQuote } from "../lib/quotes";
import { t } from "../lib/i18n";
import { CoinIcon, PlayIcon } from "../components/icons";

// beat is passed as 1/0 to survive URL (de)serialization cleanly.
const searchSchema = z.object({
  total: z.coerce.number().nonnegative().default(0),
  prevBest: z.coerce.number().nonnegative().default(0),
  beat: z.coerce.number().default(0),
  coins: z.coerce.number().nonnegative().default(0),
});

export const Route = createFileRoute("/finish")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Run complete — Zen Bubbles" },
      {
        name: "description",
        content: "Your run is complete. See if you beat your all-time record.",
      },
    ],
  }),
  component: FinishPage,
});

function FinishPage() {
  const { total, prevBest, beat, coins } = Route.useSearch();
  const navigate = useNavigate();
  const beatRecord = beat === 1;

  // §3.2 rewarded double-coins for this run.
  const [bonusCoins, setBonusCoins] = useState(0);
  const [adBusy, setAdBusy] = useState(false);
  const doubleCoins = async () => {
    if (adBusy || bonusCoins > 0 || coins <= 0) return;
    setAdBusy(true);
    const watched = await showRewarded("double_coins");
    if (watched) {
      addCoins(coins, "double_coins");
      setBonusCoins(coins);
    }
    setAdBusy(false);
  };

  // All-time best AFTER this run has been committed (records.commitRunTotal ran
  // on the play screen before navigating here).
  const allTimeBest = getAllTimeBestTotal();
  const delta = prevBest > 0 ? total - prevBest : total;
  const pointsAway = Math.max(0, allTimeBest - total);
  const quote = pickQuote(total + prevBest);

  useEffect(() => {
    if (!beatRecord) return;
    // Two bursts for a fuller celebration. Capture BOTH stop handles so leaving
    // the screen mid-celebration cancels the second burst's canvas/rAF too.
    let stop2: (() => void) | undefined;
    const stop1 = launchConfetti();
    const t = window.setTimeout(() => {
      const s = launchConfetti({ count: 90 });
      if (typeof s === "function") stop2 = s;
    }, 550);
    return () => {
      stop1?.();
      stop2?.();
      window.clearTimeout(t);
    };
  }, [beatRecord]);

  return (
    <div
      className="screen-fade relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
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
            {prevBest > 0 ? t("finish.newAllTime") : t("finish.firstRecord")}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            {t("finish.youBeatBest")}
          </h1>
        </>
      ) : (
        <>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {t("finish.runComplete")}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            {t("finish.soClose")}
          </h1>
        </>
      )}

      {/* Score card */}
      <div className="mt-7 w-full max-w-xs rounded-3xl bg-card p-6">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {t("finish.yourRun")}
        </div>
        <div className="mt-1 text-5xl font-bold text-primary tabular-nums">
          {total.toLocaleString()}
        </div>

        {beatRecord ? (
          prevBest > 0 ? (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">
              {t("finish.overOldBest", {
                delta: delta.toLocaleString(),
                prev: prevBest.toLocaleString(),
              })}
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">{t("finish.firstTotal")}</div>
          )
        ) : (
          <div className="mt-3 space-y-1">
            <div className="text-sm text-muted-foreground">
              {t("finish.allTimeBest")}{" "}
              <span className="font-semibold text-foreground">{allTimeBest.toLocaleString()}</span>
            </div>
            {pointsAway > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary">
                {t("finish.pointsAway", { n: pointsAway.toLocaleString() })}
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
        {beatRecord ? t("finish.momentum") : `“${quote}”`}
      </p>

      {/* §1/§3.2 run coins + rewarded double */}
      {coins > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            <CoinIcon size={16} className="text-gold" />
            {t("finish.coinsEarned", { coins: coins + bonusCoins })}
          </div>
          {bonusCoins === 0 && (
            <button
              onClick={doubleCoins}
              disabled={adBusy}
              className="btn btn-ghost gap-1.5 px-4 py-2 text-xs text-accent"
            >
              <PlayIcon size={13} />
              {t("finish.doubleCoins")}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        className="mt-6 flex w-full max-w-xs flex-col gap-3"
        style={{ animation: "floatUp 600ms ease-out 320ms both" }}
      >
        <button
          onClick={() =>
            navigate({
              to: "/play",
              search: { phase: 1, mode: "time-attack", difficulty: "normal", daily: 1 },
            })
          }
          className="btn btn-primary w-full py-4 text-base"
        >
          {beatRecord ? (
            <>
              <ArrowRight className="h-5 w-5" /> {t("finish.optimize")}
            </>
          ) : (
            <>
              <RotateCcw className="h-5 w-5" /> {t("finish.tryAgain")}
            </>
          )}
        </button>
        <Link to="/records" className="btn btn-ghost w-full text-sm">
          {t("finish.viewRecords")}
        </Link>
        <Link to="/" className="py-1 text-xs text-muted-foreground hover:underline">
          {t("finish.backHome")}
        </Link>
      </div>
    </div>
  );
}
