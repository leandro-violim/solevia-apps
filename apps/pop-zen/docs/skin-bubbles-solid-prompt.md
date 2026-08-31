# Skin Bubble Art — SOLID-COLOUR set (Gold, Pastel, Mint, Lavender)

**Context:** The first batch (glassy translucent bubbles) was great for Neon,
Ocean, Sunset and Night — keep those. But **Gold, Zen Pastel, Zen Mint, and Zen
Lavender** should be **completely solid, opaque colour** — like the shop shows —
**with no dark shading / drop shadow / see-through areas.** This batch regenerates
just those four as solid bubbles.

Hand the PNGs back to me (Claude Code) and I'll process + wire them, replacing the
current placeholder solid bubbles.

---

## Deliverables (exact)

- **4 PNG files**, transparent background **outside** the bubble (real alpha
  cutout), **2048×2048**, square, one centred bubble filling **~85%** of the canvas.
- **The bubble itself must be 100% OPAQUE, one uniform solid colour** — no
  transparency inside it, nothing of the background showing through.
- **No dark shading, no bottom rim shadow, no ground shadow, no heavy gradient.**
  A *small, soft* glossy highlight in the upper-left is fine (smooth candy/gumball
  sheen), but the body stays one even solid colour.
- **Filenames, exactly:** `skin-gold.png`, `zen-pastel.png`, `zen-mint.png`,
  `zen-lavender.png`
- Matched set: same camera (straight-on), same framing/size, same soft light, all four.

## Master prompt (swap the colour line per skin)

> A single round glossy **candy-button / gumball** bubble, **one solid uniform
> {COLOUR}**, fully opaque, isolated on a transparent background. Smooth matte‑glossy
> finish with only a small soft highlight in the upper‑left — **no dark shadows, no
> bottom shading, no translucency, no see‑through**. The whole bubble is one even
> solid colour. Centred, fills ~85% of a square frame, clean anti‑aliased edge.
> Transparent PNG, 2048×2048.

**Negative prompt:**

> translucent, transparent, see-through, glass, dark shadow, drop shadow, rim
> shadow, heavy gradient, gloomy, background, floor, text, watermark, multiple
> bubbles, grid

## Per-skin {COLOUR} line

| File | Skin | {COLOUR} |
|------|------|----------|
| `skin-gold.png` | Gold | rich warm **metallic gold**, bright and luxurious (solid gold, not brown) |
| `zen-pastel.png` | Zen Pastel | soft **pastel pink**, clean and light |
| `zen-mint.png` | Zen Mint | soft **pastel mint green**, fresh and light |
| `zen-lavender.png` | Zen Lavender | soft **pastel lavender / lilac purple**, clean and light |

## References to attach

- The matching shop tile for each: `apps/pop-zen/assets-src/skins/<id>.png`
  (match its colour, but render a single **solid** bubble, not the wrap sheet).
- Optional shape reference (framing/size only, ignore its translucency):
  `apps/pop-zen/src/assets/bubbles/real-bubble-full.webp`.

## When done

Put the 4 PNGs in `apps/pop-zen/assets-src/bubbles/skins/` (overwriting the
current gold/pastel/mint/lavender) and tell me — I'll trim, normalise to the same
360px WebP sprite, derive the popped frames, and they'll drop straight in. The
other four skins (Neon/Ocean/Sunset/Night) don't change.
