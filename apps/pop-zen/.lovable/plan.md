## Goal

A calming plastic bubble-wrap popping game. 5 phases (bubbles get smaller and more numerous). Per-phase records saved on-device. Bottom banner ad placeholder always visible; between-phase video ad placeholder shown after each phase. Web build first, then wrapped with Capacitor for App Store / Play Store submission.

## No sign-in

No accounts, no Lovable Cloud. Records live in `localStorage`. Design the storage layer behind a small hook so we can swap in cloud sync later without touching the game.

## Phases

| Phase | Bubbles | Bubble size |
| ----- | ------- | ----------- |
| 1     | 10      | XL          |
| 2     | 20      | L           |
| 3     | 32      | M           |
| 4     | 45      | S           |
| 5     | 60      | XS          |

Score per phase: `base = bubbles * 10` + `speedBonus = max(0, 600 - secondsElapsed*5) * bubbles/10`. Record = highest total AND best time.

## Routes

- `/` — landing: title, "Play", "Records" links. Calm hero.
- `/play` — game surface. `?phase=1..5` search param. Handles bubble field, timer, results, between-phase video ad overlay, and advancing.
- `/records` — table of best score + best time per phase, "Reset records" button.

Bottom of every screen: fixed banner slot (`<AdBanner />` — placeholder card labeled "Ad" for now). Between-phase overlay: `<VideoAdPlaceholder />` — full-screen dark card, 5s countdown, "Skip" after 5s, then advance.

## Visuals & audio

- Background: soft aqua-to-white gradient using design tokens. Nothing competes with the bubbles.
- Bubble: one AI-generated top-down transparent PNG of a glossy plastic bubble (Gemini 3 Pro Image, transparent bg). Rendered as `<img>` scaled per phase, gentle idle float animation, `scale/opacity` pop-out on tap.
- Pop sound: realistic bubble-wrap pop generated once via ElevenLabs sound-generation script at build time, saved as a project audio asset. A 5-instance `Audio` pool allows overlapping rapid pops. Requires the ElevenLabs standard connector to be linked once during build; no runtime API cost.

## Game engine

- `useGameEngine(phase)` — generates non-overlapping bubble positions within the play area, tracks popped set, elapsed timer.
- On pop: play pooled sound, animate out, mark popped. When all popped: stop timer, compute score, upsert local record, show results card → `VideoAdPlaceholder` → next phase (or completion screen after phase 5).

## Records storage

- `usePhaseRecords()` hook backed by `localStorage` key `bubble-records-v1` (`{ [phase]: { bestScore, bestTimeMs } }`).
- Interface intentionally identical to what a future cloud implementation would expose (`getAll()`, `submit(phase, score, timeMs)`, `reset()`), so a later swap is a one-file change.
- Guard reads with `useEffect` / hydration-safe pattern (TanStack Start SSR).

## Ads (placeholders for now)

- `<AdBanner />`: fixed bottom slot, ~72px tall, muted card with the label "Ad space". Reserves the same physical space real AdMob banners will use.
- `<VideoAdPlaceholder />`: full-screen overlay shown between phases. Shows a looping bubble animation + "Ad · 5s" countdown, then a "Continue" button. Same lifecycle a real AdMob rewarded/interstitial call would use.
- Wrapped behind an `<Ads>` abstraction with `showBanner()` / `showInterstitial()` so the Capacitor step swaps in the real `@capacitor-community/admob` calls without touching game code.

## Native distribution (Capacitor)

- Configure the project so it's ready to wrap: single-page feel, no browser chrome assumptions, touch-first sizing, safe-area insets on top/bottom (iOS notch + Android nav bar), fullscreen play view, no server-side data dependencies.
- Add a `capacitor.config.ts` and a short `NATIVE.md` explaining the export → Capacitor add iOS/Android → build → submit flow. Lovable itself does not build the `.ipa`/`.aab`; that step runs on your machine after exporting to GitHub.
- Ads note in `NATIVE.md`: replace `<AdBanner>` and `<VideoAdPlaceholder>` internals with AdMob banner + rewarded/interstitial once you have your AdMob IDs.
- Preview device viewport set to mobile.

## Head metadata

Distinct `head()` per route (title/description/og). Home og:image uses the generated bubble hero.

## Out of scope

- Real ad network integration (placeholders only until AdMob IDs exist)
- Cloud accounts / cross-device sync (interface is ready for later)
- Leaderboards, achievements, difficulty modes
- Building the actual `.ipa` / `.aab` binaries (done outside Lovable after export)
