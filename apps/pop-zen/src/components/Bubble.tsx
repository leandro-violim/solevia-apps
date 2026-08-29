import { memo, useEffect, useRef } from "react";
import { equippedBubbleFilter } from "../lib/skins";
import b1 from "../assets/bubbles/real-bubble-1.png";
import b2 from "../assets/bubbles/real-bubble-2.png";
import b3 from "../assets/bubbles/real-bubble-3.png";
import b4 from "../assets/bubbles/real-bubble-4.png";

// Option A (matches the prototype exactly): the popped look is the SAME bubble
// image dimmed by a CSS filter (see .zb.popped in styles.css) — NOT the
// -popped.png files. Do not stack both (that double-dims it).
const BUBBLES = [b1, b2, b3, b4];

type Props = {
  id: number;
  x: number;
  y: number;
  size: number;
  popped: boolean;
  /** Which real bubble-wrap variant (0–3). Stable per bubble → keeps memo effective. */
  variant: number;
  /** When true, skip the idle float animation to save CPU on dense phases. */
  still?: boolean;
  driftDelay: number;
  /**
   * Receives the bubble id plus its centre (field-local px) and variant so the
   * parent can drive the pop particle burst. Passing geometry here keeps the
   * parent's ONE callback referentially stable (keeps React.memo effective).
   */
  onPop: (id: number, cx: number, cy: number, variant: number) => void;
};

const R = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Randomized cracks + holes overlay — ported verbatim from
 * _reference/zen-final-look.html. Returns an SVG string; generated ONCE when the
 * bubble pops and then frozen so it stays stable across re-renders.
 */
function crackSVG(): string {
  const cx = 50,
    cy = 50;
  let p = "";
  const n = 3 + Math.floor(Math.random() * 3); // 3–5 fracture lines
  for (let i = 0; i < n; i++) {
    let ang = R(0, 6.2832),
      r = 0,
      d = "M" + cx + " " + cy;
    const segs = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < segs; s++) {
      r += R(14, 24);
      const a2 = ang + R(-0.45, 0.45);
      d += " L" + (cx + Math.cos(a2) * r).toFixed(1) + " " + (cy + Math.sin(a2) * r).toFixed(1);
      ang = a2;
    }
    p +=
      '<path d="' +
      d +
      '" stroke="rgba(255,255,255,0.6)" stroke-width="' +
      R(0.8, 1.5).toFixed(2) +
      '" fill="none" stroke-linecap="round"/>';
    p +=
      '<path d="' +
      d +
      '" stroke="rgba(0,0,0,0.3)" stroke-width="' +
      R(1.6, 2.4).toFixed(2) +
      '" fill="none" stroke-linecap="round" opacity="0.5"/>';
  }
  const h = 2 + Math.floor(Math.random() * 3); // 2–4 holes
  for (let k = 0; k < h; k++) {
    const hd = R(6, 30),
      ha = R(0, 6.2832),
      hx = cx + Math.cos(ha) * hd,
      hy = cy + Math.sin(ha) * hd,
      hr = R(1.8, 4);
    p +=
      '<circle cx="' +
      hx.toFixed(1) +
      '" cy="' +
      hy.toFixed(1) +
      '" r="' +
      hr.toFixed(1) +
      '" fill="rgba(0,0,0,0.28)"/>';
    p +=
      '<circle cx="' +
      hx.toFixed(1) +
      '" cy="' +
      hy.toFixed(1) +
      '" r="' +
      hr.toFixed(1) +
      '" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>';
  }
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + p + "</svg>";
}

/**
 * One real bubble-wrap bubble. Popping dims the same image via CSS filter, keeps
 * it ROUND, squishes it (1 → 1.12 → .55 → .52) with a tiny random tilt, deflates
 * with a concave inner shadow, and reveals a frozen randomized cracks + holes
 * overlay — the approved look from _reference/zen-final-look.html.
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
  onPop,
}: Props) {
  // One-shot guard so a pointerdown plus its trailing synthetic click (or any
  // rapid double input) pops a bubble only once. Reset when the bubble is
  // re-laid-out (e.g. on restart) so the same id can be popped again.
  const handled = useRef(false);
  // Random tilt (±8°) + cracks — both generated ONCE when popped, then frozen.
  const rotRef = useRef<string | null>(null);
  if (rotRef.current === null) rotRef.current = R(-8, 8).toFixed(1) + "deg";
  const cracksRef = useRef<string | null>(null);
  if (popped && cracksRef.current === null) cracksRef.current = crackSVG();

  useEffect(() => {
    if (!popped) {
      handled.current = false;
      cracksRef.current = null; // regenerate fresh cracks if popped again after restart
    }
  }, [popped]);

  const activate = () => {
    if (popped || handled.current) return;
    handled.current = true;
    onPop(id, x + size / 2, y + size / 2, variant);
  };

  // Equipped bubble skin (§6) — a CSS filter on the button; the popped-dim filter
  // on `.zb` composes on top of it. `undefined` for the Classic skin (no tint).
  const skinFilter = equippedBubbleFilter();

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
      }}
      aria-label="Pop bubble"
    >
      <div
        className={popped ? "zb popped" : "zb"}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${BUBBLES[variant % BUBBLES.length]})`,
          ["--rot" as string]: rotRef.current,
        }}
      >
        <div className="zb-deflate" />
        <div
          className="zb-cracks"
          {...(cracksRef.current ? { dangerouslySetInnerHTML: { __html: cracksRef.current } } : {})}
        />
      </div>
    </button>
  );
});
