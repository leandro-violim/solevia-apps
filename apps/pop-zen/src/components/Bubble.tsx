import { memo, useEffect, useRef, useState } from "react";
import { equippedBubbleFilter } from "../lib/skins";
import { SPECIAL_LOOK, FROZEN_TAPS, type SpecialType } from "../lib/specials";
import bubbleFull from "../assets/bubbles/real-bubble-full.webp";
import bubblePopped from "../assets/bubbles/real-bubble-popped.webp";

// F8 (Mockup C): a matched sprite pair — a plump, glossy FULL bubble and a
// flattened, crinkled POPPED bubble. Popping swaps the texture and scales the
// pocket DOWN (see .zb.popped in styles.css) so it visibly deflates + shrinks.
// This is the default "real" skin; the older A/B bubble styles are reserved as
// future shop skins.

type Props = {
  id: number;
  x: number;
  y: number;
  size: number;
  popped: boolean;
  /** Which particle-tint variant (0–3). Stable per bubble → keeps memo effective. */
  variant: number;
  /** When true, skip the idle float animation to save CPU on dense phases. */
  still?: boolean;
  driftDelay: number;
  /** §7 special-bubble type — changes look + pop effect. */
  special: SpecialType;
  /**
   * Receives the bubble id plus its centre (field-local px), variant, and special
   * type so the parent can drive the particle burst + the special pop effect.
   * Passing geometry here keeps the parent's ONE callback referentially stable.
   */
  onPop: (id: number, cx: number, cy: number, variant: number, special: SpecialType) => void;
};

const R = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * One real bubble-wrap bubble. Unpopped shows the full plump sprite; popping
 * swaps to the deflated sprite, keeps it ROUND, and scales it down with a tiny
 * random tilt (--rot) via the .zb.popped animation in styles.css.
 */
export const Bubble = memo(function Bubble({
  id,
  x,
  y,
  size,
  popped,
  variant,
  still,
  driftDelay,
  special,
  onPop,
}: Props) {
  // One-shot guard so a pointerdown plus its trailing synthetic click (or any
  // rapid double input) pops a bubble only once. Reset when the bubble is
  // re-laid-out (e.g. on restart) so the same id can be popped again.
  const handled = useRef(false);
  // Random tilt (±8°) generated ONCE, then frozen so it's stable across renders.
  const rotRef = useRef<string | null>(null);
  if (rotRef.current === null) rotRef.current = R(-8, 8).toFixed(1) + "deg";
  // Born already popped (Pop for Fun seeds a few)? Then show the deflated sprite
  // WITHOUT the pop animation — no phantom pops when a sheet appears.
  const bornPopped = useRef(popped);

  useEffect(() => {
    if (!popped) handled.current = false;
  }, [popped]);

  // Frozen bubbles (§7) need FROZEN_TAPS taps; earlier taps just crack the ice.
  const [frozenTaps, setFrozenTaps] = useState(0);

  const activate = () => {
    if (popped || handled.current) return;
    if (special === "frozen" && frozenTaps < FROZEN_TAPS - 1) {
      setFrozenTaps((n) => n + 1); // still frozen — needs another tap
      return;
    }
    handled.current = true;
    onPop(id, x + size / 2, y + size / 2, variant, special);
  };

  // Equipped bubble skin (§6) — a CSS filter tint on the button; `undefined` for
  // the Classic/real skin (no tint).
  const skinFilter = equippedBubbleFilter();
  const look = special !== "normal" ? SPECIAL_LOOK[special] : null;

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        // Fast pop on touch/mouse; preventDefault also suppresses the trailing click.
        e.preventDefault();
        activate();
      }}
      // Keyboard (Enter/Space) and assistive tech (VoiceOver / Switch Control) fire
      // click, not pointerdown — this handler is what makes the game operable for them.
      onClick={activate}
      className="absolute select-none touch-manipulation rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: popped ? "none" : "auto",
        animation:
          popped || still ? undefined : `bubbleFloat 4s ease-in-out ${driftDelay}s infinite`,
        WebkitTapHighlightColor: "transparent",
        filter: skinFilter,
        borderRadius: "50%",
        boxShadow: look && !popped ? `0 0 0 2px ${look.ring}, ${look.glow}` : undefined,
      }}
      aria-label="Pop bubble"
    >
      <div
        className={popped ? (bornPopped.current ? "zb popped born" : "zb popped") : "zb"}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${popped ? bubblePopped : bubbleFull})`,
          ["--rot" as string]: rotRef.current,
        }}
      />
      {look && !popped && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: size * 0.4,
            opacity: special === "frozen" && frozenTaps > 0 ? 0.5 : 0.92,
          }}
        >
          {look.emoji}
        </span>
      )}
    </button>
  );
});
