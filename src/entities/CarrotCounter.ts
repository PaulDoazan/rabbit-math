import { Container, Graphics } from "pixi.js";
import {
  COUNTER_FIRST_X,
  COUNTER_GAP,
  COUNTER_TILT_DEG,
  COUNTER_Y,
} from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface CarrotCounter {
  readonly view: Container;
  setRemaining(n: number): void;
  remaining(): number;
}

const drawIcon = (g: Graphics) => {
  g.poly([0, 16, -8, -10, 8, -10])
    .fill(COLORS.carrot)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
  g.poly([-4, -12, -6, -20, -2, -22, -1, -12])
    .fill(COLORS.carrotLeaf)
    .stroke({ width: STROKE.thin, color: COLORS.outline });
  g.poly([1, -12, 0, -20, 5, -20, 4, -12])
    .fill(COLORS.carrotLeaf)
    .stroke({ width: STROKE.thin, color: COLORS.outline });
};

const buildIcons = (total: number): Graphics[] => {
  const icons: Graphics[] = [];
  for (let i = 0; i < total; i++) {
    const g = new Graphics();
    drawIcon(g);
    g.position.set(COUNTER_FIRST_X + i * COUNTER_GAP, COUNTER_Y);
    g.rotation = (COUNTER_TILT_DEG * Math.PI) / 180;
    icons.push(g);
  }
  return icons;
};

export function createCarrotCounter(total: number): CarrotCounter {
  const view = new Container();
  const icons = buildIcons(total);
  for (const g of icons) view.addChild(g);
  let current = total;
  return {
    view,
    remaining: () => current,
    setRemaining: (n) => {
      current = Math.max(0, Math.min(total, n));
      icons.forEach((g, i) => {
        g.alpha = i < current ? 1 : 0;
      });
    },
  };
}
