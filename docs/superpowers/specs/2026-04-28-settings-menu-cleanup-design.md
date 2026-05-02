# Settings menu cleanup + variable rabbit count

## Goal

Reduce the settings menu to three rows and make the number of rabbits a player-facing choice (4 to 8). Remove every setting the player no longer sees, both from the UI and from the data model.

## Final menu

| Row | Label | Type | Values |
|-----|-------|------|--------|
| 1 | Questions | calc picker (existing) | subset of 90 pairs |
| 2 | Nombre de lapins | cycle | 4, 5, 6, 7, 8 |
| 3 | Mode tap | toggle | ON / OFF |

The first row keeps its current behavior; only its label changes (`Liste de calculs` → `Questions`). The third row keeps its current behavior unchanged.

## `Settings` shape after refactor

```ts
export type RabbitsCount = 4 | 5 | 6 | 7 | 8;

export interface Settings {
  selectedPairs: Pair[];
  rabbitsCount: RabbitsCount;
  tapMode: boolean;
}
```

`validateSettings` clamps any persisted value into the `RabbitsCount` union: integer in [4,8], default 4 otherwise. The narrowed literal type lets `TREE_PERCHES_BY_COUNT[settings.rabbitsCount]` typecheck without a cast.

Removed fields: `roundsPerSession`, `carrotsPerRound`, `difficulty`, `soundEnabled`, `musicEnabled`. Persisted-storage entries that contain the old fields are ignored — `loadSettings` falls back to `DEFAULT_SETTINGS` when the shape doesn't match. No migration code; the storage key `rabbit-math.settings` is small and dropping unknown shapes is acceptable.

## Constants replacing the removed fields

The game engine still needs values for the removed concepts. They become module-level constants in `src/domain/sessionConfig.ts` (new file):

```ts
export const DEFAULT_DIFFICULTY: Difficulty = "medium";
export const ROUNDS_PER_SESSION = 10;
export const CARROTS_PER_ROUND = 4;
```

Call sites that previously read `settings.roundsPerSession` / `settings.carrotsPerRound` / `settings.difficulty` import these constants instead. `Difficulty` type stays — only the player-facing selector goes away.

`soundEnabled` and `musicEnabled` are deleted entirely (verified unused below).

## Rabbit-count system

### Perch layout

`TREE_PERCHES` (currently `readonly { x, y }[]` of length 4) becomes:

```ts
export const TREE_PERCHES_BY_COUNT: Record<4 | 5 | 6 | 7 | 8, ReadonlyArray<{x: number; y: number}>> = {
  4: [/* current 4 positions */],
  5: [...],
  6: [...],
  7: [...],
  8: [...],
};
```

Proposed coordinates (placeholders — will be re-tuned when the per-count PNG art lands):

- **4** (current): (605,110), (770,175), (470,220), (510,290)
- **5**: + (720,130) → (605,110), (720,130), (770,175), (470,220), (510,290)
- **6**: + (665,240) → (605,110), (720,130), (770,175), (665,240), (470,220), (510,290)
- **7**: + (425,130) → (425,130), (605,110), (720,130), (770,175), (665,240), (470,220), (510,290)
- **8**: + (770,260) → (425,130), (605,110), (720,130), (770,175), (665,240), (770,260), (470,220), (510,290)

### Ballistic constraint

For every pair (R1, R2) of perches in a layout, there must exist a launch velocity from `SLINGSHOT_ANCHOR (122, 270)` such that the parabola hits R1 first, and another that hits R2 first. Equivalent informal rule the proposed coordinates satisfy: no two perches are vertically stacked at the same x; perches with similar x differ by enough vertical distance and angular position that the slingshot can thread one without crossing the other's collision AABB.

The check is performed by visual inspection during implementation and can be re-validated by running the game at each rabbit count. No automated trajectory test is added (the layouts are placeholders pending PNG art).

### Distractors

`generateDistractors(answer, difficulty, rng)` becomes `generateDistractors(answer, difficulty, count, rng)` and produces `count - 1` distractors. `count` is `rabbitsCount` from `Settings`. `widenIfNeeded` already accepts a `target` arg, so the only change inside is replacing the literal `3` with the parameter.

Edge case: if the candidate pool is too small for `count - 1` distractors at the chosen difficulty, `widenIfNeeded` already widens the range; a final `console.warn` (already present) covers the unlikely case where even the widest range can't fill it.

### `GameScene.buildRabbits`

```ts
const buildRabbits = (choices: readonly number[], count: RabbitsCount): Rabbit[] =>
  TREE_PERCHES_BY_COUNT[count].map((p, i) => {
    const r = createRabbit({ position: { x: p.x, y: p.y } });
    r.setNumber(choices[i] ?? 0);
    return r;
  });
```

Called with `settings.rabbitsCount`.

## Settings panel rewiring

`SettingsScene.ts` and `SettingsPanel.ts`:
- Remove `addDifficultyRow`, `addRoundsRow`, `addCarrotsRow`, the two non-tap toggle rows.
- Rename the calc-picker label to `"Questions"`.
- Add a cycle row for `rabbitsCount` with values `[4, 5, 6, 7, 8]`.
- `sessionImpactingChanged` now compares `selectedPairs` and `rabbitsCount` (changing rabbit count must restart the session because the perch layout and choices change).
- Remove `DIFFICULTIES`, `ROUNDS_OPTIONS`, `CARROTS_OPTIONS`, `difficultyLabel` exports (no longer used).
- Add `RABBITS_OPTIONS = [4, 5, 6, 7, 8] as const`.
- `PANEL_H` in `SettingsPanel.ts` shrinks from 320 to roughly 220 (we lose 4 rows of 28px and gain none net; keep enough vertical padding for the close button and the Y/N confirm prompt).

## Tests

Update existing suites to match the new shape:
- `tests/services/Settings.spec.ts` — drop assertions on removed fields, add `rabbitsCount` validation (clamp into [4,8]).
- `tests/scenes/SettingsScene.spec.ts` — replace removed-row assertions with rabbits-row assertions; update `sessionImpactingChanged` cases.
- `tests/scenes/GameScene.round.spec.ts` — replace `carrotsPerRound: N` settings with the new shape; update to use the constant via the engine.
- `tests/domain/Session.spec.ts` — `createSession` still takes `carrotsPerRound`; pass `CARROTS_PER_ROUND` directly.
- `tests/entities/CarrotCounter.spec.ts` — no change.
- New test in `tests/domain/QuestionGenerator.spec.ts` (or extend existing) — verify `generateDistractors(... count)` returns exactly `count - 1` distractors.
- New test in `tests/scenes/GameScene.spec.ts` — verify rabbit count matches `settings.rabbitsCount` after scene assembly.

## Verification of `soundEnabled` / `musicEnabled` unused

Both fields are read only in `Settings` shape validation today (no audio system exists in the codebase). They are deleted from the type, defaults, and validator with no replacement. Verified during implementation; if a hidden reference is found, it gets ripped out as part of the same change.

## Out of scope

- The future per-count tree PNG art and the matching perch fine-tuning.
- Any audio system.
- Difficulty selector returning later.
- Migration of old persisted settings (just discarded).
