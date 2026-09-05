# Cap Kickers — Audio Expansion Brief (for Cowork / Higgsfield)

Goal: richer, non-repetitive match audio, delivered as **multiple variants per event**
so no two kicks / goals / matches sound identical. New sound is earned as **phase
rewards** (except the cap-movement foley — see note). All assets must be **rights-clean
/ generated** (no third-party recordings), because two earlier files were rejected on
rights (see `audio-parked/README.md`).

## Delivery spec (applies to EVERY file)
- **Format:** `.m4a` (AAC) preferred — or `.wav`, Cowork converts. **Mono.** 32–44.1 kHz.
- **No music beds, no reverb tails on one-shots** (dry, close-mic foley) unless noted.
- **Ambience loops must be SEAMLESS** (no click/gap at the loop point).
- **Keep files short** (durations noted) — everything is inlined into the app bundle.
- **Drop delivered files in:** `apps/cap-kickers/store-assets/audio-incoming/`
  using the EXACT filenames below (so Claude Code can wire them with no renaming).
- The game decodes bundled bytes (no runtime fetch — iOS WKWebView can't fetch local
  files), so variant count drives bundle size. The counts below are the target.

---

## 1) Cap-movement foley  (metallic bottle-cap slide/knock)  — 7 files
Replaces the synthetic "flick"/"clack". A bottle cap is the ball, flicked across a
hard pitch. **DECIDED: FREE, not a reward** (owner, this session) — it's core game
feel; every player gets it from the start, and each kick/collision picks a random
variant so the flicking never sounds repetitive.

**Prompt (Higgsfield text-to-audio) — cap SLIDE, generate 4 takes:**
> Foley: a single small metal bottle-cap being flicked and skidding across a smooth
> hard surface — a quick dry metallic scrape/friction "shhkt" as the cap slides over
> wood, then settles. Close-mic, dry, no reverb, no music. Mono, ~0.3–0.5 seconds.
> Give 4 subtly different takes (vary the length and speed a little).

Filenames: `flick-1.m4a`, `flick-2.m4a`, `flick-3.m4a`, `flick-4.m4a`

**Prompt (Higgsfield text-to-audio) — cap-on-cap KNOCK, generate 3 takes:**
> Foley: two small metal bottle-caps lightly knocking together — a short, dry, bright
> "tik/clack" metallic collision. Close-mic, no reverb, no music. Mono, ~0.12–0.2 s.
> Give 3 subtly different takes.

Filenames: `clack-1.m4a`, `clack-2.m4a`, `clack-3.m4a`

---

## 2) Ambience loops  (rights-clean replacements)  — 2 files
Both must be **generated** (the previous stadium/chant recordings were rejected on
rights) and **seamless loops**.

**Prompt (Higgsfield text-to-audio) — STADIUM bed:**
> Generic large football-stadium crowd ambience — a steady, even murmur of a big
> crowd, distant and continuous, NO chanting, NO announcer, NO music, NO recognizable
> words or club names. Calm background bed. Seamless loop. Mono, ~12 seconds.

Filename: `amb-stadium.m4a`

**Prompt (Higgsfield text-to-audio) — generic CHANT bed:**
> An upbeat, GENERIC football-terrace chant — a wordless rhythmic crowd "hey… hey…
> hey" / "ohh-ohh-ohh" with light claps and a drum pulse. Absolutely NO club names,
> NO real team, NO recognizable lyrics, brands or trademarks. Festive but generic.
> Seamless loop. Mono, ~10 seconds.

Filename: `amb-chant.m4a`

---

## 3) Commentary voice-over  (EN / PT-BR / ES)  — 21 files
Short, energetic football-commentator lines. Use a **voice-generation tool** (or
Higgsfield if it does speech). One clean commentator voice per language is fine (can be
the same performer style across languages, or a native voice each — native preferred).

**Voice direction:** excited but clear sports commentator, slight stadium energy (a
touch of room is OK, no heavy reverb), lines land in **~1–2 seconds**, mono. No player
names, no team names. Deliver each line as its own file.

### English (`vo-en-…`)
- Goal (3): `vo-en-goal-1` = "Goal!" · `vo-en-goal-2` = "What a strike!" · `vo-en-goal-3` = "It's in!"
- Win (2): `vo-en-win-1` = "Incredible — what a finish!" · `vo-en-win-2` = "That's the match!"
- Near-miss (2): `vo-en-near-1` = "Ohh, so close!" · `vo-en-near-2` = "Inches away!"

### Portuguese – Brazil (`vo-pt-…`)
- Goal (3): `vo-pt-goal-1` = "Gol!" · `vo-pt-goal-2` = "Que golaço!" · `vo-pt-goal-3` = "Pra dentro!"
- Win (2): `vo-pt-win-1` = "Inacreditável — que finalização!" · `vo-pt-win-2` = "Acabou, que jogo!"
- Near-miss (2): `vo-pt-near-1` = "Ihhh, quase!" · `vo-pt-near-2` = "Passou raspando!"

### Spanish – Latin America (`vo-es-…`)
- Goal (3): `vo-es-goal-1` = "¡Gol!" · `vo-es-goal-2` = "¡Qué golazo!" · `vo-es-goal-3` = "¡Adentro!"
- Win (2): `vo-es-win-1` = "¡Increíble, qué definición!" · `vo-es-win-2` = "¡Se acabó, qué partido!"
- Near-miss (2): `vo-es-near-1` = "¡Uy, por poco!" · `vo-es-near-2` = "¡Rozó el palo!"

Filenames end in `.m4a` (e.g. `vo-en-goal-1.m4a`).

---

## How Claude Code will wire it (after assets land)
- **Variety picker:** each event (flick, clack, goal cheer, goal VO, win, near-miss)
  picks a RANDOM variant, never repeating the immediately-previous one — so kicks and
  matches stop sounding identical. Ambience beds can subtly cross-vary too.
- **Right moment:** VO fires on the discrete match beats (goal / win / near-miss),
  layered over the crowd cheer like a real broadcast. Cap foley fires per flick/collision.
- **Localized VO:** the app plays the pack for the player's current language (EN/PT/ES),
  loaded per-locale so only the active language's clips ship in that session's memory.
- **Rewards (proposed mapping — final at integration):**
  - Crowd pack → phase 4 *(already)*
  - Commentary pack → ~phase 7
  - Stadium + chant ambience → phase 10 *(already the stadium slot; adds the chant)*
  - Cap-movement foley → **free baseline** (recommended) unless you want it gated.
