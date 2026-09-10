# Cowork brief — Zen Bubbles app icon (revert to finger + bubble-wrap, recolor bg)

## What Leandro wants
Go BACK to the previous app icon — the **finger pressing a sheet of bubble wrap** —
instead of the current smiley-bubble mascot icon. Keep the finger and the bubble
wrap exactly as they were. ONLY change the background colour: swap the old
teal→navy gradient for the **Home screen's warm sunset gradient**.

## Reference art (in the repo / git history)
- The icon to revert TO (finger + bubble wrap, teal→navy bg): it's the
  `assets/icon-only.png` at git commit **`bc016b1^`** (the commit just before the
  mascot icon landed). I can export it for you if easier — it's the finger-on-
  bubble-wrap render.
- The current (to be replaced) mascot icon: `apps/pop-zen/assets/icon-only.png` on
  the branch now.

## The new background (match the Home sky)
Replace the teal→navy background with the Home screen sky gradient
(`src/assets/scene/sky.webp`), top → bottom:
- top: warm coral/peach ≈ `#E79165` / `#D39885`
- upper-mid: soft mauve ≈ `#B18B95`
- lower-mid: dusty violet ≈ `#99798D`
- bottom: deep indigo ≈ `#443C6A`
A smooth vertical gradient through those stops (warm at top, deep indigo at the
bottom), matching the Home mood. Keep the same soft rounded-square framing.

Important: the bubble-wrap sheet is translucent, so the new background should show
THROUGH it (the bubbles/plastic pick up the warm/indigo tones) — please re-render or
re-composite so the translucency reads naturally over the new gradient, not just a
recolored backdrop with a teal-tinted sheet on top.

## Deliverables
- **1024×1024 PNG**, full-bleed (no transparency needed for the master), named
  `icon-only-v2.png`.
- Also, if you split layers like before: an **`icon-background-v2.png`** (the plain
  1024² sunset gradient) and an **`icon-foreground-v2.png`** (finger + bubble wrap on
  TRANSPARENT — a real cutout this time, so we can recomposite/adaptive-icon it).
- Same CDN host as prior deliveries. **No AI upscaler.**

## What we'll do on our side
Re-encode + regenerate all the app-icon sizes (iOS `AppIcon.appiconset`, Android
mipmaps/adaptive icon, favicon) from your master with the project's tooling. You only
need to deliver the 1024² master (+ optional layers).

## Acceptance
- [ ] Finger + bubble-wrap composition identical to the previous icon.
- [ ] Background is the Home sunset gradient (coral → indigo), bubble-wrap
      translucency reads naturally over it.
- [ ] 1024² PNG master (+ optional transparent foreground), no upscaler.
