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

  it("default rabbitsCount is 4", () => {
    expect(DEFAULT_SETTINGS.rabbitsCount).toBe(4);
  });

  it("saveSettings then loadSettings round-trips", () => {
    const next = { ...DEFAULT_SETTINGS, rabbitsCount: 6 as const, tapMode: true };
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

  it("loadSettings ignores legacy fields and falls back to defaults", () => {
    localStorage.setItem(
      "rabbit-math.settings",
      JSON.stringify({
        selectedPairs: DEFAULT_SETTINGS.selectedPairs,
        rabbitsCount: 4,
        tapMode: false,
        roundsPerSession: 10,
        carrotsPerRound: 4,
        difficulty: "medium",
      }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("Settings validation", () => {
  it("validateSettings clamps rabbitsCount into [4,8]", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, rabbitsCount: 2 as 4 }).rabbitsCount).toBe(4);
    expect(validateSettings({ ...DEFAULT_SETTINGS, rabbitsCount: 12 as 4 }).rabbitsCount).toBe(8);
    expect(validateSettings({ ...DEFAULT_SETTINGS, rabbitsCount: 5.7 as 5 }).rabbitsCount).toBe(5);
  });

  it("validateSettings falls back to the default selection when empty", () => {
    const bad = { ...DEFAULT_SETTINGS, selectedPairs: [] };
    const fixed = validateSettings(bad);
    expect(fixed.selectedPairs).toEqual(DEFAULT_SETTINGS.selectedPairs);
  });
});
