import { readJson, writeJson } from "./Storage";
import type { Difficulty } from "../domain/DifficultyConfig";
import type { Pair } from "../domain/tables";

const tableOf4 = (): Pair[] =>
  Array.from({ length: 10 }, (_, i) => ({ a: 4, b: i + 1 }));

export interface Settings {
  selectedPairs: Pair[];
  roundsPerSession: number;
  carrotsPerRound: number;
  difficulty: Difficulty;
  tapMode: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export const SETTINGS_KEY = "rabbit-math.settings";

export const DEFAULT_SETTINGS: Settings = {
  selectedPairs: tableOf4(),
  roundsPerSession: 10,
  carrotsPerRound: 3,
  difficulty: "medium",
  tapMode: false,
  soundEnabled: true,
  musicEnabled: true,
};

const isDifficulty = (v: unknown): v is Difficulty =>
  v === "easy" || v === "medium" || v === "hard";

const isPair = (v: unknown): v is Pair => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.a === "number" && typeof o.b === "number";
};

const isPairArray = (v: unknown): v is Pair[] =>
  Array.isArray(v) && v.every(isPair);

const isShape = (v: unknown): v is Settings => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isPairArray(o.selectedPairs) &&
    typeof o.roundsPerSession === "number" &&
    typeof o.carrotsPerRound === "number" &&
    isDifficulty(o.difficulty) &&
    typeof o.tapMode === "boolean" &&
    typeof o.soundEnabled === "boolean" &&
    typeof o.musicEnabled === "boolean"
  );
};

export function validateSettings(s: Settings): Settings {
  return {
    ...s,
    roundsPerSession: Math.max(1, Math.floor(s.roundsPerSession)),
    carrotsPerRound: Math.max(1, Math.floor(s.carrotsPerRound)),
    selectedPairs: s.selectedPairs.length >= 1 ? s.selectedPairs : tableOf4(),
  };
}

export function loadSettings(): Settings {
  const raw = readJson<unknown>(SETTINGS_KEY);
  return isShape(raw) ? validateSettings(raw) : DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings): void {
  writeJson(SETTINGS_KEY, validateSettings(s));
}
