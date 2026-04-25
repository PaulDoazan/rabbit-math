import { Container, Graphics } from "pixi.js";
import { TREE_PERCHES, GROUND_Y, TREE_TRUNK_X } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface Tree {
  readonly view: Container;
  getPerchPositions(): typeof TREE_PERCHES;
}

const drawTrunk = (g: Graphics) => {
  g.rect(TREE_TRUNK_X - 26, 195, 52, GROUND_Y - 195)
    .fill(COLORS.trunk)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawBranches = (g: Graphics) => {
  const branches: Array<[number, number, number, number]> = [
    [TREE_TRUNK_X - 26, 280, TREE_PERCHES[3].x, TREE_PERCHES[3].y + 20],
    [TREE_TRUNK_X - 26, 220, TREE_PERCHES[2].x, TREE_PERCHES[2].y + 20],
    [TREE_TRUNK_X + 26, 195, TREE_PERCHES[1].x, TREE_PERCHES[1].y + 20],
    [TREE_TRUNK_X, 195, TREE_PERCHES[0].x, TREE_PERCHES[0].y + 20],
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
