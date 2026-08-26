import { createFileRoute } from "@tanstack/react-router";

import { LegalScreen, H, LEGAL_UPDATED, STUDIO, SUPPORT_EMAIL, GOVERNING_STATE } from "./-legal-doc";
import { useT } from "../lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Cap Kickers — Terms" }] }),
  component: TermsPage,
});

// Plain-language template for a free, ad-supported casual game. Have it reviewed
// and confirm the governing-law state before store submission.
function TermsPage() {
  const t = useT();
  return (
    <LegalScreen title={t("legal.terms")}>
      <p>{t("legal.updated", { date: LEGAL_UPDATED })}</p>
      <p>{t("terms.lead")}</p>

      <H>{t("terms.licenseH")}</H>
      <p>{t("terms.licenseBody", { studio: STUDIO })}</p>

      <H>{t("terms.fairH")}</H>
      <p>{t("terms.fairBody")}</p>

      <H>{t("terms.adsH")}</H>
      <p>{t("terms.adsBody")}</p>

      <H>{t("terms.warrantyH")}</H>
      <p>{t("terms.warrantyBody")}</p>

      <H>{t("terms.liabilityH")}</H>
      <p>{t("terms.liabilityBody", { studio: STUDIO })}</p>

      <H>{t("terms.changesH")}</H>
      <p>{t("terms.changesBody", { state: GOVERNING_STATE })}</p>

      <H>{t("terms.contactH")}</H>
      <p>{t("terms.contactBody", { email: SUPPORT_EMAIL })}</p>
    </LegalScreen>
  );
}
