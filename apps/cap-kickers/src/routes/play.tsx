import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { GameSession } from "../game/session";
import { PITCH, PHYSICS, CAP_RADIUS, SWIPE } from "../game/constants";
import { makePresentation, pitchToScreen, screenToPitch } from "../game/presentation";
import { capAtPoint, swipeToVelocity } from "../game/input-mapping";
import { chooseAiFlick } from "../game/ai/policy";
import { completeLevel, levelById, nextLevelId } from "../game/campaign/ladder";
import { loadProgress, saveProgress } from "../game/campaign/storage";
import { type Vec2 } from "../game/physics/vec";
import { type MatchState } from "../game/rules/match";

const searchSchema = z.object({
  mode: z.enum(["2p", "practice", "ai"]).catch("practice"),
  difficulty: z.enum(["easy", "normal", "hard"]).catch("normal"),
  goals: z.coerce.number().int().min(1).max(20).catch(3),
  campaign: z.string().optional(),
});

export const Route = createFileRoute("/play")({
  validateSearch: searchSchema,
  // Search params don't normally affect route/match identity, so navigating
  // /play -> /play with only search params changing (e.g. "Next level",
  // "Try again") would otherwise reuse the mounted PlayPage instead of
  // remounting it — leaving sessionRef/match/recordedRef frozen on the
  // finished match. Force a remount whenever any identity-relevant search
  // param changes.
  remountDeps: ({ search }) =>
    `${search.mode}|${search.difficulty}|${search.goals}|${search.campaign ?? ""}`,
  head: () => ({
    meta: [{ title: "Cap Kickers — Play" }],
  }),
  component: PlayPage,
});

type Drag = { capId: string; start: Vec2; current: Vec2 };
type Banner = { text: string; key: number };
type CanvasSize = { cssW: number; cssH: number; dpr: number };

const PITCH_FILL = "#1f7a44";
const LINE_COLOR = "#eaf6ee";
const SELECT_RING = "#ffd54a";
const ATTACKER_COLOR: [string, string] = ["#3b82f6", "#f4841f"];
const CAP_STROKE = "#0b3d20";
const KEEPER_FILL = "#f4c542";
const KEEPER_STROKE = "#5a3d00";
const GOAL_DEPTH = 40; // pitch units the goal frame protrudes outward
const AI_SIDE = 1; // human is side 0
const AI_THINK_SECONDS = 0.5;

function PlayPage() {
  const { mode, difficulty, goals, campaign } = Route.useSearch();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  if (sessionRef.current === null)
    sessionRef.current = new GameSession({
      match: { goalsToWin: goals },
      keeperDifficulty: mode === "ai" ? difficulty : "normal",
    });

  const sizeRef = useRef<CanvasSize>({ cssW: 0, cssH: 0, dpr: 1 });
  const dragRef = useRef<Drag | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);
  const bannerKeyRef = useRef(0);
  // Guards against double-recording campaign completion when the "won"
  // match state triggers more than one re-render.
  const recordedRef = useRef(false);

  const [match, setMatch] = useState<MatchState>(() => sessionRef.current!.match);
  const [banner, setBanner] = useState<Banner | null>(null);

  // Which player the board is currently oriented for. Only changes when a
  // pass-the-phone handoff completes, so the outgoing player never sees the
  // board flip out from under them.
  const [viewAttacker, setViewAttacker] = useState<0 | 1>(sessionRef.current!.match.attacker);
  // Non-null while the "pass the phone" overlay is gating input, holding the
  // player the board will flip to once they tap Ready.
  const [handoffTo, setHandoffTo] = useState<0 | 1 | null>(null);

  const flipped = mode === "2p" && viewAttacker === 1;

  // Mirrored into refs for the rAF loop below, which is set up once (stable
  // deps) and must always see the latest mode/flip state without re-running.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const difficultyRef = useRef(difficulty);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);
  const flippedRef = useRef(flipped);
  useEffect(() => {
    flippedRef.current = flipped;
  }, [flipped]);
  // Accumulates elapsed time while it's the AI's turn, so the AI "thinks" for
  // a visible beat before flicking rather than reacting instantly.
  const aiThinkRef = useRef(0);

  const showBanner = useCallback((text: string) => {
    bannerKeyRef.current += 1;
    const key = bannerKeyRef.current;
    setBanner({ text, key });
    if (bannerTimeoutRef.current !== null) window.clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = window.setTimeout(() => {
      setBanner((b) => (b && b.key === key ? null : b));
    }, 1200);
  }, []);

  const handleNewMatch = useCallback(() => {
    sessionRef.current = new GameSession({
      match: { goalsToWin: goals },
      keeperDifficulty: mode === "ai" ? difficulty : "normal",
    });
    dragRef.current = null;
    setMatch(sessionRef.current.match);
    setBanner(null);
    setViewAttacker(sessionRef.current.match.attacker);
    setHandoffTo(null);
    recordedRef.current = false;
  }, [mode, difficulty, goals]);

  // rAF render/tick loop. Owns the canvas backing-store sizing and never
  // touches React state except to publish HUD-relevant snapshots.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      el.width = Math.round(cssW * dpr);
      el.height = Math.round(cssH * dpr);
      sizeRef.current = { cssW, cssH, dpr };
    };
    resize();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    const render = (session: GameSession) => {
      const { cssW, cssH, dpr } = sizeRef.current;
      if (cssW === 0 || cssH === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const pres = makePresentation(PITCH, { width: cssW, height: cssH }, flippedRef.current);
      const topLeft = pitchToScreen({ x: 0, y: 0 }, pres);
      const bottomRight = pitchToScreen({ x: PITCH.width, y: PITCH.height }, pres);
      const rectX = Math.min(topLeft.x, bottomRight.x);
      const rectY = Math.min(topLeft.y, bottomRight.y);
      const pitchW = Math.abs(bottomRight.x - topLeft.x);
      const pitchH = Math.abs(bottomRight.y - topLeft.y);

      // Pitch fill + boundary.
      ctx.fillStyle = PITCH_FILL;
      ctx.fillRect(rectX, rectY, pitchW, pitchH);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(rectX, rectY, pitchW, pitchH);

      // Halfway line.
      const midTop = pitchToScreen({ x: PITCH.width / 2, y: 0 }, pres);
      const midBottom = pitchToScreen({ x: PITCH.width / 2, y: PITCH.height }, pres);
      ctx.beginPath();
      ctx.moveTo(midTop.x, midTop.y);
      ctx.lineTo(midBottom.x, midBottom.y);
      ctx.stroke();

      // Goal mouths: frames protruding outward from each end line.
      const half = PITCH.goalWidth / 2;
      const midY = PITCH.height / 2;
      for (const goalX of [0, PITCH.width]) {
        const outwardX = goalX === 0 ? -GOAL_DEPTH : PITCH.width + GOAL_DEPTH;
        const a = pitchToScreen({ x: Math.min(goalX, outwardX), y: midY - half }, pres);
        const b = pitchToScreen({ x: Math.max(goalX, outwardX), y: midY + half }, pres);
        const ax = Math.min(a.x, b.x);
        const ay = Math.min(a.y, b.y);
        const aw = Math.abs(b.x - a.x);
        const ah = Math.abs(b.y - a.y);
        ctx.fillStyle = "rgba(234, 246, 238, 0.25)";
        ctx.fillRect(ax, ay, aw, ah);
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(ax, ay, aw, ah);
      }

      // Caps.
      const attackerColor = ATTACKER_COLOR[session.match.attacker];
      for (const cap of session.caps()) {
        const c = pitchToScreen(cap.position, pres);
        const r = cap.radius * pres.viewport.scale;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = attackerColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = CAP_STROKE;
        ctx.stroke();

        if (session.selectedCapId === cap.id) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, r + 4, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = SELECT_RING;
          ctx.stroke();
        }
      }

      // Keeper: distinct amber cap, present only mid-shot.
      const keeper = session.keeper();
      if (keeper) {
        const kc = pitchToScreen(keeper.position, pres);
        const kr = keeper.radius * pres.viewport.scale;
        ctx.beginPath();
        ctx.arc(kc.x, kc.y, kr, 0, Math.PI * 2);
        ctx.fillStyle = KEEPER_FILL;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = KEEPER_STROKE;
        ctx.stroke();
      }

      // Aim hint while dragging.
      const drag = dragRef.current;
      if (drag && session.phase === "aiming") {
        const delta = { x: drag.current.x - drag.start.x, y: drag.current.y - drag.start.y };
        const dLen = Math.hypot(delta.x, delta.y);
        if (dLen > 0) {
          const dir = { x: delta.x / dLen, y: delta.y / dLen };
          const speed = Math.min(SWIPE.maxSpeed, Math.max(SWIPE.minSpeed, dLen * SWIPE.power));
          const powerFrac = (speed - SWIPE.minSpeed) / Math.max(1, SWIPE.maxSpeed - SWIPE.minSpeed);
          const cap = session.caps().find((c) => c.id === drag.capId);
          const capPos = cap ? cap.position : drag.start;
          const lineLen = CAP_RADIUS * (3 + powerFrac * 8);
          const endPitch = { x: capPos.x + dir.x * lineLen, y: capPos.y + dir.y * lineLen };
          const capCanvas = pitchToScreen(capPos, pres);
          const endCanvas = pitchToScreen(endPitch, pres);

          ctx.beginPath();
          ctx.moveTo(capCanvas.x, capCanvas.y);
          ctx.lineTo(endCanvas.x, endCanvas.y);
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(255, 213, 74, ${0.45 + 0.55 * powerFrac})`;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(endCanvas.x, endCanvas.y, 5 + powerFrac * 4, 0, Math.PI * 2);
          ctx.fillStyle = SELECT_RING;
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const last = lastTimeRef.current;
      lastTimeRef.current = t;
      const session = sessionRef.current;
      if (!session) return;

      if (last !== null) {
        const dt = Math.min((t - last) / 1000, 1 / 30);
        const report = session.tick(dt);
        if (report) {
          setMatch(report.match);
          if (report.result === "goal") showBanner("GOAL!");
          else if (report.result === "win") showBanner(`Player ${report.match.winner! + 1} wins!`);
          else if (report.result === "turnover") showBanner("Turn over");

          // Gate the next turn behind a pass-the-phone overlay in 2-player
          // hotseat mode. The board itself doesn't flip yet — only when the
          // incoming player taps Ready (see the handoff overlay below) — so
          // the outgoing player never sees the flip happen under them.
          if (
            modeRef.current === "2p" &&
            (report.result === "turnover" || report.result === "goal")
          ) {
            setHandoffTo(report.match.attacker);
          }
        }

        // AI turn driver: while it's the AI's turn to aim, accumulate think
        // time and then let the policy choose + fire a flick. Runs every
        // frame (not just when tick reports something) so the think-delay
        // timer advances continuously.
        if (
          modeRef.current === "ai" &&
          session.phase === "aiming" &&
          session.match.phase !== "won" &&
          session.match.attacker === AI_SIDE
        ) {
          aiThinkRef.current += dt;
          if (aiThinkRef.current >= AI_THINK_SECONDS) {
            aiThinkRef.current = 0;
            const move = chooseAiFlick(session.caps(), {
              pitch: PITCH,
              physics: PHYSICS,
              attacker: session.match.attacker,
              touch: session.match.touch,
              difficulty: difficultyRef.current,
              maxSpeed: SWIPE.maxSpeed,
            });
            if (move) session.beginFlick(move.capId, move.velocity);
          }
        } else {
          aiThinkRef.current = 0;
        }
      }
      render(session);
    };

    // Paint an initial frame synchronously so the board is visible immediately,
    // without waiting for the first rAF (which also never fires while the tab
    // is backgrounded) — avoids a black flash on load.
    const initialSession = sessionRef.current;
    if (initialSession) render(initialSession);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      ro?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [showBanner]);

  useEffect(
    () => () => {
      if (bannerTimeoutRef.current !== null) window.clearTimeout(bannerTimeoutRef.current);
    },
    [],
  );

  // Record campaign level completion exactly once, the moment a campaign
  // match is won by the human player.
  useEffect(() => {
    if (
      campaign &&
      match.phase === "won" &&
      match.winner === 0 &&
      !recordedRef.current
    ) {
      recordedRef.current = true;
      saveProgress(completeLevel(campaign, loadProgress()));
    }
  }, [campaign, match.phase, match.winner]);

  const pitchPointFromEvent = (e: { clientX: number; clientY: number }): Vec2 | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const pres = makePresentation(PITCH, { width: rect.width, height: rect.height }, flipped);
    const local = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    return screenToPitch(local, pres);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current;
    if (
      !session ||
      session.phase !== "aiming" ||
      session.match.phase === "won" ||
      handoffTo !== null ||
      (mode === "ai" && session.match.attacker === AI_SIDE)
    )
      return;
    const pitchPoint = pitchPointFromEvent(e);
    if (!pitchPoint) return;
    const hitId = capAtPoint(pitchPoint, session.caps());
    if (!hitId) return;
    session.selectCap(hitId);
    dragRef.current = { capId: hitId, start: pitchPoint, current: pitchPoint };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pitchPoint = pitchPointFromEvent(e);
    if (!pitchPoint) return;
    drag.current = pitchPoint;
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const session = sessionRef.current;
    if (
      !session ||
      session.phase !== "aiming" ||
      session.match.phase === "won" ||
      handoffTo !== null ||
      (mode === "ai" && session.match.attacker === AI_SIDE)
    )
      return;
    if (session.selectedCapId !== drag.capId) return;
    // Use the pointer-up position as the swipe end (falling back to the last
    // tracked move) so a fast flick with no intermediate pointermove still
    // produces a real velocity.
    const end = pitchPointFromEvent(e) ?? drag.current;
    const velocity = swipeToVelocity(drag.start, end, SWIPE);
    if (velocity.x !== 0 || velocity.y !== 0) {
      session.beginFlick(drag.capId, velocity);
    }
  };

  const won = match.phase === "won";
  const nextLevel = campaign ? levelById(nextLevelId(campaign) ?? "") : undefined;

  return (
    <div className="relative h-dvh w-dvw touch-none overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {/* HUD overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <div className="rounded-full bg-black/50 px-4 py-1.5 text-lg font-bold tabular-nums text-white">
          {match.scores[0]} <span className="text-white/50">–</span> {match.scores[1]}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white">
            {won
              ? `Player ${match.winner! + 1} wins!`
              : mode === "ai" && match.attacker === AI_SIDE
                ? `AI — touch ${match.touch} of 4`
                : `Player ${match.attacker + 1} — touch ${match.touch} of 4`}
          </div>
          <div className="flex gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className="h-2.5 w-2.5 rounded-full border border-white/60"
                style={{
                  backgroundColor: !won && n === match.touch ? SELECT_RING : "transparent",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleNewMatch}
        className="pointer-events-auto absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur active:scale-95"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        New match
      </button>

      {banner && (
        <div
          key={banner.key}
          className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center"
        >
          <div className="animate-in fade-in zoom-in rounded-2xl bg-black/70 px-6 py-3 text-2xl font-extrabold text-white">
            {banner.text}
          </div>
        </div>
      )}

      {/* Pass-the-phone handoff (2p only). Covers the canvas so no flick
          input reaches the game while the phone is changing hands. The win
          overlay below takes priority when both would otherwise apply. */}
      {handoffTo !== null && !won && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/80">
          <div className="text-2xl font-bold text-white">
            Pass the phone to Player {handoffTo + 1}
          </div>
          <button
            onClick={() => {
              setViewAttacker(handoffTo);
              setHandoffTo(null);
            }}
            className="rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            Ready
          </button>
        </div>
      )}

      {won && campaign && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/65">
          {match.winner === 0 ? (
            <>
              <div className="text-3xl font-bold text-white">
                {nextLevel ? "Level complete!" : "Campaign complete!"}
              </div>
              <div className="flex gap-3">
                {nextLevel && (
                  <Link
                    to="/play"
                    search={{
                      mode: "ai",
                      difficulty: nextLevel.difficulty,
                      goals: nextLevel.goalsToWin,
                      campaign: nextLevel.id,
                    }}
                    className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
                  >
                    Next level
                  </Link>
                )}
                <Link
                  to="/campaign"
                  className="rounded-full border-2 border-primary bg-transparent px-6 py-3 text-base font-semibold text-primary shadow-lg active:scale-[0.98]"
                >
                  Back to campaign
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">You lost</div>
              <div className="flex gap-3">
                <Link
                  to="/play"
                  search={{ mode: "ai", difficulty, goals, campaign }}
                  className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
                >
                  Try again
                </Link>
                <Link
                  to="/campaign"
                  className="rounded-full border-2 border-primary bg-transparent px-6 py-3 text-base font-semibold text-primary shadow-lg active:scale-[0.98]"
                >
                  Back to campaign
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {won && !campaign && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/65">
          <div className="text-3xl font-bold text-white">Player {match.winner! + 1} wins!</div>
          <button
            onClick={handleNewMatch}
            className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            Rematch
          </button>
        </div>
      )}
    </div>
  );
}
