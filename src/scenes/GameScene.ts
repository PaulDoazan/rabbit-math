import { Container } from "pixi.js";
import { createBackground, type Background } from "../entities/Background";
import { createTree, type Tree } from "../entities/Tree";
import { createRabbit, type Rabbit } from "../entities/Rabbit";
import { createSlingshot, type Slingshot } from "../entities/Slingshot";
import { createMathSign, type MathSign } from "../entities/MathSign";
import { createCarrotCounter, type CarrotCounter } from "../entities/CarrotCounter";
import { createGearButton, type GearButton } from "../entities/GearButton";
import { TREE_PERCHES } from "../config/dimensions";
import type { Settings } from "../services/Settings";
import type { PhysicsWorld } from "../core/PhysicsWorld";
import type { Scene } from "../core/Scene";
import { generateSession } from "../domain/QuestionGenerator";
import { createSession, type Session } from "../domain/Session";
import { installRoundFlow, type RoundFlow } from "./gameRound";

export interface GameSceneDeps {
  settings: Settings;
  physics: PhysicsWorld;
  onOpenSettings(): void;
  onSessionRestart(): void;
  delay?: (ms: number) => Promise<void>;
}

export interface GameScene extends Scene {
  rabbits(): readonly Rabbit[];
  mathSign(): MathSign;
  session(): Session;
  forceCorrectHit(): void;
  forceWrongHit(rabbitIndex?: number): void;
}

interface Parts {
  view: Container;
  background: Background;
  tree: Tree;
  slingshot: Slingshot;
  sign: MathSign;
  counter: CarrotCounter;
  gear: GearButton;
  rabbits: Rabbit[];
  session: Session;
}

const newSession = (settings: Settings): Session => {
  const rounds = generateSession({
    tableListId: settings.tableListId,
    difficulty: settings.difficulty,
    count: settings.roundsPerSession,
    seed: Date.now(),
  });
  return createSession({ rounds, carrotsPerRound: settings.carrotsPerRound });
};

const buildRabbits = (choices: readonly number[]): Rabbit[] =>
  TREE_PERCHES.map((p, i) => {
    const r = createRabbit({ position: { x: p.x, y: p.y } });
    r.setNumber(choices[i] ?? 0);
    return r;
  });

const assembleScene = (deps: GameSceneDeps): Parts => {
  const view = new Container();
  const background = createBackground();
  const tree = createTree();
  const slingshot = createSlingshot();
  const sign = createMathSign();
  const counter = createCarrotCounter(deps.settings.carrotsPerRound);
  const gear = createGearButton({ onTap: deps.onOpenSettings });
  const session = newSession(deps.settings);
  const rabbits = buildRabbits(session.currentQuestion().choices);
  sign.setQuestion(session.currentQuestion());
  return { view, background, tree, slingshot, sign, counter, gear, rabbits, session };
};

const attachChildren = (parts: Parts): void => {
  parts.view.addChild(parts.background.view);
  parts.view.addChild(parts.tree.view);
  parts.view.addChild(parts.slingshot.view);
  parts.view.addChild(parts.sign.view);
  parts.view.addChild(parts.counter.view);
  parts.view.addChild(parts.gear.view);
  for (const r of parts.rabbits) parts.view.addChild(r.view);
};

const defaultDelay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const wireFlow = (deps: GameSceneDeps, parts: Parts): RoundFlow =>
  installRoundFlow({
    view: parts.view,
    physics: deps.physics,
    slingshot: parts.slingshot,
    rabbits: parts.rabbits,
    sign: parts.sign,
    counter: parts.counter,
    session: parts.session,
    settings: deps.settings,
    delay: deps.delay ?? defaultDelay,
    onSessionEnd: () => deps.onSessionRestart(),
  });

const buildSceneApi = (parts: Parts, flow: RoundFlow): GameScene => ({
  id: "game",
  view: parts.view,
  rabbits: () => parts.rabbits,
  mathSign: () => parts.sign,
  session: () => parts.session,
  forceCorrectHit: () => flow.forceCorrectHit(),
  forceWrongHit: (i?: number) => flow.forceWrongHit(i),
  onEnter: () => {},
  onExit: () => {},
  onTick: (dt) => flow.tick(dt),
  pause: () => {},
  resume: () => {},
  destroy: () => {
    flow.destroy();
    parts.view.destroy({ children: true });
  },
});

export function createGameScene(deps: GameSceneDeps): GameScene {
  const parts = assembleScene(deps);
  attachChildren(parts);
  const flow = wireFlow(deps, parts);
  return buildSceneApi(parts, flow);
}
