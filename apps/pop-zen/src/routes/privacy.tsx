import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Bubble Pop Calm" },
      {
        name: "description",
        content:
          "Privacy policy for Bubble Pop Calm: what we store on your device, what ads may collect, and how to contact us.",
      },
      { property: "og:title", content: "Privacy Policy — Bubble Pop Calm" },
      {
        property: "og:description",
        content: "How Bubble Pop Calm handles your data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-muted-foreground">
        ← Back home
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Last updated: July 21, 2026
      </p>

      <p className="mt-6">
        This page is maintained by Sole Via Entertainment LLC ("we", "us") to explain how
        Bubble Pop Calm ("the App") handles information. The App is designed
        to be enjoyed without creating an account and without collecting
        personal information on our own servers.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Information stored on your device</h2>
      <p className="mt-2">
        The App saves your per-phase best scores and best times in local
        device storage so you can track your own progress. This data stays
        on your device. You can clear it any time from the Records screen
        (Reset records) or by uninstalling the App.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Information we do not collect</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>We do not require sign-in.</li>
        <li>We do not collect your name, email, or contact information.</li>
        <li>We do not sell personal information.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Advertising</h2>
      <p className="mt-2">
        The App displays advertisements to support development. When
        advertising is enabled in the store builds via Google AdMob, the
        ads SDK may collect information such as your device advertising
        identifier, coarse location derived from IP, and technical device
        information in order to serve and measure ads. On iOS you will be
        asked for App Tracking Transparency permission before any tracking
        identifier is used. See Google's advertising privacy notice at{" "}
        <a
          href="https://policies.google.com/technologies/ads"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          policies.google.com/technologies/ads
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">Children</h2>
      <p className="mt-2">
        The App is a general-audience relaxation game and is not directed
        to children under 13. We do not knowingly collect personal
        information from children.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Your choices</h2>
      <p className="mt-2">
        You can reset locally-stored records from the Records screen. You
        can limit ad personalization from your device settings (iOS: Settings
        → Privacy & Security → Apple Advertising; Android: Settings → Google
        → Ads).
      </p>

      <h2 className="mt-8 text-lg font-semibold">Changes</h2>
      <p className="mt-2">
        We may update this policy from time to time. Material changes will
        be reflected by updating the "Last updated" date above.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Contact</h2>
      <p className="mt-2">
        Questions about this policy: <span className="font-mono">leandroviolim@gmail.com</span>.
      </p>
    </main>
  );
}