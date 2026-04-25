import { Container, Graphics } from "pixi.js";
import { GEAR_POS, GEAR_RADIUS } from "../config/dimensions";
import { COLORS, STROKE } from "../config/theme";

export interface GearButton {
  readonly view: Container;
}

const TOOTH = { width: 10, height: 11, radius: 1.5 } as const;

const drawTeeth = (g: Graphics) => {
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const tx = Math.sin(angle) * (GEAR_RADIUS - 4);
    const ty = -Math.cos(angle) * (GEAR_RADIUS - 4);
    g.roundRect(
      tx - TOOTH.width / 2,
      ty - TOOTH.height / 2,
      TOOTH.width,
      TOOTH.height,
      TOOTH.radius,
    )
      .fill(COLORS.hudFill)
      .stroke({ width: STROKE.thick, color: COLORS.outline });
  }
};

const drawBodyAndHub = (g: Graphics) => {
  g.circle(0, 0, GEAR_RADIUS - 6)
    .fill(COLORS.hudFill)
    .stroke({ width: STROKE.thick, color: COLORS.outline });
  g.circle(0, 0, 6)
    .fill(COLORS.sky)
    .stroke({ width: STROKE.normal, color: COLORS.outline });
};

export function createGearButton(opts: { onTap: () => void }): GearButton {
  const view = new Container();
  view.position.set(GEAR_POS.x, GEAR_POS.y);
  view.eventMode = "static";
  view.cursor = "pointer";
  const g = new Graphics();
  drawTeeth(g);
  drawBodyAndHub(g);
  view.addChild(g);
  view.on("pointerup", opts.onTap);
  return { view };
}
