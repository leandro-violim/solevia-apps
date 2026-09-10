# Zen Bubbles — visual/UI revamp brief (repeat the Cap Kickers "Project C" success)

Paste the prompt below into a fresh Zen Bubbles chat. It reproduces the exact method that
worked for Cap Kickers: decide the tech approach first (2D vs 3D vs rebuild), then pick a look
from 3 concrete options, then execute in phases — render-layer only, validated on device.

Reference: `apps/cap-kickers/store-assets/PROJECT-C-DESIGN.md` (in the solevia-cap-kickers
worktree) is the Cap Kickers source-of-truth to mirror.

---

## The planning prompt (copy everything below)

```
Let's do a visual/UI revamp for Zen Bubbles (apps/pop-zen) the same way we did Cap Kickers
"Project C": we (1) chose the tech approach, (2) I picked one of 3 concrete art directions,
and (3) executed it in phases — all render-layer only, no game-logic rebuild.

STEP 0 — study the method first.
Read apps/cap-kickers/store-assets/PROJECT-C-DESIGN.md (in the solevia-cap-kickers worktree).
That is the pattern to mirror: a locked "north star" doc, render-layer-only overhaul, phased
milestones, Higgsfield→Cowork asset pipeline, WebP + decode-once, validate each phase on my
phone. Then look at Zen Bubbles' current look (Home, the gameplay board, the bubbles, the HUD,
menus) and tell me what's there today and how it's rendered.

STEP 1 — the tech fork (recommend one, don't just list).
Lay out the same three-way tradeoff Cap Kickers faced and give me your recommendation with
reasoning, tuned for cheap LatAm Android (battery/memory/app-size are hard constraints):
  - Stay 2D: keep the current 2D engine, just refresh the art. Cheapest, least wow.
  - Go 3D: real glassy/refractive bubbles in WebGL/Three.js. Most impressive, but it means
    rebuilding the render engine and risks battery/memory/size on cheap phones.
  - Photoreal 2D ("the Project C move"): keep the proven 2D engine and physics UNTOUCHED, but
    replace the ART with photorealistic Higgsfield-generated bubble/background sprites (real
    glass / soap-film refraction and highlights baked into the sprite). Looks ~3D, costs 2D.
For Cap Kickers, Photoreal 2D won because a top-down cap only spins in place, so one flat
photoreal sprite read as fully 3D at 2D cost. Tell me whether the same logic holds for
Zen Bubbles' bubbles (they mostly scale/float/pop, not rotate in perspective) and which
approach you'd pick.

STEP 2 — show me THREE distinct looks (within the chosen approach).
Not descriptions — things I can SEE. Either quick HTML/artifact mockups of the board + one
bubble + a menu, or a set of copy-paste Higgsfield prompts I run in Cowork to generate
reference art. Each direction (A / B / C) gets: a one-line mood name, the palette, the bubble
material/finish, the background/board treatment, and the menu language. Make them genuinely
different calm/zen moods — e.g. serene glass & light / tactile paper-craft / luminous
night-sky — but propose your own three. Zen Bubbles' whole vibe is calm, so keep all three
soothing, not busy.

STEP 3 — after I pick one, execute like Project C.
Write a locked north-star design doc at apps/pop-zen/store-assets/ (mood, palette, bubble
material, background, camera, menu language), then build in phases:
  hero bubble -> board/background -> full bubble + pop/float FX set -> UI/menu restyle.
Rules, non-negotiable:
  - RENDER-LAYER ONLY. Do not touch game logic; keep all tests green.
  - WebP + decode-once caching; lazy-load skins; keep image memory small (target the same
    budget Cap Kickers used). It's an offline Capacitor app — assets are bundled, no backend.
  - Assets go through Cowork/Higgsfield: you write copy-paste prompts, I generate and drop the
    files in, you wire them in.
  - Validate each phase on my phone before moving to the next.

Don't build anything until I've picked the tech approach AND a direction.
```
