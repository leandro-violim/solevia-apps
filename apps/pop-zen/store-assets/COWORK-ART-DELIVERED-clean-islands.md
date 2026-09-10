# Zen Bubbles — clean island bases (delivered)

Clean versions of the four world islands with the baked **level pads** and the **teal portal swirl** removed, since markers and the portal are now drawn in code. Everything else is preserved exactly.

## Deliverables
`src/assets/scene/world-1-clean.png … world-4-clean.png` — committed next to the originals. Also sent in the Cowork conversation.

- **1080×1080 PNG**, identical to the shipped `world-*.webp` (same size, crop, island position & scale — edited directly on the actual files, **no AI re-render, no upscaler**).
- Re-encode to WebP with the project's native `sharp` and swap in as the base island images.

## What was removed vs kept
- **Removed:** the 8 tan stepping-stone pads and the teal portal swirl (+ its glow). Filled with matching bubble-wrap sampled from each island's own ground, lighting-matched.
- **Kept, untouched (pixel-identical):** island shape/size/framing, tan border, the **golden connecting rope/path**, trees & palms, bubble-wrap ground, lighting, sky and ocean. Verified: >99.7% of every image is byte-identical to the original; only the pad/portal footprints changed — so your fixed-% marker coordinates still line up.

## Method (for reference)
Programmatic inpainting (not diffusion): each pad/portal footprint was replaced by feathered, color-matched patches copied from nearby pure bubble-wrap on the same island, with the tan border and green foliage protected from over-paint. This guarantees the framing/scale constraint.

## Notes
- A couple of extremely faint soft spots remain where a portal met the border (World 3, bottom-center) or near the trees (World 4, top) — sub-perceptible and in non-node areas; the code markers/path sit elsewhere. Happy to touch up further if any show in-game.
- **Optional fresh portal sprite:** not generated (you already render `portal.webp`). Say the word and I'll produce a matching one.
