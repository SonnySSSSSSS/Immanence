// src/state/videoStore.js
// Tracks video watch progress with normalized O(1) lookup

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function normalizeUserId(userId) {
    if (typeof userId !== 'string') return null;
    const trimmed = userId.trim();
    return trimmed || null;
}

function buildInitialVideoState() {
    return {
        byId: {},
        currentVideoId: null,
        lastWatchedId: null,
    };
}

export const useVideoStore = create(
    persist(
        (set, get) => ({
            ownerUserId: null,
            activeUserId: null,
            ...buildInitialVideoState(),

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
                        ...buildInitialVideoState(),
                        ownerUserId: normalizedUserId,
                        activeUserId: normalizedUserId,
                    };
                });
            },

            resetForIdentityBoundary: (userId = null) => {
                const normalizedUserId = normalizeUserId(userId);
                set({
                    ...buildInitialVideoState(),
                    ownerUserId: normalizedUserId,
                    activeUserId: normalizedUserId,
                });
            },

            // ========================================
            // STATE
            // ========================================

            /**
             * Normalized map: O(1) lookup by video ID
             * {
             *   [videoId]: {
             *     progress: 0.0-1.0,
             *     completed: boolean,
             *     lastWatchedAt: ISO string,
             *     lastPositionSec: number
             *   }
             * }
             */
            /**
             * Currently playing video ID
             */
            /**
             * Last watched video ID (for "continue watching")
             */
            // ========================================
            // ACTIONS
            // ========================================

            /**
             * Update progress for a video
             * Called periodically while watching (throttled from player)
             */
            updateProgress: (videoId, progress, positionSec) => {
                const state = get();
                const existing = state.byId[videoId] || {};
                const now = new Date().toISOString();

                // Mark as completed if progress >= 90%
                const completed = progress >= 0.9 || existing.completed;

                set({
                    byId: {
                        ...state.byId,
                        [videoId]: {
                            ...existing,
                            progress: Math.max(existing.progress || 0, progress),
                            completed,
                            lastWatchedAt: now,
                            lastPositionSec: positionSec
                        }
                    },
                    lastWatchedId: videoId
                });
            },

            /**
             * Mark video as completed
             * Called when video ends or reaches 90%
             */
            markCompleted: (videoId) => {
                const state = get();
                const existing = state.byId[videoId] || {};
                const now = new Date().toISOString();

                set({
                    byId: {
                        ...state.byId,
                        [videoId]: {
                            ...existing,
                            progress: 1.0,
                            completed: true,
                            lastWatchedAt: now
                        }
                    }
                });
            },

            /**
             * Set current video (when player opens)
             */
            setCurrentVideo: (videoId) => {
                set({ currentVideoId: videoId });
            },

            /**
             * Clear current video (when player closes)
             */
            clearCurrentVideo: () => {
                set({ currentVideoId: null });
            },

            /**
             * Reset progress for a video (rewatch)
             */
            resetProgress: (videoId) => {
                const state = get();
                const existing = state.byId[videoId];
                if (!existing) return;

                set({
                    byId: {
                        ...state.byId,
                        [videoId]: {
                            ...existing,
                            progress: 0,
                            completed: false,
                            lastPositionSec: 0
                        }
                    }
                });
            },

            // ========================================
            // DERIVED SELECTORS
            // ========================================

            /**
             * Get watch state for a specific video
             */
            getVideoState: (videoId) => {
                const state = get();
                return state.byId[videoId] || {
                    progress: 0,
                    completed: false,
                    lastWatchedAt: null,
                    lastPositionSec: 0
                };
            },

            /**
             * Get all completed video IDs
             */
            getCompletedVideoIds: () => {
                const state = get();
                return Object.entries(state.byId)
                    .filter(([, data]) => data.completed)
                    .map(([id]) => id);
            },

            /**
             * Get videos in progress (started but not completed)
             */
            getInProgressVideoIds: () => {
                const state = get();
                return Object.entries(state.byId)
                    .filter(([, data]) => data.progress > 0 && !data.completed)
                    .map(([id]) => id);
            },

            /**
             * Get resume position for a video
             * Returns position in seconds, or 0 if should start fresh
             */
            getResumePosition: (videoId) => {
                const state = get();
                const videoState = state.byId[videoId];

                if (!videoState) return 0;

                // If completed, start fresh
                if (videoState.completed) return 0;

                // If barely started (< 15%), start fresh
                if (videoState.progress < 0.15) return 0;

                // Otherwise resume from last position
                return videoState.lastPositionSec || 0;
            },

            /**
             * Get watch statistics
             */
            getWatchStats: () => {
                const state = get();
                const entries = Object.values(state.byId);

                return {
                    totalWatched: entries.length,
                    completed: entries.filter(e => e.completed).length,
                    inProgress: entries.filter(e => e.progress > 0 && !e.completed).length
                };
            },

            /**
             * Get raw video entries (for reports)
             */
            getVideoEntries: () => {
                return Object.entries(get().byId);
            },

            /**
             * Check if a video is completed
             */
            isCompleted: (videoId) => {
                const state = get();
                return state.byId[videoId]?.completed || false;
            }
        }),
        {
            name: 'immanenceOS.videos',
            version: 2,
            partialize: (state) => ({
                ownerUserId: normalizeUserId(state.ownerUserId),
                byId: state.byId && typeof state.byId === 'object' ? state.byId : {},
                currentVideoId: state.currentVideoId ?? null,
                lastWatchedId: state.lastWatchedId ?? null,
            }),
            migrate: (persistedState) => {
                const next = persistedState || {};
                return {
                    ...buildInitialVideoState(),
                    ...next,
                    ownerUserId: normalizeUserId(next.ownerUserId),
                    byId: next.byId && typeof next.byId === 'object' ? next.byId : {},
                    currentVideoId: next.currentVideoId ?? null,
                    lastWatchedId: next.lastWatchedId ?? null,
                };
            },
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...buildInitialVideoState(),
                ...(persistedState || {}),
                ownerUserId: normalizeUserId(persistedState?.ownerUserId),
                activeUserId: null,
                byId: persistedState?.byId && typeof persistedState.byId === 'object' ? persistedState.byId : {},
                currentVideoId: persistedState?.currentVideoId ?? null,
                lastWatchedId: persistedState?.lastWatchedId ?? null,
            }),
        }
    )
);
