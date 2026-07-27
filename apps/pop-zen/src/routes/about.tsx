import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_VERSION } from "../lib/settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Support — Zen Bubbles" },
      {
        name: "description",
        content:
          "About Zen Bubbles, the calming bubble-popping game, and how to get support.",
      },
      { property: "og:title", content: "About & Support — Zen Bubbles" },
      {
        property: "og:description",
        content: "Learn about Zen Bubbles and how to reach us.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-muted-foreground">
        ← Back home
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">About & Support</h1>

      <p className="mt-6">
        Zen Bubbles is a simple relaxation game. Pop plastic bubbles
        across five soothing phases — bubbles shrink as you advance. The
        faster you clear a phase, the higher your score. Your best scores
        and best times are saved on your device so you can beat your own
        record over time.
      </p>

      <h2 className="mt-8 text-lg font-semibold">No account required</h2>
      <p className="mt-2">
        The App works fully offline and does not require sign-in. Records
        live on your device only.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Accessibility</h2>
      <p className="mt-2">
        The App respects your system "Reduce Motion" setting and disables
        idle animations when enabled. Tap targets are sized for comfortable
        touch on phones.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Support</h2>
      <p className="mt-2">
        Need help, want to report a bug, or have a suggestion? Email us at{" "}
        <a href="mailto:support@solevia.app" className="font-mono underline">
          support@solevia.app
        </a>
        . We aim to respond within a few business days.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Legal</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link to="/terms" className="underline">
            Terms of Use
          </Link>
        </li>
      </ul>

      <p className="mt-8 text-[11px] text-muted-foreground">
        Zen Bubbles · v{APP_VERSION}
      </p>
    </main>
  );
}