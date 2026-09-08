# Cap Kickers — store & ads asset plan for the new-UI release

**Status: waiting on the new build.** Everything that can be built in advance is
built. Nothing here can be finished until Claude Code lands the new UI, because
screenshots must show the UI that actually ships (App Review guideline 2.3.3).

Prepared 2026-09-06. Owner: Leandro. Ask Claude to run the steps.

---

## The one thing to remember

> When the new-UI build is ready to publish, **run the capture harness before
> submitting anything**. The store screenshots on both stores, the Play feature
> graphic, and the Google Ads images all come out of one command. Apple Ads needs
> nothing extra — it reads the App Store product page.

A recurring reminder is set to surface this. See "Reminder" at the bottom.

---

## What is already done

- **Capture harness** — `apps/cap-kickers/tools/store-capture/`. Smoke-tested
  2026-09-06 against the current build: produced correct 1320x2868 files and the
  verifier passed. Covers 6 device sizes x 3 locales x 5 routes.
- **Ads composer** — same folder. Renders the Play feature graphic (1024x500) and
  the three Google Ads ratios (1200x628, 1200x1200, 1200x1500) per locale, from
  one HTML template.
- **Specs confirmed** against vendor docs, not memory. Full table in the harness README.
- **pt-BR draft screenshots** — `screenshots/ios-iphone-6.9-ptBR/`. Superseded by
  the new UI; keep only as proof the pipeline works.

## What is blocked on the new build

| Asset | Where it goes | How |
|---|---|---|
| iPhone 6.9" x 3 locales | App Store | `capture.mjs` |
| iPad 13" x 3 locales | App Store (required — app runs on iPad) | `capture.mjs` |
| Play phone + 7" + 10" x 3 locales | Play listing | `capture.mjs` |
| Feature graphic 1024x500 | Play listing | `ads.mjs` |
| Google Ads images (3 ratios) | Google Ads App campaigns | `ads.mjs` |
| Apple Ads creative | — | **nothing to do**, generated from the product page |
| App preview videos | both stores, optional | not automated; decide separately |

---

## Order of operations on release day

1. **Code lands the new UI** and the build is the one you intend to ship.
2. **Fix the i18n gaps below** — otherwise English words land in Brazilian and
   Spanish store screenshots.
3. `node tools/store-capture/capture.mjs --dump-state` → play → Enter. Commit the
   resulting `seed.json` so the shop and pitch screens are not empty.
4. `node tools/store-capture/capture.mjs --base http://localhost:8080`
5. `node tools/store-capture/verify.mjs` — must report 0 wrong size.
6. `node tools/store-capture/ads.mjs --base http://localhost:8080 --art /hero/<new-key-art>.jpg`
7. **Eyeball every locale.** The harness guarantees pixel sizes, not that the
   text fits or the layout looks right.
8. Run the **`solevia-store-release-check`** skill before submitting either store.
9. App Store: new version → upload screenshots per localization → submit.
   Play: new release → replace listing graphics per language.
10. Google Ads: add the new images to the App campaigns. Retire the old ones once
    the new build is live, not before.
11. **Un-pause the Apple Ads campaigns** — `Cap Kickers India — Installs` and
    `Cap Kickers Brazil — Installs` are both paused, waiting on this.

---

## i18n gaps to fix before capture

Found while shooting the pt-BR set on 2026-09-06. These render as English inside
otherwise-Portuguese screens.

**Definitely wrong in a Brazilian/Spanish listing**
- Opponent ranks: `AMATEUR`, `VETERAN`, `CAPTAIN`
- Reward / pitch names shown on the campaign screen: `TABLE`, `CEMENT`

**Judgement call — may be intentional proper nouns**
- Ranks `ROOKIE`, `PROSPECT`, `REGULAR`, `STARTER`
- Cap styles `SODA`, `CROWN`, `SPRING`, `SPORT`, `RETRO`, `NEON`

Decide per string; whatever is left in English will be visible in the store.

---

## Open questions to settle before release day

- **Which 5 screens?** Today's set is home / campaign / play / pitches / caps. The
  new UI may justify a different order or a different five. Store order is the
  filename order in `devices.mjs`.
- **Do we need app preview videos?** Not automated. Separate decision.
- **Custom Product Pages for Apple Ads?** Up to 70, no app version required. Would
  let the India campaign show different creative from Brazil. Only worth it once
  the campaigns actually spend.
- **6.9" size discrepancy.** The 1.1 assets are 1290x2796 (a 6.7" size) while the
  6.9" slot is 1320x2868. Check ASC Media Manager to see which slot they sit in.

---

## Reminder

A recurring check-in is scheduled to raise this until the release ships. When the
new build is ready, say so in chat and Claude will run steps 3-6 and hand back the
full set for review.
