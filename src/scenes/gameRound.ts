import Matter from "matter-js";
import { Container, Rectangle, type FederatedPointerEvent } from "pixi.js";
import { DESIGN_HEIGHT, DESIGN_WIDTH, GROUND_Y } from "../config/dimensions";
import { createCarrot, type Carrot } from "../entities/Carrot";
import type { Rabbit } from "../entities/Rabbit";
import type { Slingshot } from "../entities/Slingshot";
import type { MathSign } from "../entities/MathSign";
import type { CarrotCounter } from "../entities/CarrotCounter";
import { createSlingshotInput, type SlingshotInput } from "../systems/SlingshotInput";
import { createTrajectoryPreview, type TrajectoryPreview } from "../systems/TrajectoryPreview";
import { makeOnAim, makeOnRelease } from "./gameRoundAim";
import { processCarrotImpact, type ResolveCtx } from "./gameRoundResolve";
import type { Session } from "../domain/Session";
import type { PhysicsWorld } from "../core/PhysicsWorld";
import type { Perch } from "../config/dimensions";
import { CARROTS_PER_ROUND } from "../domain/sessionConfig";
import { playEndOfSession } from "./endOfSession";
import { fadeOutAndRemove, purgeOwnedBodies } from "./gameRoundCleanup";
import { assignNumbersForRound, playMancheTransition } from "./manche";

export interface Vec { x: number; y: number }

export interface RoundFlowDeps {
  view: Container;
  physics: PhysicsWorld;
  slingshot: Slingshot;
  rabbits: Rabbit[];
  sign: MathSign;
  counter: CarrotCounter;
  session: Session;
  perches: ReadonlyArray<Perch>;
  delay: (ms: number) => Promise<void>;
  onSessionEnd(): void;
}

export interface RoundFlow {
  tick(deltaMs: number): void;
  forceCorrectHit(): void;
  forceWrongHit(rabbitIndex?: number): void;
  destroy(): void;
}

interface Live {
  carrot: Carrot;
  preview: TrajectoryPreview;
  input: SlingshotInput;
  resolving: boolean;
  destroyed: boolean;
  owned: Set<Matter.Body>;
}

const ROUND_ADVANCE_MS = 1200;
const HIT_RADIUS_SQ = 30 * 30;

const setupView = (v: Container): void => {
  v.eventMode = "static";
  v.hitArea = new Rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
};

const setBodyAt = (c: Carrot, p: Vec): void => {
  Matter.Body.setPosition(c.body, p);
  c.view.position.set(p.x, p.y);
};

const loadCarrot = (d: RoundFlowDeps, l: Live): Carrot => {
  const c = createCarrot(d.slingshot.carrotPosition());
  d.physics.addBody(c.body);
  l.owned.add(c.body);
  d.view.addChild(c.view);
  return c;
};

const within = (p: Vec, t: Vec): boolean => {
  const dx = p.x - t.x; const dy = p.y - t.y;
  return dx * dx + dy * dy <= HIT_RADIUS_SQ;
};

const refresh = (d: RoundFlowDeps): void => {
  const q = d.session.currentQuestion();
  d.sign.setQuestion(q); assignNumbersForRound(d.rabbits, q);
  d.counter.setRemaining(CARROTS_PER_ROUND - 1);
};

const removeCarrot = (d: RoundFlowDeps, l: Live): void => {
  d.physics.removeBody(l.carrot.body);
  l.owned.delete(l.carrot.body);
  l.carrot.view.parent?.removeChild(l.carrot.view);
};

const reload = (d: RoundFlowDeps, l: Live): void => { removeCarrot(d, l); l.carrot = loadCarrot(d, l); };

const restAt = (d: RoundFlowDeps, l: Live, p: Vec): void => {
  l.carrot.restAtGround({ x: p.x, y: GROUND_Y });
  l.carrot.syncView();
  void fadeOutAndRemove({ physics: d.physics, delay: d.delay, owned: l.owned }, l.carrot);
};

const endSession = async (d: RoundFlowDeps, l: Live): Promise<void> => {
  const s = d.session.snapshot();
  await playEndOfSession({
    fallenRabbits: d.rabbits.filter((r) => r.isFallen()),
    sign: d.sign, score: s.score, totalRounds: s.totalRounds, delay: d.delay,
  });
  if (!l.destroyed) d.onSessionEnd();
};

const advance = async (d: RoundFlowDeps, l: Live): Promise<void> => {
  await d.delay(ROUND_ADVANCE_MS);
  if (l.destroyed || d.session.snapshot().phase !== "round_over") return;
  d.session.nextRound();
  if (l.destroyed) return;
  if (d.session.isOver()) return void endSession(d, l);
  if (d.rabbits.every((r) => r.isFallen())) await playMancheTransition({ view: d.view, rabbits: d.rabbits, perches: d.perches });
  if (l.destroyed) return;
  refresh(d); reload(d, l); l.resolving = false;
};

const continueOrEnd = (d: RoundFlowDeps, l: Live): void => {
  d.counter.setRemaining(d.session.snapshot().carrotsLeft - 1);
  if (d.session.snapshot().phase === "aiming") {
    l.carrot = loadCarrot(d, l); l.resolving = false; return;
  }
  void advance(d, l);
};

const resolveCtx = (d: RoundFlowDeps, l: Live): ResolveCtx => ({
  rabbits: d.rabbits, view: d.view, session: d.session, delay: d.delay,
  carrot: () => l.carrot,
  removeCarrot: () => removeCarrot(d, l),
  restCarrotAt: (p) => restAt(d, l, p),
  advance: () => void advance(d, l),
  continueOrEnd: () => continueOrEnd(d, l),
  setResolving: (r) => { l.resolving = r; },
});

const tickFlow = (d: RoundFlowDeps, l: Live) => (): void => {
  if (l.destroyed || !l.carrot.isLaunched()) return;
  l.carrot.syncView();
  if (l.resolving) return;
  processCarrotImpact(resolveCtx(d, l));
};

const aimContext = (d: RoundFlowDeps, l: Live) => ({
  rabbits: d.rabbits,
  slingshot: d.slingshot,
  preview: l.preview,
  carrotBodyPos: () => ({ x: l.carrot.body.position.x, y: l.carrot.body.position.y }),
  setCarrotPos: (p: Vec) => setBodyAt(l.carrot, p),
  delay: d.delay,
  isAiming: () => d.session.snapshot().phase === "aiming",
  isDestroyed: () => l.destroyed,
  onLaunch: (v: Vec) => l.carrot.launch(v),
});

const downCb = (d: RoundFlowDeps, l: Live) => (e: FederatedPointerEvent): void => {
  if (d.session.snapshot().phase !== "aiming") return;
  const p = { x: e.global.x, y: e.global.y };
  if (!within(p, d.slingshot.carrotPosition())) return;
  l.input.handlePointerDown(p);
};

const wireEvents = (d: RoundFlowDeps, l: Live): (() => void) => {
  const down = downCb(d, l);
  const move = (e: FederatedPointerEvent): void =>
    l.input.handlePointerMove({ x: e.global.x, y: e.global.y });
  const up = (): void => l.input.handlePointerUp();
  d.view.on("pointerdown", down).on("pointermove", move).on("pointerup", up).on("pointerupoutside", up);
  return () => d.view.off("pointerdown", down).off("pointermove", move).off("pointerup", up).off("pointerupoutside", up);
};

const buildLive = (d: RoundFlowDeps): Live => {
  const preview = createTrajectoryPreview();
  d.view.addChild(preview.view);
  const live = { carrot: undefined, preview, input: undefined, resolving: false, destroyed: false, owned: new Set() } as unknown as Live;
  live.carrot = loadCarrot(d, live);
  const ctx = aimContext(d, live);
  live.input = createSlingshotInput({ slingshot: d.slingshot, onAim: makeOnAim(ctx), onRelease: makeOnRelease(ctx) });
  return live;
};

const teardown = (d: RoundFlowDeps, l: Live, detach: () => void): void => {
  l.destroyed = true; detach(); purgeOwnedBodies(d.physics, l.owned);
};

export function installRoundFlow(deps: RoundFlowDeps): RoundFlow {
  setupView(deps.view);
  const live = buildLive(deps);
  const detach = wireEvents(deps, live);
  return {
    tick: tickFlow(deps, live),
    forceCorrectHit: () => { deps.session.startResolving(); deps.session.recordHit(); },
    forceWrongHit: () => { deps.session.startResolving(); deps.session.recordMiss(); },
    destroy: () => teardown(deps, live, detach),
  };
}
