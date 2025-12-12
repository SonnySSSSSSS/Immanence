// src/state/videoStore.js
// Tracks video watch progress with normalized O(1) lookup

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useVideoStore = create(
    persist(
        (set, get) => ({
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
            byId: {},

            /**
             * Currently playing video ID
             */
            currentVideoId: null,

            /**
             * Last watched video ID (for "continue watching")
             */
            lastWatchedId: null,

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
                    .filter(([_, data]) => data.completed)
                    .map(([id]) => id);
            },

            /**
             * Get videos in progress (started but not completed)
             */
            getInProgressVideoIds: () => {
                const state = get();
                return Object.entries(state.byId)
                    .filter(([_, data]) => data.progress > 0 && !data.completed)
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
             * Check if a video is completed
             */
            isCompleted: (videoId) => {
                const state = get();
                return state.byId[videoId]?.completed || false;
            }
        }),
        {
            name: 'immanenceOS.videos',
            version: 1,
            migrate: (persistedState, version) => {
                return persistedState;
            }
        }
    )
);
