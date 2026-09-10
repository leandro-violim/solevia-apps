import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { RotateCcw, ArrowRight } from "lucide-react";
import { launchConfetti } from "../lib/confetti";
import { showRewarded } from "../lib/ads";
import { addCoins } from "../lib/economy";
import { getAllTimeBestTotal } from "../lib/records";
import { pickQuote } from "../lib/quotes";
import { t } from "../lib/i18n";
import { CoinIcon, PlayIcon } from "../components/icons";
import { Mascot } from "../components/gameshell";
import { fadeMusicIn, fadeMusicOut } from "../lib/music";
import sky from "../assets/scene/sky.webp";
import mascotSad from "../assets/shell/mascot-sad.webp";

// beat is passed as 1/0 to survive URL (de)serialization cleanly.
const searchSchema = z.object({
  total: z.coerce.number().nonnegative().default(0),
  prevBest: z.coerce.number().nonnegative().default(0),
  beat: z.coerce.number().default(0),
  coins: z.coerce.number().nonnegative().default(0),
  // How the run ended + the context to restart, so "Try Again" replays the SAME
  // phase and a timeout ("End run") shows the sad mascot.
  ended: z.enum(["completed", "timeout"]).optional().default("completed"),
  phase: z.coerce.number().int().min(1).optional().default(1),
  mode: z.enum(["zen", "time-attack"]).optional().default("time-attack"),
  difficulty: z.enum(["easy", "normal", "hard"]).optional().default("normal"),
  daily: z.coerce.number().optional().default(0),
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
  const { total, prevBest, beat, coins, ended, phase, mode, difficulty, daily } = Route.useSearch();
  const navigate = useNavigate();
  const beatRecord = beat === 1;
  const lost = ended === "timeout"; // "End run" / ran out of time → sad mascot (#6)

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

  // F7: calm piano on the run-complete screen; fades out when leaving.
  useEffect(() => {
    fadeMusicIn();
    return () => fadeMusicOut();
  }, []);

  return (
    <div
      className="gs-home screen-fade relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundImage: `url(${sky})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        // The banner is hidden on Finish (see __root), but reserve its height too
        // in case it's briefly visible on entry, so the Play/Home CTAs can never
        // sit under it (AdMob "ads obscuring content" fix).
        paddingBottom: "calc(var(--ad-banner-h, 100px) + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      {/* Mascot celebration */}
      <div
        className="mb-3"
        style={{ animation: "trophyPop 620ms cubic-bezier(.34,1.56,.64,1) both" }}
      >
        <div
          className="grid h-32 w-32 place-items-center rounded-full"
          style={{
            background: beatRecord
              ? "radial-gradient(circle at 50% 45%, rgba(245,196,81,0.5), transparent 70%)"
              : lost
                ? "radial-gradient(circle at 50% 45%, rgba(240,98,160,0.28), transparent 70%)"
                : "radial-gradient(circle at 50% 45%, rgba(51,224,198,0.35), transparent 70%)",
          }}
        >
          {lost ? (
            <img
              src={mascotSad}
              alt=""
              aria-hidden
              className="h-[116px] w-[116px]"
              style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.2))" }}
            />
          ) : (
            <Mascot size={116} variant="cheer" />
          )}
        </div>
      </div>

      {/* Headline */}
      {beatRecord ? (
        <>
          <div
            className="text-xs font-extrabold uppercase tracking-[0.3em]"
            style={{ color: "var(--gs-coral)" }}
          >
            {prevBest > 0 ? t("finish.newAllTime") : t("finish.firstRecord")}
          </div>
          <h1
            className="mt-2 text-4xl font-extrabold tracking-tight"
            style={{ color: "var(--gs-ink)" }}
          >
            {t("finish.youBeatBest")}
          </h1>
        </>
      ) : (
        <>
          <div
            className="text-xs font-extrabold uppercase tracking-[0.3em]"
            style={{ color: "var(--gs-blue-2)" }}
          >
            {t("finish.runComplete")}
          </div>
          <h1
            className="mt-2 text-4xl font-extrabold tracking-tight"
            style={{ color: "var(--gs-ink)" }}
          >
            {t("finish.soClose")}
          </h1>
        </>
      )}

      {/* Score card */}
      <div className="gs-panel mt-6 w-full max-w-xs p-6">
        <div className="text-[11px] uppercase tracking-widest gs-muted">{t("finish.yourRun")}</div>
        <div
          className="mt-1 text-5xl font-extrabold tabular-nums"
          style={{ color: "var(--gs-blue-2)" }}
        >
          {total.toLocaleString()}
        </div>

        {beatRecord ? (
          prevBest > 0 ? (
            <div
              className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold"
              style={{ background: "rgba(240,98,160,0.15)", color: "var(--gs-coral)" }}
            >
              {t("finish.overOldBest", {
                delta: delta.toLocaleString(),
                prev: prevBest.toLocaleString(),
              })}
            </div>
          ) : (
            <div className="mt-3 text-sm gs-muted">{t("finish.firstTotal")}</div>
          )
        ) : (
          <div className="mt-3 space-y-1">
            <div className="text-sm gs-muted">
              {t("finish.allTimeBest")}{" "}
              <span className="font-bold" style={{ color: "var(--gs-ink)" }}>
                {allTimeBest.toLocaleString()}
              </span>
            </div>
            {pointsAway > 0 && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold"
                style={{ background: "rgba(61,142,240,0.14)", color: "var(--gs-blue-2)" }}
              >
                {t("finish.pointsAway", { n: pointsAway.toLocaleString() })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Encouragement */}
      <p
        className="mt-5 max-w-xs text-sm italic gs-muted"
        style={{ animation: "floatUp 600ms ease-out 200ms both" }}
      >
        {beatRecord ? t("finish.momentum") : `“${quote}”`}
      </p>

      {/* §1/§3.2 run coins + rewarded double */}
      {coins > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 text-sm font-bold"
            style={{ color: "var(--gs-ink)" }}
          >
            <CoinIcon size={16} className="text-gold" />
            {t("finish.coinsEarned", { coins: coins + bonusCoins })}
          </div>
          {bonusCoins === 0 && (
            <button
              onClick={doubleCoins}
              disabled={adBusy}
              className="gs-btn gs-btn--ghost gap-1.5 px-4 py-2 text-xs disabled:opacity-50"
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
              // #7: restart the SAME phase the run ended on (not always phase 1).
              search: { phase, mode, difficulty, daily },
            })
          }
          className="gs-btn w-full gap-1.5 py-4 text-base"
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
        <Link to="/records" className="gs-btn gs-btn--ghost w-full py-3 text-sm">
          {t("finish.viewRecords")}
        </Link>
        <Link to="/" className="gs-btn gs-btn--ghost w-full py-3 text-sm">
          {t("finish.backHome")}
        </Link>
      </div>
    </div>
  );
}
