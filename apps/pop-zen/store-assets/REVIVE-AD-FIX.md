# Revive rewarded-ad fix — reward not granted + double ad (Sep 11 2026)

## Symptoms (Leandro, testing)
1. Tap **Revive** → watch what feels like **2 long ads** → **not** awarded the +15s.
2. Ads feel too long/intrusive (~30s). Wants a cap (~15–20s per revive).

## Root cause (issue #1) — the reward isn't being captured
Flow: `play.tsx onRevive()` → `showRewarded("revive")` (ads.ts) → only if it returns
`true` does it `registerRevive()` + go to the paused **"resume"** state, and only then
does `continueAfterRevive()` set `deadline = now + reviveSeconds*1000` (the +15s).

In `ads.ts showRewarded()`, `earned` becomes `true` **only** if `RewardAdPluginEvents.Rewarded`
is seen and correlated with `Dismissed` within a **600 ms** grace. On device the reward
signal isn't being credited before the promise settles → `showRewarded` returns **false** →
no +15s, and `registerRevive()` never runs so `getRunRevives()` stays 0 → `canRevive` stays
true → the Time-Up panel is still there → the player taps **Revive again → a 2nd ad** → still
no credit. That is the "2 ads + no reward." (The "End run" button never shows an ad — verified —
so the 2nd ad is the retry, not an interstitial.)

## Fix #1 — make the reward capture order-independent (grant the instant it's earned)
In `src/lib/ads.ts`, replace the listener block inside `showRewarded()` so the reward is the
source of truth: grant as soon as `Rewarded` fires (before OR after `Dismissed`), and give a
longer grace if `Dismissed` arrives first. Also stop an interstitial from stacking right after.

Replace the Promise body (from `const handles` … to the final `.catch(finish);`) with:

    const handles: PluginListenerHandle[] = [];
    let settled = false;
    let earned = false;
    let adShown = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rewardedReady = false;
      handles.forEach((h) => h.remove());
      resumeAudio();
      if (adShown) lastInterstitialAt = Date.now(); // don't stack an interstitial after a rewarded ad
      track(earned ? "rewarded_watched" : "rewarded_skipped", { placement });
      resolve(earned);
      void preloadRewarded();
    };
    const timer = setTimeout(finish, 40000);
    const onReward = () => { earned = true; finish(); };      // reward = source of truth; grant immediately
    const onDismissed = () => {
      adShown = true;
      if (earned) return finish();
      setTimeout(finish, 2000); // reward can fire slightly AFTER dismissed on some SDK builds
    };
    Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, onReward),
      AdMob.addListener(RewardAdPluginEvents.Dismissed, onDismissed),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, finish),
    ])
      .then((hs) => {
        handles.push(...hs);
        if (settled) hs.forEach((h) => h.remove());
        adShown = true;
        return AdMob.showRewardVideoAd();
      })
      .catch(finish);

Notes: resolving on `Rewarded` while the ad is still on screen is fine — `onRevive` only moves
to the PAUSED "resume" state; the +15s countdown starts on the player's **Continue** tap, after
the ad closes.

## Fix #2 — don't let a missed credit burn extra ads (belt-and-suspenders)
In `src/routes/play.tsx`, cap revive **attempts**, not just successes, so a credit miss can never
cost the player two long ads:
- add `const reviveAttemptsRef = useRef(0);`
- in `onRevive`, `if (reviveBusy || reviveAttemptsRef.current >= CONFIG.ads.rewarded.maxRevivesPerRun) return;`
  and `reviveAttemptsRef.current += 1;` right after `setReviveBusy(true)`.
- reset it to 0 where the run resets (same place `resetRunStats()` is called).
- (Optional) if `!watched`, show a tiny toast "Couldn't verify the ad — no time added" so the
  player understands instead of re-tapping.

## Verify it's actually firing
The code already logs analytics: `rewarded_offered` → `rewarded_watched` / `rewarded_skipped`.
After the fix, watch a rewarded ad on a **test build** and confirm GA4 shows `rewarded_watched`
(not `rewarded_skipped`). Test with **VITE_USE_TEST_ADS=true** or a dev build — do NOT watch/tap
your own LIVE ads (AdMob can flag invalid traffic and suspend the account).

## Issue #2 — capping ad length to ~20s: NOT possible via AdMob
AdMob does not let a publisher set a maximum duration for rewarded ads. Rewarded ads are
non-skippable and typically 15–30s; there is no setting/filter/mediation control to force ≤20s,
and no "one ≤20s or two totaling ≤20s" option exists. What actually helps:
- Fix #1/#2 above → **one** ad per revive that **reliably** grants the +15s (removes the "two 30s
  ads for nothing" experience — the biggest pain).
- `maxRevivesPerRun` is already 1, so at most one rewarded ad per run from revive.
- If you want a shorter forced view, the only lever is switching Revive from a rewarded ad to a
  standard **interstitial** (skippable after ~5s) and granting on dismiss — but that breaks the
  "watch to earn" model and can be gamed (skip in 5s, still get +15s). Not recommended.
- Recommendation: keep rewarded, ship the bug fixes. The ad length itself is Google's call.

## Files
- `src/lib/ads.ts` → `showRewarded()` listener block (Fix #1)
- `src/routes/play.tsx` → `onRevive` attempt cap (Fix #2)
- No config changes required (reviveSeconds=15, maxRevivesPerRun=1 stay).
