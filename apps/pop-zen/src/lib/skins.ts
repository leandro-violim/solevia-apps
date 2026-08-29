/**
 * Skins & themes (§6) — the cosmetics coins buy and rewarded ads unlock.
 *
 * ART: Cowork supplies the real assets later. Until then each cosmetic renders as
 * a placeholder — a CSS `bubbleFilter` (skins) or `fieldBg` gradient (themes) —
 * so the shop + equip are fully previewable now. Drop real art into these slots:
 *   skins:  src/assets/skins/<id>/bubble-1..4.png   (4 variants, like real-bubble-*)
 *   themes: src/assets/themes/<id>.jpg              (field background)
 * …then swap `bubbleFilter`/`fieldBg` for the imported asset. Ids/naming below are
 * the stable contract art should match.
 */
import { CONFIG } from "./config";
import { load, update } from "./storage";
import { track } from "./analytics";
import { spendCoins } from "./economy";
import { checkAchievements } from "./achievements";

export type Rarity = "starter" | "common" | "uncommon" | "rare" | "premium";
export type ItemKind = "skin" | "theme";

export type CosmeticDef = {
  id: string;
  name: string; // proper noun — kept un-localized (like a brand); shop chrome is localized
  kind: ItemKind;
  rarity: Rarity;
  swatch: string; // CSS background for the shop preview tile
  bubbleFilter?: string; // skins: CSS filter applied to bubble art
  fieldBg?: string; // themes: CSS background applied to the play field (wired in §9)
  premiumGated?: boolean; // premium: also unlockable via streak milestone / rewarded
};

/** Bubble skins. `classic` is the free starter (owned by default). */
export const SKINS: CosmeticDef[] = [
  {
    id: "classic",
    name: "Classic",
    kind: "skin",
    rarity: "starter",
    swatch: "radial-gradient(circle at 35% 30%, #eaf6ff, #9fbcd0)",
  },
  {
    id: "pastel",
    name: "Pastel",
    kind: "skin",
    rarity: "common",
    swatch: "radial-gradient(circle at 35% 30%, #ffe6f2, #cdb8ff)",
    bubbleFilter: "saturate(0.65) brightness(1.15) hue-rotate(-8deg)",
  },
  {
    id: "neon",
    name: "Neon",
    kind: "skin",
    rarity: "uncommon",
    swatch: "radial-gradient(circle at 35% 30%, #7cffd8, #7c5cff)",
    bubbleFilter: "saturate(1.9) brightness(1.12) hue-rotate(-22deg)",
  },
  {
    id: "ocean",
    name: "Ocean",
    kind: "skin",
    rarity: "uncommon",
    swatch: "radial-gradient(circle at 35% 30%, #bff0ff, #2a7fb8)",
    bubbleFilter: "hue-rotate(160deg) saturate(1.25)",
  },
  {
    id: "night",
    name: "Night",
    kind: "skin",
    rarity: "rare",
    swatch: "radial-gradient(circle at 35% 30%, #6a7bd8, #171a33)",
    bubbleFilter: "brightness(0.78) saturate(0.85) hue-rotate(215deg)",
  },
  {
    id: "gold",
    name: "Gold",
    kind: "skin",
    rarity: "premium",
    premiumGated: true,
    swatch: "radial-gradient(circle at 35% 30%, #fff2c0, #d99a2b)",
    bubbleFilter: "sepia(0.55) saturate(1.7) hue-rotate(-12deg) brightness(1.06)",
  },
];

/** Background themes. `soft-light` is the free starter (equipped by default). */
export const THEMES: CosmeticDef[] = [
  {
    id: "soft-light",
    name: "Soft Light",
    kind: "theme",
    rarity: "starter",
    swatch: "linear-gradient(160deg, #e9f2ff, #c9d6ea)",
    fieldBg: "linear-gradient(160deg, oklch(0.4 0.05 250 / 0.25), transparent)",
  },
  {
    id: "sunset",
    name: "Sunset",
    kind: "theme",
    rarity: "common",
    swatch: "linear-gradient(160deg, #ffcf8f, #d1477e)",
    fieldBg: "linear-gradient(160deg, oklch(0.55 0.15 40 / 0.3), oklch(0.4 0.15 350 / 0.25))",
  },
  {
    id: "deep-sea",
    name: "Deep Sea",
    kind: "theme",
    rarity: "uncommon",
    swatch: "linear-gradient(160deg, #1a6f9e, #04263b)",
    fieldBg: "linear-gradient(160deg, oklch(0.4 0.1 230 / 0.4), oklch(0.2 0.08 250 / 0.3))",
  },
  {
    id: "starfield",
    name: "Starfield",
    kind: "theme",
    rarity: "rare",
    swatch:
      "radial-gradient(circle at 30% 30%, #fff 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 0 1px, transparent 1px), #0a0b1e",
    fieldBg:
      "radial-gradient(circle at 20% 25%, oklch(0.9 0.02 260 / 0.5) 0 1.5px, transparent 1.5px), radial-gradient(circle at 75% 65%, oklch(0.9 0.02 260 / 0.4) 0 1.5px, transparent 1.5px)",
  },
];

export const ALL_COSMETICS: CosmeticDef[] = [...SKINS, ...THEMES];

export function getCosmetic(id: string): CosmeticDef | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}

/** Price by rarity (starter = free/owned). */
export function priceOf(item: CosmeticDef): number {
  if (item.rarity === "starter") return 0;
  return CONFIG.skins.prices[item.rarity];
}

export function isOwned(id: string): boolean {
  return load().skins.owned.includes(id);
}
export function isEquipped(id: string): boolean {
  const s = load().skins;
  return s.equippedSkin === id || s.equippedTheme === id;
}
export function ownedSkinCount(): number {
  return load().skins.owned.filter((id) => SKINS.some((s) => s.id === id)).length;
}

export type BuyResult = "ok" | "owned" | "insufficient" | "unknown";

/** Buy with coins. Deducts, marks owned, mirrors stats, logs. */
export function buy(id: string): BuyResult {
  const item = getCosmetic(id);
  if (!item) return "unknown";
  if (isOwned(id)) return "owned";
  if (!spendCoins(priceOf(item), `skin:${id}`)) return "insufficient";
  grantOwned(id, "purchase");
  return "ok";
}

/** Grant ownership WITHOUT spending (rewarded unlock, streak milestone). */
export function grantOwned(id: string, source: string): void {
  if (isOwned(id)) return;
  update((st) => {
    st.skins.owned.push(id);
    st.stats.skinsOwned = st.skins.owned.filter((x) => SKINS.some((s) => s.id === x)).length;
  });
  track("skin_unlocked", { item_id: id, method: source });
  checkAchievements(); // §10 — "own 3 skins"
}

/** Equip an owned cosmetic (skin or theme). No-op if not owned. */
export function equip(id: string): void {
  const item = getCosmetic(id);
  if (!item || !isOwned(id)) return;
  update((st) => {
    if (item.kind === "skin") st.skins.equippedSkin = id;
    else st.skins.equippedTheme = id;
  });
  track("skin_equipped", { item_id: id });
}

export function equippedSkin(): CosmeticDef {
  return getCosmetic(load().skins.equippedSkin) ?? SKINS[0];
}
export function equippedTheme(): CosmeticDef {
  return getCosmetic(load().skins.equippedTheme) ?? THEMES[0];
}

/** The CSS filter for the currently-equipped bubble skin (or undefined). */
export function equippedBubbleFilter(): string | undefined {
  return equippedSkin().bubbleFilter;
}
