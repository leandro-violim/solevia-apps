import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { LEVELS, isCompleted, isUnlocked } from "../game/campaign/ladder";
import { loadProgress } from "../game/campaign/storage";

export const Route = createFileRoute("/campaign")({
  head: () => ({
    meta: [{ title: "Cap Kickers — Campaign" }],
  }),
  component: CampaignPage,
});

// Difficulty accent colours — mirror the main-menu Easy/Normal/Hard pills.
const DIFF: Record<string, { bg: string; shadow: string; fg: string }> = {
  easy: { bg: "#1fb457", shadow: "#128040", fg: "#ffffff" },
  normal: { bg: "#ffcf33", shadow: "#d8a400", fg: "#4a3600" },
  hard: { bg: "#ff5a3c", shadow: "#c8341c", fg: "#ffffff" },
};

function CampaignPage() {
  const [progress] = useState(() => loadProgress());

  return (
    <div
      className="relative flex h-dvh flex-col items-center px-6 pb-8"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 32px)" }}
    >
      <h1 className="font-display text-5xl uppercase tracking-tight text-foreground drop-shadow-[0_3px_0_rgba(18,40,28,0.12)]">
        Campaign
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm font-medium text-muted-foreground">
        Beat each rival to unlock the next.
      </p>

      <div className="mt-7 flex w-full max-w-sm flex-1 flex-col gap-3 overflow-y-auto pb-2">
        {LEVELS.map((level, index) => {
          const unlocked = isUnlocked(level.id, progress);
          const completed = isCompleted(level.id, progress);
          const diff = DIFF[level.difficulty] ?? DIFF.normal;

          // Locked: a dimmed sticker with a padlock medal.
          if (!unlocked) {
            return (
              <div
                key={level.id}
                className="flex items-center gap-3.5 rounded-2xl bg-white/55 px-4 py-3.5 shadow-[0_4px_0_#cdddd3]"
              >
                <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-lg text-muted-foreground">
                  🔒
                </span>
                <span className="flex flex-1 flex-col items-start text-left">
                  <span className="font-display text-lg uppercase leading-none tracking-wide text-muted-foreground">
                    {level.name}
                  </span>
                  <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                    Locked
                  </span>
                </span>
              </div>
            );
          }

          return (
            <Link
              key={level.id}
              to="/play"
              search={{
                mode: "ai",
                difficulty: level.difficulty,
                goals: level.goalsToWin,
                campaign: level.id,
              }}
              className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
            >
              {/* Medal: gold ✓ once beaten, else the level number in its difficulty colour. */}
              <span
                className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                style={
                  completed
                    ? { background: "#ffcf33", color: "#4a3600", boxShadow: "0 3px 0 #d8a400" }
                    : { background: diff.bg, color: diff.fg, boxShadow: `0 3px 0 ${diff.shadow}` }
                }
              >
                {completed ? "✓" : index + 1}
              </span>

              <span className="flex flex-1 flex-col items-start text-left">
                <span className="font-display text-lg uppercase leading-none tracking-wide text-foreground">
                  {level.name}
                </span>
                <span
                  className="mt-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: diff.bg }}
                >
                  {level.difficulty} · First to {level.goalsToWin}
                </span>
              </span>

              {completed ? (
                <span
                  className="font-display rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide"
                  style={{ background: "#ffcf33", color: "#4a3600", boxShadow: "0 3px 0 #d8a400" }}
                >
                  Done
                </span>
              ) : (
                <span
                  className="font-display rounded-full bg-primary px-4 py-1.5 text-sm uppercase tracking-wide text-white"
                  style={{ boxShadow: "0 3px 0 #128040" }}
                >
                  Play
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <Link
        to="/"
        className="font-display mt-5 w-full max-w-sm rounded-full bg-white py-3.5 text-center text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
      >
        Back
      </Link>
    </div>
  );
}
