import { describe, it, expect, vi, afterEach } from "vitest";

// LANG is resolved once at module load from navigator.language, so each test
// stubs navigator, resets the module registry, and re-imports i18n fresh.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("i18n", () => {
  it("returns Portuguese strings when the device language is pt-BR", async () => {
    vi.stubGlobal("navigator", { language: "pt-BR" });
    vi.resetModules();
    const { t, LANG } = await import("./i18n");

    expect(LANG).toBe("pt");
    expect(t("home.play")).toBe("Jogar");
    expect(t("home.viewRecords")).toBe("Ver recordes");
    expect(t("nav.settings")).toBe("Ajustes");
    // interpolation
    expect(t("play.phaseOf", { phase: 2, total: 5 })).toBe("Fase 2 de 5");
    // full localized phase phrase (not word-by-word)
    expect(t("phase1")).toBe("Bolhas extragrandes");
  });

  it("falls back to English for non-pt languages", async () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    vi.resetModules();
    const { t, LANG } = await import("./i18n");

    expect(LANG).toBe("en");
    expect(t("home.play")).toBe("Play");
    expect(t("phase1")).toBe("Extra Large bubbles");
  });

  it("leaves unmatched placeholders intact (used to splice the support email link)", async () => {
    vi.stubGlobal("navigator", { language: "pt-BR" });
    vi.resetModules();
    const { t } = await import("./i18n");

    expect(t("about.support")).toContain("{email}");
    const [before, after] = t("about.support").split("{email}");
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
  });
});
