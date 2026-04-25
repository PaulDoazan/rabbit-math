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
