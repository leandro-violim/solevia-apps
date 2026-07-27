import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Zen Bubbles" },
      {
        name: "description",
        content:
          "Terms of use for the Zen Bubbles relaxation game.",
      },
      { property: "og:title", content: "Terms of Use — Zen Bubbles" },
      {
        property: "og:description",
        content: "The terms that govern your use of Zen Bubbles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-muted-foreground">
        ← Back home
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Last updated: July 21, 2026
      </p>

      <p className="mt-6">
        These Terms govern your use of Zen Bubbles ("the App"). By
        installing or using the App you agree to these Terms. If you do
        not agree, do not use the App.
      </p>

      <h2 className="mt-8 text-lg font-semibold">License</h2>
      <p className="mt-2">
        We grant you a personal, non-exclusive, non-transferable, revocable
        license to install and use the App on devices you own or control,
        for your personal, non-commercial enjoyment.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Acceptable use</h2>
      <p className="mt-2">
        You agree not to reverse engineer, modify, or redistribute the App,
        or attempt to interfere with its normal operation or security.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Advertising</h2>
      <p className="mt-2">
        The App displays advertisements. Advertisers are third parties and
        we are not responsible for the content of their ads or the sites
        they link to.
      </p>

      <h2 className="mt-8 text-lg font-semibold">No medical claims</h2>
      <p className="mt-2">
        The App is intended for entertainment and relaxation. It is not a
        medical device and does not provide medical, psychological, or
        therapeutic advice. If you need professional help, please consult
        a qualified professional.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Disclaimer of warranties</h2>
      <p className="mt-2">
        THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
        OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Limitation of liability</h2>
      <p className="mt-2">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES ARISING FROM OR RELATED TO YOUR USE OF THE APP.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Apple App Store additional terms</h2>
      <p className="mt-2">
        If you obtained the App from the Apple App Store, you acknowledge
        that these Terms are between you and Sole Via Entertainment LLC only, not with
        Apple, and that Apple is not responsible for the App or its
        content. Apple and its subsidiaries are third-party beneficiaries
        of these Terms and may enforce them against you.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Changes</h2>
      <p className="mt-2">
        We may update these Terms. Continued use of the App after changes
        become effective constitutes acceptance of the updated Terms.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Contact</h2>
      <p className="mt-2">
        Questions about these Terms:{" "}
        <a href="mailto:contact@solevia.app" className="font-mono underline">
          contact@solevia.app
        </a>
        .
      </p>
    </main>
  );
}