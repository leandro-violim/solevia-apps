# Zen Bubbles — Realistic Visual Overhaul (Project C, pop-zen)
**Status:** LOCKED direction · in production (Phase 1: hero bubble) · **Branch:** `feat/pop-zen-1.3` (off `feat/v1.2-mega`)
**Approach:** **Photoreal 2D** — keep the existing React DOM/CSS render + all game logic UNTOUCHED; replace the ART with photoreal Higgsfield sprites. Render-layer only → all tests stay green. Mirrors `apps/cap-kickers/store-assets/PROJECT-C-DESIGN.md`.

---

## North star (the look) — Direction A: "Serene Glass & Light," realism-first
Real, tactile **clear bubble wrap**. The board reads as one continuous sheet of genuine plastic bubble wrap; the bubbles you tap are **plump, inflated, colorless clear domes** with a soft warm highlight and a clean defined rim; popping them collapses to **deflated, crinkled flat plastic**. Calm, premium, unmistakably "real bubble wrap." Brand aqua (`#33E0C6`) stays for UI accents only — the bubbles themselves are clear. Color + pop-effect skins are the paid upsell layer on top of this clear default.

## Locked decisions
- **Default bubble = style "㉝": tall inflated clear colorless dome**, soft warm daylight, faint center seam, clean rim. Higgsfield source job `501368a3-def8-4729-a6f4-12cbdb46f7f9`; transparent cutout job `a67d910d-50c0-4db6-b769-abd616872461`.
- **Popped state = ROUND deflated/crinkled version of the same bubble** — round silhouette, NOT square (Leandro's explicit call). Higgsfield job `17c819f1-d363-4b1f-bb30-0b98044d308f` (option 61, on white → needs alpha cut).
- **Board/field = soft pale AQUA-TINTED ground** with the clear tall-dome grid (ties to brand aqua `#33E0C6`), **brightened/restored** — not dimmed to near-invisibility like today. Higgsfield job `b2ae83f5-e6bc-4137-b888-de02928c4073` (option 75). *(No rainbow/iridescence anywhere. Star-seam board and darker grounds rejected.)*
- **Camera:** top-down, unchanged. Bubbles scale/float/pop, never rotate in perspective → one baked photoreal sprite reads fully volumetric (why Photoreal 2D wins here even more than for Cap Kickers).

## Why the current look failed (diagnosis, for the record)
`field-sheet.webp` is a genuinely realistic bubble-wrap photo but it's **dimmed/blurred** into the background so its realism is lost; the interactive bubbles (`real-bubble-full.webp`) are near-transparent pale glass that vanish on light and don't match the plastic sheet. Fix = brighten/restore a real sheet as the board + swap in a plump clear bubble sprite that matches it.

## Architecture (what changes — render layer only)
- **Bubble sprite swap:** `src/components/Bubble.tsx` already draws `backgroundImage: url(fullSrc|poppedSrc)` from `real-bubble-full.webp` / `real-bubble-popped.webp`. Replace those two files with the new transparent WebP (full + popped). No logic change; the full→popped swap already exists.
- **Board swap + brightness:** `src/routes/play.tsx` draws `backgroundImage: url(fieldSheet)` from `src/assets/scene/field-sheet.webp`. Replace with the new board WebP and **remove/relax the dim-blur overlay** so the realism shows (keep it subtle enough that bubbles stay readable on top).
- **No changes in game logic** (timer/score/spawn/combo/phases).

## Efficiency plan (cheap LatAm Android — hard limits)
- **Format:** WebP with alpha for the bubble (full + popped); WebP for the board. Bubble sprites ~512², board ~1024²–1536².
- **Decode-once cache** (the existing skin pattern); **lazy-load** skins; only the equipped skin + board resident.
- **Budget:** keep added image memory in the Cap Kickers range (**< ~15 MB resident**, starter bundle **< ~1 MB** for the clear default). Offline Capacitor app — assets bundled, no backend.

## Milestones / phases (validate each on device before the next)
- **Phase 1 — hero bubble (IN PROGRESS):** wire the new clear full + popped sprite as the default; confirm plump→deflated reads clearly in a real run.
- **Phase 2 — board/background:** swap + brighten the field sheet; confirm bubbles stay readable on top.
- **Phase 3 — full FX set:** pop burst + float/idle motion tuned to the new art (reduced-motion respected).
- **Phase 4 — FULL-GAME UI/UX restyle (not just the board — Leandro's explicit priority):** every surface reskinned to one attractive, calm, cohesive system so players stay longer. See "Full-game restyle scope" below.
- **Phase 5 — world/phase map** (see below) + **paid skins**.

## Full-game restyle scope (retention goal — "make it more attractive so people stay longer")
The revamp covers the WHOLE app, not only the play board. One cohesive visual system across:
- **Home** — hero (a beautiful real bubble/sheet), the two mode buttons, daily-challenge/streak entry, footer. First impression must feel premium and calming.
- **Menus/screens** — Settings, Shop, Records, About, How-to-Play, onboarding, daily-bonus modal, finish/score screen, world/phase map.
- **Color system** — one token set: brand aqua `#33E0C6` accents, soft aqua-tinted grounds, frosted-glass panels, airy light type; consistent buttons, chips, cards, shadows. Define once (CSS tokens), apply everywhere. Keep dark-text/contrast readable.
- **Imagery** — Home hero art, backgrounds, icons (coins, power-ups, world/phase map nodes), shop thumbnails, celebration/FX — all in the realistic-clear + aqua look.
- **Motion/feel** — satisfying pop burst, gentle float/idle, smooth transitions (reduced-motion respected).
- **Store creative** — refreshed screenshots/preview once the in-app look lands (Cowork).
Cowork generates the imagery (Higgsfield) + provides the color/token spec + menu mockups; Code applies the tokens and restyles the components render-layer-only, tests green, validated per screen on device.

## World/Phase map (v1.3 feature — STEP 4)
Candy-Crush-style map of the 4 worlds × 8 phases. **"Continue" lands on the map at the current node** (Leandro's pick), with completed phases starred, current node highlighted, locked ahead. **Current phase/world persists across sessions.** Reuse the Cap Kickers reward-road pattern (commit `51b31fa`). Code owns state+persistence+screen; Cowork supplies map art (path, nodes, world backdrops) in this look.

## Skins / upsell ("features that change how you pop")
Default clear bubble is free. Paid **collectible skins = color + a distinct pop experience** (e.g. confetti burst, soft glow, sparkle, unique pop sound/haptic) — not just a recolor. Each ships as a full+popped WebP pair on the locked shape, lazy-loaded.

## Asset pipeline (Higgsfield via Cowork → Code)
Cowork generates in Higgsfield and delivers the transparent WebP; Code downloads (Code has normal network to the CDN; the sandboxed device VM does not), converts/verifies WebP + budget, and wires the two files in. Locked source URLs are recorded above by job id.

## Progress log
- 2026-09-09 — Direction locked = A/realism-first. Diagnosed current look. Generated + reviewed ~30 Higgsfield options. **Locked: full bubble `501368a3` (tall inflated clear), ROUND popped `17c819f1` (opt 61).** Confirmed full-game restyle scope. North star locked.
- 2026-09-09 (redo) — **Phase 1–2 REDONE after Leandro flagged the bubbles looked flat/low-quality and lost the real bubble-wrap feel.** Root cause: wrong sources + an over-aggressive interior-brighten flattened the full bubble, and the light board hid the clear bubbles. Fix: switched to the §11 LOCKED already-transparent sources (full `a67d910d`, popped `fe5e3ba2`), processed minimally at 768²/q90 (no tone-flattening; only a gentle deep-shadow lift on popped to kill a charcoal crease). Board → real continuous bubble-wrap sheet, **soft aqua-teal tint** (Leandro picked "D" from 5 options) so clear bubbles read with contrast. Commits `5910d7b`, `9b31d76`.
- 2026-09-09 (Step 1+3) — **Game-style shell foundation + Home built.** Design tokens (§11 palette) + 8 reusable components in `src/components/gameshell.tsx` (GlossyButton, IconTile, ResourcePill, HexNode, BottomNav, WrapTeaser, Island, Mascot) with `.gs-*` classes in styles.css. Shell art cut/exported (sky, wrap-sheet, mascot-idle, island-trees, island-hex, wrap-patch) via a colour-distance flood-fill + largest-component (translucent mascot needed tol 22). New game-style Home (`src/routes/index.tsx`): sky bg, top bar (avatar/streak/coins/gear), 3 event tiles, "¡Toca y revienta!" teaser (real sheet + auto-pop), island + bubble-buddy mascot + hex nodes (done/current "you are here"/locked) map PREVIEW, big glossy "Mundo X · Fase Y" play button, rounded 5-tab bottom nav. i18n keys added (en/pt/es). Tests green, tsc clean, verified in browser. **Deferred:** mascot-cheer (near-transparent glass, hard cut — do in step 5 finish screen); interactive map + phase/world persistence (step 4); menu restyle (step 5); app icon (step 6).
- 2026-09-09 (Step 4) — **World/phase map + persistence.** New `src/lib/progress.ts` persists the furthest global stage reached (`zb_reached_stage`, 1–32); `play.tsx` calls `noteStageReached(phase)` for each Pop Challenge phase reached (persistence only, no gameplay change). New `/map` route (`src/routes/map.tsx`): 4 worlds × 8 hex nodes on a winding dashed path over the sky, done=★ / current="you are here"+number / locked=🔒; auto-scrolls to the current node; tapping an unlocked node starts `/play?phase=stage`. Home big button now "continues" to the map at the current node; Home label + mini-map read real progress. **SSR gotcha fixed:** progress reads localStorage in a mount effect (useState) — reading it during render made the server/prerender (reached=1) stick after hydration. i18n `map.title` added (en/pt/es). Tests green, tsc clean; verified: done/current/locked states, land-on-node, tap→play, progress advances, Home reflects it. **Next:** step 5 (menu restyle + cheer mascot), step 6 (app icon).
- 2026-09-09 (Steps 5–6) — **Menu restyle + app icon.** New reusable `ScreenShell` (sky bg + sticky header [back · title · coins] + bottom nav + ad) and light game-style classes (`.gs-panel` frosted card, `.gs-btn--ghost`, `.gs-btn--coral`, `.gs-muted`). Restyled **Tienda/Shop, Ajustes/Settings, Records, and Finish** to the game-style system (frosted panels, ink text, glossy/coral buttons, green toggles) — all logic/handlers preserved. Finish now shows the **bubble-buddy mascot** celebration (idle mascot; the *cheer* mascot's cast shadow can't be cut cleanly from the source without manual art — deferred). **App icon** generated from the mascot via `@capacitor/assets` (bubble-buddy on a brand-aqua radial gradient): iOS `AppIcon` + Android adaptive (foreground/background) at all densities; sources in `assets/icon-*.png`. (Splash left unchanged; stray PWA icons removed.) Tests green, tsc + eslint clean; verified all screens in browser. **Remaining (Leandro's later cosmetic pass):** bottom-nav isn't sticky on long screens; cheer mascot; clear-bubble asset size; misc spacing.
- 2026-09-09 (review pass 1) — Leandro feedback batch. **Code done:** Home — island brought down + mascot centred as hero, deduped nav (top bar status-only, single daily tile, bottom nav is the nav), denser teaser sheet (center-crop) so "Tap & pop" is fully covered; **clearer poppable bubble** (body alpha 0.5→0.3, teal shows through); **map pan** from top→current on entry; **world map between phases** (nextPhase → /map?auto=1, pans then continues, tap-to-skip; zen/daily go straight); **Time's Up + point-counting overlays redesigned** to the game style. **Handed to Cowork** (see `COWORK-ART-REQUESTS-v1.3.md`): Your-Journey map art + node tiles + mascot-hop animation; power-up bubbles (bomb/snowflake/star/gift inside a clear bubble); and a **transparent cheering mascot** (7dc21cb6) — its glass body can't be auto-cut, needs a Higgsfield alpha export. Idle mascot stays as placeholder meanwhile.
- 2026-09-09 (cont.) — **Meta look pivoted to a juicy "game-style shell" (Candy-Crush-inspired, not copied) — see §11.** Realistic gameplay board + realistic bubble-wrap Home teaser stay; the shell (Home/map/menus) becomes glossy, rounded, playful. Added a **bubble-buddy mascot** (+ app icon). Full art set generated. Next: Code builds the shell from §11 spec + wires Phases 1–2 bubbles/board, validate on device.

---

## 11. Game-style shell — LOCKED (v1.3 meta look) + assets + Code build spec

**The concept (locked):** realism *where you play and where you're tempted to play*; juicy game-feel *everywhere else*. i.e. **realistic clear bubbles on the gameplay board** + a **realistic bubble-wrap "¡Toca y revienta!" teaser on Home** + a **juicy, rounded, glossy game-style shell** (Home, world/phase map, menus) + a **bubble-buddy mascot**. Inspired by Candy Crush's meta layer, themed to bubble wrap — not a copy.

**Reference mockups (in this folder, open in a browser — the CDN images only render outside the sandbox):** `zen-gamestyle-home.html` (the Home + map + teaser + mascot + nav), `zen-ui-restyle-mockup.html` (flat calm variant, superseded for the shell but keeps useful component ideas), `zen-menu-colors.html` (accent explorations).

### Palette (locked)
- **Sky/home background:** warm sunset clouds (top) → serene purple → blue water (bottom). Kept as Leandro liked it.
- **Primary CTA:** glossy green — `#8fe36b`→`#4fbf3f`, bottom edge `#379a2c`, white bold text (the "go" convention).
- **Brand aqua** `#33E0C6` for bubble/aqua accents; **coral** `#f062a0` for ribbons/highlights; **gold** `#F5C451` coins; frosted-white panels; dark-navy phone frame `#2a2350`.
- Bubbles themselves stay **pure clear** (no color) — color is the paid-skin upsell.

### Components (build these as reusable pieces)
1. **Glossy primary button** — rounded 20–22px, top highlight, 6–7px bottom bevel, soft drop shadow; green default; used for main play + event "Jugar/Diario/Abrir".
2. **Icon tile** — rounded square, 3px white border, colored gradient face (purple/blue/pink), 4–5px bottom bevel; holds an icon; optional small green button under it; optional "+" badge.
3. **Resource pill** — dark translucent rounded pill, icon + value, green "+" badge on the left (lives/timer, coins).
4. **Hex map node** — hexagon; states: done (aqua + star), current (white + glow ring + "Continúa aquí" coral chip), locked (grey + lock).
5. **Bottom nav** — light rounded bar, 5 tabs, center Home raised + green.
6. **Bubble-wrap teaser** — a real bubble-wrap sheet (bundled asset) with 4–5 bubbles auto-popping on a loop (full→popped→reset via the real sprites), coral "¡Toca y revienta!" ribbon; taps into play. Reduced-motion: static.
7. **Islands** — soft-iso platforms whose top surface is the real bubble-wrap sheet (bundled), warm sandy rim, small trees; carry the hex nodes + mascot.
8. **Mascot (bubble-buddy)** — used on islands, celebrations, empty states, and the app icon.

### Home layout (see `zen-gamestyle-home.html`)
Top bar (avatar · lives/timer pill · coins pill · gear) → left column of 3 event tiles → floating bubble-wrap teaser (upper-right) → world/phase map (hex nodes on bubble-wrap islands, mascot, "you are here") → big glossy "Mundo X · Fase Y — Toca para jugar" button → bottom nav. **Continue lands on the map at the current node** (persisted).

### Asset set (Higgsfield-generated; all on white/transparent → Code cuts alpha + exports WebP, decode-once, lazy)
| Asset | Use | Source URL |
|---|---|---|
| Gameplay bubble — FULL (transparent) | tappable bubble | `.../hf_20260909_195614_a67d910d-50c0-4db6-b769-abd616872461.png` |
| Gameplay bubble — POPPED round (transparent) | popped state + teaser pops | `.../hf_20260909_210055_fe5e3ba2-bb16-4b79-9a66-53974b27eeab.png` |
| Bubble-wrap SHEET | board surface + Home teaser + island tops | `.../hf_20260909_194624_9286ac86-695f-4c25-ab08-393f0bfa1fb7.png` |
| Bubble-wrap PATCH (alt) | small teaser/thumbnail | `.../hf_20260909_204449_de69de52-c6f4-4de9-967e-4eb228f7ec26.png` |
| Mascot — idle | home/app icon | `.../hf_20260909_211332_c4f73dd8-7bf1-4c0c-b2b3-c3d74c2e5ca3.png` |
| Mascot — cheering | celebrations/finish | `.../hf_20260909_211332_7dc21cb6-456e-48ef-a0a9-9d31057962f1.png` |
| Island — with trees | map platforms | `.../hf_20260909_211333_6f97e5d5-a7a9-45c8-84b7-6f78637b75f3.png` |
| Island — hex tile | map nodes/platforms | `.../hf_20260909_211333_1e817e06-c09f-452a-a850-e6eb5619e843.png` |
| Sky background | home/map backdrop | `.../hf_20260909_211332_8e9db252-59a9-4c24-aa8e-d14d8ec439c2.png` |

(Base: `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/`. Code fetches these directly — it has normal network; the sandbox/preview does not, which is why mockups show a fallback.)

**Gameplay board (still open, low-stakes):** recommend the realistic bubble-wrap sheet on a **deep-teal ground** for contrast (so clear bubbles pop) — Leandro to confirm deep-teal vs light when validating Phase 2 on device.

### Code build order (render-layer only, tests green)
1. **Design tokens** — commit the palette above as CSS variables; build the 8 components as reusable pieces.
2. **Bubbles/board (Phases 1–2 already handed off)** — full+popped sprites; brightened realistic board.
3. **Game-style Home** — sky bg, top bar, event tiles, teaser (real sheet + auto-pop), bottom nav, big play button.
4. **World/phase map + persistence** — hex nodes on bubble-wrap islands, land-on-node, persist current phase/world (reuse cap-kickers reward-road `51b31fa`).
5. **Menus restyle** — Tienda, Ajustes, Records, finish to the same components.
6. **Mascot + app icon**; then paid color/effect skins.
Validate each step on device before the next. Keep image memory in budget (decode-once, lazy, <~15MB resident).
