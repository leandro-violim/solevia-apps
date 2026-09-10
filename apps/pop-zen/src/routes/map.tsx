import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { z } from "zod";
import { TOTAL_ROUNDS, PHASES_PER_ROUND, roundOf, phaseInRound } from "../lib/game-config";
import { reachedStage, stageState } from "../lib/progress";
import { HexNode, MascotHop } from "../components/gameshell";
import { EquipModal } from "../components/EquipModal";
import { t } from "../lib/i18n";
import { unlockAudio } from "../lib/pop-sound";
import { track } from "../lib/analytics";
import { trackModeSelected } from "../lib/mode";
import { fadeMusicIn, fadeMusicOut } from "../lib/music";
import { CoinBalance } from "../components/CoinBalance";
import { ResourcePill } from "../components/gameshell";
import sky from "../assets/scene/sky.webp";
import world1 from "../assets/scene/world-1.webp";
import world2 from "../assets/scene/world-2.webp";
import world3 from "../assets/scene/world-3.webp";
import world4 from "../assets/scene/world-4.webp";

const WORLD_BG = [world1, world2, world3, world4];
// Per-world node anchors (x%, y% of the SQUARE world image) — Cowork baked the 8
// tan pads at exactly these coordinates in each island (world-maps v3), so the
// phase markers sit dead-centre on the pads, ordered pad1→pad8 along the rope.
// The section is shown SQUARE (full image, no crop) so these percentages map 1:1.
const WORLD_NODES: [number, number][][] = [
  // World 1 — daytime, green trees. Coordinates are the MEASURED centres of the 8
  // baked pads (detected from world-1.webp), so each marker sits on its pad.
  [
    [37.4, 32.8],
    [49.0, 34.5],
    [59.6, 38.4],
    [51.8, 44.0],
    [42.0, 49.9],
    [50.9, 55.4],
    [57.7, 62.0],
    [45.8, 65.6],
  ],
  // World 2 — tropical, palms
  [
    [36.0, 33.0],
    [31.8, 42.6],
    [29.9, 52.8],
    [36.7, 60.5],
    [45.5, 65.9],
    [55.8, 64.5],
    [64.7, 59.2],
    [66.0, 49.0],
  ],
  // World 3 — sunset
  [
    [34.0, 37.0],
    [41.8, 30.9],
    [51.2, 28.3],
    [60.8, 30.1],
    [65.8, 38.4],
    [67.2, 48.2],
    [62.5, 56.6],
    [55.0, 63.0],
  ],
  // World 4 — night + aurora
  [
    [64.0, 28.0],
    [46.0, 27.0],
    [32.0, 36.0],
    [27.0, 50.0],
    [33.0, 62.0],
    [47.0, 69.0],
    [62.0, 68.0],
    [72.0, 56.0],
  ],
];
// The portal sits just past pad8, baked into each image (world-maps v3). Tapping
// it advances to the next world's first phase (when unlocked).
const WORLD_PORTALS: [number, number][] = [
  [36.8, 63.3],
  [67.7, 35.6],
  [45.0, 70.5],
  [78.2, 46.9],
];

// `auto=1` means we arrived here between phases: the mascot HOPS from the phase
// just cleared to the new one, the new node's lock is removed on arrival, and we
// wait for the player to tap Play (no auto-start).
const searchSchema = z.object({ auto: z.coerce.number().optional().default(0) });

export const Route = createFileRoute("/map")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [{ title: "Your journey — Zen Bubbles" }],
  }),
  component: MapPage,
});

type Pos = { left: number; top: number };

function MapPage() {
  // `auto` is a numeric search param (0/1); coerce to a real boolean so
  // `{auto && …}` never renders a stray "0" on the screen.
  const auto = Route.useSearch({ select: (s) => s.auto === 1 });
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const curNodeRef = useRef<HTMLDivElement>(null);
  const prevNodeRef = useRef<HTMLDivElement>(null);
  const panRaf = useRef<number>(0);
  // Read progress AFTER mount: on the server (SSR/dev) there is no localStorage,
  // so it would render as reached=1 and the client would keep that. Start at the
  // SSR-safe default, then sync to the real value on the client.
  const [reached, setReached] = useState(1);
  useEffect(() => {
    setReached(reachedStage());
  }, []);

  useEffect(() => {
    fadeMusicIn();
    return () => fadeMusicOut();
  }, []);

  // Between-phases sequence state.
  // - mascotPos: absolute position (px, relative to the map content) of the buddy,
  //   anchored on the NEW node; a CSS animation carries it from the old one.
  // - travelVec: (previous - current) offset in px, fed to the gsTravel keyframe.
  //   null → no travel (non-auto browsing, or reduced motion).
  // - arrived: the new node is unlocked and Play is offered. onAnimationEnd sets it.
  const [mascotPos, setMascotPos] = useState<Pos | null>(null);
  const [travelVec, setTravelVec] = useState<{ dx: number; dy: number } | null>(null);
  const [arrived, setArrived] = useState(!auto);
  // The stage whose equip popup is open (tap a phase → equip bombs/snowflakes → play).
  const [equipStage, setEquipStage] = useState<number | null>(null);

  // Tapping a phase opens the equip popup rather than playing immediately.
  const openEquip = useCallback((stage: number) => {
    unlockAudio();
    setEquipStage(stage);
  }, []);

  // Start a phase with the chosen equipped bombs / snowflakes (from the popup).
  const startPhase = useCallback(
    (stage: number, bombs: number, freeze: number) => {
      trackModeSelected("time-attack");
      navigate({
        to: "/play",
        search: {
          phase: stage,
          mode: "time-attack",
          difficulty: "normal",
          daily: 0,
          bombs,
          freeze,
        },
      });
    },
    [navigate],
  );

  // Animate window scroll so `el` ends up centred (reduced-motion → jump).
  const panTo = useCallback((el: HTMLElement, reduce: boolean) => {
    const targetY =
      el.getBoundingClientRect().top +
      window.scrollY -
      window.innerHeight / 2 +
      el.offsetHeight / 2;
    const y = Math.max(0, targetY);
    if (reduce) {
      window.scrollTo(0, y);
      return;
    }
    window.scrollTo(0, 0);
    const start = performance.now();
    const dur = 900;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      window.scrollTo(0, y * e);
      if (p < 1) panRaf.current = requestAnimationFrame(step);
    };
    panRaf.current = requestAnimationFrame(step);
  }, []);

  // Position the mascot + (in `auto`) set up the hop-to-next-node travel. The
  // motion itself is a CSS keyframe (see .gsTravel) so it can't be disrupted by
  // React re-running this effect; here we only compute the anchor + offset.
  useEffect(() => {
    const content = contentRef.current;
    const curEl = curNodeRef.current;
    if (!content || !curEl) return;
    const centre = (el: HTMLElement): Pos => {
      const c = content.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // Sit the buddy OVER the pad (centred on the node); the "You are here" label
      // rides just above the buddy's head (rendered with the mascot below).
      return {
        left: r.left - c.left + r.width / 2,
        top: r.top - c.top + r.height / 2,
      };
    };
    const reduce =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const curPos = centre(curEl);

    // Normal browsing: rest the buddy on the current node.
    if (!auto) {
      setMascotPos(curPos);
      setTravelVec(null);
      setArrived(true);
      panTo(curEl, reduce);
      return;
    }

    // Between phases (auto): `reached` is always ≥2. Ignore the SSR-default
    // reached=1 pass (and any render before the previous node exists) so it can't
    // prematurely mark us "arrived" — we act only once the real progress is known.
    if (reached <= 1 || !prevNodeRef.current) return;

    setMascotPos(curPos); // wrapper anchored on the NEW node

    if (reduce) {
      setTravelVec(null);
      setArrived(true);
      panTo(curEl, true);
      return;
    }

    // Feed the (prev − cur) offset to the gsTravel keyframe, which starts the
    // buddy on the just-cleared node and eases it to the new one.
    const prevPos = centre(prevNodeRef.current);
    setTravelVec({ dx: prevPos.left - curPos.left, dy: prevPos.top - curPos.top });
    setArrived(false);
    panTo(curEl, false);
    return () => {
      if (panRaf.current) cancelAnimationFrame(panRaf.current);
    };
  }, [auto, reached, panTo]);

  // Tap: while the buddy is still hopping across, skip to the end; once it's
  // arrived, start the phase.
  const onTap = () => {
    if (!auto) return;
    if (arrived) openEquip(reached);
    else setArrived(true);
  };

  return (
    <div
      className="gs-home relative min-h-dvh"
      onClick={onTap}
      style={{
        backgroundImage: `url(${sky})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {auto && arrived && (
        <div
          className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
          // Lifted above the native bottom banner so the ad never covers it.
          style={{ bottom: "calc(var(--ad-banner-h, 100px) + env(safe-area-inset-bottom) + 12px)" }}
        >
          <span className="gs-ribbon">{t("home.tapToPlay")} →</span>
        </div>
      )}
      {/* header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 px-3 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          background: "linear-gradient(to bottom, rgba(255,225,200,0.9), rgba(255,225,200,0))",
        }}
      >
        <Link
          to="/"
          aria-label={t("home.title")}
          className="gs-nav__btn"
          style={{ width: 42, height: 42 }}
        >
          ←
        </Link>
        <h1 className="text-lg font-extrabold" style={{ color: "var(--gs-ink)" }}>
          {t("map.title")}
        </h1>
        <Link to="/shop" aria-label={t("home.shop")} className="ml-auto">
          <ResourcePill icon="🪙" plus>
            <CoinBalance />
          </ResourcePill>
        </Link>
      </div>

      {/* worlds, top (World 1) → bottom (World 4). Each = a painted island scene
          (Cowork/Higgsfield) with the 8 phase nodes overlaid at deterministic
          anchors. A soft wash keeps the nodes + label legible over the art. */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex max-w-md flex-col gap-4 px-4 pt-2"
        // Reserve the real banner height so the lowest node / portal always clears
        // the native bottom banner (AdMob "ads obscuring content" fix).
        style={{
          paddingBottom: "calc(var(--ad-banner-h, 100px) + env(safe-area-inset-bottom) + 16px)",
        }}
      >
        {Array.from({ length: TOTAL_ROUNDS }, (_, wi) => {
          const world = wi + 1;
          return (
            <section
              key={world}
              className="relative overflow-hidden rounded-3xl border border-white/40 shadow-lg"
              style={{
                // SQUARE so Cowork's baked pad coordinates (% of the square image)
                // map 1:1 onto the phase markers — no cover-crop to account for.
                aspectRatio: "1 / 1",
                backgroundImage: `url(${WORLD_BG[wi]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              {/* world name chip */}
              <div className="absolute left-3 top-3 z-10">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{ background: "rgba(255,255,255,0.85)", color: "var(--gs-ink)" }}
                >
                  {t("world.label")} {world} · {t(`world.r${world}.name`)}
                </span>
              </div>

              {/* 8 phase nodes */}
              {Array.from({ length: PHASES_PER_ROUND }, (_, pi) => {
                const p = pi + 1;
                const stage = wi * PHASES_PER_ROUND + p;
                const baseState = stageState(stage, reached);
                const isCurrent = stage === reached;
                const isPrev = stage === reached - 1;
                // Until the buddy arrives (auto), the new node still reads as
                // locked — then the lock is removed with a pop.
                const showLocked = isCurrent && auto && !arrived;
                const state = showLocked ? "locked" : baseState;
                const [x, y] = WORLD_NODES[wi][pi];
                const node = (
                  // "You are here" now rides above the mascot's head (see the
                  // overlay below), not the node, so we don't pass hereLabel.
                  // Sized to sit WITHIN the baked tan pads (~8% of the island) so
                  // each star fits its pad and no two overlap (World 1 is crowded).
                  <HexNode n={p} state={state} size={isCurrent ? 34 : 30} />
                );
                const interactive = state !== "locked";
                return (
                  <div
                    key={p}
                    ref={isCurrent ? curNodeRef : isPrev ? prevNodeRef : undefined}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {interactive ? (
                      <button
                        type="button"
                        onClick={() => openEquip(stage)}
                        aria-label={`${t("world.label")} ${world} · ${p}`}
                        className={isCurrent && arrived && auto ? "gs-unlock" : undefined}
                        style={{
                          border: 0,
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {node}
                      </button>
                    ) : (
                      <div aria-label={`${t("world.label")} ${world} · ${p}`}>{node}</div>
                    )}
                  </div>
                );
              })}

              {/* Portal past pad 8 — baked into the art; a tap here continues to
                  the next world's first phase once it's unlocked. */}
              {(() => {
                const [px, py] = WORLD_PORTALS[wi];
                const nextStage = world * PHASES_PER_ROUND + 1; // first phase of next world
                const unlocked =
                  nextStage <= TOTAL_ROUNDS * PHASES_PER_ROUND && reached >= nextStage;
                if (!unlocked) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      track("portal_used", { from_world: world, to_world: world + 1 });
                      openEquip(nextStage);
                    }}
                    aria-label={t("map.portal")}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${px}%`,
                      top: `${py}%`,
                      width: "17%",
                      aspectRatio: "1 / 1",
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  />
                );
              })()}
            </section>
          );
        })}

        {/* The bubble-buddy: one overlay anchored on the NEW node. Between phases
            it HOPS across from the cleared node via the gsTravel keyframe (it waits
            on the old node while the map pans, then eases over and the legs cycle);
            onAnimationEnd unlocks the node + offers Play. Normal browsing → it just
            rests on the current node. */}
        {mascotPos && (
          <div
            className="pointer-events-none absolute z-20"
            onAnimationEnd={() => setArrived(true)}
            style={
              {
                left: mascotPos.left,
                top: mascotPos.top,
                transform: "translate(-50%, -50%)",
                ...(travelVec && !arrived
                  ? {
                      "--dx": `${travelVec.dx}px`,
                      "--dy": `${travelVec.dy}px`,
                      animation: "gsTravel 1.5s ease-in-out 0.9s both",
                    }
                  : {}),
              } as CSSProperties
            }
          >
            {/* "You are here" label hidden for now (Leandro: too cluttered) — the
                mascot on the pad already marks the current phase. */}
            <MascotHop
              size={48}
              play={!!travelVec && !arrived}
              style={{ filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.25))" }}
            />
          </div>
        )}
      </div>

      {/* Equip popup — tap a phase → choose bombs/snowflakes → Play (or Rewarded
          Play for a free boost). Only equipped power-ups appear on the board. */}
      {equipStage != null && (
        <EquipModal
          world={roundOf(equipStage)}
          phase={phaseInRound(equipStage)}
          onStart={(bombs, freeze) => startPhase(equipStage, bombs, freeze)}
          onClose={() => setEquipStage(null)}
        />
      )}
    </div>
  );
}
