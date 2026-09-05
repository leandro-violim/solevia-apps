# Cap Kickers — foley & ambience provenance

All 9 files here were **generated with ElevenLabs Sound Effects** on
2026-09-05 from the account's own credits. No third-party recording is
involved, so there is no attribution requirement and none of the
trademark / recognisable-brand problems that got the old Pixabay
`amb-chant.m4a` and `amb-stadium.m4a` parked (see `audio-parked/README.md`).

Check ElevenLabs' current terms before release — output rights on paid
plans are the customer's, but that is worth re-confirming rather than
taking from this note.

## Files

| File | Prompt | Take |
|---|---|---|
| `flick-1.m4a` | single metal bottle cap flicked hard, sliding across a smooth wooden table, dry metallic scrape along the wood grain | wood a |
| `flick-2.m4a` | same | wood b |
| `flick-3.m4a` | single metal bottle cap flicked hard, sliding across rough concrete pavement, gritty metallic scrape and rasp | cement b |
| `flick-4.m4a` | same | cement c |
| `clack-1.m4a` | two metal bottle caps colliding on a wooden table, dry metallic tick with a faint woody knock | wood a |
| `clack-2.m4a` | two metal bottle caps colliding on concrete, sharp bright metallic clack with a hard stone edge | cement a |
| `clack-3.m4a` | same | cement d |
| `amb-stadium.m4a` | distant football stadium crowd, steady murmur, no individual voices, no chanting, no announcer | take d |
| `amb-chant.m4a` | football crowd chanting, rhythmic wordless ole-style oohs and claps, no words, no announcer | take b |

Both beds were generated with ElevenLabs' **Looping** mode at 12 s, so the
tail already blends into the head — no cross-fade fold was applied. Measured
after AAC encoding, the wrap-point roughness sits at the **5.6th percentile**
(stadium) and **6.0th** (chant) of the interior frame distribution, i.e. the
seam is smoother than 94% of ordinary frames in the file. Do not re-trim them;
cutting to 10 s would destroy the loop.

## Processing

One-shots — trimmed around the event, 70 Hz highpass, 4 ms fade-in, fade-out
over the tail, **peak-normalised to −3 dBFS**, mono / 44.1 kHz / AAC 96k.

Peak, not `loudnorm`: LUFS gating is unreliable below about a second (the
0.17 s clacks measure as `-inf` and a first pass left a 25 dB spread across the
four flicks). All 9 now sit within 0.6 dB peak of each other.

Beds — constant `volume` gain to about −21 LUFS, deliberately *not* dynamic
`loudnorm`, which applies time-varying gain and would break the loop seam.

The flicks are **0.62 s**, longer than the 0.3–0.5 s in `FOLEY-SPEC.md`. The
generated gesture genuinely runs that long and cutting to 0.45 s removes either
the run-in or the settle. Shorten if they feel sluggish in play.

## alts/

The other 15 takes, same processing and levels — 4 per prompt. The 9 above were
picked for spectral spread (centroid, 85% rolloff, attack, decay) so four flicks
in a row don't read as one repeated event; swap freely.
