import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { GameSession } from "../game/session";
import { PITCH, PHYSICS, CAP_RADIUS, SWIPE, FLICK, MATCH } from "../game/constants";
import { makePresentation, pitchToScreen, screenToPitch } from "../game/presentation";
import { capAtPoint, flickToVelocity, type FlickSample } from "../game/input-mapping";
import { chooseAiFlick } from "../game/ai/policy";
import { drawPitch, drawGoal, drawCap, drawKeeper } from "../game/render/draw";
import { styleById, opponentFor } from "../game/caps/styles";
import { loadCapStyleId } from "../game/caps/storage";
import { pitchStyleById } from "../game/pitches/styles";
import { loadPitchStyleId } from "../game/pitches/storage";
import { completeLevel, levelById, nextLevelId } from "../game/campaign/ladder";
import { loadProgress, saveProgress } from "../game/campaign/storage";
import { type Vec2 } from "../game/physics/vec";
import { type MatchState } from "../game/rules/match";
import {
  createFx,
  updateCapFx,
  stepFx,
  shakeOffset,
  goalCelebration,
  drawTrail,
  drawDust,
  drawConfetti,
} from "./-play-fx";

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

// A flick in progress: the grabbed cap plus a rolling buffer of timestamped
// finger positions (pitch space) used to measure the release speed on lift-off.
type Drag = { capId: string; samples: FlickSample[] };
type Banner = { text: string; key: number };
type CanvasSize = { cssW: number; cssH: number; dpr: number };

const SELECT_RING = "#ffcf33"; // reward gold (HUD touch pips)
const GOAL_DEPTH = 40; // pitch units the goal frame protrudes outward
const AI_SIDE = 1; // human is side 0
const AI_THINK_SECONDS = 0.5;

function PlayPage() {
  const { mode, difficulty, goals, campaign } = Route.useSearch();

  // Cap styles: the player's chosen cap vs a contrasting opponent cap. Side 0
  // (human/Player 1) uses the chosen style; side 1 (Player 2 / AI) the opponent.
  const playerStyle = useState(() => styleById(loadCapStyleId()))[0];
  const pitchStyle = useState(() => pitchStyleById(loadPitchStyleId()))[0];
  const oppStyle = opponentFor(playerStyle.id);
  const teamColors: [string, string] = [playerStyle.base, oppStyle.base];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  if (sessionRef.current === null)
    sessionRef.current = new GameSession({
      match: { ...MATCH, goalsToWin: goals },
      keeperDifficulty: mode === "ai" ? difficulty : "normal",
    });

  const sizeRef = useRef<CanvasSize>({ cssW: 0, cssH: 0, dpr: 1 });
  // Camera: zoom (z) + focus point (fx,fy) in CSS-pixel base-screen space. It
  // frames the caps up close so they're big/easy to tap, and eases to follow
  // the action. `init` snaps to the target on the first frame (no fly-in flash).
  const camRef = useRef({ z: 1, fx: 0, fy: 0, init: false });
  // Purely-cosmetic juice state (spin, trails, dust, confetti, shake). UI-only.
  const fxRef = useRef(createFx());
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
      match: { ...MATCH, goalsToWin: goals },
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

    const render = (session: GameSession, dt: number) => {
      const { cssW, cssH, dpr } = sizeRef.current;
      if (cssW === 0 || cssH === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Advance juice particles + apply a decaying screen-shake to the whole
      // scene (pitch, caps, and confetti all shift together).
      const fx = fxRef.current;
      stepFx(fx, dt);
      const sh = shakeOffset(fx);
      ctx.translate(sh.x, sh.y);

      const pres = makePresentation(PITCH, { width: cssW, height: cssH }, flippedRef.current);
      const topLeft = pitchToScreen({ x: 0, y: 0 }, pres);
      const bottomRight = pitchToScreen({ x: PITCH.width, y: PITCH.height }, pres);
      const rectX = Math.min(topLeft.x, bottomRight.x);
      const rectY = Math.min(topLeft.y, bottomRight.y);
      const pitchW = Math.abs(bottomRight.x - topLeft.x);
      const pitchH = Math.abs(bottomRight.y - topLeft.y);
      if (pitchW < 8 || pitchH < 8) return; // skip degenerate/first-layout frames

      // Camera: frame every point of interest — always ALL caps (so a cap left
      // behind stays on-screen and reachable), plus the target goal while a shot
      // is in flight (so the strike into the net is actually visible). Zoom in
      // for big, tappable caps but never so far that a POI falls off-screen.
      const cam = camRef.current;
      {
        const cs = session.caps();
        const pts = cs.map((cap) => pitchToScreen(cap.position, pres));
        const shotGoal = session.framedGoal();
        if (shotGoal) {
          const gx = shotGoal === "left" ? -GOAL_DEPTH : PITCH.width + GOAL_DEPTH;
          const gHalf = PITCH.goalWidth / 2;
          pts.push(pitchToScreen({ x: gx, y: PITCH.height / 2 - gHalf }, pres));
          pts.push(pitchToScreen({ x: gx, y: PITCH.height / 2 + gHalf }, pres));
        }
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const p of pts) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
        const capScreenR = (cs[0]?.radius ?? CAP_RADIUS) * pres.viewport.scale;
        const marginPx = capScreenR * 3; // breathing room around the framed points
        // fitZ: the largest zoom that still fits every point (+margin) on screen.
        const fitZ = Math.min(
          cssW / Math.max(1, maxX - minX + marginPx * 2),
          cssH / Math.max(1, maxY - minY + marginPx * 2),
        );
        // Prefer a comfortable finger-sized cap, but never zoom past fitZ (which
        // would push a POI off-screen). Lower bound keeps it from over-zooming
        // out on an extreme spread.
        const targetR = Math.min(cssW, cssH) * 0.15;
        const tz = Math.max(0.6, Math.min(4, Math.min(targetR / Math.max(1, capScreenR), fitZ)));
        const tfx = (minX + maxX) / 2; // centre the framed points
        const tfy = (minY + maxY) / 2;
        if (!cam.init) {
          cam.z = tz;
          cam.fx = tfx;
          cam.fy = tfy;
          cam.init = true;
        } else {
          const k = shotGoal ? 0.2 : 0.14; // track a little snappier during a shot
          cam.z += (tz - cam.z) * k;
          cam.fx += (tfx - cam.fx) * k;
          cam.fy += (tfy - cam.fy) * k;
        }
      }
      ctx.save();
      ctx.translate(cssW / 2, cssH / 2);
      ctx.scale(cam.z, cam.z);
      ctx.translate(-cam.fx, -cam.fy);

      const scale = pres.viewport.scale;

      // Pitch: grass stripes + markings.
      drawPitch(ctx, { x: rectX, y: rectY, w: pitchW, h: pitchH }, scale, pitchStyle);

      // Goals: framed nets protruding outward from each end line.
      const half = PITCH.goalWidth / 2;
      const midY = PITCH.height / 2;
      for (const goalX of [0, PITCH.width]) {
        const outwardX = goalX === 0 ? -GOAL_DEPTH : PITCH.width + GOAL_DEPTH;
        const a = pitchToScreen({ x: Math.min(goalX, outwardX), y: midY - half }, pres);
        const b = pitchToScreen({ x: Math.max(goalX, outwardX), y: midY + half }, pres);
        const gx = Math.min(a.x, b.x);
        const gy = Math.min(a.y, b.y);
        const gw = Math.abs(b.x - a.x);
        const gh = Math.abs(b.y - a.y);
        // The back post is the OUTWARD (off-pitch) edge; the mouth stays open.
        const outX = pitchToScreen({ x: outwardX, y: midY }, pres).x;
        const side =
          Math.abs(outX - gx) < Math.abs(outX - (gx + gw)) ? "left" : "right";
        drawGoal(ctx, { x: gx, y: gy, w: gw, h: gh }, side, scale);
      }

      // Caps (all belong to the current attacker → their chosen cap style).
      const attacker = (session.match.attacker % 2) as 0 | 1;
      const capStyle = attacker === 0 ? playerStyle : oppStyle;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
      for (const cap of session.caps()) {
        const c = pitchToScreen(cap.position, pres);
        const r = cap.radius * scale;
        const angle = updateCapFx(fx, cap.id, c.x, c.y, r, dt);
        drawTrail(ctx, fx, cap.id, r, capStyle.base);
        drawCap(ctx, c.x, c.y, r, capStyle, {
          selected: session.selectedCapId === cap.id,
          pulse,
          angle,
        });
      }
      // Impact dust puffs sit on top of the caps (base-screen space).
      drawDust(ctx, fx);

      // Keeper: present only mid-shot.
      const keeper = session.keeper();
      if (keeper) {
        const kc = pitchToScreen(keeper.position, pres);
        drawKeeper(ctx, kc.x, kc.y, keeper.radius * scale);
      }

      // No aim line: the cap launches from the real flick gesture (direction +
      // release speed), so there's no direction/strength preview to draw.

      ctx.restore(); // close the camera transform

      // Goal confetti rains over the whole viewport (final-screen space, but
      // still under the active screen-shake translate).
      drawConfetti(ctx, fx);
    };

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const last = lastTimeRef.current;
      lastTimeRef.current = t;
      const session = sessionRef.current;
      if (!session) return;

      const dt = last !== null ? Math.min((t - last) / 1000, 1 / 30) : 0;
      if (last !== null) {
        const report = session.tick(dt);
        if (report) {
          setMatch(report.match);
          if (report.result === "goal") {
            showBanner("GOAL!");
            goalCelebration(fxRef.current, sizeRef.current.cssW, sizeRef.current.cssH);
          }
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
              shotTouch: MATCH.shotTouch,
              difficulty: difficultyRef.current,
              maxSpeed: SWIPE.maxSpeed,
              rng: Math.random, // varied opponent play — not the same moves each match
            });
            if (move) session.beginFlick(move.capId, move.velocity);
          }
        } else {
          aiThinkRef.current = 0;
        }
      }
      render(session, dt);
    };

    // Paint an initial frame synchronously so the board is visible immediately,
    // without waiting for the first rAF (which also never fires while the tab
    // is backgrounded) — avoids a black flash on load.
    const initialSession = sessionRef.current;
    if (initialSession) render(initialSession, 0);
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
    // Invert the camera zoom/pan (see the render loop) to reach base-screen space.
    const cam = camRef.current;
    const base = {
      x: (local.x - rect.width / 2) / cam.z + cam.fx,
      y: (local.y - rect.height / 2) / cam.z + cam.fy,
    };
    return screenToPitch(base, pres);
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
    // No select step: grabbing a cap just starts tracking the flick. A real
    // flick on release launches it; a graze does nothing.
    dragRef.current = { capId: hitId, samples: [{ pos: pitchPoint, t: e.timeStamp }] };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // Record every position the browser has for this move — coalesced events
    // recover the sub-frame detail of a fast flick that a single sample misses,
    // so the measured release speed is accurate.
    const native = e.nativeEvent;
    const coalesced =
      typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [];
    const list = coalesced.length > 0 ? coalesced : [native];
    for (const ev of list) {
      const p = pitchPointFromEvent(ev);
      if (p) drag.samples.push({ pos: p, t: ev.timeStamp });
    }
    const MAX = 16;
    if (drag.samples.length > MAX) drag.samples.splice(0, drag.samples.length - MAX);
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
    // Add the lift-off position, then launch from the finger's release speed.
    const up = pitchPointFromEvent(e);
    if (up) drag.samples.push({ pos: up, t: e.timeStamp });
    // A soft/slow gesture yields null (below the dead zone) → no launch; the cap
    // simply stays grabbed for another try.
    const velocity = flickToVelocity(drag.samples, FLICK);
    if (velocity) session.beginFlick(drag.capId, velocity);
  };

  const won = match.phase === "won";
  const nextLevel = campaign ? levelById(nextLevelId(campaign) ?? "") : undefined;

  return (
    <div
      className="relative h-dvh w-dvw touch-none overflow-hidden"
      style={{
        background: "radial-gradient(135% 105% at 50% 0%, #12592f 0%, #0c3d23 58%, #072818 100%)",
      }}
    >
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
        <div className="font-display rounded-2xl bg-white/95 px-4 py-1 text-3xl tabular-nums shadow-[0_4px_0_rgba(7,40,24,0.4)] ring-2 ring-black/5">
          <span style={{ color: teamColors[0] }}>{match.scores[0]}</span>
          <span className="px-1.5 text-foreground/25">–</span>
          <span style={{ color: teamColors[1] }}>{match.scores[1]}</span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="font-display rounded-2xl bg-white/95 px-4 py-1 text-lg uppercase tracking-wide text-foreground shadow-[0_4px_0_rgba(7,40,24,0.4)] ring-2 ring-black/5">
            {won
              ? `Player ${match.winner! + 1} wins!`
              : mode === "ai" && match.attacker === AI_SIDE
                ? `AI — touch ${match.touch}/${MATCH.shotTouch}`
                : `Player ${match.attacker + 1} — touch ${match.touch}/${MATCH.shotTouch}`}
          </div>
          <div className="flex gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-md">
            {Array.from({ length: MATCH.shotTouch }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                className="h-3 w-3 rounded-full border-2"
                style={{
                  backgroundColor: !won && n <= match.touch ? SELECT_RING : "transparent",
                  borderColor: !won && n <= match.touch ? "#d8a400" : "#cbd8cf",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar: leave to the main menu, or restart the current match. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 px-6"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Link
          to="/"
          className="font-display pointer-events-auto rounded-full bg-white/90 px-5 py-2 text-xs uppercase tracking-wider text-primary shadow-md active:scale-95"
        >
          ⌂ Menu
        </Link>
        <button
          onClick={handleNewMatch}
          className="font-display pointer-events-auto rounded-full bg-white/90 px-5 py-2 text-xs uppercase tracking-wider text-foreground shadow-md active:scale-95"
        >
          New match
        </button>
      </div>

      {banner &&
        (() => {
          // The big moments (GOAL / winner) get a punchy overshoot pop in gold;
          // routine calls ("Turn over") get a quieter fade-zoom.
          const big = banner.text === "GOAL!" || banner.text.includes("wins");
          return (
            <div
              key={banner.key}
              className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center"
            >
              <div
                className={
                  big
                    ? "goal-pop font-display rounded-2xl bg-black/75 px-8 py-4 text-5xl font-extrabold uppercase tracking-wide text-[#ffcf33] shadow-[0_8px_0_rgba(0,0,0,0.35)]"
                    : "animate-in fade-in zoom-in rounded-2xl bg-black/70 px-6 py-3 text-2xl font-extrabold text-white"
                }
              >
                {banner.text}
              </div>
            </div>
          );
        })()}

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
                <button
                  onClick={handleNewMatch}
                  className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
                >
                  Try again
                </button>
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
