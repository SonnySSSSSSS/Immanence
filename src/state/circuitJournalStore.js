// src/state/circuitJournalStore.js
// Extension to journalStore for circuit-specific journal entries
// Allows detailed tracking of completed circuits with per-exercise notes

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDateKey } from '../utils/dateUtils';

/**
 * Circuit Journal Entry (Phase 2)
 * {
 *   id: string,
 *   circuitId: string,
 *   circuitName: string,
 *   completedCircuitId: string, // Reference to circuitManager completion log
 *   dateKey: "YYYY-MM-DD",
 *   timestamp: ISO8601,
 *   
 *   // Per-exercise assessments (optional, can capture variations in difficulty)
 *   exercises: [
 *     {
 *       exerciseId: string,
 *       exerciseName: string,
 *       plannedDuration: number,
 *       actualDuration: number,
 *       attentionQuality: 'scattered' | 'settling' | 'stable' | 'absorbed',
 *       notes: string,
 *       challenges: [tag, tag, ...], // Optional per-exercise challenges
 *     },
 *     ...
 *   ],
 *   
 *   // Overall circuit assessment
 *   overallAssessment: {
 *     attentionQuality: 'scattered' | 'settling' | 'stable' | 'absorbed',
 *     resistanceFlag: boolean,
 *     challenges: [tag, tag, ...],
 *     generalNotes: string,
 *   },
 *   
 *   // Metadata
 *   sessionMode: 'guided' | 'freestyle',
 *   lunarPhase: string, // Optional, from lunar store at time of completion
 *   timeOfDay: string, // HH:MM format
 *   totalDuration: number, // minutes
 *   
 *   // Tracking
 *   createdAt: timestamp,
 *   editedAt: null | timestamp, // Phase 4: for edit tracking
 * }
 */

export const useCircuitJournalStore = create(
    persist(
        (set, get) => ({
            // === Circuit Journal Entries ===
            entries: [],

            // ========================================
            // ACTIONS
            // ========================================

            /**
             * Create a new circuit journal entry
             * Called after a circuit is completed
             */
            createEntry: ({
                circuitId,
                circuitName,
                completedCircuitId,
                exercises,
                sessionMode,
                totalDuration,
                lunarPhase = null,
                timeOfDay
            }) => {
                const now = Date.now();
                const dateKey = getDateKey();

                const entry = {
                    id: crypto?.randomUUID?.() || `cjentry_${now}`,
                    circuitId,
                    circuitName,
                    completedCircuitId,
                    dateKey,
                    timestamp: new Date().toISOString(),
                    exercises: exercises.map(ex => ({
                        exerciseId: ex.exerciseId,
                        exerciseName: ex.exerciseName,
                        plannedDuration: ex.plannedDuration,
                        actualDuration: ex.actualDuration,
                        attentionQuality: null, // To be filled by user
                        notes: ex.notes || null,
                        challenges: []
                    })),
                    overallAssessment: {
                        attentionQuality: null,
                        resistanceFlag: false,
                        challenges: [],
                        generalNotes: ''
                    },
                    sessionMode,
                    lunarPhase,
                    timeOfDay,
                    totalDuration,
                    createdAt: now,
                    editedAt: null
                };

                set(state => ({
                    entries: [...state.entries, entry]
                }));

                return entry;
            },

            /**
             * Update exercise-specific assessment
             */
            updateExerciseAssessment: (entryId, exerciseIndex, assessment) => {
                set(state => ({
                    entries: state.entries.map(entry =>
                        entry.id === entryId
                            ? {
                                ...entry,
                                exercises: entry.exercises.map((ex, idx) =>
                                    idx === exerciseIndex
                                        ? { ...ex, ...assessment }
                                        : ex
                                )
                            }
                            : entry
                    )
                }));
            },

            /**
             * Update overall circuit assessment
             */
            updateOverallAssessment: (entryId, assessment) => {
                set(state => ({
                    entries: state.entries.map(entry =>
                        entry.id === entryId
                            ? {
                                ...entry,
                                overallAssessment: {
                                    ...entry.overallAssessment,
                                    ...assessment
                                },
                                editedAt: Date.now()
                            }
                            : entry
                    )
                }));
            },

            /**
             * Get entry by ID
             */
            getEntry: (entryId) => {
                return get().entries.find(e => e.id === entryId);
            },

            /**
             * Get all entries for a date
             */
            getEntriesForDate: (dateKey) => {
                return get().entries.filter(e => e.dateKey === dateKey);
            },

            /**
             * Get all entries for a specific circuit
             */
            getCircuitHistory: (circuitId) => {
                return get().entries.filter(e => e.circuitId === circuitId);
            },

            /**
             * Get all entries (for archive)
             */
            getAllEntries: () => {
                return get().entries;
            },

            /**
             * Delete entry (Phase 4 feature placeholder)
             */
            deleteEntry: (entryId) => {
                set(state => ({
                    entries: state.entries.filter(e => e.id !== entryId)
                }));
            },

            /**
             * Edit existing entry (Phase 4 feature)
             */
            editEntry: (entryId, updates) => {
                set(state => ({
                    entries: state.entries.map(e =>
                        e.id === entryId
                            ? {
                                ...e,
                                ...updates,
                                editedAt: Date.now()
                            }
                            : e
                    )
                }));
            },

            /**
             * Export entries as JSON
             */
            exportAsJSON: (entryIds = null) => {
                const state = get();
                const entriesToExport = entryIds
                    ? state.entries.filter(e => entryIds.includes(e.id))
                    : state.entries;

                return JSON.stringify(entriesToExport, null, 2);
            },

            /**
             * Export entries as CSV (Phase 4)
             */
            exportAsCSV: (entryIds = null) => {
                const state = get();
                const entriesToExport = entryIds
                    ? state.entries.filter(e => entryIds.includes(e.id))
                    : state.entries;

                // Simple CSV format: one row per exercise entry
                const header = [
                    'Date',
                    'Circuit Name',
                    'Exercise Name',
                    'Planned Duration',
                    'Actual Duration',
                    'Attention Quality',
                    'Challenges',
                    'Notes'
                ].join(',');

                const rows = entriesToExport.flatMap(entry =>
                    entry.exercises.map(ex =>
                        [
                            entry.dateKey,
                            `"${entry.circuitName}"`,
                            `"${ex.exerciseName}"`,
                            ex.plannedDuration,
                            ex.actualDuration,
                            ex.attentionQuality || '',
                            `"${(ex.challenges || []).join('; ')}"`,
                            `"${(ex.notes || '').replace(/"/g, '""')}"`
                        ].join(',')
                    )
                );

                return [header, ...rows].join('\n');
            }
        }),
        {
            name: 'circuit-journal-store',
            version: 1,
        }
    )
);

export default useCircuitJournalStore;
