import { createFileRoute, Link } from "@tanstack/react-router";
import bubbleImg from "../assets/bubbles/real-bubble-full.webp";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { DailyBonus } from "../components/DailyBonus";
import { CoinBalance } from "../components/CoinBalance";
import { StreakBadge } from "../components/StreakBadge";
import { DailyChallengeCard } from "../components/DailyChallengeCard";
import { t } from "../lib/i18n";
import { unlockAudio } from "../lib/pop-sound";
import { trackModeSelected } from "../lib/mode";
import { TrophyIcon } from "../components/icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zen Bubbles — Relax and pop plastic bubbles" },
      {
        name: "description",
        content:
          "A calming bubble-wrap popping game. Soothing phases of shrinking bubbles. Pop, relax, beat your best time.",
      },
      { property: "og:title", content: "Zen Bubbles" },
      {
        property: "og:description",
        content: "Relax and pop plastic bubbles across soothing phases.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div
      className="screen-fade relative flex min-h-dvh flex-col items-center justify-between px-6 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      {/* Once-a-day pre-game daily bonus pop-up (self-manages whether to show). */}
      <DailyBonus />

      {/* Top bar: streak (left) + coins→shop pill (right). F3: a FIXED app bar
          with a navy backdrop + safe-area top padding, so its chips always sit
          below the OS status bar / notch / Dynamic Island and content scrolls
          UNDER it — never the other way around. */}
      <div
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 pb-3"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          background: "linear-gradient(to bottom, var(--bg-0) 55%, transparent)",
        }}
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

      {/* Adaptive, no-scroll: everything below is sized in viewport units / small
          responsive gaps so the whole screen fits any phone (notch, Dynamic
          Island, SE) without a scroll. */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-3">
        <div className="relative">
          <img
            src={bubbleImg}
            alt="Plastic bubble"
            width={176}
            height={176}
            className="animate-[bubbleFloat_5s_ease-in-out_infinite] drop-shadow-xl"
            style={{ height: "clamp(84px, 15vh, 150px)", width: "clamp(84px, 15vh, 150px)" }}
          />
        </div>
        <h1
          className="wordmark mt-3 leading-tight"
          style={{ fontSize: "clamp(2rem, 7vh, 2.6rem)" }}
        >
          {t("home.title")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("home.tagline")}</p>

        <div className="mt-4 flex w-full max-w-xs flex-col gap-2.5">
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
            className="btn btn-primary w-full py-3.5 text-base"
          >
            {t("home.zen")}
          </Link>

          {/* The daily challenge — the timed mode (date-seeded, one loop/day). */}
          <DailyChallengeCard />

          <Link to="/records" className="btn btn-ghost w-full text-sm">
            {t("home.viewRecords")}
          </Link>
        </div>

        <nav
          aria-label="Legal"
          className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"
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
