import { Container, Graphics } from "pixi.js";
import { COLORS } from "../config/theme";
import { GRAVITY_Y } from "../config/physics";
import { TRAJECTORY_STEPS, TRAJECTORY_TIME_HORIZON } from "../config/dimensions";

export interface Vec {
  x: number;
  y: number;
}

export function computeTrajectoryPoints(
  start: Vec,
  velocity: Vec,
  gravity: number,
  steps: number,
  horizonSeconds: number,
): Vec[] {
  const out: Vec[] = [];
  const dt = horizonSeconds / steps;
  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    out.push({
      x: start.x + velocity.x * t,
      y: start.y + velocity.y * t + 0.5 * gravity * t * t,
    });
  }
  return out;
}

export interface TrajectoryPreview {
  readonly view: Container;
  show(start: Vec, velocity: Vec): void;
  clear(): void;
}

const drawDots = (g: Graphics, points: readonly Vec[]): void => {
  g.clear();
  for (let i = 0; i < points.length; i += 4) {
    const p = points[i]!;
    g.circle(p.x, p.y, 1.7).fill(COLORS.outline);
  }
};

const renderShow = (g: Graphics) => (start: Vec, velocity: Vec) => {
  const pts = computeTrajectoryPoints(
    start,
    velocity,
    GRAVITY_Y * 1000,
    TRAJECTORY_STEPS,
    TRAJECTORY_TIME_HORIZON,
  );
  drawDots(g, pts);
};

export function createTrajectoryPreview(): TrajectoryPreview {
  const view = new Container();
  const g = new Graphics();
  view.addChild(g);
  return { view, show: renderShow(g), clear: () => g.clear() };
}
