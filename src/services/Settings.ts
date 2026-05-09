import { readJson, writeJson } from "./Storage";
import { allMulPairs, type Op, type Pair } from "../domain/tables";

export type RabbitsCount = 4 | 5 | 6 | 7 | 8;

const DEFAULT_RANDOM_COUNT = 10;

const random10MulPairs = (): Pair[] => {
  const all = allMulPairs();
  const indices = Array.from({ length: all.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices.slice(0, DEFAULT_RANDOM_COUNT).map((i) => all[i]!);
};

export interface Settings {
  selectedPairs: Pair[];
  rabbitsCount: RabbitsCount;
  tapMode: boolean;
}

export const SETTINGS_KEY = "rabbit-math.settings";

export const DEFAULT_SETTINGS: Settings = {
  selectedPairs: random10MulPairs(),
  rabbitsCount: 4,
  tapMode: false,
};

const isOp = (v: unknown): v is Op => v === "mul" || v === "add" || v === "sub";

const isPair = (v: unknown): v is Pair => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.a !== "number" || typeof o.b !== "number") return false;
  if (o.op === undefined) return true;
  return isOp(o.op);
};

const normalizePair = (p: Pair): Pair =>
  isOp((p as { op?: unknown }).op) ? p : { a: p.a, b: p.b, op: "mul" };

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
  const pairs = s.selectedPairs.length >= 1 ? s.selectedPairs.map(normalizePair) : random10MulPairs();
  return {
    ...s,
    rabbitsCount: clampRabbits(s.rabbitsCount),
    selectedPairs: pairs,
  };
}

export function loadSettings(): Settings {
  const raw = readJson<unknown>(SETTINGS_KEY);
  return isShape(raw) ? validateSettings(raw) : DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings): void {
  writeJson(SETTINGS_KEY, validateSettings(s));
}
