// Photographic pitch surfaces (Project C). A pitch style can carry a `photo`
// texture (a real Higgsfield surface); drawPitch draws it to cover the field rect
// instead of the procedural fill, and skips the procedural markings when the photo
// already has the field drawn on it. Decode-once, cache the HTMLImageElement,
// never re-fetch — and only the EQUIPPED pitch is ever loaded (lazy).

const cache = new Map<string, HTMLImageElement>();

/** The texture Image for a pitch filename (created + cached on first call). */
export const pitchTextureImage = (file: string): HTMLImageElement | null => {
  if (!file || typeof Image === "undefined") return null;
  let img = cache.get(file);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = `/pitch-textures/${file}`;
    cache.set(file, img);
  }
  return img;
};

/** The texture ONLY when decoded and ready to draw; otherwise undefined (→ procedural). */
export const pitchTextureReady = (file: string | undefined): CanvasImageSource | undefined => {
  if (!file) return undefined;
  const img = pitchTextureImage(file);
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
};
