# Zen Bubbles v1.3 — Higgsfield art DELIVERED (Cowork → Code)

Answers `COWORK-ART-REQUESTS-v1.3.md`. All cutouts are **transparent PNG (alpha), trimmed, no baked drop shadow**, generated on the locked palette (aqua `#33E0C6`, coral `#f062a0`, gold `#F5C451`, sandy rim, sunset→purple→water sky).

Base URL for all files: `https://d8j0ntlcm91z4.cloudfront.net/user_3Gy9Lu8BGRS2LbDJBYp8Mtuafy2/`

**Encode note (unchanged):** Code downloads, verifies alpha + budget, exports WebP with the project's **native sharp** run from `apps/pop-zen` (global WASM sharp corrupts WebP), decode-once, lazy, <~15MB resident.

---

## 3) Cheering mascot — transparent PNG ✅ (the unblocker)
Re-exported from `7dc21cb6` with a clean alpha cut, trimmed, no ground shadow. Drop into Home hero + Finish celebration.

| Asset | Transparent PNG |
|---|---|
| Mascot — cheering (arms up) | `hf_20260910_023414_e2b9762a-8276-47f8-86d4-549d0d06ff68.png` |

(Idle mascot `c4f73dd8` already in use stays as-is.)

---

## 1a) Level-node tiles — 3 states, transparent, same hex size/shape ✅

| State | What it is | Transparent PNG |
|---|---|---|
| **Completed** | glossy aqua hexagon + centered gold star | `hf_20260910_023647_8e159a91-3bbd-4dca-827e-dc599ce83878.png` |
| **Current ("you are here")** | pearl-white hexagon + aqua highlight ring + coral flag/pin, empty face for a number | `hf_20260910_023649_0eacdaa2-48e4-4165-8edf-aa4d950f9063.png` |
| **Locked** | frosted grey hexagon + padlock | `hf_20260910_023653_bb638f95-56cf-4d83-8173-1b1ace430936.png` |

All three are square, centered, and the same hex footprint so they line up on the path. Code overlays the level number on the Current tile.

---

## 1b) Winding-path island strips — one image per world ✅

Delivered as 4 cohesive per-world scenes (~2048² each, full backdrops — **no cutout needed**). Each is a floating bubble-wrap island with sandy rim + small trees over the sunset→purple→water sky, with a dotted/rope path curving through **empty node spots** (Code overlays the 1a tiles + numbers on those spots).

| World | Theme | Full scene PNG |
|---|---|---|
| **World 1** | calm daylight | `hf_20260910_023426_9a0d1cc4-81de-4d95-9f23-52b90b9216e1.png` |
| **World 2** | breezy afternoon | `hf_20260910_023426_539d7256-41d9-4ead-94b0-404c85c29d5c.png` |
| **World 3** | warm dusk | `hf_20260910_023426_a54aa2a2-155b-4192-a32e-9a677bb049d0.png` |
| **World 4** | night / aurora | `hf_20260910_023426_5b7aac5a-ce1e-4bf1-ad0d-80981486edab.png` |

Note: the generator places the empty spots for you but doesn't guarantee exactly 8 evenly-spaced. If Code needs a strict 8-node grid, treat these as the painted backdrop and lay the rope-path + node anchors as a CSS/absolute-position layer on top (positions in JSON), so the 8 nodes are deterministic regardless of the art.

---

## 2) Power-up bubbles — power-up INSIDE the clear dome, transparent ✅

Each is the game's clear bubble-wrap dome (referenced from the locked bubble sprite `a67d910d` so the dome reads identical) with a glossy 3D power-up suspended inside. Square, top-down, transparent. Reuse the default popped sprite for the popped state.

| Power-up | key | Transparent PNG |
|---|---|---|
| **Bomb** | `bomb` | `hf_20260910_023656_1200f4c1-f07d-4ce7-9eb2-573d6b849728.png` |
| **Time Freeze** | `frozen` | `hf_20260910_023658_1a9d75c2-7c5b-4508-a6c2-06fdf92977e6.png` |
| **Golden / Star** | `golden` | `hf_20260910_023700_7837012c-a77a-44c4-ae67-a925702965c1.png` |
| **Mystery / Gift** | `mystery` | `hf_20260910_023703_d97b312f-4829-4742-adcf-f977df3e93f2.png` |

---

## 1c) Mascot hop cycle — DELIVERED as 3 transparent frames ✅

Delivered as a **3-frame hop cycle** (transparent PNGs, same bubble-buddy character, referenced off idle mascot `c4f73dd8`) instead of a video — lighter, no transparent-video artefacts, and Code drives it with a CSS keyframe hop when the player advances a node. Play in order 1→2→3 (→ hold on idle at the new node).

| Frame | Pose | Transparent PNG |
|---|---|---|
| **1** | crouch / anticipation | `hf_20260910_031624_99595a70-2d66-42fb-a343-5ab2a700dfa9.png` |
| **2** | mid-air (arms up) | `hf_20260910_031626_0c14ee0d-b9b0-4685-a9fc-48550a353c04.png` |
| **3** | landing (squash) | `hf_20260910_031637_1c2713aa-e687-4852-956b-e1e0206c4a64.png` |

**Suggested wiring (Code):** move the mascot node→node with a `translate` transition (~600–900ms, ease-in-out along the path), and cross-swap the 3 frames over that same window to sell the hop (crouch at launch → mid-air at apex → land on arrival), then rest on the idle sprite `c4f73dd8`. Respect `prefers-reduced-motion`: skip the frame swap + arc, just move the idle sprite. This satisfies the "2–3 hop cycle, ~1s" ask without shipping a video; if you'd still prefer a baked sprite-sheet or webm loop, Cowork can produce one on request.

---

### Status
All requested items delivered: 3 (mascot), 1a (nodes), 1b (islands), 2 (power-ups), 1c (hop cycle). Ready for Code to wire.
