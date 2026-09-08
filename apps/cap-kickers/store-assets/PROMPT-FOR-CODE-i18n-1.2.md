# Task for Code — localise the remaining hardcoded English display strings

**This blocks the pt-BR and es store screenshots for 1.2.**

Cowork captured the 1.2 build for the App Store and Play listings in en / pt-BR / es.
The pt-BR and es captures still render English in several places, so those sets can't
be uploaded. Root cause: display names live in game-data modules, not in i18n.

## Confirmed on the 1.2 build (`dist/client`, mtime 2026-09-08 13:19)

- Reward Road (`/campaign`) rank rail reads `ROOKIE AMATEUR PROSPECT REGULAR STARTER VETERAN CAPTAIN` in all three locales
- Reward tiles read `TABLE` and `CEMENT` in all three locales
- pt-BR next-reward CTA reads **"Vença a Fase 7 · Captain"**

## Three sources

**1. `src/game/campaign/ladder.ts`** — `LEVELS[].name`, 14 hardcoded English rank
names (l1 `Rookie` … l14 `Champion`). The type comment says
`// shown as-is (rank names read across locales)` — that assumption is what broke.
"Rookie", "Prospect", "Starter" and "All-Star" do not read in pt-BR or es.

Rendered raw at `src/routes/campaign.tsx:202` and `:239`, and interpolated into
`campaign.nextRewardCta` at `campaign.tsx:121` and `src/routes/play.tsx:1200`.

**2. `src/game/pitches/styles.ts`** — `PITCH_STYLES[].name`, 7 hardcoded English
names (Grass, School, Table, Cement, Night, Street, Beach).

Rendered at `src/routes/cabinet.tsx:239`, and via `rewardView()` →
`RewardView.name` (`src/game/campaign/reward-display.ts:20`) consumed at
`campaign.tsx:55`.

**3. `src/game/caps/styles.ts`** — `CAP_STYLES[].name`, 16 hardcoded English names
(Soda, Crown, Spring, Sport, Retro, Neon, Grape, Lime, Gold, Chrome, Ruby, Cobalt,
Emerald, Copper, Amethyst, Legend).

Rendered at `src/routes/caps.tsx:88`, `cabinet.tsx:240`, `src/routes/settings.tsx:169`.

## The pattern already exists — audio packs do it right

`reward-display.ts:26-32` returns a `nameKey` and the component resolves it
(`campaign.tsx:55`, `play.tsx:1197`); `cabinet.tsx:229-238` does the same.

Extend that to ranks, pitches and caps: add a `nameKey` to each data record
(e.g. `campaign.level.l7`, `pitch.table`, `cap.metal-red`), keep the English
literal as the fallback, and resolve at the render site. No new mechanism needed.

## Also: stale i18n keys

`src/lib/i18n.ts` carries orphaned `campaign.level.l1`–`l6` keys in all three
locale blocks (en 177–182, pt-BR 360–365, es 542–547). They're left over from a
6-level ladder and no longer match — i18n says l3 = "Regular", `ladder.ts` says
l3 = "Prospect". Nothing reads them. Replace with a full l1–l14 set rather than
leaving the mismatched ones in place.

## Scope

Display-name localisation only — no gameplay or save-format change.

Rank / pitch / cap **ids stay exactly as they are**: `capkickers.campaign.v1`,
`capkickers.inventory.v1` and the equipped-cap key all persist ids, so existing
saves must keep working. Only the human-readable label becomes locale-aware.

## Done means

`tsc --noEmit` clean, tests green, and `/campaign`, `/cabinet`, `/caps`,
`/settings` and the win screen show no English strings under pt-BR or es.

Then tell Leandro — Cowork re-runs the capture harness
(`apps/cap-kickers/tools/store-capture`, one command) against the new build.
Only pt-BR and es strictly need regenerating; the harness does all three anyway.
