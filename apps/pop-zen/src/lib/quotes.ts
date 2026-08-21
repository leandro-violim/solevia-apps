/** Short inspirational quotes shown after clearing all 5 phases. */
import { LANG, type Lang } from "./i18n";

export const QUOTES: Record<Lang, readonly string[]> = {
  en: [
    "Every pop, a little lighter. Every run, a little better.",
    "Small progress is still progress — beat your calm.",
    "Breathe in. Beat your record. Breathe out.",
    "Repetition is where mastery hides.",
    "The next run is always the best one to improve.",
    "Calm hands, quicker mind.",
    "You just finished — now go beat yourself.",
    "One more round. One more record.",
  ],
  pt: [
    "A cada bolha, um alívio. A cada partida, um pouco melhor.",
    "Todo progresso conta — evolua no seu ritmo.",
    "Inspire. Supere seu recorde. Expire.",
    "É na repetição que mora a maestria.",
    "A próxima partida é sempre a melhor para evoluir.",
    "Mãos calmas, mente ágil.",
    "Você terminou — agora supere a si mesmo.",
    "Mais uma rodada. Mais um recorde.",
  ],
};

export function pickQuote(seed = Date.now()): string {
  const list = QUOTES[LANG] ?? QUOTES.en;
  return list[seed % list.length];
}
