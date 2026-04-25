import { describe, it, expect } from "vitest";
import { generateSession } from "../../src/domain/QuestionGenerator";
import { allPairs, getTableList } from "../../src/domain/tables";

const ALL = allPairs();
const TABLE_2 = getTableList("table_2").pairs;

describe("generateSession", () => {
  it("returns the requested number of questions", () => {
    const qs = generateSession({ pairs: ALL, difficulty: "medium", count: 10, seed: 1 });
    expect(qs).toHaveLength(10);
  });

  it("each question has answer = a × b", () => {
    const qs = generateSession({ pairs: ALL, difficulty: "medium", count: 10, seed: 2 });
    for (const q of qs) expect(q.answer).toBe(q.a * q.b);
  });

  it("each question has 4 distinct choices including the answer", () => {
    const qs = generateSession({ pairs: ALL, difficulty: "medium", count: 10, seed: 3 });
    for (const q of qs) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
    }
  });
});

describe("generateSession variability", () => {
  it("choices are shuffled (the answer is not always at index 0)", () => {
    const qs = generateSession({ pairs: ALL, difficulty: "medium", count: 30, seed: 4 });
    const positions = qs.map((q) => q.choices.indexOf(q.answer));
    expect(new Set(positions).size).toBeGreaterThan(1);
  });

  it("does not repeat the same multiplication twice in a row", () => {
    const qs = generateSession({ pairs: TABLE_2, difficulty: "medium", count: 10, seed: 1 });
    for (let i = 1; i < qs.length; i++) {
      const prev = qs[i - 1]!;
      const cur = qs[i]!;
      const samePair = prev.a === cur.a && prev.b === cur.b;
      expect(samePair).toBe(false);
    }
  });
});

describe("generateSession determinism", () => {
  it("is deterministic for the same seed", () => {
    const a = generateSession({ pairs: ALL, difficulty: "medium", count: 10, seed: 42 });
    const b = generateSession({ pairs: ALL, difficulty: "medium", count: 10, seed: 42 });
    expect(a).toEqual(b);
  });
});
