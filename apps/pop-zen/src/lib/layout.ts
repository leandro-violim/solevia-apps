/**
 * Bubble field geometry, extracted from the play route so it can be unit-tested.
 * Pure: the only nondeterminism is `rand`, injectable for deterministic tests.
 */
import { assignSpecial, type SpecialType } from "./specials";

export type BubbleState = {
  id: number;
  x: number;
  y: number;
  size: number;
  drift: number;
  /** Which of the 4 real bubble-wrap textures to use (0–3). Stable per bubble. */
  variant: number;
  /** Special-bubble type (§7). "normal" unless `opts` enables specials. */
  special: SpecialType;
  popped: boolean;
};

export function layoutBubbles(
  count: number,
  size: number,
  width: number,
  height: number,
  rand: () => number = Math.random,
  /** Enable §7 special bubbles for this field (Time Attack passes the phase + mode multiplier). */
  opts?: {
    phase: number;
    specialsMul: number;
    /**
     * Round-2 "jitter" mechanic: 0 = tidy grid (default), up to 1 = each bubble
     * offset randomly within its own cell so the field reads as un-aligned. The
     * offset is bounded by the free space in the cell, so bubbles never overlap.
     */
    jitter?: number;
  },
): BubbleState[] {
  const padding = 6;
  // Adaptive fit: shrink the bubble size (never enlarge) until ALL `count`
  // bubbles fit fully inside width×height, so the last row is never clipped on
  // smaller screens. Capacity = cols-that-fit × rows-that-fit. `size` is the max.
  if (width > 0 && height > 0) {
    let s = size;
    while (s > 10) {
      const colsFit = Math.max(1, Math.floor(width / (s + padding)));
      const rowsFit = Math.max(1, Math.floor(height / (s + padding)));
      if (colsFit * rowsFit >= count) break;
      s -= 1;
    }
    size = s;
  }
  const step = size + padding;
  const cols = Math.max(1, Math.floor(width / step));
  const rows = Math.max(1, Math.ceil(count / cols));

  // Spread the bubbles across the whole play area instead of clustering them
  // in a centered block (which left large empty margins on tall phones,
  // especially on the early phases with few, large bubbles). Each bubble is
  // centered inside its own grid cell. If the field is too small to give every
  // bubble a cell at least `size` wide/tall, fall back to tight centered
  // packing so bubbles never overlap.
  const cellW = width / cols;
  const cellH = height / rows;
  const spread = cellW >= size && cellH >= size;

  const totalW = cols * step - padding;
  const totalH = rows * step - padding;
  const offsetX = Math.max(0, (width - totalW) / 2);
  const offsetY = Math.max(0, (height - totalH) / 2);

  const bubbles: BubbleState[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Center the final (possibly partial) row for a tidier look.
    const rowCount = Math.min(cols, count - row * cols);
    const rowIndent = spread ? ((cols - rowCount) * cellW) / 2 : 0;
    // Baseline: a slight jitter so it doesn't look like a rigid grid. The
    // round-2 "jitter" mechanic scales this up to the full free space in each
    // cell (only when `spread`, so tightly-packed dense phases never overlap).
    const freeX = spread ? Math.max(0, cellW - size) : 0;
    const freeY = spread ? Math.max(0, cellH - size) : 0;
    const jAmt = opts?.jitter ?? 0;
    const baseJ = padding * 0.8;
    const jitterX = (rand() - 0.5) * (baseJ + jAmt * freeX);
    const jitterY = (rand() - 0.5) * (baseJ + jAmt * freeY);
    bubbles.push({
      id: i,
      x: spread
        ? rowIndent + col * cellW + (cellW - size) / 2 + jitterX
        : offsetX + col * step + jitterX,
      y: spread ? row * cellH + (cellH - size) / 2 + jitterY : offsetY + row * step + jitterY,
      size,
      drift: rand() * 3,
      variant: Math.floor(rand() * 4),
      special: opts ? assignSpecial(opts.phase, opts.specialsMul, rand) : "normal",
      popped: false,
    });
  }
  return bubbles;
}
