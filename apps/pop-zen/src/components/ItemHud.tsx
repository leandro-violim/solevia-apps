import { CONSUMABLE_EMOJI } from "../lib/consumables";
import { t } from "../lib/i18n";

/**
 * In-play power-up HUD (Pop Challenge only): Bomb + Time Freeze with live counts.
 * Tapping Bomb ARMS it (next bubble tap detonates); Freeze is used instantly.
 * Buttons disable at 0 stock; the between-stage panel is where players restock.
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
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-end justify-between">
      <button
        type="button"
        onClick={onBomb}
        disabled={bombCount <= 0}
        aria-label={t("items.bomb")}
        aria-pressed={bombArmed}
        className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold shadow-lg transition disabled:opacity-40 ${
          bombArmed
            ? "bg-coral text-white ring-2 ring-white/70"
            : "bg-background/80 text-foreground backdrop-blur"
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
        className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-2 text-sm font-bold text-primary shadow-lg backdrop-blur transition disabled:opacity-40"
      >
        <span aria-hidden className="text-base leading-none">
          {CONSUMABLE_EMOJI.freeze}
        </span>
        <span>×{freezeCount}</span>
      </button>
    </div>
  );
}
