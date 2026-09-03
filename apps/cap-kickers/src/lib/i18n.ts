/**
 * Tiny in-app localization — no dependency. English + Portuguese (BR) + Spanish.
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

export type Locale = "en" | "pt-BR" | "es";
export const LOCALES: Locale[] = ["en", "pt-BR", "es"];
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português",
  es: "Español",
};

const KEY = "capkickers.locale.v1";

const deviceDefault = (): Locale => {
  const l = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en";
  const low = l.toLowerCase();
  if (low.startsWith("pt")) return "pt-BR";
  if (low.startsWith("es")) return "es";
  return "en";
};

const loadLocale = (): Locale => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw === "en" || raw === "pt-BR" || raw === "es") return raw;
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

/** Every key defined for a locale — used by the parity test. */
export const localeKeys = (lang: Locale): string[] => Object.keys(STRINGS[lang]);

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
    "home.passPlay": "2 Players",
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
    "play.watchPrompt": "Want to try that flick again? Watch a short video and take the shot.",
    "play.watchShoot": "▶ Watch video · Try again",
    "play.noThanks": "Skip",
    "play.middleHint": "Start with the middle cap",
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
    "settings.analytics": "Usage Analytics",
    "settings.analyticsDesc": "Share anonymous usage to help improve the game.",
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
    "tutorial.dontShow": "Don't show this again",
    "tutorial.intro.title": "Meet your team",
    "tutorial.intro.body": "You play with three bottle caps. Flick them up the pitch and score in the goal to win.",
    "tutorial.middle.title": "Start with the middle cap",
    "tutorial.middle.body": "Every turn, take your FIRST flick with the middle cap. It sits between the other two, so it has the clearest lane forward.",
    "tutorial.flick.title": "Flick, don't aim",
    "tutorial.flick.body": "Flick a cap with your finger — the faster and harder you flick, the farther it travels. No arrows, no aiming.",
    "tutorial.thread.title": "Pass between your caps",
    "tutorial.thread.body": "A flick only counts if the cap passes BETWEEN your other two caps. Miss that gap and you lose your turn.",
    "tutorial.advance.title": "Five touches to the goal",
    "tutorial.advance.body": "You get five touches per turn. Keep threading between your caps to work up the pitch — the goal stays locked until your 4th touch.",
    "tutorial.shoot.title": "Shoot on touch 4 or 5",
    "tutorial.shoot.body": "Only your 4th and 5th touches can score. Touch 4 is a risky early shot — the keeper almost always saves it, but a rebound that stays in play earns you touch 5. On touch 5, thread the shot between your two caps to slip past the keeper.",

    // Legal (About / Privacy / Terms)
    "legal.about": "About",
    "legal.privacy": "Privacy",
    "legal.terms": "Terms",
    "legal.updated": "Last updated: {date}",
    "about.intro": "Cap Kickers is a fast, physics-driven finger-flick soccer game inspired by Brazilian bottle-cap soccer — futebol de tampinhas. Flick your caps across the pitch, thread them between your defenders, and beat the keeper to score.",
    "about.madeBy": "Made by {studio}. Version {version}.",
    "about.legalH": "Legal",
    "about.privacyLink": "Privacy Policy ›",
    "about.termsLink": "Terms of Use ›",
    "about.contactH": "Contact",
    "about.contactBody": "Questions or feedback? Reach us at {email}.",
    "privacy.lead": "{studio} (“we”) built Cap Kickers to be fun and private. This policy explains what data the app handles.",
    "privacy.collectH": "What we collect",
    "privacy.collectBody": "We do not require an account and do not ask you for personal information. Your game settings, chosen cap and pitch, and campaign progress are stored only on your device and are not sent to us.",
    "privacy.analyticsH": "Usage analytics",
    "privacy.analyticsBody":
      "We use Google Analytics for Firebase to understand how the game is played — which levels get completed, where players leave the tutorial, and which languages and settings are used. These reports are anonymous and aggregated; they include an app-instance identifier, device model, OS version, and approximate country derived from your IP address. We do not collect your name, email, or precise location, and we do not link this data to your identity. We also receive aggregated ad-revenue reporting through the AdMob–Firebase link.",
    "privacy.adsH": "Advertising",
    "privacy.adsBody1": "Cap Kickers is free and supported by ads through Google AdMob. To show and measure ads, Google may collect and process device information, including advertising identifiers (such as Apple's IDFA) and general usage data.",
    "privacy.adsBody2": "On iOS we ask your permission through Apple's App Tracking Transparency prompt before any tracking. You can decline, and you can change your choice anytime in iOS Settings → Privacy & Security → Tracking. Declining still lets you play; you may simply see less-relevant ads.",
    "privacy.adsBody3": "Learn more in Google's Privacy Policy (policies.google.com/privacy) and how Google uses data from apps that use its services (policies.google.com/technologies/partner-sites).",
    "privacy.childrenH": "Children",
    "privacy.childrenBody": "Cap Kickers is intended for a general audience and is not directed to children under 13. We do not knowingly collect personal information from children.",
    "privacy.choicesH": "Your choices",
    "privacy.choicesBody":
      "You can turn usage analytics off at any time in Settings → Usage Analytics. Manage ad tracking through the iOS Tracking settings above. Deleting the app removes the settings and progress stored on your device.",
    "privacy.changesH": "Changes & contact",
    "privacy.changesBody": "We may update this policy; the date above shows the latest version. Questions? Email us at {email}.",
    "terms.lead": "By downloading or playing Cap Kickers (“the game”), you agree to these terms. If you do not agree, please do not use the game.",
    "terms.licenseH": "License",
    "terms.licenseBody": "{studio} grants you a personal, non-exclusive, non-transferable license to install and play the game for your own non-commercial entertainment.",
    "terms.fairH": "Fair use",
    "terms.fairBody": "Please don't reverse-engineer, tamper with, or attempt to disrupt the game or its ads, or use it in any unlawful way.",
    "terms.adsH": "Ads & cost",
    "terms.adsBody": "The game is free and supported by advertising served through Google AdMob. We may add or change ad placements over time.",
    "terms.warrantyH": "No warranty",
    "terms.warrantyBody": "The game is provided “as is,” without warranties of any kind. We do not guarantee it will be uninterrupted or error-free.",
    "terms.liabilityH": "Limitation of liability",
    "terms.liabilityBody": "To the fullest extent permitted by law, {studio} is not liable for any indirect or incidental damages arising from your use of the game.",
    "terms.changesH": "Changes & governing law",
    "terms.changesBody": "We may update the game and these terms; continued play means you accept the changes. These terms are governed by the laws of {state}, USA.",
    "terms.contactH": "Contact",
    "terms.contactBody": "Questions about these terms? Email {email}.",
    "settings.ambience": "Stadium Sound",
    "home.cabinet": "Cabinet",
    "cabinet.title": "Trophy Cabinet",
    "cabinet.subtitle": "Earn Caps by playing, then unlock cosmetics.",
    "cabinet.caps": "Caps",
    "cabinet.secPitches": "Pitches",
    "cabinet.secCaps": "Caps",
    "cabinet.secAudio": "Audio",
    "cabinet.unlock": "Unlock",
    "cabinet.equip": "Equip",
    "cabinet.equipped": "Equipped",
    "cabinet.owned": "Owned",
    "cabinet.watch": "Watch ad · +{n}",
    "cabinet.watchDone": "Back tomorrow",
    "cabinet.watchLoading": "Loading ad…",
    "cabinet.noAd": "No ad available — try again",
    "cabinet.reqVeteran": "Beat the Veteran",
    "cabinet.reqCampaign": "Finish the campaign",
    "cabinet.packCrowd": "Crowd Pack",
    "cabinet.packStadium": "Stadium Ambience",
    "cabinet.preview": "Preview",
    "cabinet.locked": "Locked",
  },

  "pt-BR": {
    // Common
    "common.back": "Voltar",
    "common.done": "Pronto",

    // Home / menu
    "home.tagline": "Dê petelecos nas tampinhas pelo campo e faça gols.",
    "home.campaign": "Campanha",
    "home.passPlay": "2 Jogadores",
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
    "play.watchPrompt": "Quer tentar esse peteleco de novo? Assista a um vídeo rápido e chute.",
    "play.watchShoot": "▶ Ver vídeo · Tentar de novo",
    "play.noThanks": "Pular",
    "play.middleHint": "Comece pela tampinha do meio",
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
    "settings.analytics": "Análises de uso",
    "settings.analyticsDesc": "Compartilhe dados anônimos de uso para ajudar a melhorar o jogo.",
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
    "tutorial.dontShow": "Não mostrar de novo",
    "tutorial.intro.title": "Conheça seu time",
    "tutorial.intro.body": "Você joga com três tampinhas. Dê petelecos pelo campo e faça gol para vencer.",
    "tutorial.middle.title": "Comece pela tampinha do meio",
    "tutorial.middle.body": "Toda rodada, dê seu PRIMEIRO peteleco na tampinha do meio. Ela fica entre as outras duas, então tem o caminho mais livre à frente.",
    "tutorial.flick.title": "Peteleco, sem mira",
    "tutorial.flick.body": "Dê um peteleco na tampinha com o dedo — quanto mais rápido e forte, mais longe ela vai. Nada de setas ou mira.",
    "tutorial.thread.title": "Passe pelo meio",
    "tutorial.thread.body": "O peteleco só vale se a tampinha passar ENTRE as outras duas. Se errar o vão, você perde a vez.",
    "tutorial.advance.title": "Cinco toques até o gol",
    "tutorial.advance.body": "Você tem cinco toques por vez. Continue passando entre suas tampinhas para subir no campo — o gol fica travado até o 4º toque.",
    "tutorial.shoot.title": "Chute no 4º ou 5º toque",
    "tutorial.shoot.body": "Só o 4º e o 5º toques podem fazer gol. O 4º é um chute arriscado — o goleiro quase sempre defende, mas um rebote em jogo te dá o 5º toque. No 5º, passe o chute entre suas duas tampinhas para vencer o goleiro.",

    // Legal (Sobre / Privacidade / Termos)
    "legal.about": "Sobre",
    "legal.privacy": "Privacidade",
    "legal.terms": "Termos",
    "legal.updated": "Última atualização: {date}",
    "about.intro": "O Cap Kickers é um jogo de futebol de peteleco, rápido e com física de verdade, inspirado no futebol de tampinhas brasileiro. Dê petelecos nas tampinhas pelo campo, passe entre seus defensores e vença o goleiro para fazer o gol.",
    "about.madeBy": "Feito por {studio}. Versão {version}.",
    "about.legalH": "Jurídico",
    "about.privacyLink": "Política de Privacidade ›",
    "about.termsLink": "Termos de Uso ›",
    "about.contactH": "Contato",
    "about.contactBody": "Dúvidas ou sugestões? Fale com a gente em {email}.",
    "privacy.lead": "A {studio} (“nós”) criou o Cap Kickers para ser divertido e respeitar sua privacidade. Esta política explica quais dados o app utiliza.",
    "privacy.collectH": "O que coletamos",
    "privacy.collectBody": "Não exigimos conta nem pedimos informações pessoais. Seus ajustes, a tampinha e o campo escolhidos e o progresso da campanha ficam salvos apenas no seu aparelho e não são enviados para nós.",
    "privacy.analyticsH": "Análises de uso",
    "privacy.analyticsBody":
      "Usamos o Google Analytics para Firebase para entender como o jogo é jogado: quais fases são concluídas, onde os jogadores abandonam o tutorial e quais idiomas e ajustes são usados. Esses relatórios são anônimos e agregados; incluem um identificador de instância do app, o modelo do aparelho, a versão do sistema e o país aproximado deduzido do seu endereço IP. Não coletamos seu nome, e-mail ou localização precisa, e não vinculamos esses dados à sua identidade. Também recebemos relatórios agregados de receita de anúncios pela integração entre AdMob e Firebase.",
    "privacy.adsH": "Publicidade",
    "privacy.adsBody1": "O Cap Kickers é gratuito e mantido por anúncios do Google AdMob. Para exibir e medir anúncios, o Google pode coletar e processar informações do aparelho, incluindo identificadores de publicidade (como o IDFA da Apple) e dados gerais de uso.",
    "privacy.adsBody2": "No iOS, pedimos sua permissão pelo aviso de Transparência no Rastreamento de Apps da Apple antes de qualquer rastreamento. Você pode recusar e mudar sua escolha quando quiser em Ajustes do iOS → Privacidade e Segurança → Rastreamento. Recusar não impede de jogar; você apenas verá anúncios menos relevantes.",
    "privacy.adsBody3": "Saiba mais na Política de Privacidade do Google (policies.google.com/privacy) e em como o Google usa dados de apps que utilizam seus serviços (policies.google.com/technologies/partner-sites).",
    "privacy.childrenH": "Crianças",
    "privacy.childrenBody": "O Cap Kickers é destinado ao público geral e não é direcionado a menores de 13 anos. Não coletamos intencionalmente informações pessoais de crianças.",
    "privacy.choicesH": "Suas opções",
    "privacy.choicesBody":
      "Você pode desativar as análises de uso quando quiser em Ajustes → Análises de uso. Gerencie o rastreamento de anúncios nos ajustes de Rastreamento do iOS acima. Apagar o app remove os ajustes e o progresso salvos no seu aparelho.",
    "privacy.changesH": "Alterações e contato",
    "privacy.changesBody": "Podemos atualizar esta política; a data acima indica a versão mais recente. Dúvidas? Escreva para {email}.",
    "terms.lead": "Ao baixar ou jogar o Cap Kickers (“o jogo”), você concorda com estes termos. Se não concordar, não use o jogo.",
    "terms.licenseH": "Licença",
    "terms.licenseBody": "A {studio} concede a você uma licença pessoal, não exclusiva e intransferível para instalar e jogar o jogo para seu próprio entretenimento não comercial.",
    "terms.fairH": "Uso adequado",
    "terms.fairBody": "Não faça engenharia reversa, não altere nem tente atrapalhar o jogo ou seus anúncios, e não o use de forma ilegal.",
    "terms.adsH": "Anúncios e custo",
    "terms.adsBody": "O jogo é gratuito e mantido por anúncios exibidos pelo Google AdMob. Podemos adicionar ou alterar os espaços de anúncios ao longo do tempo.",
    "terms.warrantyH": "Sem garantias",
    "terms.warrantyBody": "O jogo é fornecido “no estado em que se encontra”, sem garantias de qualquer tipo. Não garantimos que funcionará sem interrupções ou erros.",
    "terms.liabilityH": "Limitação de responsabilidade",
    "terms.liabilityBody": "Na máxima extensão permitida por lei, a {studio} não se responsabiliza por danos indiretos ou incidentais decorrentes do uso do jogo.",
    "terms.changesH": "Alterações e legislação aplicável",
    "terms.changesBody": "Podemos atualizar o jogo e estes termos; continuar jogando significa que você aceita as alterações. Estes termos são regidos pelas leis de {state}, EUA.",
    "terms.contactH": "Contato",
    "terms.contactBody": "Dúvidas sobre estes termos? Escreva para {email}.",
    "settings.ambience": "Som de Estádio",
    "home.cabinet": "Vitrine",
    "cabinet.title": "Vitrine de Troféus",
    "cabinet.subtitle": "Ganhe Tampas jogando e desbloqueie itens.",
    "cabinet.caps": "Tampas",
    "cabinet.secPitches": "Campos",
    "cabinet.secCaps": "Tampinhas",
    "cabinet.secAudio": "Áudio",
    "cabinet.unlock": "Desbloquear",
    "cabinet.equip": "Equipar",
    "cabinet.equipped": "Equipado",
    "cabinet.owned": "Adquirido",
    "cabinet.watch": "Ver anúncio · +{n}",
    "cabinet.watchDone": "Volte amanhã",
    "cabinet.watchLoading": "Carregando anúncio…",
    "cabinet.noAd": "Nenhum anúncio disponível — tente de novo",
    "cabinet.reqVeteran": "Vença o Veterano",
    "cabinet.reqCampaign": "Complete a campanha",
    "cabinet.packCrowd": "Pacote de Torcida",
    "cabinet.packStadium": "Ambiente de Estádio",
    "cabinet.preview": "Ouvir",
    "cabinet.locked": "Bloqueado",
  },
  es: {
    // Common
    "common.back": "Volver",
    "common.done": "Listo",

    // Home / menu
    "home.tagline": "Impulsa las tapitas por la cancha con un toque del dedo y mete goles.",
    "home.campaign": "Campaña",
    "home.passPlay": "2 Jugadores",
    "home.practice": "Práctica",
    "home.soloVsAi": "Contra la Máquina",
    "home.settings": "Ajustes",
    "home.howToPlay": "Cómo Jugar",
    "diff.easy": "Fácil",
    "diff.normal": "Normal",
    "diff.hard": "Difícil",

    // Play HUD + overlays
    "play.playerTouch": "Jugador {n} — toque {t}/{shot}",
    "play.aiTouch": "Máquina — toque {t}/{shot}",
    "play.playerWins": "¡Gana el Jugador {n}!",
    "play.goal": "¡GOL!",
    "play.turnOver": "Perdiste el turno",
    "play.menu": "⌂ Menú",
    "play.newMatch": "Nuevo partido",
    "play.passPhone": "Pásale el teléfono al Jugador {n}",
    "play.ready": "Listo",
    "play.soClose": "¡Por poco!",
    "play.watchPrompt": "¿Quieres intentar ese tiro otra vez? Mira un video corto y dispara.",
    "play.watchShoot": "▶ Ver video · Intentar de nuevo",
    "play.noThanks": "Saltar",
    "play.middleHint": "Empieza con la tapita del medio",
    "play.levelComplete": "¡Nivel completado!",
    "play.campaignComplete": "¡Campaña completada!",
    "play.nextLevel": "Siguiente nivel",
    "play.backToCampaign": "Volver a la campaña",
    "play.youLost": "Perdiste",
    "play.tryAgain": "Intentar de nuevo",
    "play.rematch": "Revancha",

    // Settings
    "settings.title": "Ajustes",
    "settings.soundFx": "Efectos de sonido",
    "settings.music": "Música",
    "settings.vibration": "Vibración",
    "settings.pitch": "Cancha",
    "settings.yourCap": "Tu Tapita",
    "settings.language": "Idioma",
    "settings.analytics": "Análisis de uso",
    "settings.analyticsDesc": "Comparte datos anónimos de uso para ayudar a mejorar el juego.",
    "settings.aboutLegal": "Acerca de y Legal",

    // Pitch picker
    "pitch.title": "Cancha",
    "pitch.subtitle": "Juega donde sea: elige la superficie.",
    "pitch.grass": "Pasto",
    "pitch.school": "Pupitre",
    "pitch.table": "Mesa",
    "pitch.cement": "Cemento",

    // Cap picker
    "caps.title": "Tu Tapita",
    "caps.subtitle": "Elige tu tapita. Tu rival recibe una de color distinto.",

    // Campaign
    "campaign.title": "Campaña",
    "campaign.subtitle": "Vence a cada rival para desbloquear el siguiente.",
    "campaign.locked": "Bloqueado",
    "campaign.play": "Jugar",
    "campaign.done": "Completado",
    "campaign.firstTo": "Primero en llegar a {n}",
    "campaign.level.l1": "Novato",
    "campaign.level.l2": "Aficionado",
    "campaign.level.l3": "Regular",
    "campaign.level.l4": "Veterano",
    "campaign.level.l5": "Profesional",
    "campaign.level.l6": "Campeón",

    // Tutorial
    "tutorial.skip": "Saltar",
    "tutorial.next": "Siguiente",
    "tutorial.back": "Volver",
    "tutorial.start": "Empezar a jugar",
    "tutorial.dontShow": "No mostrar de nuevo",
    "tutorial.intro.title": "Conoce tu equipo",
    "tutorial.intro.body": "Juegas con tres tapitas. Dales un toque por la cancha y mete gol para ganar.",
    "tutorial.middle.title": "Empieza con la tapita del medio",
    "tutorial.middle.body": "En cada turno, da tu PRIMER toque con la tapita del medio. Está entre las otras dos, así que tiene el camino más libre hacia adelante.",
    "tutorial.flick.title": "Toque, sin apuntar",
    "tutorial.flick.body": "Dale un toque a una tapita con el dedo: mientras más rápido y fuerte, más lejos llega. No hay flechas ni mira.",
    "tutorial.thread.title": "Pasa entre tus tapitas",
    "tutorial.thread.body": "El toque solo cuenta si la tapita pasa ENTRE las otras dos. Si fallas el hueco, pierdes el turno.",
    "tutorial.advance.title": "Cinco toques hasta el gol",
    "tutorial.advance.body": "Tienes cinco toques por turno. Sigue pasando entre tus tapitas para avanzar por la cancha — la portería queda bloqueada hasta tu 4º toque.",
    "tutorial.shoot.title": "Dispara en el toque 4 o 5",
    "tutorial.shoot.body": "Solo tu 4º y 5º toque pueden marcar. El 4º es un tiro arriesgado — el portero casi siempre ataja, pero un rebote en juego te da el 5º toque. En el 5º, pasa el tiro entre tus dos tapitas para superar al portero.",

    // Legal (Acerca de / Privacidad / Términos)
    "legal.about": "Acerca de",
    "legal.privacy": "Privacidad",
    "legal.terms": "Términos",
    "legal.updated": "Última actualización: {date}",
    "about.intro": "Cap Kickers es un juego de fútbol de tapitas rápido y con física real, inspirado en el fútbol de tampinhas brasileño. Impulsa tus tapitas por la cancha, pásalas entre tus defensores y vence al portero para meter gol.",
    "about.madeBy": "Hecho por {studio}. Versión {version}.",
    "about.legalH": "Legal",
    "about.privacyLink": "Política de Privacidad ›",
    "about.termsLink": "Términos de Uso ›",
    "about.contactH": "Contacto",
    "about.contactBody": "¿Dudas o comentarios? Escríbenos a {email}.",
    "privacy.lead": "{studio} (“nosotros”) creó Cap Kickers para que sea divertido y respete tu privacidad. Esta política explica qué datos maneja la aplicación.",
    "privacy.collectH": "Qué recopilamos",
    "privacy.collectBody": "No requerimos una cuenta ni te pedimos información personal. Tus ajustes, la tapita y la cancha que elijas y tu progreso en la campaña se guardan únicamente en tu dispositivo y no se nos envían.",
    "privacy.analyticsH": "Análisis de uso",
    "privacy.analyticsBody":
      "Usamos Google Analytics para Firebase para entender cómo se juega: qué niveles se completan, dónde se abandona el tutorial y qué idiomas y ajustes se usan. Estos informes son anónimos y agregados; incluyen un identificador de instancia de la aplicación, el modelo del dispositivo, la versión del sistema y el país aproximado deducido de tu dirección IP. No recopilamos tu nombre, tu correo ni tu ubicación precisa, y no vinculamos estos datos con tu identidad. También recibimos informes agregados de ingresos por anuncios mediante la vinculación entre AdMob y Firebase.",
    "privacy.adsH": "Publicidad",
    "privacy.adsBody1": "Cap Kickers es gratuito y se mantiene con anuncios de Google AdMob. Para mostrar y medir anuncios, Google puede recopilar y procesar información del dispositivo, incluidos identificadores de publicidad (como el IDFA de Apple) y datos generales de uso.",
    "privacy.adsBody2": "En iOS te pedimos permiso mediante el aviso de Transparencia de Seguimiento de Apps de Apple antes de cualquier seguimiento. Puedes rechazarlo y cambiar tu elección cuando quieras en Ajustes de iOS → Privacidad y Seguridad → Rastreo. Rechazar no te impide jugar; simplemente verás anuncios menos relevantes.",
    "privacy.adsBody3": "Más información en la Política de Privacidad de Google (policies.google.com/privacy) y en cómo Google usa los datos de las apps que utilizan sus servicios (policies.google.com/technologies/partner-sites).",
    "privacy.childrenH": "Menores",
    "privacy.childrenBody": "Cap Kickers está dirigido al público general y no a menores de 13 años. No recopilamos intencionalmente información personal de niños.",
    "privacy.choicesH": "Tus opciones",
    "privacy.choicesBody":
      "Puedes desactivar el análisis de uso cuando quieras en Ajustes → Análisis de uso. Administra el seguimiento de anuncios en los ajustes de Rastreo de iOS mencionados arriba. Eliminar la aplicación borra los ajustes y el progreso guardados en tu dispositivo.",
    "privacy.changesH": "Cambios y contacto",
    "privacy.changesBody": "Podemos actualizar esta política; la fecha de arriba indica la versión más reciente. ¿Dudas? Escríbenos a {email}.",
    "terms.lead": "Al descargar o jugar Cap Kickers (“el juego”), aceptas estos términos. Si no estás de acuerdo, no uses el juego.",
    "terms.licenseH": "Licencia",
    "terms.licenseBody": "{studio} te concede una licencia personal, no exclusiva e intransferible para instalar y jugar el juego para tu propio entretenimiento no comercial.",
    "terms.fairH": "Uso adecuado",
    "terms.fairBody": "No hagas ingeniería inversa, no alteres ni intentes interrumpir el juego o sus anuncios, y no lo uses de forma ilegal.",
    "terms.adsH": "Anuncios y costo",
    "terms.adsBody": "El juego es gratuito y se mantiene con publicidad servida por Google AdMob. Podemos agregar o cambiar los espacios publicitarios con el tiempo.",
    "terms.warrantyH": "Sin garantías",
    "terms.warrantyBody": "El juego se ofrece “tal cual”, sin garantías de ningún tipo. No garantizamos que funcione sin interrupciones ni errores.",
    "terms.liabilityH": "Limitación de responsabilidad",
    "terms.liabilityBody": "En la máxima medida permitida por la ley, {studio} no se responsabiliza por daños indirectos o incidentales derivados de tu uso del juego.",
    "terms.changesH": "Cambios y legislación aplicable",
    "terms.changesBody": "Podemos actualizar el juego y estos términos; seguir jugando significa que aceptas los cambios. Estos términos se rigen por las leyes de {state}, EE. UU.",
    "terms.contactH": "Contacto",
    "terms.contactBody": "¿Dudas sobre estos términos? Escribe a {email}.",
    "settings.ambience": "Sonido de Estadio",
    "home.cabinet": "Vitrina",
    "cabinet.title": "Vitrina de Trofeos",
    "cabinet.subtitle": "Gana Tapas jugando y desbloquea cosméticos.",
    "cabinet.caps": "Tapas",
    "cabinet.secPitches": "Canchas",
    "cabinet.secCaps": "Tapitas",
    "cabinet.secAudio": "Audio",
    "cabinet.unlock": "Desbloquear",
    "cabinet.equip": "Equipar",
    "cabinet.equipped": "Equipado",
    "cabinet.owned": "Adquirido",
    "cabinet.watch": "Ver anuncio · +{n}",
    "cabinet.watchDone": "Vuelve mañana",
    "cabinet.watchLoading": "Cargando anuncio…",
    "cabinet.noAd": "No hay anuncio disponible — inténtalo de nuevo",
    "cabinet.reqVeteran": "Vence al Veterano",
    "cabinet.reqCampaign": "Completa la campaña",
    "cabinet.packCrowd": "Pack de Público",
    "cabinet.packStadium": "Ambiente de Estadio",
    "cabinet.preview": "Escuchar",
    "cabinet.locked": "Bloqueado",
  },
};
