import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { PITCH_STYLES, pitchStyleById } from "../game/pitches/styles";
import { loadPitchStyleId, savePitchStyleId } from "../game/pitches/storage";
import { loadOwned } from "../game/economy/inventory";
import { loadProgress } from "../game/campaign/storage";
import { isStyleEquippable } from "../game/economy/catalog";
import { trackPitchSelected } from "../lib/analytics";
import { drawPitch } from "../game/render/draw";
import { useT } from "../lib/i18n";

/** A tiny canvas that renders one surface as a mini pitch preview. */
function Swatch({ styleId, w, h }: { styleId: string; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawPitch(ctx, { x: 2, y: 2, w: w - 4, h: h - 4 }, 0.32, pitchStyleById(styleId));
  }, [styleId, w, h]);
  return <canvas ref={ref} style={{ width: w, height: h }} />;
}

export const Route = createFileRoute("/pitches")({
  head: () => ({ meta: [{ title: "Cap Kickers — Pitch" }] }),
  component: PitchesPage,
});

function PitchesPage() {
  const t = useT();
  const [selected, setSelected] = useState(() => loadPitchStyleId());
  // Only base + unlocked pitches are equippable here; locked ones live in the Cabinet.
  const owned = loadOwned();
  const completed = loadProgress().completed;
  const styles = PITCH_STYLES.filter((s) => isStyleEquippable("pitch", s.id, owned, completed));
  const choose = (id: string) => {
    setSelected(id);
    savePitchStyleId(id);
    trackPitchSelected(id);
  };

  return (
    <div
      className="flex screen flex-col items-center px-6 py-8"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
    >
      <h1 className="font-display text-5xl uppercase tracking-tight text-foreground">
        {t("pitch.title")}
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm font-medium text-muted-foreground">
        {t("pitch.subtitle")}
      </p>

      <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-4">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => choose(s.id)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 transition active:scale-95"
            style={{
              boxShadow:
                selected === s.id ? "0 0 0 3px #ffcf33, 0 5px 0 #d8a400" : "0 4px 0 #cdddd3",
            }}
          >
            <Swatch styleId={s.id} w={150} h={94} />
            <span className="font-display text-sm uppercase tracking-wide text-foreground">
              {t(`pitch.${s.id}`)}
            </span>
          </button>
        ))}
      </div>

      <Link to="/settings" className="arcade-btn mt-9 px-12 py-3 text-xl">
        {t("common.done")}
      </Link>
    </div>
  );
}
