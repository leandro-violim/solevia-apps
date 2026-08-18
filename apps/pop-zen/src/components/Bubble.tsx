import { memo, useEffect, useRef } from "react";
import bubbleImg from "../assets/bubble.png";
import poppedImg from "../assets/popped-bubble.svg";

type Props = {
  id: number;
  x: number;
  y: number;
  size: number;
  popped: boolean;
  /** When true, skip the idle float animation to save CPU on dense phases. */
  still?: boolean;
  driftDelay: number;
  /** Receives the bubble id so the parent can pass one stable callback (keeps React.memo effective). */
  onPop: (id: number) => void;
};

/**
 * One glossy plastic bubble. Popping cross-fades the inflated bubble (which
 * bursts outward and vanishes) into a flattened, wrinkled "popped" remnant that
 * stays on the field — so a cleared phase reads like a real sheet of popped
 * bubble wrap.
 */
export const Bubble = memo(function Bubble({
  id,
  x,
  y,
  size,
  popped,
  still,
  driftDelay,
  onPop,
}: Props) {
  // One-shot guard so a pointerdown plus its trailing synthetic click (or any
  // rapid double input) pops a bubble only once. Reset when the bubble is
  // re-laid-out (e.g. on restart) so the same id can be popped again.
  const handled = useRef(false);
  useEffect(() => {
    if (!popped) handled.current = false;
  }, [popped]);

  const activate = () => {
    if (popped || handled.current) return;
    handled.current = true;
    onPop(id);
  };

  const layer = {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
  };

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
      }}
      aria-label="Pop bubble"
    >
      {/* Inflated bubble — bursts outward and fades away on pop. */}
      <img
        src={bubbleImg}
        alt=""
        draggable={false}
        decoding="async"
        loading="lazy"
        style={{
          ...layer,
          opacity: popped ? 0 : 1,
          transform: popped ? "scale(1.35)" : "scale(1)",
          transition: "transform 190ms cubic-bezier(.34,1.56,.64,1), opacity 150ms ease-out",
        }}
      />
      {/* Flattened, wrinkled remnant — fades in, settles small, and stays. */}
      <img
        src={poppedImg}
        alt=""
        draggable={false}
        decoding="async"
        style={{
          ...layer,
          opacity: popped ? 0.5 : 0,
          transform: popped ? "scale(0.9)" : "scale(1.15)",
          transition: "transform 300ms cubic-bezier(.2,.75,.3,1) 30ms, opacity 240ms ease-out 30ms",
        }}
      />
    </button>
  );
});
