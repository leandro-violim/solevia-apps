# Zen Bubbles — Analytics events (GA4, web data stream `G-0MY4L3KEDF`)

All events flow through `track(name, params)` in `src/lib/analytics.ts` (fire-and-forget,
opt-out aware). Param names are **snake_case and stable** — register each as a GA4
**custom dimension** to slice reports by it. User properties go through `setUserProps()`.

Analyze in **analytics.google.com** (GA4), not the Firebase console (no native app is
registered — expected). Use DebugView for QA.

## Navigation
| Event | Params | When |
|---|---|---|
| `screen_view` | `screen_name`, `previous_screen` | every route change (`__root.tsx`, deduped). Screens: `home, map, play, finish, shop, settings, records, achievements, about, privacy, terms` |

## Progression (the "how far do they get" funnel)
| Event | Params | When |
|---|---|---|
| `run_start` | `mode`, `difficulty`, `phase_start` | a run begins (phase 1 or a fresh continuation) |
| `phase_start` | `mode`, `world`, `phase` | **every** phase entry (Pop Challenge). Build a funnel phase=1→…→32 |
| `phase_cleared` | `mode`, `world`, `phase`, `time_left_s` | a phase is cleared |
| `world_completed` | `world` | the 8th phase of a world clears |
| `portal_used` | `from_world`, `to_world` | the map portal advances a world |
| `time_up` | `mode`, `world`, `phase` | the countdown hits 0 with bubbles left |
| `revive_used` | `mode`, `phase` | a rewarded revive is watched |
| `run_end` | `mode`, `difficulty`, `score`, `phase_reached`, `bubbles_popped`, `max_combo`, `duration_s`, `ended_by` | a run ends (`completed`/`timeout`/`quit`) |
| `run_abandoned` | `mode`, `world`, `phase`, `reason` | left an in-progress run (`reason`: `nav`/`background`) |

## Onboarding funnel (first-time flags in localStorage)
| Event | Params | When |
|---|---|---|
| `tutorial_shown` / `tutorial_completed` | — | How-to-play opened / its CTA tapped |
| `first_pop` | — | the very first bubble ever popped |
| `first_run_completed` | — | the first run ever finished |

(`first_open` / `session_start` are automatic in GA4.)

## Gameplay feedback
`combo_milestone {milestone, mode}`, `special_bubble_popped {type}`, `mode_selected`,
`objective_completed {objective_id?, coins}`, `achievement_unlocked {achievement_id?}`,
`streak_milestone`, `skin_unlocked` / `skin_equipped`.

## Equip (journey power-ups, v1.3)
| Event | Params | When |
|---|---|---|
| `phase_equipped` | `world`, `phase`, `bombs`, `freeze`, `boost` | player taps Play in the equip popup. `boost=1` when the rewarded-ad free boost was watched |

## Pop Challenge (§13 — the 3-hour comeback booster, v1.3)
| Event | Params | When |
|---|---|---|
| `challenge_started` | `mission_kind` (`pop`/`combo`/`clear`/`fast`), `reward_kind` (`coins`/`bomb`/`freeze`), `phase` | the tile is tapped and a challenge is rolled |
| `challenge_completed` | `mission_kind`, `success`, `reward_kind`, `reward_amount` | the single phase ends (win OR miss); reward already granted |

(The reward itself also fires `coins_earned {source: pop_challenge}` or
`consumable_granted {item, source: pop_challenge, count}`.)

## Economy & monetization
| Event | Params | When |
|---|---|---|
| `coins_earned` / `coins_spent` | `source` / `sink`, amount | economy changes |
| `consumable_bought` / `consumable_used` / `consumable_granted` | `item` | inventory changes |
| `shop_item_viewed` | `item_id`, `rarity`, `price` | a shop buy is engaged |
| `purchase_blocked_insufficient_coins` | `item_id`, `short_by` | a buy fails for lack of coins |
| `daily_bonus_shown` / `daily_bonus_claimed` | `day_count` | daily login bonus |
| `daily_challenge_played` | — | the date-seeded run |

## Ads
| Event | Params | When |
|---|---|---|
| `ad_banner_shown` | — | first successful banner show |
| `ad_interstitial_shown` | `placement` | an interstitial displays |
| `ad_failed` | `format`, `reason` | banner/interstitial/rewarded load or show error |
| `ad_no_fill` | `format`, `reason` | AdMob code 3 (no inventory) |
| `rewarded_offered` / `rewarded_watched` / `rewarded_skipped` | `placement` | rewarded flow. NOTE: on web/dev a watch is `simulated:true`; on native `rewarded_watched` fires from the real reward callback |

## Settings / system
`setting_changed`, `game_ready`.

## User properties (segmentation, persist across sessions)
| Property | When |
|---|---|
| `app_language` | at startup (`pt`/`es`/`en`) |
| `highest_world` / `highest_phase` | on a new max reached |
| `is_spender` | first coins spent on a purchase |

## GA4 console setup (do once — hand to Cowork)
1. **Custom definitions → custom dimensions (event-scoped):** `screen_name`, `previous_screen`,
   `mode`, `difficulty`, `world`, `phase`, `phase_start`, `placement`, `item_id`, `rarity`,
   `source`, `sink`, `reason`, `objective_id`, `achievement_id`, `milestone`, `type`,
   `day_count`, `format`, `from_world`, `to_world`, `short_by`, `ended_by`,
   `bombs`, `freeze`, `boost`, `mission_kind`, `reward_kind`, `reward_amount`, `success`.
   **(user-scoped):** `app_language`, `highest_world`, `highest_phase`, `is_spender`.
2. **Events → Mark as key event:** `run_start`, `phase_cleared`, `world_completed`,
   `rewarded_watched`, `daily_bonus_claimed`, `skin_unlocked`, `first_run_completed`.
3. **Data settings → Data retention → 14 months.**
4. **Explore:** Path exploration on `screen_view`; Funnel on `phase_start` (phase 1→…);
   onboarding funnel `first_open → screen_view(home) → run_start → first_run_completed`;
   monetization `screen_view(shop) → shop_item_viewed → coins_spent`.
5. Turn on Google signals (optional) and confirm the AdMob↔Firebase link for ad revenue.
