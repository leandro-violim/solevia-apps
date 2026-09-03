# Project C — Realistic visual overhaul (cap · pitch · UI)

**Status:** in progress · **Branch:** `feat/project-c-graphics` (isolated from release `cap-kickers`)
**Approach:** design → validate each step on-device → build. Keep `src/game/` (physics/rules/AI) untouched — this is a **render-layer** overhaul only, so the 159 tests stay green.

---

## North star (the look)
Nostalgic **"bottle-cap football on a school desk."** Real materials, warm and tactile: honey-toned wood, white **hand-drawn chalk** field lines with kid doodles (hearts, initials, ink blots), **glossy enamel crown caps** in candy colors with printed crests, a **brass trophy**, warm window light, soft contact shadows, and a **motion-blur trail** on the flick. Premium but playful and kid-safe. Reference set in `store-assets/higgsfield-test/` (caps-options, caps-on-pitch, caps-on-pitch-2, cabinet, pitch_school_desk, pitch-grass/…).

## Locked decisions
- **Camera: top-down gameplay.** Cheapest on battery/memory/size, keeps physics/input/readability. The cinematic 3/4 Higgsfield renders are reused as **static hero art** in menus / Cabinet / win screens (zero runtime cost). *(Rejected: 3/4 live perspective — perf risk on cheap Android; 2.5D tilt — extra cost, less clean.)*
- **Caps: photoreal + clean readability rim.** Because it's top-down, a cap only spins in place → **one photoreal top-down sprite per cap, rotated in 2D.** No 3D, no turntable frames. ~20–30 KB each.
- **Pitch: plain surface texture fills the whole screen + accurate field lines drawn on top** in a **hand-drawn chalk** style. Same system for every surface (desk / grass / concrete). Fixes line-alignment and out-of-bounds margin, keeps geometry pixel-accurate.
- **UI (phase C): warm-wood Cabinet language** from `cabinet.png` (pigeonholes, felt, spotlights, brass).

## Architecture
- Stay on **Canvas 2D** (no WebGL/Three.js → lowest battery). Swap only what `drawCap`/`drawPitch` paint:
  - `drawCap` → `drawImage(capSprite)` rotated by spin + contact-shadow ellipse + motion trail; **falls back to the vector cap until decoded** (no blank frame). Wired via `src/lib/cap-sprites.ts` (`SPRITE_FILES` map).
  - `drawPitch` → `drawImage(photo)` cover-fit when ready, else procedural fill; skips procedural markings when the photo carries lines. Wired via `src/lib/pitch-textures.ts` (`PitchStyle.photo` / `photoHasLines`).
- **No changes in `src/game/`** (physics, rules, AI, session).

## Efficiency plan (battery / memory / size)
- **Format:** WebP + alpha (caps ~256², pitch ~1024²). *Encoding TODO: sips can't encode WebP with alpha and there's no `cwebp` on this Mac — prototypes ship PNG; the real assets must be WebP-encoded (via Cowork/Higgsfield export, or a `cwebp`/squoosh step).*
- **Decode-once cache** (mirrors `samples.ts` for audio): decode each asset once, keep the handle, never re-decode.
- **Preload = in-use set only** at match start: equipped cap (both teams) + equipped pitch (~3 images).
- **Prefetch on idle** (Cabinet/pitch picker): decode visible thumbnails as they scroll in.
- **Lazy-load** unlockable skins only when equipped/scrolled into view — never all at boot.
- **Memory:** LRU-evict non-equipped pitch bitmaps (a 1024² RGBA ≈ 4 MB — only the current one resident); caps ~256 KB each, keep <10 resident. Target **< ~15 MB** image memory on cheap phones.
- **"Streaming":** N/A — this is an **offline Capacitor app** (assets bundled, no backend). The analog is **lazy decode** from bundled files. Bundled-asset size budget **< ~1 MB** for the starter set (≈8 caps + ~5 pitches in WebP). Remote/on-demand download is a *future* option only if the catalog balloons.

## Risks + mitigations
1. Photoreal detail muddy at ~44 px → generate at 256², good downscaling, readability rim; validate on-device (done for the hero cap — reads well).
2. Style clash (real caps on flat vector UI) → UI is phase C; interim the caps sit on the real surface.
3. Cheap-Android memory → LRU evictor + only-equipped-pitch-resident.
4. Asset-set consistency (a matched cap set) → lock one prompt + reference, batch-generate.

## Milestones / phases
- **M1 — hero cap (DONE).** Photoreal top-down blue cap wired as default `soda-blue`; renders top-down w/ spin + shadow in a real match. Commit on branch.
- **M2 — pitch (DONE).** Plain-wood surface fills the screen (`drawSurfaceFill`), improvised **hand-drawn chalk** field drawn on top at accurate geometry (deterministic wobble/overshoot), and the whole pitch is **baked to an offscreen buffer + blitted** so the chalk is static (no per-frame shimmer) and cheap. Goals kept as the original hatched net (chalk-goal experiment was reverted per feedback). Chalk look + no-shimmer both approved on-device.
- **Phase A — full cap set** (both teams + unlockable skins as photoreal top-down sprites; perfect 90° overhead batch).
- **Phase B — pitch variants** (grass/artificial/concrete/desk → the pitch unlockables become real surfaces; user already generated plain grass/artificial/concrete).
- **Phase C — UI/menu restyle** to the warm-wood Cabinet language.

## Asset pipeline (Higgsfield via Cowork)
Prompts are written for Cowork to paste into Higgsfield; deliver files into `store-assets/higgsfield-test/`, Claude Code integrates.
- ✅ **Hero cap** → `hero-cap-blue.png` (delivered; 512² transparent, royal-blue enamel, near top-down).
- ⏳ **Plain wood desk** (pending) → `wood-plain.png`: top-down 90° overhead worn honey wood, grain + subtle scratches/ink, **no lines/text/objects**, seamless/tileable, ~2048², PNG.
- ⬜ **Cap color set + opponent cap** (Phase A): same prompt as hero cap, batch of matched colors, **exact bird's-eye zero perspective**, transparent, no logo (or per-skin crest).
- ⬜ **Pitch variants** (Phase B): plain grass/artificial/concrete already generated; may re-cut to tileable.

## Open items / pending decisions
- Re-generate caps as a **perfect 90° top-down** batch (hero has a slight tilt — acceptable, but a matched flat set is cleaner).
- Decide whether the **readability rim** is needed (judge once caps sit on the busy desk texture).
- **WebP encoding** pipeline for real assets (prototypes are PNG).
- Out-of-bounds **table tint** + **hand-drawn chalk** line renderer (M2 build).
- Fixed **glint** layer for caps (so the specular doesn't spin) — optional polish.

## Progress log
- 2026-09-03 — Branch created. Reviewed 10 Higgsfield references; locked north star + camera (top-down) + cap finish (photoreal+rim) + pitch approach (plain texture + procedural chalk). M1 hero cap wired + validated. M2 photo-texture path added; school-desk prototype validated the direction and surfaced the plain-wood + procedural-chalk requirement. Paused for `wood-plain.png`.
- 2026-09-03 (cont.) — M2 DONE (plain wood + hand-drawn chalk, baked to a buffer = static/no shimmer; goals kept hatched). Phase A DONE: full photoreal cap set wired (both teams + skins), `neon-pink` still vector (needs a pink photo). Phase C started (direction **A — warm & bright**): app-wide wooden bg + `.panel` cream cards rolled across Home, Settings, Cabinet, Caps/Pitches pickers, About/Legal (Tutorial on wood only). **Open:** pink cap; pitch VARIANTS as real surfaces (only default wood is photo); **WebP encoding of all sprites/textures (prototypes are PNG, bundle ~4–5 MB)**; HUD/keeper/ball styling; optional menu hero art from the 3/4 renders.
