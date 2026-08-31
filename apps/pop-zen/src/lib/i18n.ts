/**
 * Tiny in-app localization — no dependency.
 *
 * Language is detected ONCE at module load, synchronously, from the device
 * language (in the Capacitor webview `navigator.language` reflects the device
 * setting). pt-* → Portuguese, everything else → English. There is no runtime
 * language switch: the app follows the device, so there's no flash / hydration
 * mismatch.
 *
 * `t(key, params?)` looks up STRINGS[LANG][key], falls back to the English
 * string, then to the key itself, and interpolates `{name}` placeholders from
 * `params`. Placeholders with no matching param are left intact (used e.g. to
 * splice a link into `about.support`).
 */

export type Lang = "en" | "pt";

export const LANG: Lang = (typeof navigator !== "undefined" && navigator.language
  ? navigator.language
  : "en"
)
  .toLowerCase()
  .startsWith("pt")
  ? "pt"
  : "en";

// Reflect the UI language on <html lang> for accessibility / screen readers.
if (typeof document !== "undefined") {
  document.documentElement.lang = LANG;
}

type Params = Record<string, string | number>;

const STRINGS: Record<Lang, Record<string, string>> = {
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
    "items.restock": "Stock up",
    "items.bomb": "Bomb",
    "items.freeze": "Time Freeze",
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
    "settings.musicDesc": "Calm piano on the home and results screens.",
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
    "items.restock": "Reabastecer",
    "items.bomb": "Bomba",
    "items.freeze": "Congelar Tempo",
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
    "settings.musicDesc": "Piano tranquilo nas telas de início e de resultado.",
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
};

export function t(key: string, params?: Params): string {
  const s = STRINGS[LANG][key] ?? STRINGS.en[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}
