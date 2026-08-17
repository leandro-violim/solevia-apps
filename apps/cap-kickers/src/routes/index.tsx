import { createFileRoute, Link } from "@tanstack/react-router";

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
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center px-6 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Cap Kickers</h1>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        Flick bottle caps across the pitch and score goals.
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/play"
          search={{ mode: "2p" }}
          className="rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
        >
          Pass & Play — 2 Players
        </Link>
        <Link
          to="/play"
          search={{ mode: "practice" }}
          className="rounded-full border-2 border-primary py-4 text-base font-semibold text-primary bg-transparent shadow-lg active:scale-[0.98]"
        >
          Practice — 1 Device
        </Link>
        <button
          disabled
          className="rounded-full bg-muted py-4 text-base font-semibold text-muted-foreground opacity-50 cursor-not-allowed"
        >
          Solo vs AI — Coming soon
        </button>
      </div>
    </div>
  );
}
