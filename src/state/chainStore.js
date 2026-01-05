// src/state/chainStore.js
// Zustand store for Immanence Chain tracking
// Linear progression: Mirror → Prism → Wave → Sword

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHAIN_STATES, MODE_SEQUENCE, ACTION_TYPES } from '../data/fourModes.js';

// Generate unique chain ID
const generateChainId = () => `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial chain data structure
const createEmptyChain = () => ({
    id: generateChainId(),
    startDate: new Date().toISOString(),
    endDate: null,
    state: CHAIN_STATES.NOT_STARTED,

    // Mirror data (Observation)
    mirror: {
        locked: false,
        lockedAt: null,
        context: {
            date: '',
            time: '',
            location: '',
            category: 'other',
        },
        actor: '',
        action: '',
        recipient: '',
        neutralSentence: '',
        validationWarnings: [],
        // LLM validation state
        llmValidation: {
            status: 'idle', // 'idle' | 'validating' | 'success' | 'error' | 'skipped'
            result: null,   // { verdict, issues, overall_note }
            lastAttempt: null,
        },
    },

    // Prism data (Separation)
    prism: {
        locked: false,
        skipped: false,
        lockedAt: null,
        interpretations: [], // { id, text, category, isSupported, evidenceNote }
        supportedCount: 0,
        unsupportedCount: 0,
        supportedRatio: 0,
    },

    // Wave data (Capacity)
    wave: {
        locked: false,
        skipped: false,
        aborted: false,
        lockedAt: null,
        emotions: [], // emotion labels
        somaticLocation: '',
        impulses: [], // { id, text, actedOn: boolean }
        timerDuration: 90, // seconds
        startIntensity: null, // 1-10
        endIntensity: null, // 1-10
        impulsesActedOn: false,
    },

    // Sword data (Commitment)
    sword: {
        locked: false,
        lockedAt: null,
        value: '', // what principle is at stake
        actionType: ACTION_TYPES.ACTION,
        action: '', // specific action
        cost: '', // what you lose/endure
        obstacle: '', // primary obstacle
        timeBound: '', // deadline or duration
    },
});

export const useChainStore = create(
    persist(
        (set, get) => ({
            // Current active chain (only one active at a time)
            activeChain: null,

            // History of completed chains
            completedChains: [],

            // ══════════════════════════════════════════════════════════════════
            // CHAIN LIFECYCLE
            // ══════════════════════════════════════════════════════════════════

            startNewChain: () => {
                const newChain = createEmptyChain();
                newChain.state = CHAIN_STATES.MIRROR_ACTIVE;
                set({ activeChain: newChain });
                return newChain.id;
            },

            abandonChain: () => {
                // Archive incomplete chain if it has any locked data
                const { activeChain, completedChains } = get();
                if (activeChain && activeChain.mirror.locked) {
                    set({
                        activeChain: null,
                        completedChains: [...completedChains, {
                            ...activeChain,
                            endDate: new Date().toISOString(),
                            abandoned: true,
                        }],
                    });
                } else {
                    set({ activeChain: null });
                }
            },

            // ══════════════════════════════════════════════════════════════════
            // MODE ACCESSIBILITY (Linear Enforcement)
            // ══════════════════════════════════════════════════════════════════

            isModeAccessible: (modeId) => {
                const { activeChain } = get();
                if (!activeChain) return modeId === 'mirror'; // Only Mirror accessible without chain

                switch (modeId) {
                    case 'mirror':
                        // Mirror always accessible if not locked
                        return !activeChain.mirror.locked;
                    case 'prism':
                        // Prism only after Mirror locked
                        return activeChain.mirror.locked && !activeChain.prism.locked && !activeChain.prism.skipped;
                    case 'wave':
                        // Wave only after Prism locked or skipped
                        return (activeChain.prism.locked || activeChain.prism.skipped)
                            && !activeChain.wave.locked && !activeChain.wave.skipped && !activeChain.wave.aborted;
                    case 'sword':
                        // Sword only after Wave locked, skipped, or aborted
                        return (activeChain.wave.locked || activeChain.wave.skipped || activeChain.wave.aborted)
                            && !activeChain.sword.locked;
                    default:
                        return false;
                }
            },

            canSkipMode: (modeId) => {
                // Can skip Prism or Wave after Mirror, but cannot skip Mirror
                const { activeChain } = get();
                if (!activeChain || !activeChain.mirror.locked) return false;
                return modeId === 'prism' || modeId === 'wave';
            },

            // ══════════════════════════════════════════════════════════════════
            // MIRROR MODE
            // ══════════════════════════════════════════════════════════════════

            updateMirrorData: (field, value) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        mirror: {
                            ...state.activeChain.mirror,
                            [field]: value,
                        },
                    } : null,
                }));
            },

            updateMirrorContext: (field, value) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        mirror: {
                            ...state.activeChain.mirror,
                            context: {
                                ...state.activeChain.mirror.context,
                                [field]: value,
                            },
                        },
                    } : null,
                }));
            },

            lockMirror: (neutralSentence, warnings = []) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        state: CHAIN_STATES.MIRROR_LOCKED,
                        mirror: {
                            ...state.activeChain.mirror,
                            locked: true,
                            lockedAt: new Date().toISOString(),
                            neutralSentence,
                            validationWarnings: warnings,
                        },
                    } : null,
                }));
            },

            // Set LLM validation state
            setMirrorLLMValidation: (status, result = null) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        mirror: {
                            ...state.activeChain.mirror,
                            llmValidation: {
                                status,
                                result,
                                lastAttempt: new Date().toISOString(),
                            },
                        },
                    } : null,
                }));
            },

            // ══════════════════════════════════════════════════════════════════
            // PRISM MODE
            // ══════════════════════════════════════════════════════════════════

            addInterpretation: (text) => {
                const id = `interp_${Date.now()}`;
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        prism: {
                            ...state.activeChain.prism,
                            interpretations: [
                                ...state.activeChain.prism.interpretations,
                                { id, text, category: 'narrative', isSupported: null, evidenceNote: '' },
                            ],
                        },
                    } : null,
                }));
                return id;
            },

            updateInterpretation: (id, updates) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        prism: {
                            ...state.activeChain.prism,
                            interpretations: state.activeChain.prism.interpretations.map(i =>
                                i.id === id ? { ...i, ...updates } : i
                            ),
                        },
                    } : null,
                }));
            },

            lockPrism: () => {
                set((state) => {
                    if (!state.activeChain) return state;

                    const interpretations = state.activeChain.prism?.interpretations || [];
                    const supportedCount = interpretations.filter(i => i.isSupported === true).length;
                    const unsupportedCount = interpretations.filter(i => i.isSupported === false).length;
                    const total = supportedCount + unsupportedCount;

                    return {
                        activeChain: {
                            ...state.activeChain,
                            state: CHAIN_STATES.PRISM_LOCKED,
                            prism: {
                                ...state.activeChain.prism,
                                locked: true,
                                lockedAt: new Date().toISOString(),
                                supportedCount,
                                unsupportedCount,
                                supportedRatio: total > 0 ? supportedCount / total : 0,
                            },
                        },
                    };
                });
            },

            skipPrism: () => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        state: CHAIN_STATES.PRISM_SKIPPED,
                        prism: {
                            ...state.activeChain.prism,
                            skipped: true,
                        },
                    } : null,
                }));
            },

            // ══════════════════════════════════════════════════════════════════
            // WAVE MODE
            // ══════════════════════════════════════════════════════════════════

            updateWaveData: (field, value) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        wave: {
                            ...state.activeChain.wave,
                            [field]: value,
                        },
                    } : null,
                }));
            },

            addWaveEmotion: (emotion) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        wave: {
                            ...state.activeChain.wave,
                            emotions: [...state.activeChain.wave.emotions, emotion],
                        },
                    } : null,
                }));
            },

            addWaveImpulse: (text) => {
                const id = `impulse_${Date.now()}`;
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        wave: {
                            ...state.activeChain.wave,
                            impulses: [...state.activeChain.wave.impulses, { id, text, actedOn: false }],
                        },
                    } : null,
                }));
                return id;
            },

            lockWave: () => {
                set((state) => {
                    if (!state.activeChain) return state;
                    // Safety check for impulses array
                    const impulses = state.activeChain.wave?.impulses || [];
                    const impulsesActedOn = impulses.some(i => i.actedOn);
                    return {
                        activeChain: {
                            ...state.activeChain,
                            state: CHAIN_STATES.WAVE_LOCKED,
                            wave: {
                                ...state.activeChain.wave,
                                locked: true,
                                lockedAt: new Date().toISOString(),
                                impulsesActedOn,
                            },
                        },
                    };
                });
            },

            skipWave: () => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        state: CHAIN_STATES.WAVE_SKIPPED,
                        wave: {
                            ...state.activeChain.wave,
                            skipped: true,
                        },
                    } : null,
                }));
            },

            abortWave: () => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        state: CHAIN_STATES.WAVE_ABORTED,
                        wave: {
                            ...state.activeChain.wave,
                            aborted: true,
                            lockedAt: new Date().toISOString(),
                        },
                    } : null,
                }));
            },

            // ══════════════════════════════════════════════════════════════════
            // SWORD MODE
            // ══════════════════════════════════════════════════════════════════

            updateSwordData: (field, value) => {
                set((state) => ({
                    activeChain: state.activeChain ? {
                        ...state.activeChain,
                        sword: {
                            ...state.activeChain.sword,
                            [field]: value,
                        },
                    } : null,
                }));
            },

            lockSword: () => {
                set((state) => {
                    if (!state.activeChain) return state;

                    const completedChain = {
                        ...state.activeChain,
                        state: CHAIN_STATES.CHAIN_COMPLETE,
                        endDate: new Date().toISOString(),
                        sword: {
                            ...state.activeChain.sword,
                            locked: true,
                            lockedAt: new Date().toISOString(),
                        },
                    };

                    return {
                        activeChain: null,
                        completedChains: [...state.completedChains, completedChain],
                    };
                });
            },

            // ══════════════════════════════════════════════════════════════════
            // PATTERN REVIEW (Aggregate Statistics - No Judgments)
            // ══════════════════════════════════════════════════════════════════

            getPatternStats: () => {
                const { completedChains } = get();
                if (completedChains.length === 0) return null;

                // Context frequency
                const contextCounts = {};
                completedChains.forEach(c => {
                    const cat = c.mirror.context.category || 'other';
                    contextCounts[cat] = (contextCounts[cat] || 0) + 1;
                });

                // Unsupported narrative ratio (average across chains)
                const prismChains = completedChains.filter(c => c.prism.locked);
                const avgUnsupportedRatio = prismChains.length > 0
                    ? prismChains.reduce((sum, c) => sum + (1 - c.prism.supportedRatio), 0) / prismChains.length
                    : null;

                // Wave capacity stats
                const waveChains = completedChains.filter(c => c.wave.locked || c.wave.aborted || c.wave.skipped);
                const waveStats = {
                    completed: waveChains.filter(c => c.wave.locked).length,
                    aborted: waveChains.filter(c => c.wave.aborted).length,
                    skipped: waveChains.filter(c => c.wave.skipped).length,
                };

                // Intensity deltas
                const intensityChains = completedChains.filter(c =>
                    c.wave.locked && c.wave.startIntensity !== null && c.wave.endIntensity !== null
                );
                const avgIntensityDelta = intensityChains.length > 0
                    ? intensityChains.reduce((sum, c) => sum + (c.wave.startIntensity - c.wave.endIntensity), 0) / intensityChains.length
                    : null;

                // Action type distribution
                const swordChains = completedChains.filter(c => c.sword.locked);
                const actionTypeCounts = {};
                swordChains.forEach(c => {
                    const type = c.sword.actionType || ACTION_TYPES.ACTION;
                    actionTypeCounts[type] = (actionTypeCounts[type] || 0) + 1;
                });

                // Completion ratio
                const completionRatio = completedChains.filter(c => c.state === CHAIN_STATES.CHAIN_COMPLETE).length / completedChains.length;

                return {
                    totalChains: completedChains.length,
                    contextFrequency: contextCounts,
                    avgUnsupportedNarrativeRatio: avgUnsupportedRatio,
                    waveCapacity: waveStats,
                    avgIntensityDelta,
                    actionTypeDistribution: actionTypeCounts,
                    completionRatio,
                    // Timeline (last 30 chains)
                    recentChains: completedChains.slice(-30).map(c => ({
                        id: c.id,
                        date: c.startDate,
                        context: c.mirror.context.category,
                        completed: c.state === CHAIN_STATES.CHAIN_COMPLETE,
                    })),
                };
            },

            // Clear all data (for dev/testing)
            clearAllChains: () => {
                set({ activeChain: null, completedChains: [] });
            },
        }),
        {
            name: 'immanence-chains',
            version: 1,
        }
    )
);
