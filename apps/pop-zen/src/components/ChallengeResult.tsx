import { Modal } from "./Modal";
import { t } from "../lib/i18n";
import { CoinIcon } from "./icons";
import { CONSUMABLE_EMOJI } from "../lib/consumables";
import type { ChallengeMission, ChallengeReward } from "../lib/pop-challenge";
import mascotCheer from "../assets/shell/mascot-cheer.webp";
import mascotSad from "../assets/shell/mascot-sad.webp";

/**
 * §13 Pop Challenge result popup. The mission has already been graded and the
 * reward already granted (see completeChallenge) — this just celebrates the
 * prize. Closing it fires the interstitial and returns home (handled by onClose).
 * Both a win and a miss pay out (the miss a consolation), so this always shows a
 * reward; the headline + mascot reflect whether the mission was met.
 */
export function ChallengeResult({
  mission,
  success,
  reward,
  busy,
  onClose,
}: {
  mission: ChallengeMission;
  success: boolean;
  reward: ChallengeReward;
  busy: boolean;
  onClose: () => void;
}) {
  const missionText =
    mission.kind === "pop"
      ? t("challenge.mPop", { n: mission.target })
      : mission.kind === "combo"
        ? t("challenge.mCombo", { n: mission.target })
        : mission.kind === "fast"
          ? t("challenge.mFast", { n: mission.target })
          : t("challenge.mClear");

  const rewardIcon =
    reward.kind === "coins" ? (
      <CoinIcon size={26} className="text-gold" />
    ) : (
      <span aria-hidden className="text-2xl leading-none">
        {CONSUMABLE_EMOJI[reward.kind]}
      </span>
    );
  const rewardLabel =
    reward.kind === "coins"
      ? t("challenge.rewardCoins")
      : reward.kind === "bomb"
        ? t("items.bomb")
        : t("items.snowflake");

  return (
    <Modal
      // No dismiss control — the single Collect button drives close (→ interstitial
      // → home), so the reward is always acknowledged.
      overlayClassName="gs-dialog-overlay"
      panelClassName="gs-panel relative w-full max-w-xs p-6 text-center"
    >
      <img
        src={success ? mascotCheer : mascotSad}
        alt=""
        aria-hidden
        className="mx-auto -mt-16 mb-1 h-24 w-24"
        style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.22))" }}
      />
      <div className="text-[11px] uppercase tracking-[0.25em] gs-muted">{t("challenge.title")}</div>
      <h2
        className="mt-1 text-2xl font-extrabold"
        style={{ color: success ? "var(--gs-blue-2)" : "var(--gs-coral)" }}
      >
        {success ? t("challenge.win") : t("challenge.miss")}
      </h2>
      <p className="mx-auto mt-1 max-w-[16rem] text-sm gs-muted">
        {success ? t("challenge.winDesc") : t("challenge.missDesc")}
      </p>

      {/* Mission recap (met / missed). */}
      <div
        className="mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm"
        style={{ background: "rgba(0,0,0,0.05)", color: "var(--gs-ink)" }}
      >
        <span aria-hidden>{success ? "✅" : "⏱️"}</span>
        <span className="font-semibold">{missionText}</span>
      </div>

      {/* The prize. */}
      <div
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl px-4 py-4"
        style={{ background: "rgba(51,224,198,0.12)" }}
      >
        {rewardIcon}
        <span className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--gs-ink)" }}>
          +{reward.amount}
        </span>
        <span className="text-sm font-semibold gs-muted">{rewardLabel}</span>
      </div>

      <div className="mt-5">
        <button
          onClick={onClose}
          disabled={busy}
          className="gs-btn w-full py-3.5 disabled:opacity-50"
        >
          {t("challenge.collect")}
        </button>
      </div>
    </Modal>
  );
}
