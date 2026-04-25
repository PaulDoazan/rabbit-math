# Rabbit Math — Design

**Date** : 2026-04-24
**Statut** : validé par l'utilisateur en session de brainstorming
**Dépôt** : `git@github.com:PaulDoazan/rabbit-math.git`

---

## 1. Vue d'ensemble

**Rabbit Math** est un jeu web éducatif pour réviser les tables de multiplication. Inspiré d'Angry Birds : le joueur lance une carotte avec une fronde sur un groupe de lapins perchés dans un arbre, chacun portant une pancarte avec un résultat numérique. Il doit atteindre le lapin dont la pancarte porte le résultat du calcul affiché à l'écran (ex. pour "7 × 8 = ?", atteindre le lapin "56").

Le jeu s'exécute en **vue paysage sur téléphone**, est entièrement client (pas de backend pour l'instant), et stocke les paramètres dans `localStorage`.

---

## 2. Gameplay

### Boucle principale

- Une **session** est composée de **N manches** (N paramétrable, défaut : 10).
- Une **manche** consiste en :
  1. Un calcul (ex. `7 × 8 = ?`) s'affiche sur une pancarte en haut au centre.
  2. Quatre lapins sont perchés sur quatre branches d'un arbre, à des hauteurs différentes. Chacun tient une pancarte avec un nombre : **un est la bonne réponse, trois sont des distracteurs**.
  3. Le joueur dispose de **C carottes** (C paramétrable, défaut : 3) pour toucher le bon lapin.
  4. Pour tirer, il touche la carotte chargée sur la fronde, tire vers l'arrière, et relâche. Une **trajectoire pointillée noire** longue et visible s'affiche pendant la visée, allant jusqu'à l'altitude des lapins (beaucoup plus longue que dans Angry Birds pour simplifier la visée).

### Résolution d'un tir

- **Touche le bon lapin** → le lapin attrape la carotte, **mord juste un bout** (la carotte n'est plus entière mais réduite à un fragment qu'il garde dans la patte), puis **tombe** depuis sa branche directement à la verticale et **reste posé sur l'herbe** à cet endroit (chute simulée par Matter ou tween rapide ; il s'immobilise au contact du sol, debout, fragment de carotte en main). Score +1. Manche gagnée. Après **1.2 s** d'animation, passage à la manche suivante.
- **Touche un mauvais lapin** → ce lapin secoue la tête "non", la carotte rebondit au sol. Carotte consommée. Si carottes restantes > 0, la fronde est rechargée ; sinon, manche perdue.
- **Tombe au sol sans toucher aucun lapin** → comportement identique à un mauvais tir.
- **Manche perdue (toutes les carottes ratées)** → pas de score pour cette manche, **aucun lapin ne tombe**, aucun feedback visuel particulier (l'absence de lapin au sol pour cette manche est en soi le signal). Passage à la suivante après 1.2 s.

Les **carottes ratées** (mauvais lapin ou sol) **restent visibles au sol** pour le reste de la session (sauf celles qui sortent hors champ). Elles s'accumulent comme indice du nombre de tirs ratés.

### Fin de session

Après les N manches, **pas d'écran séparé**. Le déroulé se fait *in situ* sur la scène de jeu :

1. Tous les lapins tombés au sol (ceux ayant reçu une carotte) **sautillent en place** en synchrone (3 petits bonds).
2. Pendant qu'ils sautillent, la pancarte du calcul (en haut au centre) **s'élargit dynamiquement** et affiche **"X / N bonnes réponses"** à la place de la multiplication.
3. Les lapins **partent tous ensemble vers la droite** de l'écran (translation + scale X alterné pour la course).
4. **1 seconde de pause** après leur disparition complète (l'herbe reste avec les carottes ratées, mais plus de lapins).
5. Le jeu **se rafraîchit automatiquement** : nouvelle session générée avec les mêmes paramètres, retour à la phase `AIMING` de la manche 1. La pancarte reprend sa largeur normale et affiche le nouveau calcul.

Aucun historique de score n'est persisté. Aucun bouton "Rejouer" n'est nécessaire (rafraîchissement auto).

---

## 3. Style visuel

### Palette — "Pré ensoleillé"

- Ciel : bleu clair `#bfe6ff`
- Soleil : jaune `#ffd74a`
- Herbe : vert saturé `#5cc05a`, collines `#7ed17b`
- Corps des lapins : blanc crème `#fff4d6`, oreilles internes rose `#f4b7b0`
- Carottes : orange `#ff7a2b`, feuilles vert foncé `#2f9a4b`
- Tronc : `#8a5a2c`
- Pancartes : crème `#fff8e5`
- Trait : noir `#111`, épaisseur 2.2–2.5 px
- Trajectoire pointillée : noir `#111`, épaisseur 3.5 px, dasharray `2 11`

Les contrastes respectent WCAG AA minimum pour tous les éléments porteurs d'information.

### Personnages

Lapins **inspirés du style Bunny Suicides d'Andy Riley** : silhouettes rondes, grandes oreilles, trait noir épais. Couleur ajoutée par rapport à l'original (palette ci-dessus). Détails du visage et de la posture :

- **Deux yeux** ronds noirs.
- **Bouche en forme de petit "Y"** (deux traits formant un Y court, juste sous les yeux). Pas de nez.
- **Quatre pattes** qui tiennent la **pancarte** :
  - 2 pattes au-dessus de la pancarte (par le haut)
  - 2 pattes en dessous (par le bas)
  - La pancarte est **centrée horizontalement** sur le corps du lapin (axe X).

### Composition de l'écran (résolution logique 844 × 390)

- **Gauche** : fronde posée sur l'herbe, carotte chargée.
- **Droite** : arbre central avec **4 branches** ; 4 lapins perchés à des hauteurs distinctes (branche basse, branche médiane gauche, branche médiane droite, sommet).
- **Haut centre** : `MathSign`, pancarte avec une **largeur adaptative**. Affiche le calcul en cours (ex. "7 × 8 = ?") en mode jeu, et "X / N bonnes réponses" en mode fin de session.
- **Haut gauche** : icône **engrenage** pour ouvrir les paramètres. Style "chunky" : 8 dents rectangulaires épaisses (10 × 11 unités, coins légèrement arrondis) autour d'un corps circulaire (rayon 16) avec un hub central percé (rayon 6).
- **Au sol, à droite de la fronde** : compteur des **carottes restantes**, représentées comme **3 carottes posées sur l'herbe inclinées à 40°** (rotation autour de leur centre). Chaque carotte tirée fait disparaître la première de la pile (de gauche à droite) avec un fade-out court.

**Placement des lapins tombés** : chaque lapin atteint correctement tombe **à la verticale de sa branche d'origine**. Les lapins issus de manches successives qui partagent la même position de branche **peuvent visuellement se chevaucher** (le plus récent par-dessus). Les lapins tombés s'accumulent dans la zone sous l'arbre jusqu'à la fin de la session.

### Assets

**Hybride** :
- Décors statiques (ciel, collines, herbe, arbre, grange) en **PNG exportés depuis des sources SVG** stockées dans `public/assets/sprites/`.
- Personnages (lapins, carottes) dessinés en **PixiJS Graphics API** directement en code, pour permettre des animations fluides (étirement d'oreilles, sauts, course, secousse de tête) sans multiplier les frames.

### Animations

| Événement | Animation |
|---|---|
| Réussite (impact) | Le lapin attrape la carotte, **mord un bout** (scale rapide sur la bouche, la carotte est remplacée par un sprite "fragment de carotte" tenu dans la patte). |
| Réussite (chute) | Le lapin tombe à la verticale de sa branche jusqu'à l'herbe, atterrit et **s'immobilise debout** (idle léger : oreilles qui frémissent), fragment de carotte toujours en main. |
| Échec (mauvais lapin) | Secousse de tête rapide (oscillation horizontale), la carotte rebondit et tombe via Matter, puis reste au sol. |
| Tir | Pulse léger de la carotte chargée, trajectoire mise à jour à chaque frame pendant le drag. |
| Changement de manche | Les lapins encore dans l'arbre disparaissent par fondu, 4 nouveaux lapins apparaissent par fondu + léger bounce sur les branches. Les lapins déjà tombés au sol restent en place. |
| Fin de session — sautillement | Tous les lapins tombés bondissent **en synchrone** : 3 petits sauts (translation Y + squash sur l'atterrissage). |
| Fin de session — fuite | Les lapins partent tous ensemble vers la droite : translation X + scale X alterné (effet course). Disparition à la sortie d'écran. |
| Fin de session — pancarte | Le `MathSign` s'élargit (tween sur la width) et affiche "X / N bonnes réponses". Après le départ des lapins et 1 s de pause, retour à la largeur normale et nouveau calcul. |

---

## 4. Paramètres (engrenage)

L'icône engrenage en haut à droite ouvre une `SettingsScene` en overlay qui met le jeu en pause.

| Paramètre | Valeurs | Défaut | Impact |
|---|---|---|---|
| Liste de calculs | 8 listes pré-définies (voir §5) | `tables_all` | Ré-génère la session si changée |
| Nombre de manches | 5, 10, 15, 20 | 10 | Ré-génère la session |
| Nombre de carottes par manche | 2, 3, 4 | 3 | S'applique à la prochaine manche |
| Difficulté | easy, medium, hard | medium | Ré-génère la session |
| Mode tap (accessibilité) | on / off | off | Immédiat |
| Bruitages | on / off | on | Immédiat |
| Musique d'ambiance | on / off | on | Immédiat |

Au changement d'un paramètre marqué "ré-génère la session", une confirmation "Recommencer la partie avec les nouveaux paramètres ?" s'affiche. Si l'utilisateur refuse, le paramètre ne s'applique qu'à la prochaine session.

Tous les paramètres sont persistés en `localStorage` sous la clé `rabbit-math.settings`.

---

## 5. Modèle de domaine (TypeScript pur, sans dépendance graphique)

### Types principaux

```ts
interface Question {
  readonly a: number;
  readonly b: number;
  readonly answer: number;       // a × b
  readonly choices: number[];    // 4 valeurs : answer + 3 distracteurs, mélangées
}

interface Settings {
  tableListId: string;
  roundsPerSession: number;
  carrotsPerRound: number;
  difficulty: "easy" | "medium" | "hard";
  tapMode: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

interface SessionState {
  readonly rounds: readonly Question[];
  currentIndex: number;
  score: number;
  carrotsLeft: number;
  phase: "aiming" | "resolving" | "round_over" | "session_over";
}
```

### Listes pré-définies embarquées

| ID | Libellé | Pool de calculs |
|---|---|---|
| `table_2` | Table de 2 | 2×1 à 2×10 |
| `table_5` | Table de 5 | 5×1 à 5×10 |
| `table_10` | Table de 10 | 10×1 à 10×10 |
| `tables_2_5_10` | Tables faciles | 2, 5, 10 ×1 à 10 |
| `tables_3_4_6` | Tables moyennes | 3, 4, 6 ×1 à 10 |
| `tables_7_8_9` | Tables difficiles | 7, 8, 9 ×1 à 10 |
| `tables_all` | Toutes les tables | 2 à 10 ×1 à 10 |
| `squares` | Carrés parfaits | n×n pour n=2 à 10 |

### Règles de difficulté — distance des distracteurs

Soit `answer` la bonne réponse.

- **easy** : 3 distracteurs tirés avec `|distracteur − answer| ≥ 10`.
- **medium** : 3 distracteurs tirés avec `3 ≤ |distracteur − answer| ≤ 9`.
- **hard** : 3 distracteurs tirés avec `1 ≤ |distracteur − answer| ≤ 5`, dont au moins un voisin à `±1`.

Contraintes générales :
- Aucun doublon parmi les 4 choices.
- Les distracteurs restent des entiers positifs plausibles dans la plage des résultats de tables (2 à 100).
- **Cas limite** : si un niveau de difficulté ne permet pas de trouver 3 distracteurs valides dans la plage autorisée (rare, par ex. `answer = 2` en mode easy avec distance ≥ 10 limite le domaine), on élargit progressivement la plage autorisée d'un cran (easy → medium → hard) jusqu'à pouvoir remplir les 3 distracteurs, en consignant un `warn` en console pour visibilité.

### Reproductibilité

`QuestionGenerator.generate(listId, difficulty, count, seed)` accepte un seed pour produire des questions déterministes. C'est ce qui permettra les tests unitaires reproductibles. En production, `seed = Date.now()`.

### Modules du domaine

| Fichier | Responsabilité |
|---|---|
| `domain/tables.ts` | Données des 8 listes (pools de couples (a, b)) |
| `domain/QuestionGenerator.ts` | Génération de N `Question` à partir d'une liste, difficulté, seed |
| `domain/DifficultyConfig.ts` | Règles et tirage de distracteurs par niveau |
| `domain/Session.ts` | Machine à état de la session (`nextRound`, `recordHit`, `recordMiss`, `isOver`) |

---

## 6. Architecture technique

### Stack

- **Langage** : TypeScript strict
- **Build** : Vite
- **Rendu** : PixiJS v8
- **Physique** : Matter.js
- **Animations** : `@tweenjs/tween.js` ou timelines maison
- **Tests** : Vitest + `@vitest/ui` + jsdom (pour les tests d'intégration)
- **Qualité** : ESLint + Prettier
- **Package manager** : pnpm
- **CI** : GitHub Actions (`lint + test + build` à chaque push et PR)
- **Déploiement** : à décider (GitHub Pages probable)

### Contraintes de style

- Fonctions : **20 lignes max** (extraire des helpers si plus long).
- Fichiers : **200 lignes max** (scinder en modules plus ciblés si plus long).
- TypeScript `strict: true`. Pas de `any` implicite.
- ESLint enforcing les règles ci-dessus via `max-lines`, `max-lines-per-function`.

### Structure des dossiers

```
rabbit-math/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── .github/workflows/ci.yml
├── public/
│   └── assets/
│       ├── sprites/        # PNG exportés (ciel, collines, arbre, grange, herbe)
│       └── sounds/         # MP3/OGG (tir, impact, réussite, échec, musique)
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-24-rabbit-math-design.md   (ce document)
├── src/
│   ├── main.ts                 # bootstrap
│   ├── config/
│   │   ├── dimensions.ts       # 844 x 390 + constantes de positions
│   │   ├── physics.ts          # gravité, frottements
│   │   └── theme.ts            # couleurs palette Pré ensoleillé
│   ├── core/
│   │   ├── App.ts              # wrapper PixiJS.Application
│   │   ├── PhysicsWorld.ts     # wrapper Matter.js (engine, runner, world)
│   │   ├── SceneManager.ts     # gestion scènes (goTo, pause, resume)
│   │   └── Scene.ts            # interface Scene
│   ├── scenes/
│   │   ├── GameScene.ts
│   │   └── SettingsScene.ts
│   ├── entities/
│   │   ├── Rabbit.ts
│   │   ├── Carrot.ts
│   │   ├── Slingshot.ts
│   │   ├── Tree.ts
│   │   ├── MathSign.ts
│   │   └── CarrotCounter.ts
│   ├── systems/
│   │   ├── SlingshotInput.ts
│   │   ├── TrajectoryPreview.ts
│   │   ├── CollisionHandler.ts
│   │   └── AccessibleTapMode.ts
│   ├── domain/
│   │   ├── tables.ts
│   │   ├── QuestionGenerator.ts
│   │   ├── DifficultyConfig.ts
│   │   └── Session.ts
│   ├── services/
│   │   ├── Storage.ts          # wrapper localStorage avec schéma
│   │   ├── Audio.ts            # player son + musique
│   │   └── Settings.ts         # load/save Settings
│   └── ui/
│       ├── GearButton.ts
│       ├── Button.ts
│       ├── Modal.ts
│       └── OrientationLock.ts  # écran "tourne ton téléphone"
└── tests/
    ├── domain/
    │   ├── QuestionGenerator.spec.ts
    │   ├── DifficultyConfig.spec.ts
    │   ├── Session.spec.ts
    │   └── tables.spec.ts
    ├── services/
    │   ├── Storage.spec.ts
    │   └── Settings.spec.ts
    └── systems/
        ├── CollisionHandler.spec.ts
        ├── TrajectoryPreview.spec.ts
        └── AccessibleTapMode.spec.ts
```

### Dépendances entre couches

```
main.ts
  └→ core, scenes
scenes/
  └→ entities, systems, ui, domain, services
entities/
  └→ core, config
systems/
  └→ config, entities (en lecture seule), domain
domain/
  └→ rien (pur TS)
services/
  └→ rien (utilise browser APIs)
ui/
  └→ core, config
config/
  └→ rien
```

Le `domain/` ne dépend d'aucune bibliothèque tierce ni de `core/` / `entities/`. C'est ce qui garantit sa testabilité totale.

---

## 7. Rendu et entités (couche PixiJS + Matter)

### Canvas et viewport

- **Résolution logique de design** : **844 × 390** (iPhone 14/15 standard en paysage, ratio 19.5:9).
- Toutes les coordonnées de gameplay sont exprimées dans ce repère logique.
- Le root container Pixi est `scale`é uniformément pour remplir la fenêtre tout en conservant le ratio. Bandes ciel (bleu uni) si le ratio écran diffère.
- `devicePixelRatio` utilisé seulement pour la netteté du rendu, pas pour la logique.
- Si le téléphone est en mode portrait, `OrientationLock` affiche un écran "Tourne ton téléphone" plein écran.

### Z-order des couches Pixi (du fond vers le haut)

```
[0] Sky                                    ← static
[1] FarHills                               ← static
[2] Barn                                   ← static
[3] Grass                                  ← static
[4] Tree (tronc + branches + feuillage)    ← static
[5] Rabbits (sprites + pancartes)          ← dynamique
[6] Slingshot + carotte chargée            ← dynamique
[7] Carrot en vol                          ← dynamique (0 ou 1)
[8] TrajectoryPreview (pointillés)         ← dynamique (visible en phase AIMING)
[9] HUD (MathSign top-center, Gear top-left, CarrotCounter on grass) ← static
[10] Overlays (SettingsScene)              ← à la demande
```

### Entités

| Entité | Sprite | Corps Matter | Méthodes clés |
|---|---|---|---|
| `Tree` | PNG (tronc + branches + feuillage) | non | `getPerchPositions(): Vector[]` |
| `Rabbit` | Graphics (corps + oreilles + 2 yeux + bouche en Y + pancarte tenue par 4 pattes + texte) | rectangle statique (capteur) | `setNumber(n)`, `playShakeNo()`, `playBitePartialAndFall(landingY)`, `playHopInPlace()`, `playRunAwayRight()` |
| `Slingshot` | Graphics (support + élastique dessiné) | non (cinématique) | `load(carrot)`, `onDragStart/Move/End`, `release() → Vector` |
| `Carrot` | Graphics | cercle dynamique | `launch(velocity)`, `onHitRabbit(r)`, `onHitGround()`, `restAtGround()` |
| `MathSign` | Graphics + Text | non | `setQuestion(q: Question)`, `setEndOfSessionMessage(score, total)`, `tweenWidthTo(w)` |
| `CarrotCounter` | Graphics (N carottes posées à 40° sur l'herbe à droite de la fronde) | non | `setRemaining(n: number)` (la carotte en surplus disparaît avec un fade-out court) |
| `GearButton` | Graphics | non | `onTap → openSettings()` |

**État vivant côté `GameScene`** : `GameScene` tient une **liste `fallenRabbits: Rabbit[]`** qui s'enrichit à chaque manche réussie. Ces lapins sont déplacés du conteneur "tree-rabbits" vers le conteneur "ground-rabbits" (z-order entre l'arbre et la fronde) après leur chute. Ils survivent au changement de manche, sont collectivement animés à la fin de la session, puis détruits lors du rafraîchissement.

### Entrée utilisateur

- **Mode par défaut (fronde)** : `SlingshotInput` capte `pointerdown` sur la carotte chargée, `pointermove` pour mettre à jour le vecteur (avec `TrajectoryPreview.update(vector)`), `pointerup` pour relâcher. La magnitude du vecteur est bornée à une puissance max.
- **Mode tap (accessibilité)** : `AccessibleTapMode` remplace `SlingshotInput`. Un `pointerdown` sur un lapin calcule analytiquement le vecteur de visée nécessaire pour atteindre la cible (résolution balistique avec gravité connue) et appelle `Carrot.launch()`.

---

## 8. Flux de jeu et machine à état

### Machine à état du `SessionState.phase`

```
AIMING ── (release ou tap) ──► RESOLVING
   ▲                              │
   │                              │ (hit ou fall)
   │                              ▼
   │                          ROUND_OVER
   │                              │
   │                              │
   └──── (next round) ────────────┤
                                  │ (isLastRound)
                                  ▼
                            SESSION_OVER
                                  │
                                  │ (animation de fin terminée + 1 s)
                                  ▼
                            (refresh: nouvelle session)
                                  │
                                  ▼
                              AIMING (manche 1 de la nouvelle session)
```

Transitions :
- **AIMING → RESOLVING** : `release()` (fin drag) ou tap sur un lapin en mode accessibilité.
- **RESOLVING → AIMING** : tir raté mais carottes restantes > 0 → on recharge.
- **RESOLVING → ROUND_OVER** : touche bonne réponse, OU ratage avec carottes épuisées.
- **ROUND_OVER → AIMING** : après 1.2 s d'animation, `Session.nextRound()`.
- **ROUND_OVER → SESSION_OVER** : `Session.isLastRound()` → déclenche la séquence de fin (in situ, pas de scène séparée).
- **SESSION_OVER → AIMING (nouvelle session)** : à la fin de la séquence de fin (sautillement + course + 1 s de pause), la `GameScene` détruit les lapins tombés et les carottes au sol, regénère une session avec les paramètres courants, et repart sur la manche 1.

### Séquence d'une manche (détaillée)

1. `Session.currentQuestion()` retourne la `Question`. `MathSign.setQuestion(q)` l'affiche.
2. Les 4 `Rabbit` se voient attribuer chacun une valeur de `q.choices` (positions des branches fixes, numéros mélangés indépendamment des positions).
3. La fronde est chargée, phase = `AIMING`.
4. Le joueur drag → `TrajectoryPreview` recalcule la courbe en temps réel (parabole selon gravité Matter).
5. Release → phase = `RESOLVING`. La carotte devient un corps Matter dynamique avec la vélocité initiale. La fronde perd sa carotte.
6. Le moteur physique simule le vol. Collision possible avec un `Rabbit` ou avec le sol.
7. `CollisionHandler.onCarrotHit(target)` :
   - Si `target` est un `Rabbit` et `rabbit.number === question.answer` → `Session.recordHit()`, on **détache la carotte de la scène volante**, on la transforme en "fragment de carotte" tenu dans la patte du lapin, on appelle `rabbit.playBitePartialAndFall(groundY)` qui mord, puis tombe à la verticale de la branche jusqu'au sol, où il s'immobilise. Le lapin est ajouté à `GameScene.fallenRabbits`. Phase = `ROUND_OVER`.
   - Si `target` est un `Rabbit` mais mauvaise réponse → `rabbit.playShakeNo()`, la carotte rebondit puis `carrot.restAtGround()` (immobile au sol). `Session.recordMiss()`. Si carottes restantes > 0 → recharge la fronde, phase = `AIMING`. Sinon phase = `ROUND_OVER`.
   - Si `target` est le sol → identique à un ratage. La carotte reste au sol via `restAtGround()`.
8. `ROUND_OVER` : timer 1.2 s. À la fin du timer :
   - Les lapins encore dans l'arbre (les 3 mauvais ou les 4 si manche perdue) sont **fade out + détruits**.
   - Les lapins tombés au sol restent (`fallenRabbits`).
   - Si `Session.isLastRound()` → phase = `SESSION_OVER`. Sinon → `Session.nextRound()`, génération de 4 nouveaux lapins dans l'arbre, retour à `AIMING`.

### Séquence de fin de session (`SESSION_OVER`)

Déclenchée quand toutes les manches ont été jouées. Pas d'écran séparé — tout se passe dans la `GameScene`.

1. **Pancarte** : `MathSign.tweenWidthTo(largeurAdaptative)` puis `setEndOfSessionMessage(session.score, session.totalRounds)` qui affiche "X / N bonnes réponses".
2. **Sautillement** : pour chaque lapin de `fallenRabbits`, déclencher `playHopInPlace()` en synchrone (3 bonds, durée totale ~1.5 s).
3. **Fuite** : à la fin du sautillement, déclencher `playRunAwayRight()` sur tous en synchrone (translation X jusqu'à `screenWidth + margin`, scale X alterné, durée ~1 s).
4. **Pause** : 1 s d'attente après que tous les lapins ont disparu. Pendant cette pause, le message "X / N bonnes réponses" reste affiché.
5. **Rafraîchissement** : la `GameScene` :
   - détruit tous les `fallenRabbits` et toutes les carottes au sol ;
   - réinitialise la pancarte (largeur normale) ;
   - regénère une `Session` avec les paramètres courants et un nouveau seed ;
   - repart sur la manche 1 avec 4 nouveaux lapins, phase = `AIMING`.

### Démarrage de l'app

```
main.ts
  ├─ Settings.load() depuis localStorage (ou défauts)
  ├─ new App() (crée Pixi.Application)
  ├─ await preloadAssets()
  ├─ new SceneManager(app)
  ├─ questions = QuestionGenerator.generate(settings, seed = Date.now())
  ├─ session = new Session(questions, settings.carrotsPerRound)
  └─ sceneManager.goTo(new GameScene(session, settings))
```

### Ouverture des paramètres

1. Tap sur `GearButton` → `sceneManager.openOverlay(SettingsScene)`.
2. `GameScene.pause()` : désactive l'input, fige Matter (`Matter.Runner.stop`), met en pause les tweens actifs.
3. Utilisateur modifie des valeurs → `Settings.save()` à chaque changement (persistance immédiate).
4. Fermeture : si un paramètre "ré-génère la session" a été modifié, afficher une `ConfirmationModal` : "Recommencer la partie avec les nouveaux paramètres ?". Oui → relance la session. Non → changements appliqués à la prochaine session.
5. Paramètres non-impactants (son, musique, tap mode) : appliqués immédiatement.

---

## 9. Stratégie TDD

### Principe

Pour chaque fonctionnalité du plan d'implémentation :

1. **Tests d'abord** : on écrit les `describe` / `it` qui décrivent le comportement attendu.
2. **Rouge** : on lance `pnpm test`, ils échouent.
3. **Vert** : on écrit le minimum de code pour les faire passer.
4. **Refactor** : on nettoie, les tests restent verts.
5. **Passage à l'itération suivante** seulement quand tout est vert.

### Niveaux de tests

| Niveau | Outil | Cible | Temps |
|---|---|---|---|
| **Unitaires** | Vitest | Domaine pur, services, utilitaires | < 1 s |
| **Intégration** | Vitest + jsdom | Systèmes Matter.js (CollisionHandler, TrajectoryPreview, AccessibleTapMode) | 2–5 s |
| **E2E visuels** | (optionnel, post-v1) Playwright | Parcours complets | 30 s+ |

Pour la première version, on ne couvre que les deux premiers niveaux.

### Couverture ciblée

- **Domaine** : viser **100%** (code pur, pas d'excuse pour ne pas couvrir).
- **Services** : ≥ 90% (avec mocks de `localStorage` et `Audio`).
- **Systèmes** : ≥ 70% (les parties Matter.js testables sont testées ; les interactions avec Pixi sont validées manuellement).
- **Projet global** : ≥ 85%.

### Ce qui est testé automatiquement

**Domaine** :
- `QuestionGenerator` : nombre de questions, présence de la bonne réponse dans chaque `choices`, respect des règles de difficulté, reproductibilité par seed, mélange effectif des choices.
- `Session` : transitions d'état, compteur de carottes, avancée d'index, détection de fin de session.
- `DifficultyConfig` : écarts respectés pour chaque niveau, pas de doublons, cas limites (answer=0, answer très grand).
- `tables` : chaque liste retourne le bon pool de couples.

**Services** :
- `Storage` : lecture, écriture, suppression, gestion de JSON corrompu.
- `Settings` : valeurs par défaut, validation, persistance.

**Systèmes** :
- `CollisionHandler` : classification correcte `correct` / `wrong` / `ground` pour des événements de collision Matter simulés.
- `TrajectoryPreview` : cohérence de la parabole calculée (points de contrôle vérifiés).
- `AccessibleTapMode.computeVelocityForTarget` : le vecteur calculé fait atteindre la cible en simulation Matter.

### Ce qui n'est pas testé automatiquement (validation manuelle)

- Couleurs et silhouettes des sprites (rendu visuel).
- Ressenti du drag de la fronde.
- Rendu des polices, lisibilité des pancartes.
- Sons (seulement les déclenchements sont vérifiés via spy).

### Intégration continue

`.github/workflows/ci.yml` :

```yaml
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
```

### Scripts pnpm

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src tests --ext .ts",
    "format": "prettier --write src tests"
  }
}
```

---

## 10. Hors-scope (explicitement pas pour la v1)

- Backend et comptes utilisateurs (prévu pour plus tard).
- Historique de scores persistants, leaderboard.
- Niveaux / progression / déblocage.
- Multijoueur.
- Autres opérations que la multiplication (addition, soustraction, division).
- Écran d'accueil / menu principal (on démarre directement en `GameScene`).
- Localisation (français par défaut, internationalisation plus tard).
- PWA / mode hors-ligne avancé.
- Tests E2E Playwright.
- Vibrations / haptic feedback.

---

## 11. Critères d'acceptation (pour la v1)

Le jeu est considéré "livré" quand :

1. Sur un téléphone en paysage, on peut jouer une session complète du début à la fin (N manches), tirer des carottes, atteindre des lapins, voir les animations de réussite/échec.
2. À chaque manche réussie, le bon lapin mord un bout de carotte, tombe à la verticale de sa branche, et reste sur l'herbe avec son fragment de carotte en main.
3. À la fin des N manches, le `MathSign` s'élargit et affiche "X / N bonnes réponses", tous les lapins tombés sautillent en synchrone puis partent ensemble vers la droite. Après 1 s, le jeu se rafraîchit automatiquement.
4. L'engrenage ouvre les paramètres ; tous les paramètres listés en §4 fonctionnent ; ils sont persistés en `localStorage`.
5. Le mode accessibilité tap permet de toucher un lapin par un simple tap.
6. `pnpm test` est vert avec ≥ 85% de couverture globale et 100% sur le domaine.
7. `pnpm lint` et `pnpm build` passent sans erreur.
8. CI GitHub Actions verte.
9. Aucune fonction > 20 lignes, aucun fichier > 200 lignes.
