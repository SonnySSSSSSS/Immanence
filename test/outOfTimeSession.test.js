import test from 'node:test';
import assert from 'node:assert/strict';

import { MATCH_POLICY } from '../src/data/curriculumMatching.js';
import {
    computeContractObligationSummary,
    computeContractDayCompletionStats,
} from '../src/services/infographics/contractObligations.js';

function createCurriculumState({
    curriculumStartDate,
    practiceTimeSlots = ['09:00'],
    offDaysOfWeek = [],
    getCurriculumDay,
}) {
    return {
        precisionMode: 'curriculum',
        offDaysOfWeek,
        practiceTimeSlots,
        curriculumStartDate,
        getCurriculumDay,
    };
}

function createProgressState(sessionsV2 = [], vacationActive = false) {
    return {
        vacation: { active: vacationActive },
        sessionsV2,
    };
}

function createRequiredLeg(legNumber, categoryId = 'breathwork') {
    return {
        legNumber,
        required: true,
        categoryId,
        matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
    };
}

const DAY_KEY = '2026-02-15';
const CURRICULUM_START = '2026-02-15T00:00:00.000Z';

function makeCurriculumState() {
    return createCurriculumState({
        curriculumStartDate: CURRICULUM_START,
        practiceTimeSlots: ['09:00'],
        getCurriculumDay: (dayNumber) => ({
            dayNumber,
            legs: [createRequiredLeg(1, 'breathwork')],
        }),
    });
}

test('session with satisfiedObligation=false does NOT satisfy obligation', () => {
    const summary = computeContractObligationSummary({
        windowStartLocalDateKey: DAY_KEY,
        windowEndLocalDateKey: DAY_KEY,
        curriculumStoreState: makeCurriculumState(),
        progressStoreState: createProgressState([
            {
                id: 's-out-of-time',
                completion: 'completed',
                startedAt: '2026-02-15T15:00:00.000Z', // 6 hours late (>60 min)
                practiceId: 'breath',
                practiceMode: 'breathwork',
                scheduleMatched: null,
                satisfiedObligation: false,
            },
        ]),
    });

    assert.equal(summary.totalObligations, 1, 'should have 1 obligation');
    assert.equal(summary.satisfiedObligations, 0, 'out-of-time session should NOT satisfy');
    assert.equal(summary.satisfiedDays, 0, 'day should NOT be satisfied');

    const stats = computeContractDayCompletionStats(summary.dayStates);
    assert.equal(stats.daysPracticed, 0, 'active days should be 0');
});

test('session with satisfiedObligation=true + green status DOES satisfy obligation', () => {
    const summary = computeContractObligationSummary({
        windowStartLocalDateKey: DAY_KEY,
        windowEndLocalDateKey: DAY_KEY,
        curriculumStoreState: makeCurriculumState(),
        progressStoreState: createProgressState([
            {
                id: 's-on-time',
                completion: 'completed',
                startedAt: '2026-02-15T09:05:00.000Z', // 5 min late (green)
                practiceId: 'breath',
                practiceMode: 'breathwork',
                scheduleMatched: {
                    legNumber: 1,
                    categoryId: 'breathwork',
                    matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
                    scheduledTime: '09:00',
                    deltaMinutes: 5,
                    status: 'green',
                    matchedAt: '2026-02-15T09:05:00.000Z',
                },
                satisfiedObligation: true,
            },
        ]),
    });

    assert.equal(summary.totalObligations, 1, 'should have 1 obligation');
    assert.equal(summary.satisfiedObligations, 1, 'on-time session should satisfy');
    assert.equal(summary.satisfiedDays, 1, 'day should be satisfied');

    const stats = computeContractDayCompletionStats(summary.dayStates);
    assert.equal(stats.daysPracticed, 1, 'active days should be 1');
});

test('legacy session without satisfiedObligation field works via time-delta fallback', () => {
    // Construct 09:10 in local timezone (not UTC) so delta computation yields +10 min
    const localNine10 = new Date(2026, 1, 15, 9, 10, 0).toISOString();

    const summary = computeContractObligationSummary({
        windowStartLocalDateKey: DAY_KEY,
        windowEndLocalDateKey: DAY_KEY,
        curriculumStoreState: makeCurriculumState(),
        progressStoreState: createProgressState([
            {
                id: 's-legacy',
                completion: 'completed',
                startedAt: localNine10, // 10 min late (green via fallback)
                practiceId: 'breath',
                practiceMode: 'breathwork',
                // No scheduleMatched, no satisfiedObligation (legacy session)
            },
        ]),
    });

    assert.equal(summary.totalObligations, 1, 'should have 1 obligation');
    assert.equal(summary.satisfiedObligations, 1, 'legacy session within time should satisfy via fallback');

    const stats = computeContractDayCompletionStats(summary.dayStates);
    assert.equal(stats.daysPracticed, 1, 'active days should be 1');
});

test('session with satisfiedObligation=true + red status DOES satisfy obligation', () => {
    const summary = computeContractObligationSummary({
        windowStartLocalDateKey: DAY_KEY,
        windowEndLocalDateKey: DAY_KEY,
        curriculumStoreState: makeCurriculumState(),
        progressStoreState: createProgressState([
            {
                id: 's-late-but-ok',
                completion: 'completed',
                startedAt: '2026-02-15T09:30:00.000Z', // 30 min late (red)
                practiceId: 'breath',
                practiceMode: 'breathwork',
                scheduleMatched: {
                    legNumber: 1,
                    categoryId: 'breathwork',
                    matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY,
                    scheduledTime: '09:00',
                    deltaMinutes: 30,
                    status: 'red',
                    matchedAt: '2026-02-15T09:30:00.000Z',
                },
                satisfiedObligation: true,
            },
        ]),
    });

    assert.equal(summary.totalObligations, 1);
    assert.equal(summary.satisfiedObligations, 1, 'red status should satisfy obligation');
    assert.equal(summary.satisfiedDays, 1);
});
