/**
 * Skins & themes (§6 + P1-T7) — cosmetics coins buy and rewarded ads unlock, now
 * wired to Cowork's real art.
 *
 * ART (P1-T7; WebP per the v1.2 master brief): 2K originals live in `assets-src/`;
 * optimized runtime versions are imported below (skins → 420px WebP thumbnails,
 * backgrounds → 1400px-tall WebP). The
 * skin art drives the shop THUMBNAIL + the per-skin bubble TINT (`bubbleFilter`) —
 * the bubbles stay programmatic (we don't paste a static grid over gameplay). The
 * background art renders full-screen behind the play field (`image`, cover-fit).
 * Ids match the art slot names.
 */
import { CONFIG } from "./config";
import { load, update } from "./storage";
import { track } from "./analytics";
import { spendCoins } from "./economy";
import { checkAchievements } from "./achievements";

// Realistic bubble skins.
import skinClassic from "../assets/skins/skin-classic.webp";
import skinNeon from "../assets/skins/skin-neon.webp";
import skinOcean from "../assets/skins/skin-ocean.webp";
import skinSunset from "../assets/skins/skin-sunset.webp";
import skinNight from "../assets/skins/skin-night.webp";
import skinGold from "../assets/skins/skin-gold.webp";
// Zen Mode soft/pastel skins.
import zenPastel from "../assets/skins/zen-pastel.webp";
import zenMint from "../assets/skins/zen-mint.webp";
import zenLavender from "../assets/skins/zen-lavender.webp";

export type Rarity = "starter" | "common" | "uncommon" | "rare" | "premium";
export type ItemKind = "skin";

export type CosmeticDef = {
  id: string;
  name: string; // proper noun — kept un-localized; shop chrome is localized
  kind: ItemKind;
  rarity: Rarity;
  thumb: string; // shop preview image (real art)
  bubbleFilter?: string; // skins: CSS tint applied to bubble art in-game
  premiumGated?: boolean; // premium: also unlockable via streak / rewarded
  zen?: boolean; // Zen Mode set (auto-unlocked when Zen is played)
};

export const SKINS: CosmeticDef[] = [
  { id: "skin-classic", name: "Classic", kind: "skin", rarity: "starter", thumb: skinClassic },
  {
    id: "skin-neon",
    name: "Neon",
    kind: "skin",
    rarity: "uncommon",
    thumb: skinNeon,
    bubbleFilter: "saturate(1.9) brightness(1.12) hue-rotate(-22deg)",
  },
  {
    id: "skin-ocean",
    name: "Ocean",
    kind: "skin",
    rarity: "uncommon",
    thumb: skinOcean,
    bubbleFilter: "hue-rotate(160deg) saturate(1.25)",
  },
  {
    id: "skin-sunset",
    name: "Sunset",
    kind: "skin",
    rarity: "uncommon",
    thumb: skinSunset,
    bubbleFilter: "sepia(0.35) hue-rotate(-25deg) saturate(1.5) brightness(1.05)",
  },
  {
    id: "skin-night",
    name: "Night",
    kind: "skin",
    rarity: "rare",
    thumb: skinNight,
    bubbleFilter: "brightness(0.78) saturate(0.85) hue-rotate(215deg)",
  },
  {
    id: "skin-gold",
    name: "Gold",
    kind: "skin",
    rarity: "premium",
    premiumGated: true,
    thumb: skinGold,
    bubbleFilter: "sepia(0.55) saturate(1.7) hue-rotate(-12deg) brightness(1.06)",
  },
];

/** Zen Mode set — free, unlocked once the player plays Zen Mode. */
export const ZEN_SKINS: CosmeticDef[] = [
  {
    id: "zen-pastel",
    name: "Pastel",
    kind: "skin",
    rarity: "starter",
    zen: true,
    thumb: zenPastel,
    bubbleFilter: "saturate(0.6) brightness(1.16) hue-rotate(-8deg)",
  },
  {
    id: "zen-mint",
    name: "Mint",
    kind: "skin",
    rarity: "starter",
    zen: true,
    thumb: zenMint,
    bubbleFilter: "hue-rotate(120deg) saturate(0.7) brightness(1.12)",
  },
  {
    id: "zen-lavender",
    name: "Lavender",
    kind: "skin",
    rarity: "starter",
    zen: true,
    thumb: zenLavender,
    bubbleFilter: "hue-rotate(250deg) saturate(0.7) brightness(1.12)",
  },
];

export const ALL_COSMETICS: CosmeticDef[] = [...SKINS, ...ZEN_SKINS];
const ALL_SKINS = [...SKINS, ...ZEN_SKINS];

export function getCosmetic(id: string): CosmeticDef | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}

/** Price by rarity; starter = free. */
export function priceOf(item: CosmeticDef): number {
  if (item.rarity === "starter") return 0;
  return CONFIG.skins.prices[item.rarity];
}

export function isOwned(id: string): boolean {
  return load().skins.owned.includes(id);
}
export function isEquipped(id: string): boolean {
  return load().skins.equippedSkin === id;
}
export function ownedSkinCount(): number {
  return load().skins.owned.filter((id) => ALL_SKINS.some((s) => s.id === id)).length;
}

export type BuyResult = "ok" | "owned" | "insufficient" | "unknown";

export function buy(id: string): BuyResult {
  const item = getCosmetic(id);
  if (!item) return "unknown";
  if (isOwned(id)) return "owned";
  if (!spendCoins(priceOf(item), `skin:${id}`)) return "insufficient";
  grantOwned(id, "purchase");
  return "ok";
}

/** Grant ownership WITHOUT spending (rewarded unlock, streak, Zen set). */
export function grantOwned(id: string, source: string): void {
  if (isOwned(id)) return;
  update((st) => {
    st.skins.owned.push(id);
    st.stats.skinsOwned = st.skins.owned.filter((x) => ALL_SKINS.some((s) => s.id === x)).length;
  });
  track("skin_unlocked", { item_id: id, method: source });
  checkAchievements(); // §10 — "own 3 skins"
}

/** Unlock the Zen Mode skin set (called when Zen is played). */
export function unlockZenSkins(): void {
  for (const s of ZEN_SKINS) grantOwned(s.id, "zen_mode");
}

export function equip(id: string): void {
  if (!getCosmetic(id) || !isOwned(id)) return;
  update((st) => {
    st.skins.equippedSkin = id;
  });
  track("skin_equipped", { item_id: id });
}

export function equippedSkin(): CosmeticDef {
  return getCosmetic(load().skins.equippedSkin) ?? SKINS[0];
}

/** CSS filter for the equipped bubble skin (undefined for Classic). */
export function equippedBubbleFilter(): string | undefined {
  return equippedSkin().bubbleFilter;
}
