import { Container } from "pixi.js";
import type { Settings } from "../services/Settings";
import type { Scene } from "../core/Scene";
import type { Difficulty } from "../domain/DifficultyConfig";
import type { Pair } from "../domain/tables";
import {
  createPanelBackground,
  createPanelTitle,
  createCycleRow,
  createCloseButton,
  createConfirmPrompt,
  DIFFICULTIES,
  ROUNDS_OPTIONS,
  CARROTS_OPTIONS,
  cycle,
  sessionImpactingChanged,
  onOff,
  difficultyLabel,
} from "./SettingsPanel";

export interface SettingsSceneDeps {
  initial: Settings;
  onChange(next: Settings): void;
  onClose(next: Settings, restartRequested: boolean): void;
  onOpenCalcsPicker(currentSelection: Pair[]): Promise<Pair[]>;
}

export interface SettingsScene extends Scene {
  setSelectedPairs(pairs: Pair[]): void;
  setRoundsPerSession(n: number): void;
  setCarrotsPerRound(n: number): void;
  setDifficulty(d: Difficulty): void;
  setTapMode(on: boolean): void;
  setSoundEnabled(on: boolean): void;
  setMusicEnabled(on: boolean): void;
  confirmCloseWith(restart: boolean): void;
}

interface State {
  current: Settings;
}

const applyPatch = (
  state: State,
  deps: SettingsSceneDeps,
  patch: Partial<Settings>,
): void => {
  state.current = { ...state.current, ...patch };
  deps.onChange(state.current);
};

const buildSetters = (
  state: State,
  deps: SettingsSceneDeps,
): Omit<SettingsScene, keyof Scene> => ({
  setSelectedPairs: (pairs) => applyPatch(state, deps, { selectedPairs: pairs }),
  setRoundsPerSession: (n) => applyPatch(state, deps, { roundsPerSession: n }),
  setCarrotsPerRound: (n) => applyPatch(state, deps, { carrotsPerRound: n }),
  setDifficulty: (d) => applyPatch(state, deps, { difficulty: d }),
  setTapMode: (on) => applyPatch(state, deps, { tapMode: on }),
  setSoundEnabled: (on) => applyPatch(state, deps, { soundEnabled: on }),
  setMusicEnabled: (on) => applyPatch(state, deps, { musicEnabled: on }),
  confirmCloseWith: (restart) => deps.onClose(state.current, restart),
});

const buildSceneShell = (view: Container): Scene => ({
  id: "settings",
  view,
  onEnter: () => {},
  onExit: () => {},
  onTick: () => {},
  pause: () => {},
  resume: () => {},
  destroy: () => view.destroy({ children: true }),
});

interface RowCtx {
  view: Container;
  state: State;
  deps: SettingsSceneDeps;
  update: (patch: Partial<Settings>) => void;
}

const addCycleRow = <T>(
  ctx: RowCtx,
  index: number,
  label: string,
  options: { values: readonly T[]; get: () => T; render: (v: T) => string; apply: (v: T) => void },
): void => {
  const row = createCycleRow(label, index);
  row.setValue(options.render(options.get()));
  row.onTap(() => {
    const next = cycle(options.values, options.get());
    options.apply(next);
    row.setValue(options.render(next));
  });
  ctx.view.addChild(row.view);
};

const calcsValueText = (n: number): string => `${n} / 90 calculs`;

const addCalcsRow = (ctx: RowCtx): void => {
  const row = createCycleRow("Liste de calculs", 0);
  const refresh = (): void =>
    row.setValue(calcsValueText(ctx.state.current.selectedPairs.length));
  refresh();
  row.onTap(async () => {
    const next = await ctx.deps.onOpenCalcsPicker(ctx.state.current.selectedPairs);
    ctx.update({ selectedPairs: next });
    refresh();
  });
  ctx.view.addChild(row.view);
};

const addDifficultyRow = (ctx: RowCtx): void =>
  addCycleRow<Difficulty>(ctx, 1, "Difficulté", {
    values: DIFFICULTIES,
    get: () => ctx.state.current.difficulty,
    render: difficultyLabel,
    apply: (v) => ctx.update({ difficulty: v }),
  });

const addRoundsRow = (ctx: RowCtx): void =>
  addCycleRow<number>(ctx, 2, "Manches par session", {
    values: ROUNDS_OPTIONS,
    get: () => ctx.state.current.roundsPerSession,
    render: (v) => String(v),
    apply: (v) => ctx.update({ roundsPerSession: v }),
  });

const addCarrotsRow = (ctx: RowCtx): void =>
  addCycleRow<number>(ctx, 3, "Carottes par manche", {
    values: CARROTS_OPTIONS,
    get: () => ctx.state.current.carrotsPerRound,
    render: (v) => String(v),
    apply: (v) => ctx.update({ carrotsPerRound: v }),
  });

const addToggleRow = (
  ctx: RowCtx,
  index: number,
  label: string,
  get: () => boolean,
  apply: (v: boolean) => void,
): void =>
  addCycleRow<boolean>(ctx, index, label, {
    values: [false, true] as const,
    get,
    render: onOff,
    apply,
  });

const addToggleRows = (ctx: RowCtx): void => {
  addToggleRow(ctx, 4, "Mode tap (accessibilité)",
    () => ctx.state.current.tapMode, (v) => ctx.update({ tapMode: v }));
  addToggleRow(ctx, 5, "Bruitages",
    () => ctx.state.current.soundEnabled, (v) => ctx.update({ soundEnabled: v }));
  addToggleRow(ctx, 6, "Musique",
    () => ctx.state.current.musicEnabled, (v) => ctx.update({ musicEnabled: v }));
};

const buildAllRows = (ctx: RowCtx): void => {
  addCalcsRow(ctx);
  addDifficultyRow(ctx);
  addRoundsRow(ctx);
  addCarrotsRow(ctx);
  addToggleRows(ctx);
};

const installCloseFlow = (
  ctx: RowCtx,
  initial: Settings,
  onClose: (s: Settings, r: boolean) => void,
): void => {
  let close: Container | null = null;
  const closeNow = (restart: boolean) => onClose(ctx.state.current, restart);
  const showConfirm = () => {
    if (close) ctx.view.removeChild(close);
    const prompt = createConfirmPrompt("Recommencer la partie ?",
      () => closeNow(true), () => closeNow(false));
    ctx.view.addChild(prompt);
  };
  close = createCloseButton("Fermer", () =>
    sessionImpactingChanged(initial, ctx.state.current) ? showConfirm() : closeNow(false));
  ctx.view.addChild(close);
};

const buildVisualPanel = (
  view: Container,
  state: State,
  deps: SettingsSceneDeps,
): void => {
  view.addChild(createPanelBackground());
  view.addChild(createPanelTitle("Paramètres"));
  const ctx: RowCtx = {
    view,
    state,
    deps,
    update: (patch) => applyPatch(state, deps, patch),
  };
  buildAllRows(ctx);
  installCloseFlow(ctx, deps.initial, deps.onClose);
};

export function createSettingsScene(deps: SettingsSceneDeps): SettingsScene {
  const view = new Container();
  const state: State = { current: { ...deps.initial } };
  buildVisualPanel(view, state, deps);
  return { ...buildSceneShell(view), ...buildSetters(state, deps) };
}
