/**
 * Tiny in-app localization — no dependency.
 *
 * Language is detected ONCE at module load, synchronously, from the device
 * language (in the Capacitor webview `navigator.language` reflects the device
 * setting). pt-* → Portuguese, es-* → Spanish, everything else → English. There
 * is no runtime language switch: the app follows the device, so there's no flash
 * / hydration mismatch.
 *
 * `t(key, params?)` looks up STRINGS[LANG][key], falls back to the English
 * string, then to the key itself, and interpolates `{name}` placeholders from
 * `params`. Placeholders with no matching param are left intact (used e.g. to
 * splice a link into `about.support`).
 */

export type Lang = "en" | "pt" | "es";

const NAV_LANG = (
  typeof navigator !== "undefined" && navigator.language ? navigator.language : "en"
).toLowerCase();
export const LANG: Lang = NAV_LANG.startsWith("pt")
  ? "pt"
  : NAV_LANG.startsWith("es")
    ? "es"
    : "en";

// Reflect the UI language on <html lang> for accessibility / screen readers.
if (typeof document !== "undefined") {
  document.documentElement.lang = LANG;
}

type Params = Record<string, string | number>;

export const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    // Home
    "home.title": "Zen Bubbles",
    "home.tagline":
      "Soothing phases of ever-shrinking bubbles. Pop them all as fast as you can to beat your record.",
    "home.play": "Play",
    "home.zen": "Pop for Fun",
    "home.timeAttack": "Time Attack",
    "home.difficulty": "Difficulty",
    "home.diffEasy": "Easy",
    "home.diffNormal": "Normal",
    "home.diffHard": "Hard",
    "home.daily": "Pop Challenge",
    "home.dailyPlay": "Play today",
    "home.dailyBest": "Today's best: {score}",
    "home.dailyNew": "New challenge today · a fresh one tomorrow",
    "home.viewRecords": "View records",
    "nav.settings": "Settings",
    "nav.about": "About",
    "nav.privacy": "Privacy",
    "nav.terms": "Terms",

    // Daily bonus (P1-T5)
    "bonus.title": "Daily Bonus",
    "bonus.day": "Day {n}",
    "bonus.reward": "+{coins} coins",
    "bonus.line": "Welcome back — drop in each day to grow your streak.",
    "bonus.claim": "Claim",
    "bonus.close": "Close",

    // Onboarding + loading (P1-T10)
    "onboarding.title": "How to Play",
    "onboarding.intro": "Two ways to play:",
    "onboarding.challengeTitle": "Pop Challenge",
    "onboarding.challengeTag": "Timed",
    "onboarding.challengeRule1": "Clear every bubble in a stage before the timer runs out.",
    "onboarding.challengeRule2":
      "Pop in quick succession to chain combos — bigger chains score more.",
    "onboarding.challengeRule3":
      "Every 8 stages you enter a new world with a twist: off-grid, then drifting, then shielded bubbles.",
    "onboarding.challengeRule4":
      "Earn coins to buy Bombs & Time Freeze, and watch a video to revive when time runs out.",
    "onboarding.funTitle": "Pop for Fun",
    "onboarding.funTag": "Relaxed · endless",
    "onboarding.funDesc":
      "No timer, no score — just pop to unwind. A fresh sheet appears each time you clear one.",
    "onboarding.step1": "Tap the bubbles to pop them — feel each one.",
    "onboarding.step2": "Clear every bubble to finish a phase. They shrink as you go.",
    "onboarding.step3": "Pop fast for combos and beat your best score.",
    "onboarding.cta": "Start popping",
    "loading.tagline": "Relax and pop.",

    // Shop (§6)
    "shop.title": "Shop",
    "shop.skins": "Bubble skins",
    "shop.zenSkins": "Zen skins",
    "shop.equip": "Equip",
    "shop.equipped": "Equipped",
    "shop.watchDiscount": "−{pct}%",
    "shop.watchEarn": "Watch a video · +{coins} coins",
    "shop.items": "Power-ups",
    "rarity.common": "Common",
    "rarity.uncommon": "Uncommon",
    "rarity.rare": "Rare",
    "rarity.premium": "Premium",
    "items.restock": "Stock up",
    "items.bomb": "Bomb",
    "items.freeze": "Time Freeze",
    "items.bombDesc": "Pop a whole cluster in one tap.",
    "items.freezeDesc": "Add seconds to the clock in a stage.",
    "items.bombArmed": "Bomb armed — tap a bubble",
    "items.frozen": "Frozen +{s}s",
    "home.shop": "Shop",
    "home.streak": "Day {n}",

    // Objectives (§8)
    "obj.pop": "Pop {n} bubbles",
    "obj.combo": "Hit a ×{n} combo",
    "obj.golden": "Pop {n} golden",
    "obj.phases": "Clear {n} phases",
    "obj.fast": "Clear a phase < {n}s",
    "obj.complete": "Objective! +{coins}",
    "challenge.goalsTitle": "Today's goals",
    "challenge.goalsHint": "Tap any bubble to start",
    "challenge.progressTitle": "Challenge progress",
    "challenge.allDone": "All goals complete!",

    // Achievements (§10)
    "ach.title": "Achievements",
    "ach.unlocked": "Achievement unlocked",
    "ach.pop": "Pop {n} bubbles",
    "ach.streak": "{n}-day streak",
    "ach.combo": "Reach a ×{n} combo",
    "ach.golden": "Pop {n} golden",
    "ach.skins": "Own {n} skins",
    "ach.revive": "Use your first revive",
    "ach.statPopped": "Popped",
    "ach.statCombo": "Best combo",
    "ach.statStreak": "Streak",
    "home.achievements": "Achievements",

    // Gameplay
    "play.exit": "← Exit",
    "play.phaseOf": "Phase {phase} of {total}",
    "play.worldPhase": "World {world} · {phase}/{per}",
    "play.bubblesLeft": "{n} bubbles left · Best: {best} pts",
    "play.tapToStart": "Tap any bubble to start",
    "world.label": "World",
    "world.skip": "Continue",
    "world.r1.name": "Bubble Wrap",
    "world.r1.desc": "Classic. Pop every bubble on the sheet.",
    "world.r2.name": "Off the Grid",
    "world.r2.desc": "Bubbles break formation — no more tidy rows.",
    "world.r3.name": "Drifters",
    "world.r3.desc": "Bubbles float around — tap dead-center to pop.",
    "world.r4.name": "Shields Up",
    "world.r4.desc": "Sliding shields guard the bubbles. Pop when they clear.",
    "play.phaseComplete": "Phase {phase} complete",
    "play.time": "Time {time}",
    "combo.milestone": "Combo ×{n}!",
    "play.comboBonus": "Best combo ×{n} · +{pts} pts",
    "play.newBestScore": "New best score! ",
    "play.newBestTime": "New best time! ",
    "play.bestLine": "Best {score} · {time}",
    "play.watchNext": "Watch ad · Next phase",
    "play.watchFinish": "Watch ad · Finish",
    "play.nextPhase": "Next phase",
    "play.finish": "Finish",
    "play.replayPhase": "Replay this phase",
    // P1-T4 — Time Attack countdown / rewarded revive
    "play.timeUp": "Time's up!",
    "play.timeUpLine": "Watch a short ad to keep going.",
    "play.revive": "Revive +{s}s",
    "play.endRun": "End run",

    // Phase names — full phrase (play header)
    phase1: "Extra Large bubbles",
    phase2: "Large bubbles",
    phase3: "Medium bubbles",
    phase4: "Small bubbles",
    phase5: "Tiny bubbles",
    phase6: "Micro bubbles",
    phase7: "Nano bubbles",
    phase8: "Speck bubbles",
    // Phase names — short label (records list, composed as "{label} · N bubbles")
    phaseShort1: "Extra Large",
    phaseShort2: "Large",
    phaseShort3: "Medium",
    phaseShort4: "Small",
    phaseShort5: "Tiny",
    phaseShort6: "Micro",
    phaseShort7: "Nano",
    phaseShort8: "Speck",

    // Finish
    "finish.newAllTime": "New all-time record",
    "finish.firstRecord": "First record set",
    "finish.youBeatBest": "You beat your best!",
    "finish.runComplete": "Run complete",
    "finish.soClose": "So close!",
    "finish.yourRun": "Your run · all phases",
    "finish.overOldBest": "▲ {delta} over your old best of {prev}",
    "finish.firstTotal": "This is your first all-time total — now go beat it.",
    "finish.allTimeBest": "All-time best:",
    "finish.pointsAway": "Just {n} points away",
    "finish.momentum": "Ride the momentum — see if you can push it even higher.",
    "finish.optimize": "Optimize your record",
    "finish.tryAgain": "Try again from the start",
    "finish.viewRecords": "View records",
    "finish.backHome": "Back home",
    "finish.coinsEarned": "+{coins} earned",
    "finish.doubleCoins": "Double coins",

    // Records
    "common.home": "← Home",
    "records.title": "Your records",
    "records.phase": "Phase {n}",
    "records.phaseLine": "{label} · {bubbles} bubbles",
    "records.noTime": "no time yet",
    "records.new": "New!",
    "records.last": "Last: {score} · {time}",
    "records.playFrom": "Play from Phase 1",
    "records.resetConfirmShort": "Reset all records?",

    // Settings
    "settings.title": "Settings",
    "settings.popSound": "Pop sound",
    "settings.popSoundDesc": "Play a soft pop when a bubble bursts.",
    "settings.music": "Music",
    "settings.musicDesc": "Background music on the home and results screens.",
    "settings.reduceMotion":
      'Motion is reduced automatically when your device has "Reduce Motion" turned on in accessibility settings.',
    "settings.vibration": "Vibration",
    "settings.vibrationDesc": "Feel a light tap each time a bubble pops.",
    // 1.1.0 adopts the generic wording (accurate on both iOS and Android), matching
    // the android-port copy fix — replaces the earlier "Works on iPhone only…".
    "settings.vibrationFollow": "Follows your device's system vibration setting.",
    "settings.analytics": "Analytics",
    "settings.analyticsDesc":
      "Share anonymous usage data to help improve the game. No personal info.",
    "settings.yourData": "Your data",
    "settings.dataDesc": "Records are stored only on this device. Resetting cannot be undone.",
    "settings.resetBtn": "Reset records",
    "settings.resetConfirm":
      "Reset all records? This will erase your best scores and times for every phase. This cannot be undone.",
    "settings.resetDone": "Records reset.",
    "settings.about": "About",
    "settings.howToPlayDesc": "A quick refresher on how to play.", // F6

    // Common / About links
    "link.aboutSupport": "About & Support",
    "link.privacyPolicy": "Privacy Policy",
    "link.termsOfUse": "Terms of Use",
    "common.backHome": "← Back home",

    // About page body
    "about.title": "About & Support",
    "about.intro":
      "Zen Bubbles is a simple relaxation game. Pop plastic bubbles across a series of soothing phases — bubbles shrink as you advance. The faster you clear a phase, the higher your score. Your best scores and best times are saved on your device so you can beat your own record over time.",
    "about.noAccountH": "No account required",
    "about.noAccount":
      "The App works fully offline and does not require sign-in. Records live on your device only.",
    "about.a11yH": "Accessibility",
    "about.a11y":
      'The App respects your system "Reduce Motion" setting and disables idle animations when enabled. Tap targets are sized for comfortable touch on phones.',
    "about.supportH": "Support",
    "about.support":
      "Need help, want to report a bug, or have a suggestion? Email us at {email}. We aim to respond within a few business days.",
    "about.legalH": "Legal",
  },

  pt: {
    // Home
    "home.title": "Plástico Bolha",
    "home.tagline":
      "Fases relaxantes com bolhas cada vez menores. Estoure todas o mais rápido que puder para superar o seu recorde.",
    "home.play": "Jogar",
    "home.zen": "Pop por Diversão",
    "home.timeAttack": "Contra o Tempo",
    "home.difficulty": "Dificuldade",
    "home.diffEasy": "Fácil",
    "home.diffNormal": "Normal",
    "home.diffHard": "Difícil",
    "home.daily": "Desafio Pop",
    "home.dailyPlay": "Jogar hoje",
    "home.dailyBest": "Melhor de hoje: {score}",
    "home.dailyNew": "Novo desafio hoje · outro amanhã",
    "home.viewRecords": "Ver recordes",
    "nav.settings": "Ajustes",
    "nav.about": "Sobre",
    "nav.privacy": "Privacidade",
    "nav.terms": "Termos",

    // Daily bonus (P1-T5)
    "bonus.title": "Bônus diário",
    "bonus.day": "Dia {n}",
    "bonus.reward": "+{coins} moedas",
    "bonus.line": "Que bom te ver! Volte todo dia para aumentar sua sequência.",
    "bonus.claim": "Resgatar",
    "bonus.close": "Fechar",

    // Onboarding + loading (P1-T10)
    "onboarding.title": "Como Jogar",
    "onboarding.intro": "Duas formas de jogar:",
    "onboarding.challengeTitle": "Desafio Pop",
    "onboarding.challengeTag": "Contra o tempo",
    "onboarding.challengeRule1": "Estoure todas as bolhas de uma fase antes do tempo acabar.",
    "onboarding.challengeRule2":
      "Estoure em sequência para emendar combos — sequências maiores pontuam mais.",
    "onboarding.challengeRule3":
      "A cada 8 fases você entra em um novo mundo com uma novidade: fora da linha, depois flutuantes e com escudos.",
    "onboarding.challengeRule4":
      "Ganhe moedas para comprar Bombas e Congelar Tempo, e assista a um vídeo para reviver quando o tempo acabar.",
    "onboarding.funTitle": "Pop por Diversão",
    "onboarding.funTag": "Relaxante · infinito",
    "onboarding.funDesc":
      "Sem tempo, sem pontuação — só estoure para relaxar. Uma nova cartela aparece a cada vez que você limpa a tela.",
    "onboarding.step1": "Toque nas bolhas para estourá-las — sinta cada uma.",
    "onboarding.step2": "Estoure todas para concluir uma fase. Elas diminuem conforme você avança.",
    "onboarding.step3": "Estoure rápido para combos e supere seu recorde.",
    "onboarding.cta": "Começar",
    "loading.tagline": "Relaxe e estoure.",

    // Shop (§6)
    "shop.title": "Loja",
    "shop.skins": "Skins de bolha",
    "shop.zenSkins": "Skins Zen",
    "shop.equip": "Equipar",
    "shop.equipped": "Equipado",
    "shop.watchDiscount": "−{pct}%",
    "shop.watchEarn": "Assista um vídeo · +{coins} moedas",
    "shop.items": "Power-ups",
    "rarity.common": "Comum",
    "rarity.uncommon": "Incomum",
    "rarity.rare": "Raro",
    "rarity.premium": "Premium",
    "items.restock": "Reabastecer",
    "items.bomb": "Bomba",
    "items.freeze": "Congelar Tempo",
    "items.bombDesc": "Estoure um grupo inteiro num toque.",
    "items.freezeDesc": "Adiciona segundos ao relógio na fase.",
    "items.bombArmed": "Bomba armada — toque numa bolha",
    "items.frozen": "Congelado +{s}s",
    "home.shop": "Loja",
    "home.streak": "Dia {n}",

    // Objectives (§8)
    "obj.pop": "Estoure {n} bolhas",
    "obj.combo": "Faça um combo ×{n}",
    "obj.golden": "Estoure {n} douradas",
    "obj.phases": "Complete {n} fases",
    "obj.fast": "Complete uma fase < {n}s",
    "obj.complete": "Objetivo! +{coins}",
    "challenge.goalsTitle": "Metas de hoje",
    "challenge.goalsHint": "Toque em qualquer bolha para começar",
    "challenge.progressTitle": "Progresso do desafio",
    "challenge.allDone": "Todas as metas concluídas!",

    // Achievements (§10)
    "ach.title": "Conquistas",
    "ach.unlocked": "Conquista desbloqueada",
    "ach.pop": "Estoure {n} bolhas",
    "ach.streak": "Sequência de {n} dias",
    "ach.combo": "Alcance um combo ×{n}",
    "ach.golden": "Estoure {n} douradas",
    "ach.skins": "Tenha {n} skins",
    "ach.revive": "Use seu primeiro revive",
    "ach.statPopped": "Estouradas",
    "ach.statCombo": "Melhor combo",
    "ach.statStreak": "Sequência",
    "home.achievements": "Conquistas",

    // Gameplay
    "play.exit": "← Sair",
    "play.phaseOf": "Fase {phase} de {total}",
    "play.worldPhase": "Mundo {world} · {phase}/{per}",
    "world.label": "Mundo",
    "world.skip": "Continuar",
    "world.r1.name": "Plástico-bolha",
    "world.r1.desc": "Clássico. Estoure todas as bolhas da cartela.",
    "world.r2.name": "Fora da Linha",
    "world.r2.desc": "As bolhas saem da formação — sem fileiras certinhas.",
    "world.r3.name": "Flutuantes",
    "world.r3.desc": "As bolhas flutuam — toque bem no centro para estourar.",
    "world.r4.name": "Escudos",
    "world.r4.desc": "Escudos deslizantes protegem as bolhas. Estoure quando passarem.",
    "play.bubblesLeft": "{n} bolhas restantes · Recorde: {best} pts",
    "play.tapToStart": "Toque em qualquer bolha para começar", // NOT in spec table — review
    "play.phaseComplete": "Fase {phase} concluída",
    "play.time": "Tempo {time}", // NOT in spec table — review
    "combo.milestone": "Combo ×{n}!",
    "play.comboBonus": "Melhor combo ×{n} · +{pts} pts",
    "play.newBestScore": "Novo recorde de pontos! ",
    "play.newBestTime": "Novo recorde de tempo! ",
    "play.bestLine": "Recorde {score} · {time}",
    "play.watchNext": "Ver anúncio · Próxima fase",
    "play.watchFinish": "Ver anúncio · Concluir",
    "play.nextPhase": "Próxima fase",
    "play.finish": "Concluir",
    "play.replayPhase": "Repetir esta fase", // NOT in spec table — review
    // P1-T4 — Time Attack countdown / rewarded revive
    "play.timeUp": "Tempo esgotado!",
    "play.timeUpLine": "Assista a um anúncio curto para continuar.",
    "play.revive": "Reviver +{s}s",
    "play.endRun": "Encerrar",

    // Phase names — full phrase (play header)
    phase1: "Bolhas extragrandes",
    phase2: "Bolhas grandes",
    phase3: "Bolhas médias",
    phase4: "Bolhas pequenas",
    phase5: "Bolhas minúsculas",
    phase6: "Bolhas micro",
    phase7: "Bolhas nano",
    phase8: "Bolhas ínfimas",
    // Phase names — records label (pt uses the full phrase, per spec #3)
    phaseShort1: "Bolhas extragrandes",
    phaseShort2: "Bolhas grandes",
    phaseShort3: "Bolhas médias",
    phaseShort4: "Bolhas pequenas",
    phaseShort5: "Bolhas minúsculas",
    phaseShort6: "Bolhas micro",
    phaseShort7: "Bolhas nano",
    phaseShort8: "Bolhas ínfimas",

    // Finish
    "finish.newAllTime": "Novo recorde geral",
    "finish.firstRecord": "Primeiro recorde!",
    "finish.youBeatBest": "Você superou seu recorde!",
    "finish.runComplete": "Partida concluída",
    "finish.soClose": "Quase lá!",
    "finish.yourRun": "Sua partida · todas as fases",
    "finish.overOldBest": "▲ {delta} acima do recorde anterior de {prev}",
    "finish.firstTotal": "Este é o seu primeiro total geral — agora tente superá-lo.",
    "finish.allTimeBest": "Recorde geral:",
    "finish.pointsAway": "Faltam só {n} pontos",
    "finish.momentum": "Aproveite o embalo — veja até onde você consegue chegar.",
    "finish.optimize": "Melhorar seu recorde",
    "finish.tryAgain": "Tentar de novo do início",
    "finish.viewRecords": "Ver recordes",
    "finish.backHome": "Voltar ao início",
    "finish.coinsEarned": "+{coins} ganhas",
    "finish.doubleCoins": "Dobrar moedas",

    // Records
    "common.home": "← Início",
    "records.title": "Seus recordes",
    "records.phase": "Fase {n}",
    "records.phaseLine": "{label} · {bubbles} bolhas",
    "records.noTime": "sem tempo ainda",
    "records.new": "Novo!",
    "records.last": "Última: {score} · {time}",
    "records.playFrom": "Jogar a partir da Fase 1", // NOT in spec table — review
    "records.resetConfirmShort": "Apagar todos os recordes?", // NOT in spec table — review

    // Settings
    "settings.title": "Ajustes",
    "settings.popSound": "Som ao estourar",
    "settings.popSoundDesc": "Toca um som suave ao estourar cada bolha.",
    "settings.music": "Música",
    "settings.musicDesc": "Música de fundo nas telas de início e de resultado.",
    "settings.reduceMotion":
      'As animações são reduzidas automaticamente quando o "Reduzir movimento" está ativado na acessibilidade do seu aparelho.',
    "settings.vibration": "Vibração",
    "settings.vibrationDesc": "Sinta uma leve vibração a cada bolha estourada.",
    "settings.vibrationFollow": "Segue a configuração de vibração do seu aparelho.",
    "settings.analytics": "Análises",
    "settings.analyticsDesc":
      "Compartilhe dados de uso anônimos para melhorar o jogo. Sem dados pessoais.",
    "settings.yourData": "Seus dados",
    "settings.dataDesc":
      "Os recordes ficam salvos apenas neste aparelho. A redefinição não pode ser desfeita.",
    "settings.resetBtn": "Apagar recordes",
    "settings.resetConfirm":
      "Apagar todos os recordes? Isso vai apagar suas melhores pontuações e tempos de todas as fases. Não pode ser desfeito.",
    "settings.resetDone": "Recordes apagados.",
    "settings.about": "Sobre",
    "settings.howToPlayDesc": "Uma revisão rápida de como jogar.", // F6

    // Common / About links
    "link.aboutSupport": "Sobre e suporte",
    "link.privacyPolicy": "Política de Privacidade",
    "link.termsOfUse": "Termos de Uso",
    "common.backHome": "← Voltar ao início",

    // About page body
    "about.title": "Sobre e suporte",
    "about.intro":
      "O Zen Bubbles é um jogo simples de relaxamento. Estoure bolhas de plástico em uma série de fases tranquilas — as bolhas diminuem conforme você avança. Quanto mais rápido você limpa uma fase, maior a pontuação. Seus melhores resultados e tempos ficam salvos no seu aparelho para você superar o próprio recorde com o tempo.",
    "about.noAccountH": "Sem necessidade de conta",
    "about.noAccount":
      "O app funciona totalmente offline e não exige login. Os recordes ficam apenas no seu aparelho.",
    "about.a11yH": "Acessibilidade",
    "about.a11y":
      'O app respeita a opção "Reduzir movimento" do sistema e desativa as animações quando ela está ligada. Os botões têm tamanho confortável para toque no celular.',
    "about.supportH": "Suporte",
    "about.support":
      "Precisa de ajuda, quer relatar um problema ou dar uma sugestão? Escreva para {email}. Respondemos em alguns dias úteis.",
    "about.legalH": "Informações legais",
  },

  es: {
    // Home
    "home.title": "Burbujas Zen",
    "home.tagline":
      "Fases relajantes con burbujas cada vez más pequeñas. Revienta todas lo más rápido que puedas para superar tu récord.",
    "home.play": "Jugar",
    "home.zen": "Reventar por diversión",
    "home.timeAttack": "Contra el tiempo",
    "home.difficulty": "Dificultad",
    "home.diffEasy": "Fácil",
    "home.diffNormal": "Normal",
    "home.diffHard": "Difícil",
    "home.daily": "Desafío Pop",
    "home.dailyPlay": "Jugar hoy",
    "home.dailyBest": "Mejor de hoy: {score}",
    "home.dailyNew": "Nuevo desafío hoy · otro mañana",
    "home.viewRecords": "Ver récords",
    "nav.settings": "Ajustes",
    "nav.about": "Acerca de",
    "nav.privacy": "Privacidad",
    "nav.terms": "Términos",

    // Daily bonus (P1-T5)
    "bonus.title": "Bono diario",
    "bonus.day": "Día {n}",
    "bonus.reward": "+{coins} monedas",
    "bonus.line": "¡Qué bueno verte! Vuelve cada día para aumentar tu racha.",
    "bonus.claim": "Reclamar",
    "bonus.close": "Cerrar",

    // Onboarding + loading (P1-T10)
    "onboarding.title": "Cómo jugar",
    "onboarding.intro": "Dos formas de jugar:",
    "onboarding.challengeTitle": "Desafío Pop",
    "onboarding.challengeTag": "Contra el tiempo",
    "onboarding.challengeRule1":
      "Revienta todas las burbujas de una fase antes de que se acabe el tiempo.",
    "onboarding.challengeRule2":
      "Revienta en sucesión rápida para encadenar combos — las cadenas más largas dan más puntos.",
    "onboarding.challengeRule3":
      "Cada 8 fases entras a un nuevo mundo con una novedad: fuera de la cuadrícula, luego flotantes y con escudos.",
    "onboarding.challengeRule4":
      "Gana monedas para comprar Bombas y Congelar Tiempo, y mira un video para revivir cuando se acabe el tiempo.",
    "onboarding.funTitle": "Reventar por diversión",
    "onboarding.funTag": "Relajado · sin fin",
    "onboarding.funDesc":
      "Sin tiempo, sin puntaje — solo revienta para relajarte. Aparece una lámina nueva cada vez que limpias una.",
    "onboarding.step1": "Toca las burbujas para reventarlas — siente cada una.",
    "onboarding.step2": "Revienta todas para terminar una fase. Se achican a medida que avanzas.",
    "onboarding.step3": "Revienta rápido para hacer combos y superar tu mejor puntaje.",
    "onboarding.cta": "Empezar a reventar",
    "loading.tagline": "Relájate y revienta.",

    // Shop (§6)
    "shop.title": "Tienda",
    "shop.skins": "Estilos de burbuja",
    "shop.zenSkins": "Estilos Zen",
    "shop.equip": "Equipar",
    "shop.equipped": "Equipado",
    "shop.watchDiscount": "−{pct}%",
    "shop.watchEarn": "Mira un video · +{coins} monedas",
    "shop.items": "Potenciadores",
    "rarity.common": "Común",
    "rarity.uncommon": "Poco común",
    "rarity.rare": "Raro",
    "rarity.premium": "Premium",
    "items.restock": "Reabastecer",
    "items.bomb": "Bomba",
    "items.freeze": "Congelar Tiempo",
    "items.bombDesc": "Revienta un grupo entero de un toque.",
    "items.freezeDesc": "Suma segundos al reloj en una fase.",
    "items.bombArmed": "Bomba lista — toca una burbuja",
    "items.frozen": "Congelado +{s}s",
    "home.shop": "Tienda",
    "home.streak": "Día {n}",

    // Objectives (§8)
    "obj.pop": "Revienta {n} burbujas",
    "obj.combo": "Logra un combo ×{n}",
    "obj.golden": "Revienta {n} doradas",
    "obj.phases": "Completa {n} fases",
    "obj.fast": "Completa una fase < {n}s",
    "obj.complete": "¡Objetivo! +{coins}",
    "challenge.goalsTitle": "Metas de hoy",
    "challenge.goalsHint": "Toca cualquier burbuja para empezar",
    "challenge.progressTitle": "Progreso del desafío",
    "challenge.allDone": "¡Todas las metas completadas!",

    // Achievements (§10)
    "ach.title": "Logros",
    "ach.unlocked": "Logro desbloqueado",
    "ach.pop": "Revienta {n} burbujas",
    "ach.streak": "Racha de {n} días",
    "ach.combo": "Alcanza un combo ×{n}",
    "ach.golden": "Revienta {n} doradas",
    "ach.skins": "Ten {n} estilos",
    "ach.revive": "Usa tu primer revivir",
    "ach.statPopped": "Reventadas",
    "ach.statCombo": "Mejor combo",
    "ach.statStreak": "Racha",
    "home.achievements": "Logros",

    // Gameplay
    "play.exit": "← Salir",
    "play.phaseOf": "Fase {phase} de {total}",
    "play.worldPhase": "Mundo {world} · {phase}/{per}",
    "play.bubblesLeft": "{n} burbujas restantes · Récord: {best} pts",
    "play.tapToStart": "Toca cualquier burbuja para empezar",
    "world.label": "Mundo",
    "world.skip": "Continuar",
    "world.r1.name": "Plástico de burbujas",
    "world.r1.desc": "Clásico. Revienta todas las burbujas de la lámina.",
    "world.r2.name": "Fuera de línea",
    "world.r2.desc": "Las burbujas rompen la formación — se acabaron las filas ordenadas.",
    "world.r3.name": "Flotantes",
    "world.r3.desc": "Las burbujas flotan — toca justo en el centro para reventar.",
    "world.r4.name": "Escudos",
    "world.r4.desc": "Escudos deslizantes protegen las burbujas. Revienta cuando pasen.",
    "play.phaseComplete": "Fase {phase} completada",
    "play.time": "Tiempo {time}",
    "combo.milestone": "¡Combo ×{n}!",
    "play.comboBonus": "Mejor combo ×{n} · +{pts} pts",
    "play.newBestScore": "¡Nuevo récord de puntos! ",
    "play.newBestTime": "¡Nuevo récord de tiempo! ",
    "play.bestLine": "Récord {score} · {time}",
    "play.watchNext": "Ver anuncio · Siguiente fase",
    "play.watchFinish": "Ver anuncio · Terminar",
    "play.nextPhase": "Siguiente fase",
    "play.finish": "Terminar",
    "play.replayPhase": "Repetir esta fase",
    // P1-T4 — Time Attack countdown / rewarded revive
    "play.timeUp": "¡Se acabó el tiempo!",
    "play.timeUpLine": "Mira un anuncio corto para continuar.",
    "play.revive": "Revivir +{s}s",
    "play.endRun": "Terminar",

    // Phase names — full phrase (play header)
    phase1: "Burbujas extragrandes",
    phase2: "Burbujas grandes",
    phase3: "Burbujas medianas",
    phase4: "Burbujas pequeñas",
    phase5: "Burbujas diminutas",
    phase6: "Burbujas micro",
    phase7: "Burbujas nano",
    phase8: "Burbujas ínfimas",
    // Phase names — records label (es uses the full phrase, like pt)
    phaseShort1: "Burbujas extragrandes",
    phaseShort2: "Burbujas grandes",
    phaseShort3: "Burbujas medianas",
    phaseShort4: "Burbujas pequeñas",
    phaseShort5: "Burbujas diminutas",
    phaseShort6: "Burbujas micro",
    phaseShort7: "Burbujas nano",
    phaseShort8: "Burbujas ínfimas",

    // Finish
    "finish.newAllTime": "Nuevo récord absoluto",
    "finish.firstRecord": "¡Primer récord!",
    "finish.youBeatBest": "¡Superaste tu récord!",
    "finish.runComplete": "Partida completada",
    "finish.soClose": "¡Casi!",
    "finish.yourRun": "Tu partida · todas las fases",
    "finish.overOldBest": "▲ {delta} sobre tu récord anterior de {prev}",
    "finish.firstTotal": "Este es tu primer total absoluto — ahora ve a superarlo.",
    "finish.allTimeBest": "Récord absoluto:",
    "finish.pointsAway": "Solo a {n} puntos",
    "finish.momentum": "Aprovecha el impulso — mira hasta dónde puedes llegar.",
    "finish.optimize": "Mejorar tu récord",
    "finish.tryAgain": "Intentar de nuevo desde el inicio",
    "finish.viewRecords": "Ver récords",
    "finish.backHome": "Volver al inicio",
    "finish.coinsEarned": "+{coins} ganadas",
    "finish.doubleCoins": "Duplicar monedas",

    // Records
    "common.home": "← Inicio",
    "records.title": "Tus récords",
    "records.phase": "Fase {n}",
    "records.phaseLine": "{label} · {bubbles} burbujas",
    "records.noTime": "sin tiempo aún",
    "records.new": "¡Nuevo!",
    "records.last": "Última: {score} · {time}",
    "records.playFrom": "Jugar desde la Fase 1",
    "records.resetConfirmShort": "¿Borrar todos los récords?",

    // Settings
    "settings.title": "Ajustes",
    "settings.popSound": "Sonido al reventar",
    "settings.popSoundDesc": "Reproduce un sonido suave al reventar cada burbuja.",
    "settings.music": "Música",
    "settings.musicDesc": "Música de fondo en las pantallas de inicio y de resultados.",
    "settings.reduceMotion":
      'Las animaciones se reducen automáticamente cuando "Reducir movimiento" está activado en la accesibilidad de tu dispositivo.',
    "settings.vibration": "Vibración",
    "settings.vibrationDesc": "Siente una leve vibración cada vez que revientas una burbuja.",
    "settings.vibrationFollow": "Sigue la configuración de vibración de tu dispositivo.",
    "settings.analytics": "Analíticas",
    "settings.analyticsDesc":
      "Comparte datos de uso anónimos para ayudar a mejorar el juego. Sin datos personales.",
    "settings.yourData": "Tus datos",
    "settings.dataDesc":
      "Los récords se guardan solo en este dispositivo. El reinicio no se puede deshacer.",
    "settings.resetBtn": "Borrar récords",
    "settings.resetConfirm":
      "¿Borrar todos los récords? Esto eliminará tus mejores puntajes y tiempos de todas las fases. No se puede deshacer.",
    "settings.resetDone": "Récords borrados.",
    "settings.about": "Acerca de",
    "settings.howToPlayDesc": "Un repaso rápido de cómo jugar.",

    // Common / About links
    "link.aboutSupport": "Acerca de y soporte",
    "link.privacyPolicy": "Política de Privacidad",
    "link.termsOfUse": "Términos de Uso",
    "common.backHome": "← Volver al inicio",

    // About page body
    "about.title": "Acerca de y soporte",
    "about.intro":
      "Zen Bubbles es un juego simple de relajación. Revienta burbujas de plástico en una serie de fases tranquilas — las burbujas se achican a medida que avanzas. Cuanto más rápido limpias una fase, mayor es tu puntaje. Tus mejores puntajes y tiempos se guardan en tu dispositivo para que superes tu propio récord con el tiempo.",
    "about.noAccountH": "Sin necesidad de cuenta",
    "about.noAccount":
      "La app funciona totalmente sin conexión y no requiere iniciar sesión. Los récords quedan solo en tu dispositivo.",
    "about.a11yH": "Accesibilidad",
    "about.a11y":
      'La app respeta la opción "Reducir movimiento" del sistema y desactiva las animaciones cuando está activada. Los botones tienen un tamaño cómodo para tocar en el teléfono.',
    "about.supportH": "Soporte",
    "about.support":
      "¿Necesitas ayuda, quieres reportar un error o tienes una sugerencia? Escríbenos a {email}. Respondemos en unos días hábiles.",
    "about.legalH": "Información legal",
  },
};

export function t(key: string, params?: Params): string {
  const s = STRINGS[LANG][key] ?? STRINGS.en[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}
