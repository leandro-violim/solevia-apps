# Zen Bubbles v1.3 — Higgsfield art requests (for Cowork)

Art Code can't generate — hand these to Cowork/Higgsfield. **Locked palette:**
brand aqua `#33E0C6`, coral `#f062a0`, gold `#F5C451`, sandy island rim `#e9cfa a`,
sky = warm sunset clouds → serene purple → blue water. Style = the game's
"photoreal-clear bubble wrap + juicy glossy game shell." **Deliver every cutout
as a transparent PNG (alpha), trimmed, no drop shadow baked in.**

---

## 1) "Your Journey" (world/phase map) — needs real art + icons

The map is a vertical scroll of 4 worlds × 8 levels. Right now the path, nodes
and islands are plain CSS; Leandro wants proper illustrated art. Please deliver:

**1a. Level-node tiles — 3 states, transparent, ~512² each, top-down/slight-iso:**
- **Completed** — a glossy hexagon in brand aqua with a gold star centered, soft outer glow.
- **Current ("you are here")** — a glossy white/pearl hexagon with a bright highlight ring and a small coral flag/pin; leave room for a number.
- **Locked** — a frosted grey hexagon with a closed padlock.
(Keep all three the same size/shape so they line up on the path.)

**1b. Winding-path island strip — tall vertical illustration (e.g. 1080×3200), can be one image per world (~1080×1000):**
- Floating islands made of the real clear **bubble-wrap** top with a warm **sandy rim** and a few small stylised trees, over the sunset→purple→water **sky**.
- A soft **dotted/rope path** snaking between the 8 node spots (leave the node spots empty — Code overlays the tiles from 1a).
- Each of the 4 worlds slightly themed: W1 calm daylight, W2 breezy, W3 dusk, W4 night/aurora — but cohesive.

**1c. Mascot moving between phases (optional animation):**
- The bubble-buddy mascot (see #3) hopping/rolling from one node to the next along the path.
- If animated: a short **transparent-background loop (webm/gif or a sprite sheet)** of a 2–3 hop cycle, ~1s, that Code can play when the player advances a level. If static is easier, just the mascot mid-hop as a transparent PNG.

> Code will scroll/pan this and overlay the node tiles + numbers; when the player
> clears a level the map pans the mascot to the next node.

---

## 2) Power-up bubbles (gameplay) — power-up icon INSIDE a clear bubble

The special bubbles currently show a plain emoji. Please make each as a **glossy
3D power-up suspended inside the game's clear bubble-wrap dome**, transparent PNG,
~512², top-down to match the poppable bubble sprite:

- **Bomb** (`bomb`) — a cute glossy black bomb with a lit fuse, floating inside a clear bubble.
- **Snowflake / Time Freeze** (`frozen`) — a glossy icy-aqua snowflake inside a clear bubble (a touch of frost on the dome).
- **Star / Golden** (`golden`) — a glossy gold star inside a clear, faintly-golden bubble.
- **Gift / Mystery** (`mystery`) — a small glossy wrapped gift (coral + gold ribbon) inside a clear bubble.

Keep the clear-dome shape identical to the default bubble so they read as the
same bubble "with something inside." A matching **popped** version isn't needed
(they reuse the default popped sprite).

---

## 3) Transparent cheering mascot (unblocks Home + Finish)

Leandro picked the **cheering** bubble-buddy (arms up):
`https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/hf_20260909_211332_7dc21cb6-456e-48ef-a0a9-9d31057962f1_min.webp`

That file is on a white background with a soft shadow, and its glass body is too
translucent to auto-cut cleanly. **Please re-export it as a clean transparent PNG
(alpha), trimmed, NO ground shadow** — same as the bubble sprites were delivered.
Then Code drops it into the Home hero + Finish celebration immediately. (Idle
mascot `c4f73dd8` is already cut and in use as the placeholder.)

---

### Handoff back to Code
Drop the transparent PNGs / animation on the CDN and paste the URLs here; Code
downloads, verifies alpha + budget (WebP, decode-once, <~15MB resident), and
wires them in. Encode note for Code: use the project's **native sharp** (run the
script from `apps/pop-zen`) — the global WASM sharp corrupts WebP.
