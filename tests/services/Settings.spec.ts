import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  validateSettings,
} from "../../src/services/Settings";

beforeEach(() => localStorage.clear());

describe("Settings defaults & round-trip", () => {
  it("loadSettings returns defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("default selection is the table of 4 (10 pairs)", () => {
    expect(DEFAULT_SETTINGS.selectedPairs).toHaveLength(10);
    expect(DEFAULT_SETTINGS.selectedPairs.every((p) => p.a === 4)).toBe(true);
  });

  it("saveSettings then loadSettings round-trips", () => {
    const next = { ...DEFAULT_SETTINGS, difficulty: "hard" as const, roundsPerSession: 15 };
    saveSettings(next);
    expect(loadSettings()).toEqual(next);
  });
});

describe("Settings invalid data", () => {
  it("loadSettings ignores invalid stored data", () => {
    localStorage.setItem("rabbit-math.settings", JSON.stringify({ tableListId: 12345 }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("loadSettings ignores when selectedPairs is missing", () => {
    localStorage.setItem(
      "rabbit-math.settings",
      JSON.stringify({ ...DEFAULT_SETTINGS, selectedPairs: undefined }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("Settings validation", () => {
  it("validateSettings clamps roundsPerSession >= 1 and carrotsPerRound >= 1", () => {
    const bad = { ...DEFAULT_SETTINGS, roundsPerSession: 0, carrotsPerRound: 0 };
    const fixed = validateSettings(bad);
    expect(fixed.roundsPerSession).toBeGreaterThanOrEqual(1);
    expect(fixed.carrotsPerRound).toBeGreaterThanOrEqual(1);
  });

  it("validateSettings falls back to the default selection when empty", () => {
    const bad = { ...DEFAULT_SETTINGS, selectedPairs: [] };
    const fixed = validateSettings(bad);
    expect(fixed.selectedPairs).toEqual(DEFAULT_SETTINGS.selectedPairs);
  });
});
