/**
 * P1-T10 — boot / loading splash. Cowork's hand-popping hero + the wordmark on
 * the brand navy, shown over the very first paint and auto-fading via CSS (see
 * `.boot-splash` in styles.css). Rendered in SSR + client identically, so it
 * adds no hydration mismatch; it plays once per full page load and is inert to
 * SPA route changes. Purely decorative (aria-hidden, pointer-events:none).
 */
import { t } from "../lib/i18n";
import heroImg from "../assets/scene/loading-hero.webp";

export function BootSplash() {
  return (
    <div className="boot-splash" aria-hidden>
      <img
        src={heroImg}
        alt=""
        className="h-52 w-52 rounded-3xl object-cover shadow-2xl"
        style={{ boxShadow: "0 24px 60px rgba(4,7,16,.55)" }}
      />
      <div className="wordmark text-3xl">{t("home.title")}</div>
      <div className="text-sm text-muted-foreground">{t("loading.tagline")}</div>
    </div>
  );
}
