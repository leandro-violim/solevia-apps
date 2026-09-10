# Zen Bubbles — v1.3 Visual Revamp + World/Phase Map — SHARED PLAN
**Owner of truth:** this doc. Cowork writes here after each step; Code writes its findings back here too, so both stay in sync. Location: `apps/pop-zen/store-assets/REVAMP-v1.3-PLAN.md`.
**Method mirrored from:** `apps/cap-kickers/store-assets/PROJECT-C-DESIGN.md` (Project C).
**Status:** PLANNING. ✅ Tech approach LOCKED = **Photoreal 2D**. ✅ STEP 4 UX LOCKED = **land on the world/phase map at your current node**. ⏳ Awaiting Leandro's pick of art direction **A / B / C** (mockup delivered).
**Last updated:** 2026-09-09 by Cowork (STEP 2 mockup delivered).

---

## 0. Queued-work audit — "what's already in flight so we don't collide"

Checked the git repo (`solevia-apps`, monorepo), all branches, worktrees, stashes, and docs.

- **v1.2 is in review, not yet merged to `main`.** It lives on `feat/v1.2-mega` (~40 commits ahead of main): the mega content update + Spanish (Burbujas Zen) + AdMob + per-world scores. **This is the latest Pop Zen code.** The revamp must stack on top of it.
- **There is NO separate Pop Zen v1.3 branch yet.** The branches `feat/1.3` and `feat/project-c-graphics` are **Cap Kickers** work (same monorepo, checked out in the `solevia-cap-kickers` worktree) — *not* queued Pop Zen changes. So nothing Pop-Zen-specific is silently queued in a branch.
- **`store-assets/REVAMP-BRIEF.md` (untracked)** = literally this revamp request. So **this visual revamp IS the intended next Pop Zen update (v1.3).**
- **No stashes.** No Pop Zen roadmap/next/TODO docs. Only a stale `ads.ts` TODO comment (real AdMob ids were already wired in v1.2 — ignore).
- Untracked junk in the tree (`_reference/`, `_to_delete/`, `.claude/` settings) — not real work.

**Conclusion:** the next Pop Zen update = **(a) this visual revamp + (b) STEP 4 world/phase map & persistence.** They should ship together as **v1.3**, branched off `feat/v1.2-mega`. ⚠️ *Code to confirm authoritatively* (see §6 prompt) — there may be intent in Code's own notes/memory not visible in git.

**Bonus synergy:** Cap Kickers already built a **"Candy-Crush-style reward road on the campaign screen"** (commit `51b31fa` on the cap-kickers branch). That is a proven, reusable pattern for STEP 4's world/phase map — Code can mirror it rather than invent it.

---

## STEP 0 — Current Pop Zen look & how it's rendered

**Render tech:** pure **React DOM + CSS** (TanStack). **No canvas/WebGL for gameplay** — bubbles and board are DOM elements. (Only small canvases exist for pop particles / confetti: `PopParticles.tsx`, `confetti.ts`.)

**Today's scene:**
- **Home:** dark indigo gradient, a single glossy classic bubble hero, aqua "Desafío Pop" / dark "Reventar por diversión" buttons, footer links. Calm, clean, a little plain.
- **Board (play):** `backgroundImage: url(fieldSheet)` — a dimmed bubble-wrap WebP sheet behind a grid of bubbles. HUD on top: world/phase label ("MUNDO 1 · 1/8 · Burbujas extragrandes"), timer, "metas de hoy" goal card, Bomb/Freeze power-up pills.
- **Bubbles:** `Bubble.tsx` renders each as a DOM node with `backgroundImage` = a **per-skin WebP sprite** (`full` + `popped` variants). Popping swaps to the deflated sprite + scales down.
- **Shop:** grid of real WebP skin thumbnails (Classic/Neon/Ocean/Sunset/Night/Gold/Pastel/Mint/Lavender) + power-ups.

**The important finding:** Pop Zen has **already done the "Project C move" for its bubbles.** The bubbles are *already* real Higgsfield-generated **WebP** sprites (`src/assets/bubbles/skins/*.webp`, ~4.7 MB total), already lazy per-skin (`equippedBubbleSprite`), on a battery-cheap DOM render. Unlike Cap Kickers (which started from vector caps), we're **not** starting from scratch — the sprite tech + WebP pipeline is proven and shipping.

**So the revamp is about elevating everything the bubbles sit in and around into one locked, cohesive art direction:** the **board/background**, the **HUD & menus**, the **pop/float FX**, and a **unified premium material** across the default + all skins — plus a **world/phase map**.

---

## STEP 1 — Tech fork → RECOMMENDATION: **Photoreal 2D** (the Project C move)

The same three-way tradeoff Cap Kickers faced, tuned for cheap LatAm Android (battery/memory/size are hard limits):

| Approach | What it means for Pop Zen | Verdict |
|---|---|---|
| **Stay 2D (art refresh only)** | Keep DOM render, just repaint. Cheapest, least wow. | Too timid — we want a real visual leap. |
| **Go 3D (WebGL/Three.js refractive bubbles)** | Rebuild the render engine for real glass refraction. Most "wow" on paper. | ❌ Rebuild risk, battery/memory/APK cost on cheap phones, throws away a proven render. |
| **✅ Photoreal 2D** | Keep the DOM engine + physics **untouched**; replace the ART with photoreal Higgsfield sprites (glass/soap-film refraction + highlights baked in). Looks ~3D, costs 2D. | **Recommended.** |

**Why Photoreal 2D is an even easier call for Pop Zen than it was for Cap Kickers:**
1. **A bubble is radially symmetric.** Cap Kickers won on "a top-down cap only spins in place, so one flat sprite reads as 3D." A bubble is *stronger*: a sphere has **no wrong angle** — it scales, floats, and pops but never rotates in perspective, so one baked photoreal sprite reads as fully volumetric always. 3D buys essentially nothing visible here.
2. **The pipeline already exists and ships.** Bubbles are already WebP sprites with a decode/lazy path. We extend the *same* proven system to the board, FX, and skins — near-zero new engine risk.
3. **Render-layer only → tests stay green.** No game-logic touch, exactly like Project C.
4. The *only* thing 3D would add — the bubble refracting the live background as it drifts — is a subtle effect on a slow, calm game, not worth a WebGL rebuild + battery hit on the target hardware.

**What the revamp actually delivers (since bubbles are already sprites):** a locked north-star art direction applied to → **board/background** → **default + all skin bubbles re-generated to one cohesive premium material** → **pop/float FX set** → **HUD + menu restyle** → **world/phase map screen**. Same phased, decode-once, WebP, validate-on-device discipline as Project C. Bundle target: keep added image memory in the same **<~15 MB resident / <~1 MB starter budget** Cap Kickers used.

---

## STEP 2 — Three art directions (PREVIEW — full see-able mockups after approach is locked)

All three are calm/zen and soothing, genuinely distinct moods. Full HTML mockups (board + one bubble + a menu) **and** copy-paste Higgsfield prompts come next, once you confirm Photoreal 2D.

- **A · "Serene Glass & Light"** — crystalline glass / soap-film bubbles with a whisper of rainbow thin-film on the rim; soft daylight, faint caustics. Palette: aqua + mint + warm white + pale sand. Frosted-glass menu panels, airy light type. *(Closest to today, most "premium bubble.")*
- **B · "Tactile Paper-Craft"** — matte handmade-paper / felt bubbles, soft studio shadow, stop-motion craft warmth (Monument-Valley-calm). Palette: oat, clay, sage, dusty rose. Cut-paper menu cards, hand-torn edges. *(Warmest; matte = lowest battery, no heavy speculars.)*
- **C · "Luminous Night-Sky"** — bubbles glow softly from within like bioluminescent lanterns on a deep-indigo calm night with a slow starfield. Palette: indigo/navy + teal glow + soft gold. Dark glowing menus. *(A "wind-down before sleep" mood; dark = great on OLED battery.)*

---

## STEP 4 — World/Phase progression map + persistence (new scope for v1.3)

Goal: a Candy-Crush-style sense of moving through Phases and Worlds, with the current position **persisted** so continuing gameplay resumes at the last passed phase.

- Pop Zen already has the mechanics: **4 worlds × 8 phases**, per-world best scores, per-phase combo records. What's missing is (a) a **visual map** and (b) **"where am I" persistence**.
- **Reuse the Cap Kickers reward-road** pattern (`51b31fa`) for the map UI.
- **Code owns** this one (game state + persistence + a new screen). Cowork provides the map's **art** (path, world backdrops, node/lock/star icons) via Higgsfield, in the chosen direction.
- Open question for Leandro: should "continue" **auto-resume** the last phase, or drop you on the **map** at your current node (Candy-Crush style)? *(Recommend: land on the map at your node — it shows progress and gives the satisfying "next level" tap.)*

---

## 5. How Cowork & Code split this (the collaboration model)

- **Cowork (here) executes:** art direction, the 3 see-able directions, all Higgsfield asset generation, the locked north-star design doc, store creatives, and this shared plan.
- **Code executes (Cowork hands it copy-paste prompts):** the authoritative repo/branch/queued-work confirmation, all render-layer wiring, WebP integration + decode-once cache, the world/phase map screen + persistence, keeping tests green, and on-device builds for Leandro to validate.
- **Sync mechanism:** this file (`store-assets/REVAMP-v1.3-PLAN.md`) is the shared source of truth. Cowork updates it + drops assets into `store-assets/`; Code appends its findings/decisions and wires assets. After each message, files move both ways (Cowork↔Mac repo) so nobody drifts.

---

## 6. Prompt to paste into Code (confirm queued work + branch + render map)
```
We're planning Zen Bubbles v1.3 = a visual/UI revamp (Project C style, render-layer only) +
a Candy-Crush world/phase map with persistence. Cowork audited git and found: v1.2 is on
feat/v1.2-mega (in review, not on main); feat/1.3 and feat/project-c-graphics are Cap Kickers
branches, not Pop Zen; no stashes; store-assets/REVAMP-BRIEF.md is this request.

Please confirm authoritatively, and write your answers into
apps/pop-zen/store-assets/REVAMP-v1.3-PLAN.md (§ "Code findings"):
1) Is anything ELSE queued/intended for the next Pop Zen update that isn't in git — WIP in any
   worktree, uncommitted changes, or plans in your notes/CLAUDE.md? List it so we fold it in.
2) Branch strategy: OK to create feat/pop-zen-1.3 off feat/v1.2-mega for this work, so it
   stacks on the in-review v1.2 and merges cleanly once v1.2 ships? Suggest otherwise if better.
3) Render map for the revamp: confirm the files Cowork should target — Bubble.tsx (per-skin
   WebP sprites), play.tsx fieldSheet background, skins.ts, the decode/cache path, and the
   current bundled image-memory budget. Anything that would make new board/FX/menu art hard to
   slot in render-layer-only?
4) STEP 4 (map + persistence): where does phase/world state live today, is "current phase/world"
   persisted across sessions, and where would a Candy-Crush-style map screen hook in? Can you
   reuse the Cap Kickers reward-road (commit 51b31fa) pattern?
Keep game logic untouched and all tests green. Report back in the shared plan doc.
```

---

## 7. Decision needed from Leandro (to unblock STEP 2)
1. **Tech approach** — Cowork recommends **Photoreal 2D**. Confirm or override.
2. Then Cowork produces the **three see-able directions** (HTML mockups + Higgsfield prompts) for you to pick A / B / C.
3. **STEP 4 UX:** auto-resume last phase, or land on the map at your node? (Recommend: land on the map.)

---

## 8. STEP 2 — three directions DELIVERED (2026-09-09)
Mockup: `zen-directions-mockup.html` (board + bubble + world/phase map ribbon + menu + palette per direction). Leandro to pick **A / B / C**. Full material specs below; these become the north-star doc once picked.

**A · Serene Glass & Light** — clear crystalline / soap-film bubbles, bright specular, thin iridescent rim; soft daylight board with faint caustics; frosted-glass menu, airy light type. Palette `#EAF7F4 #33E0C6 #BFE9E2 #FFFFFF #F5E7C6`. *(Closest to today; keeps brand aqua.)*

**B · Tactile Paper-Craft** — matte handmade-paper/felt spheres, soft top light, cut-paper shadow; warm linen/paper board; cut-paper menu cards, warm ink type. Palette `#EFE7D8 #C9A896 #A9BFA0 #D9A7A0 #6B5E52`. *(Warmest; matte = lowest battery.)*

**C · Luminous Night-Sky** — orbs glowing from within (bioluminescent lantern), bright core; deep-indigo night board, slow starfield, teal nebula; dark glowing menus, gold stars. Palette `#0B1026 #14B8A6 #3B4B8A #F5C451 #EAF2FF`. *(Wind-down mood; dark = great on OLED battery.)*

### Higgsfield prompts (locked, for STEP 3 once a direction is picked)
Hero bubble = one perfectly round, radially symmetric sprite, transparent background, centered, no text, 1024², export WebP w/ alpha. Generate `full` + a `popped/deflated` variant per skin.
- **A:** "Photorealistic single round soap-bubble / clear glass sphere, transparent background, soft daylight studio light, crisp specular highlight upper-left, subtle rainbow thin-film iridescence on the rim, faint refraction, calm, centered, no text, 1024x1024, alpha."
- **B:** "Single perfectly round matte handmade-paper/felt sphere, soft stop-motion craft look, gentle soft top light, soft contact shadow, tactile fibrous texture, NO gloss, transparent background, centered, no text, 1024x1024, alpha." (variants: oat, clay, sage, dusty rose)
- **C:** "Single round translucent orb glowing softly from within like a bioluminescent lantern, teal-cyan inner glow, small bright core, dark glassy shell, soft outer bloom, transparent background, calm night mood, centered, no text, 1024x1024, alpha."
Board art (per direction, ~1536×1024 seamless, WebP): A soft daylight gradient + faint caustics/bokeh; B warm linen/paper texture, gentle vignette, no objects; C deep-indigo night gradient + faint starfield + teal nebula, no objects.

## 9. Next actions
- **Leandro:** pick A / B / C. Then run the §6 prompt in Code (confirms branch + queued work + render map + STEP 4 hooks).
- **Cowork (on pick):** write the locked north-star doc, generate the hero bubble via Higgsfield, hand Code the wiring notes; then board → full bubble/FX set → UI restyle → map art, phase by phase, validating on device.
- **Code:** create `feat/pop-zen-1.3` off `feat/v1.2-mega`; wire assets render-layer-only, tests green; build the map screen + persistence (land-on-map).

---

## 10. v1.3 confirmed scope (the queue — keep so we don't forget)
1. **Visual/UI Photoreal 2D revamp** (direction A, realistic bubble wrap). — in progress (STEP 3: nailing the realistic default bubble + board).
2. **World/Phase map + persistence** — Candy-Crush-style map; "continue" lands on the map at the current node; last passed phase/world persists across sessions. (Reuse Cap Kickers reward-road `51b31fa`.)
3. **Spanish version → publish in Latin America.** ⚠️ **Mostly already built in v1.2 (in review), do NOT redo from scratch:** in-app UI localized to `es` (i18n.ts full parity), native app name "Burbujas Zen" wired (commit `0e23bff`), es store listing copy + screenshots prepared, LatAm availability planned. **v1.3 top-up only:** (a) localize any NEW strings the revamp + world/phase map introduce into `es` (and pt), (b) keep the es store screenshots current with the new visuals, (c) optional: Spanish privacy/terms pages (currently EN-only), (d) QA the es build on device. Owner: Code for in-app strings; Cowork for store assets/screenshots.

*(Items 1–3 ship together as v1.3, branched off the in-review v1.2.)*
