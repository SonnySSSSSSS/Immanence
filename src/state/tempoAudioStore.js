import { create } from "zustand";

let audioEl = null;
let blobUrl = null;

function ensureAudio() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
    audioEl.loop = true;
    audioEl.crossOrigin = "anonymous";
    audioEl.muted = false;
    audioEl.volume = 1;
    audioEl.onplay = () => useTempoAudioStore.setState({ isPlaying: true });
    audioEl.onpause = () => useTempoAudioStore.setState({ isPlaying: false });
    audioEl.onended = () => useTempoAudioStore.setState({ isPlaying: false });
    audioEl.onloadedmetadata = () => {
      const d = Number.isFinite(audioEl.duration) ? audioEl.duration : null;
      useTempoAudioStore.setState({ songDurationSec: d });
      console.log("[TempoAudioStore] loadedmetadata", { duration: d });
    };
  }
  return audioEl;
}

export const useTempoAudioStore = create((set, get) => ({
  isPlaying: false,
  hasSong: false,
  songName: null,
  songDurationSec: null,

  loadSongFile: (file) => {
    if (!file) return;

    // revoke prior blob
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch { void 0; }
      blobUrl = null;
    }

    const a = ensureAudio();
    blobUrl = URL.createObjectURL(file);
    a.src = blobUrl;
    a.load();

    set({ hasSong: true, songName: file.name, songDurationSec: null });

    console.log("[TempoAudioStore] song loaded", { name: file.name, src: a.currentSrc, readyState: a.readyState });
  },

  clearSong: () => {
    if (audioEl) {
      try { audioEl.pause(); } catch { void 0; }
      try { audioEl.removeAttribute("src"); } catch { void 0; }
      try { audioEl.load(); } catch { void 0; }
    }
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch { void 0; }
      blobUrl = null;
    }
    audioEl = null;
    set({ hasSong: false, songName: null, songDurationSec: null, isPlaying: false });
    console.log("[TempoAudioStore] song cleared");
  },

  stop: (reason = "stop") => {
    if (!audioEl) return;
    try { audioEl.pause(); } catch { void 0; }
    try { audioEl.currentTime = 0; } catch { void 0; }
    useTempoAudioStore.setState({ isPlaying: false });
    console.log("[TempoAudioStore] stopped", { reason });
  },

  start: async (reason = "start") => {
    const { hasSong } = get();
    if (!hasSong) {
      console.log("[TempoAudioStore] start ignored (no song loaded)", { reason, hasSong });
      return;
    }

    const a = ensureAudio();
    if (!a || !a.src) {
      console.log("[TempoAudioStore] start ignored (no audio element or src)", { reason, hasEl: !!a, src: a?.src });
      return;
    }

    // Force unmute and full volume
    a.muted = false;
    a.volume = 1;
    a.currentTime = 0;

    console.log("[TempoAudioStore] start attempt", {
      reason,
      currentSrc: a.currentSrc,
      readyState: a.readyState,
      paused: a.paused,
      ended: a.ended,
      currentTime: a.currentTime,
      duration: a.duration
    });

    try {
      // If not ready, load first
      if (a.readyState === 0) {
        a.load();
        // Wait for canplay event
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            a.removeEventListener('canplay', onCanPlay);
            a.removeEventListener('error', onError);
            resolve();
          };
          const onError = (e) => {
            a.removeEventListener('canplay', onCanPlay);
            a.removeEventListener('error', onError);
            reject(e);
          };
          a.addEventListener('canplay', onCanPlay);
          a.addEventListener('error', onError);
        });
      }
      await a.play();
      console.log("[TempoAudioStore] play resolved");
    } catch (e) {
      console.error("[TempoAudioStore] play rejected", e);
    }
  }
}));
