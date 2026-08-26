/**
 * Tiny in-app localization — no dependency. English + Portuguese (BR).
 *
 * The starting language is detected from the device (pt-* → pt-BR, else en) but,
 * unlike the Zen Bubbles version, the player can override it in Settings. The
 * choice is persisted and applied at runtime via a small subscribe store, so
 * `useT()` re-renders the UI when the language changes. Non-React code uses the
 * plain `t(key, params?)` which reads the current language.
 *
 * `t` looks up STRINGS[lang][key], falls back to English, then to the key
 * itself, and interpolates `{name}` placeholders from `params`.
 */
import { useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "pt-BR";
export const LOCALES: Locale[] = ["en", "pt-BR"];
export const LOCALE_LABEL: Record<Locale, string> = { en: "English", "pt-BR": "Português" };

const KEY = "capkickers.locale.v1";

const deviceDefault = (): Locale => {
  const l = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en";
  return l.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
};

const loadLocale = (): Locale => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw === "en" || raw === "pt-BR") return raw;
  } catch {
    /* ignore */
  }
  return deviceDefault();
};

let current: Locale = loadLocale();
const listeners = new Set<() => void>();

if (typeof document !== "undefined") document.documentElement.lang = current;

export const getLocale = (): Locale => current;

export const setLocale = (l: Locale): void => {
  if (l === current) return;
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") document.documentElement.lang = l;
  listeners.forEach((fn) => fn());
};

const subscribe = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

/** Reactive current locale (re-renders on change). */
export const useLocale = (): Locale => useSyncExternalStore(subscribe, getLocale, getLocale);

type Params = Record<string, string | number>;
const interpolate = (s: string, params?: Params): string =>
  params ? s.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m)) : s;

const lookup = (lang: Locale, key: string, params?: Params): string =>
  interpolate(STRINGS[lang][key] ?? STRINGS.en[key] ?? key, params);

/** Non-reactive translate (for the render loop / non-component code). */
export const t = (key: string, params?: Params): string => lookup(current, key, params);

/** Reactive translate hook for components. */
export const useT = (): ((key: string, params?: Params) => string) => {
  const locale = useLocale();
  return useCallback((key: string, params?: Params) => lookup(locale, key, params), [locale]);
};

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    // Common
    "common.back": "Back",
    "common.done": "Done",

    // Home / menu
    "home.tagline": "Flick bottle caps across the pitch and score goals.",
    "home.campaign": "Campaign",
    "home.passPlay": "Pass & Play",
    "home.practice": "Practice",
    "home.soloVsAi": "Solo vs AI",
    "home.settings": "Settings",
    "home.howToPlay": "How to Play",
    "diff.easy": "Easy",
    "diff.normal": "Normal",
    "diff.hard": "Hard",

    // Play HUD + overlays
    "play.playerTouch": "Player {n} — touch {t}/{shot}",
    "play.aiTouch": "AI — touch {t}/{shot}",
    "play.playerWins": "Player {n} wins!",
    "play.goal": "GOAL!",
    "play.turnOver": "Turn over",
    "play.menu": "⌂ Menu",
    "play.newMatch": "New match",
    "play.passPhone": "Pass the phone to Player {n}",
    "play.ready": "Ready",
    "play.soClose": "So close!",
    "play.watchPrompt": "Watch a short ad to take one more shot?",
    "play.watchShoot": "▶ Watch & shoot",
    "play.noThanks": "No thanks",
    "play.levelComplete": "Level complete!",
    "play.campaignComplete": "Campaign complete!",
    "play.nextLevel": "Next level",
    "play.backToCampaign": "Back to campaign",
    "play.youLost": "You lost",
    "play.tryAgain": "Try again",
    "play.rematch": "Rematch",

    // Settings
    "settings.title": "Settings",
    "settings.soundFx": "Sound FX",
    "settings.music": "Music",
    "settings.vibration": "Vibration",
    "settings.pitch": "Pitch",
    "settings.yourCap": "Your Cap",
    "settings.language": "Language",
    "settings.aboutLegal": "About & Legal",

    // Pitch picker
    "pitch.title": "Pitch",
    "pitch.subtitle": "Play anywhere — pick your surface.",
    "pitch.grass": "Grass",
    "pitch.school": "School",
    "pitch.table": "Table",
    "pitch.cement": "Cement",

    // Cap picker
    "caps.title": "Your Cap",
    "caps.subtitle": "Pick your cap. Your opponent gets a contrasting one.",

    // Campaign
    "campaign.title": "Campaign",
    "campaign.subtitle": "Beat each rival to unlock the next.",
    "campaign.locked": "Locked",
    "campaign.play": "Play",
    "campaign.done": "Done",
    "campaign.firstTo": "First to {n}",
    "campaign.level.l1": "Rookie",
    "campaign.level.l2": "Amateur",
    "campaign.level.l3": "Regular",
    "campaign.level.l4": "Veteran",
    "campaign.level.l5": "Pro",
    "campaign.level.l6": "Champion",

    // Tutorial
    "tutorial.skip": "Skip",
    "tutorial.next": "Next",
    "tutorial.back": "Back",
    "tutorial.start": "Start playing",
    "tutorial.intro.title": "Welcome to Cap Kickers",
    "tutorial.intro.body": "Flick your bottle caps across the pitch and score in the goal. Here's the trick to it.",
    "tutorial.flick.title": "Flick, don't aim",
    "tutorial.flick.body": "You control three caps. Just flick one with your finger — the quicker and harder the flick, the farther it goes. A gentle flick barely moves it, so no arrows, no aiming.",
    "tutorial.thread.title": "Thread the gap",
    "tutorial.thread.body": "Flick a cap so it passes BETWEEN your other two caps. Miss the gap and you lose your turn.",
    "tutorial.advance.title": "Advance up the pitch",
    "tutorial.advance.body": "You get five touches per turn. Keep threading the gap to work the caps toward the goal.",
    "tutorial.shoot.title": "Shoot!",
    "tutorial.shoot.body": "On your fifth touch the gate opens — fire at the goal and beat the keeper. First to the goal target wins the match.",
  },

  "pt-BR": {
    // Common
    "common.back": "Voltar",
    "common.done": "Pronto",

    // Home / menu
    "home.tagline": "Dê petelecos nas tampinhas pelo campo e faça gols.",
    "home.campaign": "Campanha",
    "home.passPlay": "Passa e Joga",
    "home.practice": "Treino",
    "home.soloVsAi": "Contra a Máquina",
    "home.settings": "Ajustes",
    "home.howToPlay": "Como Jogar",
    "diff.easy": "Fácil",
    "diff.normal": "Normal",
    "diff.hard": "Difícil",

    // Play HUD + overlays
    "play.playerTouch": "Jogador {n} — toque {t}/{shot}",
    "play.aiTouch": "Máquina — toque {t}/{shot}",
    "play.playerWins": "Jogador {n} venceu!",
    "play.goal": "GOL!",
    "play.turnOver": "Perdeu a vez",
    "play.menu": "⌂ Menu",
    "play.newMatch": "Nova partida",
    "play.passPhone": "Passe o celular para o Jogador {n}",
    "play.ready": "Pronto",
    "play.soClose": "Quase!",
    "play.watchPrompt": "Assistir a um anúncio rápido para bater mais uma vez?",
    "play.watchShoot": "▶ Assistir e chutar",
    "play.noThanks": "Não, obrigado",
    "play.levelComplete": "Fase concluída!",
    "play.campaignComplete": "Campanha concluída!",
    "play.nextLevel": "Próxima fase",
    "play.backToCampaign": "Voltar à campanha",
    "play.youLost": "Você perdeu",
    "play.tryAgain": "Tentar de novo",
    "play.rematch": "Revanche",

    // Settings
    "settings.title": "Ajustes",
    "settings.soundFx": "Efeitos sonoros",
    "settings.music": "Música",
    "settings.vibration": "Vibração",
    "settings.pitch": "Campo",
    "settings.yourCap": "Sua Tampinha",
    "settings.language": "Idioma",
    "settings.aboutLegal": "Sobre e Jurídico",

    // Pitch picker
    "pitch.title": "Campo",
    "pitch.subtitle": "Jogue em qualquer lugar — escolha a superfície.",
    "pitch.grass": "Grama",
    "pitch.school": "Carteira",
    "pitch.table": "Mesa",
    "pitch.cement": "Cimento",

    // Cap picker
    "caps.title": "Sua Tampinha",
    "caps.subtitle": "Escolha sua tampinha. O adversário fica com uma de cor diferente.",

    // Campaign
    "campaign.title": "Campanha",
    "campaign.subtitle": "Vença cada rival para desbloquear o próximo.",
    "campaign.locked": "Bloqueado",
    "campaign.play": "Jogar",
    "campaign.done": "Concluído",
    "campaign.firstTo": "Até {n} gols",
    "campaign.level.l1": "Iniciante",
    "campaign.level.l2": "Amador",
    "campaign.level.l3": "Regular",
    "campaign.level.l4": "Veterano",
    "campaign.level.l5": "Profissional",
    "campaign.level.l6": "Campeão",

    // Tutorial
    "tutorial.skip": "Pular",
    "tutorial.next": "Próximo",
    "tutorial.back": "Voltar",
    "tutorial.start": "Começar a jogar",
    "tutorial.intro.title": "Bem-vindo ao Cap Kickers",
    "tutorial.intro.body": "Dê petelecos nas suas tampinhas pelo campo e faça gol. Veja o segredo.",
    "tutorial.flick.title": "Peteleco, sem mira",
    "tutorial.flick.body": "Você controla três tampinhas. Basta dar um peteleco com o dedo — quanto mais rápido e forte, mais longe ela vai. Um peteleco fraco quase não move, então nada de setas ou mira.",
    "tutorial.thread.title": "Passe pelo meio",
    "tutorial.thread.body": "Dê um peteleco para a tampinha passar ENTRE as outras duas. Se errar o vão, você perde a vez.",
    "tutorial.advance.title": "Avance pelo campo",
    "tutorial.advance.body": "Você tem cinco toques por vez. Continue passando pelo meio para levar as tampinhas até o gol.",
    "tutorial.shoot.title": "Chute!",
    "tutorial.shoot.body": "No quinto toque o caminho abre — chute no gol e vença o goleiro. Quem atingir a meta de gols primeiro vence a partida.",
  },
};
