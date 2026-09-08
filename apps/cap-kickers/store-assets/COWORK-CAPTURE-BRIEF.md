# Cap Kickers 1.2 — capture & ad-creative brief (for Cowork)

Goal: fresh **store screenshots** (the graphics changed completely, so the live listing
misrepresents the app) plus **Google Ads** and **Apple Ads** image creatives, all showing the
new "Project C" look. Same method as the 1.0 set: render from the **web build** headless
(Chromium/Playwright), no native ad banner exists on web so shots are clean.

## How to run the app for capture
- Build/serve the mobile web build: `cd apps/cap-kickers && bun run dev` (or serve `dist/client`
  after `bun run build:mobile`). The web build has **no ad banner** — nothing to hide.
- Set the on-screen language per locale before each capture. Either use **Settings → Language
  (EN / PT / ES)**, or seed `localStorage['capkickers.locale.v1'] = '"en"' | '"pt-BR"' | '"es"'`
  then reload.
- To make the **Reward Road** and **Cabinet** look populated, seed progress first:
  - `localStorage['capkickers.campaign.v1'] = '{"completed":["l1","l2","l3","l4","l5"]}'`
  - `localStorage['capkickers.inventory.v1'] = '{"owned":["pitch-table","audio-crowd","pitch-cement","cap-metal-red"]}'`
  - `localStorage['capkickers.wallet.v1'] = '{"balance":320}'`
  - reload so the startup backfill + UI pick it up.

## Screenshots — 6 scenes, each in EN / PT-BR / ES
1. **Home** — the cinematic hero banner + Solo vs AI / 2 Players / Practice.
2. **Gameplay** — mid-match on a good-looking pitch (grass or Night), caps + HUD (score, touch pips).
3. **Reward Road** — the Solo vs AI screen: "Next reward" spotlight + phase list with reward chips
   (seed progress above so chips show claimed/locked).
4. **Reward moment** — the big "Unlocked!" celebration (win a phase that grants a pitch) OR the
   goal celebration card.
5. **Trophy Cabinet** — the caps collection.
6. **How to Play** — the tutorial (now centered pitch).

### Dimensions (portrait)
| Target | Size | Notes |
|---|---|---|
| Apple iPhone 6.9" | **1320 × 2868** | required tier; the folder `screenshots/ios-iphone-6.9-*` is the pattern |
| Apple iPad 13" | **2048 × 2732** | if keeping iPad on the listing |
| Google Play phone | **1080 × 1920** | 9:16; 2–8 shots |
| Google Play feature graphic | **1024 × 500** | one, landscape |

Optional: add a short marketing caption band per shot (e.g. "A whole new look", "See what you'll
unlock", "Real crowd & commentary") — keep text localized to the shot's language.

## Google Ads (App campaign image assets)
Reuse the new look; export a set (the earlier drafts in `store-assets/Claude outputs/` —
`gads-portrait.png`, `gads-square.png`, `play-feature-graphic.png` — show the intended slots):
- **Square 1200 × 1200**, **Landscape 1200 × 628**, **Portrait 1080 × 1920**.
- Show a hero cap/pitch + the wordmark + a one-line hook ("Flick. Score. Collect."). Localize the
  hook for the pt-BR and es campaigns.

## Apple Ads (Apple Search Ads)
Apple Search Ads pulls creative from the **App Store screenshots** by default, so the new 6.9"
screenshots above double as the ad creative. If running **custom creative sets / a Custom Product
Page**, group the screenshots the same way per locale — no separate asset sizes needed.

## Deliver to
Drop the exports under `apps/cap-kickers/store-assets/screenshots/<target>-<locale>/` and the ad
images under `store-assets/ads/`. Then the listing upload + "What's New" (below) can go in.
