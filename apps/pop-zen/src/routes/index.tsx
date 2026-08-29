import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import bubbleImg from "../assets/bubble.png";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { DailyBonus } from "../components/DailyBonus";
import { CoinBalance } from "../components/CoinBalance";
import { StreakBadge } from "../components/StreakBadge";
import { t } from "../lib/i18n";
import { unlockAudio } from "../lib/pop-sound";
import { trackModeSelected } from "../lib/mode";
import type { Difficulty } from "../lib/config";

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
      className="relative flex min-h-dvh flex-col items-center justify-between px-6 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      {/* Once-a-day pre-game daily bonus pop-up (self-manages whether to show). */}
      <DailyBonus />

      {/* Top bar: streak (left) + coins→shop pill (right). */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <StreakBadge />
        <Link
          to="/shop"
          aria-label={t("home.shop")}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground"
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
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
          {t("home.title")}
        </h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("home.tagline")}</p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          {/* Zen: calm, endless, no clock. */}
          <Link
            to="/play"
            search={{ mode: "zen", phase: 1, difficulty: "normal" }}
            // Warm audio inside this user gesture so iOS unlocks and the pop
            // samples decode before the first tap (no silent first pop).
            onClick={() => {
              unlockAudio();
              trackModeSelected("zen");
            }}
            className="rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            {t("home.zen")}
          </Link>

          {/* Time Attack: race the clock, phases + difficulty. */}
          <Link
            to="/play"
            search={{ mode: "time-attack", phase: 1, difficulty }}
            onClick={() => {
              unlockAudio();
              trackModeSelected("time-attack");
            }}
            className="rounded-full border border-accent/40 bg-accent/10 py-4 text-base font-semibold text-accent active:scale-[0.98]"
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

          <Link
            to="/records"
            className="mt-1 rounded-full border border-border bg-card py-3 text-sm font-medium text-foreground"
          >
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
