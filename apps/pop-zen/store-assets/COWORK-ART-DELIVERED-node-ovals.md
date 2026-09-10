# Zen Bubbles — "Your journey" oval node sprites (delivered)

Replaces the tall **hexagon** node markers (`node-locked.webp`, `node-done.webp`, `node-current.webp`) with **isometric oval disc** markers that match the baked island pads in `world-1.webp`. Same soft claymation 3D style, gentle upper-left light, subtle drop shadow. Generated with Higgsfield (nano-banana), background matted out, then composited to the exact 512×512 spec in the Higgsfield sandbox.

## Deliverables — transparent PNG masters (download these)
| State | File | URL |
|---|---|---|
| **locked** | `node-locked-oval.png` | `https://d2ol7oe51mr4n9.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/14a4249f-87e5-4b13-8f3f-4d980a6d2028.png` |
| **done** | `node-done-oval.png` | `https://d2ol7oe51mr4n9.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/b2d4d0da-b36d-482b-8849-c450a67d6a5c.png` |
| **current** | `node-current-oval.png` | `https://d2ol7oe51mr4n9.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/9fc86364-0495-4cc1-ad5b-e00a75db9913.png` |

Same public CDN host as all prior deliverables. **Do NOT run them through an AI upscaler** — these are the clean composited renders. Re-encode straight to WebP with the project's native `sharp`.

## Specs (all three, identical geometry)
- **512×512 PNG, RGBA, transparent background.**
- Disc drawn as a **wide isometric oval**, footprint **≈1.21:1 (width:height)** — matches the pads' `12.6% × 10.4%` box — centered, with transparent margin top/bottom and a few px padding on the sides.
- **Soft drop shadow is baked in**, contained within the canvas (sits in the lower transparent margin).
- Tiered/beveled raised edge so each reads as a raised token sitting on the pad.

## Per-state treatment (kept the existing icon language)
- **locked** — muted cool-grey frosted clay disc, dark-grey **padlock** centered.
- **done** — turquoise-teal glossy disc, creamy-white rim, chunky **gold star** centered.
- **current** — bright inviting teal disc, glowing rim + creamy-white rim, **clean pearl-white blank center** (no icon). The game draws the level **number** on top in code, so nothing is baked in the center.

**One deliberate call:** I did **not** bake the little coral flag from the old `node-current` sprite. Keeping the center clean and the flag off means all three states share the **exact same oval geometry**, so they drop onto the pads identically with no per-state offset. If you'd rather keep the flag on `current`, say so and I'll regenerate that one with a flag planted at the back edge (center still clean).

## Integration notes (for Code)
- In `src/routes/map.tsx`, each pad already places a node sized to the pad footprint box (`PAD_W 12.6% × PAD_H 10.4%`). Display these with **`object-fit: contain`** (no stretch) — the delivered footprint already matches the pad aspect, so they won't distort and will sit centered on each tan pad.
- Re-encode to `node-locked-oval.webp` / `node-done-oval.webp` / `node-current-oval.webp` with `sharp` and either swap them in over the current `node-*.webp` or update the imports in the shell node component.
- Light direction matches `world-1.webp` (upper-left), so they read correctly on all four world islands.
