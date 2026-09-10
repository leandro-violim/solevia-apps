import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TOTAL_ROUNDS, PHASES_PER_ROUND } from "../lib/game-config";
import { reachedStage, stageState } from "../lib/progress";
import { HexNode } from "../components/gameshell";
import { t } from "../lib/i18n";
import { unlockAudio } from "../lib/pop-sound";
import { trackModeSelected } from "../lib/mode";
import { fadeMusicIn, fadeMusicOut } from "../lib/music";
import { CoinBalance } from "../components/CoinBalance";
import { ResourcePill } from "../components/gameshell";
import sky from "../assets/scene/sky.webp";
import islandHex from "../assets/shell/island-hex.webp";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [{ title: "Your journey — Zen Bubbles" }],
  }),
  component: MapPage,
});

// Winding-path horizontal offsets for the 8 nodes in a world (px).
const ZIG = [-66, -20, 40, 74, 40, -20, -66, -94];

function MapPage() {
  const navigate = useNavigate();
  const currentRef = useRef<HTMLDivElement>(null);
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

  // Land on the current node once progress is known.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [reached]);

  const playStage = (stage: number) => {
    unlockAudio();
    trackModeSelected("time-attack");
    navigate({ to: "/play", search: { phase: stage, mode: "time-attack", difficulty: "normal", daily: 0 } });
  };

  return (
    <div
      className="gs-home relative min-h-dvh"
      style={{ backgroundImage: `url(${sky})`, backgroundSize: "cover", backgroundPosition: "center top" }}
    >
      {/* header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 px-3 pb-2"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          background: "linear-gradient(to bottom, rgba(255,225,200,0.9), rgba(255,225,200,0))",
        }}
      >
        <Link to="/" aria-label={t("home.title")} className="gs-nav__btn" style={{ width: 42, height: 42 }}>
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

      {/* worlds, top (World 1) → bottom (World 4) */}
      <div className="relative z-10 mx-auto flex max-w-md flex-col gap-4 px-4 pb-24 pt-2">
        {Array.from({ length: TOTAL_ROUNDS }, (_, wi) => {
          const world = wi + 1;
          return (
            <section
              key={world}
              className="relative overflow-hidden rounded-3xl border border-white/50 px-3 py-4"
              style={{ background: "rgba(255,255,255,0.28)", backdropFilter: "blur(2px)" }}
            >
              {/* world header */}
              <div className="mb-2 flex items-center gap-2">
                <img src={islandHex} alt="" aria-hidden width={40} height={40} style={{ filter: "drop-shadow(0 3px 4px rgba(120,90,40,.3))" }} />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--gs-ink-soft)" }}>
                    {t("world.label")} {world}
                  </div>
                  <div className="text-sm font-extrabold" style={{ color: "var(--gs-ink)" }}>
                    {t(`world.r${world}.name`)}
                  </div>
                </div>
              </div>

              {/* winding path of 8 nodes; a dashed line runs down the middle */}
              <div className="relative" style={{ minHeight: PHASES_PER_ROUND * 62 }}>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-2"
                  style={{ left: "50%", borderLeft: "3px dashed rgba(255,255,255,0.7)" }}
                />
                {Array.from({ length: PHASES_PER_ROUND }, (_, pi) => {
                  const p = pi + 1;
                  const stage = wi * PHASES_PER_ROUND + p;
                  const state = stageState(stage, reached);
                  const isCurrent = state === "current";
                  const node = (
                    <HexNode
                      n={p}
                      state={state}
                      hereLabel={isCurrent ? t("home.here") : undefined}
                      size={isCurrent ? 58 : 50}
                    />
                  );
                  return (
                    <div
                      key={p}
                      ref={isCurrent ? currentRef : undefined}
                      className="relative flex justify-center"
                      style={{ height: 62, transform: `translateX(${ZIG[pi]}px)` }}
                    >
                      {state === "locked" ? (
                        <div aria-label={`${t("world.label")} ${world} · ${p}`}>{node}</div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => playStage(stage)}
                          aria-label={`${t("world.label")} ${world} · ${p}`}
                          style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}
                        >
                          {node}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
