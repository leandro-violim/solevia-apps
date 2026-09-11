import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Island,
  Mascot,
  WrapTeaser,
  BottomNav,
  FloatBubble,
} from "../components/gameshell";
import { currentWorldPhase } from "../lib/progress";
import { msUntilChallenge, formatCooldown, startChallenge } from "../lib/pop-challenge";
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

function Home() {
  const navigate = useNavigate();

  // v1.3 §11 step 4: real world/phase progress. Read after mount (SSR/prerender
  // has no localStorage). The play button "continues" to the map at the current
  // node; the mini-map preview mirrors nearby nodes.
  const [{ world: CURRENT_WORLD, phase: CURRENT_PHASE }, setProgress] = useState({
    world: 1,
    phase: 1,
  });
  useEffect(() => {
    setProgress(currentWorldPhase());
  }, []);

  // Calm piano on the home screen (fades out when leaving).
  useEffect(() => {
    fadeMusicIn();
    return () => fadeMusicOut();
  }, []);

  // §11: tapping the bubble-buddy makes it do a little bounce (and unlocks audio).
  const [mascotJumping, setMascotJumping] = useState(false);
  const bounceMascot = () => {
    unlockAudio();
    setMascotJumping(true);
  };

  const startZen = () => {
    unlockAudio();
    trackModeSelected("zen");
    navigate({ to: "/play", search: { mode: "zen", phase: 1, difficulty: "normal", daily: 0 } });
  };

  // §13 Pop Challenge: roll the random mission + reward, then start the single
  // phase it's tied to. The 3-hour cooldown begins when the challenge completes.
  const startChallengeRun = () => {
    unlockAudio();
    const active = startChallenge();
    trackModeSelected("time-attack");
    navigate({
      to: "/play",
      search: {
        mode: "time-attack",
        phase: active.mission.phase,
        difficulty: "normal",
        daily: 0,
        challenge: 1,
      },
    });
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
        style={{
          background: "linear-gradient(180deg, rgba(120,110,230,0.10), rgba(110,95,220,0.42))",
        }}
      />

      {/* ---- top bar: status only (nav lives in the bottom bar, no duplicates) ---- */}
      <div
        className="relative z-20 flex items-center gap-2 px-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <IconTile variant="gold" size={44}>
          🫧
        </IconTile>
        <ResourcePill icon="🔥" plus={false}>
          <StreakBadge />
        </ResourcePill>
        <Link to="/shop" aria-label={t("home.shop")} className="ml-auto">
          <ResourcePill icon="🪙" plus>
            <CoinBalance />
          </ResourcePill>
        </Link>
      </div>

      {/* ---- scene ---- */}
      <div className="relative z-10 min-h-0 flex-1">
        {/* left: the Pop Challenge (every-3-hours booster) — the one event not in
            the bottom nav. Gated: tappable when available, else a live countdown. */}
        <div className="absolute left-3 top-3 z-20">
          <PopChallengeTile onStart={startChallengeRun} />
        </div>

        {/* bubble-wrap teaser (upper-right) → Pop for Fun */}
        <div className="absolute right-4 top-4 z-20" style={{ transform: "rotate(4deg)" }}>
          <WrapTeaser ribbon={t("home.teaser")} onClick={startZen} width={132} />
        </div>

        {/* ambient float bubbles */}
        <FloatBubble size={20} style={{ top: "30%", left: "60%" }} />
        <FloatBubble size={12} style={{ top: "38%", left: "72%" }} />
        <FloatBubble size={22} style={{ top: "26%", left: "16%" }} />

        {/* island brought DOWN to the bottom of the scene (clear of the left tile),
            with the bubble-buddy mascot as the centred hero on top. The full
            interactive world map lives on /map (the play button below). */}
        <div className="absolute inset-x-0 bottom-0 z-0">
          <div className="relative mx-auto" style={{ width: "min(320px, 88%)", height: 210 }}>
            <Island
              variant="trees"
              width={300}
              style={{
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translateX(-50%)",
              }}
            />
            <button
              type="button"
              onClick={bounceMascot}
              aria-label={t("home.tapToPlay")}
              style={{
                position: "absolute",
                left: "50%",
                bottom: 74,
                transform: "translateX(-50%)",
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                lineHeight: 0,
              }}
            >
              <div
                onAnimationEnd={() => setMascotJumping(false)}
                style={{ animation: mascotJumping ? "mascotJump 0.6s ease" : undefined }}
              >
                <Mascot size={104} variant="cheer" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ---- main play button ---- */}
      <div className="relative z-20 px-5 pb-2 text-center">
        <div aria-hidden className="mb-[-4px] text-2xl drop-shadow">
          🫧
        </div>
        <Link
          to="/map"
          search={{ auto: 0 }}
          onClick={() => unlockAudio()} // warm + prime iOS audio early (recurring-player path)
          aria-label={t("home.worldPhase", { world: CURRENT_WORLD, phase: CURRENT_PHASE })}
          className="gs-btn gs-btn--hero mx-auto w-full max-w-xs flex-col gap-0.5 px-4 py-2.5"
        >
          <span style={{ fontSize: 20 }}>
            {t("home.worldPhase", { world: CURRENT_WORLD, phase: CURRENT_PHASE })}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.95 }}>
            {t("home.tapToPlay")}
          </span>
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

/**
 * §13 Pop Challenge home tile: soft-3D icon + glossy caption. Tappable when the
 * challenge is available; while on cooldown it dims and shows a live countdown to
 * the next one (ticking every second). Reads the cooldown after mount so SSR /
 * prerender (no localStorage) doesn't cause a hydration mismatch.
 */
function PopChallengeTile({ onStart }: { onStart: () => void }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const tick = () => setMs(msUntilChallenge());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const available = ms <= 0;
  const label = available ? t("home.daily") : t("challenge.in", { t: formatCooldown(ms) });

  return (
    <button
      type="button"
      onClick={available ? onStart : undefined}
      disabled={!available}
      aria-label={label}
      className="flex w-[76px] flex-col items-center gap-1"
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: available ? "pointer" : "default",
      }}
    >
      <div
        style={{ opacity: available ? 1 : 0.55, filter: available ? undefined : "grayscale(0.4)" }}
      >
        <IconTile variant="blue" size={64}>
          🎯
        </IconTile>
      </div>
      <span
        className="w-full rounded-lg px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-tight text-white tabular-nums"
        style={{
          background: available
            ? "linear-gradient(var(--gs-green-1), var(--gs-green-2))"
            : "linear-gradient(#9aa4b2, #7f8a99)",
          border: "2px solid #fff",
          boxShadow: available ? "0 3px 0 var(--gs-green-edge)" : "0 3px 0 #6b7482",
          textShadow: "0 1px 1px rgba(0,0,0,.25)",
        }}
      >
        {label}
      </span>
    </button>
  );
}
