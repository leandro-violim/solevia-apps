import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Zen Bubbles" },
      {
        name: "description",
        content:
          "Privacy policy for Zen Bubbles: what we store on your device, what ads may collect, and how to contact us.",
      },
      { property: "og:title", content: "Privacy Policy — Zen Bubbles" },
      {
        property: "og:description",
        content: "How Zen Bubbles handles your data.",
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
        Last updated: July 25, 2026
      </p>

      <p className="mt-6">
        This Privacy Policy explains how Sole Via Entertainment LLC ("Solevia",
        "we", "us") handles information in connection with Zen Bubbles ("the
        App"), a relaxation game in which you pop bubbles across five phases and
        your best scores and times are saved on your device. You can play
        without an account, and we do not run servers that collect your personal
        information. The App is supported by ads through Google AdMob: we do not
        collect personal information ourselves, but our advertising partner
        (Google) collects certain device and usage information to show and
        measure ads, as described below.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Information stored on your device</h2>
      <p className="mt-2">
        The App stores your best score and best time per phase, your most recent
        results, and settings (such as whether the pop sound is on) in your
        device's local storage. This stays on your device, we cannot read it,
        and it is not sent to us. You can erase it any time from the Records or
        Settings screen (Reset records) or by uninstalling the App.
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Information we do not collect</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>We do not require an account or sign-in.</li>
        <li>We do not collect your name, email, phone number, or contact details.</li>
        <li>We do not access your location (GPS), camera, microphone, photos, or contacts.</li>
        <li>We do not operate a backend that receives your gameplay or personal data.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">3. Advertising (Google AdMob)</h2>
      <p className="mt-2">
        The App displays banner and full-screen (interstitial) ads through
        Google AdMob, a Google service. To serve, cap, measure, and — where
        permitted — personalize ads, Google and its partners may collect and
        process: your device's advertising identifier (IDFA on iOS, Advertising
        ID on Android); your IP address and a coarse location derived from it;
        technical device information (model, OS version, language); and ad
        interaction and app-activity data. Google collects and uses this
        information as an independent party under its own policies; we only
        receive aggregate, anonymous reporting (such as total impressions and
        estimated earnings). See Google's{" "}
        <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noreferrer">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="https://policies.google.com/technologies/ads" className="underline" target="_blank" rel="noreferrer">
          advertising notice
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">4. App Tracking Transparency (iOS)</h2>
      <p className="mt-2">
        On iOS, before any cross-app tracking identifier (the IDFA) is used for
        personalized advertising, the App shows Apple's App Tracking
        Transparency prompt. You can allow or deny tracking and change your
        choice any time at Settings → Privacy & Security → Tracking. If you deny
        tracking, you will still see ads, but they will be less relevant.
      </p>

      <h2 className="mt-8 text-lg font-semibold">5. Consent in the EEA, UK and Switzerland</h2>
      <p className="mt-2">
        Where required by the GDPR and related laws, the App uses Google's
        consent mechanism (the UMP SDK) to ask for your consent before
        personalized ads are shown and to let you manage your choices.
        Personalized advertising occurs only where you have consented.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. Your US state privacy rights</h2>
      <p className="mt-2">
        We do not sell your personal information for money. However, using your
        advertising identifier for personalized ads may be considered "sharing"
        for cross-context behavioral advertising, or a "sale," under some US
        state laws such as the California Consumer Privacy Act. You can opt out
        by declining the tracking prompt (iOS), withholding advertising consent,
        or limiting ad personalization in your device settings (below).
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Children</h2>
      <p className="mt-2">
        The App is a general-audience relaxation game and is not directed to
        children under 13. We do not knowingly collect personal information from
        children, and ads served in the App are configured for a general
        audience, not for child-directed treatment.
      </p>

      <h2 className="mt-8 text-lg font-semibold">8. Your choices and controls</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>Reset your locally-stored records from the Records or Settings screen.</li>
        <li>
          iOS: allow or deny tracking via the ATT prompt; limit ad
          personalization at Settings → Privacy & Security → Apple Advertising.
        </li>
        <li>Android: reset your Advertising ID and opt out at Settings → Google → Ads.</li>
        <li>EEA/UK/Switzerland: manage consent through the in-app consent prompt.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">9. Data retention and international processing</h2>
      <p className="mt-2">
        On-device data remains until you reset it or uninstall the App.
        Information collected by Google for advertising is retained and
        processed by Google under its own policies, and may be processed in the
        United States or other countries.
      </p>

      <h2 className="mt-8 text-lg font-semibold">10. Changes</h2>
      <p className="mt-2">
        We may update this policy from time to time. Material changes will be
        reflected by updating the "Last updated" date above. Continued use of
        the App after an update means you accept the revised policy.
      </p>

      <h2 className="mt-8 text-lg font-semibold">11. Contact</h2>
      <p className="mt-2">
        Questions about this policy: <span className="font-mono">leandroviolim@gmail.com</span>
        {" "}(Sole Via Entertainment LLC).
      </p>
    </main>
  );
}