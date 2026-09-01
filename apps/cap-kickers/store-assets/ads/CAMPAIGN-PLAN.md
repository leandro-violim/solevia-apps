# Cap Kickers — Google Ads App campaigns (Android)

Prepared 2026-09-01 · Google Ads account **625-425-0746 "Solve Via Entertainment"**
App: `app.solevia.capkickers` · live on Google Play, AdMob linked, ad serving enabled.

---

## What the Zen Bubbles campaigns already tell us

You've run this play before. Last 7 days, same account:

| Campaign | Budget | Spend | Installs | **Cost per install** | Status |
|---|---|---|---|---|---|
| Pop Zen **India** — Installs | $10/day | $19.68 | 235 | **$0.084** | Paused · was *limited by budget* |
| Pop Zen **Brazil** — Installs | $10/day | $1.15 | 15 | **$0.077** | Paused |
| Pop Zen Android — Installs | $10/day | $0.82 | 1 | — | Learning |

Account average CPC **$0.01**. India delivered 27,726 unique users against Brazil's 399 — India
had far more inventory available at that budget, and Google flagged it *limited by budget*, meaning
it would have spent more if allowed.

**So the plan below is not a guess.** Same account, same country pair, same $10/day, a comparable
free casual game. Expect Cap Kickers to land in the same $0.05–0.15 range.

## The honest arithmetic before you spend

At $0.08 per install you are buying installs cheaply, but you are monetising with banner and
interstitial ads. In India, casual-game ad eCPM typically runs ~$1–3 per thousand impressions; in
Brazil somewhat higher. A player who opens the app twice and leaves generates on the order of
**$0.01–0.05** in lifetime ad revenue.

That means at these prices **these campaigns most likely cost more than they return**, and that is
fine if you know why you're running them:

- **Seeding installs** so Play's ranking algorithm has data to work with
- **Learning** which creative and which market responds, cheaply
- **Testing the ad stack on real devices** — you still have never seen the app run on Android hardware

What it is *not* is a profitable acquisition channel at this stage. Revisit that once you have
retention numbers and can compute an actual per-user value. I'm laying out the numbers, not telling
you whether to spend — that call is yours.

---

## Campaign 1 — Brazil

| Setting | Value |
|---|---|
| Name | `Cap Kickers Brazil — Installs` |
| Type | App campaign → App installs → Android |
| App | Cap Kickers (`app.solevia.capkickers`) |
| Locations | Brazil |
| Languages | Portuguese |
| Budget | **$8.00/day** |
| Bidding | Maximise installs (no target CPI at first — let it find the floor) |
| Creative | pt-BR text + `ck-pt-*` images + `capkickers-pt-*` videos |

Brazil is the home-advantage market: the app's Play listing, its on-device name and all the creative
are in Portuguese, and "futebol de tampinha" is a childhood memory rather than a description. Lower
volume than India, but the intent is better.

## Campaign 2 — India

| Setting | Value |
|---|---|
| Name | `Cap Kickers India — Installs` |
| Type | App campaign → App installs → Android |
| App | Cap Kickers (`app.solevia.capkickers`) |
| Locations | India |
| Languages | English |
| Budget | **$7.00/day** |
| Bidding | Maximise installs |
| Creative | EN text + `ck-en-*` images + `capkickers-en-*` videos |

India is the volume market — the Zen data shows it will absorb everything you give it. Football is a
strong regional sport (Kerala, West Bengal, Goa, the Northeast) even though cricket dominates
nationally, and the game needs no reading and no network.

**Total: $15/day ≈ $450/month if left running.** Set a calendar reminder to review in 14 days.

---

## Ad copy

### Brazil (pt-BR)

**Headlines** — limit 30 characters

| # | Text | Chars |
|---|---|---|
| 1 | Peteleco, drible e gol | 22 |
| 2 | Futebol de Tampinha | 19 |
| 3 | Sem mira. Só no jeito. | 22 |
| 4 | Grátis e joga offline | 21 |
| 5 | Vença o goleiro e a taça | 24 |

**Descriptions** — limit 90 characters

| # | Text | Chars |
|---|---|---|
| 1 | Dê um peteleco na tampinha: quanto mais forte, mais longe ela vai. Faça o gol. | 78 |
| 2 | Cinco toques por vez. Passe pelo vão para manter a posse e chute no quinto. | 75 |
| 3 | Campanha contra a IA, Passa e Joga com um amigo ou Treino. Grátis e offline. | 76 |
| 4 | Desbloqueie campos e estilos de tampinha. Sem conta, sem cadastro. É só jogar. | 78 |
| 5 | Partidas rápidas para o intervalo. O futebol de mesa da escola no seu bolso. | 76 |

### India (English)

**Headlines** — limit 30 characters

| # | Text | Chars |
|---|---|---|
| 1 | Flick. Score. Repeat. | 21 |
| 2 | Bottle-Cap Finger Soccer | 24 |
| 3 | No Aim Lines. Just Feel. | 24 |
| 4 | Free Offline Soccer Game | 24 |
| 5 | Beat the Keeper. Win Cup. | 25 |

**Descriptions** — limit 90 characters

| # | Text | Chars |
|---|---|---|
| 1 | Flick a cap with your finger. Harder flick, farther it flies. Thread the gap, score. | 84 |
| 2 | Five touches a turn. Thread the gap to keep the ball, then fire past the keeper. | 80 |
| 3 | Campaign vs AI, Pass and Play with a friend, or Practice. Free and works offline. | 81 |
| 4 | Unlock pitches and cap styles. No account, no sign-up. Just flick and play. | 75 |
| 5 | Quick matches you can finish on a break. Tabletop soccer in your pocket. | 72 |

Every line is inside Google's limit — checked programmatically, not by eye. Nothing claims the game
is ad-free (it isn't), promises a ranking, or invents a feature the app doesn't have.

---

## Creative assets

Built from the existing Play screenshots — no new artwork commissioned, and no gameplay footage was
faked. Everything shown is a real screen from the shipped build.

### Videos — `ads/video/` · 20.4 s · H.264 · MP4

| File | Size | Use |
|---|---|---|
| `capkickers-en-9x16.mp4` | 1080×1920 | Portrait — the dominant mobile placement |
| `capkickers-en-16x9.mp4` | 1920×1080 | Landscape — YouTube in-stream |
| `capkickers-en-1x1.mp4` | 1080×1080 | Square — feed placements |
| `capkickers-pt-9x16.mp4` | 1080×1920 | ditto, Portuguese |
| `capkickers-pt-16x9.mp4` | 1920×1080 | |
| `capkickers-pt-1x1.mp4` | 1080×1080 | |

Structure: title card → "no aim lines" → threading the gap → the campaign ladder → pitches → caps →
end card with icon, wordmark and a FREE · OFFLINE · NO SIGN-UP badge. Portrait is full-bleed
screenshot with a caption pill; landscape and square place the phone on a dark green brand
background with the caption alongside.

> **These must be uploaded to YouTube before Google Ads will accept them.** App campaigns take video
> as a YouTube URL, not a file. Unlisted is fine.

### Images — `ads/image/` · JPG

Two message variants (A: "Flick. Score. Repeat." · B: "Beat every rival") in three required ratios:

| Ratio | Pixels | Files |
|---|---|---|
| 1.91:1 landscape | 1200×628 | `ck-{en,pt}-{a,b}-16x9.jpg` |
| 1:1 square | 1200×1200 | `ck-{en,pt}-{a,b}-1x1.jpg` |
| 4:5 portrait | 1200×1500 | `ck-{en,pt}-{a,b}-4x5.jpg` |

12 files total. Each carries the app icon, wordmark, headline, one supporting line and a green CTA.

---

## What to watch, and when

**Day 3** — ignore everything. App campaigns spend erratically while the bid strategy learns.

**Day 7** — first real read:

- *Cost per install* — under $0.15 is healthy for these markets
- *Which creative Google is actually serving* (Assets tab → look at "Performance" ratings: Low / Good / Best). Drop the Lows, make more like the Bests.
- If Brazil is starved of impressions, that's normal — it's a smaller market. Don't panic and move budget to India just because India spends faster.

**Day 14** — decide. Either the installs are showing up in Play Console with reasonable day-1
retention, or they aren't. If retention is poor, the problem is the game or the market fit, not the
ads, and more budget won't fix it.

**Also worth doing once installs land:** open Play Console → Pre-launch report and → Android vitals.
Real users on real Android hardware is the testing that has never happened on this app.

---

## LAUNCHED — 2026-09-01

Both campaigns are live and spending. Google Ads account **625-425-0746**.

| Campaign | ID | Budget | Locations | Language | Status |
|---|---|---|---|---|---|
| Cap Kickers Brazil — Installs | `24203160719` | $8.00/day | Brazil | Portuguese | Enabled · Eligible (Learning) |
| Cap Kickers India — Installs | `24197362737` | $7.00/day | India | English | Enabled · Eligible (Learning) |

Ad group IDs: Brazil `205488661891` · India `200393378312`.
Bidding: Install volume, **Maximise conversions**, no target CPI (letting it find the floor).
Each ad group carries 5 headlines, 5 descriptions, 6 images and 3 videos → **Ad strength: Average**.

### YouTube video IDs (unlisted, channel "Leandro Violim")

| File | YouTube ID | Ratio | Used in |
|---|---|---|---|
| `capkickers-en-9x16.mp4` | `gf7sOuUDsa8` | 9:16 | India |
| `capkickers-en-16x9.mp4` | `qIoEBtMEzPw` | 16:9 | India |
| `capkickers-en-1x1.mp4` | `LbjzWPxrKtI` | 1:1 | India |
| `capkickers-pt-9x16.mp4` | `YMYzkUoXw7I` | 9:16 | Brazil |
| `capkickers-pt-16x9.mp4` | `qzl_Sa2gDtw` | 16:9 | Brazil |
| `capkickers-pt-1x1.mp4` | `hHe4laTrb6E` | 1:1 | Brazil |

All six are **Unlisted**, declared **not made for kids**. The 9:16 and 1:1 ones land under YouTube
Studio's **Shorts** tab, not Videos — that's normal and doesn't affect their use as ad assets.

### Gotchas found doing this

- **Google Ads only takes video as a YouTube URL.** There is no file upload in the App campaign
  asset picker. Upload to YouTube first, then paste the watch URL under *Videos ▸ Search YouTube*.
- **Freshly uploaded videos do not appear in the Asset library tab** for a while. Paste the full
  watch URL into *Search YouTube* instead — it resolves immediately, even for unlisted videos.
- **Bulk "Edit ▸ Visibility" does not work on drafts.** It reports "0 of 4 videos successfully
  updated". Each draft has to go through its own publish wizard (set Audience → jump to the
  Visibility step in the stepper → Unlisted → Save).
- **Multi-file YouTube upload skips the details wizard** and leaves everything as a private draft.
- To reach an App campaign's creative: Campaign ▸ Ad groups ▸ (ad group) ▸ **Ad assets** ▸ the blue
  pencil. The campaign-level *Assets* page is for extensions only and will look empty.

### Review in 7 days (2026-09-08)

Check cost per install against the Zen benchmark ($0.077 BR / $0.084 IN) and open **Ad assets ▸
Performance** to see which creative Google rates Low / Good / Best. Drop the Lows, make more Bests.
