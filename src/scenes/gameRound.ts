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
import { classifyHit } from "../systems/CollisionHandler";
import type { Session } from "../domain/Session";
import type { PhysicsWorld } from "../core/PhysicsWorld";
import type { Settings } from "../services/Settings";
import { playEndOfSession } from "./endOfSession";

export interface Vec { x: number; y: number }

export interface RoundFlowDeps {
  view: Container;
  physics: PhysicsWorld;
  slingshot: Slingshot;
  rabbits: Rabbit[];
  sign: MathSign;
  counter: CarrotCounter;
  session: Session;
  settings: Settings;
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
  rested: Carrot[];
  resolving: boolean;
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

const loadCarrot = (d: RoundFlowDeps): Carrot => {
  const c = createCarrot(d.slingshot.carrotPosition());
  d.physics.addBody(c.body);
  d.view.addChild(c.view);
  return c;
};

const within = (p: Vec, t: Vec): boolean => {
  const dx = p.x - t.x; const dy = p.y - t.y;
  return dx * dx + dy * dy <= HIT_RADIUS_SQ;
};

const offScreen = (p: Vec): boolean =>
  p.y >= GROUND_Y || p.x < 0 || p.x > DESIGN_WIDTH;

const aabbsOf = (rs: readonly Rabbit[]) =>
  rs.map((r) => r.isFallen() ? { minX: 0, maxX: 0, minY: 0, maxY: 0 } : r.getCollisionAabb());

const findHit = (d: RoundFlowDeps, p: Vec): number => {
  const c = classifyHit(p, aabbsOf(d.rabbits));
  return c.kind === "rabbit" ? c.index : -1;
};

const refresh = (d: RoundFlowDeps): void => {
  const q = d.session.currentQuestion();
  d.sign.setQuestion(q);
  d.rabbits.forEach((r, i) => r.setNumber(q.choices[i] ?? 0));
  d.counter.setRemaining(d.settings.carrotsPerRound);
};

const removeCarrot = (d: RoundFlowDeps, l: Live): void => {
  d.physics.removeBody(l.carrot.body);
  l.carrot.view.parent?.removeChild(l.carrot.view);
};

const reload = (d: RoundFlowDeps, l: Live): void => {
  removeCarrot(d, l);
  l.carrot = loadCarrot(d);
};

const restAt = (l: Live, p: Vec): void => {
  l.carrot.restAtGround({ x: p.x, y: GROUND_Y });
  l.carrot.syncView();
  l.rested.push(l.carrot);
};

const endSession = async (d: RoundFlowDeps): Promise<void> => {
  const s = d.session.snapshot();
  await playEndOfSession({
    fallenRabbits: d.rabbits.filter((r) => r.isFallen()),
    sign: d.sign, score: s.score, totalRounds: s.totalRounds, delay: d.delay,
  });
  d.onSessionEnd();
};

const advance = async (d: RoundFlowDeps, l: Live): Promise<void> => {
  await d.delay(ROUND_ADVANCE_MS);
  if (d.session.snapshot().phase !== "round_over") return;
  d.session.nextRound();
  if (d.session.isOver()) { await endSession(d); return; }
  refresh(d); reload(d, l); l.resolving = false;
};

const continueOrEnd = (d: RoundFlowDeps, l: Live): void => {
  d.counter.setRemaining(d.session.snapshot().carrotsLeft);
  if (d.session.snapshot().phase === "aiming") {
    l.carrot = loadCarrot(d); l.resolving = false; return;
  }
  void advance(d, l);
};

const onCorrect = (d: RoundFlowDeps, l: Live, idx: number): void => {
  const r = d.rabbits[idx]!;
  d.session.startResolving(); d.session.recordHit();
  void r.playBitePartialAndFall(GROUND_Y - 30);
  r.markFallen();
  removeCarrot(d, l);
  void advance(d, l);
};

const onWrong = (d: RoundFlowDeps, l: Live, idx: number, p: Vec): void => {
  void d.rabbits[idx]!.playShakeNo();
  d.session.startResolving(); d.session.recordMiss();
  restAt(l, p);
  continueOrEnd(d, l);
};

const onMiss = (d: RoundFlowDeps, l: Live, p: Vec): void => {
  d.session.startResolving(); d.session.recordMiss();
  restAt(l, p);
  continueOrEnd(d, l);
};

const resolveRabbit = (d: RoundFlowDeps, l: Live, idx: number, p: Vec): void => {
  l.resolving = true;
  const ok = d.rabbits[idx]!.getNumber() === d.session.currentQuestion().answer;
  if (ok) onCorrect(d, l, idx); else onWrong(d, l, idx, p);
};

const checkCollision = (d: RoundFlowDeps, l: Live): void => {
  const p = { x: l.carrot.body.position.x, y: l.carrot.body.position.y };
  const idx = findHit(d, p);
  if (idx >= 0) { resolveRabbit(d, l, idx, p); return; }
  if (offScreen(p)) { l.resolving = true; onMiss(d, l, p); }
};

const tickFlow = (d: RoundFlowDeps, l: Live) => (): void => {
  if (!l.carrot.isLaunched()) return;
  l.carrot.syncView();
  if (l.resolving) return;
  checkCollision(d, l);
};

const aimCb = (d: RoundFlowDeps, l: Live) => (): void => {
  if (d.session.snapshot().phase !== "aiming") return;
  const s = d.slingshot.carrotPosition();
  setBodyAt(l.carrot, s);
  l.preview.show(s, d.slingshot.releaseVelocity());
};

const releaseCb = (d: RoundFlowDeps, l: Live) => (v: Vec): void => {
  l.preview.clear();
  if (d.session.snapshot().phase !== "aiming") return;
  l.carrot.launch(v);
};

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
  d.view.on("pointerdown", down).on("pointermove", move);
  d.view.on("pointerup", up).on("pointerupoutside", up);
  return () => {
    d.view.off("pointerdown", down).off("pointermove", move);
    d.view.off("pointerup", up).off("pointerupoutside", up);
  };
};

const buildLive = (d: RoundFlowDeps): Live => {
  const preview = createTrajectoryPreview();
  d.view.addChild(preview.view);
  const live: Live = {
    carrot: loadCarrot(d), preview,
    input: undefined as unknown as SlingshotInput,
    rested: [], resolving: false,
  };
  live.input = createSlingshotInput({
    slingshot: d.slingshot, onAim: aimCb(d, live), onRelease: releaseCb(d, live),
  });
  return live;
};

export function installRoundFlow(deps: RoundFlowDeps): RoundFlow {
  setupView(deps.view);
  const live = buildLive(deps);
  const detach = wireEvents(deps, live);
  return {
    tick: tickFlow(deps, live),
    forceCorrectHit: () => { deps.session.startResolving(); deps.session.recordHit(); },
    forceWrongHit: () => { deps.session.startResolving(); deps.session.recordMiss(); },
    destroy: () => detach(),
  };
}
