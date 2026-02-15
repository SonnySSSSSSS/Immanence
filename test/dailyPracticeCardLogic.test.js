import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCurriculumCompletionState } from '../src/components/dailyPracticeCardLogic.js';

test('0/0 with no active curriculum does not count as complete', () => {
    const state = computeCurriculumCompletionState({
        activeCurriculumId: null,
        progress: { completed: 0, total: 0 },
    });

    assert.equal(state.isCurriculumActive, false);
    assert.equal(state.isCurriculumComplete, false);
});

