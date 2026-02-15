import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCurriculumForNavigation } from '../src/state/navigationCurriculumInvariant.js';

test('reconcile clears curriculum-active markers when navigation activePath is null', () => {
    const seededCurriculumState = {
        activeCurriculumId: 'ritual-initiation-14-v2',
        curriculumStartDate: '2026-02-01T06:00:00.000Z',
        dayCompletions: { 1: { completed: true } },
        legCompletions: { '1-1': { completed: true } },
        activePracticeSession: { dayNumber: 2, legNumber: 1 },
        activePracticeLeg: 1,
        activePracticeStartedAt: '2026-02-02T06:00:00.000Z',
        lastSessionFailed: true,
    };

    let reconciledState = { ...seededCurriculumState };
    const result = reconcileCurriculumForNavigation({
        activePath: null,
        curriculumState: seededCurriculumState,
        applyPatch: (patch) => {
            reconciledState = { ...reconciledState, ...patch };
        },
        isDev: true,
        warn: () => {},
    });

    assert.equal(result.cleared, true);
    assert.equal(reconciledState.activeCurriculumId, null);
    assert.equal(reconciledState.curriculumStartDate, null);
    assert.deepEqual(reconciledState.dayCompletions, {});
    assert.deepEqual(reconciledState.legCompletions, {});
    assert.equal(reconciledState.activePracticeSession, null);
    assert.equal(reconciledState.activePracticeLeg, null);
    assert.equal(reconciledState.activePracticeStartedAt, null);
    assert.equal(reconciledState.lastSessionFailed, false);
});

