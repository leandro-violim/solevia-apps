import { describe, it, expect, afterEach } from "vitest";
import { t, setLocale, getLocale, LOCALES, LOCALE_LABEL, localeKeys } from "./i18n";

// The STRINGS tables aren't exported; reach the same info via t() round-trips.
afterEach(() => setLocale("en"));

describe("i18n", () => {
  it("translates the current locale and switches at runtime", () => {
    setLocale("en");
    expect(t("home.campaign")).toBe("Campaign");
    setLocale("pt-BR");
    expect(t("home.campaign")).toBe("Campanha");
    expect(getLocale()).toBe("pt-BR");
    setLocale("es");
    expect(t("home.campaign")).toBe("Campaña");
    expect(getLocale()).toBe("es");
  });

  it("interpolates params", () => {
    setLocale("en");
    expect(t("play.playerTouch", { n: 1, t: 3, shot: 5 })).toBe("Player 1 — touch 3/5");
    setLocale("pt-BR");
    expect(t("play.playerTouch", { n: 2, t: 4, shot: 5 })).toBe("Jogador 2 — toque 4/5");
    setLocale("es");
    expect(t("play.playerTouch", { n: 3, t: 1, shot: 5 })).toBe("Jugador 3 — toque 1/5");
  });

  it("falls back to the key for an unknown id", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("every locale defines exactly the same key set", () => {
    const en = localeKeys("en").slice().sort();
    for (const loc of LOCALES) {
      const keys = localeKeys(loc).slice().sort();
      const missing = en.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !en.includes(k));
      expect({ loc, missing, extra }).toEqual({ loc, missing: [], extra: [] });
    }
  });

  it("resolves every key in every locale to a non-empty, non-key string", () => {
    for (const loc of LOCALES) {
      setLocale(loc);
      for (const key of localeKeys("en")) {
        const value = t(key);
        expect(value).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("labels and detects the three shipped locales", () => {
    expect(LOCALES).toEqual(["en", "pt-BR", "es"]);
    expect(LOCALE_LABEL.es).toBe("Español");
  });
});
