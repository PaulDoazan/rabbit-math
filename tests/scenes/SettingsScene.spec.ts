import { describe, it, expect, vi } from "vitest";
import { createSettingsScene } from "../../src/scenes/SettingsScene";
import { cycle, sessionImpactingChanged } from "../../src/scenes/SettingsPanel";
import { DEFAULT_SETTINGS } from "../../src/services/Settings";

describe("SettingsScene onChange", () => {
  it("emits onChange with the patched settings", () => {
    const onChange = vi.fn();
    const scene = createSettingsScene({
      initial: DEFAULT_SETTINGS,
      onChange,
      onClose: () => {},
    });
    scene.setDifficulty("hard");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "hard" }),
    );
  });
});

describe("SettingsScene close", () => {
  it("confirmCloseWith fires onClose with the latest settings and a restartRequested flag", () => {
    const onClose = vi.fn();
    const scene = createSettingsScene({
      initial: DEFAULT_SETTINGS,
      onChange: () => {},
      onClose,
    });
    scene.setRoundsPerSession(20);
    scene.confirmCloseWith(true);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({ roundsPerSession: 20 }),
      true,
    );
  });
});

describe("SettingsScene close without changes", () => {
  it("does NOT prompt for restart when nothing changed", () => {
    const onClose = vi.fn();
    const scene = createSettingsScene({
      initial: DEFAULT_SETTINGS,
      onChange: () => {},
      onClose,
    });
    scene.confirmCloseWith(false);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining(DEFAULT_SETTINGS),
      false,
    );
  });
});

describe("cycle", () => {
  it("returns the next element wrapping at the end", () => {
    expect(cycle(["a", "b", "c"], "a")).toBe("b");
    expect(cycle(["a", "b", "c"], "c")).toBe("a");
  });
});

describe("sessionImpactingChanged", () => {
  it("returns true when tableListId, difficulty or roundsPerSession change", () => {
    const a = DEFAULT_SETTINGS;
    expect(sessionImpactingChanged(a, { ...a, difficulty: "hard" })).toBe(true);
    expect(sessionImpactingChanged(a, { ...a, roundsPerSession: 20 })).toBe(true);
    expect(sessionImpactingChanged(a, { ...a, tableListId: "table_2" })).toBe(true);
  });
  it("returns false for non-session-impacting fields", () => {
    const a = DEFAULT_SETTINGS;
    expect(sessionImpactingChanged(a, { ...a, tapMode: !a.tapMode })).toBe(false);
    expect(sessionImpactingChanged(a, { ...a, soundEnabled: !a.soundEnabled })).toBe(false);
    expect(sessionImpactingChanged(a, { ...a, musicEnabled: !a.musicEnabled })).toBe(false);
    expect(sessionImpactingChanged(a, { ...a, carrotsPerRound: 4 })).toBe(false);
  });
});
