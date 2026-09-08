# Audio provenance — Cap Kickers

## Pixabay recordings (crowd one-shots)
Verified 2026-09-01 against their source pages. **Pixabay Content License**:
commercial use permitted, **no attribution required**, may not be redistributed standalone.

| File | Pixabay ID | Original title | Author | Verified |
|---|---|---|---|---|
| `whistle.m4a` | 6121 | metal whistle | strongbot (via freesound_community) | ✅ page confirmed |
| `cheer-goal.m4a` | 379666 | Crowd Cheering | u_xg7ssi08yr | ✅ page confirmed |
| `cheer-win.m4a` | 72194 | Crazy Soccer Crowd Cheering | Kinoton (via freesound_community) | ✅ page confirmed |
| `cheer-near.m4a` | 563439 | LIVE Football Match – Stadium Crowd Cheering | arunangshubanerjee | ✅ page confirmed |

Attribution is not required, but crediting is welcome — if an "Audio credits" line is
ever added to the About screen, list these authors.

## Generated audio (no third-party recording)
- **Cap foley** (`flick-1..4`, `clack-1..3`) and **ambience beds** (`amb-stadium`,
  `amb-chant`) — generated with ElevenLabs **Sound Effects**; no third-party recording,
  no trademark exposure. Prompts, takes and measurements: `AMBIENCE-PROVENANCE.md`.
  These replaced the interim `amb-crowd.m4a` (a cut of the Pixabay 72194 recording, now
  retired) and clear the rights problem that parked the earlier chant/stadium files.

  ✅ **Output rights confirmed 2026-09-08.** Three documents, read in full:
  - *Sound Effects Terms* (elevenlabs.io/sound-effects-terms, last updated 12 Feb 2026)
    contain exactly two substantive clauses — a definition, and a sublicensing opt-out.
    **No media-rights table, no film/TV/radio carve-out, and no "Studio Games"
    exclusion.** They supplement the general Terms rather than restricting them.
  - *Terms of Service*: "you retain all rights in and to your Output", and "if you
    access or use our Services through a paid subscription plan … you may use the
    Services for commercial purposes." Sole Via is on a paid (Starter) plan. Nothing
    in the ToS restricts games, apps or software.
  - The "Studio Games" exclusion that disqualified the old menu theme lives in the
    *Eleven Music Model-Specific Terms*, which by their own scope apply only to "an
    ElevenLabs foundational or other artificial intelligence music models (each, a
    'Music Model')". It does not reach Sound Effects output.

  ℹ️ Note the sublicensing default: our SFX outputs may be made available to other
  ElevenLabs users unless we opt out via "Disable" on the Sound Effects product page.
  Harmless for our licence to use them, but it means the foley is **not exclusive**.
- **Commentary VO** (`vo-*`) — generated (ElevenLabs / Qwen); see the delivery notes.

## Menu theme
`menu-theme.m4a` — **"Brazil Football Carnival Samba Music"** by STAROSTIN
(composer Viacheslav Starostin, BMI IPI 01310018719), from Pixabay.

| | |
|---|---|
| Source page | https://pixabay.com/music/samba-latin-brazil-football-carnival-samba-music-260573/ |
| Pixabay ID | 260573 |
| Licence | **Pixabay Content License** — commercial use permitted, no attribution required, no standalone redistribution |
| Page wording | "Free for use." |
| Uploaded | 2024-11-07 · 107,470 downloads at time of use |
| Downloaded | 2026-09-08 |
| Original file | `../../store-assets/audio-source/starostin-brazil-football-carnival-samba-music-260573.mp3` (kept untouched, sha256 `3bcc8289…`) |

Processing applied here: 60.47 s loop cut from 6.700 s–67.172 s of the original
(32 bars at ~127 BPM), sample-aligned by cross-correlation (r = 0.999), 60 ms
equal-power crossfade at the seam, constant gain −1.86 dB, encoded AAC 96 kbps /
44.1 kHz / stereo. Result: −12.44 LUFS, −0.49 dBTP — within 0.12 LU of the track it
replaced, so menu volume is unchanged.

⚠️ **Content ID registered.** Irrelevant inside the app, but do **not** score a
YouTube ad creative with this track without checking first — it can trigger a claim
on our own ad.

**Replaced** the previous menu theme, "Arena of Glory" (ElevenLabs Music Marketplace),
which is parked unshipped at `../../store-assets/audio-hold/` — see the README there
for why it could not ship.

Earlier rejected/deferred candidates: see `../../audio-parked/README.md`.

**Rule for anything added here later:** open the source page and confirm the licence
before the file lands in `public/`. A filename is not a licence. `amb-stadium.m4a` was
rejected precisely because its filename claimed a Pixabay ID that turns out to belong
to a completely different sound.
