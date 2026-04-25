import { describe, it, expect, vi } from "vitest";
import { createAudio, type SoundId } from "../../src/services/Audio";

const fakeAudio = () => {
  const play = vi.fn();
  const pause = vi.fn();
  // Vitest 4's vi.fn with arrow impl is not constructable; use a regular
  // function so the production code can call `new deps.AudioCtor(...)`.
  function Ctor(this: unknown) {
    return { play, pause, currentTime: 0, loop: false };
  }
  const ctor = vi.fn(Ctor as unknown as () => unknown);
  return { play, pause, ctor };
};

const makeAudio = (sfx: boolean, music: boolean) => {
  const f = fakeAudio();
  const a = createAudio({
    AudioCtor: f.ctor as unknown as typeof Audio,
    sfxEnabled: () => sfx,
    musicEnabled: () => music,
  });
  return { f, a };
};

describe("Audio sfx enabled", () => {
  it("plays a sfx when enabled", () => {
    const { f, a } = makeAudio(true, false);
    a.playSfx("shot" as SoundId);
    expect(f.play).toHaveBeenCalledTimes(1);
  });
});

describe("Audio sfx disabled", () => {
  it("does not play sfx when disabled", () => {
    const { f, a } = makeAudio(false, false);
    a.playSfx("shot" as SoundId);
    expect(f.play).not.toHaveBeenCalled();
  });
});

describe("Audio music", () => {
  it("startMusic / stopMusic respects musicEnabled", () => {
    const f = fakeAudio();
    const flag = { on: true };
    const a = createAudio({
      AudioCtor: f.ctor as unknown as typeof Audio,
      sfxEnabled: () => false,
      musicEnabled: () => flag.on,
    });
    a.startMusic();
    flag.on = false;
    a.startMusic();
    a.stopMusic();
    expect(f.play).toHaveBeenCalledTimes(1);
    expect(f.pause).toHaveBeenCalledTimes(1);
  });
});
