// src/state/curriculumStore.js
// Curriculum Store (STUB for future development)
// Will contain full curriculum paths and exercise definitions

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════════════════
// STUB DATA
// ═══════════════════════════════════════════════════════════════════════════

export const FOUNDATION_CIRCUIT = {
    id: 'intro_circuit',
    name: 'Foundation Circuit',
    description: 'Balanced introduction to all three primary paths',
    totalDuration: 15, // minutes
    exercises: [
        {
            type: 'breath',
            name: 'Box Breathing',
            duration: 5,
            instructions: '4 counts in, 4 hold, 4 out, 4 hold',
        },
        {
            type: 'focus',
            name: 'Candle Gaze (Flame)',
            duration: 5,
            instructions: 'Steady focus on a single point',
        },
        {
            type: 'body',
            name: 'Body Scan',
            duration: 5,
            instructions: 'Awareness from crown to toes',
        },
    ],
    recommendedFor: 'foundation_cycle',
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useCurriculumStore = create(
    persist(
        (set, get) => ({
            // ════════════════════════════════════════════════════════════════
            // STATE (STUB)
            // ════════════════════════════════════════════════════════════════

            // Path curricula (placeholder)
            paths: {
                breath: {
                    name: 'Breath Path',
                    description: 'Pranayama and breath regulation',
                    exercises: [
                        // TODO: Full curriculum
                    ],
                },
                focus: {
                    name: 'Focus Path',
                    description: 'Concentration and mental clarity',
                    exercises: [
                        // TODO: Full curriculum
                    ],
                },
                body: {
                    name: 'Body Path',
                    description: 'Somatic awareness and embodied presence',
                    exercises: [
                        // TODO: Full curriculum
                    ],
                },
            },

            // Circuits (multi-path sessions)
            circuits: [FOUNDATION_CIRCUIT],

            // User progress within curriculum (placeholder)
            progress: {},

            // ════════════════════════════════════════════════════════════════
            // ACTIONS (STUB)
            // ════════════════════════════════════════════════════════════════

            /**
             * Get available circuits
             */
            getAvailableCircuits: () => {
                const state = get();
                return state.circuits;
            },

            /**
             * Get circuit by ID
             */
            getCircuit: (circuitId) => {
                const state = get();
                return state.circuits.find((c) => c.id === circuitId) || null;
            },

            /**
             * Get path curriculum (stub)
             */
            getPathCurriculum: (pathType) => {
                const state = get();
                return state.paths[pathType] || null;
            },

            // Dev helpers
            _devReset: () => {
                set({
                    paths: {
                        breath: { name: 'Breath Path', description: '', exercises: [] },
                        focus: { name: 'Focus Path', description: '', exercises: [] },
                        body: { name: 'Body Path', description: '', exercises: [] },
                    },
                    circuits: [FOUNDATION_CIRCUIT],
                    progress: {},
                });
            },
        }),
        {
            name: 'immanenceOS.curriculum',
            version: 1,
        }
    )
);
