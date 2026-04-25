export type SoundId =
  | "shot"
  | "hit_correct"
  | "hit_wrong"
  | "ground"
  | "session_done";

export interface AudioApi {
  playSfx(id: SoundId): void;
  startMusic(): void;
  stopMusic(): void;
}

export interface AudioDeps {
  AudioCtor: typeof Audio;
  sfxEnabled: () => boolean;
  musicEnabled: () => boolean;
  sfxSrc?: Record<SoundId, string> | undefined;
  musicSrc?: string | undefined;
}

const DEFAULT_SRC: Record<SoundId, string> = {
  shot: "/assets/sounds/shot.mp3",
  hit_correct: "/assets/sounds/hit_correct.mp3",
  hit_wrong: "/assets/sounds/hit_wrong.mp3",
  ground: "/assets/sounds/ground.mp3",
  session_done: "/assets/sounds/session_done.mp3",
};

interface AudioState {
  music: HTMLAudioElement | null;
}

const startMusicImpl = (deps: AudioDeps, state: AudioState): void => {
  if (!deps.musicEnabled()) return;
  if (!state.music) {
    state.music = new deps.AudioCtor(deps.musicSrc ?? "/assets/sounds/music.mp3");
    state.music.loop = true;
  }
  void state.music.play();
};

export function createAudio(deps: AudioDeps): AudioApi {
  const sfx = deps.sfxSrc ?? DEFAULT_SRC;
  const state: AudioState = { music: null };
  return {
    playSfx: (id) => {
      if (!deps.sfxEnabled()) return;
      void new deps.AudioCtor(sfx[id]).play();
    },
    startMusic: () => startMusicImpl(deps, state),
    stopMusic: () => state.music?.pause(),
  };
}
