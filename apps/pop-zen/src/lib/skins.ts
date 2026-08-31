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

// Per-skin in-game bubble sprites — a REAL single bubble cropped from each skin's
// own sheet (its true colour/material/gloss), so an equipped bubble looks like
// what was bought, not a recolour of the default bubble. Classic uses the default.
import neonFull from "../assets/bubbles/skins/skin-neon-full.webp";
import neonPop from "../assets/bubbles/skins/skin-neon-popped.webp";
import oceanFull from "../assets/bubbles/skins/skin-ocean-full.webp";
import oceanPop from "../assets/bubbles/skins/skin-ocean-popped.webp";
import sunsetFull from "../assets/bubbles/skins/skin-sunset-full.webp";
import sunsetPop from "../assets/bubbles/skins/skin-sunset-popped.webp";
import nightFull from "../assets/bubbles/skins/skin-night-full.webp";
import nightPop from "../assets/bubbles/skins/skin-night-popped.webp";
import goldFull from "../assets/bubbles/skins/skin-gold-full.webp";
import goldPop from "../assets/bubbles/skins/skin-gold-popped.webp";
import zpFull from "../assets/bubbles/skins/zen-pastel-full.webp";
import zpPop from "../assets/bubbles/skins/zen-pastel-popped.webp";
import zmFull from "../assets/bubbles/skins/zen-mint-full.webp";
import zmPop from "../assets/bubbles/skins/zen-mint-popped.webp";
import zlFull from "../assets/bubbles/skins/zen-lavender-full.webp";
import zlPop from "../assets/bubbles/skins/zen-lavender-popped.webp";

export type BubbleSprite = { full: string; popped: string };
const BUBBLE_SPRITES: Record<string, BubbleSprite> = {
  "skin-neon": { full: neonFull, popped: neonPop },
  "skin-ocean": { full: oceanFull, popped: oceanPop },
  "skin-sunset": { full: sunsetFull, popped: sunsetPop },
  "skin-night": { full: nightFull, popped: nightPop },
  "skin-gold": { full: goldFull, popped: goldPop },
  "zen-pastel": { full: zpFull, popped: zpPop },
  "zen-mint": { full: zmFull, popped: zmPop },
  "zen-lavender": { full: zlFull, popped: zlPop },
};

export type Rarity = "starter" | "common" | "uncommon" | "rare" | "premium";
export type ItemKind = "skin";

export type CosmeticDef = {
  id: string;
  name: string; // proper noun — kept un-localized; shop chrome is localized
  kind: ItemKind;
  rarity: Rarity;
  thumb: string; // shop preview image (real art)
  bubbleFilter?: string; // legacy CSS filter (near-invisible on the photo sprite)
  /**
   * In-game bubble tint. A solid colour composited over the (near-grayscale)
   * real bubble sprite with `mix-blend-mode: color`, which reliably recolours
   * the plastic while keeping its gloss/shadows — unlike hue-rotate, which does
   * nothing to a desaturated photo. Undefined = Classic (no tint).
   */
  tint?: string;
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
    tint: "#7CFF4F",
  },
  {
    id: "skin-ocean",
    name: "Ocean",
    kind: "skin",
    rarity: "uncommon",
    thumb: skinOcean,
    bubbleFilter: "hue-rotate(160deg) saturate(1.25)",
    tint: "#33B6E0",
  },
  {
    id: "skin-sunset",
    name: "Sunset",
    kind: "skin",
    rarity: "uncommon",
    thumb: skinSunset,
    bubbleFilter: "sepia(0.35) hue-rotate(-25deg) saturate(1.5) brightness(1.05)",
    tint: "#FF8A4C",
  },
  {
    id: "skin-night",
    name: "Night",
    kind: "skin",
    rarity: "rare",
    thumb: skinNight,
    bubbleFilter: "brightness(0.78) saturate(0.85) hue-rotate(215deg)",
    tint: "#4B5BFF",
  },
  {
    id: "skin-gold",
    name: "Gold",
    kind: "skin",
    rarity: "premium",
    premiumGated: true,
    thumb: skinGold,
    bubbleFilter: "sepia(0.55) saturate(1.7) hue-rotate(-12deg) brightness(1.06)",
    tint: "#F5C451",
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
    tint: "#FFB6C8",
  },
  {
    id: "zen-mint",
    name: "Mint",
    kind: "skin",
    rarity: "starter",
    zen: true,
    thumb: zenMint,
    bubbleFilter: "hue-rotate(120deg) saturate(0.7) brightness(1.12)",
    tint: "#8FE7C6",
  },
  {
    id: "zen-lavender",
    name: "Lavender",
    kind: "skin",
    rarity: "starter",
    zen: true,
    thumb: zenLavender,
    bubbleFilter: "hue-rotate(250deg) saturate(0.7) brightness(1.12)",
    tint: "#C3B2FF",
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

/** Tint colour for the equipped bubble skin (undefined for Classic). */
export function equippedBubbleTint(): string | undefined {
  return equippedSkin().tint;
}

/**
 * The equipped skin's real in-game bubble sprite pair (full + popped), cropped
 * from the skin's own sheet. Undefined for Classic → the default bubble is used.
 */
export function equippedBubbleSprite(): BubbleSprite | undefined {
  return BUBBLE_SPRITES[load().skins.equippedSkin];
}

/**
 * The equipped skin's art, used as a MATERIAL overlay on the in-game bubble so
 * it reads like the bubble wrap you actually bought (its finish/texture), not
 * just a recolour. Undefined for Classic (the plain real bubble).
 */
export function equippedSkinImage(): string | undefined {
  const s = equippedSkin();
  return s.id === "skin-classic" ? undefined : s.thumb;
}
