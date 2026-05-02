import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import { Tween } from "@tweenjs/tween.js";
import { tweenGroup, tweenObject } from "./animations/Tween";
import { GROUND_Y } from "../config/dimensions";

export interface Vec {
  x: number;
  y: number;
}

const CARROT_URL = `${import.meta.env.BASE_URL}assets/carot.png`;
const SOURCE_WIDTH = 248;
const HALF_HEIGHT = 315;
const SPRITE_WIDTH = 18;
const SPRITE_HEIGHT = (SPRITE_WIDTH * HALF_HEIGHT) / SOURCE_WIDTH;

const FLIGHT_DURATION_MS = 600;
const FLIGHT_DISTANCE = 110;
const PEAK_LIFT = 70;
const REST_BEFORE_FADE_MS = 1500;
const FADE_DURATION_MS = 400;
const SPIN_TURNS = 2;

const buildHalfTexture = (): Texture => {
  const base = Texture.from(CARROT_URL);
  return new Texture({
    source: base.source,
    frame: new Rectangle(0, 0, SOURCE_WIDTH, HALF_HEIGHT),
  });
};

const buildSprite = (): Sprite => {
  const s = new Sprite(buildHalfTexture());
  s.anchor.set(0.5);
  s.width = SPRITE_WIDTH;
  s.height = SPRITE_HEIGHT;
  return s;
};

const flyParabolic = (sprite: Sprite, start: Vec, dirX: number): Promise<void> => {
  const endX = start.x + dirX * FLIGHT_DISTANCE;
  const endY = GROUND_Y - SPRITE_HEIGHT / 2;
  const peakY = start.y - PEAK_LIFT;
  const totalSpin = dirX * SPIN_TURNS * Math.PI * 2;
  return new Promise((resolve) => {
    new Tween({ t: 0 }, tweenGroup)
      .to({ t: 1 }, FLIGHT_DURATION_MS)
      .onUpdate((obj) => {
        const t = obj.t;
        const oneMinus = 1 - t;
        const x = start.x + (endX - start.x) * t;
        const y = oneMinus * oneMinus * start.y + 2 * oneMinus * t * peakY + t * t * endY;
        sprite.position.set(x, y);
        sprite.rotation = totalSpin * t;
      })
      .onComplete(() => resolve())
      .start();
  });
};

export async function spawnHalfCarrotEffect(
  parent: Container,
  mouth: Vec,
  impactVel: Vec,
  delay: (ms: number) => Promise<void>,
): Promise<void> {
  const sprite = buildSprite();
  sprite.position.set(mouth.x, mouth.y);
  parent.addChild(sprite);
  const dirX = impactVel.x > 0 ? -1 : 1;
  await flyParabolic(sprite, mouth, dirX);
  await delay(REST_BEFORE_FADE_MS);
  await tweenObject(sprite, { alpha: 0 }, FADE_DURATION_MS);
  sprite.parent?.removeChild(sprite);
}
