import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_VERSION } from "../lib/settings";
import { t } from "../lib/i18n";

const SUPPORT_EMAIL = "support@solevia.app";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Support — Zen Bubbles" },
      {
        name: "description",
        content: "About Zen Bubbles, the calming bubble-popping game, and how to get support.",
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
  // Splice the mailto link into the support sentence, keeping it a real link in
  // both languages ({email} is left un-interpolated so we can split on it).
  const [supportBefore, supportAfter] = t("about.support").split("{email}");
  return (
    <main className="mx-auto max-w-2xl px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)] text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-muted-foreground">
        {t("common.backHome")}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{t("about.title")}</h1>

      <p className="mt-6">{t("about.intro")}</p>

      <h2 className="mt-8 text-lg font-semibold">{t("about.noAccountH")}</h2>
      <p className="mt-2">{t("about.noAccount")}</p>

      <h2 className="mt-8 text-lg font-semibold">{t("about.a11yH")}</h2>
      <p className="mt-2">{t("about.a11y")}</p>

      <h2 className="mt-8 text-lg font-semibold">{t("about.supportH")}</h2>
      <p className="mt-2">
        {supportBefore}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-mono underline">
          {SUPPORT_EMAIL}
        </a>
        {supportAfter}
      </p>

      <h2 className="mt-8 text-lg font-semibold">{t("about.legalH")}</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>
          <Link to="/privacy" className="underline">
            {t("link.privacyPolicy")}
          </Link>
        </li>
        <li>
          <Link to="/terms" className="underline">
            {t("link.termsOfUse")}
          </Link>
        </li>
      </ul>

      <p className="mt-8 text-[11px] text-muted-foreground">Zen Bubbles · v{APP_VERSION}</p>
    </main>
  );
}
