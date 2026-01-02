// src/state/journalStore.js
// Practice Journal System - Cycle Reflections & UI State
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Challenge taxonomy (static reference)
export const CHALLENGE_TAXONOMY = {
    physical: {
        label: 'Physical',
        examples: ['restlessness', 'discomfort', 'fatigue', 'pain']
    },
    attention: {
        label: 'Attention',
        examples: ['distraction', 'drowsiness', 'racing thoughts', 'dullness']
    },
    emotional: {
        label: 'Emotional',
        examples: ['anxiety', 'avoidance', 'frustration', 'sadness']
    },
    consistency: {
        label: 'Consistency',
        examples: ['skipping', 'shortening', 'postponing', 'irregular timing']
    },
    technique: {
        label: 'Technique',
        examples: ['breath control', 'posture', 'timing', 'counting']
    }
};

// Attention quality options
export const ATTENTION_QUALITIES = ['scattered', 'settling', 'stable', 'absorbed'];

// Technical note placeholder examples (rotates)
export const TECH_NOTE_PLACEHOLDERS = [
    "e.g., Counting exhales worked better than inhales",
    "e.g., First 5 minutes hardest, then settled",
    "e.g., Box breathing 4-4-4-4 more sustainable",
    "e.g., Evening sessions harder after work"
];

const getDateKey = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useJournalStore = create(
    persist(
        (set, get) => ({
            // ═══════════════════════════════════════════════════════════════
            // CYCLE REFLECTIONS (Layer 2)
            // ═══════════════════════════════════════════════════════════════
            cycleReflections: [],
            /*
            Each reflection:
            {
                id: string,
                cycleNumber: number,
                startDate: "YYYY-MM-DD",
                endDate: "YYYY-MM-DD",
                triggerType: 'cycle_complete' | 'streak_milestone' | 'module_complete' | 'session_milestone',
                reflectionText: string,
                focusIntention: string,  // 280 char max
                summarySnapshot: {...},  // computed summary at time of reflection
                createdAt: timestamp,
            }
            */

            // ═══════════════════════════════════════════════════════════════
            // UI STATE
            // ═══════════════════════════════════════════════════════════════
            pendingMicroNote: null,
            /*
            {
                sessionId: string,
                step: 'attention' | 'note' | 'resistance' | 'challenge' | 'done',
                formData: {
                    attentionQuality: string | null,
                    technicalNote: string | null,
                    resistanceFlag: boolean | null,
                    challengeTag: string | null,
                }
            }
            */

            // ═══════════════════════════════════════════════════════════════
            // CYCLE TRACKING
            // ═══════════════════════════════════════════════════════════════
            currentCycleStart: null,  // "YYYY-MM-DD"
            cycleCount: 0,

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: MICRO-NOTE FLOW
            // ═══════════════════════════════════════════════════════════════

            /**
             * Begin micro-note capture for a session
             */
            startMicroNote: (sessionId) => {
                set({
                    pendingMicroNote: {
                        sessionId,
                        step: 'attention',
                        formData: {
                            attentionQuality: null,
                            technicalNote: null,
                            resistanceFlag: null,
                            challengeTag: null,
                        }
                    }
                });
            },

            /**
             * Update form data during micro-note flow
             */
            updateMicroNote: (field, value) => {
                const state = get();
                if (!state.pendingMicroNote) return;

                set({
                    pendingMicroNote: {
                        ...state.pendingMicroNote,
                        formData: {
                            ...state.pendingMicroNote.formData,
                            [field]: value,
                        }
                    }
                });
            },

            /**
             * Advance to next step in micro-note flow
             */
            nextMicroNoteStep: () => {
                const state = get();
                if (!state.pendingMicroNote) return;

                const stepOrder = ['attention', 'note', 'resistance', 'challenge', 'done'];
                const currentIndex = stepOrder.indexOf(state.pendingMicroNote.step);

                // Skip challenge step if resistance = false AND attention != scattered
                const shouldShowChallenge = state.pendingMicroNote.formData.resistanceFlag === true ||
                    state.pendingMicroNote.formData.attentionQuality === 'scattered';

                let nextStep = stepOrder[currentIndex + 1];

                if (nextStep === 'challenge' && !shouldShowChallenge) {
                    nextStep = 'done';
                }

                set({
                    pendingMicroNote: {
                        ...state.pendingMicroNote,
                        step: nextStep
                    }
                });
            },

            /**
             * Complete micro-note and save to progress store
             */
            completeMicroNote: (progressStore) => {
                const state = get();
                if (!state.pendingMicroNote) return;

                const journal = {
                    attentionQuality: state.pendingMicroNote.formData.attentionQuality,
                    technicalNote: state.pendingMicroNote.formData.technicalNote,
                    resistanceFlag: state.pendingMicroNote.formData.resistanceFlag || false,
                    challengeTag: state.pendingMicroNote.formData.challengeTag,
                    submittedAt: Date.now(),
                };

                // Update the session in progress store
                const sessions = progressStore.getState().sessions;
                const sessionIndex = sessions.findIndex(s => s.id === state.pendingMicroNote.sessionId);

                if (sessionIndex !== -1) {
                    const updatedSessions = [...sessions];
                    updatedSessions[sessionIndex] = {
                        ...updatedSessions[sessionIndex],
                        journal
                    };

                    progressStore.setState({ sessions: updatedSessions });
                }

                // Clear pending state
                set({ pendingMicroNote: null });
            },

            /**
             * Cancel micro-note flow
             */
            cancelMicroNote: () => {
                set({ pendingMicroNote: null });
            },

            // ═══════════════════════════════════════════════════════════════
            // ACTIONS: CYCLE REFLECTIONS
            // ═══════════════════════════════════════════════════════════════

            /**
             * Record a cycle reflection
             */
            recordReflection: ({ triggerType, reflectionText, focusIntention, summarySnapshot }) => {
                const state = get();
                const now = Date.now();

                const reflection = {
                    id: crypto?.randomUUID?.() || `reflection_${now}`,
                    cycleNumber: state.cycleCount + 1,
                    startDate: state.currentCycleStart || getDateKey(),
                    endDate: getDateKey(),
                    triggerType,
                    reflectionText,
                    focusIntention,
                    summarySnapshot,
                    createdAt: now,
                };

                set({
                    cycleReflections: [...state.cycleReflections, reflection],
                    cycleCount: state.cycleCount + 1,
                    currentCycleStart: getDateKey(), // Start new cycle
                });

                return reflection;
            },

            /**
             * Initialize cycle tracking (if not already started)
             */
            initCycleTracking: () => {
                const state = get();
                if (!state.currentCycleStart) {
                    set({ currentCycleStart: getDateKey() });
                }
            },

            // ═══════════════════════════════════════════════════════════════
            // SELECTORS
            // ═══════════════════════════════════════════════════════════════

            /**
             * Get all cycle reflections
             */
            getAllReflections: () => {
                return get().cycleReflections;
            },

            /**
             * Get current cycle info
             */
            getCurrentCycle: () => {
                const state = get();
                if (!state.currentCycleStart) return null;

                const startDate = new Date(state.currentCycleStart);
                const now = new Date();
                const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

                return {
                    cycleNumber: state.cycleCount + 1,
                    startDate: state.currentCycleStart,
                    daysElapsed: daysSinceStart,
                    daysRemaining: Math.max(0, 30 - daysSinceStart),
                };
            },
        }),
        {
            name: 'immanenceOS.journal',
            version: 1,
        }
    )
);
