# Seamless bubble-wrap gameplay texture — photoreal (Higgsfield) version

A photoreal, tileable top-down bubble-wrap texture for the gameplay background. Generated with Higgsfield (nano-banana), then made seamless in the Higgsfield sandbox: low-frequency illumination flattened (even lighting, no gradient/vignette) + an edge-wrap blend so opposite edges match. **Measured seam error: L/R 2.8, T/B 2.6 on a 0–255 scale (~1%, imperceptible).** 2048×2048, ~7 bubbles across, neutral cool-white (tint/fade in-app).

## DELIVERABLE (download this exact file — it is the measured-seamless one)
`https://d2ol7oe51mr4n9.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/2c4a1ef5-92e6-49c5-a6a9-e17afd30b10b.png`

- 2048×2048 PNG, RGB, opaque (tile with `background-repeat`; tint via multiply/overlay, fade via element opacity).
- **Do NOT run it back through an AI upscaler** — that can shift edge pixels and reintroduce a faint seam. Encode straight to WebP with the project's native sharp.

Preview only (AI-upscaled so it could be viewed in chat — not for shipping): tile `hf_20260910_145100_a73a443a…png`, 2×2 proof `hf_20260910_145103_a425b8d2…png`.

## Fallback (guaranteed-perfect tile, cleaner but less photoreal)
Already in this folder: `bubble-wrap-seamless-2048.png` — a procedurally generated tile with a mathematically exact 0-pixel seam. Use this if the photoreal file's ~1% edge blend ever shows at high contrast, or if the download URL above isn't reachable.

## Notes for Code
- Both are square, so the percentage/repeat math is size-independent; downscale to whatever tile size the board uses.
- If you want a themed board, tint at runtime (e.g. deep-teal multiply) rather than baking, so the same neutral tile serves every world.
