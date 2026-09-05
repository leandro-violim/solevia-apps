import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { LEVELS, isCompleted, isUnlocked, levelReward, LAST_LEVEL_ID } from "../game/campaign/ladder";
import { loadProgress } from "../game/campaign/storage";
import { loadOwned } from "../game/economy/inventory";
import { rewardView, type RewardView } from "../game/campaign/reward-display";
import { styleById } from "../game/caps/styles";
import { useT } from "../lib/i18n";

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

/** A little preview tile of a reward — the pitch surface, or a glyph for audio. */
function RewardTile({ view, size, dim }: { view: RewardView; size: number; dim?: boolean }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-[#7a5a2e]/20"
      style={{ width: size, height: size, background: "#fdf7ea", opacity: dim ? 0.5 : 1 }}
    >
      {view.img ? (
        <img src={view.img} alt="" className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.5 }}>{view.emoji}</span>
      )}
    </span>
  );
}

function CampaignPage() {
  const t = useT();
  const [progress] = useState(() => loadProgress());
  const [owned] = useState(() => loadOwned());
  const rewardName = (v: RewardView) => (v.nameKey ? t(v.nameKey) : (v.name ?? ""));

  // The reward road: every phase that grants something, in order, with its claim
  // state. The "next reward" is the nearest one not yet earned — the carrot.
  const road = LEVELS.map((level, index) => {
    const reward = levelReward(level.id);
    return reward ? { level, index, view: rewardView(reward), claimed: owned.includes(reward.itemId) } : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  const nextReward = road.find((r) => !r.claimed) ?? null;

  // Grand prize: the legendary cap for clearing the whole ladder.
  const grandCap = styleById("gold-legendary");
  const campaignDone = isCompleted(LAST_LEVEL_ID, progress);

  return (
    <div
      className="relative flex screen flex-col items-center px-4 pb-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}
    >
      <div className="panel flex w-full max-w-md flex-col items-center px-5 py-6">
        <h1 className="font-display text-5xl uppercase tracking-tight text-foreground drop-shadow-[0_3px_0_rgba(120,80,40,0.18)]">
          {t("campaign.title")}
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm font-medium text-muted-foreground">
          {t("campaign.subtitle")}
        </p>

        {/* Next-reward spotlight — the "here's what you're playing for" carrot. */}
        {nextReward ? (
          <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-[#fff7e0] px-4 py-3 shadow-[0_4px_0_#e8cf88] ring-1 ring-[#e0b84e]/45">
            <RewardTile view={nextReward.view} size={56} />
            <div className="flex flex-1 flex-col items-start text-left">
              <span className="font-display text-[11px] uppercase tracking-[0.18em] text-[#b8860b]">
                {t("campaign.nextReward")}
              </span>
              <span className="font-display text-lg uppercase leading-tight text-foreground">
                {rewardName(nextReward.view)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("campaign.nextRewardCta", { n: nextReward.index + 1, name: nextReward.level.name })}
              </span>
            </div>
            <span className="text-2xl">🎁</span>
          </div>
        ) : (
          <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-[#fff7e0] px-4 py-3 shadow-[0_4px_0_#e8cf88] ring-1 ring-[#e0b84e]/45">
            <span className="text-3xl">🏆</span>
            <div className="flex flex-1 flex-col items-start text-left">
              <span className="font-display text-[11px] uppercase tracking-[0.18em] text-[#b8860b]">
                {t("campaign.allUnlockedTitle")}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">{t("campaign.allUnlockedBody")}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3 pb-1">
          {LEVELS.map((level, index) => {
            const unlocked = isUnlocked(level.id, progress);
            const completed = isCompleted(level.id, progress);
            const diff = DIFF[level.difficulty] ?? DIFF.normal;
            const reward = levelReward(level.id);
            const view = reward ? rewardView(reward) : null;
            const claimed = reward ? owned.includes(reward.itemId) : false;

            // Reward chip shown on any phase that grants something — even locked
            // ones, so players can see the prizes waiting further down the road.
            const rewardChip = view ? (
              <span
                className="mt-1.5 inline-flex items-center gap-1.5 self-start rounded-full py-1 pl-1 pr-2.5 text-[11px] font-bold uppercase tracking-wide"
                style={
                  claimed
                    ? { background: "#fff2c9", color: "#8a6a00" }
                    : { background: "#f1ece1", color: "#8a6b4a" }
                }
              >
                <RewardTile view={view} size={18} dim={!claimed && !unlocked} />
                {claimed ? "✓ " : ""}
                {rewardName(view)}
              </span>
            ) : null;

            // Locked: a dimmed sticker with a padlock medal (still shows its prize).
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
                      {t("campaign.locked")}
                    </span>
                    {rewardChip}
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
                    {t(`diff.${level.difficulty}`)} · {t("campaign.firstTo", { n: level.goalsToWin })}
                  </span>
                  {rewardChip}
                </span>

                {completed ? (
                  <span
                    className="font-display rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide"
                    style={{ background: "#ffcf33", color: "#4a3600", boxShadow: "0 3px 0 #d8a400" }}
                  >
                    {t("campaign.done")}
                  </span>
                ) : (
                  <span
                    className="font-display rounded-full bg-primary px-4 py-1.5 text-sm uppercase tracking-wide text-white"
                    style={{ boxShadow: "0 3px 0 #128040" }}
                  >
                    {t("campaign.play")}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Grand prize: the legendary cap for clearing every phase. */}
          <div
            className="mt-1 flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
            style={{
              background: campaignDone ? "#fff2c9" : "#f5efe2",
              boxShadow: campaignDone ? "0 5px 0 #e0b84e" : "0 4px 0 #ddd3c2",
            }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-inner">
              {campaignDone ? "🏆" : "🔒"}
            </span>
            <span className="flex flex-1 flex-col items-start text-left">
              <span className="font-display text-[11px] uppercase tracking-[0.18em] text-[#b8860b]">
                {t("campaign.grandPrize")}
              </span>
              <span className="font-display text-lg uppercase leading-none tracking-wide text-foreground">
                {grandCap.name}
              </span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {campaignDone ? t("campaign.done") : t("campaign.grandPrizeCta")}
              </span>
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="font-display mt-5 w-full max-w-sm rounded-full bg-white py-3.5 text-center text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
        >
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
