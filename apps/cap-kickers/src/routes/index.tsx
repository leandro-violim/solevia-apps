import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { hasSeenTutorial } from "../game/tutorial/storage";
import { gameAudio } from "../lib/audio";
import { useT } from "../lib/i18n";

let redirectedThisLoad = false;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cap Kickers — Flick soccer" },
      {
        name: "description",
        content: "A fast, physics-driven finger-flick soccer game. Line up the shot and score.",
      },
      { property: "og:title", content: "Cap Kickers" },
      {
        property: "og:description",
        content: "Flick bottle caps across the pitch and score goals in this arcade soccer game.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const t = useT();

  useEffect(() => {
    gameAudio.enterMenu(); // menu music (starts once audio is unlocked by a tap)
    if (!redirectedThisLoad && !hasSeenTutorial()) {
      redirectedThisLoad = true;
      nav({ to: "/tutorial" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen relative flex flex-col items-center px-5 text-center">
      <div
        className="panel my-auto flex w-full max-w-sm flex-col items-center px-5 py-6"
        style={{ marginTop: "max(env(safe-area-inset-top), 12px)", marginBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
      {/* Cinematic hero: real caps on the wooden pitch. */}
      <div
        className="mb-4 w-full overflow-hidden rounded-2xl shadow-[0_6px_16px_rgba(60,36,19,0.45)] ring-1 ring-black/10"
        style={{ aspectRatio: "16 / 7" }}
      >
        <img src="/hero/home-hero.jpg" alt="Bottle caps on a wooden pitch" className="h-full w-full object-cover" />
      </div>
      <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-tight text-foreground drop-shadow-[0_3px_0_rgba(120,80,40,0.18)]">
        Cap <span className="text-primary">Kickers</span>
      </h1>
      <p className="mt-2 max-w-xs text-sm font-medium text-muted-foreground">
        {t("home.tagline")}
      </p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <Link to="/campaign" className="arcade-btn arcade-btn--gold py-4 text-2xl">
          {t("home.soloVsAi")}
        </Link>
        <Link to="/play" search={{ mode: "2p" }} className="arcade-btn py-3.5 text-xl">
          {t("home.passPlay")}
        </Link>
        <Link
          to="/play"
          search={{ mode: "practice" }}
          className="font-display rounded-full bg-white py-3.5 text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
        >
          {t("home.practice")}
        </Link>
        <div className="mt-2 flex items-center justify-center gap-5">
          <Link
            to="/cabinet"
            className="font-display text-sm uppercase tracking-wider text-muted-foreground underline underline-offset-4"
          >
            {t("home.cabinet")}
          </Link>
          <Link
            to="/settings"
            className="font-display text-sm uppercase tracking-wider text-muted-foreground underline underline-offset-4"
          >
            {t("home.settings")}
          </Link>
          <Link
            to="/tutorial"
            className="font-display text-sm uppercase tracking-wider text-muted-foreground underline underline-offset-4"
          >
            {t("home.howToPlay")}
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
