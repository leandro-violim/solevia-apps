/** Short inspirational quotes shown after clearing all phases. */
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
  es: [
    "Cada burbuja, un poco más de calma. Cada partida, un poco mejor.",
    "Todo progreso cuenta — mejora a tu ritmo.",
    "Inhala. Supera tu récord. Exhala.",
    "En la repetición se esconde la maestría.",
    "La próxima partida siempre es la mejor para mejorar.",
    "Manos tranquilas, mente ágil.",
    "Acabas de terminar — ahora supérate a ti mismo.",
    "Una ronda más. Un récord más.",
  ],
};

export function pickQuote(seed = Date.now()): string {
  const list = QUOTES[LANG] ?? QUOTES.en;
  return list[seed % list.length];
}
