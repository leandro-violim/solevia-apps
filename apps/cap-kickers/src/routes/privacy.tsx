import { createFileRoute } from "@tanstack/react-router";

import { LegalScreen, H, LEGAL_UPDATED, STUDIO, SUPPORT_EMAIL } from "./-legal-doc";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Cap Kickers — Privacy" }] }),
  component: PrivacyPage,
});

// NOTE: this is a plain-language template covering how the game actually works
// (no accounts, local-only data, Google AdMob for ads under ATT consent). Have
// it reviewed before store submission and keep it consistent with the App Store
// privacy "nutrition label".
function PrivacyPage() {
  return (
    <LegalScreen title="Privacy">
      <p>Last updated: {LEGAL_UPDATED}</p>
      <p>
        {STUDIO} ("we") built Cap Kickers to be fun and private. This policy explains what data the
        app handles.
      </p>

      <H>What we collect</H>
      <p>
        We do not require an account and do not ask you for personal information. Your game settings,
        chosen cap and pitch, and campaign progress are stored{" "}
        <strong>only on your device</strong> and are not sent to us.
      </p>

      <H>Advertising</H>
      <p>
        Cap Kickers is free and supported by ads through <strong>Google AdMob</strong>. To show and
        measure ads, Google may collect and process device information, including advertising
        identifiers (such as Apple's IDFA) and general usage data.
      </p>
      <p>
        On iOS we ask your permission through Apple's{" "}
        <strong>App Tracking Transparency</strong> prompt before any tracking. You can decline, and you can change your choice anytime in
        iOS <em>Settings → Privacy &amp; Security → Tracking</em>. Declining still lets you play; you
        may simply see less-relevant ads.
      </p>
      <p>
        Learn more in Google's Privacy Policy (policies.google.com/privacy) and how Google uses data
        from apps that use its services (policies.google.com/technologies/partner-sites).
      </p>

      <H>Children</H>
      <p>
        Cap Kickers is intended for a general audience and is not directed to children under 13. We
        do not knowingly collect personal information from children.
      </p>

      <H>Your choices</H>
      <p>
        Manage ad tracking through the iOS Tracking settings above. Deleting the app removes the
        settings and progress stored on your device.
      </p>

      <H>Changes &amp; contact</H>
      <p>
        We may update this policy; the date above shows the latest version. Questions? Email us at{" "}
        <strong>{SUPPORT_EMAIL}</strong>.
      </p>
    </LegalScreen>
  );
}
