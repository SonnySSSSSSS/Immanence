// src/state/settingsStore.js
// Centralized app settings with localStorage persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set, get) => ({
            // Display mode: 'sanctuary' (default cosmic UI) or 'hearth' (alternative)
            displayMode: 'sanctuary',

            // LLM model preference
            llmModel: 'gemma3:1b',

            // Theme stage override (null = use user's actual stage)
            themeStageOverride: null,

            // Volume settings
            masterVolume: 0.7,
            soundVolume: 0.5,

            // Accessibility
            reduceMotion: false,
            highContrast: false,

            // Developer settings
            devPanelOpen: false,
            showFxGallery: false,

            // Actions
            setDisplayMode: (mode) => set({ displayMode: mode }),

            setLlmModel: (model) => set({ llmModel: model }),

            setThemeStageOverride: (stage) => set({ themeStageOverride: stage }),

            setMasterVolume: (volume) => set({ masterVolume: volume }),

            setSoundVolume: (volume) => set({ soundVolume: volume }),

            setReduceMotion: (enabled) => set({ reduceMotion: enabled }),

            setHighContrast: (enabled) => set({ highContrast: enabled }),

            setDevPanelOpen: (isOpen) => set({ devPanelOpen: isOpen }),

            setShowFxGallery: (show) => set({ showFxGallery: show }),

            // Reset to defaults
            resetSettings: () => set({
                displayMode: 'sanctuary',
                llmModel: 'gemma3:1b',
                themeStageOverride: null,
                masterVolume: 0.7,
                soundVolume: 0.5,
                reduceMotion: false,
                highContrast: false,
            }),
        }),
        {
            name: 'immanence-settings',
            version: 1,
        }
    )
);
