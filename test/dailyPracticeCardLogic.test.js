import test from 'node:test';
import assert from 'node:assert/strict';
import {
    computeCurriculumCompletionState,
    isScheduleActiveDay,
    normalizeScheduleActiveDays,
} from '../src/components/dailyPracticeCardLogic.js';

test('0/0 with no active curriculum does not count as complete', () => {
    const state = computeCurriculumCompletionState({
        activeCurriculumId: null,
        progress: { completed: 0, total: 0 },
    });

    assert.equal(state.isCurriculumActive, false);
    assert.equal(state.isCurriculumComplete, false);
});

test('normalizeScheduleActiveDays maps mixed legacy formats to canonical 0..6 integers', () => {
    const normalized = normalizeScheduleActiveDays(['Mon', 'sat', 7, '0', 3, 'thursday']);
    assert.deepEqual(normalized, [0, 1, 3, 4, 6]);
});

test('rest-day gating: Sunday is inactive when active days are Mon-Sat', () => {
    const isActive = isScheduleActiveDay({
        activeDays: [1, 2, 3, 4, 5, 6],
        todayDow: 0,
    });
    assert.equal(isActive, false);
});

test('rest-day gating is not bypassed by presence of time slots', () => {
    const activeDays = [1, 2, 3, 4, 5, 6];
    const hasTimeSlots = ['17:00', '21:00'].length > 0;
    const isActive = isScheduleActiveDay({ activeDays, todayDow: 0 });
    const shouldRenderLegs = hasTimeSlots && isActive;

    assert.equal(isActive, false);
    assert.equal(shouldRenderLegs, false);
});
