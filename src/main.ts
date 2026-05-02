import { Assets, Ticker } from "pixi.js";
import { createApp } from "./core/App";
import { createPhysicsWorld } from "./core/PhysicsWorld";
import { createSceneManager } from "./core/SceneManager";
import { createGameScene } from "./scenes/GameScene";
import { createSettingsScene } from "./scenes/SettingsScene";
import { loadSettings, saveSettings, type Settings } from "./services/Settings";
import { createAudio } from "./services/Audio";
import { installOrientationLock } from "./ui/OrientationLock";
import { openCalcsPicker } from "./ui/CalcsPicker";
import { tickTweens } from "./entities/animations/Tween";
import { TREE_ASSET_URLS } from "./entities/Tree";

type SM = ReturnType<typeof createSceneManager>;
type Physics = ReturnType<typeof createPhysicsWorld>;
type SettingsRef = { current: Settings };

const openSettings = (sm: SM, physics: Physics, ref: SettingsRef): void => {
  const settings = createSettingsScene({
    initial: ref.current,
    onChange: (next) => {
      ref.current = next;
      saveSettings(next);
    },
    onClose: (next, restart) => {
      ref.current = next;
      saveSettings(next);
      sm.closeOverlay();
      if (restart) startGame(sm, physics, ref);
    },
    onOpenCalcsPicker: (current) => openCalcsPicker({ initial: current }),
  });
  sm.openOverlay(settings);
};

const toggleFullscreen = (): void => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
};

const startGame = (sm: SM, physics: Physics, ref: SettingsRef): void => {
  const game = createGameScene({
    settings: ref.current,
    physics,
    onOpenSettings: () => openSettings(sm, physics, ref),
    onSessionRestart: () => startGame(sm, physics, ref),
    onToggleFullscreen: toggleFullscreen,
  });
  sm.goTo(game);
};

const setupAudio = () =>
  createAudio({
    AudioCtor: Audio,
  });

async function main(): Promise<void> {
  const root = document.getElementById("game-root");
  if (!root) throw new Error("Missing #game-root");
  installOrientationLock(document.body);
  const base = import.meta.env.BASE_URL;
  await Assets.load([
    `${base}assets/sun.png`,
    `${base}assets/cog.png`,
    `${base}assets/carot.png`,
    ...TREE_ASSET_URLS,
  ]);
  const app = await createApp(root);
  const physics = createPhysicsWorld();
  const sm = createSceneManager(app.stage);
  const settingsRef = { current: loadSettings() };
  saveSettings(settingsRef.current);
  const audio = setupAudio();
  audio.startMusic();
  startGame(sm, physics, settingsRef);
  Ticker.shared.add((t) => {
    physics.step(t.deltaMS);
    sm.tick(t.deltaMS);
    tickTweens(performance.now());
  });
}

void main();
