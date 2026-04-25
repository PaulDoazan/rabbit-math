import { describe, it, expect } from "vitest";
import { createRabbit } from "../../src/entities/Rabbit";

describe("Rabbit number", () => {
  it("setNumber stores the number returned by getNumber", () => {
    const r = createRabbit({ position: { x: 100, y: 100 } });
    r.setNumber(56);
    expect(r.getNumber()).toBe(56);
  });
});

describe("Rabbit fallen state", () => {
  it("starts not fallen", () => {
    const r = createRabbit({ position: { x: 0, y: 0 } });
    expect(r.isFallen()).toBe(false);
  });

  it("markFallen flips the flag", () => {
    const r = createRabbit({ position: { x: 0, y: 0 } });
    r.markFallen();
    expect(r.isFallen()).toBe(true);
  });
});

describe("Rabbit collision aabb", () => {
  it("returns a finite axis-aligned box around its position", () => {
    const r = createRabbit({ position: { x: 200, y: 100 } });
    const box = r.getCollisionAabb();
    expect(box.minX).toBeLessThan(box.maxX);
    expect(box.minY).toBeLessThan(box.maxY);
    expect(box.minX).toBeGreaterThan(150);
    expect(box.maxX).toBeLessThan(250);
  });
});
