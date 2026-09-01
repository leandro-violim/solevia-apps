# Cap Kickers — store listing copy (EN + pt-BR)

Paste these into App Store Connect (ASC) and Google Play Console. Character counts are noted for the
length-limited fields; they're within Apple's and Google's limits. **The Portuguese listing name is
"Futebol de Tampinha"** (Apple + Play both allow a per-language localized name). English stays
"Cap Kickers".

> Note on the *on-device* name: the installed app's icon label **is now localized** — Portuguese-language
> devices show **"Futebol de Tampinha"**, everyone else shows **"Cap Kickers"** (iOS
> `en.lproj`/`pt-BR.lproj` `InfoPlist.strings` + Android `values-pt/strings.xml`). The in-game logo still
> reads "Cap Kickers" (the master brand). Store listing names match: EN "Cap Kickers", pt-BR
> "Futebol de Tampinha".

---

## 🇺🇸 English — "Cap Kickers"

**App name (Apple + Play title, ≤30):** `Cap Kickers`  *(11)*

**Apple subtitle (≤30):** `Bottle-cap finger soccer`  *(24)*

**Play short description (≤80):**
`Flick bottle caps, thread the gap, and score past the keeper. Quick soccer!`  *(75)*

**Apple promotional text (≤170):**
`Flick, don't aim — the harder you flick, the farther your cap flies. Thread the gap, beat the keeper, and win the cup. Free, offline, no sign-up.`  *(145)*

**Apple keywords (≤100, comma-separated, no spaces after commas):**
`soccer,football,flick,bottle cap,arcade,sports,futebol,tabletop,goal,keeper,casual,offline,2-player`  *(99)*

**Description (Apple + Play full description, ≤4000):**
```
Flick. Score. Repeat.

Cap Kickers is fast, friendly bottle-cap soccer — the tabletop "futebol de
tampinhas" you grew up with, now in your pocket. Flick a cap with your finger:
the harder and quicker the flick, the farther it flies. A gentle tap barely
nudges it. No aim lines, no fuss — just feel.

HOW IT PLAYS
• You control three caps and get five touches per turn.
• Thread a cap through the gap between your other two to keep possession.
• On your fifth touch the goal opens — fire past the keeper and score.
• First to the target score wins the match.

MODES
• Campaign — climb a ladder of AI opponents from Easy to Hard.
• Pass & Play — two players, one device.
• Practice — warm up with no pressure.

MAKE IT YOURS
• Unlock pitch skins: grass, school desk, table, and cement.
• Pick your cap style.
• Play in English or Portuguese.

Free to play. Works offline. No account, no sign-up.
Grab a cap and take your shot!
```

---

## 🇧🇷 Português (Brasil) — "Futebol de Tampinha"

**Nome do app (Apple + título Play, ≤30):** `Futebol de Tampinha`  *(19)*

**Subtítulo Apple (≤30):** `Peteleco, drible e gol`  *(22)*

**Descrição curta Play (≤80):**
`Dê petelecos nas tampinhas, passe pelo vão e faça o gol. Futebol rápido!`  *(72)*

**Texto promocional Apple (≤170):**
`Não mire — dê o peteleco. Quanto mais forte, mais longe a tampinha vai. Passe pelo vão, vença o goleiro e leve a taça. Grátis, offline, sem cadastro.`  *(150)*

**Palavras-chave Apple (≤100, separadas por vírgula):**
`futebol,tampinha,peteleco,botão,gol,esporte,arcade,casual,offline,goleiro,campeonato,2 jogadores`  *(96)*

**Descrição (Apple + descrição completa Play, ≤4000):**
```
Peteleco, drible e gol!

Futebol de Tampinha é o futebol de mesa que você jogava na escola, agora no seu
bolso. Dê um peteleco na tampinha com o dedo: quanto mais forte e rápido o
peteleco, mais longe ela vai. Um toque leve mal a move — sem miras, sem
complicação, só no jeito.

COMO JOGAR
• Você controla três tampinhas e tem cinco toques por vez.
• Passe uma tampinha pelo vão entre as outras duas para manter a posse.
• No quinto toque o gol abre — chute e vença o goleiro.
• Quem chegar primeiro ao placar vence a partida.

MODOS
• Campanha — suba o ranking contra a IA, do Fácil ao Difícil.
• Passa e Joga — dois jogadores no mesmo aparelho.
• Treino — aqueça sem pressão.

DEIXE DO SEU JEITO
• Escolha o campo: grama, carteira escolar, mesa ou cimento.
• Escolha o estilo da sua tampinha.
• Jogue em português ou inglês.

Grátis. Funciona offline. Sem conta, sem cadastro.
Pegue sua tampinha e mande ver!
```

---

## Other listing fields (same for both languages)

- **Category:** Games → **Sports** (secondary: Arcade / Casual).
- **Price:** Free. **In-app purchases:** none.
- **Age rating:** Apple **4+** / Play **Everyone** — answer the questionnaire as a *general-audience*
  game (NOT child-directed / Kids / Designed for Families — see STORE-VALIDATION.md).
- **Support URL:** https://solevia.app  ·  **Marketing URL:** https://solevia.app
- **Privacy policy URL:** host the in-app text (see STORE-VALIDATION.md blocker #2).
- **Copyright:** © 2026 Sole Via Entertainment LLC.
- **Contains ads:** YES (declare on Play; Apple has no field but be consistent).

---

## 🌎 Español (Latinoamérica) — "Fútbol de Tapitas"

Added 2026-09-01 for the Latin America launch. **Play locale: `es-419` (Spanish – Latin America).
Apple locale: `Spanish (Mexico)`** — Apple has no es-419; es-MX is what serves all of LatAm.
Do *not* also add Spanish (Spain) unless you decide to ship to Spain, which needs the UMP
consent form first (EEA).

Vocabulary note: LatAm Spanish splits hard on some words (*corcholata* in Mexico, *chapita* in
Argentina, *tapa* in Chile). The in-app strings use **tapita** and **portero** throughout, which
read naturally almost everywhere; the alternates live in the Apple keyword field instead so
search still finds the game.

**Nombre de la app (Apple + título Play, ≤30):** `Fútbol de Tapitas`  *(17)*

**Subtítulo Apple (≤30):** `Fútbol de tapitas con el dedo`  *(29)*

**Descripción breve Play (≤80):**
`Dale un toque a las tapitas, pasa por el hueco y mete gol. ¡Fútbol rápido!`  *(74)*

**Texto promocional Apple (≤170):**
`No apuntes: dale un toque. Mientras más fuerte, más lejos llega la tapita. Pasa por el hueco, vence al portero y llévate la copa. Gratis, sin conexión, sin registro.`  *(165)*

**Palabras clave Apple (≤100, separadas por comas, sin espacios después de las comas):**
`fútbol,tapitas,chapitas,corcholatas,gol,portero,arcade,deportes,casual,sin conexión,2 jugadores`  *(95)*

**Descripción (Apple + descripción completa Play, ≤4000):**
```
¡Un toque, un gol!

Fútbol de Tapitas es el fútbol de mesa de toda la vida, ahora en tu bolsillo.
Dale un toque a la tapita con el dedo: mientras más rápido y fuerte sea el
toque, más lejos llega. Un toque suave apenas la mueve. Sin flechas, sin mira
— todo es cuestión de tacto.

CÓMO SE JUEGA
• Controlas tres tapitas y tienes cinco toques por turno.
• Pasa una tapita por el hueco entre las otras dos para conservar la posesión.
• En el quinto toque se abre la portería: dispara y vence al portero.
• El primero en llegar al marcador gana el partido.

MODOS
• Campaña — sube el escalafón contra la máquina, de Fácil a Difícil.
• Pasa y Juega — dos jugadores en un solo dispositivo.
• Práctica — calienta sin presión.

HAZLO TUYO
• Elige la cancha: pasto, pupitre, mesa o cemento.
• Elige el estilo de tu tapita.
• Juega en español, portugués o inglés.

Gratis. Funciona sin conexión. Sin cuenta y sin registro.
¡Agarra tu tapita y dispara!
```

**On-device app name:** Spanish-language devices now show **"Fútbol de Tapitas"**
(`android/app/src/main/res/values-es/strings.xml` and `ios/App/App/es.lproj/InfoPlist.strings`,
both created 2026-09-01). The iOS one only takes effect once Spanish is added under
Xcode → project → Info → Localizations.
