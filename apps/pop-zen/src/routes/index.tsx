import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import bubbleImg from "../assets/bubble.webp";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { DailyBonus } from "../components/DailyBonus";
import { CoinBalance } from "../components/CoinBalance";
import { StreakBadge } from "../components/StreakBadge";
import { DailyChallengeCard } from "../components/DailyChallengeCard";
import { t } from "../lib/i18n";
import { unlockAudio } from "../lib/pop-sound";
import { trackModeSelected } from "../lib/mode";
import type { Difficulty } from "../lib/config";
import { TrophyIcon } from "../components/icons";
import { Onboarding } from "../components/Onboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zen Bubbles — Relax and pop plastic bubbles" },
      {
        name: "description",
        content:
          "A calming bubble-wrap popping game. Five phases of shrinking bubbles. Pop, relax, beat your best time.",
      },
      { property: "og:title", content: "Zen Bubbles" },
      {
        property: "og:description",
        content: "Relax and pop plastic bubbles across five soothing phases.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  return (
    <div
      className="screen-fade relative flex min-h-dvh flex-col items-center justify-between px-6 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      {/* Once-a-day pre-game daily bonus pop-up (self-manages whether to show). */}
      <DailyBonus />
      {/* First-run "How to Play" (self-manages; renders above the bonus on day 1). */}
      <Onboarding />

      {/* Top bar: streak (left) + coins→shop pill (right). */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <Link
          to="/achievements"
          aria-label={t("home.achievements")}
          className="glass-chip px-3 py-1.5"
        >
          <TrophyIcon size={15} className="text-gold" />
          <StreakBadge />
        </Link>
        <Link
          to="/shop"
          aria-label={t("home.shop")}
          className="glass-chip px-3 py-1.5 text-sm font-semibold"
        >
          <CoinBalance />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <img
            src={bubbleImg}
            alt="Plastic bubble"
            width={192}
            height={192}
            className="h-48 w-48 animate-[bubbleFloat_5s_ease-in-out_infinite] drop-shadow-xl"
          />
        </div>
        <h1 className="wordmark mt-6 text-[2.6rem] leading-tight">{t("home.title")}</h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("home.tagline")}</p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          {/* Zen: calm, endless, no clock. */}
          <Link
            to="/play"
            search={{ mode: "zen", phase: 1, difficulty: "normal", daily: 0 }}
            // Warm audio inside this user gesture so iOS unlocks and the pop
            // samples decode before the first tap (no silent first pop).
            onClick={() => {
              unlockAudio();
              trackModeSelected("zen");
            }}
            className="btn btn-primary w-full py-4 text-base"
          >
            {t("home.zen")}
          </Link>

          {/* Time Attack: race the clock, phases + difficulty. */}
          <Link
            to="/play"
            search={{ mode: "time-attack", phase: 1, difficulty, daily: 0 }}
            onClick={() => {
              unlockAudio();
              trackModeSelected("time-attack");
            }}
            className="btn btn-secondary w-full py-4 text-base"
          >
            {t("home.timeAttack")}
          </Link>
          <div className="flex items-center justify-center gap-2">
            {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  difficulty === d
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`home.diff${d[0].toUpperCase()}${d.slice(1)}`)}
              </button>
            ))}
          </div>

          {/* §12 date-seeded daily challenge */}
          <DailyChallengeCard />

          <Link to="/records" className="btn btn-ghost w-full text-sm">
            {t("home.viewRecords")}
          </Link>
        </div>

        <nav
          aria-label="Legal"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"
        >
          <Link to="/settings" className="hover:underline">
            {t("nav.settings")}
          </Link>
          <span aria-hidden>·</span>
          <Link to="/about" className="hover:underline">
            {t("nav.about")}
          </Link>
          <span aria-hidden>·</span>
          <Link to="/privacy" className="hover:underline">
            {t("nav.privacy")}
          </Link>
          <span aria-hidden>·</span>
          <Link to="/terms" className="hover:underline">
            {t("nav.terms")}
          </Link>
        </nav>
      </div>

      <AdBannerSpacer />
      <AdBanner />
    </div>
  );
}
