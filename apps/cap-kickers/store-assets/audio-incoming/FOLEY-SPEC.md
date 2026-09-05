# Cap Kickers — foley & ambience spec

> **RESOLVED 2026-09-05.** All 9 files were generated with ElevenLabs Sound
> Effects and are in this folder. See `PROVENANCE.md` for prompts, takes,
> processing and loop-seam measurements. The sourcing notes below are kept
> for reference if these ever need regenerating.

Target for every file: **mono, 44.1 kHz, AAC .m4a**, dropped in this folder.
Match the VO chain already used here:

```
ffmpeg -i in.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ac 1 -ar 44100 -c:a aac -b:a 96k out.m4a
```

---

## 1. Cap slide — `flick-1.m4a` … `flick-4.m4a`

A single small metal bottle cap flicked and skidding across a smooth hard
surface: a quick dry metallic scrape/friction "shhkt" as it slides over wood,
then settles. Close-mic, dry, **no reverb, no music**.

- Duration **0.3–0.5 s** each
- 4 takes, subtly different — vary length and speed a little
- Vary these, not just gain: skid length, cap angle, how hard it settles.
  Four pitch-shifts of one take will read as obviously repeated in play.

## 2. Cap knock — `clack-1.m4a` … `clack-3.m4a`

Two small metal bottle caps knocking together lightly: short, dry, bright
"tik/clack" metallic collision. Close-mic, **no reverb, no music**.

- Duration **0.12–0.2 s** each
- 3 takes, subtly different
- Keep the transient intact — do not let a limiter soften the attack; the
  click is the whole sound.

## 3. Stadium bed — `amb-stadium.m4a`

Generic large football-stadium crowd: a steady, even murmur of a big crowd,
distant and continuous. **No chanting, no announcer, no music, no recognisable
words or club names.** Calm background bed.

- Duration **~12 s**, seamless loop
- Loop it by cross-fading the tail over the head (see note below)

## 4. Generic chant — `amb-chant.m4a`

Upbeat generic terrace chant: wordless rhythmic crowd "hey… hey… hey" /
"ohh-ohh-ohh", light claps, drum pulse. **No club names, no real team, no
recognisable lyrics, brands or trademarks.** Festive but generic.

- Duration **~10 s**, seamless loop
- Cut the loop on the **beat grid**, not at an arbitrary 10.0 s, or the pulse
  will stutter at the seam

---

## Making the two ambience beds loop cleanly

Same overlap-blend used for the pitch textures, in one dimension. Render ~2 s
longer than target, then fold the tail back over the head with a cosine
cross-fade so the end continues into the start by construction:

```
ffmpeg -i amb.wav -filter_complex \
 "[0]atrim=0:12,asetpts=N/SR/TB[a]; \
  [0]atrim=12:14,asetpts=N/SR/TB,afade=t=out:st=0:d=2[b]; \
  [a][b]amix=inputs=2:duration=first:dropout_transition=0" \
 -ac 1 -ar 44100 loop.wav
```

Verify by playing it twice back-to-back (`-stream_loop 1`) and listening at the
join. A click there means the fade was too short or landed off the beat.

## Where to source

- **Record it yourself** — flick and clack are genuinely trivial. Two real
  bottle caps, a wooden desk, a phone in a quiet room 15–20 cm away. That will
  beat anything synthesised, and it is the actual object the game is about.
  Send me the raw takes and I'll trim, normalise and name the 7 files.
- **ElevenLabs SFX** (text-to-sound-effects) — the four prompt blocks above are
  written to paste in directly.
- **Freesound.org** — filter to CC0 for the crowd beds. Check the licence on
  each file; CC-BY needs attribution in your credits screen.
- Crowd beds specifically: avoid anything recorded at a real identifiable
  match. Stadium recordings often carry audible club chants that are exactly
  the trademark risk the brief is trying to dodge.
