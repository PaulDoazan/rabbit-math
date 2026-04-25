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
});

describe("Settings validation", () => {
  it("validateSettings clamps roundsPerSession >= 1 and carrotsPerRound >= 1", () => {
    const bad = { ...DEFAULT_SETTINGS, roundsPerSession: 0, carrotsPerRound: 0 };
    const fixed = validateSettings(bad);
    expect(fixed.roundsPerSession).toBeGreaterThanOrEqual(1);
    expect(fixed.carrotsPerRound).toBeGreaterThanOrEqual(1);
  });
});
