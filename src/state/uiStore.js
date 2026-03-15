// src/state/uiStore.js
// UI state management for transient UI interactions (modals, navigation, launch contexts)

import { create } from 'zustand';

export const useUiStore = create((set, get) => ({
    // Practice launch context from schedule / paths / recommendations.
    // This should be treated as transient (consume then clear).
    //
    // Shape:
    // {
    //   source: string,
    //   practiceId: string,
    //   durationMin?: number,
    //   practiceParamsPatch?: Record<string, any>,
    //   overrides?: {
    //     practiceParams?: Record<string, any>,
    //     settings?: { photic?: Record<string, any>, breathSoundEnabled?: boolean },
    //     tempoSync?: Record<string, any>,
    //     awarenessScene?: Record<string, any>,
    //   },
    //   locks?: string[] | {
    //     practiceParams?: string[],
    //     settings?: string[],
    //     tempoSync?: string[],
    //     awarenessScene?: string[],
    //   },
    //   practiceConfig?: Record<string, any>,
    //   pathContext?: { runId?: string, activePathId?: string, slotTime?: string, slotIndex?: number, dayIndex?: number, weekIndex?: number },
    //   persistPreferences?: boolean, // default true; set false for recommendations
    //
    //   phaseInstructions?: {
    //     // Per-phase breath quality/style metadata for future breath-variation work.
    //     // Keys use DATA-LAYER naming: inhale | hold1 | exhale | hold2.
    //     // (The ring/render layer uses holdTop/holdBottom — translation happens in
    //     //  useBreathSessionState.js, which is the sole naming boundary.)
    //     //
    //     // style: machine-readable pacing token for the phase.
    //     //   Valid values: 'fast' | 'slow' | 'smooth' | 'natural' | 'max'
    //     // cue: user-facing text announced at phase entry, or null for silence.
    //     //   Delivery is via audioGuidanceService (one-shot speech), NOT
    //     //   GuidanceAudioController (which handles session-level ambient audio).
    //     //
    //     inhale?: { style?: string, cue?: string | null },
    //     hold1?:  { style?: string, cue?: string | null },
    //     exhale?: { style?: string, cue?: string | null },
    //     hold2?:  { style?: string, cue?: string | null },
    //   },
    //   // NOTE: phaseInstructions is not yet consumed by any runtime component.
    //   // It is declared here as the canonical pipeline entry point for the
    //   // breath-variation feature. No behavior changes until a future pass.
    // }
    practiceLaunchContext: null,
    lastPracticeLaunchContext: null,
    lastPracticeLaunchContextAt: null,
    lastPracticeStartProbe: null,
    
    setPracticeLaunchContext: (ctx) => {
        if (ctx?.source === 'dailySchedule' && ctx?.pathContext?.activePathId) {
            console.log('[GUIDE-PROBE]', {
                practiceId: ctx.practiceId ?? null,
                legId: ctx.legId ?? ctx.pathContext?.slotIndex ?? null,
                guidance: ctx.guidance ?? null,
                guidanceState: ctx.guidance ? 'present' : 'absent',
            });
        }
        set({
            practiceLaunchContext: ctx,
            // PROBE:GUIDANCE_CTX_OVERLAY:START
            lastPracticeLaunchContext: ctx,
            lastPracticeLaunchContextAt: Date.now(),
            // PROBE:GUIDANCE_CTX_OVERLAY:END
        });
    },
    
    clearPracticeLaunchContext: () => set({ practiceLaunchContext: null }),

    setLastPracticeStartProbe: (probe) => set({
        // PROBE:PRACTICE_START_CALLSITE:START
        lastPracticeStartProbe: probe || null,
        // PROBE:PRACTICE_START_CALLSITE:END
    }),

    // Content launch context for Wisdom (chapters) and Videos.
    // This should be treated as transient (consume then clear).
    //
    // Shape:
    // {
    //   source: string,
    //   target: "chapter" | "video",
    //   chapterId?: string,
    //   videoId?: string,
    //   durationMin?: number, // recommended time budget
    // }
    contentLaunchContext: null,

    setContentLaunchContext: (ctx) => set({ contentLaunchContext: ctx }),

    clearContentLaunchContext: () => set({ contentLaunchContext: null }),

    // Tracker launch context for deep-linking into the heatmap panel.
    // Shape:
    // {
    //   target: 'applicationHeatmap',
    //   source: string,
    //   ts: number
    // }
    trackerLaunchContext: null,

    setTrackerLaunchContext: (ctx) => set({ trackerLaunchContext: ctx }),

    consumeTrackerLaunchContext: () => {
        const current = get().trackerLaunchContext;
        if (current) {
            set({ trackerLaunchContext: null });
        }
        return current || null;
    },

    resetLaunchContext: () => set({
        practiceLaunchContext: null,
        lastPracticeLaunchContext: null,
        lastPracticeLaunchContextAt: null,
        lastPracticeStartProbe: null,
        contentLaunchContext: null,
        trackerLaunchContext: null,
    }),
    
}));
