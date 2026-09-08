# Task for Code — close out 1.2 so we can submit

Everything Cowork owed for 1.2 is done and sitting in the working tree. This is what's
left on your side. Nothing has been uploaded to either store; nothing is submitted.

Read first: `src/assets/audio/LICENCES.md` (rewritten),
`store-assets/COWORK-UPDATE-FOR-CODE-1.2.md` (blocker 1 now marked resolved),
`store-assets/audio-hold/README.md`.

---

## 1. REBUILD — required. The current build ships a track we are not licensed for.

The menu theme was replaced at 21:51 on 2026-09-08. Your last build was 19:18, so
`dist/client/assets/menu-music-*.js`, `ios/App/App/public/` and
`android/app/src/main/assets/public/` **all still carry "Arena of Glory"**. This is
verified by base64-matching the chunk against both audio files, not inferred from
timestamps.

```
bun run build:mobile          # no VITE_USE_TEST_ADS
bunx cap sync ios
bunx cap sync android
```

**Acceptance check** — run this after the build and paste the output:

```sh
NEW=$(base64 < src/assets/audio/menu-theme.m4a | tr -d '\n' | head -c 120)
OLD=$(base64 < store-assets/audio-hold/arena-of-glory.m4a | tr -d '\n' | head -c 120)
grep -q "$NEW" dist/client/assets/menu-music-*.js && echo "OK  new theme present"
grep -q "$OLD" dist/client/assets/menu-music-*.js && echo "FAIL old theme still present"
```

`src/assets/audio/menu-theme.m4a` should be sha256
`a24f00130a3f9765f860de6385e721c35c44f92f43cf72315d94f90340c25316`, 740,785 bytes.

---

## 2. Uncommitted work in the tree — review and commit

| Path | What |
|---|---|
| `src/assets/audio/menu-theme.m4a` | replaced — AAC 96 kbps / 44.1 kHz stereo, 60.47 s, −12.44 LUFS, −0.49 dBTP |
| `src/assets/audio/LICENCES.md` | new menu-theme provenance section + ElevenLabs SFX rights confirmation |
| `src/lib/menu-music.ts` | comment only, no code change |
| `store-assets/audio-hold/` | parked "Arena of Glory" + README explaining the hold |
| `store-assets/audio-source/` | untouched Pixabay original, 3.1 MB, kept as licence evidence |
| `store-assets/screenshots-1.2/` | 45 PNGs, **109 MB** |
| `store-assets/ads-1.2/` | 12 PNGs, 13 MB |
| `tools/store-capture/capture.mjs`, `README.md` | `CHROMIUM_PATH` escape hatch + re-run notes |
| `store-assets/COWORK-UPDATE-FOR-CODE-1.2.md` | updated |

**Decision needed: 122 MB of PNGs going into git.** Your call, but they are regenerable
from any build with one command, so git-lfs or a `.gitignore` for
`store-assets/screenshots-1.2/` and `store-assets/ads-1.2/` both look better than
committing them. They only need to exist on disk long enough to upload. Tell me which
way you go.

Note `store-assets/screenshots/` (the 1.1 set) was deliberately **not** touched — it uses
a different layout (`ios-*` prefixes, no locale subfolders) and `play-phone` would have
collided. Retire it whenever you like; that's not a 1.2 blocker.

---

## 3. Verify the i18n change did not break existing saves

Your change added `nameKey` to the ladder / pitch / cap records. IDs are untouched so
this should be a non-event — but please confirm the **upgrade path explicitly** rather
than by inspection, because a migration bug here passes every test and quietly destroys a
returning player's progress.

Load a **1.1-era** save (a `capkickers.campaign.v1`, `capkickers.inventory.v1` and
equipped-cap set written before the change) and confirm completed phases, owned items and
the equipped cap all still resolve.

---

## 4. On-device audio check (~5 min, both platforms)

The new theme is a genuine 60.47 s loop — 32 bars at ~127 BPM, sample-aligned, 60 ms
crossfade. The old one was not: it began and ended in digital silence, so the menu music
had been audibly stopping and restarting every minute since 1.1. That's fixed, but it now
depends on Web Audio trimming the AAC priming correctly.

From the menu, listen through **at least two wraps (~2 min)** on real iOS and Android
hardware and confirm no click, gap or level dip at the seam. If you hear one, `startMusic`
in `src/lib/audio.ts` can set `loopStart`/`loopEnd` on the `AudioBufferSourceNode` — tell
me and I'll give you exact sample offsets.

Also confirm menu volume feels unchanged vs 1.1. It is matched to within 0.12 LU on paper.

---

## 5. Branch / release line

Work is on `feat/project-c-graphics`; 1.1 shipped from `cap-kickers` / `android-release`.
Decide and execute the merge **before** building store binaries, so the archived binary
comes from the release line rather than the feature branch.

---

## 6. Build the store binaries

- **Android** — signed AAB, versionCode **4**. The keystore and its password are
  Leandro's: don't generate one, don't ask for it, and never commit the `.aab` or
  `keystore.properties`.
- **iOS** — Xcode ▸ Archive ▸ Distribute ▸ App Store Connect, **1.2 / build 3**. The
  GoogleMobileAds dSYM "Upload Symbols Failed" warning is harmless.
- Re-grep the final binary: test ID `3940256099942544` must be **0**, and both live
  rewarded-interstitial units present (iOS `…/3205796533`, Android `…/6209670726`).

---

## 7. Docs to true up

- `store-assets/RELEASE-1.2-HANDOFF.md` → "Still outstanding": audio rights are now
  resolved (SFX confirmed clear against the Sound Effects Terms + ToS; menu theme
  replaced), and screenshots + ad creatives are produced. Only the legal declarations at
  submit remain, and those are Leandro's.
- `RELEASE-NOTES-1.2.md` needs **no change** — "a new menu theme" / "um novo tema de
  menu" / "un nuevo tema de menú" is still accurate and never named the track. Checked in
  all three locales.

---

## Not yours

Store uploads and listing metadata, and the ad campaigns, are Cowork's. IARC Terms,
export compliance, the Play policy checkboxes and pressing Submit are **Leandro's alone**.

---

## Report back with

1. Rebuild done + the acceptance-check output from §1.
2. What you decided about the PNGs in git.
3. The save-migration result (§3).
4. The on-device loop result on both platforms (§4).
5. The release branch name, and the built artifacts (AAB versionCode, iOS build number).
