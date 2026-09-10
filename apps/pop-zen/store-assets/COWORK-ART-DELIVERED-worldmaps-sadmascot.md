# Zen Bubbles — World maps (8 pads) + Sad mascot — DELIVERED (Cowork → Code)

Answers Prompt 1 (world-map islands with exactly 8 rope-linked pads) and Prompt 2 (sad mascot).

---

## Prompt 1 — 4 world-map islands, exactly 8 pads, identical layout

**How these were made (so the 8-pad requirement is guaranteed):** diffusion can't reliably place "exactly 8 pads at identical positions across 4 images," so each island **background** was AI-generated with a **clean, empty bubble-wrap top**, then the **8 beige pads + the connecting rope trail were composited deterministically** at one fixed coordinate set — identical in all 4 images. So the pad positions are pixel-identical across worlds and the coordinate list below is exact.

**Images** — 2160×2160 PNG, square, sky/water baked in, pads + rope baked in (markers NOT included — you overlay those):

| World | Theme | URL |
|---|---|---|
| **World 1** | bright daytime, green leafy trees | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_133017_03ac51bf-4be7-4b22-a681-0cfdf0bd6b54.png` |
| **World 2** | tropical, palm trees | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_133210_efdd2bbd-ea5b-4ea2-b72e-38058f345ef8.png` |
| **World 3** | warm sunset sky | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_133213_9326f8d5-bf71-4a28-8dd7-678e7a8ba017.png` |
| **World 4** | night with green aurora | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_133216_1757da4a-5da5-45a6-ba8b-734bb4d876ee.png` |

Re-encode to `world-1.webp … world-4.webp` at whatever size you use (720² today, or bump to 1440²) with the project's native sharp from `apps/pop-zen`. They're square, so the percentage coords below hold at any output size.

**The 8 pad center coordinates** — as percentages of the image (x%, y%), path order pad1→pad8, **identical for all 4 worlds**:

| pad | x% | y% |
|---|---|---|
| 1 | 50.0 | 30.0 |
| 2 | 65.4 | 35.6 |
| 3 | 52.0 | 40.8 |
| 4 | 43.1 | 46.0 |
| 5 | 59.1 | 49.5 |
| 6 | 51.6 | 54.5 |
| 7 | 39.3 | 59.3 |
| 8 | 55.0 | 64.0 |

JSON (drop-in):
```json
[
  {"x":50.0,"y":30.0},{"x":65.4,"y":35.6},{"x":52.0,"y":40.8},{"x":43.1,"y":46.0},
  {"x":59.1,"y":49.5},{"x":51.6,"y":54.5},{"x":39.3,"y":59.3},{"x":55.0,"y":64.0}
]
```

Each pad is a tan disc ~8% of image width in diameter (~115px on a 1440² render), centered on its coordinate — sized to seat a ~60px hex marker centered on the pad with margin. All 8 sit inside the island interior (clear of the raised rim, trees and water), evenly spaced along the rope. Set each phase marker's center to the coord and it lands dead-center on the pad. Since the layout is identical per world, one coordinate list drives all four; switch the map to show the full square island (nothing is cropped).

---

## Prompt 2 — Sad mascot (Time's Up / lose screen)

Same clear glass bubble-buddy as `mascot-idle` (translucent, see-through, same proportions), sad expression — downturned mouth, droopy eyes, a small tear, slightly slumped. Front-facing, **transparent PNG (alpha), trimmed, no baked shadow**, ~2048².

`https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_130434_055fa8fd-20b8-4c29-a25e-bff46b2333ad.png`

Process it the same as the other mascots (native sharp → `mascot-sad.webp`) and drop it on the Time's Up / end-of-run screen.

---

### Notes for Code
- Download URLs are on the same public host as all prior assets — normal network fetch, then verify alpha/budget and encode WebP with the project's **native sharp** (global WASM sharp corrupts WebP).
- World maps have no alpha (full scene). Sad mascot has alpha.
- If you ever want to nudge the trail/pad layout, the coordinate list is the single source of truth — the images were baked to match it exactly, so keep them in sync.
