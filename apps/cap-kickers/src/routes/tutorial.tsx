import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { TUTORIAL_STEPS, isLastStep, stepCount } from "../game/tutorial/steps";
import { markTutorialSeen, clearTutorialSeen } from "../game/tutorial/storage";
import { trackTutorialBegin, trackTutorialComplete, trackTutorialSkip } from "../lib/analytics";
import { useT } from "../lib/i18n";
import { drawPitch, drawGoal, drawCap, drawKeeper } from "../game/render/draw";
import { styleById, type CapStyle } from "../game/caps/styles";
import { loadCapStyleId } from "../game/caps/storage";
import { pitchStyleById, type PitchStyle } from "../game/pitches/styles";
import { loadPitchStyleId } from "../game/pitches/storage";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [{ title: "Cap Kickers — How to Play" }],
  }),
  component: TutorialPage,
});

const GOLD = "#ffcf33";

function TutorialPage() {
  const t = useT();
  const [i, setI] = useState(0);
  // Checked = don't auto-show the tutorial on future launches (the default).
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const step = TUTORIAL_STEPS[i];
  const nav = useNavigate();

  // One tutorial_begin per visit to the tutorial.
  useEffect(() => {
    trackTutorialBegin();
  }, []);

  // `completed` distinguishes "Start playing" on the last step from the Skip
  // button, which is the drop-off signal we actually care about.
  const finish = (completed: boolean) => {
    if (completed) trackTutorialComplete();
    else trackTutorialSkip(i);
    // Honour the "don't show again" choice: keep re-arming it when unchecked so a
    // first-time player who wants a refresher sees it again next launch.
    if (dontShowAgain) markTutorialSeen();
    else clearTutorialSeen();
    nav({ to: "/" });
  };

  return (
    <div
      className="relative flex screen flex-col items-center px-6 pb-8 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 32px)" }}
    >
      <button
        type="button"
        onClick={() => finish(false)}
        className="font-display absolute right-5 text-sm uppercase tracking-wide text-muted-foreground"
        style={{ top: "calc(env(safe-area-inset-top) + 14px)" }}
      >
        {t("tutorial.skip")}
      </button>

      <h1 className="font-display text-4xl uppercase tracking-tight text-foreground drop-shadow-[0_3px_0_rgba(18,40,28,0.12)]">
        Cap <span className="text-primary">Kickers</span>
      </h1>

      <div
        className="mt-5 flex items-center gap-2"
        role="img"
        aria-label={`Step ${i + 1} of ${stepCount}`}
      >
        {Array.from({ length: stepCount }).map((_, dotIndex) => (
          <span
            key={dotIndex}
            className="h-2.5 rounded-full transition-all"
            style={{
              width: dotIndex === i ? 22 : 10,
              backgroundColor: dotIndex === i ? GOLD : "rgba(95, 120, 105, 0.3)",
            }}
          />
        ))}
      </div>

      {/* Framed pitch illustration — a little arcade "screen". */}
      <div className="mt-6 w-full max-w-xs rounded-3xl bg-white p-3 shadow-[0_6px_0_#cdddd3]">
        <TutorialScene stepId={step.id} />
      </div>

      <h2 className="font-display mt-6 text-2xl uppercase tracking-wide text-foreground">
        {t(`tutorial.${step.id}.title`)}
      </h2>
      <p className="mt-2 max-w-xs text-sm font-medium text-muted-foreground">{t(`tutorial.${step.id}.body`)}</p>

      {isLastStep(i) ? (
        <button
          type="button"
          role="switch"
          aria-checked={dontShowAgain}
          onClick={() => setDontShowAgain((v) => !v)}
          className="mt-auto flex items-center gap-2.5 pt-8 text-sm font-medium text-muted-foreground"
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2"
            style={{
              borderColor: dontShowAgain ? "#1fb457" : "#cbd8cf",
              background: dontShowAgain ? "#1fb457" : "transparent",
            }}
          >
            {dontShowAgain ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
          {t("tutorial.dontShow")}
        </button>
      ) : null}

      <div className={`flex w-full max-w-xs gap-3 pt-4 ${isLastStep(i) ? "" : "mt-auto pt-8"}`}>
        {i > 0 ? (
          <button
            type="button"
            onClick={() => setI(i - 1)}
            className="font-display flex-1 rounded-full bg-white py-4 text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
          >
            {t("tutorial.back")}
          </button>
        ) : null}
        {isLastStep(i) ? (
          <button type="button" onClick={() => finish(true)} className="arcade-btn arcade-btn--gold flex-1 py-4 text-lg">
            {t("tutorial.start")}
          </button>
        ) : (
          <button type="button" onClick={() => setI(i + 1)} className="arcade-btn flex-1 py-4 text-lg">
            {t("tutorial.next")}
          </button>
        )}
      </div>
    </div>
  );
}

// The illustrations below are drawn on a canvas using the SAME art the game
// uses (drawPitch / drawCap / drawGoal / drawKeeper), so the tutorial caps look
// exactly like the caps the player flicks — including their chosen cap skin.
const SCENE_W = 210;
const SCENE_H = 130;

/** An arrow (line + filled head) in the 210×130 illustration space. */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  if (dashed) ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 9;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.42) * h, y2 - Math.sin(a - 0.42) * h);
  ctx.lineTo(x2 - Math.cos(a + 0.42) * h, y2 - Math.sin(a + 0.42) * h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Paint one tutorial step with the real gameplay pitch/cap/goal/keeper art. */
function drawTutorialScene(
  ctx: CanvasRenderingContext2D,
  stepId: string,
  cap: CapStyle,
  pitch: PitchStyle,
) {
  ctx.clearRect(0, 0, SCENE_W, SCENE_H);
  const field: { x: number; y: number; w: number; h: number } = { x: 4, y: 4, w: 182, h: 122 };
  const scale = 0.5;
  drawPitch(ctx, field, scale, pitch);

  const R = 10; // cap radius — reads like the gameplay caps
  const cy = field.y + field.h / 2; // vertical centre (65)
  const drawC = (x: number, y: number, angle = 0) => drawCap(ctx, x, y, R, cap, { angle });

  // A real goal net on the right — this is a soccer game.
  const goal = { x: field.x + field.w - 2, y: cy - 20, w: 16, h: 40 };
  drawGoal(ctx, goal, "right", scale);

  switch (stepId) {
    case "flick": {
      drawC(40, 40);
      drawC(40, 90);
      // Speed ghosts trailing the flicked cap.
      ctx.save();
      ctx.globalAlpha = 0.22;
      drawCap(ctx, 58, cy, R * 0.9, cap, {});
      ctx.globalAlpha = 0.4;
      drawCap(ctx, 72, cy, R, cap, {});
      ctx.restore();
      drawC(90, cy, 0.5);
      drawArrow(ctx, 105, cy, 150, cy, GOLD);
      break;
    }
    case "thread": {
      drawC(120, 42); // gate (top)
      drawC(120, 88); // gate (bottom)
      drawC(46, cy);
      drawArrow(ctx, 60, cy, 150, cy, GOLD, true);
      break;
    }
    case "advance": {
      drawC(96, 44);
      drawC(116, cy);
      drawC(96, 86);
      // Touch counter: 5 pips, 4 filled.
      for (let i = 0; i < 5; i++) {
        const px = 66 + i * 15;
        ctx.beginPath();
        ctx.arc(px, 118, 4.2, 0, Math.PI * 2);
        if (i < 4) {
          ctx.fillStyle = GOLD;
          ctx.fill();
        } else {
          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
      break;
    }
    case "shoot": {
      drawC(118, cy, 0.6);
      drawArrow(ctx, 132, cy, goal.x - 2, cy, GOLD);
      drawKeeper(ctx, goal.x - 3, cy, 8);
      break;
    }
    case "middle": {
      // Three caps in a column; ring the middle one and send it forward.
      drawC(52, 40);
      drawC(52, 90);
      ctx.save();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(52, cy, R + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawC(52, cy, 0.4);
      drawArrow(ctx, 70, cy, 150, cy, GOLD);
      break;
    }
    case "intro":
    default: {
      drawC(44, 42);
      drawC(44, cy);
      drawC(44, 88);
      break;
    }
  }
}

const SCENE_LABEL: Record<string, string> = {
  flick: "Flick a cap with your finger",
  middle: "Start each turn with the middle cap",
  thread: "Flick a cap between the other two",
  advance: "Five touches to work up the pitch",
  shoot: "Shoot past the keeper into the goal",
  intro: "Your three caps line up in front of the goal",
};

/** Renders a tutorial step on a canvas with the real gameplay cap art. */
function TutorialScene({ stepId }: { stepId: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const cap = useMemo(() => styleById(loadCapStyleId()), []);
  const pitch = useMemo(() => pitchStyleById(loadPitchStyleId()), []);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const SS = 4; // supersample for crisp edges, then CSS-scale to fit
    c.width = SCENE_W * SS;
    c.height = SCENE_H * SS;
    ctx.setTransform(SS, 0, 0, SS, 0, 0);
    drawTutorialScene(ctx, stepId, cap, pitch);
  }, [stepId, cap, pitch]);
  return (
    <canvas
      ref={ref}
      className="w-full"
      style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
      role="img"
      aria-label={SCENE_LABEL[stepId] ?? SCENE_LABEL.intro}
    />
  );
}
