// Pre-baked realistic cap sprites (Option A prototype). A small set of cap styles
// ship a high-fidelity WebP (baked once from design/caps/bake-metal-cap.html, ~10 KB
// each at 256px). drawCap draws the image when it's ready and falls back to the
// vector cap otherwise — so there's never a blank frame, and non-sprite caps are
// unchanged. Decode once, cache the HTMLImageElement, never re-fetch.

const SPRITE_IDS = new Set([
  "metal-silver",
  "metal-red",
  "metal-blue",
  "metal-green",
  "metal-orange",
  "metal-purple",
]);

const cache = new Map<string, HTMLImageElement>();

/** Does this cap style have a baked sprite? */
export const hasCapSprite = (styleId: string): boolean => SPRITE_IDS.has(styleId);

/** The sprite Image for a style (created + cached on first call), or null if none. */
export const capSpriteImage = (styleId: string): HTMLImageElement | null => {
  if (!SPRITE_IDS.has(styleId) || typeof Image === "undefined") return null;
  let img = cache.get(styleId);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = `/caps-sprites/${styleId}.webp`;
    cache.set(styleId, img);
  }
  return img;
};

/** The sprite ONLY when decoded and ready to draw; otherwise undefined (→ vector). */
export const capSpriteReady = (styleId: string): CanvasImageSource | undefined => {
  const img = capSpriteImage(styleId);
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
};

/** Warm the whole set (e.g. on app start or when the Cabinet opens). */
export const preloadCapSprites = (): void => {
  SPRITE_IDS.forEach((id) => capSpriteImage(id));
};
