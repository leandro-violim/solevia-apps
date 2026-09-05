// Single source of truth for pushing the player's unlocked audio packs (and the
// commentary language) into the audio engine. Called on startup, on a language
// change, when a pack is awarded, and when one is bought — so the engine never
// falls out of sync with the inventory.

import { gameAudio } from "./audio";
import { getLocale } from "./i18n";
import { voLangFor } from "./vo-data";
import { isAudioPackUnlocked } from "../game/economy/catalog";
import { loadOwned } from "../game/economy/inventory";
import { loadProgress } from "../game/campaign/storage";

export const syncAudioPacks = (): void => {
  const owned = loadOwned();
  const completed = loadProgress().completed;
  gameAudio.setVoiceLang(voLangFor(getLocale()));
  gameAudio.setPacks({
    crowd: isAudioPackUnlocked("crowd", owned, completed),
    stadium: isAudioPackUnlocked("stadium", owned, completed),
    commentary: isAudioPackUnlocked("commentary", owned, completed),
  });
};
