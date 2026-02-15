// src/services/infographics/curriculumRail.js
// Compute rolling precision rail for curriculum infographic.
//
// ARCHITECTURAL NOTE:
// Rail rendering, adherence, and miss-state must share one obligation model.
// Core matching/obligation logic lives in contractObligations.js.

import { useCurriculumStore } from '../../state/curriculumStore.js';
import { useProgressStore } from '../../state/progressStore.js';
import { computeContractObligationSummary } from './contractObligations.js';

/**
 * Get the main precision rail for curriculum.
 *
 * @param {Object} options
 * @param {Date} options.today - Reference date (default: now)
 * @param {number} options.windowDays - Rolling window length (default: 14)
 * @param {Object|null} options.curriculumStoreState - Optional injected state (tests/dev harness)
 * @param {Object|null} options.progressStoreState - Optional injected state (tests/dev harness)
 * @param {Array|null} options.sessions - Optional sessions override (tests/dev harness)
 * @param {Function|null} options.isSessionEligible - Optional session filter predicate
 *
 * @returns {Array} Rail entries:
 * {
 *   dateKeyLocal: "YYYY-MM-DD",
 *   dayOfWeek: 0-6 (0=Sun),
 *   isOffDay: boolean,
 *   isVacation: boolean,
 *   precisionMode: 'curriculum'|'advanced',
 *   curriculumDayNumber: number|null,
 *   satisfiedSlots: [...],
 *   dayStatus: 'gray'|'blank'|'green'|'red'
 * }
 */
export function getCurriculumPrecisionRail({
    today = new Date(),
    windowDays = 14,
    curriculumStoreState = null,
    progressStoreState = null,
    sessions = null,
    isSessionEligible = null,
} = {}) {
    const curriculumStore = curriculumStoreState || useCurriculumStore.getState();
    const progressStore = progressStoreState || useProgressStore.getState();

    const summary = computeContractObligationSummary({
        today,
        windowDays,
        curriculumStoreState: curriculumStore,
        progressStoreState: progressStore,
        sessions,
        isSessionEligible,
    });

    return summary.railDays;
}
