// src/state/historyStore.js
// History/undo functionality for modes before locking
import { create } from 'zustand';

const MAX_HISTORY_SIZE = 10;

export const useHistoryStore = create((set, get) => ({
    // History stacks per context (e.g., 'mirror', 'sword', 'mirror-observation')
    histories: {},

    // Current position in history for each context
    positions: {},

    /**
     * Save a snapshot to history
     * @param {string} context - History context identifier (e.g., 'mirror')
     * @param {any} state - State snapshot to save
     */
    pushHistory: (context, state) => {
        const { histories, positions } = get();

        const currentHistory = histories[context] || [];
        const currentPosition = positions[context] || -1;

        // If we're not at the end, truncate future history
        const newHistory = currentHistory.slice(0, currentPosition + 1);

        // Add new snapshot
        newHistory.push({
            timestamp: Date.now(),
            state: JSON.parse(JSON.stringify(state)), // Deep clone
        });

        // Limit history size
        const trimmedHistory = newHistory.slice(-MAX_HISTORY_SIZE);

        set({
            histories: {
                ...histories,
                [context]: trimmedHistory,
            },
            positions: {
                ...positions,
                [context]: trimmedHistory.length - 1,
            },
        });
    },

    /**
     * Undo to previous state
     * @param {string} context - History context identifier
     * @returns {any|null} Previous state or null if at start
     */
    undo: (context) => {
        const { histories, positions } = get();

        const history = histories[context] || [];
        const position = positions[context] ?? -1;

        if (position <= 0) {
            return null; // Already at start
        }

        const newPosition = position - 1;

        set({
            positions: {
                ...positions,
                [context]: newPosition,
            },
        });

        return history[newPosition]?.state || null;
    },

    /**
     * Redo to next state
     * @param {string} context - History context identifier
     * @returns {any|null} Next state or null if at end
     */
    redo: (context) => {
        const { histories, positions } = get();

        const history = histories[context] || [];
        const position = positions[context] ?? -1;

        if (position >= history.length - 1) {
            return null; // Already at end
        }

        const newPosition = position + 1;

        set({
            positions: {
                ...positions,
                [context]: newPosition,
            },
        });

        return history[newPosition]?.state || null;
    },

    /**
     * Check if undo is available
     * @param {string} context - History context identifier
     * @returns {boolean}
     */
    canUndo: (context) => {
        const { positions } = get();
        const position = positions[context] ?? -1;
        return position > 0;
    },

    /**
     * Check if redo is available
     * @param {string} context - History context identifier
     * @returns {boolean}
     */
    canRedo: (context) => {
        const { histories, positions } = get();
        const history = histories[context] || [];
        const position = positions[context] ?? -1;
        return position < history.length - 1;
    },

    /**
     * Clear history for a context
     * @param {string} context - History context identifier
     */
    clearHistory: (context) => {
        const { histories, positions } = get();

        const newHistories = { ...histories };
        const newPositions = { ...positions };

        delete newHistories[context];
        delete newPositions[context];

        set({
            histories: newHistories,
            positions: newPositions,
        });
    },

    /**
     * Get current history info
     * @param {string} context - History context identifier
     * @returns {object} Info about current history state
     */
    getHistoryInfo: (context) => {
        const { histories, positions } = get();
        const history = histories[context] || [];
        const position = positions[context] ?? -1;

        return {
            size: history.length,
            position: position + 1,
            canUndo: position > 0,
            canRedo: position < history.length - 1,
        };
    },
}));
