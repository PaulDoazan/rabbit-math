# Rabbit Math — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based, mobile-landscape Angry-Birds-style multiplication game where the player slings carrots at rabbits perched in a tree and must hit the rabbit holding the correct answer.

**Architecture:** Layered TypeScript with a fully-tested pure domain (no external deps), a thin services layer (localStorage / Audio), Pixi+Matter wrappers in `core/`, entities that own both their PixiJS Graphics and their Matter body, systems that compose entities into gameplay, and a single `GameScene` orchestrating everything. End-of-session sequence happens in-place, no separate result screen.

**Tech Stack:** TypeScript (strict), Vite, PixiJS v8, Matter.js, Vitest + jsdom, ESLint + Prettier, pnpm. CI: GitHub Actions (`lint + test + build`).

**Spec:** [`planning/specs/2026-04-24-rabbit-math-design.md`](../specs/2026-04-24-rabbit-math-design.md). Refer to this file for visual references, exact palette values, animation descriptions, and acceptance criteria. The plan does not duplicate the spec — it implements it.

**Constraints:**
- Functions ≤ 20 lines.
- Files ≤ 200 lines.
- TypeScript strict, no implicit `any`.
- Tests written before implementation for every task with logic.
- One commit per completed task.

---

## Phase 0 — Bootstrap

### Task 1: Initialize project (pnpm, package.json, deps)

**Files:**
- Create: `package.json`

- [ ] **Step 1: Verify pnpm is available**

Run: `pnpm --version`
Expected: prints a version (v8 or v9). If missing, install with `npm i -g pnpm`.

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "rabbit-math",
  "version": "0.1.0",
  "private": true,
  "type": "module",
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

- [ ] **Step 3: Add runtime dependencies**

Run:
```bash
pnpm add pixi.js matter-js @tweenjs/tween.js
```

- [ ] **Step 4: Add dev dependencies**

Run:
```bash
pnpm add -D typescript vite vitest @vitest/ui @vitest/coverage-v8 jsdom \
  @types/matter-js \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  prettier
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: bootstrap project (pnpm, vite, pixi, matter, vitest)"
```

---

### Task 2: TypeScript + Vite config

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts` (placeholder)

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useDefineForClassFields": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 2: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { alias: { "@": "/src" } },
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts", "src/**/*.d.ts"]
    }
  }
});
```

- [ ] **Step 3: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>Rabbit Math</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #111; overflow: hidden; touch-action: none; overscroll-behavior: none; }
    #game-root { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div id="game-root"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: Write placeholder `src/main.ts`**

```ts
console.log("Rabbit Math bootstrapped");
```

- [ ] **Step 5: Verify dev server starts**

Run: `pnpm dev`
Expected: Vite serves at `http://localhost:5173`, console shows "Rabbit Math bootstrapped". Stop with Ctrl-C.

- [ ] **Step 6: Verify build succeeds**

Run: `pnpm build`
Expected: TypeScript + Vite produce a `dist/` folder without errors.

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "chore: typescript + vite config and entry point"
```

---

### Task 3: ESLint + Prettier with line / function limits

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Create: `.prettierignore`

- [ ] **Step 1: Write `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module", project: "./tsconfig.json" },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "max-lines": ["error", { max: 200, skipBlankLines: true, skipComments: true }],
    "max-lines-per-function": ["error", { max: 20, skipBlankLines: true, skipComments: true, IIFEs: true }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
  },
  ignorePatterns: ["dist", "node_modules", "coverage", "*.cjs"]
};
```

- [ ] **Step 2: Write `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 3: Write `.prettierignore`**

```
dist
coverage
node_modules
pnpm-lock.yaml
.superpowers
```

- [ ] **Step 4: Verify lint passes on placeholder code**

Run: `pnpm lint`
Expected: passes with no errors.

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.cjs .prettierrc .prettierignore
git commit -m "chore: eslint with 20-line function / 200-line file limits, prettier"
```

---

### Task 4: Vitest sanity test

**Files:**
- Create: `tests/sanity.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run test → PASS**

Run: `pnpm test`
Expected: 1 test passes.

- [ ] **Step 3: Commit**

```bash
git add tests/sanity.spec.ts
git commit -m "test: vitest sanity check"
```

---

### Task 5: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint + test + build on push and PR"
git push
```

- [ ] **Step 3: Verify CI green**

Open `https://github.com/PaulDoazan/rabbit-math/actions` and confirm the workflow passes.

---

## Phase 1 — Domain (pure TypeScript, fully tested)

### Task 6: Seeded random utility

**Why:** All randomness in the domain must be reproducible for tests. We expose a small `Rng` interface that tests can substitute with deterministic values.

**Files:**
- Create: `src/domain/Rng.ts`
- Test: `tests/domain/Rng.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { mulberry32, pickFrom, shuffle } from "../../src/domain/Rng";

describe("mulberry32", () => {
  it("produces deterministic sequences for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produces values in [0, 1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("pickFrom", () => {
  it("returns an element from the array", () => {
    const r = mulberry32(7);
    const result = pickFrom([10, 20, 30], r);
    expect([10, 20, 30]).toContain(result);
  });

  it("throws on an empty array", () => {
    const r = mulberry32(1);
    expect(() => pickFrom([], r)).toThrow();
  });
});

describe("shuffle", () => {
  it("returns a permutation containing the same elements", () => {
    const r = mulberry32(99);
    const out = shuffle([1, 2, 3, 4, 5], r);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the input", () => {
    const r = mulberry32(99);
    const input = [1, 2, 3];
    shuffle(input, r);
    expect(input).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 2: Run → FAIL (module not found)**

Run: `pnpm test tests/domain/Rng.spec.ts`
Expected: fails because `src/domain/Rng.ts` does not exist.

- [ ] **Step 3: Implement `src/domain/Rng.ts`**

```ts
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(arr: readonly T[], rng: Rng): T {
  if (arr.length === 0) throw new Error("pickFrom: empty array");
  const i = Math.floor(rng() * arr.length);
  return arr[i] as T;
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
```

- [ ] **Step 4: Run → PASS**

Run: `pnpm test tests/domain/Rng.spec.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/Rng.ts tests/domain/Rng.spec.ts
git commit -m "feat(domain): seeded RNG (mulberry32, pickFrom, shuffle)"
```

---

### Task 7: Pre-defined multiplication tables data

**Files:**
- Create: `src/domain/tables.ts`
- Test: `tests/domain/tables.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { TABLE_LISTS, getTableList, type TableListId } from "../../src/domain/tables";

describe("tables data", () => {
  it("has exactly 8 lists", () => {
    expect(Object.keys(TABLE_LISTS)).toHaveLength(8);
  });

  it("includes all expected ids", () => {
    const ids: TableListId[] = [
      "table_2", "table_5", "table_10",
      "tables_2_5_10", "tables_3_4_6", "tables_7_8_9",
      "tables_all", "squares",
    ];
    for (const id of ids) expect(TABLE_LISTS[id]).toBeDefined();
  });

  it("table_2 contains 2x1..2x10", () => {
    const list = getTableList("table_2");
    expect(list.pairs).toHaveLength(10);
    expect(list.pairs[0]).toEqual({ a: 2, b: 1 });
    expect(list.pairs[9]).toEqual({ a: 2, b: 10 });
  });

  it("squares contains n*n for n in 2..10", () => {
    const list = getTableList("squares");
    expect(list.pairs).toEqual([
      { a: 2, b: 2 }, { a: 3, b: 3 }, { a: 4, b: 4 }, { a: 5, b: 5 },
      { a: 6, b: 6 }, { a: 7, b: 7 }, { a: 8, b: 8 }, { a: 9, b: 9 },
      { a: 10, b: 10 },
    ]);
  });

  it("tables_all has 9*10 = 90 pairs", () => {
    const list = getTableList("tables_all");
    expect(list.pairs).toHaveLength(90);
  });

  it("getTableList throws on unknown id", () => {
    expect(() => getTableList("nope" as TableListId)).toThrow();
  });
});
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm test tests/domain/tables.spec.ts`

- [ ] **Step 3: Implement `src/domain/tables.ts`**

```ts
export type TableListId =
  | "table_2" | "table_5" | "table_10"
  | "tables_2_5_10" | "tables_3_4_6" | "tables_7_8_9"
  | "tables_all" | "squares";

export interface Pair { readonly a: number; readonly b: number; }
export interface TableList { readonly id: TableListId; readonly label: string; readonly pairs: readonly Pair[]; }

const range = (lo: number, hi: number): number[] =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

const tablePairs = (multipliers: number[]): Pair[] =>
  multipliers.flatMap((a) => range(1, 10).map((b) => ({ a, b })));

const squarePairs = (): Pair[] => range(2, 10).map((n) => ({ a: n, b: n }));

export const TABLE_LISTS: Readonly<Record<TableListId, TableList>> = {
  table_2:        { id: "table_2",        label: "Table de 2",         pairs: tablePairs([2]) },
  table_5:        { id: "table_5",        label: "Table de 5",         pairs: tablePairs([5]) },
  table_10:       { id: "table_10",       label: "Table de 10",        pairs: tablePairs([10]) },
  tables_2_5_10:  { id: "tables_2_5_10",  label: "Tables faciles",     pairs: tablePairs([2, 5, 10]) },
  tables_3_4_6:   { id: "tables_3_4_6",   label: "Tables moyennes",    pairs: tablePairs([3, 4, 6]) },
  tables_7_8_9:   { id: "tables_7_8_9",   label: "Tables difficiles",  pairs: tablePairs([7, 8, 9]) },
  tables_all:     { id: "tables_all",     label: "Toutes les tables",  pairs: tablePairs(range(2, 10)) },
  squares:        { id: "squares",        label: "Carrés parfaits",    pairs: squarePairs() },
};

export function getTableList(id: TableListId): TableList {
  const list = TABLE_LISTS[id];
  if (!list) throw new Error(`Unknown table list: ${String(id)}`);
  return list;
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/tables.ts tests/domain/tables.spec.ts
git commit -m "feat(domain): 8 pre-defined multiplication table lists"
```

---

### Task 8: Difficulty config (distractor distance rules)

**Files:**
- Create: `src/domain/DifficultyConfig.ts`
- Test: `tests/domain/DifficultyConfig.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { generateDistractors, type Difficulty } from "../../src/domain/DifficultyConfig";
import { mulberry32 } from "../../src/domain/Rng";

const distancesFrom = (answer: number, distractors: number[]) =>
  distractors.map((d) => Math.abs(d - answer));

describe("generateDistractors", () => {
  it("returns 3 distinct distractors that exclude the answer", () => {
    const ds = generateDistractors(56, "medium", mulberry32(1));
    expect(ds).toHaveLength(3);
    expect(new Set(ds).size).toBe(3);
    expect(ds).not.toContain(56);
  });

  it("easy: every distance ≥ 10", () => {
    const ds = generateDistractors(56, "easy", mulberry32(2));
    for (const d of distancesFrom(56, ds)) expect(d).toBeGreaterThanOrEqual(10);
  });

  it("medium: every distance ∈ [3, 9]", () => {
    const ds = generateDistractors(56, "medium", mulberry32(3));
    for (const d of distancesFrom(56, ds)) {
      expect(d).toBeGreaterThanOrEqual(3);
      expect(d).toBeLessThanOrEqual(9);
    }
  });

  it("hard: every distance ∈ [1, 5] with at least one ±1 neighbour", () => {
    const ds = generateDistractors(56, "hard", mulberry32(4));
    for (const d of distancesFrom(56, ds)) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(5);
    }
    expect(distancesFrom(56, ds)).toContain(1);
  });

  it("all distractors are positive integers in [2, 100]", () => {
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    for (const diff of difficulties) {
      for (let seed = 1; seed < 30; seed++) {
        const ds = generateDistractors(56, diff, mulberry32(seed));
        for (const d of ds) {
          expect(Number.isInteger(d)).toBe(true);
          expect(d).toBeGreaterThanOrEqual(2);
          expect(d).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("falls back to a wider range if not enough candidates exist (small answer, easy)", () => {
    // answer = 4 ; easy needs distance ≥ 10 → only candidates ≥ 14
    const ds = generateDistractors(4, "easy", mulberry32(5));
    expect(ds).toHaveLength(3);
    expect(new Set(ds).size).toBe(3);
  });

  it("is deterministic for a given seed", () => {
    const a = generateDistractors(72, "medium", mulberry32(11));
    const b = generateDistractors(72, "medium", mulberry32(11));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/domain/DifficultyConfig.ts`**

```ts
import { shuffle, type Rng } from "./Rng";

export type Difficulty = "easy" | "medium" | "hard";

interface Range { readonly min: number; readonly max: number; }
const DIFFICULTY_RANGES: Record<Difficulty, Range> = {
  easy:   { min: 10, max: 100 },
  medium: { min: 3,  max: 9 },
  hard:   { min: 1,  max: 5 },
};

const candidatesIn = (answer: number, range: Range): number[] => {
  const out: number[] = [];
  for (let v = 2; v <= 100; v++) {
    if (v === answer) continue;
    const dist = Math.abs(v - answer);
    if (dist >= range.min && dist <= range.max) out.push(v);
  }
  return out;
};

const ensureNeighbour = (answer: number, picks: number[], pool: number[]): number[] => {
  if (picks.some((p) => Math.abs(p - answer) === 1)) return picks;
  const neighbours = pool.filter((v) => Math.abs(v - answer) === 1);
  if (neighbours.length === 0) return picks;
  const replaced = picks.slice();
  replaced[0] = neighbours[0] as number;
  return replaced;
};

const widenIfNeeded = (answer: number, range: Range, target: number): number[] => {
  let r = range;
  let pool = candidatesIn(answer, r);
  while (pool.length < target) {
    r = { min: Math.max(1, r.min - 1), max: r.max + 5 };
    pool = candidatesIn(answer, r);
    if (r.min === 1 && r.max >= 100) break;
  }
  return pool;
};

export function generateDistractors(answer: number, difficulty: Difficulty, rng: Rng): number[] {
  const range = DIFFICULTY_RANGES[difficulty];
  const pool = widenIfNeeded(answer, range, 3);
  if (pool.length < 3) {
    // eslint-disable-next-line no-console
    console.warn(`Not enough distractors for answer=${answer} difficulty=${difficulty}`);
  }
  const picks = shuffle(pool, rng).slice(0, 3);
  return difficulty === "hard" ? ensureNeighbour(answer, picks, pool) : picks;
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/DifficultyConfig.ts tests/domain/DifficultyConfig.spec.ts
git commit -m "feat(domain): difficulty rules for distractor distance (easy/medium/hard)"
```

---

### Task 9: Question generator

**Files:**
- Create: `src/domain/Question.ts`
- Create: `src/domain/QuestionGenerator.ts`
- Test: `tests/domain/QuestionGenerator.spec.ts`

- [ ] **Step 1: Write `Question` types**

`src/domain/Question.ts`:

```ts
export interface Question {
  readonly a: number;
  readonly b: number;
  readonly answer: number;
  readonly choices: readonly number[];
}
```

- [ ] **Step 2: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { generateSession } from "../../src/domain/QuestionGenerator";

describe("generateSession", () => {
  it("returns the requested number of questions", () => {
    const qs = generateSession({ tableListId: "tables_all", difficulty: "medium", count: 10, seed: 1 });
    expect(qs).toHaveLength(10);
  });

  it("each question has answer = a × b", () => {
    const qs = generateSession({ tableListId: "tables_all", difficulty: "medium", count: 10, seed: 2 });
    for (const q of qs) expect(q.answer).toBe(q.a * q.b);
  });

  it("each question has 4 distinct choices including the answer", () => {
    const qs = generateSession({ tableListId: "tables_all", difficulty: "medium", count: 10, seed: 3 });
    for (const q of qs) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
    }
  });

  it("choices are shuffled (the answer is not always at index 0)", () => {
    const qs = generateSession({ tableListId: "tables_all", difficulty: "medium", count: 30, seed: 4 });
    const positions = qs.map((q) => q.choices.indexOf(q.answer));
    expect(new Set(positions).size).toBeGreaterThan(1);
  });

  it("is deterministic for the same seed", () => {
    const a = generateSession({ tableListId: "tables_all", difficulty: "medium", count: 10, seed: 42 });
    const b = generateSession({ tableListId: "tables_all", difficulty: "medium", count: 10, seed: 42 });
    expect(a).toEqual(b);
  });

  it("does not repeat the same multiplication twice in a row", () => {
    const qs = generateSession({ tableListId: "table_2", difficulty: "medium", count: 10, seed: 1 });
    for (let i = 1; i < qs.length; i++) {
      const prev = qs[i - 1]!, cur = qs[i]!;
      const samePair = prev.a === cur.a && prev.b === cur.b;
      expect(samePair).toBe(false);
    }
  });
});
```

- [ ] **Step 3: Run → FAIL**

- [ ] **Step 4: Implement `src/domain/QuestionGenerator.ts`**

```ts
import { getTableList, type TableListId, type Pair } from "./tables";
import { generateDistractors, type Difficulty } from "./DifficultyConfig";
import { mulberry32, pickFrom, shuffle } from "./Rng";
import type { Question } from "./Question";

export interface SessionRequest {
  readonly tableListId: TableListId;
  readonly difficulty: Difficulty;
  readonly count: number;
  readonly seed: number;
}

const pickPair = (pool: readonly Pair[], previous: Pair | null, rng: () => number): Pair => {
  if (pool.length <= 1 || !previous) return pickFrom(pool, rng);
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = pickFrom(pool, rng);
    if (candidate.a !== previous.a || candidate.b !== previous.b) return candidate;
  }
  return pickFrom(pool, rng);
};

const buildQuestion = (pair: Pair, difficulty: Difficulty, rng: () => number): Question => {
  const answer = pair.a * pair.b;
  const distractors = generateDistractors(answer, difficulty, rng);
  return { a: pair.a, b: pair.b, answer, choices: shuffle([answer, ...distractors], rng) };
};

export function generateSession(req: SessionRequest): Question[] {
  const rng = mulberry32(req.seed);
  const pool = getTableList(req.tableListId).pairs;
  const out: Question[] = [];
  let previous: Pair | null = null;
  for (let i = 0; i < req.count; i++) {
    const pair = pickPair(pool, previous, rng);
    out.push(buildQuestion(pair, req.difficulty, rng));
    previous = pair;
  }
  return out;
}
```

- [ ] **Step 5: Run → PASS**

- [ ] **Step 6: Commit**

```bash
git add src/domain/Question.ts src/domain/QuestionGenerator.ts tests/domain/QuestionGenerator.spec.ts
git commit -m "feat(domain): seeded session generator with non-repeat guarantee"
```

---

### Task 10: Session state machine

**Files:**
- Create: `src/domain/Session.ts`
- Test: `tests/domain/Session.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createSession } from "../../src/domain/Session";
import type { Question } from "../../src/domain/Question";

const Q1: Question = { a: 7, b: 8, answer: 56, choices: [48, 56, 63, 54] };
const Q2: Question = { a: 6, b: 4, answer: 24, choices: [24, 28, 18, 36] };

describe("Session", () => {
  it("starts at index 0, score 0, full carrots, phase=aiming", () => {
    const s = createSession({ rounds: [Q1, Q2], carrotsPerRound: 3 });
    expect(s.snapshot()).toEqual({
      currentIndex: 0, score: 0, carrotsLeft: 3, phase: "aiming", totalRounds: 2,
    });
    expect(s.currentQuestion()).toEqual(Q1);
  });

  it("recordHit moves to round_over and increments score", () => {
    const s = createSession({ rounds: [Q1, Q2], carrotsPerRound: 3 });
    s.startResolving();
    s.recordHit();
    expect(s.snapshot().score).toBe(1);
    expect(s.snapshot().phase).toBe("round_over");
  });

  it("recordMiss decrements carrots and stays in resolving when carrots remain", () => {
    const s = createSession({ rounds: [Q1, Q2], carrotsPerRound: 3 });
    s.startResolving();
    s.recordMiss();
    expect(s.snapshot().carrotsLeft).toBe(2);
    expect(s.snapshot().phase).toBe("aiming");
  });

  it("recordMiss with the last carrot moves to round_over", () => {
    const s = createSession({ rounds: [Q1, Q2], carrotsPerRound: 1 });
    s.startResolving();
    s.recordMiss();
    expect(s.snapshot().carrotsLeft).toBe(0);
    expect(s.snapshot().phase).toBe("round_over");
  });

  it("nextRound advances index, resets carrots, returns to aiming", () => {
    const s = createSession({ rounds: [Q1, Q2], carrotsPerRound: 3 });
    s.startResolving();
    s.recordHit();
    s.nextRound();
    expect(s.snapshot()).toMatchObject({ currentIndex: 1, carrotsLeft: 3, phase: "aiming" });
    expect(s.currentQuestion()).toEqual(Q2);
  });

  it("nextRound from the last round transitions to session_over", () => {
    const s = createSession({ rounds: [Q1, Q2], carrotsPerRound: 3 });
    s.startResolving(); s.recordHit(); s.nextRound();
    s.startResolving(); s.recordMiss(); s.recordMiss(); s.recordMiss();
    s.nextRound();
    expect(s.snapshot().phase).toBe("session_over");
    expect(s.isOver()).toBe(true);
  });

  it("startResolving requires aiming phase", () => {
    const s = createSession({ rounds: [Q1], carrotsPerRound: 3 });
    s.startResolving();
    expect(() => s.startResolving()).toThrow();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/domain/Session.ts`**

```ts
import type { Question } from "./Question";

export type Phase = "aiming" | "resolving" | "round_over" | "session_over";

export interface SessionConfig {
  readonly rounds: readonly Question[];
  readonly carrotsPerRound: number;
}

export interface SessionSnapshot {
  readonly currentIndex: number;
  readonly score: number;
  readonly carrotsLeft: number;
  readonly phase: Phase;
  readonly totalRounds: number;
}

export interface Session {
  currentQuestion(): Question;
  snapshot(): SessionSnapshot;
  startResolving(): void;
  recordHit(): void;
  recordMiss(): void;
  nextRound(): void;
  isOver(): boolean;
}

export function createSession(cfg: SessionConfig): Session {
  let currentIndex = 0;
  let score = 0;
  let carrotsLeft = cfg.carrotsPerRound;
  let phase: Phase = "aiming";

  const requirePhase = (expected: Phase) => {
    if (phase !== expected) throw new Error(`Invalid phase: expected ${expected}, got ${phase}`);
  };

  return {
    currentQuestion: () => {
      const q = cfg.rounds[currentIndex];
      if (!q) throw new Error("No current question");
      return q;
    },
    snapshot: () => ({ currentIndex, score, carrotsLeft, phase, totalRounds: cfg.rounds.length }),
    startResolving: () => { requirePhase("aiming"); phase = "resolving"; },
    recordHit: () => { requirePhase("resolving"); score += 1; phase = "round_over"; },
    recordMiss: () => {
      requirePhase("resolving");
      carrotsLeft -= 1;
      phase = carrotsLeft > 0 ? "aiming" : "round_over";
    },
    nextRound: () => {
      if (phase !== "round_over") throw new Error(`nextRound requires round_over, got ${phase}`);
      const isLast = currentIndex === cfg.rounds.length - 1;
      if (isLast) { phase = "session_over"; return; }
      currentIndex += 1;
      carrotsLeft = cfg.carrotsPerRound;
      phase = "aiming";
    },
    isOver: () => phase === "session_over",
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/Session.ts tests/domain/Session.spec.ts
git commit -m "feat(domain): session state machine (aiming/resolving/round_over/session_over)"
```

---

## Phase 2 — Services

### Task 11: localStorage wrapper

**Files:**
- Create: `src/services/Storage.ts`
- Test: `tests/services/Storage.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { readJson, writeJson, removeKey } from "../../src/services/Storage";

beforeEach(() => localStorage.clear());

describe("Storage", () => {
  it("returns null when key is absent", () => {
    expect(readJson("k")).toBeNull();
  });

  it("round-trips a JSON-serialisable value", () => {
    writeJson("k", { a: 1, b: [2, 3] });
    expect(readJson("k")).toEqual({ a: 1, b: [2, 3] });
  });

  it("returns null when the stored value is invalid JSON", () => {
    localStorage.setItem("k", "{not json");
    expect(readJson("k")).toBeNull();
  });

  it("removeKey deletes the entry", () => {
    writeJson("k", 1);
    removeKey("k");
    expect(readJson("k")).toBeNull();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/services/Storage.ts`**

```ts
export function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/services/Storage.ts tests/services/Storage.spec.ts
git commit -m "feat(services): typed localStorage wrapper with JSON safety"
```

---

### Task 12: Settings model + persistence

**Files:**
- Create: `src/services/Settings.ts`
- Test: `tests/services/Settings.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, validateSettings } from "../../src/services/Settings";

beforeEach(() => localStorage.clear());

describe("Settings", () => {
  it("loadSettings returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("saveSettings then loadSettings round-trips", () => {
    const next = { ...DEFAULT_SETTINGS, difficulty: "hard" as const, roundsPerSession: 15 };
    saveSettings(next);
    expect(loadSettings()).toEqual(next);
  });

  it("loadSettings ignores invalid stored data", () => {
    localStorage.setItem("rabbit-math.settings", JSON.stringify({ tableListId: 12345 }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("validateSettings clamps roundsPerSession ≥ 1 and carrotsPerRound ≥ 1", () => {
    const bad = { ...DEFAULT_SETTINGS, roundsPerSession: 0, carrotsPerRound: 0 };
    const fixed = validateSettings(bad);
    expect(fixed.roundsPerSession).toBeGreaterThanOrEqual(1);
    expect(fixed.carrotsPerRound).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/services/Settings.ts`**

```ts
import { readJson, writeJson } from "./Storage";
import type { Difficulty } from "../domain/DifficultyConfig";
import type { TableListId } from "../domain/tables";

export interface Settings {
  tableListId: TableListId;
  roundsPerSession: number;
  carrotsPerRound: number;
  difficulty: Difficulty;
  tapMode: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export const SETTINGS_KEY = "rabbit-math.settings";

export const DEFAULT_SETTINGS: Settings = {
  tableListId: "tables_all",
  roundsPerSession: 10,
  carrotsPerRound: 3,
  difficulty: "medium",
  tapMode: false,
  soundEnabled: true,
  musicEnabled: true,
};

const isDifficulty = (v: unknown): v is Difficulty =>
  v === "easy" || v === "medium" || v === "hard";

const isShape = (v: unknown): v is Settings => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.tableListId === "string"
    && typeof o.roundsPerSession === "number"
    && typeof o.carrotsPerRound === "number"
    && isDifficulty(o.difficulty)
    && typeof o.tapMode === "boolean"
    && typeof o.soundEnabled === "boolean"
    && typeof o.musicEnabled === "boolean";
};

export function validateSettings(s: Settings): Settings {
  return {
    ...s,
    roundsPerSession: Math.max(1, Math.floor(s.roundsPerSession)),
    carrotsPerRound: Math.max(1, Math.floor(s.carrotsPerRound)),
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

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/services/Settings.ts tests/services/Settings.spec.ts
git commit -m "feat(services): settings model with defaults, persistence, validation"
```

---

### Task 13: Audio service interface (mocked)

**Files:**
- Create: `src/services/Audio.ts`
- Test: `tests/services/Audio.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, vi } from "vitest";
import { createAudio, type SoundId } from "../../src/services/Audio";

const fakeAudio = () => {
  const play = vi.fn(); const pause = vi.fn();
  return { play, pause, ctor: vi.fn(() => ({ play, pause, currentTime: 0, loop: false })) };
};

describe("Audio service", () => {
  it("plays a sfx when enabled", () => {
    const f = fakeAudio();
    const a = createAudio({ AudioCtor: f.ctor as unknown as typeof Audio, sfxEnabled: () => true, musicEnabled: () => false });
    a.playSfx("shot" as SoundId);
    expect(f.play).toHaveBeenCalledTimes(1);
  });

  it("does not play sfx when disabled", () => {
    const f = fakeAudio();
    const a = createAudio({ AudioCtor: f.ctor as unknown as typeof Audio, sfxEnabled: () => false, musicEnabled: () => false });
    a.playSfx("shot" as SoundId);
    expect(f.play).not.toHaveBeenCalled();
  });

  it("startMusic / stopMusic respects musicEnabled", () => {
    const f = fakeAudio();
    let on = true;
    const a = createAudio({ AudioCtor: f.ctor as unknown as typeof Audio, sfxEnabled: () => false, musicEnabled: () => on });
    a.startMusic();
    expect(f.play).toHaveBeenCalledTimes(1);
    on = false;
    a.startMusic();
    expect(f.play).toHaveBeenCalledTimes(1);
    a.stopMusic();
    expect(f.pause).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/services/Audio.ts`**

```ts
export type SoundId = "shot" | "hit_correct" | "hit_wrong" | "ground" | "session_done";

export interface AudioApi {
  playSfx(id: SoundId): void;
  startMusic(): void;
  stopMusic(): void;
}

export interface AudioDeps {
  AudioCtor: typeof Audio;
  sfxEnabled: () => boolean;
  musicEnabled: () => boolean;
  sfxSrc?: Record<SoundId, string>;
  musicSrc?: string;
}

const DEFAULT_SRC: Record<SoundId, string> = {
  shot: "/assets/sounds/shot.mp3",
  hit_correct: "/assets/sounds/hit_correct.mp3",
  hit_wrong: "/assets/sounds/hit_wrong.mp3",
  ground: "/assets/sounds/ground.mp3",
  session_done: "/assets/sounds/session_done.mp3",
};

export function createAudio(deps: AudioDeps): AudioApi {
  const sfx = deps.sfxSrc ?? DEFAULT_SRC;
  let music: HTMLAudioElement | null = null;
  return {
    playSfx: (id) => {
      if (!deps.sfxEnabled()) return;
      const a = new deps.AudioCtor(sfx[id]);
      void a.play();
    },
    startMusic: () => {
      if (!deps.musicEnabled()) return;
      if (!music) {
        music = new deps.AudioCtor(deps.musicSrc ?? "/assets/sounds/music.mp3");
        music.loop = true;
      }
      void music.play();
    },
    stopMusic: () => { music?.pause(); },
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/services/Audio.ts tests/services/Audio.spec.ts
git commit -m "feat(services): audio with injectable Audio ctor and toggle gates"
```

---

## Phase 3 — Configuration & core wrappers

### Task 14: Configuration constants

**Files:**
- Create: `src/config/dimensions.ts`
- Create: `src/config/theme.ts`
- Create: `src/config/physics.ts`

- [ ] **Step 1: Write `src/config/dimensions.ts`**

```ts
export const DESIGN_WIDTH = 844;
export const DESIGN_HEIGHT = 390;
export const GROUND_Y = 330;

// Slingshot anchor (carrot rest position)
export const SLINGSHOT_ANCHOR = { x: 122, y: 270 } as const;
export const SLINGSHOT_BASE_Y = GROUND_Y;

// Tree (right side) — branch perch positions where rabbits sit
export const TREE_TRUNK_X = 660;
export const TREE_PERCHES = [
  { x: 605, y: 110 }, // top
  { x: 770, y: 175 }, // upper-right
  { x: 470, y: 220 }, // mid-left
  { x: 510, y: 290 }, // lower-left
] as const;

// HUD
export const GEAR_POS = { x: 50, y: 44 } as const;
export const GEAR_RADIUS = 22;
export const MATH_SIGN = { x: DESIGN_WIDTH / 2, y: 38, defaultWidth: 180, expandedWidth: 320, height: 56 } as const;

// Carrot counter (laid carrots on grass, right of slingshot)
export const COUNTER_FIRST_X = 200;
export const COUNTER_GAP = 48;
export const COUNTER_Y = GROUND_Y + 8;
export const COUNTER_TILT_DEG = 40;

// Trajectory preview
export const TRAJECTORY_STEPS = 60;
export const TRAJECTORY_TIME_HORIZON = 1.6;
```

- [ ] **Step 2: Write `src/config/theme.ts`**

```ts
export const COLORS = {
  sky: 0xbfe6ff,
  sun: 0xffd74a,
  cloud: 0xffffff,
  hills: 0x7ed17b,
  grass: 0x5cc05a,
  trunk: 0x8a5a2c,
  trunkShadow: 0x5a3a1c,
  foliage: 0x5cc05a,
  foliageHighlight: 0x7ed17b,
  rabbitBody: 0xfff4d6,
  rabbitInnerEar: 0xf4b7b0,
  carrot: 0xff7a2b,
  carrotLeaf: 0x2f9a4b,
  signFill: 0xfff8e5,
  outline: 0x111111,
  hudFill: 0xffffff,
} as const;

export const STROKE = { thin: 1.5, normal: 2.0, thick: 2.5 } as const;
```

- [ ] **Step 3: Write `src/config/physics.ts`**

```ts
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./dimensions";

export const GRAVITY_Y = 1.4; // Matter scale (px / s² in Matter units)
export const CARROT_RADIUS = 9;
export const CARROT_DENSITY = 0.0014;
export const CARROT_FRICTION = 0.05;
export const CARROT_RESTITUTION = 0.2;
export const SLINGSHOT_MAX_PULL = 130;
export const SLINGSHOT_POWER = 0.18; // velocity multiplier
export const WORLD_BOUNDS = { minX: 0, minY: 0, maxX: DESIGN_WIDTH, maxY: DESIGN_HEIGHT };
```

- [ ] **Step 4: Verify lint + build still pass**

Run: `pnpm lint && pnpm build`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/config
git commit -m "feat(config): logical dimensions, palette, physics constants"
```

---

### Task 15: Pixi App wrapper

**Files:**
- Create: `src/core/App.ts`
- Test: none (smoke-tested via main.ts later — Pixi v8 needs WebGL which jsdom does not provide)

- [ ] **Step 1: Write `src/core/App.ts`**

```ts
import { Application, Container } from "pixi.js";
import { DESIGN_WIDTH, DESIGN_HEIGHT, COLORS_SKY_HEX } from "./constants";
```

Wait — we don't have a `core/constants` file. Use the config files:

```ts
import { Application, Container } from "pixi.js";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "../config/dimensions";
import { COLORS } from "../config/theme";

export interface AppApi {
  readonly stage: Container;
  readonly canvas: HTMLCanvasElement;
  readonly logical: { width: number; height: number };
  resize(): void;
  destroy(): void;
}

export async function createApp(parent: HTMLElement): Promise<AppApi> {
  const app = new Application();
  await app.init({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    background: COLORS.sky,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });
  const canvas = app.canvas;
  parent.appendChild(canvas);
  const root = new Container();
  app.stage.addChild(root);

  const resize = () => {
    const { innerWidth: w, innerHeight: h } = window;
    const scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
    canvas.style.width = `${DESIGN_WIDTH * scale}px`;
    canvas.style.height = `${DESIGN_HEIGHT * scale}px`;
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    stage: root,
    canvas,
    logical: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
    resize,
    destroy: () => { window.removeEventListener("resize", resize); app.destroy(true, { children: true }); },
  };
}
```

- [ ] **Step 2: Verify build (`pnpm build`)**

Expected: TypeScript and Vite succeed.

- [ ] **Step 3: Commit**

```bash
git add src/core/App.ts
git commit -m "feat(core): Pixi v8 application wrapper with letterbox-fit scale"
```

---

### Task 16: Matter.js physics world wrapper

**Files:**
- Create: `src/core/PhysicsWorld.ts`
- Test: `tests/core/PhysicsWorld.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createPhysicsWorld } from "../../src/core/PhysicsWorld";
import Matter from "matter-js";

describe("PhysicsWorld", () => {
  it("creates an engine with downward gravity", () => {
    const w = createPhysicsWorld();
    expect(w.engine.gravity.y).toBeGreaterThan(0);
    w.destroy();
  });

  it("addBody / removeBody manage the world contents", () => {
    const w = createPhysicsWorld();
    const body = Matter.Bodies.circle(100, 100, 5);
    w.addBody(body);
    expect(w.engine.world.bodies).toContain(body);
    w.removeBody(body);
    expect(w.engine.world.bodies).not.toContain(body);
    w.destroy();
  });

  it("step advances the simulation for the requested ms", () => {
    const w = createPhysicsWorld();
    const body = Matter.Bodies.circle(100, 100, 5);
    w.addBody(body);
    const startY = body.position.y;
    for (let i = 0; i < 30; i++) w.step(1000 / 60);
    expect(body.position.y).toBeGreaterThan(startY);
    w.destroy();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/core/PhysicsWorld.ts`**

```ts
import Matter from "matter-js";
import { GRAVITY_Y } from "../config/physics";

export interface PhysicsWorld {
  readonly engine: Matter.Engine;
  addBody(body: Matter.Body): void;
  removeBody(body: Matter.Body): void;
  step(deltaMs: number): void;
  destroy(): void;
}

export function createPhysicsWorld(): PhysicsWorld {
  const engine = Matter.Engine.create();
  engine.gravity.y = GRAVITY_Y;
  return {
    engine,
    addBody: (b) => Matter.World.add(engine.world, b),
    removeBody: (b) => Matter.World.remove(engine.world, b),
    step: (deltaMs) => Matter.Engine.update(engine, deltaMs),
    destroy: () => Matter.Engine.clear(engine),
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/core/PhysicsWorld.ts tests/core/PhysicsWorld.spec.ts
git commit -m "feat(core): matter.js engine wrapper (add/remove/step/destroy)"
```

---

### Task 17: Scene + SceneManager

**Files:**
- Create: `src/core/Scene.ts`
- Create: `src/core/SceneManager.ts`
- Test: `tests/core/SceneManager.spec.ts`

- [ ] **Step 1: Write `Scene` interface**

```ts
import type { Container } from "pixi.js";

export interface Scene {
  readonly view: Container;
  readonly id: string;
  onEnter(): void;
  onExit(): void;
  onTick(deltaMs: number): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}
```

- [ ] **Step 2: Write tests for SceneManager**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "pixi.js";
import { createSceneManager } from "../../src/core/SceneManager";
import type { Scene } from "../../src/core/Scene";

const fakeScene = (id: string): Scene & { calls: string[] } => {
  const calls: string[] = [];
  const view = new Container();
  return {
    id, view, calls,
    onEnter: () => calls.push("enter"),
    onExit: () => calls.push("exit"),
    onTick: () => calls.push("tick"),
    pause: () => calls.push("pause"),
    resume: () => calls.push("resume"),
    destroy: () => calls.push("destroy"),
  };
};

let stage: Container;
beforeEach(() => { stage = new Container(); });

describe("SceneManager", () => {
  it("goTo enters the new scene and adds its view to the stage", () => {
    const m = createSceneManager(stage);
    const s = fakeScene("game");
    m.goTo(s);
    expect(s.calls).toContain("enter");
    expect(stage.children).toContain(s.view);
  });

  it("goTo replaces the previous scene (exit + destroy)", () => {
    const m = createSceneManager(stage);
    const a = fakeScene("a");
    const b = fakeScene("b");
    m.goTo(a); m.goTo(b);
    expect(a.calls).toContain("exit");
    expect(a.calls).toContain("destroy");
    expect(stage.children).not.toContain(a.view);
    expect(stage.children).toContain(b.view);
  });

  it("openOverlay pauses the current scene and adds the overlay above", () => {
    const m = createSceneManager(stage);
    const game = fakeScene("game");
    const settings = fakeScene("settings");
    m.goTo(game);
    m.openOverlay(settings);
    expect(game.calls).toContain("pause");
    expect(settings.calls).toContain("enter");
    expect(stage.children).toContain(settings.view);
    expect(stage.children).toContain(game.view);
  });

  it("closeOverlay resumes the underlying scene and removes overlay view", () => {
    const m = createSceneManager(stage);
    const game = fakeScene("game"); const settings = fakeScene("settings");
    m.goTo(game); m.openOverlay(settings); m.closeOverlay();
    expect(settings.calls).toContain("exit");
    expect(game.calls).toContain("resume");
    expect(stage.children).not.toContain(settings.view);
  });

  it("tick forwards to the active scene (and the overlay if present)", () => {
    const m = createSceneManager(stage);
    const game = fakeScene("game"); const settings = fakeScene("settings");
    m.goTo(game); m.tick(16);
    expect(game.calls.filter((c) => c === "tick")).toHaveLength(1);
    m.openOverlay(settings); m.tick(16);
    expect(settings.calls.filter((c) => c === "tick")).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run → FAIL**

- [ ] **Step 4: Implement `src/core/SceneManager.ts`**

```ts
import type { Container } from "pixi.js";
import type { Scene } from "./Scene";

export interface SceneManager {
  goTo(scene: Scene): void;
  openOverlay(scene: Scene): void;
  closeOverlay(): void;
  tick(deltaMs: number): void;
  destroy(): void;
}

export function createSceneManager(stage: Container): SceneManager {
  let current: Scene | null = null;
  let overlay: Scene | null = null;

  const replace = (next: Scene | null) => {
    if (current) {
      current.onExit();
      stage.removeChild(current.view);
      current.destroy();
    }
    current = next;
    if (current) {
      stage.addChild(current.view);
      current.onEnter();
    }
  };

  return {
    goTo: (scene) => replace(scene),
    openOverlay: (scene) => {
      if (overlay) return;
      current?.pause();
      overlay = scene;
      stage.addChild(scene.view);
      scene.onEnter();
    },
    closeOverlay: () => {
      if (!overlay) return;
      overlay.onExit();
      stage.removeChild(overlay.view);
      overlay.destroy();
      overlay = null;
      current?.resume();
    },
    tick: (delta) => {
      current?.onTick(delta);
      overlay?.onTick(delta);
    },
    destroy: () => { replace(null); overlay = null; },
  };
}
```

- [ ] **Step 5: Run → PASS**

- [ ] **Step 6: Commit**

```bash
git add src/core/Scene.ts src/core/SceneManager.ts tests/core/SceneManager.spec.ts
git commit -m "feat(core): scene + scene manager with overlay support"
```

---

## Phase 4 — Entities

### Task 18: Tree entity

**Why:** static decorative element exposing branch perch positions for the rabbits.

**Files:**
- Create: `src/entities/Tree.ts`
- Test: `tests/entities/Tree.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createTree } from "../../src/entities/Tree";
import { TREE_PERCHES } from "../../src/config/dimensions";

describe("Tree", () => {
  it("exposes 4 perch positions matching the configured constants", () => {
    const tree = createTree();
    const perches = tree.getPerchPositions();
    expect(perches).toHaveLength(4);
    expect(perches).toEqual(TREE_PERCHES);
  });

  it("returns a non-null view container", () => {
    const tree = createTree();
    expect(tree.view).toBeDefined();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/Tree.ts`**

```ts
import { Container, Graphics } from "pixi.js";
import { TREE_PERCHES, GROUND_Y, TREE_TRUNK_X } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface Tree {
  readonly view: Container;
  getPerchPositions(): typeof TREE_PERCHES;
}

const drawTrunk = (g: Graphics) => {
  g.rect(TREE_TRUNK_X - 26, 195, 52, GROUND_Y - 195)
    .fill(COLORS.trunk).stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawBranches = (g: Graphics) => {
  const branches: Array<[number, number, number, number]> = [
    [TREE_TRUNK_X - 26, 280, TREE_PERCHES[3].x, TREE_PERCHES[3].y + 20],
    [TREE_TRUNK_X - 26, 220, TREE_PERCHES[2].x, TREE_PERCHES[2].y + 20],
    [TREE_TRUNK_X + 26, 195, TREE_PERCHES[1].x, TREE_PERCHES[1].y + 20],
    [TREE_TRUNK_X,      195, TREE_PERCHES[0].x, TREE_PERCHES[0].y + 20],
  ];
  for (const [x1, y1, x2, y2] of branches) {
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 14, color: COLORS.trunk, cap: "round" });
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: STROKE.normal, color: COLORS.outline });
  }
};

const drawFoliage = (g: Graphics) => {
  const blobs: Array<[number, number, number]> = [
    [TREE_PERCHES[0].x - 15, 65, 50],
    [TREE_PERCHES[0].x + 75, 30, 48],
    [TREE_PERCHES[1].x - 50, 95, 48],
    [TREE_PERCHES[2].x - 25, 165, 44],
    [TREE_PERCHES[3].x - 30, 240, 40],
  ];
  for (const [x, y, r] of blobs) {
    g.circle(x, y, r).fill(COLORS.foliage).stroke({ width: STROKE.thick, color: COLORS.outline });
  }
};

export function createTree(): Tree {
  const view = new Container();
  const g = new Graphics();
  drawTrunk(g);
  drawBranches(g);
  drawFoliage(g);
  view.addChild(g);
  return { view, getPerchPositions: () => TREE_PERCHES };
}
```

- [ ] **Step 4: Run → PASS** (the test only inspects state, not the rendered pixels — that's fine)

- [ ] **Step 5: Commit**

```bash
git add src/entities/Tree.ts tests/entities/Tree.spec.ts
git commit -m "feat(entities): tree decor with 4 perch positions"
```

---

### Task 19: Rabbit entity (static visuals + sign)

**Why:** the most complex entity. We split it into two tasks: this one builds the visuals + state, the next one adds animations.

**Files:**
- Create: `src/entities/Rabbit.ts`
- Test: `tests/entities/Rabbit.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createRabbit } from "../../src/entities/Rabbit";

describe("Rabbit (state)", () => {
  it("setNumber stores the number returned by getNumber", () => {
    const r = createRabbit({ position: { x: 100, y: 100 } });
    r.setNumber(56);
    expect(r.getNumber()).toBe(56);
  });

  it("starts not fallen", () => {
    const r = createRabbit({ position: { x: 0, y: 0 } });
    expect(r.isFallen()).toBe(false);
  });

  it("getCollisionAabb returns a finite axis-aligned box around its position", () => {
    const r = createRabbit({ position: { x: 200, y: 100 } });
    const box = r.getCollisionAabb();
    expect(box.minX).toBeLessThan(box.maxX);
    expect(box.minY).toBeLessThan(box.maxY);
    expect(box.minX).toBeGreaterThan(150);
    expect(box.maxX).toBeLessThan(250);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/Rabbit.ts`**

```ts
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, STROKE } from "../config/theme";

export interface Aabb { minX: number; minY: number; maxX: number; maxY: number; }
export interface Vec { x: number; y: number; }

export interface Rabbit {
  readonly view: Container;
  setNumber(n: number): void;
  getNumber(): number;
  isFallen(): boolean;
  markFallen(): void;
  getCollisionAabb(): Aabb;
  position: Vec;
}

const drawEars = (g: Graphics) => {
  g.poly([-15, -25, -20, -52, -10, -54, -8, -23]).fill(COLORS.rabbitBody).stroke({ width: STROKE.normal, color: COLORS.outline });
  g.poly([6, -25, 10, -56, 20, -54, 16, -23]).fill(COLORS.rabbitBody).stroke({ width: STROKE.normal, color: COLORS.outline });
  g.poly([-13, -27, -16, -45, -11, -47, -10, -24]).fill(COLORS.rabbitInnerEar);
  g.poly([8, -27, 11, -45, 17, -47, 14, -24]).fill(COLORS.rabbitInnerEar);
};

const drawBody = (g: Graphics) => {
  g.ellipse(0, 0, 28, 30).fill(COLORS.rabbitBody).stroke({ width: STROKE.normal, color: COLORS.outline });
};

const drawFace = (g: Graphics) => {
  g.circle(-6, -14, 2.5).fill(COLORS.outline);
  g.circle(7, -14, 2.5).fill(COLORS.outline);
  g.moveTo(-2, -7).lineTo(0, -4).moveTo(2, -7).lineTo(0, -4).moveTo(0, -4).lineTo(0, 0)
    .stroke({ width: STROKE.thin, color: COLORS.outline, cap: "round" });
};

const drawPawsAndSign = (g: Graphics) => {
  // 4 paws
  for (const [x, y] of [[-16, 2], [16, 2], [-20, 28], [20, 28]] as Array<[number, number]>) {
    g.ellipse(x, y, 4, 3).fill(COLORS.rabbitBody).stroke({ width: 1.6, color: COLORS.outline });
  }
  // sign
  g.roundRect(-20, 4, 40, 24, 2).fill(COLORS.signFill).stroke({ width: STROKE.normal, color: COLORS.outline });
};

const TEXT_STYLE: Partial<ConstructorParameters<typeof TextStyle>[0]> = {
  fontFamily: "ui-rounded, system-ui",
  fontWeight: "800",
  fontSize: 14,
  fill: COLORS.outline,
  align: "center",
};

export function createRabbit(opts: { position: Vec }): Rabbit {
  const view = new Container();
  view.position.set(opts.position.x, opts.position.y);
  const g = new Graphics();
  drawEars(g); drawBody(g); drawFace(g); drawPawsAndSign(g);
  view.addChild(g);
  const text = new Text({ text: "", style: new TextStyle(TEXT_STYLE) });
  text.anchor.set(0.5);
  text.position.set(0, 16);
  view.addChild(text);

  let number = 0;
  let fallen = false;
  const position: Vec = { ...opts.position };

  return {
    view,
    setNumber: (n) => { number = n; text.text = String(n); },
    getNumber: () => number,
    isFallen: () => fallen,
    markFallen: () => { fallen = true; },
    getCollisionAabb: () => ({
      minX: position.x - 30, maxX: position.x + 30,
      minY: position.y - 60, maxY: position.y + 30,
    }),
    position,
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/entities/Rabbit.ts tests/entities/Rabbit.spec.ts
git commit -m "feat(entities): rabbit visuals (ears, body, eyes, mouth Y, 4 paws, sign)"
```

---

### Task 20: Rabbit animations

**Files:**
- Modify: `src/entities/Rabbit.ts` (add animation methods)
- Modify: `tests/entities/Rabbit.spec.ts` (add tests)
- Create: `src/entities/animations/Tween.ts` (small wrapper around `@tweenjs/tween.js`)

- [ ] **Step 1: Add a thin tween utility**

`src/entities/animations/Tween.ts`:

```ts
import { Tween, Easing } from "@tweenjs/tween.js";

export function tweenObject<T extends object>(target: T, to: Partial<T>, ms: number, easing = Easing.Quadratic.Out): Promise<void> {
  return new Promise((resolve) => {
    new Tween(target).to(to, ms).easing(easing).onComplete(() => resolve()).start();
  });
}
```

- [ ] **Step 2: Add tests for animation methods (state-only)**

Append to `tests/entities/Rabbit.spec.ts`:

```ts
describe("Rabbit (animations)", () => {
  it("playShakeNo resolves without changing fallen state", async () => {
    const r = createRabbit({ position: { x: 100, y: 100 } });
    await r.playShakeNo();
    expect(r.isFallen()).toBe(false);
  });

  it("playBitePartialAndFall sets isFallen to true and updates position.y", async () => {
    const r = createRabbit({ position: { x: 100, y: 100 } });
    await r.playBitePartialAndFall(330);
    expect(r.isFallen()).toBe(true);
    expect(r.position.y).toBe(330);
  });

  it("playRunAwayRight moves position.x off-screen to the right", async () => {
    const r = createRabbit({ position: { x: 100, y: 330 } });
    await r.playRunAwayRight(900);
    expect(r.position.x).toBeGreaterThanOrEqual(900);
  });
});
```

(Tests need a tween-tick driver: see step 4.)

- [ ] **Step 3: Run → FAIL**

- [ ] **Step 4: Add tween group ticking helper for tests**

In `src/entities/animations/Tween.ts`, expose the global group so tests can advance it:

```ts
import { Group, Tween, Easing } from "@tweenjs/tween.js";
export const tweenGroup = new Group();

export function tweenObject<T extends object>(target: T, to: Partial<T>, ms: number, easing = Easing.Quadratic.Out): Promise<void> {
  return new Promise((resolve) => {
    new Tween(target, tweenGroup).to(to, ms).easing(easing).onComplete(() => resolve()).start();
  });
}

export function tickTweens(now: number): void { tweenGroup.update(now); }
```

In tests, drive the tweens forward:

```ts
import { tickTweens } from "../../src/entities/animations/Tween";

const runTweens = async () => {
  for (let t = 0; t <= 2000; t += 16) tickTweens(performance.now() + t);
};
```

Then in each animation test:

```ts
const promise = r.playBitePartialAndFall(330);
await runTweens();
await promise;
```

- [ ] **Step 5: Implement animations on `Rabbit`**

Add to `Rabbit` (inside `createRabbit`, before the return):

```ts
async function playShakeNo(): Promise<void> {
  const original = view.position.x;
  for (let i = 0; i < 4; i++) {
    await tweenObject(view.position, { x: original + 6 }, 60);
    await tweenObject(view.position, { x: original - 6 }, 60);
  }
  view.position.x = original;
}

async function playBitePartialAndFall(landingY: number): Promise<void> {
  fallen = true;
  await tweenObject(view.scale, { x: 1.05, y: 0.95 }, 80);
  await tweenObject(view.scale, { x: 1, y: 1 }, 80);
  position.y = landingY;
  await tweenObject(view.position, { y: landingY }, 350);
}

async function playHopInPlace(): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await tweenObject(view.position, { y: position.y - 22 }, 180);
    await tweenObject(view.position, { y: position.y }, 160);
  }
}

async function playRunAwayRight(offscreenX: number): Promise<void> {
  position.x = offscreenX;
  await tweenObject(view.position, { x: offscreenX }, 1000);
}
```

Expose them in the returned object.

- [ ] **Step 6: Run all tests → PASS**

- [ ] **Step 7: Commit**

```bash
git add src/entities/Rabbit.ts src/entities/animations/Tween.ts tests/entities/Rabbit.spec.ts
git commit -m "feat(entities): rabbit animations (shakeNo, biteAndFall, hopInPlace, runAwayRight)"
```

---

### Task 21: Carrot entity

**Files:**
- Create: `src/entities/Carrot.ts`
- Test: `tests/entities/Carrot.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createCarrot } from "../../src/entities/Carrot";
import { createPhysicsWorld } from "../../src/core/PhysicsWorld";

describe("Carrot", () => {
  it("starts not launched and at the supplied position", () => {
    const c = createCarrot({ x: 50, y: 80 });
    expect(c.isLaunched()).toBe(false);
    expect(c.body.position).toMatchObject({ x: 50, y: 80 });
  });

  it("launch enables dynamic motion (body becomes non-static, velocity applied)", () => {
    const w = createPhysicsWorld();
    const c = createCarrot({ x: 50, y: 80 });
    w.addBody(c.body);
    c.launch({ x: 8, y: -10 });
    expect(c.isLaunched()).toBe(true);
    expect(c.body.isStatic).toBe(false);
    for (let i = 0; i < 10; i++) w.step(16);
    expect(c.body.position.x).toBeGreaterThan(50);
    w.destroy();
  });

  it("restAtGround stops motion and freezes the body", () => {
    const c = createCarrot({ x: 50, y: 80 });
    c.launch({ x: 8, y: -10 });
    c.restAtGround({ x: 200, y: 320 });
    expect(c.body.isStatic).toBe(true);
    expect(c.body.position).toMatchObject({ x: 200, y: 320 });
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/Carrot.ts`**

```ts
import Matter from "matter-js";
import { Container, Graphics } from "pixi.js";
import { CARROT_DENSITY, CARROT_FRICTION, CARROT_RADIUS, CARROT_RESTITUTION } from "../config/physics";
import { COLORS, STROKE } from "../config/theme";

export interface Vec { x: number; y: number; }

export interface Carrot {
  readonly view: Container;
  readonly body: Matter.Body;
  isLaunched(): boolean;
  launch(velocity: Vec): void;
  restAtGround(at: Vec): void;
  syncView(): void;
}

const drawCarrot = (g: Graphics) => {
  g.poly([0, 16, -8, -10, 8, -10]).fill(COLORS.carrot).stroke({ width: STROKE.normal, color: COLORS.outline });
  g.poly([-4, -12, -6, -20, -2, -22, -1, -12]).fill(COLORS.carrotLeaf).stroke({ width: STROKE.thin, color: COLORS.outline });
  g.poly([1, -12, 0, -20, 5, -20, 4, -12]).fill(COLORS.carrotLeaf).stroke({ width: STROKE.thin, color: COLORS.outline });
};

export function createCarrot(at: Vec): Carrot {
  const view = new Container();
  const g = new Graphics();
  drawCarrot(g);
  view.addChild(g);
  view.position.set(at.x, at.y);

  const body = Matter.Bodies.circle(at.x, at.y, CARROT_RADIUS, {
    isStatic: true,
    density: CARROT_DENSITY,
    friction: CARROT_FRICTION,
    restitution: CARROT_RESTITUTION,
    label: "carrot",
  });

  let launched = false;

  return {
    view, body,
    isLaunched: () => launched,
    launch: (v) => {
      launched = true;
      Matter.Body.setStatic(body, false);
      Matter.Body.setVelocity(body, v);
    },
    restAtGround: (pos) => {
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setPosition(body, pos);
      Matter.Body.setStatic(body, true);
    },
    syncView: () => {
      view.position.set(body.position.x, body.position.y);
      view.rotation = body.angle;
    },
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/entities/Carrot.ts tests/entities/Carrot.spec.ts
git commit -m "feat(entities): carrot with matter circle body and rest-at-ground freeze"
```

---

### Task 22: Slingshot entity

**Files:**
- Create: `src/entities/Slingshot.ts`
- Test: `tests/entities/Slingshot.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createSlingshot } from "../../src/entities/Slingshot";
import { SLINGSHOT_ANCHOR } from "../../src/config/dimensions";
import { SLINGSHOT_MAX_PULL } from "../../src/config/physics";

describe("Slingshot", () => {
  it("anchor matches the configured position", () => {
    const s = createSlingshot();
    expect(s.anchor()).toEqual(SLINGSHOT_ANCHOR);
  });

  it("clamps the pull vector magnitude to SLINGSHOT_MAX_PULL", () => {
    const s = createSlingshot();
    s.aimAt({ x: SLINGSHOT_ANCHOR.x + 400, y: SLINGSHOT_ANCHOR.y });
    const offset = { x: s.carrotPosition().x - SLINGSHOT_ANCHOR.x, y: s.carrotPosition().y - SLINGSHOT_ANCHOR.y };
    const m = Math.hypot(offset.x, offset.y);
    expect(m).toBeLessThanOrEqual(SLINGSHOT_MAX_PULL + 0.01);
  });

  it("releaseVelocity returns a vector opposite to the pull (forward fling)", () => {
    const s = createSlingshot();
    s.aimAt({ x: SLINGSHOT_ANCHOR.x - 60, y: SLINGSHOT_ANCHOR.y - 40 });
    const v = s.releaseVelocity();
    expect(v.x).toBeGreaterThan(0);
    expect(v.y).toBeGreaterThan(0);
  });

  it("reset moves the carrot back to the anchor", () => {
    const s = createSlingshot();
    s.aimAt({ x: SLINGSHOT_ANCHOR.x - 50, y: SLINGSHOT_ANCHOR.y - 30 });
    s.reset();
    expect(s.carrotPosition()).toEqual(SLINGSHOT_ANCHOR);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/Slingshot.ts`**

```ts
import { Container, Graphics } from "pixi.js";
import { SLINGSHOT_ANCHOR, GROUND_Y } from "../config/dimensions";
import { SLINGSHOT_MAX_PULL, SLINGSHOT_POWER } from "../config/physics";
import { COLORS, STROKE } from "../config/theme";

export interface Vec { x: number; y: number; }

export interface Slingshot {
  readonly view: Container;
  anchor(): Vec;
  carrotPosition(): Vec;
  aimAt(point: Vec): void;
  releaseVelocity(): Vec;
  reset(): void;
}

const drawFrame = (g: Graphics) => {
  const ax = SLINGSHOT_ANCHOR.x, ay = SLINGSHOT_ANCHOR.y;
  g.moveTo(ax - 6, GROUND_Y).lineTo(ax - 6, ay).moveTo(ax + 6, GROUND_Y).lineTo(ax + 6, ay)
    .stroke({ width: 10, color: COLORS.trunk, cap: "round" });
  g.moveTo(ax - 22, ay - 5).quadraticCurveTo(ax - 6, ay - 24, ax, ay - 10)
    .quadraticCurveTo(ax + 6, ay - 24, ax + 22, ay - 5)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
};

const clampMagnitude = (dx: number, dy: number, max: number): Vec => {
  const m = Math.hypot(dx, dy);
  if (m <= max) return { x: dx, y: dy };
  return { x: (dx / m) * max, y: (dy / m) * max };
};

export function createSlingshot(): Slingshot {
  const view = new Container();
  const frame = new Graphics();
  drawFrame(frame);
  view.addChild(frame);
  let pos: Vec = { ...SLINGSHOT_ANCHOR };

  return {
    view,
    anchor: () => SLINGSHOT_ANCHOR,
    carrotPosition: () => pos,
    aimAt: (point) => {
      const c = clampMagnitude(point.x - SLINGSHOT_ANCHOR.x, point.y - SLINGSHOT_ANCHOR.y, SLINGSHOT_MAX_PULL);
      pos = { x: SLINGSHOT_ANCHOR.x + c.x, y: SLINGSHOT_ANCHOR.y + c.y };
    },
    releaseVelocity: () => ({
      x: (SLINGSHOT_ANCHOR.x - pos.x) * SLINGSHOT_POWER,
      y: (SLINGSHOT_ANCHOR.y - pos.y) * SLINGSHOT_POWER,
    }),
    reset: () => { pos = { ...SLINGSHOT_ANCHOR }; },
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/entities/Slingshot.ts tests/entities/Slingshot.spec.ts
git commit -m "feat(entities): slingshot with magnitude-clamped pull and release vector"
```

---

### Task 23: MathSign entity (with adaptive width)

**Files:**
- Create: `src/entities/MathSign.ts`
- Test: `tests/entities/MathSign.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createMathSign } from "../../src/entities/MathSign";
import { MATH_SIGN } from "../../src/config/dimensions";
import type { Question } from "../../src/domain/Question";

const Q: Question = { a: 7, b: 8, answer: 56, choices: [56, 48, 63, 54] };

describe("MathSign", () => {
  it("default width matches the configured default", () => {
    const s = createMathSign();
    expect(s.currentWidth()).toBe(MATH_SIGN.defaultWidth);
  });

  it("setQuestion stores the formatted text", () => {
    const s = createMathSign();
    s.setQuestion(Q);
    expect(s.text()).toBe("7 × 8 = ?");
  });

  it("setEndOfSessionMessage formats X / N text", () => {
    const s = createMathSign();
    s.setEndOfSessionMessage(7, 10);
    expect(s.text()).toBe("7 / 10 bonnes réponses");
  });

  it("setWidth(value) updates currentWidth synchronously", () => {
    const s = createMathSign();
    s.setWidth(MATH_SIGN.expandedWidth);
    expect(s.currentWidth()).toBe(MATH_SIGN.expandedWidth);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/MathSign.ts`**

```ts
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { MATH_SIGN } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";
import type { Question } from "../domain/Question";
import { tweenObject } from "./animations/Tween";

export interface MathSign {
  readonly view: Container;
  setQuestion(q: Question): void;
  setEndOfSessionMessage(score: number, total: number): void;
  setWidth(w: number): void;
  tweenWidthTo(w: number, ms?: number): Promise<void>;
  currentWidth(): number;
  text(): string;
}

const TEXT_STYLE = new TextStyle({
  fontFamily: "ui-rounded, system-ui",
  fontWeight: "800",
  fontSize: 26,
  fill: COLORS.outline,
  align: "center",
});

const redrawBox = (g: Graphics, width: number) => {
  g.clear();
  g.roundRect(-width / 2, -MATH_SIGN.height / 2, width, MATH_SIGN.height, 6)
    .fill(COLORS.signFill).stroke({ width: STROKE.thick, color: COLORS.outline });
};

export function createMathSign(): MathSign {
  const view = new Container();
  view.position.set(MATH_SIGN.x, MATH_SIGN.y);
  const g = new Graphics();
  view.addChild(g);
  let width = MATH_SIGN.defaultWidth;
  redrawBox(g, width);
  const t = new Text({ text: "", style: TEXT_STYLE });
  t.anchor.set(0.5);
  view.addChild(t);

  const tracker = { width };

  return {
    view,
    setQuestion: (q) => { t.text = `${q.a} × ${q.b} = ?`; },
    setEndOfSessionMessage: (score, total) => { t.text = `${score} / ${total} bonnes réponses`; },
    setWidth: (w) => { width = w; tracker.width = w; redrawBox(g, w); },
    tweenWidthTo: async (w, ms = 250) => {
      await tweenObject(tracker, { width: w }, ms);
      width = tracker.width;
      redrawBox(g, width);
    },
    currentWidth: () => width,
    text: () => t.text,
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/entities/MathSign.ts tests/entities/MathSign.spec.ts
git commit -m "feat(entities): math sign with question / end-message text and tweenable width"
```

---

### Task 24: CarrotCounter entity (carrots laid on grass)

**Files:**
- Create: `src/entities/CarrotCounter.ts`
- Test: `tests/entities/CarrotCounter.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { createCarrotCounter } from "../../src/entities/CarrotCounter";

describe("CarrotCounter", () => {
  it("starts with the requested number of remaining icons", () => {
    const c = createCarrotCounter(3);
    expect(c.remaining()).toBe(3);
  });

  it("setRemaining decreases the count", () => {
    const c = createCarrotCounter(3);
    c.setRemaining(2);
    expect(c.remaining()).toBe(2);
  });

  it("setRemaining caps at the original total", () => {
    const c = createCarrotCounter(3);
    c.setRemaining(5);
    expect(c.remaining()).toBe(3);
  });

  it("setRemaining clamps at 0", () => {
    const c = createCarrotCounter(3);
    c.setRemaining(-1);
    expect(c.remaining()).toBe(0);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/CarrotCounter.ts`**

```ts
import { Container, Graphics } from "pixi.js";
import { COUNTER_FIRST_X, COUNTER_GAP, COUNTER_TILT_DEG, COUNTER_Y } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface CarrotCounter {
  readonly view: Container;
  setRemaining(n: number): void;
  remaining(): number;
}

const drawIcon = (g: Graphics) => {
  g.poly([0, 16, -8, -10, 8, -10]).fill(COLORS.carrot).stroke({ width: STROKE.normal, color: COLORS.outline });
  g.poly([-4, -12, -6, -20, -2, -22, -1, -12]).fill(COLORS.carrotLeaf).stroke({ width: STROKE.thin, color: COLORS.outline });
  g.poly([1, -12, 0, -20, 5, -20, 4, -12]).fill(COLORS.carrotLeaf).stroke({ width: STROKE.thin, color: COLORS.outline });
};

export function createCarrotCounter(total: number): CarrotCounter {
  const view = new Container();
  const icons: Graphics[] = [];
  for (let i = 0; i < total; i++) {
    const g = new Graphics();
    drawIcon(g);
    g.position.set(COUNTER_FIRST_X + i * COUNTER_GAP, COUNTER_Y);
    g.rotation = (COUNTER_TILT_DEG * Math.PI) / 180;
    view.addChild(g);
    icons.push(g);
  }
  let current = total;
  return {
    view,
    remaining: () => current,
    setRemaining: (n) => {
      current = Math.max(0, Math.min(total, n));
      icons.forEach((g, i) => { g.alpha = i < current ? 1 : 0.0; });
    },
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/entities/CarrotCounter.ts tests/entities/CarrotCounter.spec.ts
git commit -m "feat(entities): carrot counter (carrots laid on grass at 40°)"
```

---

### Task 25: GearButton entity

**Files:**
- Create: `src/entities/GearButton.ts`
- Test: `tests/entities/GearButton.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, vi } from "vitest";
import { createGearButton } from "../../src/entities/GearButton";

describe("GearButton", () => {
  it("invokes the provided onTap handler when emit('pointerup') fires", () => {
    const handler = vi.fn();
    const btn = createGearButton({ onTap: handler });
    btn.view.emit("pointerup");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("position matches the configured GEAR_POS", () => {
    const btn = createGearButton({ onTap: () => {} });
    expect(btn.view.position).toMatchObject({ x: 50, y: 44 });
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/entities/GearButton.ts`**

```ts
import { Container, Graphics } from "pixi.js";
import { GEAR_POS, GEAR_RADIUS } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface GearButton {
  readonly view: Container;
}

const TOOTH = { width: 10, height: 11, radius: 1.5 } as const;

const drawTeeth = (g: Graphics) => {
  for (let i = 0; i < 8; i++) {
    g.save?.();
    const angle = (i * Math.PI) / 4;
    const tx = Math.sin(angle) * (GEAR_RADIUS - 4);
    const ty = -Math.cos(angle) * (GEAR_RADIUS - 4);
    g.roundRect(tx - TOOTH.width / 2, ty - TOOTH.height / 2, TOOTH.width, TOOTH.height, TOOTH.radius)
      .fill(COLORS.hudFill).stroke({ width: STROKE.thick, color: COLORS.outline });
  }
};

export function createGearButton(opts: { onTap: () => void }): GearButton {
  const view = new Container();
  view.position.set(GEAR_POS.x, GEAR_POS.y);
  view.eventMode = "static";
  view.cursor = "pointer";
  const g = new Graphics();
  drawTeeth(g);
  g.circle(0, 0, GEAR_RADIUS - 6).fill(COLORS.hudFill).stroke({ width: STROKE.thick, color: COLORS.outline });
  g.circle(0, 0, 6).fill(COLORS.sky).stroke({ width: STROKE.normal, color: COLORS.outline });
  view.addChild(g);
  view.on("pointerup", opts.onTap);
  return { view };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/entities/GearButton.ts tests/entities/GearButton.spec.ts
git commit -m "feat(entities): chunky 8-tooth gear button (top-left)"
```

---

## Phase 5 — Systems

### Task 26: Trajectory preview

**Files:**
- Create: `src/systems/TrajectoryPreview.ts`
- Test: `tests/systems/TrajectoryPreview.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { computeTrajectoryPoints } from "../../src/systems/TrajectoryPreview";

describe("computeTrajectoryPoints", () => {
  it("starts at the launch position", () => {
    const pts = computeTrajectoryPoints({ x: 100, y: 200 }, { x: 6, y: -10 }, 1.4, 60, 1.6);
    expect(pts[0]).toEqual({ x: 100, y: 200 });
  });

  it("follows a parabola: y first decreases (rises) then increases (falls)", () => {
    const pts = computeTrajectoryPoints({ x: 0, y: 200 }, { x: 4, y: -12 }, 1.4, 60, 1.6);
    const ys = pts.map((p) => p.y);
    const minY = Math.min(...ys);
    const minIdx = ys.indexOf(minY);
    expect(minIdx).toBeGreaterThan(0);
    expect(minIdx).toBeLessThan(ys.length - 1);
  });

  it("returns the requested number of steps", () => {
    const pts = computeTrajectoryPoints({ x: 0, y: 0 }, { x: 1, y: -1 }, 1.4, 30, 1.0);
    expect(pts).toHaveLength(30);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/systems/TrajectoryPreview.ts`**

```ts
import { Container, Graphics } from "pixi.js";
import { COLORS } from "../config/theme";
import { GRAVITY_Y } from "../config/physics";
import { TRAJECTORY_STEPS, TRAJECTORY_TIME_HORIZON } from "../config/dimensions";

export interface Vec { x: number; y: number; }

export function computeTrajectoryPoints(
  start: Vec, velocity: Vec, gravity: number, steps: number, horizonSeconds: number,
): Vec[] {
  const out: Vec[] = [];
  const dt = horizonSeconds / steps;
  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    out.push({ x: start.x + velocity.x * t, y: start.y + velocity.y * t + 0.5 * gravity * t * t });
  }
  return out;
}

export interface TrajectoryPreview {
  readonly view: Container;
  show(start: Vec, velocity: Vec): void;
  clear(): void;
}

export function createTrajectoryPreview(): TrajectoryPreview {
  const view = new Container();
  const g = new Graphics();
  view.addChild(g);
  return {
    view,
    show: (start, velocity) => {
      g.clear();
      const pts = computeTrajectoryPoints(start, velocity, GRAVITY_Y * 1000, TRAJECTORY_STEPS, TRAJECTORY_TIME_HORIZON);
      for (let i = 0; i < pts.length; i += 4) {
        const p = pts[i]!;
        g.circle(p.x, p.y, 1.7).fill(COLORS.outline);
      }
    },
    clear: () => g.clear(),
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/systems/TrajectoryPreview.ts tests/systems/TrajectoryPreview.spec.ts
git commit -m "feat(systems): parabolic trajectory preview (compute + dotted render)"
```

---

### Task 27: Slingshot input

**Files:**
- Create: `src/systems/SlingshotInput.ts`
- Test: `tests/systems/SlingshotInput.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, vi } from "vitest";
import { createSlingshotInput } from "../../src/systems/SlingshotInput";

const fakeSlingshot = () => {
  const calls: string[] = [];
  return {
    calls,
    aimAt: vi.fn(() => calls.push("aim")),
    releaseVelocity: vi.fn(() => ({ x: 5, y: -3 })),
    reset: vi.fn(() => calls.push("reset")),
  };
};

describe("SlingshotInput", () => {
  it("pointerdown -> pointermove -> pointerup releases with the last aim", () => {
    const slingshot = fakeSlingshot();
    const onRelease = vi.fn();
    const input = createSlingshotInput({ slingshot, onRelease, onAim: () => {} });
    input.handlePointerDown({ x: 100, y: 100 });
    input.handlePointerMove({ x: 90, y: 110 });
    input.handlePointerMove({ x: 80, y: 120 });
    input.handlePointerUp();
    expect(slingshot.aimAt).toHaveBeenCalledTimes(2);
    expect(onRelease).toHaveBeenCalledWith({ x: 5, y: -3 });
  });

  it("pointerup without a prior pointerdown is ignored", () => {
    const slingshot = fakeSlingshot();
    const onRelease = vi.fn();
    const input = createSlingshotInput({ slingshot, onRelease, onAim: () => {} });
    input.handlePointerUp();
    expect(onRelease).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/systems/SlingshotInput.ts`**

```ts
export interface Vec { x: number; y: number; }
export interface Aimable {
  aimAt(point: Vec): void;
  releaseVelocity(): Vec;
  reset(): void;
}

export interface SlingshotInputDeps {
  slingshot: Aimable;
  onRelease(velocity: Vec): void;
  onAim(): void;
}

export interface SlingshotInput {
  handlePointerDown(p: Vec): void;
  handlePointerMove(p: Vec): void;
  handlePointerUp(): void;
}

export function createSlingshotInput(deps: SlingshotInputDeps): SlingshotInput {
  let dragging = false;
  return {
    handlePointerDown: () => { dragging = true; },
    handlePointerMove: (p) => {
      if (!dragging) return;
      deps.slingshot.aimAt(p);
      deps.onAim();
    },
    handlePointerUp: () => {
      if (!dragging) return;
      const v = deps.slingshot.releaseVelocity();
      deps.slingshot.reset();
      deps.onRelease(v);
      dragging = false;
    },
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/systems/SlingshotInput.ts tests/systems/SlingshotInput.spec.ts
git commit -m "feat(systems): slingshot drag input handler"
```

---

### Task 28: Accessible tap mode (ballistic solver)

**Files:**
- Create: `src/systems/AccessibleTapMode.ts`
- Test: `tests/systems/AccessibleTapMode.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { computeVelocityForTarget } from "../../src/systems/AccessibleTapMode";

describe("computeVelocityForTarget", () => {
  it("returns a velocity that, applied with constant gravity, lands within 5 px of the target", () => {
    const start = { x: 120, y: 270 };
    const target = { x: 600, y: 130 };
    const g = 980; // px/s²
    const v = computeVelocityForTarget(start, target, g, 1.0);
    // simulate
    let p = { ...start };
    let vy = v.y;
    const dt = 1 / 240;
    for (let t = 0; t < 1.5; t += dt) {
      p = { x: p.x + v.x * dt, y: p.y + vy * dt };
      vy += g * dt;
      if (Math.hypot(p.x - target.x, p.y - target.y) < 5) return;
    }
    throw new Error(`never reached target: ended at ${p.x},${p.y}`);
  });

  it("hits the apex above the target when timeOfFlight is large", () => {
    const start = { x: 120, y: 270 };
    const target = { x: 500, y: 100 };
    const v = computeVelocityForTarget(start, target, 980, 1.5);
    expect(v.y).toBeLessThan(0); // initial upward velocity
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/systems/AccessibleTapMode.ts`**

```ts
export interface Vec { x: number; y: number; }

export function computeVelocityForTarget(start: Vec, target: Vec, gravity: number, timeOfFlight: number): Vec {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  return {
    x: dx / timeOfFlight,
    y: (dy - 0.5 * gravity * timeOfFlight * timeOfFlight) / timeOfFlight,
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/systems/AccessibleTapMode.ts tests/systems/AccessibleTapMode.spec.ts
git commit -m "feat(systems): accessible tap-mode ballistic solver"
```

---

### Task 29: Collision handler

**Files:**
- Create: `src/systems/CollisionHandler.ts`
- Test: `tests/systems/CollisionHandler.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { classifyHit } from "../../src/systems/CollisionHandler";

describe("classifyHit", () => {
  const aabb = { minX: 100, maxX: 160, minY: 50, maxY: 110 };
  it("returns rabbit when point is inside the rabbit's aabb", () => {
    expect(classifyHit({ x: 130, y: 80 }, [aabb])).toEqual({ kind: "rabbit", index: 0 });
  });

  it("returns ground when below GROUND_Y and not in any aabb", () => {
    expect(classifyHit({ x: 30, y: 380 }, [aabb])).toEqual({ kind: "ground" });
  });

  it("returns none when in mid-air outside any rabbit aabb", () => {
    expect(classifyHit({ x: 30, y: 30 }, [aabb])).toEqual({ kind: "none" });
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/systems/CollisionHandler.ts`**

```ts
import { GROUND_Y } from "../config/dimensions";

export interface Vec { x: number; y: number; }
export interface Aabb { minX: number; maxX: number; minY: number; maxY: number; }
export type HitClassification =
  | { kind: "rabbit"; index: number }
  | { kind: "ground" }
  | { kind: "none" };

export function classifyHit(point: Vec, aabbs: readonly Aabb[]): HitClassification {
  for (let i = 0; i < aabbs.length; i++) {
    const b = aabbs[i]!;
    if (point.x >= b.minX && point.x <= b.maxX && point.y >= b.minY && point.y <= b.maxY) {
      return { kind: "rabbit", index: i };
    }
  }
  return point.y >= GROUND_Y ? { kind: "ground" } : { kind: "none" };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/systems/CollisionHandler.ts tests/systems/CollisionHandler.spec.ts
git commit -m "feat(systems): collision classification (rabbit aabb / ground / none)"
```

---

## Phase 6 — Scene assembly

### Task 30: GameScene skeleton (assemble entities)

**Why:** wire entities into a scene that renders correctly. No round logic yet — that comes in the next task.

**Files:**
- Create: `src/scenes/GameScene.ts`
- Test: `tests/scenes/GameScene.skeleton.spec.ts`

- [ ] **Step 1: Write tests for the skeleton**

```ts
import { describe, it, expect } from "vitest";
import { createGameScene } from "../../src/scenes/GameScene";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";
import { createPhysicsWorld } from "../../src/core/PhysicsWorld";

describe("GameScene (skeleton)", () => {
  it("initialises with a non-null view containing static decor + 4 rabbits", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({ settings: DEFAULT_SETTINGS, physics, onOpenSettings: () => {}, onSessionRestart: () => {} });
    expect(scene.view.children.length).toBeGreaterThan(0);
    expect(scene.rabbits().length).toBe(4);
    physics.destroy();
  });

  it("first question is set on the math sign", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({ settings: DEFAULT_SETTINGS, physics, onOpenSettings: () => {}, onSessionRestart: () => {} });
    expect(scene.mathSign().text()).toMatch(/× .* = \?/);
    physics.destroy();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/scenes/GameScene.ts` (skeleton, no round flow yet)**

```ts
import { Container } from "pixi.js";
import { createTree } from "../entities/Tree";
import { createRabbit, type Rabbit } from "../entities/Rabbit";
import { createSlingshot } from "../entities/Slingshot";
import { createMathSign } from "../entities/MathSign";
import { createCarrotCounter } from "../entities/CarrotCounter";
import { createGearButton } from "../entities/GearButton";
import { TREE_PERCHES } from "../config/dimensions";
import type { Settings } from "../services/Settings";
import type { PhysicsWorld } from "../core/PhysicsWorld";
import type { Scene } from "../core/Scene";
import { generateSession } from "../domain/QuestionGenerator";
import { createSession, type Session } from "../domain/Session";

export interface GameSceneDeps {
  settings: Settings;
  physics: PhysicsWorld;
  onOpenSettings(): void;
  onSessionRestart(): void;
}

export interface GameScene extends Scene {
  rabbits(): readonly Rabbit[];
  mathSign(): ReturnType<typeof createMathSign>;
  session(): Session;
}

const newSession = (settings: Settings): Session => {
  const rounds = generateSession({
    tableListId: settings.tableListId,
    difficulty: settings.difficulty,
    count: settings.roundsPerSession,
    seed: Date.now(),
  });
  return createSession({ rounds, carrotsPerRound: settings.carrotsPerRound });
};

const buildRabbits = (numbers: readonly number[]): Rabbit[] =>
  TREE_PERCHES.map((p, i) => {
    const r = createRabbit({ position: { x: p.x, y: p.y } });
    r.setNumber(numbers[i] ?? 0);
    return r;
  });

export function createGameScene(deps: GameSceneDeps): GameScene {
  const view = new Container();
  const tree = createTree();
  const slingshot = createSlingshot();
  const sign = createMathSign();
  const counter = createCarrotCounter(deps.settings.carrotsPerRound);
  const gear = createGearButton({ onTap: deps.onOpenSettings });

  let session = newSession(deps.settings);
  const rabbits = buildRabbits(session.currentQuestion().choices);
  sign.setQuestion(session.currentQuestion());

  view.addChild(tree.view, slingshot.view, sign.view, counter.view, gear.view);
  for (const r of rabbits) view.addChild(r.view);

  return {
    id: "game",
    view,
    rabbits: () => rabbits,
    mathSign: () => sign,
    session: () => session,
    onEnter: () => {},
    onExit: () => {},
    onTick: () => {},
    pause: () => {},
    resume: () => {},
    destroy: () => view.destroy({ children: true }),
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts tests/scenes/GameScene.skeleton.spec.ts
git commit -m "feat(scenes): game scene skeleton (tree + rabbits + slingshot + HUD)"
```

---

### Task 31: GameScene round flow (state machine integration)

**Why:** wire the input → carrot launch → collision → session transitions loop.

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Test: `tests/scenes/GameScene.round.spec.ts`

- [ ] **Step 1: Write integration tests**

```ts
import { describe, it, expect } from "vitest";
import { createGameScene } from "../../src/scenes/GameScene";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";
import { createPhysicsWorld } from "../../src/core/PhysicsWorld";

describe("GameScene round flow", () => {
  it("forceCorrectHit advances score and sets next question", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({ settings: { ...DEFAULT_SETTINGS, roundsPerSession: 3 }, physics, onOpenSettings: () => {}, onSessionRestart: () => {} });
    const before = scene.session().snapshot();
    scene.forceCorrectHit();
    expect(scene.session().snapshot().score).toBe(before.score + 1);
    physics.destroy();
  });

  it("forceWrongHit decreases carrots; three misses end the round with no score", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({ settings: { ...DEFAULT_SETTINGS, carrotsPerRound: 3, roundsPerSession: 3 }, physics, onOpenSettings: () => {}, onSessionRestart: () => {} });
    scene.forceWrongHit();
    scene.forceWrongHit();
    scene.forceWrongHit();
    expect(scene.session().snapshot().score).toBe(0);
    expect(scene.session().snapshot().phase).toBe("round_over");
    physics.destroy();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Extend `GameScene` with the round flow**

Add a `delay` dependency to `GameSceneDeps`:

```ts
export interface GameSceneDeps {
  settings: Settings;
  physics: PhysicsWorld;
  onOpenSettings(): void;
  onSessionRestart(): void;
  delay?: (ms: number) => Promise<void>;
}
```

Add to `GameScene` interface:

```ts
forceCorrectHit(): void;
forceWrongHit(): void;
```

Inside `createGameScene`, set up the delay shim and helpers:

```ts
const delay = deps.delay ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

const advanceToNext = async () => {
  await delay(1200);
  if (session.snapshot().currentIndex < session.snapshot().totalRounds - 1) {
    session.nextRound();
    refreshRound();
  } else {
    session.nextRound(); // becomes session_over
  }
};

const refreshRound = () => {
  const q = session.currentQuestion();
  sign.setQuestion(q);
  q.choices.forEach((n, i) => rabbits[i]?.setNumber(n));
  counter.setRemaining(deps.settings.carrotsPerRound);
};

const onCorrect = () => {
  session.startResolving();
  session.recordHit();
  void advanceToNext();
};

const onWrong = () => {
  session.startResolving();
  session.recordMiss();
  counter.setRemaining(session.snapshot().carrotsLeft);
  if (session.snapshot().phase === "round_over") void advanceToNext();
};
```

Expose them as `forceCorrectHit: onCorrect, forceWrongHit: onWrong`.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts tests/scenes/GameScene.round.spec.ts
git commit -m "feat(scenes): round flow (hit/miss/round_over/next round)"
```

---

### Task 32: GameScene end-of-session sequence

**Why:** when last round ends, all fallen rabbits hop in place + run away, math sign shows score, then auto-refresh.

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/scenes/GameScene.round.spec.ts`

- [ ] **Step 1: Add end-of-session test (uses vi fake timers + injectable clock)**

The GameScene must accept an injectable `delay(ms)` so tests can advance it without real timers, AND we use `vi.useFakeTimers()` for the tween updates.

```ts
import { vi } from "vitest";

it("after last round, math sign shows score and onSessionRestart is called", async () => {
  const physics = createPhysicsWorld();
  const restarts: number[] = [];
  let advance: (() => void) | null = null;
  const delay = (ms: number) => new Promise<void>((resolve) => {
    advance = () => { advance = null; resolve(); };
    setTimeout(advance, ms);
  });
  const scene = createGameScene({
    settings: { ...DEFAULT_SETTINGS, roundsPerSession: 1 },
    physics,
    delay,
    onOpenSettings: () => {},
    onSessionRestart: () => { restarts.push(1); },
  });
  scene.forceCorrectHit();
  // Drain the round-over delay
  await new Promise((r) => setImmediate(r));
  advance?.();
  await new Promise((r) => setImmediate(r));
  // Drain the end-of-session delay
  advance?.();
  await new Promise((r) => setImmediate(r));
  expect(scene.mathSign().text()).toMatch(/^\d+ \/ 1 bonnes réponses$/);
  expect(restarts).toHaveLength(1);
  physics.destroy();
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement the end-of-session sequence**

Add to `GameScene` (replace the simple `advanceToNext` from previous task):

```ts
const fallenRabbits: Rabbit[] = [];

const recordFallen = (index: number) => {
  const r = rabbits[index];
  if (!r || r.isFallen()) return;
  r.markFallen();
  fallenRabbits.push(r);
};

const playEndOfSession = async () => {
  const snap = session.snapshot();
  await sign.tweenWidthTo(MATH_SIGN.expandedWidth);
  sign.setEndOfSessionMessage(snap.score, snap.totalRounds);
  await Promise.all(fallenRabbits.map((r) => r.playHopInPlace()));
  await Promise.all(fallenRabbits.map((r) => r.playRunAwayRight(DESIGN_WIDTH + 80)));
  await delay(1000);
  deps.onSessionRestart();
};
```

Add a `delay?: (ms: number) => Promise<void>` field to `GameSceneDeps` (default: `(ms) => new Promise((r) => setTimeout(r, ms))`). All time-based pauses inside `advanceToNext` and `playEndOfSession` go through this `delay`. Tests inject their own `delay` to control timing deterministically.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts tests/scenes/GameScene.round.spec.ts
git commit -m "feat(scenes): end-of-session sequence (score + hop + run-away + restart)"
```

---

### Task 33: SettingsScene (overlay panel)

**Files:**
- Create: `src/ui/Modal.ts`
- Create: `src/scenes/SettingsScene.ts`
- Test: `tests/scenes/SettingsScene.spec.ts`

- [ ] **Step 1: Write tests for state behaviour**

```ts
import { describe, it, expect, vi } from "vitest";
import { createSettingsScene } from "../../src/scenes/SettingsScene";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";

describe("SettingsScene", () => {
  it("emits onChange with the new settings when a value is updated", () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const scene = createSettingsScene({ initial: DEFAULT_SETTINGS, onChange, onClose });
    scene.setDifficulty("hard");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ difficulty: "hard" }));
  });

  it("close fires onClose with the latest settings and a `restartRequested` flag", () => {
    const onClose = vi.fn();
    const scene = createSettingsScene({ initial: DEFAULT_SETTINGS, onChange: () => {}, onClose });
    scene.setRoundsPerSession(20); // a "regenerates session" parameter
    scene.confirmCloseWith(true);
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ roundsPerSession: 20 }), true);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `src/scenes/SettingsScene.ts`**

The scene exposes typed setters; the visual panel can be wired manually. Build a minimal panel with PixiJS Text rows (full design polish can come in iteration).

```ts
import { Container } from "pixi.js";
import type { Settings } from "../services/Settings";
import type { Scene } from "../core/Scene";
import type { Difficulty } from "../domain/DifficultyConfig";
import type { TableListId } from "../domain/tables";

export interface SettingsSceneDeps {
  initial: Settings;
  onChange(next: Settings): void;
  onClose(next: Settings, restartRequested: boolean): void;
}

export interface SettingsScene extends Scene {
  setTableList(id: TableListId): void;
  setRoundsPerSession(n: number): void;
  setCarrotsPerRound(n: number): void;
  setDifficulty(d: Difficulty): void;
  setTapMode(on: boolean): void;
  setSoundEnabled(on: boolean): void;
  setMusicEnabled(on: boolean): void;
  confirmCloseWith(restart: boolean): void;
}

export function createSettingsScene(deps: SettingsSceneDeps): SettingsScene {
  const view = new Container();
  let state = { ...deps.initial };
  const update = (patch: Partial<Settings>) => { state = { ...state, ...patch }; deps.onChange(state); };
  return {
    id: "settings", view,
    onEnter: () => {}, onExit: () => {}, onTick: () => {}, pause: () => {}, resume: () => {},
    destroy: () => view.destroy({ children: true }),
    setTableList: (id) => update({ tableListId: id }),
    setRoundsPerSession: (n) => update({ roundsPerSession: n }),
    setCarrotsPerRound: (n) => update({ carrotsPerRound: n }),
    setDifficulty: (d) => update({ difficulty: d }),
    setTapMode: (on) => update({ tapMode: on }),
    setSoundEnabled: (on) => update({ soundEnabled: on }),
    setMusicEnabled: (on) => update({ musicEnabled: on }),
    confirmCloseWith: (restart) => deps.onClose(state, restart),
  };
}
```

**Note on visuals:** This task delivers only the state machine and typed setters that are unit-testable. The Pixi visual layout (title, rows, toggles, buttons, confirmation modal) is built in Task 33b below.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```ts
git add src/scenes/SettingsScene.ts tests/scenes/SettingsScene.spec.ts
git commit -m "feat(scenes): settings overlay scene with typed setters"
```

---

### Task 33b: SettingsScene visual panel

**Why:** render the Pixi UI (title, rows, toggles, buttons, confirmation) so the settings scene is actually usable in-game. This task is mostly visual code — no domain logic. Manually validated; no new unit tests.

**Files:**
- Modify: `src/scenes/SettingsScene.ts` (must stay ≤ 200 lines — split helpers into a sub-file if needed)
- Create (if needed): `src/scenes/SettingsPanel.ts` (visual builders, ≤ 200 lines)

- [ ] **Step 1: Create the panel background**

In `SettingsPanel.ts`:

```ts
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, STROKE } from "../config/theme";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config/dimensions";

const PANEL_W = 540;
const PANEL_H = 320;
const BACK_ALPHA = 0.6;

export function createPanelBackground(): Container {
  const root = new Container();
  const dim = new Graphics();
  dim.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill({ color: 0x000000, alpha: BACK_ALPHA });
  root.addChild(dim);
  const card = new Graphics();
  const x = (DESIGN_WIDTH - PANEL_W) / 2;
  const y = (DESIGN_HEIGHT - PANEL_H) / 2;
  card.roundRect(x, y, PANEL_W, PANEL_H, 12)
    .fill(COLORS.signFill).stroke({ width: STROKE.thick, color: COLORS.outline });
  root.addChild(card);
  return root;
}

const TITLE_STYLE = new TextStyle({ fontFamily: "ui-rounded, system-ui", fontWeight: "800", fontSize: 22, fill: COLORS.outline });

export function createPanelTitle(text: string): Text {
  const t = new Text({ text, style: TITLE_STYLE });
  t.anchor.set(0.5, 0);
  t.position.set(DESIGN_WIDTH / 2, (DESIGN_HEIGHT - PANEL_H) / 2 + 18);
  return t;
}
```

- [ ] **Step 2: Add a row builder**

```ts
const ROW_HEIGHT = 36;
const ROW_LABEL_X = (DESIGN_WIDTH - PANEL_W) / 2 + 24;
const ROW_VALUE_X = (DESIGN_WIDTH + PANEL_W) / 2 - 24;

const LABEL_STYLE = new TextStyle({ fontFamily: "ui-rounded,system-ui", fontWeight: "700", fontSize: 16, fill: COLORS.outline });
const VALUE_STYLE = new TextStyle({ fontFamily: "ui-rounded,system-ui", fontWeight: "800", fontSize: 16, fill: COLORS.outline });

export interface CycleRow {
  readonly view: Container;
  setValue(label: string): void;
  onTap(handler: () => void): void;
}

export function createCycleRow(label: string, rowIndex: number): CycleRow {
  const view = new Container();
  view.eventMode = "static";
  view.cursor = "pointer";
  const y = (DESIGN_HEIGHT - PANEL_H) / 2 + 60 + rowIndex * (ROW_HEIGHT + 6);
  const labelText = new Text({ text: label, style: LABEL_STYLE });
  labelText.position.set(ROW_LABEL_X, y);
  const valueText = new Text({ text: "", style: VALUE_STYLE });
  valueText.anchor.set(1, 0);
  valueText.position.set(ROW_VALUE_X, y);
  view.addChild(labelText, valueText);
  let handler: (() => void) | null = null;
  view.on("pointerup", () => handler?.());
  return {
    view,
    setValue: (s) => { valueText.text = s; },
    onTap: (h) => { handler = h; },
  };
}
```

- [ ] **Step 3: Wire the rows in `SettingsScene`**

Inside `createSettingsScene`, after building `view`, add:

```ts
import { createPanelBackground, createPanelTitle, createCycleRow } from "./SettingsPanel";
import { TABLE_LISTS } from "../domain/tables";
import type { Difficulty } from "../domain/DifficultyConfig";

view.addChild(createPanelBackground());
view.addChild(createPanelTitle("Paramètres"));

const tableIds = Object.keys(TABLE_LISTS) as Array<keyof typeof TABLE_LISTS>;
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const rounds = [5, 10, 15, 20];
const carrots = [2, 3, 4];

const cycle = <T,>(arr: readonly T[], current: T): T => arr[(arr.indexOf(current) + 1) % arr.length] as T;

const tableRow = createCycleRow("Liste de calculs", 0);
tableRow.setValue(TABLE_LISTS[state.tableListId].label);
tableRow.onTap(() => { update({ tableListId: cycle(tableIds, state.tableListId) }); tableRow.setValue(TABLE_LISTS[state.tableListId].label); });
view.addChild(tableRow.view);

const diffRow = createCycleRow("Difficulté", 1);
diffRow.setValue(state.difficulty);
diffRow.onTap(() => { update({ difficulty: cycle(difficulties, state.difficulty) }); diffRow.setValue(state.difficulty); });
view.addChild(diffRow.view);

const roundsRow = createCycleRow("Manches par session", 2);
roundsRow.setValue(String(state.roundsPerSession));
roundsRow.onTap(() => { update({ roundsPerSession: cycle(rounds, state.roundsPerSession) }); roundsRow.setValue(String(state.roundsPerSession)); });
view.addChild(roundsRow.view);

const carrotsRow = createCycleRow("Carottes par manche", 3);
carrotsRow.setValue(String(state.carrotsPerRound));
carrotsRow.onTap(() => { update({ carrotsPerRound: cycle(carrots, state.carrotsPerRound) }); carrotsRow.setValue(String(state.carrotsPerRound)); });
view.addChild(carrotsRow.view);

const tapRow = createCycleRow("Mode tap (accessibilité)", 4);
tapRow.setValue(state.tapMode ? "ON" : "OFF");
tapRow.onTap(() => { update({ tapMode: !state.tapMode }); tapRow.setValue(state.tapMode ? "ON" : "OFF"); });
view.addChild(tapRow.view);

const sfxRow = createCycleRow("Bruitages", 5);
sfxRow.setValue(state.soundEnabled ? "ON" : "OFF");
sfxRow.onTap(() => { update({ soundEnabled: !state.soundEnabled }); sfxRow.setValue(state.soundEnabled ? "ON" : "OFF"); });
view.addChild(sfxRow.view);

const musicRow = createCycleRow("Musique", 6);
musicRow.setValue(state.musicEnabled ? "ON" : "OFF");
musicRow.onTap(() => { update({ musicEnabled: !state.musicEnabled }); musicRow.setValue(state.musicEnabled ? "ON" : "OFF"); });
view.addChild(musicRow.view);
```

- [ ] **Step 4: Add a "Fermer" tap zone that triggers confirmation when needed**

Append a `Button` (use `createGearButton` style as inspiration or a plain rectangle Graphics with a Text label). Detect "session-impacting" changes by comparing `state` to `deps.initial`:

```ts
const sessionImpactingChanged = () =>
  state.tableListId !== deps.initial.tableListId
  || state.difficulty !== deps.initial.difficulty
  || state.roundsPerSession !== deps.initial.roundsPerSession;
```

When the close button is tapped, if `sessionImpactingChanged()`, surface a small confirmation row with "Oui" / "Non" tap zones. Tapping "Oui" → `deps.onClose(state, true)`. Tapping "Non" → `deps.onClose(state, false)`. Otherwise close immediately with `restart=false`.

Implement the close button + the optional confirmation row analogously to `createCycleRow` (a Container with text and a `pointerup` handler). Keep each helper ≤ 20 lines.

- [ ] **Step 5: Verify visually with `pnpm dev`**

Open the gear icon, change a value, close — see the confirmation when impacting parameters changed. Persisted on reload.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/SettingsScene.ts src/scenes/SettingsPanel.ts
git commit -m "feat(scenes): settings panel UI (rows, toggles, confirmation)"
```

---

## Phase 7 — Bootstrap & polish

### Task 34: OrientationLock UI

**Files:**
- Create: `src/ui/OrientationLock.ts`

- [ ] **Step 1: Implement**

```ts
export function installOrientationLock(parent: HTMLElement): void {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #111; color: #fff8e5;
    display: none; align-items: center; justify-content: center;
    font-family: ui-rounded, system-ui, sans-serif; font-size: 22px;
    z-index: 9999; text-align: center;
  `;
  overlay.textContent = "Tourne ton téléphone pour jouer 🔄";
  parent.appendChild(overlay);
  const update = () => {
    const portrait = window.innerHeight > window.innerWidth;
    overlay.style.display = portrait ? "flex" : "none";
  };
  update();
  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/OrientationLock.ts
git commit -m "feat(ui): portrait lock overlay"
```

---

### Task 35: main.ts bootstrap (wires everything)

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Replace placeholder with full bootstrap**

```ts
import { createApp } from "./core/App";
import { createPhysicsWorld } from "./core/PhysicsWorld";
import { createSceneManager } from "./core/SceneManager";
import { createGameScene } from "./scenes/GameScene";
import { createSettingsScene } from "./scenes/SettingsScene";
import { loadSettings, saveSettings, type Settings } from "./services/Settings";
import { createAudio } from "./services/Audio";
import { installOrientationLock } from "./ui/OrientationLock";
import { tickTweens } from "./entities/animations/Tween";
import { Ticker } from "pixi.js";

async function main(): Promise<void> {
  const root = document.getElementById("game-root");
  if (!root) throw new Error("Missing #game-root");
  installOrientationLock(document.body);

  const app = await createApp(root);
  const physics = createPhysicsWorld();
  const sm = createSceneManager(app.stage);
  let settings: Settings = loadSettings();
  const audio = createAudio({
    AudioCtor: Audio,
    sfxEnabled: () => settings.soundEnabled,
    musicEnabled: () => settings.musicEnabled,
  });
  audio.startMusic();

  const startGame = (): void => {
    const game = createGameScene({
      settings,
      physics,
      onOpenSettings: () => {
        sm.openOverlay(createSettingsScene({
          initial: settings,
          onChange: (next) => { settings = next; saveSettings(next); },
          onClose: (next, restart) => { settings = next; sm.closeOverlay(); if (restart) startGame(); },
        }));
      },
      onSessionRestart: () => startGame(),
    });
    sm.goTo(game);
  };

  startGame();

  Ticker.shared.add((t) => {
    physics.step(t.deltaMS);
    sm.tick(t.deltaMS);
    tickTweens(performance.now());
  });
}

void main();
```

- [ ] **Step 2: Verify dev server runs**

Run: `pnpm dev`
Open the URL on a phone landscape (or browser dev-tools mobile mode at 844×390).
Verify: tree + 4 rabbits visible, slingshot on left, math question top-center, gear top-left, 3 carrots laid on grass right of slingshot.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): bootstrap pipeline (app + physics + scene manager + audio)"
```

---

### Task 36: Manual smoke test on phone landscape

**Goal:** spec acceptance criteria §11.

- [ ] **Step 1: Run dev server**

Run: `pnpm dev`

- [ ] **Step 2: Open `http://localhost:5173` in a phone-landscape device or DevTools (iPhone 14 Pro landscape)**

Verify each criterion from the spec:
1. Full session playable from start to finish (10 rounds default).
2. On a correct hit: rabbit bites, falls below its branch, stays on grass.
3. After last round: math sign widens to "X / N bonnes réponses", fallen rabbits hop then run right, 1 s pause, auto-refresh.
4. Gear opens settings; values change; persistence after reload.
5. Tap mode: enabling makes a tap on a rabbit fire automatically.
6. `pnpm test` is green with ≥ 85% coverage globally and 100% on `src/domain/`.
7. `pnpm lint && pnpm build` pass.
8. CI green.
9. No function > 20 lines, no file > 200 lines.

- [ ] **Step 3: If anything fails, file a quick task in this plan, fix, commit, and re-test**

- [ ] **Step 4: Commit any final adjustments**

```bash
git commit -m "chore: smoke-test polish from manual phone testing"
```

- [ ] **Step 5: Push final state**

```bash
git push
```

---

## Self-review notes

The plan covers the spec section by section:
- Spec §2 Gameplay → Tasks 9, 10, 30–32.
- Spec §3 Visuals → Tasks 18–25.
- Spec §4 Settings → Tasks 12, 33, 35.
- Spec §5 Domain → Tasks 6–10.
- Spec §6 Architecture → Tasks 1–5, 14–17.
- Spec §7 Rendering → Tasks 18–25.
- Spec §8 Flow → Tasks 30–32, 35.
- Spec §9 TDD strategy → applied throughout (every task has a tests-first step). CI in Task 5.
- Spec §11 acceptance → Task 36.

If during execution a step requires a placeholder ("write the panel later", "add validation"), pause and split it into its own concrete task with code.
