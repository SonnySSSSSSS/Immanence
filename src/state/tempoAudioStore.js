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
  }
  return audioEl;
}

export const useTempoAudioStore = create((set, get) => ({
  hasSong: false,
  songName: null,

  loadSongFile: (file) => {
    if (!file) return;

    // revoke prior blob
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch {}
      blobUrl = null;
    }

    const a = ensureAudio();
    blobUrl = URL.createObjectURL(file);
    a.src = blobUrl;
    a.load();

    set({ hasSong: true, songName: file.name });

    console.log("[TempoAudioStore] song loaded", { name: file.name, src: a.currentSrc, readyState: a.readyState });
  },

  clearSong: () => {
    if (audioEl) {
      try { audioEl.pause(); } catch {}
      try { audioEl.removeAttribute("src"); } catch {}
      try { audioEl.load(); } catch {}
    }
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch {}
      blobUrl = null;
    }
    audioEl = null;
    set({ hasSong: false, songName: null });
    console.log("[TempoAudioStore] song cleared");
  },

  start: async (reason = "start") => {
    const { hasSong } = get();
    if (!hasSong || !audioEl) {
      console.log("[TempoAudioStore] start ignored (no audio loaded)", { reason, hasSong, hasEl: !!audioEl });
      return;
    }

    const a = ensureAudio();
    a.muted = false;
    a.volume = 1;

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
      if (a.readyState === 0) a.load();
      await a.play();
      console.log("[TempoAudioStore] play resolved");
    } catch (e) {
      console.error("[TempoAudioStore] play rejected", e);
    }
  }
}));
