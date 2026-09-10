# Cowork brief — "Your journey" islands: remove PADS, keep the rope

## Why
We render the level markers (locked / done-star / current) as our own oval disc
sprites on top of the island. The baked tan **pads** under them now just clutter /
show through beneath the smaller markers. So please **remove the pads** — but
**KEEP the connecting rope**. Each marker will sit centred on a rope node, so the
rope reads as one line entering and one line leaving each marker.

Leandro wants World 1 first; please do **all 4** for consistency (markers render the
same on every world).

## What to remove vs keep
Starting from the current `world-1.webp … world-4.webp`:
- **REMOVE:** only the 8 tan level **pads**. Where each pad was, leave a clean rope
  **node/junction** so a disc centred there has the rope coming in one side and going
  out the other (one entry, one exit per node — no stub ends, no gap under the disc).
- **KEEP:** the golden **rope/trail** and its 8 nodes, the tan **border/rim**, the
  **trees/palms**, the **bubble-wrap ground**, lighting (upper-left), and the sky.

## Portal — move it farther, keep it on the rope
On World 1 the portal sits too close to the last pad. Please move the **portal a bit
farther from the last node (pad 8)** and **extend the rope** so it still connects
cleanly into the portal. Keep the portal baked (as today) — just repositioned with
the rope reaching it. Do the same "portal comfortably past the last node" spacing on
all four worlds.

## Critical: identical framing (so our coordinates still line up)
The updated island MUST keep the **same dimensions, crop, and island position/scale**
as the current file for that world (square). We place markers at fixed percentage
coordinates, so any shift/rescale throws every marker off. Only the pads change (and
the portal moves) — the rope nodes should stay at essentially the **same positions**
the pads were, so our existing marker coordinates still land on them.

## Deliverables
- **PNG masters**, same square size as the current sources (~1080²+ is fine).
- Filenames: `world-1-pads-off.png … world-4-pads-off.png`.
- Same CDN host as before. **No AI upscaler** — clean composited renders. We'll
  re-encode to `world-1.webp … world-4.webp` with the project's native `sharp`.
- Please also send the **new portal centre coordinate** per world (x%, y% of the
  square image) so we can move the portal's tap target to match.

## Acceptance checklist
- [ ] Pads removed; rope KEPT with a clean node at each former pad spot (one in, one out).
- [ ] Portal moved farther from the last node, rope extended to reach it (all 4 worlds).
- [ ] Island shape/size/framing/scale IDENTICAL to the current file; rope nodes at the
      same positions the pads were.
- [ ] Trees, border, ground texture, lighting, background unchanged.
- [ ] Square masters, correct filenames, no AI upscaling; portal coords included.
