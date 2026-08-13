import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { GameSession } from "../game/session";
import { PITCH, CAP_RADIUS, SWIPE } from "../game/constants";
import { computeViewport, pitchToCanvas, canvasToPitch } from "../game/viewport";
import { capAtPoint, swipeToVelocity } from "../game/input-mapping";
import { type Vec2 } from "../game/physics/vec";
import { type MatchState } from "../game/rules/match";

export const Route = createFileRoute("/play")({
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
const GOAL_DEPTH = 40; // pitch units the goal frame protrudes outward

function PlayPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  if (sessionRef.current === null) sessionRef.current = new GameSession();

  const sizeRef = useRef<CanvasSize>({ cssW: 0, cssH: 0, dpr: 1 });
  const dragRef = useRef<Drag | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);
  const bannerKeyRef = useRef(0);

  const [match, setMatch] = useState<MatchState>(() => sessionRef.current!.match);
  const [banner, setBanner] = useState<Banner | null>(null);

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
    sessionRef.current = new GameSession();
    dragRef.current = null;
    setMatch(sessionRef.current.match);
    setBanner(null);
  }, []);

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

      const vp = computeViewport(PITCH, { width: cssW, height: cssH });
      const topLeft = pitchToCanvas({ x: 0, y: 0 }, vp);
      const pitchW = PITCH.width * vp.scale;
      const pitchH = PITCH.height * vp.scale;

      // Pitch fill + boundary.
      ctx.fillStyle = PITCH_FILL;
      ctx.fillRect(topLeft.x, topLeft.y, pitchW, pitchH);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(topLeft.x, topLeft.y, pitchW, pitchH);

      // Halfway line.
      const midTop = pitchToCanvas({ x: PITCH.width / 2, y: 0 }, vp);
      const midBottom = pitchToCanvas({ x: PITCH.width / 2, y: PITCH.height }, vp);
      ctx.beginPath();
      ctx.moveTo(midTop.x, midTop.y);
      ctx.lineTo(midBottom.x, midBottom.y);
      ctx.stroke();

      // Goal mouths: frames protruding outward from each end line.
      const half = PITCH.goalWidth / 2;
      const midY = PITCH.height / 2;
      for (const goalX of [0, PITCH.width]) {
        const outwardX = goalX === 0 ? -GOAL_DEPTH : PITCH.width + GOAL_DEPTH;
        const a = pitchToCanvas({ x: Math.min(goalX, outwardX), y: midY - half }, vp);
        const b = pitchToCanvas({ x: Math.max(goalX, outwardX), y: midY + half }, vp);
        ctx.fillStyle = "rgba(234, 246, 238, 0.25)";
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      }

      // Caps.
      const attackerColor = ATTACKER_COLOR[session.match.attacker];
      for (const cap of session.caps()) {
        const c = pitchToCanvas(cap.position, vp);
        const r = cap.radius * vp.scale;
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
          const capCanvas = pitchToCanvas(capPos, vp);
          const endCanvas = pitchToCanvas(endPitch, vp);

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
        }
      }
      render(session);
    };
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

  const pitchPointFromEvent = (e: { clientX: number; clientY: number }): Vec2 | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const vp = computeViewport(PITCH, { width: rect.width, height: rect.height });
    const local = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    return canvasToPitch(local, vp);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current;
    if (!session || session.phase !== "aiming" || session.match.phase === "won") return;
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
    if (!session || session.phase !== "aiming" || session.match.phase === "won") return;
    if (session.selectedCapId !== drag.capId) return;
    const velocity = swipeToVelocity(drag.start, drag.current, SWIPE);
    if (velocity.x !== 0 || velocity.y !== 0) {
      session.beginFlick(drag.capId, velocity);
    }
  };

  const won = match.phase === "won";

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

      {won && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/65">
          <div className="text-3xl font-bold text-white">Player {match.winner! + 1} wins!</div>
          <button
            onClick={handleNewMatch}
            className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            New match
          </button>
        </div>
      )}
    </div>
  );
}
