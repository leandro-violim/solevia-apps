import { useEffect } from "react";
import { launchConfetti } from "../lib/confetti";
import { t } from "../lib/i18n";
import { FlameIcon } from "./icons";

/**
 * Candy-Crush-style "entering a new world" flourish, shown when a Pop Challenge
 * run crosses into a new round (world 2–4). Names the world + the twist it adds,
 * fires confetti, then auto-dismisses into the phase. Tap anywhere to skip.
 */
export function WorldIntro({ round, onDone }: { round: number; onDone: () => void }) {
  useEffect(() => {
    const stop = launchConfetti({ count: 60 });
    const id = window.setTimeout(onDone, 2600);
    return () => {
      if (typeof stop === "function") stop();
      window.clearTimeout(id);
    };
  }, [round, onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={t("world.skip")}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 px-6 backdrop-blur-md"
      style={{ animation: "worldIntroIn 320ms ease-out both" }}
    >
      <div
        className="flex flex-col items-center"
        style={{ animation: "worldIntroPop 520ms cubic-bezier(0.2,1.3,0.4,1) both" }}
      >
        <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">
          {t("world.label")}
        </div>
        <div className="wordmark my-1 flex items-center gap-2" style={{ fontSize: "3.2rem" }}>
          <FlameIcon size={30} className="text-gold" />
          {round}
        </div>
        <div className="text-xl font-extrabold text-foreground">
          {t(`world.r${round}.name` as "world.r2.name")}
        </div>
        <div className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
          {t(`world.r${round}.desc` as "world.r2.desc")}
        </div>
      </div>
    </button>
  );
}
