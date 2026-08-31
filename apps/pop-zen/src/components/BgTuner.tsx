/**
 * TEMPORARY dev tool (Zen Mode only) — a live playfield-background tuner.
 * Pick any colour, slide alpha from transparent → opaque, or tap Black / White /
 * Transparent. The current value is shown as HEX + alpha and as an rgba() string
 * (tap to select) so it can be read back. Remove this component when the colour
 * is chosen.
 */
import { useState } from "react";

const clampHex = (h: string) => (/^#[0-9a-fA-F]{6}$/.test(h) ? h : "#86B0D2");
const chan = (h: string, i: number) => parseInt(clampHex(h).slice(1 + i * 2, 3 + i * 2), 16);

export function BgTuner({ onChange }: { onChange: (css: string | null) => void }) {
  const [hex, setHex] = useState("#86B0D2");
  const [alpha, setAlpha] = useState(100);

  const apply = (h: string, a: number) => {
    h = h.toUpperCase();
    setHex(h);
    setAlpha(a);
    onChange(`rgba(${chan(h, 0)}, ${chan(h, 1)}, ${chan(h, 2)}, ${(a / 100).toFixed(2)})`);
  };

  const rgba = `rgba(${chan(hex, 0)}, ${chan(hex, 1)}, ${chan(hex, 2)}, ${(alpha / 100).toFixed(2)})`;

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-white/15 p-3"
      style={{
        backgroundColor: "rgba(10,16,32,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: "var(--ink)",
      }}
    >
      <div className="mb-2 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Background tuner · temporary
      </div>

      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => apply(e.target.value, alpha)}
          aria-label="Background colour"
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-white/20 bg-transparent"
        />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-base font-bold tabular-nums">
            {hex} · {alpha}%
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={alpha}
            onChange={(e) => apply(hex, Number(e.target.value))}
            aria-label="Alpha"
            className="mt-1 w-full accent-[color:var(--aqua)]"
          />
          <div className="text-[10px] text-muted-foreground">alpha · 0 = fully transparent</div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 text-xs font-semibold">
        <button
          onClick={() => apply("#000000", 100)}
          className="rounded-lg border border-white/15 py-1.5"
        >
          Black
        </button>
        <button
          onClick={() => apply("#FFFFFF", 100)}
          className="rounded-lg border border-white/15 py-1.5"
        >
          White
        </button>
        <button onClick={() => apply(hex, 0)} className="rounded-lg border border-white/15 py-1.5">
          Clear
        </button>
        <button onClick={() => onChange(null)} className="rounded-lg border border-white/15 py-1.5">
          Reset
        </button>
      </div>

      <div className="mt-2 select-all text-center font-mono text-[11px] text-muted-foreground">
        {rgba}
      </div>
    </div>
  );
}
