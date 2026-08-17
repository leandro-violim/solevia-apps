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

function CampaignPage() {
  const [progress] = useState(() => loadProgress());

  return (
    <div
      className="relative flex h-dvh flex-col items-center px-6 pb-8 pt-14"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Campaign</h1>

      <div className="mt-8 flex w-full max-w-xs flex-1 flex-col gap-3 overflow-y-auto">
        {LEVELS.map((level) => {
          const unlocked = isUnlocked(level.id, progress);
          const completed = isCompleted(level.id, progress);

          if (!unlocked) {
            return (
              <div
                key={level.id}
                className="flex items-center justify-between rounded-2xl border-2 border-muted bg-transparent px-5 py-4 text-muted-foreground opacity-60"
              >
                <span className="flex items-center gap-2 text-base font-semibold">
                  <span aria-hidden="true">🔒</span>
                  {level.name}
                </span>
                <span className="text-xs font-medium">Locked</span>
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
              className="flex items-center justify-between rounded-2xl border-2 border-primary bg-transparent px-5 py-4 text-primary shadow-lg active:scale-[0.98]"
            >
              <span className="flex flex-col items-start text-left">
                <span className="text-base font-semibold">{level.name}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {level.difficulty} · First to {level.goalsToWin}
                </span>
              </span>
              {completed ? (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  ✓ Done
                </span>
              ) : (
                <span className="text-sm font-semibold">Play</span>
              )}
            </Link>
          );
        })}
      </div>

      <Link
        to="/"
        className="mt-6 w-full max-w-xs rounded-full border-2 border-primary py-3 text-center text-base font-semibold text-primary shadow-lg active:scale-[0.98]"
      >
        Back
      </Link>
    </div>
  );
}
