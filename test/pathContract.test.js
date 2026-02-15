import test from 'node:test';
import assert from 'node:assert/strict';

import { getPathById } from '../src/data/navigationData.js';
import { RITUAL_INITIATION_14_V2 } from '../src/data/ritualInitiation14v2.js';
import { MATCH_POLICY } from '../src/data/curriculumMatching.js';
import { getPathContract, validatePathActivationSelections } from '../src/utils/pathContract.js';
import { getScheduleConstraintForPath, validateSelectedTimes } from '../src/utils/scheduleSelectionConstraints.js';
import { computeContractObligationSummary } from '../src/services/infographics/contractObligations.js';

test('selecting 3 time slots fails strict 2-slot constraint', () => {
  const constraint = getScheduleConstraintForPath('initiation-2');
  const result = validateSelectedTimes(['06:00', '18:00', '20:00'], constraint);
  assert.equal(result.ok, false);
});

test('activation fails when selected times are not exactly 2', () => {
  const path = getPathById('initiation-2');
  const result = validatePathActivationSelections(path, {
    selectedDaysOfWeek: [0, 1, 2, 3, 4, 5],
    selectedTimes: ['06:00'],
  });
  assert.equal(result.ok, false);
});

test('activation fails when selected days are not exactly 6', () => {
  const path = getPathById('initiation-2');
  const result = validatePathActivationSelections(path, {
    selectedDaysOfWeek: [1, 2, 3, 4, 5],
    selectedTimes: ['06:00', '18:00'],
  });
  assert.equal(result.ok, false);
});

test('Initiation Path 2 uses a strict 14-day contract', () => {
  const path = getPathById('initiation-2');
  const contract = getPathContract(path);
  assert.equal(contract.totalDays, 14);
  assert.equal(contract.practiceDaysPerWeek, 6);
  assert.equal(contract.requiredTimeSlots, 2);
  assert.equal(contract.requiredLegsPerDay, 2);
  assert.equal(contract.maxLegsPerDay, 2);
});

test('Initiation v2 curriculum defines exactly 2 legs per day', () => {
  for (const day of RITUAL_INITIATION_14_V2.days) {
    assert.equal(day.legs.length, 2);
  }
});

test('obligation generator throws when required legs exceed maxLegsPerDay', () => {
  assert.throws(() => {
    computeContractObligationSummary({
      windowStartLocalDateKey: '2026-02-10',
      windowEndLocalDateKey: '2026-02-10',
      selectedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      selectedTimes: ['06:00', '18:00'],
      maxLegsPerDay: 2,
      curriculumStoreState: {
        precisionMode: 'curriculum',
        curriculumStartDate: '2026-02-10T06:00:00.000Z',
        getCurriculumDay: () => ({
          dayNumber: 1,
          legs: [
            { legNumber: 1, required: true, categoryId: 'breathwork', matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY },
            { legNumber: 2, required: true, categoryId: 'awareness', matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY },
            { legNumber: 3, required: true, categoryId: 'breathwork', matchPolicy: MATCH_POLICY.ANY_IN_CATEGORY },
          ],
        }),
      },
      progressStoreState: { vacation: { active: false }, sessionsV2: [] },
    });
  }, /exceed maxLegsPerDay/i);
});
