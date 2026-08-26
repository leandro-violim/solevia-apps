import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalScreen, H, APP_VERSION, STUDIO, SUPPORT_EMAIL } from "./-legal-doc";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Cap Kickers — About" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <LegalScreen title="About">
      <p>
        <strong>Cap Kickers</strong> is a fast, physics-driven finger-flick soccer game inspired
        by Brazilian bottle-cap soccer — <em>futebol de tampinhas</em>. Flick your caps across the
        pitch, thread them between your defenders, and beat the keeper to score.
      </p>
      <p>
        Made by {STUDIO}. Version {APP_VERSION}.
      </p>

      <H>Legal</H>
      <p className="flex flex-col gap-2">
        <Link to="/privacy" className="font-display uppercase tracking-wide text-primary underline underline-offset-4">
          Privacy Policy ›
        </Link>
        <Link to="/terms" className="font-display uppercase tracking-wide text-primary underline underline-offset-4">
          Terms of Use ›
        </Link>
      </p>

      <H>Contact</H>
      <p>
        Questions or feedback? Reach us at <strong>{SUPPORT_EMAIL}</strong>.
      </p>
    </LegalScreen>
  );
}
