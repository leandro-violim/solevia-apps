// Pre-baked realistic cap sprites (Option A prototype). A small set of cap styles
// ship a high-fidelity WebP (baked once from design/caps/bake-metal-cap.html, ~10 KB
// each at 256px). drawCap draws the image when it's ready and falls back to the
// vector cap otherwise — so there's never a blank frame, and non-sprite caps are
// unchanged. Decode once, cache the HTMLImageElement, never re-fetch.

// styleId → sprite filename. Project C uses photoreal top-down caps (Higgsfield);
// the metal-* set is the older baked prototype. Extension varies (png/webp) until
// the whole set is re-encoded to WebP.
const SPRITE_FILES: Record<string, string> = {
  "soda-blue": "soda-blue.png", // Project C hero cap (photoreal, top-down)
  "metal-silver": "metal-silver.webp",
  "metal-red": "metal-red.webp",
  "metal-blue": "metal-blue.webp",
  "metal-green": "metal-green.webp",
  "metal-orange": "metal-orange.webp",
  "metal-purple": "metal-purple.webp",
};

const cache = new Map<string, HTMLImageElement>();

/** Does this cap style have a baked sprite? */
export const hasCapSprite = (styleId: string): boolean => styleId in SPRITE_FILES;

/** The sprite Image for a style (created + cached on first call), or null if none. */
export const capSpriteImage = (styleId: string): HTMLImageElement | null => {
  const file = SPRITE_FILES[styleId];
  if (!file || typeof Image === "undefined") return null;
  let img = cache.get(styleId);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = `/caps-sprites/${file}`;
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
  Object.keys(SPRITE_FILES).forEach((id) => capSpriteImage(id));
};
