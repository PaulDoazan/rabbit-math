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
  drawElasticTo(carrot: Vec): void;
  clearElastic(): void;
}

const PRONG_LEFT = { x: SLINGSHOT_ANCHOR.x - 22, y: SLINGSHOT_ANCHOR.y - 5 };
const PRONG_RIGHT = { x: SLINGSHOT_ANCHOR.x + 22, y: SLINGSHOT_ANCHOR.y - 5 };
const ELASTIC_COLOR = 0x222222;

const drawFrame = (g: Graphics): void => {
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

const drawElastic = (g: Graphics, carrot: Vec): void => {
  g.clear();
  g.moveTo(PRONG_LEFT.x, PRONG_LEFT.y)
    .lineTo(carrot.x, carrot.y)
    .stroke({ width: 3, color: ELASTIC_COLOR, cap: "round" });
  g.moveTo(PRONG_RIGHT.x, PRONG_RIGHT.y)
    .lineTo(carrot.x, carrot.y)
    .stroke({ width: 3, color: ELASTIC_COLOR, cap: "round" });
};

const clampMagnitude = (dx: number, dy: number, max: number): Vec => {
  const m = Math.hypot(dx, dy);
  if (m <= max) return { x: dx, y: dy };
  return { x: (dx / m) * max, y: (dy / m) * max };
};

interface State {
  view: Container;
  pos: Vec;
  elastic: Graphics;
}

const aimAt = (state: State, point: Vec): void => {
  const c = clampMagnitude(
    point.x - SLINGSHOT_ANCHOR.x,
    point.y - SLINGSHOT_ANCHOR.y,
    SLINGSHOT_MAX_PULL,
  );
  state.pos = { x: SLINGSHOT_ANCHOR.x + c.x, y: SLINGSHOT_ANCHOR.y + c.y };
};

const releaseVelocityOf = (state: State): Vec => ({
  x: (SLINGSHOT_ANCHOR.x - state.pos.x) * SLINGSHOT_POWER,
  y: (SLINGSHOT_ANCHOR.y - state.pos.y) * SLINGSHOT_POWER,
});

const buildApi = (state: State): Slingshot => ({
  view: state.view,
  anchor: () => SLINGSHOT_ANCHOR,
  carrotPosition: () => state.pos,
  aimAt: (point) => aimAt(state, point),
  releaseVelocity: () => releaseVelocityOf(state),
  reset: () => { state.pos = { ...SLINGSHOT_ANCHOR }; },
  drawElasticTo: (carrot) => drawElastic(state.elastic, carrot),
  clearElastic: () => state.elastic.clear(),
});

export function createSlingshot(): Slingshot {
  const view = new Container();
  const frame = new Graphics();
  drawFrame(frame);
  const elastic = new Graphics();
  view.addChild(frame, elastic);
  return buildApi({ view, pos: { ...SLINGSHOT_ANCHOR }, elastic });
}
