# Zen Bubbles — Visual Identity (P1-T8)

One calm, premium, tactile product. Design-tokens + CSS + inline SVG only — **no
shipped raster UI images**. First paint stays fast; no asset blocks startup.

## Design tokens (`src/styles.css` `:root`)

Dark shell:

| token | value |
|---|---|
| `--bg-0` | `#0B1020` |
| `--bg-grad` | `radial-gradient(120% 120% at 30% 20%, #14243F 0%, #0B1020 60%)` |
| `--surface` | `rgba(255,255,255,.06)` |
| `--surface-2` | `#141B2E` |
| `--ink` | `#EEF3FB` |
| `--ink-soft` | `#A7B2C6` |
| `--line` | `rgba(255,255,255,.10)` |
| `--play-scrim` | `rgba(10,16,32,.28)` |

Accents (no purple anywhere in menus/buttons):

| token | value | role |
|---|---|---|
| `--aqua` | `#33E0C6` | primary · Zen · confirm |
| `--coral` | `#FF6FA5` | Time Attack · combos |
| `--gold` | `#F5C451` | coins · specials · premium |

The existing shadcn semantic tokens (`--background`, `--primary`, `--accent`,
`--card`, `--border`, …) are **re-mapped** to these, so every screen that paints
through them recolours at once. Also exposed as Tailwind utilities via
`@theme inline`: `text-aqua`, `bg-coral`, `text-gold`.

## Typography

One family — **Nunito**, self-hosted subsetted latin **variable** WOFF2
(`src/assets/fonts/nunito-latin-var.woff2`, ~40 KB), `font-display:swap`. Titles
ExtraBold (800), body/HUD Regular/Semibold (400/600). Set app-wide via
`--font-sans` on `body`.

## Buttons (`.btn` + variants, `@layer components`)

- `.btn-primary` — filled aqua, dark ink, glossy top highlight + soft glow.
- `.btn-secondary` — coral (Time Attack / secondary confirm).
- `.btn-ghost` — glass pill (`--surface` + `--line`).
- Shared: 44px min tap target, focus-visible ring, pressed = `scale(.97)` +
  brighten. In `@layer components` so utilities (`py-4`, `w-full`) still win.

## Icons (`src/components/icons.tsx`)

One inline-SVG set, single 2px stroke, rounded caps, 24×24, `currentColor`:
Trophy, Calendar, Flame, Gift, Coin, Gear, Star, Lock, Play, Close, Check. No
icon-font. Coin is tinted `text-gold`. Replaces all loose emoji (🏆 📅 🔥 🎁 🪙
⭐ 🔒 ▶ ✕) across menus + HUD, including emoji previously baked into i18n strings.

_Note:_ `finish.tsx` keeps its pre-existing lucide-react hero glyphs (Trophy /
Sparkles / RotateCcw / ArrowRight — already inline SVG, not a font); the in-game
special-bubble markers (⭐💣❓❄️ in `specials.ts`) are gameplay affordances, left
untouched.

## Shared dialog (`src/components/Modal.tsx`)

Promotes the Daily Bonus modal's look (glass card `.zb-dialog` on a dimmed,
blurred overlay) into one component — Escape + backdrop-close. Reused by the
Daily Bonus and the phase-complete score card; the same `.zb-dialog` chrome is
available for revive/score/settings surfaces.

## Home ↔ play bridge

- The equipped background theme renders behind the playfield with a
  `--play-scrim` overlay for HUD legibility.
- HUD (Exit, phase, timer, tap-to-start, objectives) uses `.glass-chip`.
- ~200ms `screen-fade` mount transition on every screen (home ↔ play etc.).

## Wordmark

"Zen Bubbles" / "Plástico Bolha" rendered as **text** in the display font
(`.wordmark`, aqua-tinted gradient + soft glow) on home — localizable, never an
image. The app-icon/logomark raster is a separate deliverable (P1-T9).

## Lightweight rules (hold)

Menu backgrounds are CSS gradients (no photos) · inline SVG only · one WOFF2 font
· nothing blocks first paint · skins/backgrounds stay lazy. JS bundle unchanged
(no new deps); only additions are the ~38 KB async font + ~2 KB CSS.
