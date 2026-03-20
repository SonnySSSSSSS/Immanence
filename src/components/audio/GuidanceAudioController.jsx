// src/components/audio/GuidanceAudioController.jsx
//
// ─── AUDIO OWNERSHIP: SESSION-LEVEL AMBIENT GUIDANCE ─────────────────────────
// This component handles SESSION-LEVEL, FILE-BASED, AMBIENT audio narration.
// It plays a single pre-recorded audio file (e.g. a meditation teacher's voice)
// that runs continuously for the duration of a practice session.
//
// It reads source/status/volume from tempoAudioStore and is driven by
// PracticeSection.jsx, which sets the source URL from leg.guidance.audioUrl.
//
// This component is NOT for per-phase speech events or one-shot breath cues.
// For phase-event speech synthesis, see: src/services/audioGuidanceService.js
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useTempoAudioStore } from "../../state/tempoAudioStore.js";

// eslint-disable-next-line react-refresh/only-export-components
export function isGuidanceAudioPlaybackActive({ source, status }) {
  return Boolean(source) && status === "playing";
}

export function GuidanceAudioController() {
  const source = useTempoAudioStore((state) => state.source);
  const status = useTempoAudioStore((state) => state.status);
  const volume = useTempoAudioStore((state) => state.volume);
  const setStatus = useTempoAudioStore((state) => state.setStatus);
  const setGuidanceTiming = useTempoAudioStore((state) => state.setGuidanceTiming);
  const stopReset = useTempoAudioStore((state) => state.stopReset);
  const setSource = useTempoAudioStore((state) => state.setSource);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = useTempoAudioStore.getState().volume;
    audioRef.current = audio;

    const syncTiming = () => {
      setGuidanceTiming(
        audio.currentTime,
        Number.isFinite(audio.duration) ? audio.duration : 0
      );
    };

    const handleError = () => {
      setStatus("failed");
    };
    const handlePlay = () => {
      setStatus("playing");
    };
    const handlePause = () => {
      const currentStore = useTempoAudioStore.getState();
      if (!currentStore.source || currentStore.status === "idle") return;
      setStatus("paused");
    };

    audio.addEventListener("timeupdate", syncTiming);
    audio.addEventListener("loadedmetadata", syncTiming);
    audio.addEventListener("error", handleError);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", syncTiming);
      audio.removeEventListener("loadedmetadata", syncTiming);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        void 0;
      }
      stopReset();
      setSource(null);
      audioRef.current = null;
    };
  }, [setGuidanceTiming, setSource, setStatus, stopReset]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!source) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        void 0;
      }
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {
        void 0;
      }
      setGuidanceTiming(0, 0);
      return;
    }

    if (audio.src !== source) {
      audio.src = source;
      audio.load();
      setGuidanceTiming(0, 0);
    }
  }, [setGuidanceTiming, source]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !source) return;

    if (status === "paused") {
      audio.pause();
      return;
    }

    if (status === "idle") {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        void 0;
      }
      setGuidanceTiming(0, Number.isFinite(audio.duration) ? audio.duration : 0);
      return;
    }

    if (status !== "loading" && status !== "playing") {
      return;
    }

    let cancelled = false;

    const startPlayback = async () => {
      try {
        await audio.play();
        if (!cancelled) {
          setStatus("playing");
        }
      } catch (error) {
        if (cancelled) return;
        setStatus(error?.name === "NotAllowedError" ? "blocked" : "failed");
      }
    };

    startPlayback();

    return () => {
      cancelled = true;
    };
  }, [setGuidanceTiming, setStatus, source, status]);

  return null;
}

export default GuidanceAudioController;
