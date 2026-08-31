# Zen Bubbles — Master AdMob Ad-Unit List

**AdMob account:** `pub-9628521678374705` (Google login leandroviolim7@gmail.com)
**Compiled:** 2026-08-31 by Cowork, from the AdMob console. Pasted into `ads.ts` by
Claude Code (commit wiring the real rewarded units).
Bundle / package: `app.solevia.zenbubbles` · App Store adam id 6797921737

## iOS — app `ca-app-pub-9628521678374705~5486523715`

| Format | Unit name | Ad unit ID |
|---|---|---|
| Banner | Bubble Pop Calm Banner | `ca-app-pub-9628521678374705/2860360372` |
| Interstitial | Bubble Pop Calm Interstitial | `ca-app-pub-9628521678374705/7191467566` |
| Rewarded | Bubble Pop Calm Rewarded | `ca-app-pub-9628521678374705/2754567480` |

## Android — app `ca-app-pub-9628521678374705~9477972092`

| Format | Unit name | Ad unit ID |
|---|---|---|
| Banner | Bubble Pop Calm Banner | `ca-app-pub-9628521678374705/3973580155` |
| Interstitial | Bubble Pop Calm Interstitial | `ca-app-pub-9628521678374705/1211685446` |
| Rewarded | Bubble Pop Calm Rewarded | `ca-app-pub-9628521678374705/5189159137` |

## App-level AdMob App IDs (reference — do NOT change)

- iOS App ID: `ca-app-pub-9628521678374705~5486523715`
- Android App ID: `ca-app-pub-9628521678374705~9477972092`

## Status

All six live ids above are wired into `apps/pop-zen/src/lib/ads.ts` (`LIVE_IDS`) and
verified present (with zero Google test ids) in a production bundle. The Google sample
ids remain only in `TEST_IDS`, used solely for `bun dev` / `VITE_USE_TEST_ADS=true`
builds. New rewarded units can take up to ~1 hour to start serving (blank/no-fill until
then — normal, not a bug).
