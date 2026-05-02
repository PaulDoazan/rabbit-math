import type { RabbitsCount } from "../services/Settings";

export const DESIGN_WIDTH = 844;
export const DESIGN_HEIGHT = 390;
export const GROUND_Y = 330;

export const SLINGSHOT_ANCHOR = { x: 122, y: 270 } as const;
export const SLINGSHOT_BASE_Y = GROUND_Y;

export const TREE_TRUNK_X = 660;

export type Perch = { readonly x: number; readonly y: number };

export const TREE_PERCHES_BY_COUNT: Record<RabbitsCount, ReadonlyArray<Perch>> = {
  4: [
    { x: 605, y: 110 },
    { x: 770, y: 175 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  5: [
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  6: [
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 665, y: 240 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  7: [
    { x: 425, y: 130 },
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 665, y: 240 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
  8: [
    { x: 425, y: 130 },
    { x: 605, y: 110 },
    { x: 720, y: 130 },
    { x: 770, y: 175 },
    { x: 665, y: 240 },
    { x: 770, y: 260 },
    { x: 470, y: 220 },
    { x: 510, y: 290 },
  ],
};

export const GEAR_POS = { x: 50, y: 44 } as const;
export const GEAR_RADIUS = 22;
export const FULLSCREEN_BTN_POS = { x: 50, y: 100 } as const;
export const FULLSCREEN_BTN_RADIUS = 22;
export const MATH_SIGN = {
  x: DESIGN_WIDTH / 2,
  y: 38,
  defaultWidth: 180,
  expandedWidth: 320,
  height: 56,
} as const;

export const COUNTER_FIRST_X = 200;
export const COUNTER_GAP = 48;
export const COUNTER_Y = GROUND_Y + 8;
export const COUNTER_TILT_DEG = 40;

export const TRAJECTORY_STEPS = 60;
export const TRAJECTORY_TIME_HORIZON = 1.6;
