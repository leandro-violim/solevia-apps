# Zen Bubbles — app icon v2 (finger + bubble-wrap, sunset background)

Reverted the app icon from the mascot back to the **finger-pressing-bubble-wrap** render (recovered from git `bc016b1^:apps/pop-zen/assets/icon-only.png`), keeping that composition **exactly**, and swapped only the background: the old teal→navy gradient is replaced with the **Home sky sunset gradient**.

## Deliverables (in `apps/pop-zen/assets/`, also sent in Cowork)
- **`icon-only-v2.png`** — 1024×1024 RGB, full-bleed master. This is the one you need.
- `icon-background-v2.png` — 1024² plain sunset gradient (the layer).
- `icon-foreground-v2.png` — 1024² RGBA, finger + bubble-wrap as a transparent cutout (recomposites seamlessly over the background for adaptive-icon use).

No AI upscaler — composited at native 1024² from the original render.

## Background gradient (top → bottom)
`#E79165` coral/peach → `#B18B95` soft mauve → `#99798D` dusty violet → `#443C6A` deep indigo. Smooth vertical gradient, full-bleed, soft rounded-square framing preserved.

## Translucency
The bubble-wrap sheet and bubbles are **relit over the new gradient**, not a recolored backdrop with a teal sheet on top: I reconstructed the original background, isolated the subject's shading as neutral (grayscale) luminance, and laid it over the sunset gradient — so the frosted sheet and clear bubbles transmit the new warm-at-top / indigo-at-bottom tones (warm pink highlights up top, cooler violet lower). The finger keeps its natural skin tone; its old teal rim-light was neutralized so it reads warm/neutral against the sunset.

## Your side
Regenerate all icon sizes (iOS `AppIcon.appiconset`, Android mipmaps + adaptive icon, favicon) from `icon-only-v2.png` with the project tooling.

## Note
Delivered as files (committed here + sent in chat) rather than via the CDN — simplest for the tooling. Can push to the CDN too if you want URL parity with prior assets.
