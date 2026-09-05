// Lazy loader for the localized commentary voice-over. Each language's clips live
// in their own module (vo/en.ts, vo/pt.ts, vo/es.ts) and are pulled in with a
// dynamic import, so a session only ever loads the bytes for the language actually
// in use — not all three. Returns a map of clip key ("goal-1", "final-1", …) to a
// base64 data URI.

import { type Locale } from "./i18n";

/** The commentary language for an app locale. */
export type VoLang = "en" | "pt" | "es";

export const voLangFor = (locale: Locale): VoLang =>
  locale === "pt-BR" ? "pt" : locale === "es" ? "es" : "en";

export const loadVoLang = async (lang: VoLang): Promise<Record<string, string>> => {
  switch (lang) {
    case "pt":
      return (await import("./vo/pt")).default;
    case "es":
      return (await import("./vo/es")).default;
    default:
      return (await import("./vo/en")).default;
  }
};
