import { Container, Graphics } from "pixi.js";
import { SLINGSHOT_ANCHOR, GROUND_Y } from "../config/dimensions";
import { SLINGSHOT_MAX_PULL, SLINGSHOT_POWER } from "../config/physics";
import { COLORS, STROKE } from "../config/theme";

export interface Vec {
  x: number;
  y: number;
}

export interface Slingshot {
  readonly view: Container;
  anchor(): Vec;
  carrotPosition(): Vec;
  aimAt(point: Vec): void;
  releaseVelocity(): Vec;
  reset(): void;
}

const drawFrame = (g: Graphics) => {
  const ax = SLINGSHOT_ANCHOR.x;
  const ay = SLINGSHOT_ANCHOR.y;
  g.moveTo(ax - 6, GROUND_Y)
    .lineTo(ax - 6, ay)
    .moveTo(ax + 6, GROUND_Y)
    .lineTo(ax + 6, ay)
    .stroke({ width: 10, color: COLORS.trunk, cap: "round" });
  g.moveTo(ax - 22, ay - 5)
    .quadraticCurveTo(ax - 6, ay - 24, ax, ay - 10)
    .quadraticCurveTo(ax + 6, ay - 24, ax + 22, ay - 5)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
};

const clampMagnitude = (dx: number, dy: number, max: number): Vec => {
  const m = Math.hypot(dx, dy);
  if (m <= max) return { x: dx, y: dy };
  return { x: (dx / m) * max, y: (dy / m) * max };
};

interface State {
  view: Container;
  pos: Vec;
}

const buildApi = (state: State): Slingshot => ({
  view: state.view,
  anchor: () => SLINGSHOT_ANCHOR,
  carrotPosition: () => state.pos,
  aimAt: (point) => {
    const c = clampMagnitude(
      point.x - SLINGSHOT_ANCHOR.x,
      point.y - SLINGSHOT_ANCHOR.y,
      SLINGSHOT_MAX_PULL,
    );
    state.pos = { x: SLINGSHOT_ANCHOR.x + c.x, y: SLINGSHOT_ANCHOR.y + c.y };
  },
  releaseVelocity: () => ({
    x: (SLINGSHOT_ANCHOR.x - state.pos.x) * SLINGSHOT_POWER,
    y: (SLINGSHOT_ANCHOR.y - state.pos.y) * SLINGSHOT_POWER,
  }),
  reset: () => {
    state.pos = { ...SLINGSHOT_ANCHOR };
  },
});

export function createSlingshot(): Slingshot {
  const view = new Container();
  const frame = new Graphics();
  drawFrame(frame);
  view.addChild(frame);
  return buildApi({ view, pos: { ...SLINGSHOT_ANCHOR } });
}
