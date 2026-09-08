// How a phase reward is shown on the "reward road" (campaign screen + win teaser).
// Returns neutral display data; the React component localizes `nameKey`/`kindKey`.

import { type PhaseReward } from "./ladder";
import { pitchStyleById } from "../pitches/styles";

export type RewardView = {
  kindKey: string; // i18n key for the category label ("reward.pitch" | "reward.sound")
  name?: string; // literal name (pitch proper noun)
  nameKey?: string; // i18n key for the name (audio packs)
  img?: string; // pitch-surface thumbnail (public path), for the preview tile
  emoji: string; // glyph shown when there's no image (audio) or as a fallback
};

export const rewardView = (r: PhaseReward): RewardView => {
  if (r.type === "pitch") {
    const s = pitchStyleById(r.styleId);
    return {
      kindKey: "reward.pitch",
      nameKey: `pitch.${s.id}`, // localized (was the hardcoded English s.name)
      img: s.photo ? `/pitch-textures/${s.photo}` : undefined,
      emoji: "🏟️",
    };
  }
  // audio pack
  const nameKey =
    r.styleId === "crowd"
      ? "cabinet.packCrowd"
      : r.styleId === "commentary"
        ? "cabinet.packCommentary"
        : "cabinet.packStadium";
  return { kindKey: "reward.sound", nameKey, emoji: r.styleId === "commentary" ? "🎙️" : "🔊" };
};
