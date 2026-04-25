import { describe, it, expect } from "vitest";
import { computeTrajectoryPoints } from "../../src/systems/TrajectoryPreview";

describe("computeTrajectoryPoints start", () => {
  it("starts at the launch position", () => {
    const pts = computeTrajectoryPoints({ x: 100, y: 200 }, { x: 6, y: -10 }, 1.4, 60, 1.6);
    expect(pts[0]).toEqual({ x: 100, y: 200 });
  });
});

describe("computeTrajectoryPoints shape", () => {
  it("follows a parabola: y first decreases (rises) then increases (falls)", () => {
    const pts = computeTrajectoryPoints({ x: 0, y: 200 }, { x: 4, y: -12 }, 140, 60, 1.6);
    const ys = pts.map((p) => p.y);
    const minY = Math.min(...ys);
    const minIdx = ys.indexOf(minY);
    expect(minIdx).toBeGreaterThan(0);
    expect(minIdx).toBeLessThan(ys.length - 1);
  });
});

describe("computeTrajectoryPoints count", () => {
  it("returns the requested number of steps", () => {
    const pts = computeTrajectoryPoints({ x: 0, y: 0 }, { x: 1, y: -1 }, 1.4, 30, 1.0);
    expect(pts).toHaveLength(30);
  });
});
