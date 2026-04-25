import type { Carrot } from "../entities/Carrot";
import type { PhysicsWorld } from "../core/PhysicsWorld";
import { tweenObject } from "../entities/animations/Tween";

export interface CleanupDeps {
  physics: PhysicsWorld;
  delay: (ms: number) => Promise<void>;
}

export async function fadeOutAndRemove(d: CleanupDeps, c: Carrot): Promise<void> {
  await d.delay(1000);
  await tweenObject(c.view, { alpha: 0 }, 400);
  d.physics.removeBody(c.body);
  c.view.parent?.removeChild(c.view);
}

export function purgeCarrotBodies(physics: PhysicsWorld): void {
  physics.engine.world.bodies
    .filter((b) => b.label === "carrot")
    .forEach((b) => physics.removeBody(b));
}
