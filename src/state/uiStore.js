// src/state/uiStore.js
// UI state management for transient UI interactions (modals, navigation, launch contexts)

import { create } from 'zustand';

export const useUiStore = create((set) => ({
    // Practice launch context from daily schedule or other sources
    // Shape: { source: "dailySchedule" | "manual", activePathId, slotTime, slotIndex, practiceId }
    practiceLaunchContext: null,
    
    setPracticeLaunchContext: (ctx) => set({ practiceLaunchContext: ctx }),
    
    clearPracticeLaunchContext: () => set({ practiceLaunchContext: null }),
    
    // Can extend with other UI state as needed
}));
