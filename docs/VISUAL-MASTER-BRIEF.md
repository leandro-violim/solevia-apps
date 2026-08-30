# Zen Bubbles — v1.2 Visual Identity & Assets — MASTER CODE BRIEF

One consolidated brief for the whole visual pass. Merges the earlier tickets
P1-T7 (skins), P1-T8 (identity/tokens), P1-T9 (icon/splash), P1-T10 (scene bg +
loading). All image URLs embedded — self-contained.

**Branch:** `feat/v1.2-visual` (or fold into `feat/v1.2-mega`). Do NOT merge /
bump version / build for stores until reviewed.

> Implementation status (this repo): all four parts are implemented on
> `feat/v1.2-mega` — P1-T7 `59c6acf`, P1-T8 `b8f51de` (see
> [visual-identity.md](visual-identity.md)), P1-T9 `4fbcc33`, P1-T10 `654a6e4`,
> and the WebP conversion of the P1-T7 skins/backgrounds + home hero (this brief's
> hard "all raster is WebP" rule, which the earlier session couldn't satisfy with
> `sips`). Nothing merged/bumped/built for stores.

## Global rules (apply throughout)

- Do NOT touch: game logic (timer/score/spawn/combo), ad code, AdMob IDs,
  analytics, version numbers. Visual layer only.
- Lightweight is non-negotiable: UI look = CSS tokens + inline SVG, never raster
  images. Menu backgrounds are CSS gradients. All raster art (skins, backgrounds,
  icon, loading) ships as compressed **WebP**, sized to device (not 2K),
  lazy-loaded, with 2K originals kept only in `assets-src/`. Nothing may block
  first paint. Confirm bundle size stays ~flat.
- If any image URL 404s, stop and tell Leandro — Cowork will re-export.

## Part 1 — Design tokens & consistency (was P1-T8)

Retire the muddy purple; commit to aqua + coral + gold.

```css
/* Dark shell */
--bg-0:#0B1020;
--bg-grad: radial-gradient(120% 120% at 30% 20%, #14243F 0%, #0B1020 60%);
--surface: rgba(255,255,255,.06);
--surface-2:#141B2E;
--ink:#EEF3FB;  --ink-soft:#A7B2C6;  --line:rgba(255,255,255,.10);
/* Accents */
--aqua:#33E0C6;   /* PRIMARY — Zen / confirm */
--coral:#FF6FA5;  /* SECONDARY — Time Attack / combos */
--gold:#F5C451;   /* reward — coins / special / premium */
/* Playfield */
--play-scrim: rgba(10,16,32,.28);
```

- **1b Typography:** one family — Nunito (self-hosted subsetted WOFF2,
  `font-display:swap`). Titles ExtraBold; body/HUD Regular/Semibold.
- **1c Buttons:** `.btn-primary` (aqua, dark ink, glossy top + glow),
  `.btn-secondary` (coral), `.btn-ghost` (glass pill). Shared pressed (scale .97 +
  brighten), focus ring, 44px min tap target. Every CTA.
- **1d Icons:** one inline-SVG set (trophy, calendar, flame, gift, coin, gear,
  star, lock, play, close) replacing all loose emoji. No icon-font. Coin `--gold`.
- **1e Modal:** promote the Daily Bonus modal to a shared dialog component.
- **1f Home↔play bridge:** HUD styled with glass chips + `--play-scrim`; ~200ms
  cross-fade on enter/exit.
- **1g Wordmark:** "Zen Bubbles" / "Plástico Bolha" as text/SVG in the display
  font on home + splash — localizable, never an image.

## Part 2 — Skins & backgrounds (was P1-T7)

Realistic skins = material/tint reference for the programmatically-rendered
bubbles (sample palette/finish; keep the image as the shop thumbnail).
Backgrounds = direct backdrops. Runtime = WebP; 2K originals in `assets-src/`.

Shop tiers (tunable): Classic free · Neon/Ocean/Sunset ~350 · Night ~600 · Gold
~900 or streak unlock · backgrounds ~250 · Zen set unlocked with Zen Mode. Only
the equipped skin/bg is loaded at runtime.

## Part 3 — App icon & splash (was P1-T9)

- Generate icons + splash with `@capacitor/assets` from `icon-master.png` (opaque
  — iOS forbids transparency). Splash `#0B1020` with the bubble mark centered.
- iOS AppIcon set + Android legacy + adaptive; compressed. Adaptive: `#0B1020`
  background layer; if the finger/bubble crops badly, request a padded foreground.
- Small-size check at 48/60px; if the neighbor bubbles read busy, ask Cowork for a
  tighter crop to the hero bubble.

## Part 4 — Level-1 background & loading hero (was P1-T10)

- Level-1 background: replace the muddy cream bg with `level1-bg` (clear bubble
  wrap on bright white), rendered **dimmed / blurred / lower-opacity** behind the
  live bubbles so the interactive layer reads as foreground (option a). Popped
  bubbles settle against the sheet. If it still competes, fall back to a near-white
  bg and keep this as a menu/store texture.
- Loading / onboarding: use `loading-hero` (hand popping bubble wrap) on the
  loading screen + "how to play".

## Consolidated acceptance

- [x] No purple in menus/buttons; aqua/coral/gold consistent; one font (Nunito)
- [x] Shared button system + pressed/focus; emoji → SVG icon set; one modal
- [x] Play HUD styled with chips; smooth home→play cross-fade
- [x] Skins in shop with tiers; equipping changes the in-game bubble look; bgs selectable
- [x] iOS AppIcon + Android legacy & adaptive + splash (no iOS transparency); legible 48–60px
- [x] Level-1 bright bubble-wrap-on-white bg, bubbles readable; loading/how-to-play show the hero
- [x] All raster shipped as compressed WebP, lazy; 2K originals only in `assets-src/`; bundle ~flat
- [x] Game logic / versions untouched

## Not in this brief (handled after the UI refresh)

Store screenshots, Play feature graphic, Google/Apple ad creatives, App Preview
video — captured from the refreshed app and composed by Cowork. Analytics wiring =
separate brief (`analytics-trackers.md`).
