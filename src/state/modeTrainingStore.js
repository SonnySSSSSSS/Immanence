// src/state/modeTrainingStore.js
// State management for Mode Training practices in Application
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChainStore } from './chainStore.js';

// Practice states: intro → active → reflection → handoff → end
export const PRACTICE_STATES = {
    IDLE: 'idle',
    INTRO: 'intro',
    ACTIVE: 'active',
    PAUSED: 'paused',
    REFLECTION: 'reflection',
    HANDOFF: 'handoff',
    END: 'end',
};

export const useModeTrainingStore = create(
    persist(
        (set, get) => ({
            // Current session state
            currentSession: null,
            practiceState: PRACTICE_STATES.IDLE,

            // Session history (quiet tracking - no gamification)
            sessions: [],

            // Exposure tracking (internal only - never shown to user)
            modeStats: {
                mirror: { count: 0, lastUsed: null },
                prism: { count: 0, lastUsed: null },
                wave: { count: 0, lastUsed: null },
                sword: { count: 0, lastUsed: null },
                resonator: { count: 0, lastUsed: null }, // Legacy support
            },

            // Start a new training session
            startSession: (mode, practiceType = 'default') => {
                const session = {
                    id: `${mode}-${Date.now()}`,
                    mode,
                    practiceType,
                    startedAt: Date.now(),
                    endedAt: null,
                    completionRatio: 0,
                    entries: [],
                    skippedCount: 0, // Track skips for Resonator
                    timerUsed: null, // Track timer usage for Sword
                    events: [{ type: 'started', at: Date.now() }],
                    modeCheckResponse: null,
                };

                set({
                    currentSession: session,
                    practiceState: PRACTICE_STATES.INTRO,
                });
            },

            // Transition to next practice state
            setPracticeState: (state) => {
                const session = get().currentSession;
                if (session) {
                    set({
                        practiceState: state,
                        currentSession: {
                            ...session,
                            events: [
                                ...session.events,
                                { type: `state_${state}`, at: Date.now() }
                            ],
                        },
                    });
                }
            },

            // Add user entry (text, choice, timer completion)
            addEntry: (stepId, type, value) => {
                const session = get().currentSession;
                if (session) {
                    set({
                        currentSession: {
                            ...session,
                            entries: [
                                ...session.entries,
                                { stepId, type, value, createdAt: Date.now() }
                            ],
                        },
                    });
                }
            },

            // Add skip entry (for Resonator - skip is valid completion)
            addSkip: (stepId) => {
                const session = get().currentSession;
                if (session) {
                    set({
                        currentSession: {
                            ...session,
                            skippedCount: session.skippedCount + 1,
                            events: [
                                ...session.events,
                                { type: 'skipped', stepId, at: Date.now() }
                            ],
                        },
                    });
                }
            },

            // Set timer usage (for Sword analytics)
            setTimerUsed: (used) => {
                const session = get().currentSession;
                if (session) {
                    set({
                        currentSession: {
                            ...session,
                            timerUsed: used,
                        },
                    });
                }
            },

            // Update completion ratio (for internal logic only - never shown)
            updateCompletion: (ratio) => {
                const session = get().currentSession;
                if (session) {
                    set({
                        currentSession: {
                            ...session,
                            completionRatio: Math.min(1, Math.max(0, ratio)),
                        },
                    });
                }
            },

            // Calculate mode-aware completion
            calculateModeCompletion: () => {
                const session = get().currentSession;
                if (!session) return 0;

                const { mode, entries, skippedCount } = session;

                switch (mode) {
                    case 'mirror':
                        // Binary: completed the stillness or not
                        return session.completionRatio;
                    case 'resonator':
                        // Answered + skipped both count as completion
                        return (entries.length + skippedCount) / 5;
                    case 'prism':
                        // Frames completed
                        return entries.length / 3;
                    case 'sword':
                        // Prompts answered (timer is separate)
                        return entries.length / 3;
                    default:
                        return 0;
                }
            },

            // Pause session (mobile interruption)
            pauseSession: () => {
                const session = get().currentSession;
                if (session && get().practiceState !== PRACTICE_STATES.PAUSED) {
                    set({
                        practiceState: PRACTICE_STATES.PAUSED,
                        currentSession: {
                            ...session,
                            events: [
                                ...session.events,
                                { type: 'paused', at: Date.now() }
                            ],
                        },
                    });
                }
            },

            // Resume session (if paused < 30s)
            resumeSession: () => {
                const session = get().currentSession;
                if (session && get().practiceState === PRACTICE_STATES.PAUSED) {
                    const pauseEvent = [...session.events].reverse().find(e => e.type === 'paused');
                    const pauseDuration = pauseEvent ? Date.now() - pauseEvent.at : 0;

                    if (pauseDuration < 30000) {
                        set({
                            practiceState: PRACTICE_STATES.ACTIVE,
                            currentSession: {
                                ...session,
                                events: [
                                    ...session.events,
                                    { type: 'resumed', at: Date.now() }
                                ],
                            },
                        });
                        return true;
                    }
                }
                return false;
            },

            // Set mode check response (Harmony)
            setModeCheckResponse: (response) => {
                const session = get().currentSession;
                if (session) {
                    set({
                        currentSession: {
                            ...session,
                            modeCheckResponse: response,
                        },
                    });
                }
            },

            // End session and save to history
            endSession: () => {
                const session = get().currentSession;
                if (session) {
                    const completedSession = {
                        ...session,
                        endedAt: Date.now(),
                        events: [
                            ...session.events,
                            { type: 'ended', at: Date.now() }
                        ],
                    };

                    // Update mode stats (quiet tracking)
                    const modeStats = { ...get().modeStats };
                    const mode = session.mode;

                    if (modeStats[mode]) {
                        modeStats[mode] = {
                            count: (modeStats[mode].count || 0) + 1,
                            lastUsed: Date.now(),
                        };
                    } else {
                        // Dynamically add mode if missing (defensive)
                        modeStats[mode] = { count: 1, lastUsed: Date.now() };
                    }

                    set({
                        currentSession: null,
                        practiceState: PRACTICE_STATES.IDLE,
                        sessions: [...get().sessions.slice(-49), completedSession], // Keep last 50
                        modeStats,
                    });

                    return completedSession;
                }
                return null;
            },

            // Check if Harmony mode check should trigger
            shouldTriggerHarmony: () => {
                // HARD BLOCK: chain-based modes bypass Harmony entirely
                // This is the authoritative guard - if a chain is active, Harmony NEVER triggers
                const chainState = useChainStore.getState();
                if (chainState.activeChain !== null) {
                    return false;
                }

                const session = get().currentSession;
                const sessions = get().sessions;

                if (!session) return false;

                // Always trigger if early exit (< 50% completion)
                if (session.completionRatio < 0.5) return true;

                // Check for rapid mode switching (within 2 min)
                const recentSessions = sessions.filter(
                    s => Date.now() - s.endedAt < 120000
                );
                if (recentSessions.length > 0) return true;

                // Check for 3+ consecutive same mode
                const lastThree = sessions.slice(-3);
                if (lastThree.length >= 3 &&
                    lastThree.every(s => s.mode === session.mode)) {
                    return true;
                }

                // 25% random chance otherwise
                return Math.random() < 0.25;
            },

            // Get exposure map data (internal only)
            getExposureMap: () => get().modeStats,
        }),
        {
            name: 'immanence-mode-training',
            version: 1,
        }
    )
);
