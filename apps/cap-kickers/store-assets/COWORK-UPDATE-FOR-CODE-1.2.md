# Cowork → Code: 1.2 status (2026-09-08)

Captures are done. **Two things blocked submission.** Blocker 1 is now RESOLVED
(2026-09-08, see the box below); blocker 2 is with you. Nothing has been uploaded to
either store and nothing has been submitted.

---

## 1. ~~BLOCKER~~ RESOLVED — menu theme replaced

> **Update 2026-09-08.** Leandro chose to swap the track rather than chase a clearance.
> `src/assets/audio/menu-theme.m4a` is now **"Brazil Football Carnival Samba Music"** by
> STAROSTIN (Pixabay 260573, Pixabay Content License, composer registered with BMI —
> IPI 01310018719). Full provenance is in `src/assets/audio/LICENCES.md`; the untouched
> download is kept at `store-assets/audio-source/`.
>
> Matched to the file it replaced so the menu does not change volume: −12.44 LUFS vs
> −12.32 before, −0.49 dBTP, AAC 96 kbps / 44.1 kHz / stereo, 740,785 bytes (6 KB
> smaller). Cut as a true 60.47 s loop — 32 bars at ~127 BPM, sample-aligned, 60 ms
> crossfade. Incidentally this **fixes a pre-existing bug**: the old theme began and
> ended in digital silence, so the menu music audibly stopped and restarted every 60
> seconds. The new one loops continuously.
>
> ⚠️ The track is **Content ID registered**. That is irrelevant inside the app, but do
> not use it to score a YouTube ad creative without checking — it can claim our own ad.
>
> **You need to rebuild.** `dist/client`, `ios/App/App/public` and
> `android/app/src/main/assets/public` still contain the old `menu-music-*.js` chunk.
>
> "Arena of Glory" is parked, not deleted, at `store-assets/audio-hold/` with a README
> recording what would bring it back.

<details><summary>Original finding (kept for the record)</summary>

### The menu theme is very likely not licensed for this app

`src/assets/audio/menu-theme.m4a` ("Arena of Glory") ships in the 1.2 binary — the
`menu-music-*.js` chunk is in `dist/client`, `ios/App/App/public` and
`android/app/src/main/assets/public`. Leandro confirmed the track came from the
**ElevenLabs Music Marketplace**.

I read the terms. The Music Marketplace Addendum grants "a limited, non-exclusive,
non-sublicensable" right and defers the actual scope to the **usage type** bought at
purchase. There are four: Social Media, Paid Marketing, Offline, Enterprise. **None of
them names video games, apps, or software distribution.** Separately, ElevenLabs
excludes "Studio Games" from music it generates itself, defined as:

> "video games which are commercialised (either by sale, advertising or any other forms
> of monetisation) and made available for download or use through more than one platform."

Cap Kickers is monetised by ads and ships on Google Play *and* the App Store — both limbs.
A Marketplace track adds a third-party seller to the rights chain, so it is very unlikely
to grant *broader* rights than ElevenLabs grants for its own output. Every tier also
prohibits "redistributing, reselling, sublicensing", and this file ships inside the app
binary on every user's device.

**Not a lawyer, and this is public terms rather than the receipt on the account.** But it
needs resolving before submission, not after. Options:

- **Pull the theme from 1.2** (fastest). Note `RELEASE-NOTES-1.2.md` promises "a new menu
  theme" in all three languages — that line comes out too.
- Get written confirmation from ElevenLabs that the purchased usage type covers a
  monetised, multi-platform game.
- Replace with a track explicitly licensed for game sync.

The generated SFX/VO/ambience are a separate and much safer question — Sound Effects is a
different terms document with no Studio Games carve-out that I could find.


</details>

## 2. i18n gaps are still present in 1.2 (flagged 2026-09-06, not fixed)

The Reward Road is one of the six hero screenshots, and in **pt-BR and es** these render
in English:

- Ranks: `ROOKIE` `AMATEUR` `PROSPECT` `REGULAR` `STARTER` `VETERAN` `CAPTAIN`
- Pitch/reward names: `TABLE` `CEMENT`
- Also inside a translated sentence: "Vença a Fase 7 · **Captain**" / "Gana la Fase 7 · **Captain**"

Reward *pack* names are correctly localized (`PACOTE DE NARRAÇÃO`, `PACOTE DE TORCIDA`,
`PACK DE PÚBLICO`), so the mechanism works — these strings just aren't in it.

Some may be intentional proper nouns. `AMATEUR` / `VETERAN` / `CAPTAIN` / `TABLE` /
`CEMENT` are not — they have obvious pt/es equivalents and they sit in the Brazilian and
Spanish store listings. **The pt-BR and es screenshots should not be uploaded until this
is fixed.** Re-shooting after the fix is one command.

---

## What Cowork did

**AdMob rewarded-interstitial units — created and wired** (this was Code's action item #1).
- iOS `ca-app-pub-9628521678374705/3205796533`
- Android `ca-app-pub-9628521678374705/6209670726`
- Named `CapKickers iOS / Android Rewarded Interstitial`, reward set to **5 Caps** to match
  the code. Pasted into `LIVE_IDS.rewardInterstitial`; `tsc --noEmit` clean. The stale ⚠️
  comment above `LIVE_IDS` was replaced.
- Checked they need no mirroring elsewhere: native AdMob **App** IDs in `AndroidManifest.xml`
  (`~4321826253`) and `Info.plist` (`~1368359859`) both match AdMob. Unit ids live only in `ads.ts`.

**Captures — 45 screenshots, all verified at exact pixel sizes.**
3 targets x 3 locales x 5 scenes, from today's `dist/client`:
- App Store iPhone 6.9" `1320x2868`
- App Store iPad 13" `2064x2752`
- Play phone `1080x1920`
Plus 12 composed images: Play feature graphic `1024x500` and Google Ads
`1200x628` / `1200x1200` / `1200x1500`, in all three locales.

Harness: `tools/store-capture/` — `devices.mjs` updated to the 1.2 routes, `seed.json`
committed so the Reward Road and Cabinet render populated. `node capture.mjs --base
http://localhost:8080` then `node verify.mjs` reproduces the lot.

## Three corrections to COWORK-CAPTURE-BRIEF.md

1. **Locale seed format is wrong.** The brief says
   `localStorage['capkickers.locale.v1'] = '"en"'` (JSON-quoted). `loadLocale()` in
   `src/lib/i18n.ts` compares `raw === "en"`, so a quoted value fails and silently falls
   back to the device locale. It must be the **plain string** `en` / `pt-BR` / `es`.
2. **Google Ads portrait size is invalid.** The brief asks for `1080x1920` (9:16). App
   campaign image assets accept only 1.91:1, 1:1 and 4:5 — 9:16 is not a valid slot.
   Produced **1200x1500** (4:5) instead.
3. **iPad size.** The brief says `2048x2732`, which is Apple's **12.9"** size. The current
   **13"** slot is `2064x2752`. Shot at 2064x2752; worth confirming against ASC Media Manager
   which slot the existing iPad assets occupy.

## Two smaller notes

- **Scene 4 of the brief ("reward moment" / the Unlocked! celebration) was not captured.**
  It needs a real phase win, which can't be scripted headlessly. Capture by hand or drop it —
  the other five scenes stand on their own.
- **Half the frame is empty wood** on the Home and How-to-Play shots at 6.9". The card is
  top-anchored, so it's accurate to the app but weak as a store screenshot. The brief's own
  optional "marketing caption band" would fill it productively.

## Not done, deliberately

No store uploads, no submission, no legal declarations ticked. Those wait on the audio
question and Leandro's explicit go-ahead.
