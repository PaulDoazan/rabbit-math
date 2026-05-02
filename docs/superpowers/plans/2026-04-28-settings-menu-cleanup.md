# Settings menu cleanup + variable rabbit count — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the settings menu to three rows (Questions, Nombre de lapins, Mode tap), remove the now-hidden settings entirely from the data model, and make rabbit count (4–8) drive perch positions and distractor count.

**Architecture:** New `RabbitsCount` literal type added to `Settings`. Five fields (`roundsPerSession`, `carrotsPerRound`, `difficulty`, `soundEnabled`, `musicEnabled`) removed everywhere — replaced by module-level constants in `src/domain/sessionConfig.ts` for the three values still needed by the engine. Perch coordinates become `TREE_PERCHES_BY_COUNT: Record<RabbitsCount, …>` and consumers (`GameScene`, `manche`, `Tree`) read the right slice. `generateDistractors` and `generateSession` take a `count` parameter so questions have exactly `rabbitsCount` choices.

**Tech Stack:** TypeScript, Pixi.js v8, Vitest, Matter.js. Project layout: `src/{config,core,domain,entities,scenes,services,systems,ui}` with parallel `tests/` tree.

**Spec:** `docs/superpowers/specs/2026-04-28-settings-menu-cleanup-design.md`

---

## Task 1: Create the session-config constants module

**Files:**
- Create: `src/domain/sessionConfig.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Difficulty } from "./DifficultyConfig";

export const DEFAULT_DIFFICULTY: Difficulty = "medium";
export const ROUNDS_PER_SESSION = 10;
export const CARROTS_PER_ROUND = 4;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 3: Commit**

```bash
git add src/domain/sessionConfig.ts
git commit -m "feat(domain): add session-config constants module"
```

---

## Task 2: Replace `Settings` shape

**Files:**
- Modify: `src/services/Settings.ts`
- Modify: `tests/services/Settings.spec.ts`

- [ ] **Step 1: Rewrite `Settings.spec.ts` to match the new shape**

Replace the file contents with:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  validateSettings,
} from "../../src/services/Settings";

beforeEach(() => localStorage.clear());

describe("Settings defaults & round-trip", () => {
  it("loadSettings returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("default selection is the table of 4 (10 pairs)", () => {
    expect(DEFAULT_SETTINGS.selectedPairs).toHaveLength(10);
    expect(DEFAULT_SETTINGS.selectedPairs.every((p) => p.a === 4)).toBe(true);
  });

  it("default rabbitsCount is 4", () => {
    expect(DEFAULT_SETTINGS.rabbitsCount).toBe(4);
  });

  it("saveSettings then loadSettings round-trips", () => {
    const next = { ...DEFAULT_SETTINGS, rabbitsCount: 6 as const, tapMode: true };
    saveSettings(next);
    expect(loadSettings()).toEqual(next);
  });
});

describe("Settings invalid data", () => {
  it("loadSettings ignores invalid stored data", () => {
    localStorage.setItem("rabbit-math.settings", JSON.stringify({ tableListId: 12345 }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("loadSettings ignores when selectedPairs is missing", () => {
    localStorage.setItem(
      "rabbit-math.settings",
      JSON.stringify({ ...DEFAULT_SETTINGS, selectedPairs: undefined }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("loadSettings ignores legacy fields and falls back to defaults", () => {
    localStorage.setItem(
      "rabbit-math.settings",
      JSON.stringify({
        selectedPairs: DEFAULT_SETTINGS.selectedPairs,
        rabbitsCount: 4,
        tapMode: false,
        roundsPerSession: 10,
        carrotsPerRound: 4,
        difficulty: "medium",
      }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("Settings validation", () => {
  it("validateSettings clamps rabbitsCount into [4,8]", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, rabbitsCount: 2 as 4 }).rabbitsCount).toBe(4);
    expect(validateSettings({ ...DEFAULT_SETTINGS, rabbitsCount: 12 as 4 }).rabbitsCount).toBe(8);
    expect(validateSettings({ ...DEFAULT_SETTINGS, rabbitsCount: 5.7 as 5 }).rabbitsCount).toBe(5);
  });

  it("validateSettings falls back to the default selection when empty", () => {
    const bad = { ...DEFAULT_SETTINGS, selectedPairs: [] };
    const fixed = validateSettings(bad);
    expect(fixed.selectedPairs).toEqual(DEFAULT_SETTINGS.selectedPairs);
  });
});
```

- [ ] **Step 2: Run the test (should fail to compile)**

Run: `pnpm exec vitest run tests/services/Settings.spec.ts 2>&1 | tail -20`
Expected: TypeScript errors about missing `rabbitsCount`, etc.

- [ ] **Step 3: Rewrite `src/services/Settings.ts`**

Replace the file contents with:

```ts
import { readJson, writeJson } from "./Storage";
import type { Pair } from "../domain/tables";

export type RabbitsCount = 4 | 5 | 6 | 7 | 8;

const tableOf4 = (): Pair[] =>
  Array.from({ length: 10 }, (_, i) => ({ a: 4, b: i + 1 }));

export interface Settings {
  selectedPairs: Pair[];
  rabbitsCount: RabbitsCount;
  tapMode: boolean;
}

export const SETTINGS_KEY = "rabbit-math.settings";

export const DEFAULT_SETTINGS: Settings = {
  selectedPairs: tableOf4(),
  rabbitsCount: 4,
  tapMode: false,
};

const isPair = (v: unknown): v is Pair => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.a === "number" && typeof o.b === "number";
};

const isPairArray = (v: unknown): v is Pair[] =>
  Array.isArray(v) && v.every(isPair);

const isRabbitsCount = (v: unknown): v is RabbitsCount =>
  v === 4 || v === 5 || v === 6 || v === 7 || v === 8;

const isShape = (v: unknown): v is Settings => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const knownKeys = new Set(["selectedPairs", "rabbitsCount", "tapMode"]);
  if (!Object.keys(o).every((k) => knownKeys.has(k))) return false;
  return (
    isPairArray(o.selectedPairs) &&
    isRabbitsCount(o.rabbitsCount) &&
    typeof o.tapMode === "boolean"
  );
};

const clampRabbits = (n: number): RabbitsCount => {
  const i = Math.max(4, Math.min(8, Math.floor(n)));
  return i as RabbitsCount;
};

export function validateSettings(s: Settings): Settings {
  return {
    ...s,
    rabbitsCount: clampRabbits(s.rabbitsCount),
    selectedPairs: s.selectedPairs.length >= 1 ? s.selectedPairs : tableOf4(),
  };
}

export function loadSettings(): Settings {
  const raw = readJson<unknown>(SETTINGS_KEY);
  return isShape(raw) ? validateSettings(raw) : DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings): void {
  writeJson(SETTINGS_KEY, validateSettings(s));
}
```

- [ ] **Step 4: Run the test, expect it to pass**

Run: `pnpm exec vitest run tests/services/Settings.spec.ts`
Expected: PASS for all cases.

The rest of the codebase will not compile yet — that is expected and fixed by subsequent tasks. Do not commit yet.

---

## Task 3: Thread `count` through `generateDistractors` + `generateSession`

**Files:**
- Modify: `src/domain/DifficultyConfig.ts`
- Modify: `src/domain/QuestionGenerator.ts`
- Modify: `tests/domain/QuestionGenerator.spec.ts` (verify after)

- [ ] **Step 1: Update `generateDistractors` to take `count`**

Replace the body of `generateDistractors` and signatures so the function accepts a target count:

```ts
export function generateDistractors(
  answer: number,
  difficulty: Difficulty,
  count: number,
  rng: Rng,
): number[] {
  const range = DIFFICULTY_RANGES[difficulty];
  const pool = widenIfNeeded(answer, range, count);
  if (pool.length < count) {
    console.warn(`Not enough distractors for answer=${answer} difficulty=${difficulty}`);
  }
  const picks = shuffle(pool, rng).slice(0, count);
  return difficulty === "hard" ? ensureNeighbour(answer, picks, pool) : picks;
}
```

- [ ] **Step 2: Update `QuestionGenerator.ts` to pass `count`**

Add `choicesCount` to `SessionRequest` and forward it to `buildQuestion`:

```ts
import type { Pair } from "./tables";
import { generateDistractors, type Difficulty } from "./DifficultyConfig";
import { mulberry32, pickFrom, shuffle, type Rng } from "./Rng";
import type { Question } from "./Question";

export interface SessionRequest {
  readonly pairs: readonly Pair[];
  readonly difficulty: Difficulty;
  readonly count: number;
  readonly choicesCount: number;
  readonly seed: number;
}

const pickPair = (pool: readonly Pair[], previous: Pair | null, rng: Rng): Pair => {
  if (pool.length <= 1 || !previous) return pickFrom(pool, rng);
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = pickFrom(pool, rng);
    if (candidate.a !== previous.a || candidate.b !== previous.b) return candidate;
  }
  return pickFrom(pool, rng);
};

const buildQuestion = (
  pair: Pair,
  difficulty: Difficulty,
  choicesCount: number,
  rng: Rng,
): Question => {
  const answer = pair.a * pair.b;
  const distractors = generateDistractors(answer, difficulty, choicesCount - 1, rng);
  return { a: pair.a, b: pair.b, answer, choices: shuffle([answer, ...distractors], rng) };
};

export function generateSession(req: SessionRequest): Question[] {
  const rng = mulberry32(req.seed);
  const pool = req.pairs;
  const out: Question[] = [];
  let previous: Pair | null = null;
  for (let i = 0; i < req.count; i++) {
    const pair = pickPair(pool, previous, rng);
    out.push(buildQuestion(pair, req.difficulty, req.choicesCount, rng));
    previous = pair;
  }
  return out;
}
```

- [ ] **Step 3: Add a focused distractor-count test**

Open `tests/domain/QuestionGenerator.spec.ts` (create if it does not exist). Add:

```ts
import { describe, it, expect } from "vitest";
import { generateSession } from "../../src/domain/QuestionGenerator";

describe("generateSession choicesCount", () => {
  it("produces exactly choicesCount choices per question", () => {
    const session = generateSession({
      pairs: [{ a: 4, b: 7 }],
      difficulty: "medium",
      count: 3,
      choicesCount: 6,
      seed: 1,
    });
    expect(session).toHaveLength(3);
    for (const q of session) expect(q.choices).toHaveLength(6);
  });
});
```

- [ ] **Step 4: Run the new test (will fail compile elsewhere — run only this file)**

Run: `pnpm exec vitest run tests/domain/QuestionGenerator.spec.ts`
Expected: PASS for the new test.

If the file already had tests, leave them and add the new `describe` block alongside.

---

## Task 4: `TREE_PERCHES_BY_COUNT` and update consumers of `TREE_PERCHES`

**Files:**
- Modify: `src/config/dimensions.ts`
- Modify: `src/entities/Tree.ts`
- Modify: `src/scenes/manche.ts`
- Modify: `tests/entities/Tree.spec.ts`

- [ ] **Step 1: Replace `TREE_PERCHES` in `dimensions.ts`**

Replace the export with:

```ts
import type { RabbitsCount } from "../services/Settings";

export type Perch = { readonly x: number; readonly y: number };

export const TREE_PERCHES_BY_COUNT: Record<RabbitsCount, ReadonlyArray<Perch>> = {
  4: [
    { x: 605, y: 110 },
    { x: 770, y: 175 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  5: [
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  6: [
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 665, y: 240 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  7: [
    { x: 425, y: 130 },
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 665, y: 240 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  8: [
    { x: 425, y: 130 },
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 665, y: 240 },
    { x: 770, y: 260 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
};

export const TREE_PERCHES = TREE_PERCHES_BY_COUNT[4];
```

(Keep the `TREE_PERCHES` alias temporarily — `Tree.ts` uses it for branch/leaf placement, which we are not redrawing for variable counts in this iteration. The alias gets removed only if it becomes orphan.)

- [ ] **Step 2: Update `Tree.ts` to use `TREE_PERCHES_BY_COUNT[4]`**

In `src/entities/Tree.ts`, change the import line:

```ts
import { TREE_PERCHES_BY_COUNT, GROUND_Y, TREE_TRUNK_X } from "../config/dimensions";
const TREE_PERCHES = TREE_PERCHES_BY_COUNT[4];
```

The drawn tree keeps 4 branches because it is a placeholder pending PNG art per rabbit count.

- [ ] **Step 3: Update `Tree.spec.ts`**

Replace the failing assertion with:

```ts
import { TREE_PERCHES_BY_COUNT } from "../../src/config/dimensions";
// ...
expect(perches).toEqual(TREE_PERCHES_BY_COUNT[4]);
```

- [ ] **Step 4: Update `manche.ts` to receive a `perches` parameter**

Replace the file:

```ts
import { Container } from "pixi.js";
import { DESIGN_WIDTH, type Perch } from "../config/dimensions";
import { createRabbit, type Rabbit } from "../entities/Rabbit";
import { tweenObject } from "../entities/animations/Tween";
import type { Question } from "../domain/Question";

export interface MancheTransitionDeps {
  view: Container;
  rabbits: Rabbit[];
  perches: ReadonlyArray<Perch>;
}

const SLIDE_OFFSET = DESIGN_WIDTH + 100;
const SLIDE_IN_MS = 800;

export function assignNumbersForRound(rabbits: readonly Rabbit[], q: Question): void {
  const inPlay = rabbits.filter((r) => !r.isFallen());
  if (inPlay.length === 0) return;
  const distractors = q.choices.filter((c) => c !== q.answer);
  const answerSlot = Math.floor(Math.random() * inPlay.length);
  let d = 0;
  inPlay.forEach((r, i) => {
    r.setNumber(i === answerSlot ? q.answer : (distractors[d++] ?? q.answer));
  });
}

const dismissOldRabbits = async (rabbits: readonly Rabbit[]): Promise<void> => {
  const fallen = rabbits.filter((r) => r.isFallen());
  await Promise.all(fallen.map((r) => r.playHopInPlace()));
  await Promise.all(fallen.map((r) => r.playRunAwayRight(SLIDE_OFFSET)));
};

const removeRabbitViews = (rabbits: readonly Rabbit[]): void => {
  for (const r of rabbits) r.view.parent?.removeChild(r.view);
};

const spawnFreshRabbits = (view: Container, perches: ReadonlyArray<Perch>): Rabbit[] =>
  perches.map((p) => {
    const r = createRabbit({ position: { x: p.x + SLIDE_OFFSET, y: p.y } });
    r.view.position.set(p.x + SLIDE_OFFSET, p.y);
    view.addChild(r.view);
    return r;
  });

const slideRabbitsIn = async (
  rabbits: readonly Rabbit[],
  perches: ReadonlyArray<Perch>,
): Promise<void> => {
  await Promise.all(
    rabbits.map((r, i) => {
      const target = perches[i]!.x;
      r.position.x = target;
      return tweenObject(r.view.position, { x: target }, SLIDE_IN_MS);
    }),
  );
};

export async function playMancheTransition(deps: MancheTransitionDeps): Promise<void> {
  await dismissOldRabbits(deps.rabbits);
  removeRabbitViews(deps.rabbits);
  const fresh = spawnFreshRabbits(deps.view, deps.perches);
  deps.rabbits.length = 0;
  deps.rabbits.push(...fresh);
  await slideRabbitsIn(fresh, deps.perches);
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit 2>&1 | head -30`
Expected: errors only in `GameScene.ts` and `gameRound.ts` (next tasks fix them).

Do not commit yet.

---

## Task 5: Wire `GameScene` to the new shape and constants

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Replace the file contents**

```ts
import { Container } from "pixi.js";
import { createBackground, type Background } from "../entities/Background";
import { createTree, type Tree } from "../entities/Tree";
import { createRabbit, type Rabbit } from "../entities/Rabbit";
import { createSlingshot, type Slingshot } from "../entities/Slingshot";
import { createMathSign, type MathSign } from "../entities/MathSign";
import { createCarrotCounter, type CarrotCounter } from "../entities/CarrotCounter";
import { createGearButton, type GearButton } from "../entities/GearButton";
import { createFullscreenButton, type FullscreenButton } from "../entities/FullscreenButton";
import { TREE_PERCHES_BY_COUNT, type Perch } from "../config/dimensions";
import type { Settings } from "../services/Settings";
import {
  CARROTS_PER_ROUND,
  DEFAULT_DIFFICULTY,
  ROUNDS_PER_SESSION,
} from "../domain/sessionConfig";
import type { PhysicsWorld } from "../core/PhysicsWorld";
import type { Scene } from "../core/Scene";
import { generateSession } from "../domain/QuestionGenerator";
import { createSession, type Session } from "../domain/Session";
import { installRoundFlow, type RoundFlow } from "./gameRound";

export interface GameSceneDeps {
  settings: Settings;
  physics: PhysicsWorld;
  onOpenSettings(): void;
  onSessionRestart(): void;
  onToggleFullscreen(): void;
  delay?: (ms: number) => Promise<void>;
}

export interface GameScene extends Scene {
  rabbits(): readonly Rabbit[];
  mathSign(): MathSign;
  session(): Session;
  forceCorrectHit(): void;
  forceWrongHit(rabbitIndex?: number): void;
}

interface Parts {
  view: Container;
  background: Background;
  tree: Tree;
  slingshot: Slingshot;
  sign: MathSign;
  counter: CarrotCounter;
  gear: GearButton;
  fullscreen: FullscreenButton;
  rabbits: Rabbit[];
  session: Session;
  perches: ReadonlyArray<Perch>;
}

const newSession = (settings: Settings): Session => {
  const rounds = generateSession({
    pairs: settings.selectedPairs,
    difficulty: DEFAULT_DIFFICULTY,
    count: ROUNDS_PER_SESSION,
    choicesCount: settings.rabbitsCount,
    seed: Date.now(),
  });
  return createSession({ rounds, carrotsPerRound: CARROTS_PER_ROUND });
};

const buildRabbits = (
  choices: readonly number[],
  perches: ReadonlyArray<Perch>,
): Rabbit[] =>
  perches.map((p, i) => {
    const r = createRabbit({ position: { x: p.x, y: p.y } });
    r.setNumber(choices[i] ?? 0);
    return r;
  });

const assembleScene = (deps: GameSceneDeps): Parts => {
  const view = new Container();
  const background = createBackground();
  const tree = createTree();
  const slingshot = createSlingshot();
  const sign = createMathSign();
  const counter = createCarrotCounter(CARROTS_PER_ROUND - 1);
  const gear = createGearButton({ onTap: deps.onOpenSettings });
  const fullscreen = createFullscreenButton({ onTap: deps.onToggleFullscreen });
  const session = newSession(deps.settings);
  const perches = TREE_PERCHES_BY_COUNT[deps.settings.rabbitsCount];
  const rabbits = buildRabbits(session.currentQuestion().choices, perches);
  sign.setQuestion(session.currentQuestion());
  return { view, background, tree, slingshot, sign, counter, gear, fullscreen, rabbits, session, perches };
};

const attachChildren = (parts: Parts): void => {
  parts.view.addChild(parts.background.view);
  parts.view.addChild(parts.tree.view);
  parts.view.addChild(parts.slingshot.view);
  parts.view.addChild(parts.sign.view);
  parts.view.addChild(parts.counter.view);
  parts.view.addChild(parts.gear.view);
  parts.view.addChild(parts.fullscreen.view);
  for (const r of parts.rabbits) parts.view.addChild(r.view);
};

const defaultDelay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const wireFlow = (deps: GameSceneDeps, parts: Parts): RoundFlow =>
  installRoundFlow({
    view: parts.view,
    physics: deps.physics,
    slingshot: parts.slingshot,
    rabbits: parts.rabbits,
    sign: parts.sign,
    counter: parts.counter,
    session: parts.session,
    perches: parts.perches,
    delay: deps.delay ?? defaultDelay,
    onSessionEnd: () => deps.onSessionRestart(),
  });

const buildSceneApi = (parts: Parts, flow: RoundFlow): GameScene => ({
  id: "game",
  view: parts.view,
  rabbits: () => parts.rabbits,
  mathSign: () => parts.sign,
  session: () => parts.session,
  forceCorrectHit: () => flow.forceCorrectHit(),
  forceWrongHit: (i?: number) => flow.forceWrongHit(i),
  onEnter: () => {},
  onExit: () => {},
  onTick: (dt) => flow.tick(dt),
  pause: () => {},
  resume: () => {},
  destroy: () => {
    flow.destroy();
    parts.view.destroy({ children: true });
  },
});

export function createGameScene(deps: GameSceneDeps): GameScene {
  const parts = assembleScene(deps);
  attachChildren(parts);
  const flow = wireFlow(deps, parts);
  return buildSceneApi(parts, flow);
}
```

Note: `RoundFlowDeps.settings` is replaced by `RoundFlowDeps.perches`. The constants for `carrotsPerRound` are imported in `gameRound.ts` directly (Task 6).

- [ ] **Step 2: Typecheck (errors should now be confined to `gameRound.ts`)**

Run: `pnpm exec tsc --noEmit 2>&1 | head -30`
Expected: errors only in `src/scenes/gameRound.ts`.

---

## Task 6: Wire `gameRound` to the new shape

**Files:**
- Modify: `src/scenes/gameRound.ts`

- [ ] **Step 1: Replace `Settings` import with constants + `Perch`**

Change the imports:

```ts
import type { Perch } from "../config/dimensions";
import { CARROTS_PER_ROUND } from "../domain/sessionConfig";
```

Remove the existing `import type { Settings } from "../services/Settings";`.

- [ ] **Step 2: Update `RoundFlowDeps`**

```ts
export interface RoundFlowDeps {
  view: Container;
  physics: PhysicsWorld;
  slingshot: Slingshot;
  rabbits: Rabbit[];
  sign: MathSign;
  counter: CarrotCounter;
  session: Session;
  perches: ReadonlyArray<Perch>;
  delay: (ms: number) => Promise<void>;
  onSessionEnd(): void;
}
```

- [ ] **Step 3: Replace `d.settings.carrotsPerRound` with the constant in `refresh`**

```ts
const refresh = (d: RoundFlowDeps): void => {
  const q = d.session.currentQuestion();
  d.sign.setQuestion(q); assignNumbersForRound(d.rabbits, q);
  d.counter.setRemaining(CARROTS_PER_ROUND - 1);
};
```

- [ ] **Step 4: Pass `perches` into `playMancheTransition`**

In the `advance` function, change:

```ts
if (d.rabbits.every((r) => r.isFallen())) await playMancheTransition({ view: d.view, rabbits: d.rabbits });
```

to:

```ts
if (d.rabbits.every((r) => r.isFallen())) await playMancheTransition({ view: d.view, rabbits: d.rabbits, perches: d.perches });
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 6: Run the full test suite (some failures expected — they are addressed in Task 7+)**

Run: `pnpm exec vitest run --reporter=dot 2>&1 | tail -10`
Expected: failures in `SettingsScene.spec.ts` and `GameScene.round.spec.ts`. PASS for `Settings.spec.ts`, `Tree.spec.ts`, `QuestionGenerator.spec.ts`.

---

## Task 7: Refactor `SettingsPanel.ts`

**Files:**
- Modify: `src/scenes/SettingsPanel.ts`

- [ ] **Step 1: Remove obsolete options/labels and add `RABBITS_OPTIONS`**

Replace the top of the file (above `cycle`) with:

```ts
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, STROKE } from "../config/theme";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config/dimensions";
import type { Pair } from "../domain/tables";
import type { Settings, RabbitsCount } from "../services/Settings";

export const RABBITS_OPTIONS: ReadonlyArray<RabbitsCount> = [4, 5, 6, 7, 8];
```

Drop these exports entirely: `DIFFICULTIES`, `ROUNDS_OPTIONS`, `CARROTS_OPTIONS`, `difficultyLabel`, `onOff` (only `onOff` is still used — keep it; the others go).

After the change the kept exports are: `RABBITS_OPTIONS`, `cycle`, `arrayEqualPairs`, `sessionImpactingChanged`, `onOff`.

- [ ] **Step 2: Update `sessionImpactingChanged`**

```ts
export const sessionImpactingChanged = (a: Settings, b: Settings): boolean =>
  !arrayEqualPairs(a.selectedPairs, b.selectedPairs) ||
  a.rabbitsCount !== b.rabbitsCount;
```

- [ ] **Step 3: Shrink the panel**

Change `PANEL_H` from `320` to `220`.

- [ ] **Step 4: Verify the panel-specific tests**

There is no dedicated `SettingsPanel.spec.ts`. The `cycle` and `sessionImpactingChanged` tests live in `SettingsScene.spec.ts` (rewritten in Task 9).

---

## Task 8: Refactor `SettingsScene.ts`

**Files:**
- Modify: `src/scenes/SettingsScene.ts`

- [ ] **Step 1: Replace the file contents**

```ts
import { Container } from "pixi.js";
import type { Settings, RabbitsCount } from "../services/Settings";
import type { Scene } from "../core/Scene";
import type { Pair } from "../domain/tables";
import {
  createPanelBackground,
  createPanelTitle,
  createCycleRow,
  createCloseButton,
  createConfirmPrompt,
  RABBITS_OPTIONS,
  cycle,
  sessionImpactingChanged,
  onOff,
} from "./SettingsPanel";

export interface SettingsSceneDeps {
  initial: Settings;
  onChange(next: Settings): void;
  onClose(next: Settings, restartRequested: boolean): void;
  onOpenCalcsPicker(currentSelection: Pair[]): Promise<Pair[]>;
}

export interface SettingsScene extends Scene {
  setSelectedPairs(pairs: Pair[]): void;
  setRabbitsCount(n: RabbitsCount): void;
  setTapMode(on: boolean): void;
  confirmCloseWith(restart: boolean): void;
}

interface State {
  current: Settings;
}

const applyPatch = (
  state: State,
  deps: SettingsSceneDeps,
  patch: Partial<Settings>,
): void => {
  state.current = { ...state.current, ...patch };
  deps.onChange(state.current);
};

const buildSetters = (
  state: State,
  deps: SettingsSceneDeps,
): Omit<SettingsScene, keyof Scene> => ({
  setSelectedPairs: (pairs) => applyPatch(state, deps, { selectedPairs: pairs }),
  setRabbitsCount: (n) => applyPatch(state, deps, { rabbitsCount: n }),
  setTapMode: (on) => applyPatch(state, deps, { tapMode: on }),
  confirmCloseWith: (restart) => deps.onClose(state.current, restart),
});

const buildSceneShell = (view: Container): Scene => ({
  id: "settings",
  view,
  onEnter: () => {},
  onExit: () => {},
  onTick: () => {},
  pause: () => {},
  resume: () => {},
  destroy: () => view.destroy({ children: true }),
});

interface RowCtx {
  view: Container;
  state: State;
  deps: SettingsSceneDeps;
  update: (patch: Partial<Settings>) => void;
}

const calcsValueText = (n: number): string => `${n} / 90 calculs`;

const addQuestionsRow = (ctx: RowCtx): void => {
  const row = createCycleRow("Questions", 0);
  const refresh = (): void =>
    row.setValue(calcsValueText(ctx.state.current.selectedPairs.length));
  refresh();
  row.onTap(async () => {
    const next = await ctx.deps.onOpenCalcsPicker(ctx.state.current.selectedPairs);
    ctx.update({ selectedPairs: next });
    refresh();
  });
  ctx.view.addChild(row.view);
};

const addRabbitsRow = (ctx: RowCtx): void => {
  const row = createCycleRow("Nombre de lapins", 1);
  const refresh = (): void => row.setValue(String(ctx.state.current.rabbitsCount));
  refresh();
  row.onTap(() => {
    const next = cycle(RABBITS_OPTIONS, ctx.state.current.rabbitsCount);
    ctx.update({ rabbitsCount: next });
    refresh();
  });
  ctx.view.addChild(row.view);
};

const addTapModeRow = (ctx: RowCtx): void => {
  const row = createCycleRow("Mode tap (accessibilité)", 2);
  const refresh = (): void => row.setValue(onOff(ctx.state.current.tapMode));
  refresh();
  row.onTap(() => {
    const next = !ctx.state.current.tapMode;
    ctx.update({ tapMode: next });
    refresh();
  });
  ctx.view.addChild(row.view);
};

const buildAllRows = (ctx: RowCtx): void => {
  addQuestionsRow(ctx);
  addRabbitsRow(ctx);
  addTapModeRow(ctx);
};

const installCloseFlow = (
  ctx: RowCtx,
  initial: Settings,
  onClose: (s: Settings, r: boolean) => void,
): void => {
  let close: Container | null = null;
  const closeNow = (restart: boolean) => onClose(ctx.state.current, restart);
  const showConfirm = () => {
    if (close) ctx.view.removeChild(close);
    const prompt = createConfirmPrompt("Recommencer la partie ?",
      () => closeNow(true), () => closeNow(false));
    ctx.view.addChild(prompt);
  };
  close = createCloseButton("Fermer", () =>
    sessionImpactingChanged(initial, ctx.state.current) ? showConfirm() : closeNow(false));
  ctx.view.addChild(close);
};

const buildVisualPanel = (
  view: Container,
  state: State,
  deps: SettingsSceneDeps,
): void => {
  view.addChild(createPanelBackground());
  view.addChild(createPanelTitle("Paramètres"));
  const ctx: RowCtx = {
    view,
    state,
    deps,
    update: (patch) => applyPatch(state, deps, patch),
  };
  buildAllRows(ctx);
  installCloseFlow(ctx, deps.initial, deps.onClose);
};

export function createSettingsScene(deps: SettingsSceneDeps): SettingsScene {
  const view = new Container();
  const state: State = { current: { ...deps.initial } };
  buildVisualPanel(view, state, deps);
  return { ...buildSceneShell(view), ...buildSetters(state, deps) };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`

The remaining test failures are in `SettingsScene.spec.ts` and `GameScene.round.spec.ts` — Task 9 fixes them.

---

## Task 9: Update affected test files

**Files:**
- Modify: `tests/scenes/SettingsScene.spec.ts`
- Modify: `tests/scenes/GameScene.round.spec.ts`
- Verify: `tests/domain/Session.spec.ts` (no edit if it already imports `carrotsPerRound` literally)

- [ ] **Step 1: Rewrite `tests/scenes/SettingsScene.spec.ts`**

```ts
import { describe, it, expect, vi } from "vitest";
import { createSettingsScene } from "../../src/scenes/SettingsScene";
import { cycle, sessionImpactingChanged } from "../../src/scenes/SettingsPanel";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";

const stubDeps = {
  onOpenCalcsPicker: async () => DEFAULT_SETTINGS.selectedPairs,
};

const makeScene = (
  overrides: Partial<Parameters<typeof createSettingsScene>[0]> = {},
) =>
  createSettingsScene({
    initial: DEFAULT_SETTINGS,
    onChange: () => {},
    onClose: () => {},
    ...stubDeps,
    ...overrides,
  });

describe("SettingsScene setRabbitsCount emits onChange", () => {
  it("emits onChange with the patched settings", () => {
    const onChange = vi.fn();
    const scene = makeScene({ onChange });
    scene.setRabbitsCount(6);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ rabbitsCount: 6 }),
    );
  });
});

describe("SettingsScene setSelectedPairs emits onChange", () => {
  it("emits onChange with the new pairs", () => {
    const onChange = vi.fn();
    const scene = makeScene({ onChange });
    const pairs = [{ a: 2, b: 3 }, { a: 5, b: 6 }];
    scene.setSelectedPairs(pairs);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selectedPairs: pairs }),
    );
  });
});

describe("SettingsScene setTapMode emits onChange", () => {
  it("emits onChange with the new tapMode", () => {
    const onChange = vi.fn();
    const scene = makeScene({ onChange });
    scene.setTapMode(true);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tapMode: true }),
    );
  });
});

describe("SettingsScene close", () => {
  it("confirmCloseWith fires onClose with latest settings and restartRequested", () => {
    const onClose = vi.fn();
    const scene = makeScene({ onClose });
    scene.setRabbitsCount(7);
    scene.confirmCloseWith(true);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({ rabbitsCount: 7 }),
      true,
    );
  });
});

describe("SettingsScene close without changes", () => {
  it("does NOT prompt for restart when nothing changed", () => {
    const onClose = vi.fn();
    const scene = makeScene({ onClose });
    scene.confirmCloseWith(false);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining(DEFAULT_SETTINGS),
      false,
    );
  });
});

describe("cycle", () => {
  it("returns the next element wrapping at the end", () => {
    expect(cycle(["a", "b", "c"], "a")).toBe("b");
    expect(cycle(["a", "b", "c"], "c")).toBe("a");
  });
});

describe("sessionImpactingChanged true cases", () => {
  it("returns true when selectedPairs or rabbitsCount changes", () => {
    const a = DEFAULT_SETTINGS;
    expect(sessionImpactingChanged(a, { ...a, rabbitsCount: 6 })).toBe(true);
    const fewer = a.selectedPairs.slice(0, 5);
    expect(sessionImpactingChanged(a, { ...a, selectedPairs: fewer })).toBe(true);
  });
});

describe("sessionImpactingChanged false cases", () => {
  it("returns false when only tapMode changes", () => {
    const a = DEFAULT_SETTINGS;
    expect(sessionImpactingChanged(a, { ...a, tapMode: !a.tapMode })).toBe(false);
  });

  it("returns false when selectedPairs has same content in different order", () => {
    const a = DEFAULT_SETTINGS;
    const reversed = [...a.selectedPairs].reverse();
    expect(sessionImpactingChanged(a, { ...a, selectedPairs: reversed })).toBe(false);
  });
});
```

- [ ] **Step 2: Rewrite `tests/scenes/GameScene.round.spec.ts`**

```ts
import { describe, it, expect } from "vitest";
import { createGameScene } from "../../src/scenes/GameScene";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";
import { CARROTS_PER_ROUND } from "../../src/domain/sessionConfig";
import { createPhysicsWorld } from "../../src/core/PhysicsWorld";

const baseDeps = {
  onOpenSettings: () => {},
  onSessionRestart: () => {},
  onToggleFullscreen: () => {},
};

describe("GameScene round flow — score", () => {
  it("forceCorrectHit advances score by 1", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({ settings: DEFAULT_SETTINGS, physics, ...baseDeps });
    const before = scene.session().snapshot().score;
    scene.forceCorrectHit();
    expect(scene.session().snapshot().score).toBe(before + 1);
    physics.destroy();
  });
});

describe("GameScene round flow — round end after misses", () => {
  it("after CARROTS_PER_ROUND wrong hits, the round is over with no score", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({ settings: DEFAULT_SETTINGS, physics, ...baseDeps });
    for (let i = 0; i < CARROTS_PER_ROUND; i++) scene.forceWrongHit();
    expect(scene.session().snapshot().score).toBe(0);
    expect(scene.session().snapshot().phase).toBe("round_over");
    physics.destroy();
  });
});

describe("GameScene rabbit count", () => {
  it("creates rabbitsCount rabbits", () => {
    for (const n of [4, 5, 6, 7, 8] as const) {
      const physics = createPhysicsWorld();
      const scene = createGameScene({
        settings: { ...DEFAULT_SETTINGS, rabbitsCount: n },
        physics,
        ...baseDeps,
      });
      expect(scene.rabbits()).toHaveLength(n);
      physics.destroy();
    }
  });
});
```

The "single carrot round" test is dropped because `carrotsPerRound` is no longer player-controllable. Coverage of round-end logic is preserved by the loop in the second describe block.

- [ ] **Step 3: Verify other tests are unaffected**

Run: `pnpm exec vitest run --reporter=dot`
Expected: all tests PASS.

If `tests/domain/Session.spec.ts` fails because it references something now removed, fix in place — it should still take a literal `carrotsPerRound: N` to `createSession` (the engine API has not changed).

---

## Task 10: Visual smoke-check, cleanup, commit

- [ ] **Step 1: Final typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 2: Final test run**

Run: `pnpm exec vitest run --reporter=dot 2>&1 | tail -5`
Expected: all tests PASS.

- [ ] **Step 3: Drop the `TREE_PERCHES` alias if `Tree.ts` is its only consumer**

Run: `grep -rn "TREE_PERCHES\b" /Users/pauldoazan/Projets/Perso/rabbit-math/src /Users/pauldoazan/Projets/Perso/rabbit-math/tests | grep -v TREE_PERCHES_BY_COUNT`
If the only matches are inside `src/entities/Tree.ts` (the local re-binding), inline `TREE_PERCHES_BY_COUNT[4]` directly and remove the alias from `dimensions.ts`. Otherwise keep the alias.

- [ ] **Step 4: Visual smoke check**

Run: `pnpm dev` (background) and open the served URL in a browser.

Verify by clicking through:
- The settings menu shows exactly 3 rows: Questions, Nombre de lapins, Mode tap.
- Cycling "Nombre de lapins" through 4 → 5 → 6 → 7 → 8 → 4 changes the row label.
- Closing settings after changing rabbit count prompts for restart.
- A new game with each of the five rabbit counts spawns the right number of rabbits at distinct, reachable positions on the tree (test by launching carrots — all rabbits should be hittable).
- After all rabbits fall, the manche transition spawns N fresh rabbits.

If a rabbit is unreachable (parabola blocked by another rabbit in the same column), note the offending pair and propose a coordinate adjustment in `TREE_PERCHES_BY_COUNT`. The user will decide whether to ship as-is (per the spec, positions are placeholders pending PNG art) or tweak.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(settings): trim menu to 3 rows + variable rabbit count (4-8)

Drop roundsPerSession, carrotsPerRound, difficulty, soundEnabled,
musicEnabled from Settings. Their fixed values move to
src/domain/sessionConfig.ts. Add rabbitsCount: 4|5|6|7|8 driving
TREE_PERCHES_BY_COUNT and the choices-per-question count.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

- **Spec coverage:** Each spec section is covered — Final menu (Task 8), Settings shape (Task 2), Constants (Task 1, used in Tasks 5/6/9), Perch layout (Task 4), Distractors (Task 3), GameScene.buildRabbits (Task 5), Settings panel rewiring (Tasks 7/8), Tests (Tasks 2/3/4/9), sound/music verification (Task 2 drops them; if a hidden reference exists Task 5 typecheck would catch it).
- **Type consistency:** `RabbitsCount`, `Perch`, `RoundFlowDeps`, `Settings`, `MancheTransitionDeps` signatures all match across tasks.
- **Placeholder scan:** All steps contain concrete code; no TBD/TODO. Ballistic-constraint validation is done visually in Task 10 step 4 (no automated test, per spec).
- **Scope:** Single coherent plan, no decomposition needed.
