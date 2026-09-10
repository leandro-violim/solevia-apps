import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { fadeMusicIn, fadeMusicOut } from "../lib/music";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";
import { DailyBonus } from "../components/DailyBonus";
import { CoinBalance } from "../components/CoinBalance";
import { StreakBadge } from "../components/StreakBadge";
import { t } from "../lib/i18n";
import { unlockAudio } from "../lib/pop-sound";
import { trackModeSelected } from "../lib/mode";
import {
  IconTile,
  ResourcePill,
  HexNode,
  Island,
  Mascot,
  WrapTeaser,
  BottomNav,
  FloatBubble,
} from "../components/gameshell";
import sky from "../assets/scene/sky.webp";

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

// Step 3 (game-style Home): the world/phase shown on the play button. Real
// per-session persistence + an interactive map land in step 4; for now the
// current node defaults to World 1 · Phase 1.
const CURRENT_WORLD = 1;
const CURRENT_PHASE = 1;

function Home() {
  const navigate = useNavigate();

  // Calm piano on the home screen (fades out when leaving).
  useEffect(() => {
    fadeMusicIn();
    return () => fadeMusicOut();
  }, []);

  const startZen = () => {
    unlockAudio();
    trackModeSelected("zen");
    navigate({ to: "/play", search: { mode: "zen", phase: 1, difficulty: "normal", daily: 0 } });
  };

  return (
    <div
      className="gs-home screen-fade relative flex min-h-dvh flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${sky})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {/* Once-a-day pre-game daily bonus pop-up (self-manages whether to show). */}
      <DailyBonus />

      {/* soft water wash at the bottom of the sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]"
        style={{ background: "linear-gradient(180deg, rgba(120,110,230,0.10), rgba(110,95,220,0.42))" }}
      />

      {/* ---- top bar ---- */}
      <div
        className="relative z-20 flex items-center gap-2 px-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <Link to="/achievements" aria-label={t("home.achievements")}>
          <IconTile variant="gold" size={44}>🫧</IconTile>
        </Link>
        <Link to="/achievements" aria-label={t("home.achievements")} className="ml-1">
          <ResourcePill icon="🔥" plus={false}>
            <StreakBadge />
          </ResourcePill>
        </Link>
        <Link to="/shop" aria-label={t("home.shop")} className="ml-auto">
          <ResourcePill icon="🪙" plus>
            <CoinBalance />
          </ResourcePill>
        </Link>
        <Link to="/settings" aria-label={t("nav.settings")}>
          <IconTile variant="blue" size={44}>⚙️</IconTile>
        </Link>
      </div>

      {/* ---- scene (events + teaser + map) ---- */}
      <div className="relative z-10 min-h-0 flex-1">
        {/* left event tiles */}
        <div className="absolute left-3 top-3 z-20 flex flex-col gap-3">
          <EventTile to="/play" search={{ mode: "time-attack", phase: 1, difficulty: "normal", daily: 1 }}
            variant="blue" icon="🗓️" label={t("home.daily")} />
          <EventTile to="/achievements" variant="gold" icon="🏆" label={t("home.achievements")} />
          <EventTile to="/records" variant="pink" icon="📊" label={t("home.viewRecords")} />
        </div>

        {/* bubble-wrap teaser (upper-right) */}
        <div className="absolute right-4 top-4 z-20" style={{ transform: "rotate(4deg)" }}>
          <WrapTeaser ribbon={t("home.teaser")} onClick={startZen} width={132} />
        </div>

        {/* ambient float bubbles */}
        <FloatBubble size={20} style={{ top: "34%", left: "58%" }} />
        <FloatBubble size={12} style={{ top: "42%", left: "70%" }} />
        <FloatBubble size={22} style={{ top: "62%", left: "12%" }} />

        {/* world/phase map preview (interactive map = step 4). Island widened to
            fill the width; current node sits left-of-centre so the "you are here"
            chip + number never cover the mascot (which sits to its right). */}
        <div className="absolute inset-x-0 z-0" style={{ top: "46%" }}>
          <div className="relative mx-auto" style={{ width: "min(300px, 82%)", height: 215 }}>
            <Island variant="trees" width={280} style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)" }} />
            <HexNode n={CURRENT_PHASE - 1} state="done" size={44}
              style={{ position: "absolute", left: "17%", bottom: 66 }} />
            <HexNode n={CURRENT_PHASE} state="current" hereLabel={t("home.here")} size={52}
              style={{ position: "absolute", left: "40%", bottom: 116, transform: "translateX(-50%)" }} />
            <HexNode n={CURRENT_PHASE + 1} state="locked" size={44}
              style={{ position: "absolute", right: "12%", bottom: 104 }} />
            <Mascot size={60} style={{ position: "absolute", left: "58%", bottom: 62, transform: "translateX(-50%)" }} />
          </div>
        </div>
      </div>

      {/* ---- main play button ---- */}
      <div className="relative z-20 px-5 pb-2 text-center">
        <div aria-hidden className="mb-[-4px] text-2xl drop-shadow">🫧</div>
        <Link
          to="/play"
          search={{ mode: "time-attack", phase: CURRENT_PHASE, difficulty: "normal", daily: 0 }}
          onClick={() => {
            unlockAudio();
            trackModeSelected("time-attack");
          }}
          className="gs-btn gs-btn--hero mx-auto w-full max-w-xs flex-col gap-0.5 px-4 py-2.5"
        >
          <span style={{ fontSize: 20 }}>
            {t("home.worldPhase", { world: CURRENT_WORLD, phase: CURRENT_PHASE })}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.95 }}>{t("home.tapToPlay")}</span>
        </Link>
      </div>

      {/* ---- bottom nav + ad ---- */}
      <div className="relative z-20">
        <BottomNav active="home" />
        <AdBannerSpacer />
        <AdBanner />
      </div>
    </div>
  );
}

/** An event: soft-3D icon tile + a small glossy caption, links somewhere. */
function EventTile({
  to,
  search,
  variant,
  icon,
  label,
}: {
  to: string;
  search?: Record<string, unknown>;
  variant: "purple" | "blue" | "pink" | "gold";
  icon: string;
  label: string;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search={search as any}
      className="flex w-[76px] flex-col items-center gap-1"
      aria-label={label}
    >
      <IconTile variant={variant} size={64}>{icon}</IconTile>
      <span
        className="w-full rounded-lg px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-tight text-white"
        style={{
          background: "linear-gradient(var(--gs-green-1), var(--gs-green-2))",
          border: "2px solid #fff",
          boxShadow: "0 3px 0 var(--gs-green-edge)",
          textShadow: "0 1px 1px rgba(0,0,0,.25)",
        }}
      >
        {label}
      </span>
    </Link>
  );
}
