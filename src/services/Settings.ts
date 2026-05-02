import { readJson, writeJson } from "./Storage";
import type { Pair } from "../domain/tables";

export type RabbitsCount = 4 | 5 | 6 | 7 | 8;

const tableOf4 = (): Pair[] =>
  Array.from({ length: 10 }, (_, i) => ({ a: 4, b: i + 1 }));

export interface Settings {
  selectedPairs: Pair[];
  rabbitsCount: RabbitsCount;
  tapMode: boolean;
}

export const SETTINGS_KEY = "rabbit-math.settings";

export const DEFAULT_SETTINGS: Settings = {
  selectedPairs: tableOf4(),
  rabbitsCount: 4,
  tapMode: false,
};

const isPair = (v: unknown): v is Pair => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.a === "number" && typeof o.b === "number";
};

const isPairArray = (v: unknown): v is Pair[] =>
  Array.isArray(v) && v.every(isPair);

const isRabbitsCount = (v: unknown): v is RabbitsCount =>
  v === 4 || v === 5 || v === 6 || v === 7 || v === 8;

const isShape = (v: unknown): v is Settings => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const knownKeys = new Set(["selectedPairs", "rabbitsCount", "tapMode"]);
  if (!Object.keys(o).every((k) => knownKeys.has(k))) return false;
  return (
    isPairArray(o.selectedPairs) &&
    isRabbitsCount(o.rabbitsCount) &&
    typeof o.tapMode === "boolean"
  );
};

const clampRabbits = (n: number): RabbitsCount => {
  const i = Math.max(4, Math.min(8, Math.floor(n)));
  return i as RabbitsCount;
};

export function validateSettings(s: Settings): Settings {
  return {
    ...s,
    rabbitsCount: clampRabbits(s.rabbitsCount),
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
