import type { Container } from "pixi.js";
import { DESIGN_WIDTH, GROUND_Y } from "../config/dimensions";
import { spawnHalfCarrotEffect } from "../entities/HalfCarrot";
import { classifyHit } from "../systems/CollisionHandler";
import type { Carrot } from "../entities/Carrot";
import type { Rabbit } from "../entities/Rabbit";
import type { Session } from "../domain/Session";

export interface Vec { x: number; y: number }

export interface ResolveCtx {
  rabbits: readonly Rabbit[];
  view: Container;
  carrot: () => Carrot;
  session: Session;
  delay: (ms: number) => Promise<void>;
  removeCarrot: () => void;
  restCarrotAt: (p: Vec) => void;
  advance: () => void;
  continueOrEnd: () => void;
  setResolving: (r: boolean) => void;
}

const aabbsOf = (rs: readonly Rabbit[]) =>
  rs.map((r) => r.isFallen() ? { minX: 0, maxX: 0, minY: 0, maxY: 0 } : r.getCollisionAabb());

const findHit = (rabbits: readonly Rabbit[], p: Vec): number => {
  const c = classifyHit(p, aabbsOf(rabbits));
  return c.kind === "rabbit" ? c.index : -1;
};

const isLost = (p: Vec, v: Vec): boolean =>
  p.x < 0 || p.x > DESIGN_WIDTH || (p.y >= GROUND_Y && v.y > 0);

const onCorrect = (ctx: ResolveCtx, idx: number): void => {
  const r = ctx.rabbits[idx]!;
  ctx.session.startResolving(); ctx.session.recordHit();
  const carrot = ctx.carrot();
  const impactVel = { x: carrot.body.velocity.x, y: carrot.body.velocity.y };
  const mouth = { x: r.position.x, y: r.position.y + 4 };
  void spawnHalfCarrotEffect(ctx.view, mouth, impactVel, ctx.delay);
  void r.playBitePartialAndFall(GROUND_Y - 30);
  r.markFallen();
  ctx.removeCarrot();
  ctx.advance();
};

const onWrong = (ctx: ResolveCtx, idx: number): void => {
  void ctx.rabbits[idx]!.playShakeNo();
  ctx.session.startResolving(); ctx.session.recordMiss();
  ctx.removeCarrot();
  ctx.continueOrEnd();
};

const onMiss = (ctx: ResolveCtx, p: Vec): void => {
  ctx.session.startResolving(); ctx.session.recordMiss();
  ctx.restCarrotAt(p);
  ctx.continueOrEnd();
};

const resolveRabbit = (ctx: ResolveCtx, idx: number): void => {
  ctx.setResolving(true);
  const ok = ctx.rabbits[idx]!.getNumber() === ctx.session.currentQuestion().answer;
  (ok ? onCorrect : onWrong)(ctx, idx);
};

export const processCarrotImpact = (ctx: ResolveCtx): void => {
  const b = ctx.carrot().body;
  const p = { x: b.position.x, y: b.position.y };
  const idx = findHit(ctx.rabbits, p);
  if (idx >= 0) return resolveRabbit(ctx, idx);
  if (isLost(p, b.velocity)) { ctx.setResolving(true); onMiss(ctx, p); }
};
