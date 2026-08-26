import { createFileRoute } from "@tanstack/react-router";

import { LegalScreen, H, LEGAL_UPDATED, STUDIO, SUPPORT_EMAIL, GOVERNING_STATE } from "./-legal-doc";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Cap Kickers — Terms" }] }),
  component: TermsPage,
});

// NOTE: plain-language template for a free, ad-supported casual game. Have it
// reviewed and confirm the governing-law state before store submission.
function TermsPage() {
  return (
    <LegalScreen title="Terms">
      <p>Last updated: {LEGAL_UPDATED}</p>
      <p>
        By downloading or playing Cap Kickers ("the game"), you agree to these terms. If you do not
        agree, please do not use the game.
      </p>

      <H>License</H>
      <p>
        {STUDIO} grants you a personal, non-exclusive, non-transferable license to install and play
        the game for your own non-commercial entertainment.
      </p>

      <H>Fair use</H>
      <p>
        Please don't reverse-engineer, tamper with, or attempt to disrupt the game or its ads, or use
        it in any unlawful way.
      </p>

      <H>Ads &amp; cost</H>
      <p>
        The game is free and supported by advertising served through Google AdMob. We may add or
        change ad placements over time.
      </p>

      <H>No warranty</H>
      <p>
        The game is provided "as is," without warranties of any kind. We do not guarantee it will be
        uninterrupted or error-free.
      </p>

      <H>Limitation of liability</H>
      <p>
        To the fullest extent permitted by law, {STUDIO} is not liable for any indirect or incidental
        damages arising from your use of the game.
      </p>

      <H>Changes &amp; governing law</H>
      <p>
        We may update the game and these terms; continued play means you accept the changes. These
        terms are governed by the laws of {GOVERNING_STATE}, USA.
      </p>

      <H>Contact</H>
      <p>
        Questions about these terms? Email <strong>{SUPPORT_EMAIL}</strong>.
      </p>
    </LegalScreen>
  );
}
