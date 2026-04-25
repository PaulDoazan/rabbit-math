import { Container } from "pixi.js";
import type { Settings } from "../services/Settings";
import type { Scene } from "../core/Scene";
import type { Difficulty } from "../domain/DifficultyConfig";
import type { TableListId } from "../domain/tables";

export interface SettingsSceneDeps {
  initial: Settings;
  onChange(next: Settings): void;
  onClose(next: Settings, restartRequested: boolean): void;
}

export interface SettingsScene extends Scene {
  setTableList(id: TableListId): void;
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
  setTableList: (id) => applyPatch(state, deps, { tableListId: id }),
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

export function createSettingsScene(deps: SettingsSceneDeps): SettingsScene {
  const view = new Container();
  const state: State = { current: { ...deps.initial } };
  return { ...buildSceneShell(view), ...buildSetters(state, deps) };
}
