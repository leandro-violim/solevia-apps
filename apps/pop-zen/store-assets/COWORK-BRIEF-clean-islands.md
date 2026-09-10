# Cowork brief — "Your journey" CLEAN island bases (no baked pads/rope/portal)

## Why
We now render the level markers (locked / done-star / current) as our own oval disc
sprites on top of the island, and we have a standalone portal sprite
(`src/assets/shell/portal.webp`) we can place in code. So the pads, the connecting
rope, and the portal that are **baked into** the current island images are now
redundant — and they show through / clutter the board under the smaller markers.

Please deliver **clean island bases** with those baked elements removed, so only our
code-drawn markers + portal appear. Leandro wants World 1 first; please do **all 4**
for consistency (the markers/portal are rendered the same way on every world).

## What to remove vs keep
Starting from the current `world-1.webp … world-4.webp` islands:
- **REMOVE:** the 8 tan level **pads**, the golden **rope/trail** connecting them,
  and the teal **portal swirl**. Leave clean bubble-wrap ground where they were.
- **KEEP everything else exactly as-is:** island shape, size, framing, camera/
  perspective, the tan **border/rim**, the **trees/palms**, the **bubble-wrap ground
  texture**, lighting (upper-left), and the sky/ocean background.

## Critical: identical framing (so our coordinates still line up)
The clean island MUST have the **same dimensions, crop, and on-image position/scale**
as the current file for that world (they're square). We place markers at fixed
percentage coordinates measured against the current art, so if the island shifts or
rescales even slightly, every marker will be off. Same square canvas, same island
placement within it — only the pads/rope/portal painted out.

## Deliverables
- Transparent-or-opaque **PNG masters** (whatever matches your pipeline), same square
  size as the current sources (the current shipped webp are ~1080²; masters at
  1080²+ are fine — we re-encode).
- Filenames: `world-1-clean.png … world-4-clean.png`.
- Same CDN host as before. **No AI upscaler** — clean composited renders. We'll
  re-encode to `world-1.webp … world-4.webp` with the project's native `sharp`.

## Portal (no art needed, just context)
Don't bake a portal. We already have `portal.webp` (clean transparent teal swirl)
and will render it in code, positioned a bit **farther from the last pad** than the
old baked one. If you'd rather deliver a fresh portal sprite matching the new look,
that's welcome but optional.

## Optional — path connector
With the rope gone the markers will sit on bare bubble-wrap. If that reads too empty,
we can draw a subtle dotted/rope connector in code between markers. Your call whether
to leave the ground fully clean; we can add the connector on our side either way.

## Acceptance checklist
- [ ] Pads, rope, and portal fully removed; clean bubble-wrap where they were.
- [ ] Island shape/size/framing/scale IDENTICAL to the current file (per world).
- [ ] Trees, border, ground texture, lighting, background unchanged.
- [ ] Square masters, correct filenames, no AI upscaling.
