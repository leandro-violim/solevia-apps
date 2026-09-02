// Shared layout + constants for the About / Privacy / Terms screens. Prefixed
// with "-" so TanStack file-based routing treats it as a helper, not a route.
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useT } from "../lib/i18n";

export const APP_VERSION = "1.0";
export const LEGAL_UPDATED = "August 2026";
export const STUDIO = "Sole Via Entertainment LLC";
export const SUPPORT_EMAIL = "contact@solevia.app";
export const GOVERNING_STATE = "Florida";

/** Scrollable, arcade-styled legal/info page with a Back button to Settings. */
export function LegalScreen({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <div
      className="flex screen flex-col items-center px-6 py-8"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}
    >
      <h1 className="font-display text-4xl uppercase tracking-tight text-foreground">{title}</h1>
      <div className="mt-6 w-full max-w-md flex-1 space-y-3 overflow-y-auto pb-4 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
      <Link
        to="/settings"
        className="font-display mt-4 w-full max-w-md rounded-full bg-white py-3.5 text-center text-lg uppercase tracking-wide text-primary shadow-[0_5px_0_#cdddd3] transition active:translate-y-1"
      >
        {t("common.back")}
      </Link>
    </div>
  );
}

/** Section heading inside a legal page. */
export function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display mt-5 text-lg uppercase tracking-wide text-foreground">{children}</h2>
  );
}
