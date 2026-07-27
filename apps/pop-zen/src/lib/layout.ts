/**
 * Bubble field geometry, extracted from the play route so it can be unit-tested.
 * Pure: the only nondeterminism is `rand`, injectable for deterministic tests.
 */

export type BubbleState = {
  id: number;
  x: number;
  y: number;
  size: number;
  drift: number;
  popped: boolean;
};

export function layoutBubbles(
  count: number,
  size: number,
  width: number,
  height: number,
  rand: () => number = Math.random,
): BubbleState[] {
  const padding = 6;
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
    // Slight jitter so it doesn't look like a rigid grid
    const jitterX = (rand() - 0.5) * padding * 0.8;
    const jitterY = (rand() - 0.5) * padding * 0.8;
    bubbles.push({
      id: i,
      x: spread
        ? rowIndent + col * cellW + (cellW - size) / 2 + jitterX
        : offsetX + col * step + jitterX,
      y: spread ? row * cellH + (cellH - size) / 2 + jitterY : offsetY + row * step + jitterY,
      size,
      drift: rand() * 3,
      popped: false,
    });
  }
  return bubbles;
}
