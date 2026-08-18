import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { TUTORIAL_STEPS, isLastStep, stepCount } from "../game/tutorial/steps";
import { markTutorialSeen } from "../game/tutorial/storage";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [{ title: "Cap Kickers — How to Play" }],
  }),
  component: TutorialPage,
});

// Arcade palette (mirrors the field + HUD).
const GRASS = "#37a75a";
const GRASS_STRIPE = "#2f9a54";
const LINE = "rgba(255,255,255,0.9)";
const CAP_COLOR = "#2f7bff";
const CAP_RIM = "#1b4fb0";
const KEEPER_COLOR = "#ffbe2e";
const GOLD = "#ffcf33";

function TutorialPage() {
  const [i, setI] = useState(0);
  const step = TUTORIAL_STEPS[i];
  const nav = useNavigate();

  const finish = () => {
    markTutorialSeen();
    nav({ to: "/" });
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center px-6 pb-8 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 32px)" }}
    >
      <button
        type="button"
        onClick={finish}
        className="font-display absolute right-5 text-sm uppercase tracking-wide text-muted-foreground"
        style={{ top: "calc(env(safe-area-inset-top) + 14px)" }}
      >
        Skip
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
        <TutorialIllustration stepId={step.id} />
      </div>

      <h2 className="font-display mt-6 text-2xl uppercase tracking-wide text-foreground">
        {step.title}
      </h2>
      <p className="mt-2 max-w-xs text-sm font-medium text-muted-foreground">{step.body}</p>

      <div className="mt-auto flex w-full max-w-xs gap-3 pt-8">
        {i > 0 ? (
          <button
            type="button"
            onClick={() => setI(i - 1)}
            className="font-display flex-1 rounded-full bg-white py-4 text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
          >
            Back
          </button>
        ) : null}
        {isLastStep(i) ? (
          <button type="button" onClick={finish} className="arcade-btn arcade-btn--gold flex-1 py-4 text-lg">
            Start playing
          </button>
        ) : (
          <button type="button" onClick={() => setI(i + 1)} className="arcade-btn flex-1 py-4 text-lg">
            Next
          </button>
        )}
      </div>
    </div>
  );
}

/** Mown-grass pitch with an open goal mouth on the right. */
function Pitch() {
  return (
    <>
      <rect x="4" y="4" width="192" height="122" rx="12" fill={GRASS} />
      {/* Mown vertical stripes */}
      {[28, 76, 124, 172].map((x) => (
        <rect key={x} x={x} y="4" width="24" height="122" fill={GRASS_STRIPE} opacity="0.55" />
      ))}
      <rect x="4" y="4" width="192" height="122" rx="12" fill="none" stroke={LINE} strokeWidth="2" />
      {/* Goal mouth, open toward the pitch (right side) */}
      <path
        d="M 196 46 H 208 V 84 H 196"
        fill="none"
        stroke={LINE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/** A stylised bottle-cap top. */
function Cap({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y + 1.2} r="9" fill="rgba(0,0,0,0.18)" />
      <circle cx={x} cy={y} r="9" fill={CAP_RIM} />
      <circle cx={x} cy={y} r="7" fill={CAP_COLOR} />
      <ellipse cx={x - 2.4} cy={y - 2.8} rx="2.6" ry="1.6" fill="rgba(255,255,255,0.7)" />
    </>
  );
}

function FlickArrow({ id }: { id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={GOLD} />
    </marker>
  );
}

function TutorialIllustration({ stepId }: { stepId: string }) {
  switch (stepId) {
    // Flick, don't aim: a cap launching with a speed trail.
    case "flick":
      return (
        <svg viewBox="0 0 210 130" className="w-full" role="img" aria-label="Flick a cap with your finger">
          <defs>
            <FlickArrow id="flick-arrow" />
          </defs>
          <Pitch />
          <Cap x={40} y={38} />
          <Cap x={40} y={92} />
          {/* Trailing speed ghosts behind the flicked cap */}
          <circle cx={54} cy={65} r="5" fill={CAP_COLOR} opacity="0.2" />
          <circle cx={68} cy={65} r="6.5" fill={CAP_COLOR} opacity="0.35" />
          <Cap x={86} y={65} />
          <line
            x1="98"
            y1="65"
            x2="150"
            y2="65"
            stroke={GOLD}
            strokeWidth="3.5"
            strokeLinecap="round"
            markerEnd="url(#flick-arrow)"
          />
        </svg>
      );
    case "thread":
      return (
        <svg viewBox="0 0 210 130" className="w-full" role="img" aria-label="Flick a cap between the other two">
          <defs>
            <FlickArrow id="thread-arrow" />
          </defs>
          <Pitch />
          {/* Gate pair */}
          <Cap x={116} y={38} />
          <Cap x={116} y={92} />
          {/* Third cap flicking through the gate */}
          <Cap x={46} y={65} />
          <line
            x1="58"
            y1="65"
            x2="170"
            y2="65"
            stroke={GOLD}
            strokeWidth="3.5"
            strokeDasharray="2 6"
            strokeLinecap="round"
            markerEnd="url(#thread-arrow)"
          />
        </svg>
      );
    case "advance":
      return (
        <svg viewBox="0 0 210 130" className="w-full" role="img" aria-label="Five touches to work up the pitch">
          <Pitch />
          <Cap x={104} y={42} />
          <Cap x={122} y={65} />
          <Cap x={104} y={88} />
          {/* Touch counter: 5 pips, 4 filled */}
          {[0, 1, 2, 3, 4].map((dotIndex) => (
            <circle
              key={dotIndex}
              cx={64 + dotIndex * 18}
              cy={116}
              r="4.5"
              fill={dotIndex < 4 ? GOLD : "none"}
              stroke={GOLD}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      );
    case "shoot":
      return (
        <svg viewBox="0 0 210 130" className="w-full" role="img" aria-label="Shoot past the keeper into the goal">
          <defs>
            <FlickArrow id="shoot-arrow" />
          </defs>
          <Pitch />
          <Cap x={150} y={65} />
          <line
            x1="160"
            y1="65"
            x2="190"
            y2="65"
            stroke={GOLD}
            strokeWidth="3.5"
            strokeLinecap="round"
            markerEnd="url(#shoot-arrow)"
          />
          {/* Keeper guarding the mouth */}
          <rect
            x="196"
            y="55"
            width="9"
            height="20"
            rx="3"
            fill={KEEPER_COLOR}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
          />
        </svg>
      );
    case "intro":
    default:
      return (
        <svg viewBox="0 0 210 130" className="w-full" role="img" aria-label="Your three caps line up in front of the goal">
          <Pitch />
          <Cap x={46} y={38} />
          <Cap x={46} y={65} />
          <Cap x={46} y={92} />
        </svg>
      );
  }
}
