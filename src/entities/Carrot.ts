import Matter from "matter-js";
import { Container, Graphics } from "pixi.js";
import {
  CARROT_DENSITY,
  CARROT_FRICTION,
  CARROT_RADIUS,
  CARROT_RESTITUTION,
} from "../config/physics";
import { COLORS, STROKE } from "../config/theme";

export interface Vec {
  x: number;
  y: number;
}

export interface Carrot {
  readonly view: Container;
  readonly body: Matter.Body;
  isLaunched(): boolean;
  launch(velocity: Vec): void;
  restAtGround(at: Vec): void;
  syncView(): void;
}

interface State {
  view: Container;
  body: Matter.Body;
  launched: boolean;
}

const drawCarrot = (g: Graphics) => {
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

const makeBody = (at: Vec): Matter.Body => {
  // Create dynamic so mass is computed from density, then freeze.
  // Matter.js stores original mass for later setStatic(false) restore.
  const body = Matter.Bodies.circle(at.x, at.y, CARROT_RADIUS, {
    density: CARROT_DENSITY,
    friction: CARROT_FRICTION,
    restitution: CARROT_RESTITUTION,
    label: "carrot",
  });
  Matter.Body.setStatic(body, true);
  return body;
};

const buildApi = (state: State): Carrot => ({
  view: state.view,
  body: state.body,
  isLaunched: () => state.launched,
  launch: (v) => {
    state.launched = true;
    Matter.Body.setStatic(state.body, false);
    Matter.Body.setVelocity(state.body, v);
    Matter.Body.setAngularVelocity(state.body, 0.35);
  },
  restAtGround: (pos) => {
    Matter.Body.setVelocity(state.body, { x: 0, y: 0 });
    Matter.Body.setPosition(state.body, pos);
    Matter.Body.setStatic(state.body, true);
  },
  syncView: () => {
    state.view.position.set(state.body.position.x, state.body.position.y);
    state.view.rotation = state.body.angle;
  },
});

export function createCarrot(at: Vec): Carrot {
  const view = new Container();
  const g = new Graphics();
  drawCarrot(g);
  view.addChild(g);
  view.position.set(at.x, at.y);
  return buildApi({ view, body: makeBody(at), launched: false });
}
