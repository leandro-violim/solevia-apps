# Cowork follow-up — GA4 analytics (Zen Bubbles, property `p552089130`)

Thanks for the setup pass (30 dimensions, 14-month retention, 4 explorations). Two
small follow-ups so the v1.3 events are fully sliceable.

## 1. Register 4 more custom dimensions (event-scoped) — Pop Challenge
These params ship in v1.3 (the 3-hour "Pop Challenge" booster) but were added to the
events spec AFTER your pass, so they aren't among the 30 yet. Please register:

| Dimension (param) | Event it appears on | Example values |
|---|---|---|
| `mission_kind` | `challenge_started`, `challenge_completed` | `pop`, `combo`, `clear`, `fast` |
| `reward_kind` | `challenge_started`, `challenge_completed` | `coins`, `bomb`, `freeze` |
| `reward_amount` | `challenge_completed` | integer (coins or item count granted) |
| `success` | `challenge_completed` | `true` / `false` (mission met?) |

All **event-scoped**, snake_case, matching the names above exactly.

(For context, the two Pop Challenge events themselves: `challenge_started` and
`challenge_completed` — see EVENTS.md → "Pop Challenge" section.)

## 2. Star the 2 remaining key events once GA4 has received them
`world_completed` and `first_run_completed` couldn't be marked yet — GA4 only lets you
star events seen in the last 28 days, and these need a player to finish a world /
complete a first run after the v1.3 update ships. Once they appear under
**Events → Recent events**, mark both as key events. (The other 5 are already done:
`run_start`, `phase_cleared`, `rewarded_watched`, `skin_unlocked`, `daily_bonus_claimed`.)

## Not needed / deliberate
- **Google signals** — leave OFF (owner's call; LGPD/GDPR consent implications, and
  Brazil is a launch market). Only flip on if we add a consent flow.
- The `(not set)` in the Phase-depth table is expected — GA4 dimensions aren't
  retroactive; `phase` will populate as new `phase_cleared` events arrive.
