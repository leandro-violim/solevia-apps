import { createFileRoute } from "@tanstack/react-router";

import { LegalScreen, H, LEGAL_UPDATED, STUDIO, SUPPORT_EMAIL } from "./-legal-doc";
import { useT } from "../lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Cap Kickers — Privacy" }] }),
  component: PrivacyPage,
});

// Plain-language policy covering how the game actually works (no accounts,
// local-only data, Google AdMob under ATT consent). Have it reviewed before
// store submission and keep it consistent with the App Store privacy label.
function PrivacyPage() {
  const t = useT();
  return (
    <LegalScreen title={t("legal.privacy")}>
      <p>{t("legal.updated", { date: LEGAL_UPDATED })}</p>
      <p>{t("privacy.lead", { studio: STUDIO })}</p>

      <H>{t("privacy.collectH")}</H>
      <p>{t("privacy.collectBody")}</p>

      <H>{t("privacy.analyticsH")}</H>
      <p>{t("privacy.analyticsBody")}</p>

      <H>{t("privacy.adsH")}</H>
      <p>{t("privacy.adsBody1")}</p>
      <p>{t("privacy.adsBody2")}</p>
      <p>{t("privacy.adsBody3")}</p>

      <H>{t("privacy.childrenH")}</H>
      <p>{t("privacy.childrenBody")}</p>

      <H>{t("privacy.choicesH")}</H>
      <p>{t("privacy.choicesBody")}</p>

      <H>{t("privacy.changesH")}</H>
      <p>{t("privacy.changesBody", { email: SUPPORT_EMAIL })}</p>
    </LegalScreen>
  );
}
