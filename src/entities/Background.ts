import { Container, Graphics } from "pixi.js";
import { DESIGN_WIDTH, DESIGN_HEIGHT, GROUND_Y } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface Background {
  readonly view: Container;
}

const drawSun = (g: Graphics): void => {
  const cx = DESIGN_WIDTH - 70;
  const cy = 60;
  g.circle(cx, cy, 30)
    .fill(COLORS.sun)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawCloud = (g: Graphics, cx: number, cy: number, scale: number): void => {
  const r = 18 * scale;
  g.circle(cx - r, cy, r)
    .circle(cx, cy - r * 0.6, r * 1.1)
    .circle(cx + r, cy, r)
    .circle(cx + r * 0.4, cy + r * 0.3, r * 0.9)
    .fill(COLORS.cloud)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawClouds = (g: Graphics): void => {
  drawCloud(g, 180, 70, 1.0);
  drawCloud(g, 480, 50, 0.85);
};

const drawHills = (g: Graphics): void => {
  const baseY = GROUND_Y;
  g.moveTo(0, baseY)
    .lineTo(0, 240)
    .quadraticCurveTo(110, 180, 230, 230)
    .quadraticCurveTo(360, 280, 500, 220)
    .quadraticCurveTo(640, 165, 760, 230)
    .quadraticCurveTo(810, 255, DESIGN_WIDTH, 215)
    .lineTo(DESIGN_WIDTH, baseY)
    .lineTo(0, baseY)
    .fill(COLORS.hills)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawBarn = (g: Graphics): void => {
  const x = 60;
  const baseY = GROUND_Y;
  // body
  g.rect(x, baseY - 38, 54, 38)
    .fill(0xc94a3a)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
  // roof
  g.moveTo(x - 6, baseY - 38)
    .lineTo(x + 27, baseY - 60)
    .lineTo(x + 60, baseY - 38)
    .lineTo(x - 6, baseY - 38)
    .fill(0x4a2a1c)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
  // door
  g.rect(x + 20, baseY - 22, 14, 22)
    .fill(0x4a2a1c)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
};

const drawGrass = (g: Graphics): void => {
  g.rect(0, GROUND_Y, DESIGN_WIDTH, DESIGN_HEIGHT - GROUND_Y)
    .fill(COLORS.grass);
  g.moveTo(0, GROUND_Y)
    .lineTo(DESIGN_WIDTH, GROUND_Y)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawTuft = (g: Graphics, x: number): void => {
  const y = GROUND_Y;
  g.moveTo(x - 6, y)
    .lineTo(x, y - 8)
    .lineTo(x + 6, y)
    .lineTo(x - 6, y)
    .fill(COLORS.hills)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
};

const drawTufts = (g: Graphics): void => {
  drawTuft(g, 260);
  drawTuft(g, 420);
  drawTuft(g, 580);
};

export function createBackground(): Background {
  const view = new Container();
  const g = new Graphics();
  drawSun(g);
  drawClouds(g);
  drawHills(g);
  drawBarn(g);
  drawGrass(g);
  drawTufts(g);
  view.addChild(g);
  return { view };
}
