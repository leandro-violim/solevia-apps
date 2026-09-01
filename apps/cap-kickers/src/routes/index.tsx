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
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center px-6 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight text-foreground drop-shadow-[0_3px_0_rgba(18,40,28,0.12)]">
        Cap<br />
        <span className="text-primary">Kickers</span>
      </h1>
      <p className="mt-3 max-w-xs text-sm font-medium text-muted-foreground">
        {t("home.tagline")}
      </p>

      <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
        <Link to="/campaign" className="arcade-btn arcade-btn--gold py-4 text-2xl">
          {t("home.campaign")}
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
        <div>
          <p className="font-display mb-2 text-sm uppercase tracking-wider text-muted-foreground">
            {t("home.soloVsAi")}
          </p>
          <div className="flex gap-2">
            {(
              [
                ["easy", "#1fb457", "#128040", "#ffffff"],
                ["normal", "#ffcf33", "#d8a400", "#4a3600"],
                ["hard", "#ff5a3c", "#c8341c", "#ffffff"],
              ] as const
            ).map(([diff, bg, sh, fg]) => (
              <Link
                key={diff}
                to="/play"
                search={{ mode: "ai", difficulty: diff }}
                className="font-display flex-1 rounded-full py-3 text-base uppercase tracking-wide transition active:translate-y-1"
                style={{ background: bg, color: fg, boxShadow: `0 4px 0 ${sh}` }}
              >
                {t(`diff.${diff}`)}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-center gap-5">
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
  );
}
