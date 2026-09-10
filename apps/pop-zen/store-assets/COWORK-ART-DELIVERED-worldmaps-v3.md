# Zen Bubbles — World maps v3 (spread pads, off-rim, portal continues after last pad)

**Supersedes v2.** Changes in this pass:
- Pads now use more of the island and are **spread further apart** (no crowding).
- **No pad touches the border** — all pad centers are kept inside a safe interior, off the rim.
- The **portal is a continuation just past the last pad** (with a short rope stub from pad8 → portal), not sitting under/over a pad.
- **World 4 layout is unchanged** (approved).
- Trees are only along the back/top edge, so nothing sits where the last pad/portal goes.

Each world has its **own** coordinate list (pads differ per world). Images: 2160×2160 PNG, square, everything baked in except the phase markers (you overlay those on the pad coords). Re-encode to `world-1.webp … world-4.webp` with the project's native sharp; percentages hold at any square size.

| World | Theme | URL |
|---|---|---|
| **World 1** | daytime, green trees | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_140959_578f886a-6583-4028-8233-a64bc15e7f7c.png` |
| **World 2** | tropical, palms | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_141305_ebfd9485-f0e9-4ba9-9488-8b68081c38ae.png` |
| **World 3** | sunset | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_141004_e41b54a9-f800-443c-b50a-1d37a0064a89.png` |
| **World 4** | night + aurora | `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_141007_6e1797ee-b1dd-4c55-944c-be2eaeeb8403.png` |

### Per-world pad coordinates (x%, y%, path order pad1→pad8) + portal

**World 1**
```
pad1 37.0,33.0  pad2 50.3,35.1  pad3 63.0,39.0  pad4 51.0,44.5
pad5 40.3,50.9  pad6 52.6,56.2  pad7 58.0,62.4  pad8 45.0,66.0
portal 36.8,63.3
```
**World 2**
```
pad1 36.0,33.0  pad2 31.8,42.6  pad3 29.9,52.8  pad4 36.7,60.5
pad5 45.5,65.9  pad6 55.8,64.5  pad7 64.7,59.2  pad8 66.0,49.0
portal 67.7,35.6
```
**World 3**
```
pad1 34.0,37.0  pad2 41.8,30.9  pad3 51.2,28.3  pad4 60.8,30.1
pad5 65.8,38.4  pad6 67.2,48.2  pad7 62.5,56.6  pad8 55.0,63.0
portal 45.0,70.5
```
**World 4** (approved, unchanged)
```
pad1 64.0,28.0  pad2 46.0,27.0  pad3 32.0,36.0  pad4 27.0,50.0
pad5 33.0,62.0  pad6 47.0,69.0  pad7 62.0,68.0  pad8 72.0,56.0
portal 78.2,46.9
```

JSON:
```json
{
 "world1":{"pads":[[37.0,33.0],[50.3,35.1],[63.0,39.0],[51.0,44.5],[40.3,50.9],[52.6,56.2],[58.0,62.4],[45.0,66.0]],"portal":[36.8,63.3]},
 "world2":{"pads":[[36.0,33.0],[31.8,42.6],[29.9,52.8],[36.7,60.5],[45.5,65.9],[55.8,64.5],[64.7,59.2],[66.0,49.0]],"portal":[67.7,35.6]},
 "world3":{"pads":[[34.0,37.0],[41.8,30.9],[51.2,28.3],[60.8,30.1],[65.8,38.4],[67.2,48.2],[62.5,56.6],[55.0,63.0]],"portal":[45.0,70.5]},
 "world4":{"pads":[[64.0,28.0],[46.0,27.0],[32.0,36.0],[27.0,50.0],[33.0,62.0],[47.0,69.0],[62.0,68.0],[72.0,56.0]],"portal":[78.2,46.9]}
}
```

Each pad is a tan disc ~8% of image width; the **portal** is baked at the `portal` coordinate (~17% of image width), sitting just past pad8 as the exit to the next world. Wire a tap on the portal to advance world (World 4's portal → loop to World 1 or "coming soon"). Portal transparent sprite (to animate a glow separately if wanted): `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_134512_f1764019-c2d5-49e2-a6a4-e57a66404b32.png`

---

## Sad mascot (unchanged)
`https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260910_130434_055fa8fd-20b8-4c29-a25e-bff46b2333ad.png`

---

### Notes for Code
- Four different layouts → four marker arrays; the JSON above is the single source of truth and the images were baked to match it exactly.
- Fetch from the same public host as all prior assets; encode WebP with the project's native sharp.
