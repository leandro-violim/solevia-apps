# Store capture harness

Regenerates **every** store screenshot and marketing image from the running app,
at the exact pixel sizes each store demands, in all three locales.

Built 2026-09-06 ahead of the new-UI release so that shipping day is one command,
not a day of cropping.

## Run it

```bash
cd apps/cap-kickers
bun run dev                       # or serve dist/client — anything on a port

node tools/store-capture/capture.mjs --base http://localhost:8080
node tools/store-capture/verify.mjs
node tools/store-capture/ads.mjs   --base http://localhost:8080
```

Full run = 6 device sizes x 3 locales x 5 routes = **90 screenshots**. Narrow it
while iterating:

```bash
node capture.mjs --base http://localhost:8080 --only appstore
node capture.mjs --base http://localhost:8080 --devices iphone-6.9 --locales pt-BR
```

## Files

| File | Does |
|---|---|
| `devices.mjs` | The size matrix and route list. Edit here, nowhere else. |
| `capture.mjs` | Drives the app and shoots. Refuses to run if logical x dpr != target px. |
| `verify.mjs` | Reads PNG headers, checks every file against the matrix, flags >8MB. |
| `ads.mjs` + `ads-template.html` | Composes the Play feature graphic and Google Ads images. |
| `seed.json` | Optional save state. Absent = fresh profile = sparse-looking shops. |

## seed.json — do this before the real run

Without it the capture runs on an empty save, so the pitch and cap screens show
only the free items and the campaign shows everything locked. Generate one:

```bash
node capture.mjs --base http://localhost:8080 --dump-state
```

That opens a real browser. Play until the unlocks look good for a store
screenshot, press Enter, and it writes `seed.json` from live localStorage. Commit
it. Regenerate it whenever the save format changes — which the new UI may well do.

## What each store wants

Verified against vendor docs on 2026-09-06.

**App Store** — 1-10 shots per localization, no alpha channel.
`iphone-6.9` **1320x2868** is the one that matters: supply it and every smaller
iPhone scales from it. `ipad-13` **2064x2752** is required because the app runs on
iPad. We also shoot `iphone-6.5` (1284x2778) so nothing depends on Apple's scaler.

> The 1.1 assets on the store are **1290x2796**, which is the 6.7" size, not 6.9".
> Check ASC Media Manager to see which slot they actually occupy before assuming
> the old files were right.

**Google Play** — phone min 2 (min 4 at >=1080px to stay eligible for promotion),
tablets min 4 each, max 8 anywhere, 16:9 or 9:16, no alpha. Feature graphic
1024x500 required. Icon 512x512 PNG is a separate hand-made asset, not generated here.

**Google Ads (App campaign)** — images 1.91:1 `1200x628`, 1:1 `1200x1200`,
4:5 `1200x1500`; max 20 per ratio, <=5MB. Text: 5 headlines <=30 chars, 5
descriptions <=90. Video must live on YouTube, 10-60s, 16:9 / 9:16 / 1:1.

**Apple Ads** — **no image assets to make.** Search Results creative is generated
from the default App Store product page: *"A default ad is automatically created
using screenshots and app previews from your default App Store product page."*
Updating the App Store screenshots updates the ads. Custom Product Pages (up to 70,
no app version needed) are the only way to vary it per keyword.

## Known rough edges

- `ads-template.html` pulls Barlow Condensed from Google Fonts. If that host is
  blocked the wordmark falls back to Helvetica/Arial and looks wrong — check the
  output before shipping, or self-host the woff2 the app already bundles.
- The art in the template is a **placeholder** (`/hero/home-hero.jpg`). Pass
  `--art /hero/<new-key-art>.jpg` once the new graphics exist.
- Routes in `devices.mjs` assume today's route names. The new UI may rename them.

## Re-run notes (1.2, 2026-09-08)

- Output for 1.2 goes to `store-assets/screenshots-1.2/`. The 1.1 assets in
  `store-assets/screenshots/` use a different layout (`ios-*` prefixes, no locale
  subfolders) and were left untouched — don't merge the two.
- On a machine that pins its own Chromium (CI, sandbox), set `CHROMIUM_PATH` to the
  browser binary instead of running `npx playwright install`:

      CHROMIUM_PATH=/path/to/chrome node capture.mjs --base http://127.0.0.1:8100 \
        --devices iphone-6.9,ipad-13,phone

- `verify.mjs` takes the output dir as a **positional** argument, not `--out`:

      node verify.mjs ../../store-assets/screenshots-1.2

  Its "folders missing" lines for `iphone-6.5`, `tablet-7` and `tablet-10` are expected
  when you pass `--devices`; 6.9" and the 1080x1920 phone shot cover those slots by
  Apple's and Google's own scaling rules.
