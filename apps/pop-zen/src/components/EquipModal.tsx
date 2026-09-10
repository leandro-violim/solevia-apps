import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { t } from "../lib/i18n";
import { track } from "../lib/analytics";
import { getCount, consumeItems, subscribeInventory, CONSUMABLE_EMOJI } from "../lib/consumables";
import { showRewarded } from "../lib/ads";
import { PlayIcon } from "./icons";

// Free bombs + snowflakes granted by the "Rewarded Play" button (on top of what
// the player equipped). Drives ad watches and hands out power-ups (Leandro).
const BOOST = { bomb: 2, freeze: 2 };

/**
 * Journey equip popup (v1.3). Shown when the player taps a phase on the map: they
 * equip bombs / snowflakes they OWN onto the stage (only equipped ones appear on
 * the board — no random specials), then Play. "Rewarded Play" watches an ad for a
 * FREE boost of extra bombs + snowflakes, then starts. `onStart(bombs, freeze)`
 * navigates into the phase with those counts.
 */
export function EquipModal({
  world,
  phase,
  onStart,
  onClose,
}: {
  world: number;
  phase: number;
  onStart: (bombs: number, freeze: number) => void;
  onClose: () => void;
}) {
  const [, force] = useState(0);
  useEffect(() => subscribeInventory(() => force((n) => n + 1)), []);
  const ownedBomb = getCount("bomb");
  const ownedFreeze = getCount("freeze");
  const [bombs, setBombs] = useState(0);
  const [freeze, setFreeze] = useState(0);
  const [busy, setBusy] = useState(false);

  // Keep selections within what's owned (inventory can change via the shop tab).
  const bombN = Math.min(bombs, ownedBomb);
  const freezeN = Math.min(freeze, ownedFreeze);

  const start = () => {
    if (busy) return;
    setBusy(true);
    consumeItems("bomb", bombN);
    consumeItems("freeze", freezeN);
    track("phase_equipped", { world, phase, bombs: bombN, freeze: freezeN, boost: 0 });
    onStart(bombN, freezeN);
  };

  const rewardedStart = async () => {
    if (busy) return;
    setBusy(true);
    const watched = await showRewarded("equip_boost");
    // Consume the owned selection; the BOOST items are free (not from inventory).
    consumeItems("bomb", bombN);
    consumeItems("freeze", freezeN);
    const b = bombN + (watched ? BOOST.bomb : 0);
    const f = freezeN + (watched ? BOOST.freeze : 0);
    track("phase_equipped", { world, phase, bombs: b, freeze: f, boost: watched ? 1 : 0 });
    onStart(b, f);
  };

  const Stepper = ({
    emoji,
    label,
    value,
    owned,
    onChange,
  }: {
    emoji: string;
    label: string;
    value: number;
    owned: number;
    onChange: (v: number) => void;
  }) => (
    <div
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{ background: "rgba(0,0,0,0.04)" }}
    >
      <span aria-hidden className="text-2xl leading-none">
        {emoji}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-sm font-bold" style={{ color: "var(--gs-ink)" }}>
          {label}
        </div>
        <div className="text-[11px] gs-muted">{t("equip.owned", { n: owned })}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          aria-label="−"
          className="gs-hud h-8 w-8 justify-center text-lg font-bold disabled:opacity-30"
        >
          −
        </button>
        <span
          className="w-5 text-center text-base font-extrabold tabular-nums"
          style={{ color: "var(--gs-ink)" }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(owned, value + 1))}
          disabled={value >= owned}
          aria-label="+"
          className="gs-hud h-8 w-8 justify-center text-lg font-bold disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      onClose={busy ? undefined : onClose}
      closeLabel={t("bonus.close")}
      overlayClassName="gs-dialog-overlay"
      panelClassName="gs-panel relative w-full max-w-xs p-6 text-center"
      closeClassName="text-[color:var(--gs-ink-soft)] hover:text-[color:var(--gs-ink)]"
    >
      <div className="text-[11px] uppercase tracking-[0.25em] gs-muted">
        {t("play.worldPhase", { world, phase, per: 8 })}
      </div>
      <h2 className="mt-1 text-2xl font-extrabold" style={{ color: "var(--gs-ink)" }}>
        {t("equip.title")}
      </h2>
      <p className="mx-auto mt-1 max-w-[16rem] text-sm gs-muted">{t("equip.desc")}</p>

      <div className="mt-4 space-y-2">
        <Stepper
          emoji={CONSUMABLE_EMOJI.bomb}
          label={t("items.bomb")}
          value={bombN}
          owned={ownedBomb}
          onChange={setBombs}
        />
        <Stepper
          emoji={CONSUMABLE_EMOJI.freeze}
          label={t("items.snowflake")}
          value={freezeN}
          owned={ownedFreeze}
          onChange={setFreeze}
        />
      </div>

      {ownedBomb === 0 && ownedFreeze === 0 && (
        <p className="mt-3 text-[11px] gs-muted">{t("equip.getMore")}</p>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          onClick={start}
          disabled={busy}
          className="gs-btn w-full py-3.5 disabled:opacity-50"
        >
          {t("equip.play")}
        </button>
        <button
          onClick={rewardedStart}
          disabled={busy}
          className="gs-btn gs-btn--ghost w-full gap-1.5 py-3 text-sm disabled:opacity-50"
        >
          <PlayIcon size={15} />
          {t("equip.boostPlay", { n: BOOST.bomb })}
        </button>
      </div>
    </Modal>
  );
}
