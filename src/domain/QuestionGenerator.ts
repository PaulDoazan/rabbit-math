import { getTableList, type TableListId, type Pair } from "./tables";
import { generateDistractors, type Difficulty } from "./DifficultyConfig";
import { mulberry32, pickFrom, shuffle, type Rng } from "./Rng";
import type { Question } from "./Question";

export interface SessionRequest {
  readonly tableListId: TableListId;
  readonly difficulty: Difficulty;
  readonly count: number;
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

const buildQuestion = (pair: Pair, difficulty: Difficulty, rng: Rng): Question => {
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
