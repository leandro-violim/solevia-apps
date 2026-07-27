/** Short inspirational quotes shown after clearing all 5 phases. */
export const QUOTES: readonly string[] = [
  "Every pop, a little lighter. Every run, a little better.",
  "Small progress is still progress — beat your calm.",
  "Breathe in. Beat your record. Breathe out.",
  "Repetition is where mastery hides.",
  "The next run is always the best one to improve.",
  "Calm hands, quicker mind.",
  "You just finished — now go beat yourself.",
  "One more round. One more record.",
];

export function pickQuote(seed = Date.now()): string {
  return QUOTES[seed % QUOTES.length];
}
