import { Container, Graphics } from "pixi.js";
import { TREE_PERCHES_BY_COUNT, GROUND_Y, TREE_TRUNK_X, type Perch } from "../config/dimensions";
import { COLORS } from "../config/theme";
const TREE_PERCHES: ReadonlyArray<Perch> = TREE_PERCHES_BY_COUNT[4];

export interface Tree {
  readonly view: Container;
}

const TRUNK_TOP_Y = 195;
const TRUNK_BASE_HALF = 28;
const TRUNK_TOP_HALF = 22;
const OUTLINE_PAD = 2.5;

interface Pt { x: number; y: number }

const trunkPoly = (pad: number): number[] => {
  const baseY = GROUND_Y;
  const topY = TRUNK_TOP_Y - pad;
  const bL = TRUNK_TOP_HALF + pad;
  const bR = TRUNK_BASE_HALF + pad;
  return [
    TREE_TRUNK_X - bR, baseY,
    TREE_TRUNK_X - bL, topY,
    TREE_TRUNK_X + bL, topY,
    TREE_TRUNK_X + bR, baseY,
  ];
};

const drawTrunk = (g: Graphics): void => {
  g.poly(trunkPoly(OUTLINE_PAD)).fill(COLORS.outline);
  g.poly(trunkPoly(0)).fill(COLORS.trunk);
};

const drawBark = (g: Graphics): void => {
  g.moveTo(TREE_TRUNK_X - 12, 240)
    .quadraticCurveTo(TREE_TRUNK_X - 8, 270, TREE_TRUNK_X - 14, 300)
    .stroke({ width: 2, color: COLORS.trunkShadow });
  g.moveTo(TREE_TRUNK_X + 10, 220)
    .quadraticCurveTo(TREE_TRUNK_X + 14, 260, TREE_TRUNK_X + 7, 305)
    .stroke({ width: 2, color: COLORS.trunkShadow });
};

const branchEnds: Array<{ from: Pt; to: Pt; baseW: number; tipW: number }> = [
  { from: { x: TREE_TRUNK_X - 24, y: 280 }, to: { x: TREE_PERCHES[3]!.x, y: TREE_PERCHES[3]!.y + 20 }, baseW: 13, tipW: 6 },
  { from: { x: TREE_TRUNK_X - 22, y: 220 }, to: { x: TREE_PERCHES[2]!.x, y: TREE_PERCHES[2]!.y + 18 }, baseW: 13, tipW: 6 },
  { from: { x: TREE_TRUNK_X + 22, y: 200 }, to: { x: TREE_PERCHES[1]!.x, y: TREE_PERCHES[1]!.y + 18 }, baseW: 12, tipW: 5 },
  { from: { x: TREE_TRUNK_X, y: TRUNK_TOP_Y }, to: { x: TREE_PERCHES[0]!.x, y: TREE_PERCHES[0]!.y + 18 }, baseW: 11, tipW: 5 },
];

const branchQuad = (b: { from: Pt; to: Pt; baseW: number; tipW: number }, pad: number): number[] => {
  const dx = b.to.x - b.from.x; const dy = b.to.y - b.from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; const ny = dx / len;
  const bw = b.baseW + pad; const tw = b.tipW + pad;
  return [
    b.from.x + nx * bw, b.from.y + ny * bw,
    b.from.x - nx * bw, b.from.y - ny * bw,
    b.to.x - nx * tw, b.to.y - ny * tw,
    b.to.x + nx * tw, b.to.y + ny * tw,
  ];
};

const drawBranches = (g: Graphics): void => {
  for (const b of branchEnds) g.poly(branchQuad(b, OUTLINE_PAD)).fill(COLORS.outline);
  for (const b of branchEnds) g.poly(branchQuad(b, 0)).fill(COLORS.trunk);
};

const foliage: Array<[number, number, number]> = [
  [TREE_PERCHES[0]!.x - 15, 60, 58],
  [TREE_PERCHES[0]!.x + 70, 35, 50],
  [TREE_PERCHES[0]!.x - 85, 55, 48],
  [TREE_PERCHES[0]!.x + 25, 110, 50],
  [TREE_PERCHES[0]!.x - 55, 130, 46],
  [TREE_PERCHES[1]!.x - 35, 105, 50],
  [TREE_PERCHES[1]!.x + 30, 175, 46],
  [TREE_PERCHES[2]!.x - 20, 178, 44],
  [TREE_PERCHES[3]!.x - 30, 240, 42],
  [TREE_PERCHES[3]!.x + 32, 250, 38],
];

const drawFoliageOutline = (g: Graphics): void => {
  for (const [x, y, r] of foliage) g.circle(x, y, r + OUTLINE_PAD).fill(COLORS.outline);
};

const drawFoliageFill = (g: Graphics): void => {
  for (const [x, y, r] of foliage) g.circle(x, y, r).fill(COLORS.foliage);
};

const drawFoliageHighlights = (g: Graphics): void => {
  for (const [x, y, r] of foliage) {
    g.ellipse(x - r * 0.45, y - r * 0.45, r * 0.28, r * 0.18)
      .fill(COLORS.foliageHighlight);
  }
};

export function createTree(): Tree {
  const view = new Container();
  const g = new Graphics();
  drawTrunk(g);
  drawBark(g);
  drawBranches(g);
  drawFoliageOutline(g);
  drawFoliageFill(g);
  drawFoliageHighlights(g);
  view.addChild(g);
  return { view };
}
