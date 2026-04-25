import { describe, it, expect } from "vitest";
import { TABLE_LISTS, getTableList, type TableListId } from "../../src/domain/tables";

describe("TABLE_LISTS shape", () => {
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
});

describe("table_2", () => {
  it("contains 2x1..2x10", () => {
    const list = getTableList("table_2");
    expect(list.pairs).toHaveLength(10);
    expect(list.pairs[0]).toEqual({ a: 2, b: 1 });
    expect(list.pairs[9]).toEqual({ a: 2, b: 10 });
  });
});

describe("squares", () => {
  it("contains n*n for n in 2..10", () => {
    const list = getTableList("squares");
    expect(list.pairs).toEqual([
      { a: 2, b: 2 }, { a: 3, b: 3 }, { a: 4, b: 4 }, { a: 5, b: 5 },
      { a: 6, b: 6 }, { a: 7, b: 7 }, { a: 8, b: 8 }, { a: 9, b: 9 },
      { a: 10, b: 10 },
    ]);
  });
});

describe("tables_all", () => {
  it("has 9*10 = 90 pairs", () => {
    const list = getTableList("tables_all");
    expect(list.pairs).toHaveLength(90);
  });
});

describe("getTableList", () => {
  it("throws on unknown id", () => {
    expect(() => getTableList("nope" as TableListId)).toThrow();
  });
});
