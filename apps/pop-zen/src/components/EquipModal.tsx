import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { t } from "../lib/i18n";
import { track } from "../lib/analytics";
import {
  getCount,
  consumeItems,
  buyConsumable,
  grantConsumables,
  priceOfConsumable,
  subscribeInventory,
  CONSUMABLE_EMOJI,
  type ConsumableId,
} from "../lib/consumables";
import { getCoins, addCoins } from "../lib/economy";
import { showRewarded } from "../lib/ads";
import { unlockAudio } from "../lib/pop-sound";
import { CoinBalance } from "./CoinBalance";
import { PlayIcon, CoinIcon } from "./icons";

// Free bombs + snowflakes granted by the "Rewarded Play" button (on top of what
// the player equipped). Drives ad watches and hands out power-ups (Leandro).
const BOOST = { bomb: 1, freeze: 1 };

/**
 * Journey equip popup (v1.3). Shown when the player taps a phase on the map. Each
 * "+" IRREVERSIBLY arms one bomb / snowflake onto the stage: it uses a unit the
 * player already OWNS (free), or, if none are left, BUYS one with coins. There is
 * no "−": equipping cannot be undone. Because items are consumed/bought as they're
 * added, Play does NOT consume again. "Rewarded Play" watches an ad for a FREE +1
 * boost of each, then starts. `onStart(bombs, freeze)` enters the phase with those
 * counts.
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
  // Equipped-so-far counts for THIS phase (each already consumed from inventory
  // or bought with coins the moment it was added — never undone).
  const [bombs, setBombs] = useState(0);
  const [freeze, setFreeze] = useState(0);
  const [busy, setBusy] = useState(false);

  const bombN = bombs;
  const freezeN = freeze;

  // Track, per item, what each "+" cost this session so a CANCEL (close without
  // Play) can hand it all back: `used` = units taken from inventory, `bought` =
  // units purchased with coins. There's no "−" mid-session (equipping can't be
  // undone one at a time), but closing the popup must never silently burn coins
  // or owned items.
  const usedRef = useRef<Record<ConsumableId, number>>({ bomb: 0, freeze: 0 });
  const boughtRef = useRef<Record<ConsumableId, number>>({ bomb: 0, freeze: 0 });
  const committedRef = useRef(false); // set once the player commits (Play / boost)

  // Add one of `id` to this phase. Prefer an owned unit (free); otherwise buy one
  // with coins. No-op if unaffordable and none owned.
  const add = (id: ConsumableId, inc: () => void) => {
    if (busy) return;
    if (getCount(id) > 0) {
      consumeItems(id, 1);
      usedRef.current[id] += 1;
      inc();
      return;
    }
    if (buyConsumable(id)) {
      consumeItems(id, 1);
      boughtRef.current[id] += 1;
      inc();
    }
  };

  // Cancel: refund everything armed this session (coins for buys, items for owned
  // units) and close. No-op once the player has committed via Play.
  const cancel = () => {
    if (busy) return;
    if (!committedRef.current) {
      (["bomb", "freeze"] as ConsumableId[]).forEach((id) => {
        if (usedRef.current[id] > 0) grantConsumables(id, usedRef.current[id], "equip_cancel");
        if (boughtRef.current[id] > 0)
          addCoins(priceOfConsumable(id) * boughtRef.current[id], "equip_cancel");
      });
      usedRef.current = { bomb: 0, freeze: 0 };
      boughtRef.current = { bomb: 0, freeze: 0 };
    }
    onClose();
  };

  const start = () => {
    if (busy) return;
    committedRef.current = true;
    unlockAudio(); // last gesture before gameplay — prime iOS audio so pops sound
    setBusy(true);
    // Already consumed/bought on each "+", so don't consume again here.
    track("phase_equipped", { world, phase, bombs: bombN, freeze: freezeN, boost: 0 });
    onStart(bombN, freezeN);
  };

  const rewardedStart = async () => {
    if (busy) return;
    committedRef.current = true;
    setBusy(true);
    const watched = await showRewarded("equip_boost");
    const boost = watched ? BOOST.bomb : 0;
    track("phase_equipped", {
      world,
      phase,
      bombs: bombN + boost,
      freeze: freezeN + boost,
      boost: watched ? 1 : 0,
    });
    onStart(bombN + boost, freezeN + boost);
  };

  const EquipRow = ({
    id,
    emoji,
    label,
    value,
    onAdd,
  }: {
    id: ConsumableId;
    emoji: string;
    label: string;
    value: number;
    onAdd: () => void;
  }) => {
    const owned = getCount(id);
    const price = priceOfConsumable(id);
    const free = owned > 0; // next "+" uses an owned unit (no coins)
    const canAfford = getCoins() >= price;
    const disabled = busy || (!free && !canAfford);
    return (
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
          <div className="flex items-center gap-2 text-[11px]">
            <span className="gs-muted">{t("equip.owned", { n: owned })}</span>
            <span
              className={`inline-flex items-center gap-0.5 tabular-nums ${
                free ? "gs-muted opacity-60 line-through" : "text-gold font-semibold"
              }`}
            >
              <CoinIcon size={12} />
              {price}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-5 text-center text-base font-extrabold tabular-nums"
            style={{ color: "var(--gs-ink)" }}
          >
            {value}
          </span>
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled}
            aria-label={free ? `${label} +1` : `${label} +1 (${price})`}
            className="gs-hud h-8 w-8 justify-center text-lg font-bold disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      onClose={busy ? undefined : cancel}
      closeLabel={t("bonus.close")}
      overlayClassName="gs-dialog-overlay"
      panelClassName="gs-panel relative w-full max-w-xs p-6 text-center"
      closeClassName="text-[color:var(--gs-ink-soft)] hover:text-[color:var(--gs-ink)]"
    >
      <div className="flex justify-center">
        <CoinBalance className="text-sm font-bold" />
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.25em] gs-muted">
        {t("play.worldPhase", { world, phase, per: 8 })}
      </div>
      <h2 className="mt-1 text-2xl font-extrabold" style={{ color: "var(--gs-ink)" }}>
        {t("equip.title")}
      </h2>
      <p className="mx-auto mt-1 max-w-[16rem] text-sm gs-muted">{t("equip.desc")}</p>

      <div className="mt-4 space-y-2">
        <EquipRow
          id="bomb"
          emoji={CONSUMABLE_EMOJI.bomb}
          label={t("items.bomb")}
          value={bombN}
          onAdd={() => add("bomb", () => setBombs((n) => n + 1))}
        />
        <EquipRow
          id="freeze"
          emoji={CONSUMABLE_EMOJI.freeze}
          label={t("items.snowflake")}
          value={freezeN}
          onAdd={() => add("freeze", () => setFreeze((n) => n + 1))}
        />
      </div>

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
