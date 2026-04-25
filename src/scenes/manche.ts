import { Container } from "pixi.js";
import { DESIGN_WIDTH, TREE_PERCHES } from "../config/dimensions";
import { createRabbit, type Rabbit } from "../entities/Rabbit";
import { tweenObject } from "../entities/animations/Tween";
import type { Question } from "../domain/Question";

export interface MancheTransitionDeps {
  view: Container;
  rabbits: Rabbit[];
}

const SLIDE_OFFSET = DESIGN_WIDTH + 100;
const SLIDE_IN_MS = 800;

export function assignNumbersForRound(rabbits: readonly Rabbit[], q: Question): void {
  const inPlay = rabbits.filter((r) => !r.isFallen());
  if (inPlay.length === 0) return;
  const distractors = q.choices.filter((c) => c !== q.answer);
  const answerSlot = Math.floor(Math.random() * inPlay.length);
  let d = 0;
  inPlay.forEach((r, i) => {
    r.setNumber(i === answerSlot ? q.answer : (distractors[d++] ?? q.answer));
  });
}

const dismissOldRabbits = async (rabbits: readonly Rabbit[]): Promise<void> => {
  const fallen = rabbits.filter((r) => r.isFallen());
  await Promise.all(fallen.map((r) => r.playHopInPlace()));
  await Promise.all(fallen.map((r) => r.playRunAwayRight(SLIDE_OFFSET)));
};

const removeRabbitViews = (rabbits: readonly Rabbit[]): void => {
  for (const r of rabbits) r.view.parent?.removeChild(r.view);
};

const spawnFreshRabbits = (view: Container): Rabbit[] =>
  TREE_PERCHES.map((p) => {
    const r = createRabbit({ position: { x: p.x + SLIDE_OFFSET, y: p.y } });
    r.view.position.set(p.x + SLIDE_OFFSET, p.y);
    view.addChild(r.view);
    return r;
  });

const slideRabbitsIn = async (rabbits: readonly Rabbit[]): Promise<void> => {
  await Promise.all(
    rabbits.map((r, i) => {
      const target = TREE_PERCHES[i]!.x;
      r.position.x = target;
      return tweenObject(r.view.position, { x: target }, SLIDE_IN_MS);
    }),
  );
};

export async function playMancheTransition(deps: MancheTransitionDeps): Promise<void> {
  await dismissOldRabbits(deps.rabbits);
  removeRabbitViews(deps.rabbits);
  const fresh = spawnFreshRabbits(deps.view);
  deps.rabbits.length = 0;
  deps.rabbits.push(...fresh);
  await slideRabbitsIn(fresh);
}
