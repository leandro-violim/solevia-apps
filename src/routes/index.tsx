import { createFileRoute, Link } from "@tanstack/react-router";
import bubbleImg from "../assets/bubble.png";
import { AdBanner, AdBannerSpacer } from "../components/AdBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bubble Pop Calm — Relax and pop plastic bubbles" },
      {
        name: "description",
        content:
          "A calming bubble-wrap popping game. Five phases of shrinking bubbles. Pop, relax, beat your best time.",
      },
      { property: "og:title", content: "Bubble Pop Calm" },
      {
        property: "og:description",
        content: "Relax and pop plastic bubbles across five soothing phases.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-between px-6 pt-14 text-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <img
            src={bubbleImg}
            alt="Plastic bubble"
            width={192}
            height={192}
            className="h-48 w-48 animate-[bubbleFloat_5s_ease-in-out_infinite] drop-shadow-xl"
          />
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
          Bubble Pop Calm
        </h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          Five soothing phases. Bubbles get smaller as you go. Pop them all as
          fast as you can to beat your record.
        </p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <Link
            to="/play"
            search={{ phase: 1 }}
            className="rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98]"
          >
            Play
          </Link>
          <Link
            to="/records"
            className="rounded-full border border-border bg-card py-3 text-sm font-medium text-foreground"
          >
            View records
          </Link>
        </div>

        <nav
          aria-label="Legal"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"
        >
          <Link to="/settings" className="hover:underline">
            Settings
          </Link>
          <span aria-hidden>·</span>
          <Link to="/about" className="hover:underline">
            About
          </Link>
          <span aria-hidden>·</span>
          <Link to="/privacy" className="hover:underline">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link to="/terms" className="hover:underline">
            Terms
          </Link>
        </nav>
      </div>

      <AdBannerSpacer />
      <AdBanner />
    </div>
  );
}
