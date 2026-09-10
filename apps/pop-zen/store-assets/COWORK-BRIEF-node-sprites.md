# Cowork brief — Zen Bubbles "Your journey" node sprites (oval pad discs)

## What we need
Three **journey map node sprites** (the little markers that sit on each level pad on
the world-map islands). They currently reuse tall **hexagon** tiles, but the baked
pads on the islands are **isometric ovals**, so the hex markers don't match the pad
shape. Please deliver **oval disc** markers that look like they ARE the pad — same
clay/3D style, same isometric tilt — with the state icon sitting on top.

Three states (one file each):
1. **locked** — a padlock icon, muted/greyed disc.
2. **done** — a gold star, "completed" colored disc.
3. **current** — the active node (a bright/inviting disc; leave the CENTER clean —
   the game overlays the level NUMBER on it in code, so no baked-in number/star).

## Style reference (match these — already in the repo)
- The island + pads: `apps/pop-zen/src/assets/scene/world-1.webp` (the tan pads are
  the exact shape/perspective to match).
- The current hex markers being replaced: `apps/pop-zen/src/assets/shell/node-locked.webp`,
  `node-done.webp`, `node-current.webp` (for the icon language — padlock / gold star —
  and the color treatment per state; keep those, just change hexagon → oval disc).
- Overall game art: soft, rounded, glossy "claymation" 3D, gentle top-light, subtle
  drop shadow. Warm daytime palette.

## Shape & perspective (important)
- **Isometric oval**, NOT a flat circle and NOT a hexagon. It should read as the same
  disc as the baked pads viewed at the island's tilt.
- **Footprint aspect ratio ≈ 1.21 : 1 (width : height)** — i.e. clearly wider than
  tall — matching the pads (measured at ~12.6% × 10.4% of the square island).
- The disc may have the same little "tiered / beveled" edge the pads have, so the
  marker looks like a raised token sitting on the pad.

## Files to deliver (source, transparent)
- Format: **PNG with transparent background** (alpha), OR transparent WebP — PNG
  preferred as the master.
- Canvas: **square, 512×512**, with the oval disc centered and drawn at the 1.21:1
  footprint (so there's transparent margin top/bottom). Keep a few px of transparent
  padding on all sides; INCLUDE the soft drop shadow within the canvas.
- Do NOT bake in a level number on the `current` sprite — the code draws it.
- Filenames:
  - `node-locked-oval.png`
  - `node-done-oval.png`
  - `node-current-oval.png`
- Please do NOT run them through an AI upscaler; deliver the clean render.

## How it'll be used (for context)
Each sprite is placed dead-center on a pad and sized to the pad's footprint box
(`PAD_W 12.6% × PAD_H 10.4%` of the square island) in `src/routes/map.tsx`. Because
the delivered footprint already matches the pad's aspect ratio, we'll display it with
`object-fit: contain` (no stretching) so it never distorts. I'll re-encode the PNGs to
optimized WebP with the project's **native sharp** and drop them in over the current
`node-*.webp` sprites.

## Acceptance checklist
- [ ] Oval (isometric) disc, ~1.21:1 width:height, matches the pad perspective.
- [ ] Three states with the existing icon language (padlock / gold star / clean center).
- [ ] Transparent background, soft shadow included, 512×512 square master (PNG).
- [ ] No baked-in number on `current`; no AI upscaling.
- [ ] Sits believably ON the tan pads in `world-1.webp` (same light direction).
