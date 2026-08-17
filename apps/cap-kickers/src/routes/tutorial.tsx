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

const PITCH_COLOR = "#1f7a44";
const CAP_COLOR = "#3b82f6";
const KEEPER_COLOR = "#f4c542";
const GOLD = "#ffd54a";

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
      className="relative flex min-h-dvh flex-col items-center px-6 pb-8 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      <button
        type="button"
        onClick={finish}
        className="absolute right-5 text-sm font-semibold text-muted-foreground"
        style={{ top: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        Skip
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">Cap Kickers</h1>

      <div className="mt-6 flex items-center gap-2" role="img" aria-label={`Step ${i + 1} of ${stepCount}`}>
        {Array.from({ length: stepCount }).map((_, dotIndex) => (
          <span
            key={dotIndex}
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: dotIndex === i ? GOLD : "rgba(148, 163, 184, 0.35)" }}
          />
        ))}
      </div>

      <div className="mt-6 w-full max-w-xs">
        <TutorialIllustration stepId={step.id} />
      </div>

      <h2 className="mt-6 text-xl font-bold text-foreground">{step.title}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{step.body}</p>

      <div className="mt-auto flex w-full max-w-xs gap-3 pt-8">
        {i > 0 ? (
          <button
            type="button"
            onClick={() => setI(i - 1)}
            className="flex-1 rounded-full border-2 border-primary py-4 text-base font-semibold text-primary bg-transparent shadow-lg active:scale-[0.98]"
          >
            Back
          </button>
        ) : null}
        {isLastStep(i) ? (
          <button
            type="button"
            onClick={finish}
            className="flex-1 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            Start playing
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setI(i + 1)}
            className="flex-1 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function Pitch() {
  return (
    <>
      <rect x="8" y="8" width="184" height="114" rx="10" fill={PITCH_COLOR} />
      <rect x="8" y="8" width="184" height="114" rx="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      {/* Goal mouth, open toward the pitch (left) */}
      <path
        d="M 178 46 H 194 V 84 H 178"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function Cap({ x, y, ringed = false }: { x: number; y: number; ringed?: boolean }) {
  return (
    <>
      {ringed ? <circle cx={x} cy={y} r="12" fill="none" stroke={GOLD} strokeWidth="2.5" /> : null}
      <circle cx={x} cy={y} r="8" fill={CAP_COLOR} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
    </>
  );
}

function ArrowDefs({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill={GOLD} />
      </marker>
    </defs>
  );
}

function TutorialIllustration({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "select":
      return (
        <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label="Tap a cap to select it">
          <Pitch />
          <Cap x={40} y={45} ringed />
          <Cap x={40} y={65} />
          <Cap x={40} y={85} />
        </svg>
      );
    case "thread":
      return (
        <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label="Flick a cap between the other two">
          <Pitch />
          <ArrowDefs id="thread-arrow" />
          {/* Gate pair, vertically arranged */}
          <Cap x={110} y={38} />
          <Cap x={110} y={92} />
          {/* Third cap flicking through the gate */}
          <Cap x={40} y={65} />
          <line
            x1="52"
            y1="65"
            x2="158"
            y2="65"
            stroke={GOLD}
            strokeWidth="3"
            strokeDasharray="2 5"
            strokeLinecap="round"
            markerEnd="url(#thread-arrow)"
          />
        </svg>
      );
    case "advance":
      return (
        <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label="Advance the caps up the pitch">
          <Pitch />
          <Cap x={110} y={45} />
          <Cap x={125} y={65} />
          <Cap x={110} y={85} />
          {/* Touch counter: 4 dots, 2-3 filled */}
          {[0, 1, 2, 3].map((dotIndex) => (
            <circle
              key={dotIndex}
              cx={70 + dotIndex * 16}
              cy={112}
              r="4"
              fill={dotIndex < 3 ? GOLD : "none"}
              stroke={GOLD}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      );
    case "shoot":
      return (
        <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label="Shoot at the goal past the keeper">
          <Pitch />
          <ArrowDefs id="shoot-arrow" />
          <Cap x={140} y={65} />
          <line
            x1="150"
            y1="65"
            x2="172"
            y2="65"
            stroke={GOLD}
            strokeWidth="3"
            strokeDasharray="2 5"
            strokeLinecap="round"
            markerEnd="url(#shoot-arrow)"
          />
          {/* Keeper blocking the mouth */}
          <rect x="180" y="55" width="10" height="20" rx="3" fill={KEEPER_COLOR} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        </svg>
      );
    case "intro":
    default:
      return (
        <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label="Overview of the pitch and caps">
          <Pitch />
          <Cap x={40} y={45} />
          <Cap x={40} y={65} />
          <Cap x={40} y={85} />
        </svg>
      );
  }
}
