# Higgsfield for Cap Kickers — what's actually worth using

Written 2026-09-01. Account: **Plus plan, 1,086 credits** at the time of writing.
Rough rate: ~1.7 credits per Nano Banana image, so images are effectively free
at this scale; video is where credits go.

---

## The honest framing first

Cap Kickers draws **everything on an HTML canvas, procedurally** — `drawCap`,
`drawPitch`, `drawGoal`, `drawKeeper` in `src/game/render/draw.ts`. There are no
image assets in the game loop at all. That has two consequences:

1. **A generated image is not a drop-in.** Using one in-game means adding a
   texture-loading path, shipping the file in the bundle, and rewriting part of
   the renderer. That is real work and it costs app size and first-paint time.
2. **Photoreal AI art will clash with the game's flat, saturated arcade look.**
   A photographic grass texture under flat vector caps reads as a mistake, not
   as an upgrade.

So the highest return is wherever the deliverable is **already an image or a
video** — the store listing, the ad creative, the icon, the YouTube thumbnails.
In-game art is the *lowest* return per hour, not the highest, even though it
sounds like the most exciting one.

Ranked accordingly:

---

## Tier 1 — do these, they pay for themselves

### 1. Spanish store screenshots + feature graphic (needed anyway)

The LatAm launch needs a full set of `es-419` screenshots and a Spanish feature
graphic. Last time this was hand-built with Python/PIL over several iterations
(overflow bugs, shrink-to-fit loops). Higgsfield replaces most of that:

- **`reframe`** — take one finished screenshot frame and re-cut it to every
  required aspect ratio (Play phone, 7" tablet, 10" tablet, iPhone 6.9", iPad 13")
  without re-rendering each one by hand.
- **`outpaint_image`** — extend the 1024×500 feature graphic art outward instead
  of re-composing when a ratio changes.
- **`upscale_image`** — push a 2K render to 4K for the iPad 13" shots.

This is the one place Higgsfield removes work you would otherwise definitely do.

### 2. Ad-creative variants for the Brazil and India campaigns

You already have six YouTube videos live and two campaigns running at $8 and
$7/day. Google's App campaigns want **more creative variety**, not better single
creatives — that is literally how the algorithm learns.

- **`ad-multiplier` workflow** — feeds one of your existing 20.4 s ads in and
  produces independently edited variants (different framing, different on-screen
  emphasis) while preserving the cut and timing. Source must be 4–30 s; yours are
  20.4 s, so they qualify.
- **`virality_predictor`** — scores a video for hook strength and retention risk
  *before* you spend money on it. At ~$0.08 CPI this is worth running on every
  new variant before it goes into a campaign.
- **`marketing_studio_image` / DTC Ads** — generates the 1.91:1, 1:1 and 4:5
  image assets Google Ads asks for, which are currently the thinnest part of both
  ad groups.

### 3. App icon exploration

The icon is the single highest-leverage image in the whole store listing and it
costs ~2 credits to try twenty directions. `nano_banana_pro` at 1:1, then
`remove_background` for the transparent variants, then `upscale_image` to 1024².
Do a batch, pick one, A/B it on Play via a store listing experiment.

### 4. A real store preview video

You have **no App Store preview and no Play promo video**. Both stores show one
in the top slot; an app with a video converts measurably better than one without.
`store-assets/VIDEO-GUIDE.md` already specifies the format. The
**`video-editing`** workflow (higgsedit, file-backed projects rendered to MP4)
is the right tool — it combines your real captured gameplay footage with
designed titles in one timeline, rather than generating fake gameplay, which
both stores prohibit.

> ⚠️ Store preview videos must show **actual gameplay**. Do not use
> `generate_video` to invent footage of the game — that is a rejection on Apple
> (2.3.3, misleading screenshots) and a Play policy problem. Generate the
> *frames around* the gameplay, never the gameplay itself.

---

## Tier 2 — real upgrades, real work

### 5. An animated goalkeeper (`autosprite`)

This is the most interesting in-game one. `autosprite` turns a single character
image into a **game-ready sprite sheet PNG with an atlas**: idle / jump /
custom animations, 2–64 frames, 32–512 px per frame, background removed.

The keeper is currently drawn as procedural shapes and does not animate. A
sprite-sheet keeper with an idle sway and a dive would be the biggest single
visual jump the game could make — and unlike a grass texture it is genuinely
hard to hand-draw.

Cost: the renderer needs a sprite path (load sheet, index frame by time). Perhaps
half a day. Worth it; nothing else on this list changes how the game *feels*.

### 6. Cap and pitch concept art — as reference, not as assets

Generate the look you want, then **hand-translate it into the procedural
renderer's colour and shading values**. You get art direction without shipping a
single new byte. This is the right way to use `generate_image` for a canvas game.

The four images generated as a test today are exactly this: a hero composition
and a grass texture. Judge them as *direction*, not as assets.

### 7. Sound (`generate_audio`)

`src/lib/audio.ts` fires `horn`, `cheer`, `whistle`, `flick`, `ohh`. Menu music
is a toggle with thin content behind it. Generated loops and stingers are cheap
and the game is currently quiet. Lower priority than anything visual, but it is
the second thing players notice.

---

## Tier 3 — available, probably not for this game

| Tool | Why not (yet) |
|---|---|
| `generate_3d` (image → GLB) | Nothing in a 2D canvas game consumes a mesh. Could pre-render a turntable of a cap for store art — that is a Tier 1 use wearing a Tier 3 hat. |
| `shorts_studio` / `tiktok_publish` | Genuinely interesting for organic reach on a game with no marketing budget, but it is a *content programme*, not a task. Only start it if you will post weekly. |
| Website builder (`create_website`) | solevia.app is four static pages on Cloudflare and works. Nothing to gain. |
| `soul_2` / character training | No characters in the game. |
| `dubbing`, `create_voice` | No voice content. |

---

## Test batch run today

Four images, 2K, `nano_banana_2`, ~7 credits total:

| # | Prompt | Ratio |
|---|---|---|
| 1–2 | Top-down bottle caps arranged as players on a scratched school desk, chalk pitch lines, one cap mid-flick, clean space at the top for a title | 16:9 |
| 3–4 | Seamless tileable mown-grass pitch texture, even lighting, no seams | 1:1 |

They are in your Higgsfield library (jobs `14fe65c4…`, `7c50829a…`,
`ed556dd4…`, `6ee47247…`).

**Caveat, stated plainly:** the sandbox running this session is not allowed to
reach the Higgsfield CDN, so the files could not be downloaded here and **I have
not seen them**. Judge them yourself before doing anything with them. If they are
close, the next step is `upscale_image` on the winner and then compositing the
Spanish feature graphic over the 16:9 one.

---

## Suggested order

1. Spanish screenshots + feature graphic (blocks the LatAm launch — do first)
2. App icon batch, then a Play store-listing experiment
3. `ad-multiplier` variants + `virality_predictor` before the Sept 8 campaign review
4. Store preview video from real footage
5. `autosprite` keeper, if you want one bigger visual swing this quarter
