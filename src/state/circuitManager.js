// src/state/circuitManager.js
// Manages practice circuits (sequences of exercises)
// Bridges circuit completion events with journal logging

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDateKey } from '../utils/dateUtils';

/**
 * Circuit Definition
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   exercises: [
 *     { id, name, duration, reps, targetDomain: 'breath'|'focus'|'body' },
 *     ...
 *   ],
 *   totalDuration: number (minutes),
 *   createdAt: timestamp,
 * }
 */

/**
 * Completed Circuit Log
 * {
 *   id: string,
 *   circuitId: string,
 *   completionTime: ISO8601,
 *   exercises: [
 *     { id, name, duration, actualDuration?, reps, notes },
 *     ...
 *   ],
 *   totalDuration: number,
 *   sessionMode: 'guided'|'freestyle',
 *   metadata: { lunarPhase?, timeOfDay? },
 *   journalId: string, // Reference to journal entry
 * }
 */

export const useCircuitManager = create(
    persist(
        (set, get) => ({
            // === Defined Circuits (Library) ===
            circuits: [],

            // === Completed Circuits (History) ===
            completedCircuits: [],

            // === Active Session ===
            activeSession: null,
            /*
            {
                circuitId: string,
                startTime: timestamp,
                currentExerciseIndex: number,
                exerciseStates: [
                    { exerciseId, startTime, duration, notes },
                    ...
                ]
            }
            */

            // ========================================
            // CIRCUIT LIBRARY ACTIONS
            // ========================================

            /**
             * Create a new circuit template
             */
            createCircuit: ({ name, description, exercises }) => {
                const now = Date.now();
                const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);

                const circuit = {
                    id: crypto?.randomUUID?.() || `circuit_${now}`,
                    name,
                    description,
                    exercises: exercises.map((ex, idx) => ({
                        ...ex,
                        id: ex.id || `ex_${idx}_${now}`
                    })),
                    totalDuration,
                    createdAt: now,
                };

                set(state => ({
                    circuits: [...state.circuits, circuit]
                }));

                return circuit;
            },

            /**
             * Get circuit by ID
             */
            getCircuit: (circuitId) => {
                return get().circuits.find(c => c.id === circuitId);
            },

            /**
             * Update circuit definition
             */
            updateCircuit: (circuitId, updates) => {
                set(state => ({
                    circuits: state.circuits.map(c =>
                        c.id === circuitId ? { ...c, ...updates } : c
                    )
                }));
            },

            /**
             * Delete circuit
             */
            deleteCircuit: (circuitId) => {
                set(state => ({
                    circuits: state.circuits.filter(c => c.id !== circuitId)
                }));
            },

            // ========================================
            // SESSION LIFECYCLE
            // ========================================

            /**
             * Begin practicing a circuit
             */
            beginCircuit: (circuitId, sessionMode = 'guided') => {
                const state = get();
                const circuit = state.getCircuit(circuitId);

                if (!circuit) {
                    console.warn(`Circuit ${circuitId} not found`);
                    return null;
                }

                const session = {
                    circuitId,
                    startTime: Date.now(),
                    currentExerciseIndex: 0,
                    sessionMode,
                    exerciseStates: circuit.exercises.map(ex => ({
                        exerciseId: ex.id,
                        exerciseName: ex.name,
                        plannedDuration: ex.duration,
                        actualDuration: null,
                        startTime: null,
                        endTime: null,
                        notes: null,
                    }))
                };

                set({ activeSession: session });
                return session;
            },

            /**
             * Start specific exercise in active circuit
             */
            startExercise: (exerciseIndex) => {
                const state = get();
                if (!state.activeSession) {
                    console.warn('No active circuit session');
                    return;
                }

                set(state => ({
                    activeSession: {
                        ...state.activeSession,
                        currentExerciseIndex: exerciseIndex,
                        exerciseStates: state.activeSession.exerciseStates.map((ex, idx) =>
                            idx === exerciseIndex
                                ? { ...ex, startTime: Date.now() }
                                : ex
                        )
                    }
                }));
            },

            /**
             * Complete current exercise and move to next
             */
            nextExercise: (notes = null) => {
                const state = get();
                if (!state.activeSession) return;

                const idx = state.activeSession.currentExerciseIndex;
                const endTime = Date.now();

                set(state => ({
                    activeSession: {
                        ...state.activeSession,
                        exerciseStates: state.activeSession.exerciseStates.map((ex, i) =>
                            i === idx
                                ? {
                                    ...ex,
                                    endTime,
                                    actualDuration: ex.startTime ? (endTime - ex.startTime) / 1000 / 60 : null,
                                    notes
                                }
                                : ex
                        ),
                        currentExerciseIndex: idx + 1
                    }
                }));
            },

            /**
             * Complete the entire circuit
             */
            completeCircuit: () => {
                const state = get();
                if (!state.activeSession) {
                    console.warn('No active circuit session');
                    return null;
                }

                const session = state.activeSession;
                const circuit = state.getCircuit(session.circuitId);

                // Mark final exercise as complete if still active
                const finalIdx = session.exerciseStates.length - 1;
                const exerciseStates = session.exerciseStates.map((ex, idx) =>
                    idx === finalIdx && !ex.endTime
                        ? {
                            ...ex,
                            endTime: Date.now(),
                            actualDuration: ex.startTime ? (Date.now() - ex.startTime) / 1000 / 60 : null
                        }
                        : ex
                );

                // Calculate total actual duration
                const totalActualDuration = exerciseStates.reduce((sum, ex) =>
                    sum + (ex.actualDuration || 0), 0
                );

                // Create completed circuit log
                const completedCircuitLog = {
                    id: crypto?.randomUUID?.() || `comp_${Date.now()}`,
                    circuitId: session.circuitId,
                    circuitName: circuit?.name || 'Unknown',
                    completionTime: new Date().toISOString(),
                    dateKey: getDateKey(),
                    startTime: session.startTime,
                    endTime: Date.now(),
                    sessionMode: session.sessionMode,
                    exercises: exerciseStates.map(ex => ({
                        exerciseId: ex.exerciseId,
                        exerciseName: ex.exerciseName,
                        plannedDuration: ex.plannedDuration,
                        actualDuration: ex.actualDuration,
                        notes: ex.notes
                    })),
                    totalPlannedDuration: circuit?.totalDuration || 0,
                    totalActualDuration,
                    metadata: {
                        lunarPhase: null, // To be filled by caller if available
                        timeOfDay: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    },
                    journalId: null // Will be set when journal entry is created
                };

                // Save to history
                set(state => ({
                    completedCircuits: [...state.completedCircuits, completedCircuitLog],
                    activeSession: null
                }));

                return completedCircuitLog;
            },

            /**
             * Abandon active circuit session
             */
            abandonCircuit: () => {
                set({ activeSession: null });
            },

            // ========================================
            // QUERIES
            // ========================================

            /**
             * Get all circuits
             */
            getAllCircuits: () => {
                return get().circuits;
            },

            /**
             * Get circuits completed on a specific date
             */
            getCompletedCircuitsForDate: (dateKey) => {
                return get().completedCircuits.filter(c => c.dateKey === dateKey);
            },

            /**
             * Get all completions for a specific circuit
             */
            getCircuitHistory: (circuitId) => {
                return get().completedCircuits.filter(c => c.circuitId === circuitId);
            },

            /**
             * Link completed circuit to journal entry
             * (Called by journal system after entry creation)
             */
            linkJournalEntry: (completedCircuitId, journalEntryId) => {
                set(state => ({
                    completedCircuits: state.completedCircuits.map(c =>
                        c.id === completedCircuitId
                            ? { ...c, journalId: journalEntryId }
                            : c
                    )
                }));
            },

            /**
             * Get active session
             */
            getActiveSession: () => {
                return get().activeSession;
            },

            /**
             * Check if currently in a circuit
             */
            isInCircuit: () => {
                return get().activeSession !== null;
            }
        }),
        {
            name: 'circuit-manager',
            version: 1,
        }
    )
);

export default useCircuitManager;
