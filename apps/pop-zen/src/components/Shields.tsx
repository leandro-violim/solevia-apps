import { type MutableRefObject, useEffect, useRef } from "react";

/**
 * Round-4 "shielded" mechanic: a few opaque bars patrol left↔right across the
 * play field. A bubble whose centre sits under a bar can't be popped until the
 * bar slides past (the actual block happens in play.tsx's cover-test, which
 * reads these bars' live rects — see `isCovered`). The bars are purely visual
 * here; `pointer-events: none` lets the tap fall through to the bubble button.
 *
 * `barsRef` is filled with the live bar elements so the parent can test overlap.
 * Motion is CSS (`shieldSlide`, alternate patrol) so it costs no React renders.
 */
type Bar = { widthFrac: number; durationS: number; delayS: number; topOffset: number };

// Deterministic bar set (stable across re-layouts): 3 slabs of differing width,
// speed, and phase so they never line up into one moving wall.
const BARS: Bar[] = [
  { widthFrac: 0.16, durationS: 4.6, delayS: 0, topOffset: 0 },
  { widthFrac: 0.13, durationS: 6.1, delayS: -2.3, topOffset: 0 },
  { widthFrac: 0.18, durationS: 5.3, delayS: -4.0, topOffset: 0 },
];

export function Shields({
  fieldWidth,
  barsRef,
}: {
  fieldWidth: number;
  barsRef: MutableRefObject<HTMLDivElement[]>;
}) {
  const localRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Keep the parent's overlap-test list in sync with what's mounted.
    barsRef.current = localRef.current.filter(Boolean);
    return () => {
      barsRef.current = [];
    };
  }, [barsRef, fieldWidth]);

  if (fieldWidth <= 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {BARS.map((b, i) => {
        const w = Math.round(fieldWidth * b.widthFrac);
        const from = -(w + 24);
        const to = fieldWidth + 24;
        return (
          <div
            key={i}
            ref={(el) => {
              if (el) localRef.current[i] = el;
            }}
            className="zb-shield"
            style={{
              width: w,
              left: 0,
              ["--from" as string]: `${from}px`,
              ["--to" as string]: `${to}px`,
              transform: `translateX(${from}px)`,
              animation: `shieldSlide ${b.durationS}s ease-in-out ${b.delayS}s infinite alternate`,
            }}
          />
        );
      })}
    </div>
  );
}
