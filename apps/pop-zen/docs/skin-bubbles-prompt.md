# Skin Bubble Art — generation brief for Cowork + Higgsfield

**Goal:** 8 images, one per shop skin. Each is a single, photoreal **bubble‑wrap air
pocket** in that skin's colour/material, isolated on a transparent background. These
become the in‑game bubble shown when a player equips that skin, so they must look
like the bubble in the shop tile — not a recolour of the default bubble.

Hand the finished PNGs back to me (Claude Code) and I'll optimise them to WebP,
auto‑generate the matching "popped" frames, and wire them into the game.

---

## Deliverables (exact — please follow precisely)

- **8 PNG files**, **transparent background** (real alpha channel), **1024×1024**, square.
- **One centred bubble** per image, filling **~85%** of the canvas with an even
  margin all around (don't let it touch the edges).
- **Filenames, exactly:**
  `skin-neon.png`, `skin-ocean.png`, `skin-sunset.png`, `skin-night.png`,
  `skin-gold.png`, `zen-pastel.png`, `zen-mint.png`, `zen-lavender.png`
- **No** background, **no** ground/drop shadow, **no** text, watermark, or border.
- **Do NOT** send the "popped/deflated" versions — I generate those from the full ones.

## Consistency (critical — the 8 must look like one matched set)

- **Same camera:** straight‑on, very slightly from above.
- **Same light:** one soft light from the **upper‑left** → a bright, crisp specular
  highlight in the **upper‑left** of every bubble and a gentle darker rim on the
  **lower‑right**.
- **Same shape & framing:** a round, domed single air pocket (one cell of bubble
  wrap), circular silhouette, glossy translucent plastic, identical size in all 8.

---

## Master prompt (paste into Higgsfield; swap the material line per skin)

> A macro close‑up of **one single bubble‑wrap air pocket**, isolated on a fully
> transparent background. A perfectly round, domed, glossy **{MATERIAL}** bubble.
> Soft studio light from the upper‑left creating a bright, crisp specular highlight
> in the upper‑left and a soft darker rim on the lower‑right. Photorealistic, high
> detail, clean anti‑aliased edges, centred, fills about 85% of a square frame.
> Transparent PNG, 1024×1024.

**Negative prompt:**

> multiple bubbles, bubble sheet, grid of bubbles, hands, fingers, background,
> floor, table, ground shadow, text, watermark, logo, flat, cartoon, low quality,
> blurry, jpeg artifacts

---

## Per‑skin material line (attach the matching shop sheet as a colour reference)

Copy the master prompt above and drop in each `{MATERIAL}`. **Attach two references
per generation:** the default bubble (for shape/light) + that skin's shop sheet (for
colour/material). Reference file paths are listed at the bottom.

| File | `{MATERIAL}` line |
|------|-------------------|
| `skin-neon.png` | vivid **electric neon** plastic — luminous cyan‑blue fading toward magenta‑pink, very high saturation, faint inner glow |
| `skin-ocean.png` | translucent **aqua sea‑glass** — clear turquoise/teal, cool, glassy, water‑like |
| `skin-sunset.png` | warm **sunset gradient** — glowing coral‑orange into soft gold and pink |
| `skin-night.png` | deep **midnight navy‑blue** glossy plastic — dark and rich, with a crisp bright highlight |
| `skin-gold.png` | polished **metallic gold** — reflective warm gold foil, shiny and luxurious |
| `zen-pastel.png` | soft matte **pastel pink** — milky, calm, gentle low saturation |
| `zen-mint.png` | soft **pastel mint green** — milky translucent, calm |
| `zen-lavender.png` | soft **pastel lavender / lilac purple** — milky translucent, calm |

---

## Reference images to attach

- **Shape + lighting reference (use for every skin):**
  `apps/pop-zen/src/assets/bubbles/real-bubble-full.webp` — match this bubble's
  shape, dome, and highlight placement, just in each new colour/material.
- **Colour + material reference (per skin):**
  `apps/pop-zen/assets-src/skins/<id>.png` (e.g. `skin-gold.png`, `skin-ocean.png`).
  Sample the dominant colour/finish from these sheets so the in‑game bubble matches
  the shop tile a player sees before buying.

## When done

Put the 8 PNGs in a new folder: **`apps/pop-zen/assets-src/bubbles/skins/`**
(named exactly as above), and let me know. I'll:
1. crop/pad to a consistent circle, optimise to ~360px WebP,
2. auto‑derive each skin's "popped" frame,
3. wire them so equipping a skin swaps the bubble to its own art.

If any single skin comes back off‑colour or off‑centre, just regenerate that one —
the rest don't need to change.
