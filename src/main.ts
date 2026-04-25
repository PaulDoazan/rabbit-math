import { Ticker } from "pixi.js";
import { createApp } from "./core/App";
import { createPhysicsWorld } from "./core/PhysicsWorld";
import { createSceneManager } from "./core/SceneManager";
import { createGameScene } from "./scenes/GameScene";
import { loadSettings, saveSettings, type Settings } from "./services/Settings";
import { createAudio } from "./services/Audio";
import { installOrientationLock } from "./ui/OrientationLock";
import { tickTweens } from "./entities/animations/Tween";

const startGame = (
  sm: ReturnType<typeof createSceneManager>,
  physics: ReturnType<typeof createPhysicsWorld>,
  settings: Settings,
): void => {
  const game = createGameScene({
    settings,
    physics,
    onOpenSettings: () => {
      console.warn("Settings scene not yet wired (coming in Task 33).");
    },
    onSessionRestart: () => startGame(sm, physics, settings),
  });
  sm.goTo(game);
};

const setupAudio = (settingsRef: { current: Settings }) =>
  createAudio({
    AudioCtor: Audio,
    sfxEnabled: () => settingsRef.current.soundEnabled,
    musicEnabled: () => settingsRef.current.musicEnabled,
  });

async function main(): Promise<void> {
  const root = document.getElementById("game-root");
  if (!root) throw new Error("Missing #game-root");
  installOrientationLock(document.body);
  const app = await createApp(root);
  const physics = createPhysicsWorld();
  const sm = createSceneManager(app.stage);
  const settingsRef = { current: loadSettings() };
  saveSettings(settingsRef.current);
  const audio = setupAudio(settingsRef);
  audio.startMusic();
  startGame(sm, physics, settingsRef.current);
  Ticker.shared.add((t) => {
    physics.step(t.deltaMS);
    sm.tick(t.deltaMS);
    tickTweens(performance.now());
  });
}

void main();
