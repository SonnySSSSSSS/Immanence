// src/state/wisdomStore.js
// Tracks wisdom domain progress: reading, quizzes, flashcards

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePathStore } from './pathStore';

function normalizeUserId(userId) {
    if (typeof userId !== 'string') return null;
    const trimmed = userId.trim();
    return trimmed || null;
}

function buildInitialWisdomState() {
    return {
        readingSessions: [],
        bookmarks: [],
        lastReadSection: null,
        totalReadingTime: 0,
        completedSections: {},
        quizAttempts: [],
        quizUnlocks: {},
        flashcardState: {},
        dueCardsCache: [],
        selfKnowledgeProfile: null,
    };
}

export const useWisdomStore = create(
    persist(
        (set, get) => ({
            ownerUserId: null,
            activeUserId: null,
            ...buildInitialWisdomState(),

            setActiveUserId: (userId) => {
                const normalizedUserId = normalizeUserId(userId);
                set((state) => {
                    if (!normalizedUserId) {
                        return { activeUserId: null };
                    }

                    if (state.ownerUserId === normalizedUserId) {
                        return { activeUserId: normalizedUserId };
                    }

                    return {
                        ...buildInitialWisdomState(),
                        ownerUserId: normalizedUserId,
                        activeUserId: normalizedUserId,
                    };
                });
            },

            resetForIdentityBoundary: (userId = null) => {
                const normalizedUserId = normalizeUserId(userId);
                set({
                    ...buildInitialWisdomState(),
                    ownerUserId: normalizedUserId,
                    activeUserId: normalizedUserId,
                });
            },

            // ========================================
            // READING PROGRESS
            // ========================================
            // Each: { id, date, sectionId, timeSpent (seconds), scrollDepth (0-1) }

            // Each: { id, date, sectionId, note, position }

            /**
             * Completed sections (chapters) by sectionId
             * {
             *   [sectionId]: { completedAt: ISO string, scrollDepth: 0-1, source?: string }
             * }
             */
            // ========================================
            // QUIZ STATE (for future quiz system)
            // ========================================
            // Each: { id, date, quizId, score, answers[], passed }

            // { sectionId: true } — sections unlocked by passing quizzes

            // ========================================
            // FLASHCARD SRS (for future spaced repetition)
            // ========================================
            // { cardId: { interval, ease, nextReview, reviews } }
            // `dueCardsCache` is persisted but currently only used as storage for future review flows.

            // ========================================
            // ACTIONS
            // ========================================

            /**
             * Record a reading session
             */
            recordReadingSession: ({ sectionId, timeSpent, scrollDepth = 0 }) => {
                const state = get();
                const now = new Date();

                const newSession = {
                    id: crypto?.randomUUID?.() || String(Date.now()),
                    date: now.toISOString(),
                    sectionId,
                    timeSpent, // seconds
                    scrollDepth
                };

                set({
                    readingSessions: [...state.readingSessions, newSession],
                    lastReadSection: sectionId,
                    totalReadingTime: state.totalReadingTime + timeSpent
                });

                // Record for path calculation (convert seconds to minutes)
                try {
                    usePathStore.getState().recordPractice({
                        domain: 'wisdom',
                        duration: Math.round(timeSpent / 60), // seconds to minutes
                        timestamp: now.getTime(),
                        metadata: { type: 'reading', sectionId }
                    });
                } catch (e) {
                    console.warn('pathStore not available:', e);
                }

                return newSession;
            },

            /**
             * Mark a section as completed (idempotent)
             */
            markSectionCompleted: (sectionId, meta = {}) => {
                if (!sectionId) return;
                const state = get();
                if (state.completedSections?.[sectionId]) return;

                set({
                    completedSections: {
                        ...(state.completedSections || {}),
                        [sectionId]: {
                            completedAt: new Date().toISOString(),
                            scrollDepth: Math.max(0, Math.min(1, Number(meta.scrollDepth ?? 1))),
                            source: meta.source || 'read',
                        }
                    }
                });
            },

            /**
             * Add a bookmark
             */
            addBookmark: ({ sectionId, note = '', position = 0 }) => {
                const state = get();

                // Check if already bookmarked
                const exists = state.bookmarks.some(b => b.sectionId === sectionId);
                if (exists) return null;

                const newBookmark = {
                    id: crypto?.randomUUID?.() || String(Date.now()),
                    date: new Date().toISOString(),
                    sectionId,
                    note,
                    position
                };

                set({
                    bookmarks: [...state.bookmarks, newBookmark]
                });

                return newBookmark;
            },

            /**
             * Remove a bookmark
             */
            removeBookmark: (sectionId) => {
                const state = get();
                set({
                    bookmarks: state.bookmarks.filter(b => b.sectionId !== sectionId)
                });
            },

            /**
             * Record a quiz attempt (future)
             */
            recordQuizAttempt: ({ quizId, score, answers, passThreshold = 0.8 }) => {
                const state = get();
                const passed = score >= passThreshold;

                const attempt = {
                    id: crypto?.randomUUID?.() || String(Date.now()),
                    date: new Date().toISOString(),
                    quizId,
                    score,
                    answers,
                    passed
                };

                // If passed, unlock related section
                const newUnlocks = passed
                    ? { ...state.quizUnlocks, [quizId]: true }
                    : state.quizUnlocks;

                set({
                    quizAttempts: [...state.quizAttempts, attempt],
                    quizUnlocks: newUnlocks
                });

                // Record for path calculation (5 min credit per quiz)
                try {
                    usePathStore.getState().recordPractice({
                        domain: 'wisdom',
                        duration: 5, // Fixed 5 min credit per quiz
                        timestamp: Date.now(),
                        metadata: { type: 'quiz', quizId, score, passed }
                    });
                } catch (e) {
                    console.warn('pathStore not available:', e);
                }

                return { attempt, passed };
            },

            /**
             * Update flashcard state after review (future - SM-2 algorithm)
             */
            updateFlashcardState: (cardId, quality) => {
                const state = get();
                const current = state.flashcardState[cardId] || {
                    interval: 1,
                    ease: 2.5,
                    reviews: 0
                };

                // Simplified SM-2 algorithm
                let { interval, ease } = current;

                if (quality >= 3) {
                    // Correct response
                    if (current.reviews === 0) {
                        interval = 1;
                    } else if (current.reviews === 1) {
                        interval = 6;
                    } else {
                        interval = Math.round(interval * ease);
                    }
                    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
                } else {
                    // Incorrect - reset
                    interval = 1;
                    ease = Math.max(1.3, ease - 0.2);
                }

                const nextReview = new Date();
                nextReview.setDate(nextReview.getDate() + interval);

                set({
                    flashcardState: {
                        ...state.flashcardState,
                        [cardId]: {
                            interval,
                            ease,
                            nextReview: nextReview.toISOString(),
                            reviews: current.reviews + 1
                        }
                    }
                });
            },

            // ========================================
            // DERIVED SELECTORS
            // ========================================

            /**
             * Get reading stats
             */
            getReadingStats: () => {
                const state = get();
                const sessions = state.readingSessions;

                const uniqueSections = new Set(sessions.map(s => s.sectionId));
                const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);

                // Sessions by section
                const bySection = {};
                sessions.forEach(s => {
                    bySection[s.sectionId] = (bySection[s.sectionId] || 0) + 1;
                });

                return {
                    totalSessions: sessions.length,
                    totalMinutes: Math.round(totalTime / 60),
                    sectionsVisited: uniqueSections.size,
                    sectionsCompleted: Object.keys(state.completedSections || {}).length,
                    bySection,
                    lastRead: state.lastReadSection
                };
            },

            /**
             * Check if section is completed
             */
            isSectionCompleted: (sectionId) => {
                const state = get();
                return state.completedSections?.[sectionId] != null;
            },

            /**
             * Get completed section ids (for reports)
             */
            getCompletedSectionIds: () => {
                const state = get();
                return Object.keys(state.completedSections || {});
            },

            /**
             * Get quiz stats
             */
            getQuizStats: () => {
                const state = get();
                const attempts = state.quizAttempts;

                const passed = attempts.filter(a => a.passed).length;
                const avgScore = attempts.length > 0
                    ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
                    : 0;

                return {
                    totalAttempts: attempts.length,
                    passed,
                    avgScore,
                    passRate: attempts.length > 0 ? passed / attempts.length : 0
                };
            },

            /**
             * Get raw reading sessions (for reports)
             */
            getReadingSessions: () => {
                return get().readingSessions;
            },

            /**
             * Get raw quiz attempts (for reports)
             */
            getQuizAttempts: () => {
                return get().quizAttempts;
            },

            /**
             * Check if section is unlocked by quiz
             */
            isSectionUnlocked: (sectionId) => {
                const state = get();
                return state.quizUnlocks[sectionId] === true;
            },

            /**
             * Get flashcards due for review
             */
            getDueFlashcards: () => {
                const state = get();
                const now = new Date();

                return Object.entries(state.flashcardState)
                    .filter(([, data]) => new Date(data.nextReview) <= now)
                    .map(([cardId]) => cardId);
            },

            /**
             * Get bookmarks with metadata
             */
            getBookmarks: () => {
                return get().bookmarks;
            },

            /**
             * Set the self-knowledge profile (persisted)
             */
            setSelfKnowledgeProfile: (profile) => set({ selfKnowledgeProfile: profile }),
        }),
        {
            name: 'immanenceOS.wisdom',
            version: 3,
            partialize: (state) => ({
                ownerUserId: normalizeUserId(state.ownerUserId),
                readingSessions: Array.isArray(state.readingSessions) ? state.readingSessions : [],
                bookmarks: Array.isArray(state.bookmarks) ? state.bookmarks : [],
                lastReadSection: state.lastReadSection ?? null,
                totalReadingTime: typeof state.totalReadingTime === 'number' ? state.totalReadingTime : 0,
                completedSections: state.completedSections || {},
                quizAttempts: Array.isArray(state.quizAttempts) ? state.quizAttempts : [],
                quizUnlocks: state.quizUnlocks || {},
                flashcardState: state.flashcardState || {},
                dueCardsCache: Array.isArray(state.dueCardsCache) ? state.dueCardsCache : [],
                selfKnowledgeProfile: state.selfKnowledgeProfile ?? null,
            }),
            migrate: (persistedState) => {
                const next = persistedState || {};
                return {
                    ...buildInitialWisdomState(),
                    ...next,
                    ownerUserId: normalizeUserId(next.ownerUserId),
                    readingSessions: Array.isArray(next.readingSessions) ? next.readingSessions : [],
                    bookmarks: Array.isArray(next.bookmarks) ? next.bookmarks : [],
                    totalReadingTime: typeof next.totalReadingTime === 'number' ? next.totalReadingTime : 0,
                    completedSections: next.completedSections || {},
                    quizAttempts: Array.isArray(next.quizAttempts) ? next.quizAttempts : [],
                    quizUnlocks: next.quizUnlocks || {},
                    flashcardState: next.flashcardState || {},
                    dueCardsCache: Array.isArray(next.dueCardsCache) ? next.dueCardsCache : [],
                    selfKnowledgeProfile: next.selfKnowledgeProfile ?? null,
                };
            },
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...buildInitialWisdomState(),
                ...(persistedState || {}),
                ownerUserId: normalizeUserId(persistedState?.ownerUserId),
                activeUserId: null,
                readingSessions: Array.isArray(persistedState?.readingSessions) ? persistedState.readingSessions : [],
                bookmarks: Array.isArray(persistedState?.bookmarks) ? persistedState.bookmarks : [],
                totalReadingTime: typeof persistedState?.totalReadingTime === 'number' ? persistedState.totalReadingTime : 0,
                completedSections: persistedState?.completedSections || {},
                quizAttempts: Array.isArray(persistedState?.quizAttempts) ? persistedState.quizAttempts : [],
                quizUnlocks: persistedState?.quizUnlocks || {},
                flashcardState: persistedState?.flashcardState || {},
                dueCardsCache: Array.isArray(persistedState?.dueCardsCache) ? persistedState.dueCardsCache : [],
                selfKnowledgeProfile: persistedState?.selfKnowledgeProfile ?? null,
            }),
        }
    )
);
