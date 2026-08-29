# Zen Bubbles — Analytics event catalog (P1-T6)

Firebase Analytics (GA4), wired via `src/lib/analytics.ts`. All events fire through
`track(name, params)` — fire-and-forget, never awaited, never throws into game code.
GA4 **auto-collects** `first_open` / `session_start` / `screen_view` — not re-implemented here.

Opt-out: Settings → Analytics toggle → `setAnalyticsEnabled(false)` (persists in
`localStorage["zb_analytics_opt_out"]`; LGPD/GDPR).

| Event | Params | Fired from |
|---|---|---|
| `game_ready` | — | app mount (`__root`) |
| `mode_selected` | `mode` | home mode buttons (`mode.ts`) |
| `run_start` | `mode`, `difficulty`, `phase_start` | run start (`play.tsx`) |
| `run_end` | `mode`, `difficulty`, `score`, `phase_reached`, `bubbles_popped`, `max_combo`, `duration_s`, `ended_by` (`completed`\|`quit`) | finish + mid-run Exit (`play.tsx`) |
| `phase_cleared` | `mode`, `phase`, `time_left_s` | Time Attack phase clear (`play.tsx`) |
| `combo_milestone` | `milestone`, `mode` | combo milestone (`play.tsx`) |
| `special_bubble_popped` | `type` (golden\|bomb\|mystery\|frozen) | special pop (`play.tsx`) |
| `ad_interstitial_shown` | `placement` | `ads.ts` |
| `rewarded_offered` | `placement` | `ads.ts` |
| `rewarded_watched` | `placement` | `ads.ts` |
| `rewarded_skipped` | `placement`, `reason` | `ads.ts` |
| `coins_earned` | `amount`, `source` | `economy.ts` |
| `coins_spent` | `amount`, `sink` | `economy.ts` |
| `skin_unlocked` | `item_id`, `method` | `skins.ts` |
| `skin_equipped` | `item_id` | `skins.ts` |
| `daily_bonus_shown` | `day_count` | `daily-bonus.ts` |
| `daily_bonus_claimed` | `day_count`, `coins` | `daily-bonus.ts` |
| `streak_milestone` | `days` | `daily-bonus.ts` |
| `daily_challenge_played` | `score`, `date_seed` | `daily-challenge.ts` |
| `objective_completed` | `objective_id`, `coins` | `objectives.ts` |
| `achievement_unlocked` | `achievement_id`, `coins` | `achievements.ts` |
| `setting_changed` | `key`, `value` | Settings toggles (`settings.tsx`) |

## Release checklist (owner)
- Firebase project `zen-bubbles-a0a14` — web config committed in `firebase-config.ts` (not secret).
- Verify events in **Firebase console → Analytics → DebugView** with a debug build.
- iOS/Android native analytics (if desired later) would use the Capacitor Firebase plugin;
  this ticket wires the **web/JS** SDK that runs inside the Capacitor webview.
