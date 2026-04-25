import { describe, it, expect, vi } from "vitest";
import { createSettingsScene } from "../../src/scenes/SettingsScene";
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
