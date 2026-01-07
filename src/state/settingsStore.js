// src/state/settingsStore.js
// Centralized app settings with localStorage persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set) => ({
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
            showCoordinateHelper: false,
            lightModeRingType: 'astrolabe', // 'astrolabe' or 'rune'
            useNewAvatars: false, // false = old naming (Flame-Dhyana.png), true = new (avatar-flame-dhyana-ekagrata_00001_.png)
            buttonThemeDark: 'cosmic', // 'cosmic', 'bioluminescent', 'aurora', 'crystalline', 'electric'
            buttonThemeLight: 'watercolor', // 'watercolor', 'sketch', 'botanical', 'inkwash', 'cloudscape'

            // Photic Circles settings (persisted)
            // Note: isOpen and isRunning are component state, not persisted here
            photic: {
                // Timing
                rateHz: 2.0,              // Pulse frequency (0.1-20 Hz, default safe)
                dutyCycle: 0.5,           // On/off proportion (0.1-0.9)

                // Visual
                brightness: 0.6,          // Max opacity (0.0-1.0)
                spacingPx: 160,           // Center-to-center distance (40-320)
                radiusPx: 120,            // Circle radius (40-240)
                blurPx: 20,               // Glow blur radius (0-80, clamped to <= radiusPx)

                // Colors
                colorLeft: '#FFFFFF',     // Left circle color
                colorRight: '#FFFFFF',    // Right circle color
                linkColors: true,         // Sync left/right colors

                // Background
                bgOpacity: 0.95,          // Overlay background darkness (0.7-1.0)
            },

            // Actions
            setButtonThemeDark: (theme) => set({ buttonThemeDark: theme }),
            setButtonThemeLight: (theme) => set({ buttonThemeLight: theme }),
            setLightModeRingType: (type) => set({ lightModeRingType: type }),
            setCoordinateHelper: (show) => set({ showCoordinateHelper: show }),
            setUseNewAvatars: (useNew) => set({ useNewAvatars: useNew }),
            setDisplayMode: (mode) => set({ displayMode: mode }),

            setLlmModel: (model) => set({ llmModel: model }),

            setThemeStageOverride: (stage) => set({ themeStageOverride: stage }),

            setMasterVolume: (volume) => set({ masterVolume: volume }),

            setSoundVolume: (volume) => set({ soundVolume: volume }),

            setReduceMotion: (enabled) => set({ reduceMotion: enabled }),

            setHighContrast: (enabled) => set({ highContrast: enabled }),

            setDevPanelOpen: (isOpen) => set({ devPanelOpen: isOpen }),

            setShowFxGallery: (show) => set({ showFxGallery: show }),

            // Photic settings actions
            setPhoticSetting: (key, value) => set((state) => {
                // Clamp values to safe ranges
                let clampedValue = value;
                
                switch (key) {
                    case 'rateHz':
                        clampedValue = Math.max(0.1, Math.min(20.0, value));
                        break;
                    case 'dutyCycle':
                        clampedValue = Math.max(0.1, Math.min(0.9, value));
                        break;
                    case 'brightness':
                        clampedValue = Math.max(0.0, Math.min(1.0, value));
                        break;
                    case 'spacingPx':
                        clampedValue = Math.max(40, Math.min(320, value));
                        break;
                    case 'radiusPx':
                        clampedValue = Math.max(40, Math.min(240, value));
                        break;
                    case 'blurPx':
                        // Clamp blur to radiusPx to prevent extreme glow
                        clampedValue = Math.max(0, Math.min(80, Math.min(value, state.photic.radiusPx)));
                        break;
                    case 'bgOpacity':
                        clampedValue = Math.max(0.7, Math.min(1.0, value));
                        break;
                    default:
                        // For colors and booleans, use value as-is
                        clampedValue = value;
                }

                return {
                    photic: {
                        ...state.photic,
                        [key]: clampedValue,
                    },
                };
            }),

            resetPhoticSettings: () => set((state) => ({
                photic: {
                    rateHz: 2.0,
                    dutyCycle: 0.5,
                    brightness: 0.6,
                    spacingPx: 160,
                    radiusPx: 120,
                    blurPx: 20,
                    colorLeft: '#FFFFFF',
                    colorRight: '#FFFFFF',
                    linkColors: true,
                    bgOpacity: 0.95,
                },
            })),

            // Reset to defaults
            resetSettings: () => set({
                displayMode: 'sanctuary',
                llmModel: 'gemma3:1b',
                themeStageOverride: null,
                masterVolume: 0.7,
                soundVolume: 0.5,
                reduceMotion: false,
                highContrast: false,
                lightModeRingType: 'astrolabe',
                useNewAvatars: false,
                buttonThemeDark: 'cosmic',
                buttonThemeLight: 'watercolor',
                photic: {
                    rateHz: 2.0,
                    dutyCycle: 0.5,
                    brightness: 0.6,
                    spacingPx: 160,
                    radiusPx: 120,
                    blurPx: 20,
                    colorLeft: '#FFFFFF',
                    colorRight: '#FFFFFF',
                    linkColors: true,
                    bgOpacity: 0.95,
                },
            }),
        }),
        {
            name: 'immanence-settings',
            version: 1,
        }
    )
);
