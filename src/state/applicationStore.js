// src/state/applicationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useApplicationStore = create(
    persist(
        (set, get) => ({
            // Awareness logs
            awarenessLogs: [], // Array of { id, timestamp, category, note, respondedDifferently, pathId }

            // Add a new awareness log
            logAwareness: (category, pathId) => {
                const newLog = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    category,
                    note: null,
                    respondedDifferently: null,
                    pathId
                };

                set((state) => ({
                    awarenessLogs: [newLog, ...state.awarenessLogs]
                }));

                return newLog.id;
            },

            // Update a log with note/reflection
            updateLog: (logId, updates) => {
                set((state) => ({
                    awarenessLogs: state.awarenessLogs.map(log =>
                        log.id === logId ? { ...log, ...updates } : log
                    )
                }));
            },

            // Get today's logs
            getTodayLogs: () => {
                const state = get();
                const today = new Date().toDateString();
                return state.awarenessLogs.filter(log =>
                    new Date(log.timestamp).toDateString() === today
                );
            },

            // Get this week's logs
            getWeekLogs: () => {
                const state = get();
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);

                return state.awarenessLogs.filter(log =>
                    new Date(log.timestamp) >= weekAgo
                );
            },

            // Get stats for a time period
            getStats: (days = 7) => {
                const state = get();
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);

                const logs = state.awarenessLogs.filter(log =>
                    new Date(log.timestamp) >= cutoff
                );

                const byCategory = {};
                let respondedDifferently = 0;

                logs.forEach(log => {
                    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
                    if (log.respondedDifferently === true) {
                        respondedDifferently++;
                    }
                });

                return {
                    total: logs.length,
                    byCategory,
                    respondedDifferently,
                    respondedDifferentlyPercent: logs.length > 0
                        ? Math.round((respondedDifferently / logs.length) * 100)
                        : 0
                };
            },

            /**
             * Get raw awareness logs (for reports)
             */
            getAwarenessLogs: () => {
                return get().awarenessLogs;
            },

            // Intention statement
            intention: null,
            setIntention: (text) => set({ intention: text }),

            // Clear old logs (optional cleanup)
            clearOldLogs: (daysToKeep = 90) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - daysToKeep);

                set((state) => ({
                    awarenessLogs: state.awarenessLogs.filter(log =>
                        new Date(log.timestamp) >= cutoff
                    )
                }));
            }
        }),
        {
            name: 'immanenceOS.applicationState',
            version: 1,
            migrate: (persistedState) => {
                return persistedState;
            }
        }
    )
);
