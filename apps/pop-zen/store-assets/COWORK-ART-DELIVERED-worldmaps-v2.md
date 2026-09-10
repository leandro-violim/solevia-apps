# Zen Bubbles — World maps v2 (distinct paths + portals) + Sad mascot

**This supersedes the earlier "identical 8-pad layout" world maps.** Per Leandro: each world now has its **own** pathway, pads spread across more of the island, and a **portal** at the end of each path (the "go to next world" exit). The tree that used to sit near the last pad is gone — trees are now only along the back/top edge, leaving the play area and portal spot clear.

**Important for Code:** because the four paths are now different, there is **one coordinate list per world** (not a single shared list). Set each world's phase markers to that world's coordinates.

Images: 2160×2160 PNG, square, sky/water + island + pads + rope + portal all baked in. (Markers are NOT baked — you overlay those on the pad coordinates.) Re-encode to `world-1.webp … world-4.webp` with the project's native sharp; percentages hold at any square size.

| World | Theme | URL |
|---|---|---|
| **World 1** | daytime, green trees | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_135018_722009cf-b8dc-49eb-b71a-153bd74b2e32.png` |
| **World 2** | tropical, palms | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_135022_a93c1f8d-08a4-4184-8a6d-1772fdfeaf5a.png` |
| **World 3** | sunset | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_135025_d2874a1c-cf7d-4f97-acdb-3af997214a29.png` |
| **World 4** | night + aurora | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_135029_6c300b1f-3a63-46a0-b582-ae49905ad931.png` |

### Per-world pad coordinates (x%, y%, path order pad1→pad8) + portal

**World 1** — gentle S
```
pad1 32.0,31.0  pad2 52.0,28.0  pad3 66.0,37.0  pad4 50.0,46.0
pad5 35.0,54.0  pad6 50.0,63.0  pad7 66.0,67.0  pad8 46.0,74.0
portal 39.9,67.7
```
**World 2** — lightning zigzag
```
pad1 34.0,29.0  pad2 66.0,33.0  pad3 44.0,44.0  pad4 66.0,52.0
pad5 36.0,55.0  pad6 58.0,64.0  pad7 34.0,67.0  pad8 56.0,74.0
portal 60.8,66.0
```
**World 3** — arc then dip
```
pad1 30.0,44.0  pad2 34.0,31.0  pad3 50.0,26.0  pad4 66.0,31.0
pad5 71.0,46.0  pad6 61.0,58.0  pad7 47.0,64.0  pad8 42.0,74.0
portal 42.4,70.8
```
**World 4** — C opening right
```
pad1 64.0,28.0  pad2 46.0,27.0  pad3 32.0,36.0  pad4 27.0,50.0
pad5 33.0,62.0  pad6 47.0,69.0  pad7 62.0,68.0  pad8 72.0,56.0
portal 78.2,46.9
```

JSON:
```json
{
 "world1":{"pads":[[32.0,31.0],[52.0,28.0],[66.0,37.0],[50.0,46.0],[35.0,54.0],[50.0,63.0],[66.0,67.0],[46.0,74.0]],"portal":[39.9,67.7]},
 "world2":{"pads":[[34.0,29.0],[66.0,33.0],[44.0,44.0],[66.0,52.0],[36.0,55.0],[58.0,64.0],[34.0,67.0],[56.0,74.0]],"portal":[60.8,66.0]},
 "world3":{"pads":[[30.0,44.0],[34.0,31.0],[50.0,26.0],[66.0,31.0],[71.0,46.0],[61.0,58.0],[47.0,64.0],[42.0,74.0]],"portal":[42.4,70.8]},
 "world4":{"pads":[[64.0,28.0],[46.0,27.0],[32.0,36.0],[27.0,50.0],[33.0,62.0],[47.0,69.0],[62.0,68.0],[72.0,56.0]],"portal":[78.2,46.9]}
}
```

Each pad is a tan disc ~9% of image width, sized to seat a ~60px hex marker centered on the coordinate. The **portal** is baked into the image at the `portal` coordinate (~17% of image width) — it marks the exit to the next world; wire a tap on it to advance world (World 4's portal can loop to World 1 or read "coming soon"). Portal transparent sprite (if you want to animate a glow separately): `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_134512_f1764019-c2d5-49e2-a6a4-e57a66404b32.png`

---

## Sad mascot (unchanged from prior delivery)
Transparent PNG (alpha, trimmed, no shadow), for the Time's Up / lose screen:
`https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_130434_055fa8fd-20b8-4c29-a25e-bff46b2333ad.png`

---

### Notes for Code
- Fetch from the same public host as all prior assets; encode WebP with the project's native sharp (global WASM sharp corrupts WebP).
- Layouts differ per world — use four marker arrays; the coordinate JSON above is the single source of truth and the images were baked to match it exactly.
