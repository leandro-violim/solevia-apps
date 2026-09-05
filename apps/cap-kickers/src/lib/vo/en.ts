// English commentary voice-over clips, inlined as base64 data URIs (see
// sample-data.ts for why bytes are bundled, not fetched). Loaded via a dynamic
// import (vo-data.ts) so only the player's current language ships in memory.
import goal1 from "../../assets/audio/vo-en-goal-1.m4a?inline";
import goal2 from "../../assets/audio/vo-en-goal-2.m4a?inline";
import goal3 from "../../assets/audio/vo-en-goal-3.m4a?inline";
import big1 from "../../assets/audio/vo-en-big-1.m4a?inline";
import final1 from "../../assets/audio/vo-en-final-1.m4a?inline";
import near1 from "../../assets/audio/vo-en-near-1.m4a?inline";
import near2 from "../../assets/audio/vo-en-near-2.m4a?inline";

export default {
  "goal-1": goal1,
  "goal-2": goal2,
  "goal-3": goal3,
  "big-1": big1,
  "final-1": final1,
  "near-1": near1,
  "near-2": near2,
} as Record<string, string>;
