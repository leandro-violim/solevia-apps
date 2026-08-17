import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { CAP_STYLES, styleById } from "../game/caps/styles";
import { loadCapStyleId, saveCapStyleId } from "../game/caps/storage";
import { drawCap } from "../game/render/draw";

/** A tiny canvas that draws one cap style as a preview. */
function Swatch({ styleId, size }: { styleId: string; size: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawCap(ctx, size / 2, size / 2 - size * 0.04, size * 0.38, styleById(styleId));
  }, [styleId, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} />;
}

export const Route = createFileRoute("/caps")({
  head: () => ({ meta: [{ title: "Cap Kickers — Your Cap" }] }),
  component: CapsPage,
});

function CapsPage() {
  const [selected, setSelected] = useState(() => loadCapStyleId());
  const choose = (id: string) => {
    setSelected(id);
    saveCapStyleId(id);
  };

  return (
    <div
      className="flex min-h-dvh flex-col items-center px-6 py-8"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
    >
      <h1 className="font-display text-5xl uppercase tracking-tight text-foreground">Your Cap</h1>
      <p className="mt-2 max-w-xs text-center text-sm font-medium text-muted-foreground">
        Pick your cap. Your opponent gets a contrasting one.
      </p>

      <div className="mt-7 grid w-full max-w-md grid-cols-4 gap-3">
        {CAP_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => choose(s.id)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-white p-2 transition active:scale-95"
            style={{
              boxShadow:
                selected === s.id
                  ? "0 0 0 3px #ffcf33, 0 5px 0 #d8a400"
                  : "0 4px 0 #cdddd3",
            }}
          >
            <Swatch styleId={s.id} size={58} />
            <span className="font-display text-xs uppercase tracking-wide text-foreground">
              {s.name}
            </span>
          </button>
        ))}
      </div>

      <Link to="/" className="arcade-btn mt-9 px-12 py-3 text-xl">
        Done
      </Link>
    </div>
  );
}
