// src/state/uiStore.js
// UI state management for transient UI interactions (modals, navigation, launch contexts)

import { create } from 'zustand';

export const useUiStore = create((set) => ({
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
    // }
    practiceLaunchContext: null,
    
    setPracticeLaunchContext: (ctx) => set({ practiceLaunchContext: ctx }),
    
    clearPracticeLaunchContext: () => set({ practiceLaunchContext: null }),

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
    
    // Can extend with other UI state as needed
}));
