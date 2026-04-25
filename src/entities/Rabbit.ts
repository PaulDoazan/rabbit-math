import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, STROKE } from "../config/theme";
import { tweenObject } from "./animations/Tween";

export interface Aabb {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
export interface Vec {
  x: number;
  y: number;
}

export interface Rabbit {
  readonly view: Container;
  setNumber(n: number): void;
  getNumber(): number;
  isFallen(): boolean;
  markFallen(): void;
  getCollisionAabb(): Aabb;
  position: Vec;
  playShakeNo(): Promise<void>;
  playBitePartialAndFall(landingY: number): Promise<void>;
  playHopInPlace(): Promise<void>;
  playRunAwayRight(offscreenX: number): Promise<void>;
}

const drawEars = (g: Graphics): void => {
  // Two long ears with their base touching the top of the head.
  g.ellipse(-10, -28, 5, 16)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
  g.ellipse(10, -28, 5, 16)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
  g.ellipse(-10, -28, 2, 11).fill(COLORS.rabbitInnerEar);
  g.ellipse(10, -28, 2, 11).fill(COLORS.rabbitInnerEar);
};

const drawBody = (g: Graphics): void => {
  g.ellipse(0, 0, 22, 20)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
};

const drawEyes = (g: Graphics): void => {
  g.circle(-7, -6, 2).fill(COLORS.outline);
  g.circle(7, -6, 2).fill(COLORS.outline);
};

const drawMouth = (g: Graphics): void => {
  // Inverted Y (180°): two top branches converge at junction, stem extends down.
  g.moveTo(-3, -1)
    .lineTo(0, 2)
    .moveTo(3, -1)
    .lineTo(0, 2)
    .moveTo(0, 2)
    .lineTo(0, 5)
    .stroke({ width: STROKE.thin, color: COLORS.outline, cap: "round" });
};

const drawSign = (g: Graphics): void => {
  g.roundRect(-20, 8, 40, 24, 4)
    .fill(COLORS.signFill)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
};

const drawPaws = (g: Graphics): void => {
  // Two paws above the sign (top edge ~y=8) and two below (bottom edge ~y=32).
  g.ellipse(-14, 6, 4, 3)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thin, color: COLORS.outline });
  g.ellipse(14, 6, 4, 3)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thin, color: COLORS.outline });
  g.ellipse(-14, 34, 4, 3)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thin, color: COLORS.outline });
  g.ellipse(14, 34, 4, 3)
    .fill(COLORS.rabbitBody)
    .stroke({ width: STROKE.thin, color: COLORS.outline });
};

const TEXT_STYLE = new TextStyle({
  fontFamily: "ui-rounded, system-ui",
  fontWeight: "800",
  fontSize: 14,
  fill: COLORS.outline,
  align: "center",
});

interface State {
  number: number;
  fallen: boolean;
  position: Vec;
  view: Container;
  text: Text;
}

const buildView = (pos: Vec): { view: Container; text: Text } => {
  const view = new Container();
  view.position.set(pos.x, pos.y);
  const g = new Graphics();
  drawEars(g);
  drawBody(g);
  drawEyes(g);
  drawMouth(g);
  drawSign(g);
  drawPaws(g);
  view.addChild(g);
  const text = new Text({ text: "", style: TEXT_STYLE });
  text.anchor.set(0.5);
  text.position.set(0, 20);
  view.addChild(text);
  return { view, text };
};

const aabbAt = (pos: Vec): Aabb => ({
  minX: pos.x - 30,
  maxX: pos.x + 30,
  minY: pos.y - 60,
  maxY: pos.y + 30,
});

const animateShakeNo = async (view: Container, originalX: number): Promise<void> => {
  for (let i = 0; i < 4; i++) {
    await tweenObject(view.position, { x: originalX + 6 }, 60);
    await tweenObject(view.position, { x: originalX - 6 }, 60);
  }
  view.position.x = originalX;
};

const animateBiteAndFall = async (state: State, landingY: number): Promise<void> => {
  state.fallen = true;
  await tweenObject(state.view.scale, { x: 1.05, y: 0.95 }, 80);
  await tweenObject(state.view.scale, { x: 1, y: 1 }, 80);
  state.position.y = landingY;
  await tweenObject(state.view.position, { y: landingY }, 350);
};

const animateHopInPlace = async (state: State): Promise<void> => {
  const baseY = state.position.y;
  for (let i = 0; i < 3; i++) {
    await tweenObject(state.view.position, { y: baseY - 22 }, 180);
    await tweenObject(state.view.position, { y: baseY }, 160);
  }
};

const animateRunAwayRight = async (state: State, offscreenX: number): Promise<void> => {
  state.position.x = offscreenX;
  await tweenObject(state.view.position, { x: offscreenX }, 1000);
};

const buildApi = (state: State): Rabbit => ({
  view: state.view,
  position: state.position,
  setNumber: (n) => {
    state.number = n;
    state.text.text = String(n);
  },
  getNumber: () => state.number,
  isFallen: () => state.fallen,
  markFallen: () => {
    state.fallen = true;
  },
  getCollisionAabb: () => aabbAt(state.position),
  playShakeNo: () => animateShakeNo(state.view, state.position.x),
  playBitePartialAndFall: (y) => animateBiteAndFall(state, y),
  playHopInPlace: () => animateHopInPlace(state),
  playRunAwayRight: (x) => animateRunAwayRight(state, x),
});

export function createRabbit(opts: { position: Vec }): Rabbit {
  const { view, text } = buildView(opts.position);
  const state: State = {
    number: 0,
    fallen: false,
    position: { ...opts.position },
    view,
    text,
  };
  return buildApi(state);
}
