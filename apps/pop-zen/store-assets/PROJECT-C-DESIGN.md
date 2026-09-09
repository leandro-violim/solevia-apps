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
- 2026-09-09 — Direction locked = A/realism-first. Diagnosed current look. Generated + reviewed ~30 Higgsfield options. **Locked: full bubble `501368a3` (tall inflated clear), ROUND popped `17c819f1` (opt 61), board `b2ae83f5` (opt 75, aqua-tint).** Confirmed full-game restyle scope (Home/menus/colors/imagery — retention goal). North star locked. Next: Code branch `feat/pop-zen-1.3`, wire Phase 1 (bubble) + Phase 2 (board), validate on device; then Phases 3–5 (FX, full UI restyle, map + skins).
- 2026-09-09 — **Phases 1–2 wired on `feat/pop-zen-1.3` (render layer only; all 39 tests green, tsc clean).**
  - **Assets:** downloaded the 3 locked source PNGs; processed with `sharp` (bun). Bubbles cut off white via **border flood-fill** (preserves the near-white dome body, stops at the gray rim → clean round alpha), 3×3 alpha feather, auto-trim, WebP 512². Board resized to WebP 1280². Sizes: **full 18 KB, popped 23 KB, board 84 KB** (~125 KB total; starter ≪ 1 MB, resident ≪ 15 MB).
  - **Tone cleanup (render-layer art fix):** the Higgsfield domes carried crease/shadow regions that smeared as "dirt" at game size. Full bubble → radial *interiorBrighten* (clean bright dome, rim ring preserved, smoothstep-feathered so no boundary ring). Popped → gentle *shadowLift* (kills the charcoal crease, keeps the crinkle texture). Script kept at `scratchpad/process.mjs` if a re-run/tune is needed.
  - **Files replaced:** `src/assets/bubbles/real-bubble-full.webp`, `…/real-bubble-popped.webp`, `src/assets/scene/field-sheet.webp`. `Bubble.tsx` unchanged (already swaps full→popped).
  - **Board overlay relaxed** (`src/routes/play.tsx`): the old sheet was *tiled* (repeat, size tied to bubble size) + dimmed/blurred (opacity .6, `blur(2px) brightness(.62)`) + a 20% black veil. New asset is a single composed sheet → shown as **one continuous image** (`cover`, no-repeat), opacity 1, `blur(1px) brightness(.92)`; container veil changed from `rgba(0,0,0,.2)` to a soft aqua `#cfeceb`. Aqua realism now reads; crisp shadowed poppable bubbles still stand out on top.
  - **Verified in browser (mobile viewport):** full domes read as clean clear bubbles with defined rims; popping swaps to the deflated/crinkled sprite (visibly distinct); board reads as one bright aqua sheet; no console errors. `build:mobile` + `cap sync ios`/`android` done.
  - **Pending — on-device validation (Leandro):** simulator graphics are broken on this Mac, so Phases 1–2 need a real-device check (archive iOS / run Android from the synced native projects). Then Phase 3 (FX).
