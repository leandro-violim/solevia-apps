# Cap Kickers — Trophy Cabinet (rewards) + real audio

Hand-off spec for Claude Code. Written 2026-09-01.
Companion docs: `FIREBASE-SETUP.md` (analytics), `../../../store-assets/ANALYTICS-LATAM-DISCLOSURE-PLAN.md`.

---

## ⚠️ Read this before designing anything: keep it ads-and-play only

Cap Kickers currently declares **"In-app purchases: No"** to IARC, Play and Apple
(`store-assets/RELEASE-CHECKLIST.md` §1). A soft currency earned by *playing* and by
*watching rewarded ads* keeps that answer true and changes no store declaration.

The moment anyone adds **"buy 500 Caps for $0.99"** it triggers, all at once:
re-taking the IARC questionnaire, a new age rating on both stores, Play + Apple IAP
setup, and tax/banking paperwork. Do not slip a real-money purchase into this system
without that being a deliberate, separately-planned release.

Second rule: **nothing here gates the core loop.** Every pitch, cap and sound is
cosmetic. A player who never unlocks anything can still play every mode and finish
the campaign. Locked cosmetics motivate; locked gameplay churns.

---

## 1. The model

One screen — **the Cabinet** — holding every collectible in dim, visible, locked
niches. Showing players exactly what they do not have yet is the whole mechanism;
hiding it removes the reason to keep playing.

### Currency: **Caps**

| Event | Caps | Why |
|---|---|---|
| Win a campaign match | +10 | the main earn |
| Win vs AI (non-campaign) | +5 | keeps free play worth something |
| Win Pass & Play / finish Practice | +2 | deliberately low — two players on one device can farm this |
| First-time campaign level clear | +25 | one-off, rewards progress not grind |
| Campaign complete | +100 | the big one |
| First win of the day | +15 | the return hook |
| Watch a rewarded ad in the Cabinet | +20 | **this is the revenue lever** |

Cap the daily rewarded-ad earn at **5 per day (100 Caps)**. Uncapped, it stops being
a game and starts being a chore, and AdMob will throttle a user who watches 40 ads.

### Three ways to unlock — use all three

1. **Progress gate** — free, automatic, guaranteed. "Beat the Veteran to unlock the
   Night Pitch." Every player sees the system work at least twice before being asked
   for anything.
2. **Caps price** — the grind loop. Most items.
3. **Rewarded ad** — "Watch an ad to unlock *Torcida* for this session." Session-only
   unlocks are the highest-yield ad placement in casual games, because the player
   comes back for it tomorrow. A permanent unlock costs 3 watches.

Never make an item *only* purchasable by ad. At least one route must be pure play.

### Content buckets

| Bucket | Free today | New / locked |
|---|---|---|
| **Pitches** | grass, school, table, cement | **night stadium** (progress: beat Veteran) · **beach sand** (300 Caps) · **street court** (200 Caps) |
| **Caps** | existing procedural styles | **realistic metal set** — 6 colourways (150 Caps each or 1 rewarded watch for a day) · **gold legendary** (progress: complete the campaign — never buyable, it means something) |
| **Audio: Crowd** | synth placeholders | real whistle + 3 crowd reactions (250 Caps) |
| **Audio: Stadium** | — | `amb-crowd` murmur bed under matches (400 Caps) |
| *Audio: Commentary* | — | *deferred — see §3* |
| *Future* | — | ball trails, goal celebrations, keeper skins |

The audio buckets are the interesting part: **the synth engine already in
`src/lib/audio.ts` becomes the free baseline, and real recordings become the
reward.** Nobody is missing sound — they are missing *better* sound. That is a much
kinder progression than silence, and it costs nothing to ship.

### Cabinet screen behaviour

- Grid of square niches, 3 across on phone.
- **Unlocked:** the item, full colour, tappable to equip. Equipped shows a gold ring.
- **Locked, affordable:** dimmed item + Caps price + "Unlock" button.
- **Locked, unaffordable:** dimmed + price greyed + "Watch to unlock" if ads are ready.
- **Locked behind progress:** silhouette + the exact condition ("Beat the Veteran"),
  never a vague "Coming soon".
- Caps balance pinned top-right, and it should **animate up** when you arrive after a
  win. The count-up is the reward moment; a static number is not.
- Audio items get a **preview button** that plays 1.5 s at low volume. Do not make
  someone spend 400 Caps on a sound they have not heard.

---

## 2. Files to create

```
src/game/economy/currency.ts        # balance, earn(), spend(), daily-earn cap
src/game/economy/currency.test.ts
src/game/economy/catalog.ts         # every unlockable: id, type, cost, unlock rule
src/game/economy/catalog.test.ts
src/game/economy/inventory.ts       # owned ids + equipped ids, localStorage
src/game/economy/inventory.test.ts
src/routes/cabinet.tsx              # the Cabinet screen
src/lib/samples.ts                  # sample loading/playback (see §3)
```

Storage keys, matching the existing convention:
`capkickers.wallet.v1`, `capkickers.inventory.v1`, `capkickers.daily.v1`.
Follow the defensive load/merge pattern in `src/game/settings/storage.ts` —
injectable `StorageLike`, unknown values fall back to defaults, corrupt JSON never
throws. Every one of those modules already has a test file to copy the shape from.

**Time-of-day handling:** "first win of the day" must use the device's local date
string, and must tolerate the clock moving backwards (a player setting the date back
to farm the daily). Store the last-claim date and refuse a claim when the stored date
is in the future.

---

## 3. Real audio — files are already in the repo

**Five clips**, committed at **`public/audio/`**, cut from the source recordings and
already loudness-matched, de-clicked and encoded. Total **98 KB**.

Every one has had its **Pixabay source page opened and its licence confirmed** —
Pixabay Content License, commercial use allowed, no attribution required. Provenance
table: `public/audio/LICENCES.md`.

| File | Length | Use | Notes |
|---|---|---|---|
| `whistle.m4a` | 0.58 s | turnover / kickoff | single clean blast, isolated from a 7-blast take |
| `cheer-goal.m4a` | 2.08 s | goal scored | sharpest rising swell in the source (×3.0) |
| `cheer-win.m4a` | 2.91 s | match / campaign won | biggest roar (×3.4) |
| `cheer-near.m4a` | 1.92 s | shot saved, "So close!" | softer live crowd |
| `amb-crowd.m4a` | 8.00 s | **loop** — murmur bed under matches | seam verified within 0.3 dB; sits 6 dB under the one-shots |

Format: **AAC-LC mono, 32 kHz**, 56 kbps for one-shots, 40 kbps for the loop, `+faststart`.
Mono because none of this is positional; 32 kHz because crowd noise and a 2.6 kHz
whistle have nothing meaningful above ~14 kHz. The loop was built with a 1.2 s
equal-power crossfade of the following audio back over its head, so
`AudioBufferSourceNode.loop = true` is seamless with no scripting.

### What is deliberately NOT here

- **No commentary VO.** The owner decided on 2026-09-01: crowd only for now. The two
  English commentator clips are licence-clean and parked in `audio-parked/` — they can
  come back whenever, ideally alongside Portuguese and Spanish versions (§5).
- **Two files were rejected on rights**, not on taste: a Brazilian *torcida organizada*
  chant (the Pixabay licence forbids commercial use of content carrying recognisable
  brands, and nobody has confirmed by ear that no club is named), and a stadium
  ambience whose filename claimed a Pixabay ID that belongs to a different sound
  entirely. Both are documented in `audio-parked/README.md`. **Do not move them back.**
- `flick` and `clack` **stay synthesised, permanently** — they fire dozens of times per
  turn and the synth version is 0 bytes.

### How to wire it — extend, don't replace

`src/lib/audio.ts` synthesises everything today. Add a **sample layer in front of the
synth**, so the synth stays the fallback:

```ts
// src/lib/samples.ts
const cache = new Map<string, AudioBuffer>();   // decode ONCE, keep the buffer
export async function loadSample(ctx: AudioContext, id: string): Promise<AudioBuffer | null>
export function playSample(ctx, out: GainNode, buf: AudioBuffer, gain = 1): void
```

Then in `GameAudio.sfx(name)`:

```
if (samples.has(name) && packUnlocked(name)) playSample(...)
else synth(ctx, sfxGain, name);           // unchanged fallback
```

Add a third gain node beside `sfxGain` / `musicGain`:

```ts
private ambienceGain: GainNode | null = null;   // ~0.18, its own Settings toggle
```

Ambience is one `AudioBufferSourceNode` with `loop = true`, started on
`enterGame()` and stopped on `enterMenu()`. Never start a second one — check the
existing handle first, exactly like `startMusic()` does.

### Efficiency rules — these are the point of the exercise

**App size**
- The whole set is 98 KB. Do not add uncompressed WAV, and do not raise the
  bitrate — at 32 kHz mono, 56 kbps AAC is already transparent for crowd noise.
- OGG/Vorbis versions exist if a WebView ever refuses AAC in `decodeAudioData`. They
  are deliberately **not** committed — shipping both formats would double the payload
  for a problem that probably does not exist. Ask for them only if device testing
  actually fails.

**Battery and CPU**
- **Decode once.** `decodeAudioData` is the expensive call; the resulting `AudioBuffer`
  is cheap to replay. Cache by id and never decode the same file twice.
- **Lazy-load.** Fetch a pack's files when it is unlocked *and* sound is on — not at
  app start. Cold start must not pay for audio the player has not earned.
- **Only one ambience buffer resident.** A decoded 8 s buffer at the context's rate is
  ~1.5 MB of Float32. One is all that is needed today; if more ambience packs are added
  later, drop the previous buffer when the player switches.
- **Never `new Audio()` per sound.** Each HTMLAudioElement spawns its own decoder and
  is the single biggest battery mistake available here. WebAudio buffers only.
- **Stop the ambience when backgrounded.** `audio.ts` already listens for
  `visibilitychange` for the #13 suspend/resume fix — hook the ambience source into
  the same handler so a phone in a pocket is not decoding a stadium.
- **Cap concurrent one-shots.** A goal firing `cheer-goal` + `whistle` over the
  `amb-crowd` bed is fine; more than ~6 overlapping voices is not. Track and drop.

### Licensing — already settled

All five shipped clips were verified against their Pixabay source pages on 2026-09-01;
see `public/audio/LICENCES.md`. Nothing is outstanding.

**The rule for anything added later: open the source page and confirm the licence
before the file goes into `public/`.** A filename is not a licence — one file was
rejected precisely because its filename claimed a Pixabay ID belonging to a different
sound. When a source cannot be verified in about two minutes, regenerate the sound
with Higgsfield (§5) instead; generated audio carries no third-party rights at all.

## 4. Analytics for the reward loop

The point of the Cabinet is more session time and more rewarded-ad views. Measure it.
Add to `EventName` in `src/lib/analytics.ts` (the vocabulary is closed by design —
`send()` will not accept a name that is not in the union):

| Event | Params | Answers |
|---|---|---|
| `cabinet_opened` | `{ from }` | do players find it at all? |
| `locked_item_tapped` | `{ item_id, item_type, affordable }` | **the intent signal** — what people want but cannot afford |
| `item_unlocked` | `{ item_id, item_type, method }` | `method`: `progress` \| `coins` \| `rewarded` |
| `item_equipped` | `{ item_id, item_type }` | which cosmetics actually get used |
| `currency_earned` | `{ source, amount }` | where Caps come from |
| `currency_spent` | `{ item_id, amount }` | where they go |
| `audio_previewed` | `{ pack_id }` | does preview convert to unlock? |
| `rewarded_unlock_offered` / `_taken` | `{ item_id }` | the ad funnel inside the Cabinet |

Keep every param an enum, id or number — never free text. And **do not add
`setUserId`**: it would flip every Play and Apple row from "not linked to you" to
"linked", which is a full store re-declaration (`ANALYTICS-LATAM-DISCLOSURE-PLAN.md` §5b).

The number to watch after launch: **`locked_item_tapped` → `item_unlocked` conversion,
split by `method`.** If `rewarded` dominates, the Caps prices are too high. If nothing
converts, the items are not desirable and the answer is better art, not cheaper prices.

---

## 5. Art and audio production

**Art direction, not assets.** The game renders everything procedurally
(`src/game/render/draw.ts`). Generated images are reference for the palette and
shading values in `pitches/styles.ts` and `caps/styles.ts` — translate them by hand
rather than shipping textures, or the app grows by megabytes and the flat arcade look
breaks. Ten Higgsfield reference images exist so far (night pitch, beach sand, street
court, a six-cap realistic set, a gold legendary cap, and a cabinet mock-up).

If a texture genuinely must ship, it goes in as a **≤256×256 WebP tile** drawn with
`ctx.createPattern`, not a full-resolution PNG.

**Licence-clean audio is available in-house.** Higgsfield (already connected) has:

| Model | Use |
|---|---|
| `mirelo_text_to_audio` | text→sound-effect with a duration parameter — whistle, crowd swells, cap clacks |
| `sonilo_music` | text→music with a duration parameter — replace the synthesised menu loop |
| `text2speech_v2` (ElevenLabs engine) | commentator VO |
| `inworld_text_to_speech` | has **Heitor / Maitê (pt)** and **Diego / Lupita / Miguel / Rafael (es)** — localized commentary for Brazil and the LatAm launch |

That last row is the one worth acting on: English-only commentary in a game whose two
biggest markets are Brazil and Spanish-speaking Latin America is a missed opportunity,
and it is the same pipeline that solves the licensing question.

---

## 6. Build order

1. `currency.ts` + `inventory.ts` + `catalog.ts` with tests — pure logic, no UI.
2. `samples.ts` + the `GameAudio` sample layer, wired to the **Crowd** pack only.
   Ship this alone if you want a quick win; the real whistle and three crowd reactions
   are the single biggest perceived-quality jump available, for 58 KB.
3. `cabinet.tsx` with progress-gated unlocks only (no currency yet). Proves the screen.
4. Turn on Caps: earning, prices, the count-up animation.
5. Rewarded-ad unlocks, reusing `rewardedAvailable()` / `showRewarded()` from `ads.ts`.
6. Ambience loops + their own Settings toggle.
7. The analytics events from §4, verified in DebugView before release.

Steps 1–3 change no store declaration. Step 5 changes none either, as long as no
real-money purchase appears. Step 6 adds a Settings row — update the three locale
tables in `i18n.ts` together, or `i18n.test.ts` will fail the build on key parity.
