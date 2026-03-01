import { create } from "zustand";

let songAudioEl = null;
let blobUrl = null;

function ensureSongAudio() {
  if (!songAudioEl) {
    songAudioEl = new Audio();
    songAudioEl.preload = "auto";
    songAudioEl.loop = true;
    songAudioEl.crossOrigin = "anonymous";
    songAudioEl.muted = false;
    songAudioEl.volume = 1;
    songAudioEl.onplay = () => useTempoAudioStore.setState({ isPlaying: true });
    songAudioEl.onpause = () => useTempoAudioStore.setState({ isPlaying: false });
    songAudioEl.onended = () => useTempoAudioStore.setState({ isPlaying: false });
    songAudioEl.onloadedmetadata = () => {
      const duration = Number.isFinite(songAudioEl.duration) ? songAudioEl.duration : null;
      useTempoAudioStore.setState({ songDurationSec: duration });
    };
  }

  return songAudioEl;
}

function clampVolume(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return 1;
  return Math.min(1, Math.max(0, nextValue));
}

export const useTempoAudioStore = create((set, get) => ({
  isPlaying: false,
  hasSong: false,
  songName: null,
  songDurationSec: null,

  status: "idle",
  source: null,
  volume: 1,
  currentTime: 0,
  duration: 0,

  setSource: (source) => {
    set({
      source: source || null,
      currentTime: 0,
      duration: 0,
      status: "idle",
    });
  },

  play: () => {
    const { source, currentTime } = get();
    if (!source) return;
    set({ status: currentTime > 0 ? "playing" : "loading" });
  },

  pause: () => {
    const { source } = get();
    if (!source) return;
    set({ status: "paused" });
  },

  stopReset: () => {
    set({ status: "idle", currentTime: 0 });
  },

  setVolume: (value) => {
    set({ volume: clampVolume(value) });
  },

  setStatus: (status) => {
    set({ status });
  },

  setGuidanceTiming: (currentTime, duration) => {
    set({
      currentTime: Number.isFinite(currentTime) ? currentTime : 0,
      duration: Number.isFinite(duration) ? duration : 0,
    });
  },

  loadSongFile: (file) => {
    if (!file) return;

    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        void 0;
      }
      blobUrl = null;
    }

    const audio = ensureSongAudio();
    blobUrl = URL.createObjectURL(file);
    audio.src = blobUrl;
    audio.load();

    set({ hasSong: true, songName: file.name, songDurationSec: null });
  },

  clearSong: () => {
    if (songAudioEl) {
      try {
        songAudioEl.pause();
      } catch {
        void 0;
      }
      try {
        songAudioEl.removeAttribute("src");
      } catch {
        void 0;
      }
      try {
        songAudioEl.load();
      } catch {
        void 0;
      }
    }

    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        void 0;
      }
      blobUrl = null;
    }

    songAudioEl = null;
    set({ hasSong: false, songName: null, songDurationSec: null, isPlaying: false });
  },

  stop: () => {
    if (!songAudioEl) return;

    try {
      songAudioEl.pause();
    } catch {
      void 0;
    }

    try {
      songAudioEl.currentTime = 0;
    } catch {
      void 0;
    }

    useTempoAudioStore.setState({ isPlaying: false });
  },

  start: async () => {
    const { hasSong } = get();
    if (!hasSong) return;

    const audio = ensureSongAudio();
    if (!audio || !audio.src) return;

    audio.muted = false;
    audio.volume = 1;
    audio.currentTime = 0;

    try {
      if (audio.readyState === 0) {
        audio.load();
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
            resolve();
          };
          const handleError = (event) => {
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
            reject(event);
          };

          audio.addEventListener("canplay", handleCanPlay);
          audio.addEventListener("error", handleError);
        });
      }

      await audio.play();
    } catch {
      void 0;
    }
  },
}));
