import { CONSUMABLE_EMOJI } from "../lib/consumables";
import { t } from "../lib/i18n";

/**
 * In-play power-up HUD (Pop Challenge only): Bomb + Time Freeze with live counts.
 * Tapping Bomb ARMS it (next bubble tap detonates); Freeze is used instantly.
 * Buttons disable at 0 stock; the between-stage panel is where players restock.
 * Rendered as a compact toolbar ABOVE the bubble field so it never covers the
 * bubbles (they get very small on late phases).
 */
export function ItemHud({
  bombCount,
  freezeCount,
  bombArmed,
  onBomb,
  onFreeze,
  freezeDisabled,
}: {
  bombCount: number;
  freezeCount: number;
  bombArmed: boolean;
  onBomb: () => void;
  onFreeze: () => void;
  freezeDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onBomb}
        disabled={bombCount <= 0}
        aria-label={t("items.bomb")}
        aria-pressed={bombArmed}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-md transition disabled:opacity-40 ${
          bombArmed ? "bg-coral text-white ring-2 ring-white/70" : "gs-hud"
        }`}
      >
        <span aria-hidden className="text-base leading-none">
          {CONSUMABLE_EMOJI.bomb}
        </span>
        <span>×{bombCount}</span>
      </button>

      <button
        type="button"
        onClick={onFreeze}
        disabled={freezeDisabled || freezeCount <= 0}
        aria-label={t("items.freeze")}
        className="gs-hud flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-md transition disabled:opacity-40"
      >
        <span aria-hidden className="text-base leading-none">
          {CONSUMABLE_EMOJI.freeze}
        </span>
        <span>×{freezeCount}</span>
      </button>
    </div>
  );
}
