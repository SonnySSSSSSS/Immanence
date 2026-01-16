import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTempoSyncStore = create(
  persist(
    (set, get) => ({
      // Core state
      enabled: false,
      bpm: 120,
      beatsPerPhase: 4,
      confidence: 0,
      isListening: false,
      playbackState: 'idle',
      lastBeatAt: null,
      manualOverride: false,
      isLocked: false,
      breathMultiplier: 1,

      // Actions
      setEnabled: (enabled) => set({ enabled }),
      setBpm: (bpm) => set({ bpm: Math.max(30, Math.min(300, bpm)) }),
      setBeatsPerPhase: (beats) => set({ beatsPerPhase: beats }),
      setListening: (listening) => set({ isListening: listening }),
      setPlaybackState: (playbackState) => set({ playbackState }),
      setConfidence: (confidence) => set({ confidence: Math.max(0, Math.min(1, confidence)) }),
      markBeat: (now) => set({ lastBeatAt: now }),
      setManualOverride: (override) => set({ manualOverride: override }),
      setLocked: (isLocked) => set({ isLocked }),
      setBreathMultiplier: (multiplier) => set({ breathMultiplier: Math.max(1, Math.min(4, multiplier)) }),

      // Computed methods
      getPhaseDuration: () => {
        const state = get();
        const baseDuration = (60 / state.bpm) * state.beatsPerPhase;
        const multipliedDuration = baseDuration * state.breathMultiplier;
        return Math.min(multipliedDuration, 60);
      },

      getCycleDuration: () => {
        const phaseDuration = get().getPhaseDuration();
        return phaseDuration * 4; // 4 phases: inhale, hold-top, exhale, hold-bottom
      },

      getTempoPattern: () => {
        const phaseDuration = get().getPhaseDuration();
        return {
          inhale: phaseDuration,
          holdTop: phaseDuration,
          exhale: phaseDuration,
          holdBottom: phaseDuration,
        };
      },

      // Reset function - called when loading new file
      reset: () => set({ 
        isLocked: false, 
        breathMultiplier: 1,
        confidence: 0,
        isListening: false,
        playbackState: 'idle',
        lastBeatAt: null,
      }),

      resetSession: () => set({
        confidence: 0,
        playbackState: 'idle',
        lastBeatAt: null,
      }),

      resetDetection: () => set({
        bpm: 120,
        confidence: 0,
        playbackState: 'idle',
        lastBeatAt: null,
        isListening: false,
      }),
    }),
    {
      name: 'tempo-sync-store',
      partialize: (state) => ({
        enabled: state.enabled,
        bpm: state.bpm,
        beatsPerPhase: state.beatsPerPhase,
        isLocked: state.isLocked,
        breathMultiplier: state.breathMultiplier,
      }),
    }
  )
);
