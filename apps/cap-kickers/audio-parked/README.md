# Parked audio — NOT bundled, do not move back without reading this

Nothing in this folder ships. `public/` is the only folder Vite copies into the
mobile build, so these files are inert here. Kept rather than deleted so the
decisions below are reversible.

## Deferred by the owner (rights are fine)

| File | Source | Why parked |
|---|---|---|
| `vo-shot.m4a` | Pixabay 534994 — "Football Commentator with FX What an amazing shot", JonathanSlatterMusic | Owner decided 2026-09-01: no commentary for now, crowd only. **Licence verified clean** — bring these back any time. |
| `vo-incredible.m4a` | Pixabay 546898 — "Football Commentator with FX That is nothing but incredible", JonathanSlatterMusic | Same. |

## Rejected on rights — do NOT ship these

| File | Source | Problem |
|---|---|---|
| `amb-chant.m4a` | Pixabay 17080 — "TRATADA190127_0790 organizada ja ganhou", brudelarge via freesound_community | Page metadata is Pixabay Content License and names no club. But it is a live recording of a Brazilian *torcida organizada*, and the Pixabay licence forbids commercial use of content containing **recognisable trademarks or brands**. A chant naming a club is exactly that, and nobody has confirmed by listening that no club name is audible. The description also tags it "Radio", which would raise a separate broadcast-rights question. Not worth the risk for one ambience loop. |
| `amb-stadium.m4a` | filename claims Pixabay 106709 | **Could not verify the source.** Pixabay ID 106709 resolves to "listentomerijn_-_sample_1", a 12-second Casio vibrato loop — not a 2:36 stadium recording. The file's provenance is therefore unknown, and unknown provenance is not a licence. Replaced by `public/audio/amb-crowd.m4a`, cut from the verified 72194 recording instead. |

If you want either rejected file back, the fix is not to re-verify the page — it is
to regenerate the sound with Higgsfield (`mirelo_text_to_audio`), which produces
audio with no third-party rights attached at all.
