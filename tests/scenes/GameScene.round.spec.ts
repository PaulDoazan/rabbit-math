import { describe, it, expect } from "vitest";
import { createGameScene } from "../../src/scenes/GameScene";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";
import { createPhysicsWorld } from "../../src/core/PhysicsWorld";

describe("GameScene round flow — score", () => {
  it("forceCorrectHit advances score by 1", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({
      settings: { ...DEFAULT_SETTINGS, roundsPerSession: 3 },
      physics,
      onOpenSettings: () => {},
      onSessionRestart: () => {}, onToggleFullscreen: () => {},
    });
    const before = scene.session().snapshot().score;
    scene.forceCorrectHit();
    expect(scene.session().snapshot().score).toBe(before + 1);
    physics.destroy();
  });
});

describe("GameScene round flow — round end after misses", () => {
  it("after carrotsPerRound wrong hits, the round is over with no score", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({
      settings: { ...DEFAULT_SETTINGS, carrotsPerRound: 3, roundsPerSession: 3 },
      physics,
      onOpenSettings: () => {},
      onSessionRestart: () => {}, onToggleFullscreen: () => {},
    });
    scene.forceWrongHit();
    scene.forceWrongHit();
    scene.forceWrongHit();
    expect(scene.session().snapshot().score).toBe(0);
    expect(scene.session().snapshot().phase).toBe("round_over");
    physics.destroy();
  });
});

describe("GameScene round flow — single carrot round", () => {
  it("a single miss with carrotsPerRound=1 ends the round", () => {
    const physics = createPhysicsWorld();
    const scene = createGameScene({
      settings: { ...DEFAULT_SETTINGS, carrotsPerRound: 1, roundsPerSession: 3 },
      physics,
      onOpenSettings: () => {},
      onSessionRestart: () => {}, onToggleFullscreen: () => {},
    });
    scene.forceWrongHit();
    expect(scene.session().snapshot().phase).toBe("round_over");
    expect(scene.session().snapshot().score).toBe(0);
    physics.destroy();
  });
});
