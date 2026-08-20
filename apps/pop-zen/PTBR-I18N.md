# Zen Bubbles — In-App Portuguese (pt-BR) Localization: Handoff for Claude Code

**Goal:** make the app's UI show Portuguese on pt-BR devices and English everywhere else, from ONE shared code change (Capacitor → benefits both iOS and Android). Leandro (native pt-BR) reviews the wording.

**Current state:** there is NO i18n library — every string is hardcoded across `src/routes/*` + `src/lib/quotes.ts` + `src/lib/game-config.ts`. So this is: add a tiny locale layer, then swap hardcoded strings for `t(...)` lookups. The app is text-light, so it's a small job.

**Scope for this pass:** translate the UI chrome, gameplay, finish/records/settings screens, phase names, motivational quotes, and the About page. **Leave `privacy.tsx` and `terms.tsx` in English for now** (long-form legal; the store's privacy-policy URL covers compliance — translate later if desired).

---

## Recommended approach (minimal, no dependency)

1. Add `src/lib/i18n.ts`:
   - Detect language ONCE at module load, synchronously, so there's no flash/hydration mismatch. In the Capacitor webview `navigator.language` reflects the device language. Use: `const LANG = (typeof navigator !== "undefined" && navigator.language || "en").toLowerCase().startsWith("pt") ? "pt" : "en";`
   - Export `t(key, params?)` that looks up `STRINGS[LANG][key]` (fallback to `STRINGS.en[key]`, then the key itself) and interpolates `{name}` params.
   - Keep a `STRINGS = { en: {...}, pt: {...} }` map. Seed `en` from the current hardcoded text (so English is unchanged) and `pt` from the table below.
2. Replace hardcoded JSX strings in the route files with `t("key")`. For interpolated lines, pass params (e.g. `t("play.bubblesLeft", { n: remaining, best })`).
3. Phase names: in `src/lib/game-config.ts` the `label` fields ("Extra Large"… "Tiny") are composed as `{label} bubbles`. Portuguese puts the adjective AFTER the noun, so DON'T translate the word alone — localize the whole phrase. Store a phase key (e.g. `phase1`…`phase5`) and translate to the full phrases in the table (e.g. "Bolhas extragrandes"). Update the two call sites (play header, records list) to use the localized phrase; in records, "{label} · {bubbles} bubbles" → "{phrase} · {bubbles} bolhas".
4. Home-screen icon name (native, separate from JS):
   - **iOS:** add `ios/App/App/pt.lproj/InfoPlist.strings` with `"CFBundleDisplayName" = "Plástico bolha";` and ensure `pt` (or `pt-BR`) is in the project's known regions. (English stays `Zen Bubbles`.)
   - **Android:** add `android/app/src/main/res/values-pt/strings.xml` with `<string name="app_name">Plástico bolha</string>`.
5. Add a quick unit sanity check if easy (the repo already uses vitest): `t("home.play")` returns "Jogar" when LANG forced to "pt".

> Note on the toggle: default behavior = follow the device language (recommended, zero UI). A manual language switch in Settings is optional and NOT required for launch — skip it unless Leandro asks.

---

## Translation table (EN → pt-BR)  — Leandro: review/polish

### Home (`routes/index.tsx`)
| key | EN | pt-BR |
|---|---|---|
| home.tagline | Five soothing phases. Bubbles get smaller as you go. Pop them all as fast as you can to beat your record. | Cinco fases relaxantes. As bolhas ficam menores a cada fase. Estoure todas o mais rápido que puder para superar o seu recorde. |
| home.play | Play | Jogar |
| home.viewRecords | View records | Ver recordes |
| nav.settings | Settings | Ajustes |
| nav.about | About | Sobre |
| nav.privacy | Privacy | Privacidade |
| nav.terms | Terms | Termos |

*(Keep the H1 brand "Zen Bubbles" as-is — it's the logo wordmark.)*

### Gameplay (`routes/play.tsx`)
| key | EN | pt-BR |
|---|---|---|
| play.exit | ← Exit | ← Sair |
| play.phaseOf | Phase {phase} of {total} | Fase {phase} de {total} |
| play.bubblesLeft | {n} bubbles left · Best: {best} pts | {n} bolhas restantes · Recorde: {best} pts |
| play.phaseComplete | Phase {phase} complete | Fase {phase} concluída |
| play.newBestScore | New best score! | Novo recorde de pontos! |
| play.newBestTime | New best time! | Novo recorde de tempo! |
| play.bestLine | Best {score} · {time} | Recorde {score} · {time} |
| play.watchNext | Watch ad · Next phase | Ver anúncio · Próxima fase |
| play.watchFinish | Watch ad · Finish | Ver anúncio · Concluir |
| play.nextPhase | Next phase | Próxima fase |
| play.finish | Finish | Concluir |

### Phase names (`lib/game-config.ts`, used in play + records)
| key | EN (`{label} bubbles`) | pt-BR (full phrase) |
|---|---|---|
| phase1 | Extra Large bubbles | Bolhas extragrandes |
| phase2 | Large bubbles | Bolhas grandes |
| phase3 | Medium bubbles | Bolhas médias |
| phase4 | Small bubbles | Bolhas pequenas |
| phase5 | Tiny bubbles | Bolhas minúsculas |

### Finish (`routes/finish.tsx`)
| key | EN | pt-BR |
|---|---|---|
| finish.newAllTime | New all-time record | Novo recorde geral |
| finish.firstRecord | First record set | Primeiro recorde! |
| finish.youBeatBest | You beat your best! | Você superou seu recorde! |
| finish.runComplete | Run complete | Partida concluída |
| finish.soClose | So close! | Quase lá! |
| finish.yourRun | Your run · all 5 phases | Sua partida · todas as 5 fases |
| finish.overOldBest | ▲ {delta} over your old best of {prev} | ▲ {delta} acima do recorde anterior de {prev} |
| finish.firstTotal | This is your first all-time total — now go beat it. | Este é o seu primeiro total geral — agora tente superá-lo. |
| finish.allTimeBest | All-time best: | Recorde geral: |
| finish.pointsAway | Just {n} points away | Faltam só {n} pontos |
| finish.momentum | Ride the momentum — see if you can push it even higher. | Aproveite o embalo — veja até onde você consegue chegar. |
| finish.optimize | Optimize your record | Melhorar seu recorde |
| finish.tryAgain | Try again from the start | Tentar de novo do início |
| finish.viewRecords | View records | Ver recordes |
| finish.backHome | Back home | Voltar ao início |

### Records (`routes/records.tsx`)
| key | EN | pt-BR |
|---|---|---|
| common.home | ← Home | ← Início |
| records.title | Your records | Seus recordes |
| records.phase | Phase {n} | Fase {n} |
| records.phaseLine | {label} · {bubbles} bubbles | {label} · {bubbles} bolhas |
| records.noTime | no time yet | sem tempo ainda |
| records.new | New! | Novo! |
| records.last | Last: {score} · {time} | Última: {score} · {time} |

### Settings (`routes/settings.tsx`)
| key | EN | pt-BR |
|---|---|---|
| settings.title | Settings | Ajustes |
| settings.popSound | Pop sound | Som ao estourar |
| settings.popSoundDesc | Play a soft pop when a bubble bursts. | Toca um som suave ao estourar cada bolha. |
| settings.reduceMotion | Motion is reduced automatically when your device has "Reduce Motion" turned on in accessibility settings. | As animações são reduzidas automaticamente quando o "Reduzir movimento" está ativado na acessibilidade do seu aparelho. |
| settings.vibration | Vibration | Vibração |
| settings.vibrationDesc | Feel a light tap each time a bubble pops. | Sinta uma leve vibração a cada bolha estourada. |
| settings.vibrationFollow | Follows your device's system vibration setting. | Segue a configuração de vibração do seu aparelho. |
| settings.yourData | Your data | Seus dados |
| settings.dataDesc | Records are stored only on this device. Resetting cannot be undone. | Os recordes ficam salvos apenas neste aparelho. A redefinição não pode ser desfeita. |
| settings.resetBtn | Reset records | Apagar recordes |
| settings.resetConfirm | Reset all records? This will erase your best scores and times for every phase. This cannot be undone. | Apagar todos os recordes? Isso vai apagar suas melhores pontuações e tempos de todas as fases. Não pode ser desfeito. |
| settings.resetDone | Records reset. | Recordes apagados. |
| settings.about | About | Sobre |

### Common / About links
| key | EN | pt-BR |
|---|---|---|
| link.aboutSupport | About & Support | Sobre e suporte |
| link.privacyPolicy | Privacy Policy | Política de Privacidade |
| link.termsOfUse | Terms of Use | Termos de Uso |
| common.backHome | ← Back home | ← Voltar ao início |

### About page body (`routes/about.tsx`)
| key | EN | pt-BR |
|---|---|---|
| about.title | About & Support | Sobre e suporte |
| about.intro | Zen Bubbles is a simple relaxation game. Pop plastic bubbles across five soothing phases — bubbles shrink as you advance. The faster you clear a phase, the higher your score. Your best scores and best times are saved on your device so you can beat your own record over time. | O Zen Bubbles é um jogo simples de relaxamento. Estoure bolhas de plástico em cinco fases tranquilas — as bolhas diminuem conforme você avança. Quanto mais rápido você limpa uma fase, maior a pontuação. Seus melhores resultados e tempos ficam salvos no seu aparelho para você superar o próprio recorde com o tempo. |
| about.noAccountH | No account required | Sem necessidade de conta |
| about.noAccount | The App works fully offline and does not require sign-in. Records live on your device only. | O app funciona totalmente offline e não exige login. Os recordes ficam apenas no seu aparelho. |
| about.a11yH | Accessibility | Acessibilidade |
| about.a11y | The App respects your system "Reduce Motion" setting and disables idle animations when enabled. Tap targets are sized for comfortable touch on phones. | O app respeita a opção "Reduzir movimento" do sistema e desativa as animações quando ela está ligada. Os botões têm tamanho confortável para toque no celular. |
| about.supportH | Support | Suporte |
| about.support | Need help, want to report a bug, or have a suggestion? Email us at {email}. We aim to respond within a few business days. | Precisa de ajuda, quer relatar um problema ou dar uma sugestão? Escreva para {email}. Respondemos em alguns dias úteis. |
| about.legalH | Legal | Informações legais |

### Motivational quotes (`lib/quotes.ts`) — shown after finishing all 5 phases
| # | EN | pt-BR |
|---|---|---|
| 1 | Every pop, a little lighter. Every run, a little better. | A cada bolha, um alívio. A cada partida, um pouco melhor. |
| 2 | Small progress is still progress — beat your calm. | Todo progresso conta — evolua no seu ritmo. |
| 3 | Breathe in. Beat your record. Breathe out. | Inspire. Supere seu recorde. Expire. |
| 4 | Repetition is where mastery hides. | É na repetição que mora a maestria. |
| 5 | The next run is always the best one to improve. | A próxima partida é sempre a melhor para evoluir. |
| 6 | Calm hands, quicker mind. | Mãos calmas, mente ágil. |
| 7 | You just finished — now go beat yourself. | Você terminou — agora supere a si mesmo. |
| 8 | One more round. One more record. | Mais uma rodada. Mais um recorde. |

*(Keep `QUOTES` selectable by language — e.g. `QUOTES[LANG]` — so `pickQuote` returns a pt line on pt devices.)*

---

## Where this lands (git) — coordinate with the other branches
- This is SHARED web code, so ONE implementation covers iOS AND Android. Implement on a branch (e.g. `ptbr-i18n`).
- It should sit on top of the 1.0.2 code (so iOS 1.1.0 = 1.0.2 features + Portuguese), and the Android build should include it too. See `zen-bubbles-release-sequencing.md` for the exact branch/version order — follow that so this doesn't tangle with the unsent 1.0.2 work or the `android-port` branch.
- On iOS it ships as **1.1.0** (after 1.0.2). On Android it's simply baked into the first build.
