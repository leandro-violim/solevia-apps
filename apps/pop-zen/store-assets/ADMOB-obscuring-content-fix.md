# AdMob warning — "Google-served ads obscuring content" (Zen Bubbles, Android)

**Status:** Ad serving at risk · Advertiser preference · Version reviewed: 1.0 · Reported Sep 10, 2026
**Verdict: FIX (do not appeal).** This is a real ad-placement issue, and it is structural (not unique to v1.0). Fix it in the v1.3 release, upload, then request review.

---

## What the policy means
Google-served ads may not fully or partially obscure app content — even briefly — and must not sit so close to content/buttons that they invite accidental clicks. ([policy](https://support.google.com/publisherpolicies/answer/11127388)) For a mobile game the usual trigger is a **bottom banner overlapping UI/buttons** on some screens.

## Root cause (from the code)
The AdMob banner (`src/lib/ads.ts`) is an **adaptive banner pinned `BOTTOM_CENTER`, shown once at app start (`__root.tsx`) and never hidden.** It's a native overlay that draws on top of the webview. Screens must reserve space above it. Most do — but:

1. **Finish screen (`src/routes/finish.tsx`) — NOT reserved.** It's a bespoke layout (doesn't use `ScreenShell`, renders no `AdBanner`/`AdBannerSpacer`), so its bottom "Actions" buttons (Play again / Home) and the "double coins" rewarded button render **under** the banner → obscured content + accidental-click risk. **Most likely the flagged screen.**
2. **World map (`src/routes/map.tsx`) — NOT reserved.** New in v1.3; the lower level nodes / portal and the "tap to play" ribbon (`fixed inset-x-0 z-30`) can fall under the banner.
3. **Hardcoded 72px reserve.** `AdBanner`/`AdBannerSpacer` reserve a fixed `72px`, but adaptive banners are ~90–100px on many devices, so even "reserved" screens can clip slightly. `play.tsx` already does this right (`max(--ad-banner-h, 100)`); the shared components don't.
4. **No visibility control.** The banner is never hidden for full-screen moments (Finish, and any bottom-covering dialog).

Screens that ARE correctly reserved (no change needed): Home (`index.tsx`), Play field (`play.tsx` `usableFieldHeight`), and everything via `ScreenShell` (Shop, Settings, Records, Achievements, About), plus Privacy/Terms (pad with `--ad-banner-h`).

**Ad cadence is fine** — interstitials only at phase-complete breaks (`everyPhases:4`, 20s cooldown, per-run cap), rewarded is user-initiated (Shop/Finish), banner refresh ≥60s. No frequency/volume change needed; the 96 requests/7 days just reflects low installs. The problem is placement only.

---

## The fix (v1.3)
1. **Finish:** hide the banner while Finish is on screen — `hideBanner()` on mount, `showBanner()` on unmount. (Cleanest: Finish is a full-screen CTA moment; a bottom banner under the buttons is exactly the overlap.)
2. **Map:** keep the banner (high-traffic surface) but reserve the **real** banner height at the bottom so no node/portal/play affordance sits under it, and lift the "tap to play" ribbon above the banner (`bottom: calc(var(--ad-banner-h,100px) + env(safe-area-inset-bottom) + 12px)`).
3. **Shared components:** change `AdBanner` (fixed mode) and `AdBannerSpacer` to use `var(--ad-banner-h, 100px)` instead of the hardcoded `72px`, so every reserving screen clears the actual adaptive banner on all devices.
4. **Central visibility helper:** hide the banner on route `/finish` (and any future full-screen dialog that covers the bottom), show it elsewhere — one small effect keyed on the current route.
5. Leave interstitial/rewarded logic unchanged.

After the fix ships and the new version is live on Google Play, click **Start review process** in Policy center. (Do NOT click it now — nothing is fixed yet; a failed review just resets the clock.)

---

## Copy-paste prompt for Code

> **Task: fix AdMob "Google-served ads obscuring content" (banner overlapping UI) for v1.3 — Pop Zen (`apps/pop-zen`).**
>
> The AdMob banner is an adaptive banner pinned BOTTOM_CENTER (`src/lib/ads.ts`), shown once in `__root.tsx` and never hidden. It's a native overlay; screens must reserve its height above it. Two screens don't, causing the policy flag. Implement all of the following, keep tests green, and don't touch interstitial/rewarded logic or the ad unit IDs:
>
> 1. **`src/lib/ads.ts`** — export the current banner-visible state and make `showBanner()`/`hideBanner()` idempotent (track a `bannerVisible` boolean; guard duplicate calls). Keep publishing `--ad-banner-h` from the `SizeChanged` listener (already done).
> 2. **`src/components/AdBanner.tsx`** — replace the hardcoded `72px` in BOTH `AdBanner` (fixed mode height) and `AdBannerSpacer` with `var(--ad-banner-h, 100px)` (keep `+ env(safe-area-inset-bottom)` and `box-sizing: content-box`). The web/dev placeholder can keep a fixed height.
> 3. **Banner visibility by route** — in `__root.tsx` (or a small hook), react to the active route: call `hideBanner()` when the route is `/finish` (and add an easy allowlist so future full-screen dialogs can opt out), and `showBanner()` on every other route. Ensure returning from Finish to Home/Map re-shows it.
> 4. **`src/routes/finish.tsx`** — as a belt-and-suspenders in case the banner is briefly visible, also add bottom padding `calc(var(--ad-banner-h,100px) + env(safe-area-inset-bottom) + 16px)` to the scroll container so nothing can ever sit under a banner.
> 5. **`src/routes/map.tsx`** — keep the banner visible but reserve its real height: add bottom padding `calc(var(--ad-banner-h,100px) + env(safe-area-inset-bottom) + 16px)` to the map's scroll/content container so the lowest node/portal and the Play affordance always clear the banner; move the fixed "tap to play" ribbon up to `bottom: calc(var(--ad-banner-h,100px) + env(safe-area-inset-bottom) + 12px)`.
> 6. **Verify** on a tall device and a short device (e.g. Pixel 8 and a small screen) that on Home, Map, Play, Finish, Shop, Settings, Records the banner never overlaps any button, node, or bubble. Take before/after screenshots of Finish and Map with a test banner (`VITE_USE_TEST_ADS=true`) showing.
>
> Do not change ad frequency, ad unit IDs, or the consent/ATT flow. Commit with a message noting this resolves the AdMob "ads obscuring content" placement issue.

---

## Re-submission sequence (Leandro)
1. Code implements the fix → you validate on device (banner never overlaps buttons/nodes on Finish & Map).
2. Ship it in the v1.3 update to Google Play; wait until the new version is live.
3. AdMob → Policy center → the issue → **Start review process** (reviews take ~1 week).
