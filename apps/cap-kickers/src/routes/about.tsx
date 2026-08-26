import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalScreen, H, APP_VERSION, STUDIO, SUPPORT_EMAIL } from "./-legal-doc";
import { useT } from "../lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Cap Kickers — About" }] }),
  component: AboutPage,
});

function AboutPage() {
  const t = useT();
  return (
    <LegalScreen title={t("legal.about")}>
      <p>{t("about.intro")}</p>
      <p>{t("about.madeBy", { studio: STUDIO, version: APP_VERSION })}</p>

      <H>{t("about.legalH")}</H>
      <p className="flex flex-col gap-2">
        <Link to="/privacy" className="font-display uppercase tracking-wide text-primary underline underline-offset-4">
          {t("about.privacyLink")}
        </Link>
        <Link to="/terms" className="font-display uppercase tracking-wide text-primary underline underline-offset-4">
          {t("about.termsLink")}
        </Link>
      </p>

      <H>{t("about.contactH")}</H>
      <p>{t("about.contactBody", { email: SUPPORT_EMAIL })}</p>
    </LegalScreen>
  );
}
