import test from 'node:test';
import assert from 'node:assert/strict';

import { MATCH_POLICY } from '../src/data/curriculumMatching.js';
import {
  computeContractMissState,
  computeContractObligationSummary,
  CONTRACT_ADHERENCE_SATISFIED_STATUSES,
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

test('Scenario 1: off-day (GRAY) contributes zero obligations and is not a miss day', () => {
  const windowStartLocalDateKey = '2026-02-13';
  const windowEndLocalDateKey = '2026-02-15';
  const offDayDateKey = '2026-02-15';
  const offDayOfWeek = new Date(offDayDateKey).getDay();

  const curriculumStoreState = createCurriculumState({
    curriculumStartDate: '2026-02-13T09:00:00.000Z',
    offDaysOfWeek: [offDayOfWeek],
    practiceTimeSlots: ['09:00'],
    getCurriculumDay: (dayNumber) => ({
      dayNumber,
      legs: [createRequiredLeg(1, 'breathwork')],
    }),
  });

  const progressStoreState = createProgressState([
    {
      id: 's-green',
      completion: 'completed',
      startedAt: '2026-02-13T09:05:00.000Z',
      scheduleMatched: {
        legNumber: 1,
        status: 'green',
        deltaMinutes: 5,
      },
    },
  ]);

  const summary = computeContractObligationSummary({
    windowStartLocalDateKey,
    windowEndLocalDateKey,
    curriculumStoreState,
    progressStoreState,
  });

  const offDayState = summary.dayStates.find((d) => d.dateKeyLocal === offDayDateKey);
  assert.ok(offDayState, 'expected off-day state to exist');
  assert.equal(offDayState.isObligationDay, false);
  assert.equal(offDayState.obligations, 0);
  assert.equal(offDayState.satisfied, 0);

  const missState = computeContractMissState(summary.dayStates);
  assert.equal(missState.consecutiveMissedDays, 1);
  assert.equal(missState.broken, false);
});

test('Scenario 2: 2 obligations/day with only 1 matched leg yields 1/2 adherence for the day', () => {
  const dateKey = '2026-02-12';
  const curriculumStoreState = createCurriculumState({
    curriculumStartDate: '2026-02-12T09:00:00.000Z',
    practiceTimeSlots: ['09:00', '20:00'],
    getCurriculumDay: (dayNumber) => ({
      dayNumber,
      legs: [
        createRequiredLeg(1, 'breathwork'),
        createRequiredLeg(2, 'awareness'),
      ],
    }),
  });

  const progressStoreState = createProgressState([
    {
      id: 's-match-leg-1',
      completion: 'completed',
      startedAt: '2026-02-12T09:05:00.000Z',
      scheduleMatched: {
        legNumber: 1,
        status: 'green',
        deltaMinutes: 5,
      },
    },
    {
      id: 's-unmatched',
      completion: 'completed',
      startedAt: '2026-02-12T12:00:00.000Z',
      practiceId: 'breath',
      scheduleMatched: null,
    },
  ]);

  const summary = computeContractObligationSummary({
    windowStartLocalDateKey: dateKey,
    windowEndLocalDateKey: dateKey,
    curriculumStoreState,
    progressStoreState,
  });

  assert.equal(summary.totalObligations, 2);
  assert.equal(summary.satisfiedObligations, 1);
  assert.equal(Math.round((summary.satisfiedObligations / summary.totalObligations) * 100), 50);
  assert.equal(summary.dayStates[0].daySatisfied, false);
  assert.equal(summary.railDays[0].dayStatus, 'blank');
});

test('Scenario 3: contract summary and rail day statuses stay consistent over a 7-day window', () => {
  const windowStartLocalDateKey = '2026-02-09';
  const windowEndLocalDateKey = '2026-02-15';
  const offDayDateKey = '2026-02-12';
  const offDayOfWeek = new Date(offDayDateKey).getDay();

  const curriculumStoreState = createCurriculumState({
    curriculumStartDate: '2026-02-09T09:00:00.000Z',
    offDaysOfWeek: [offDayOfWeek],
    practiceTimeSlots: ['09:00'],
    getCurriculumDay: (dayNumber) => ({
      dayNumber,
      legs: [createRequiredLeg(1, 'breathwork')],
    }),
  });

  const progressStoreState = createProgressState([
    {
      id: 'd1-green',
      completion: 'completed',
      startedAt: '2026-02-09T09:02:00.000Z',
      scheduleMatched: { legNumber: 1, status: 'green', deltaMinutes: 2 },
    },
    {
      id: 'd2-red',
      completion: 'completed',
      startedAt: '2026-02-10T09:40:00.000Z',
      scheduleMatched: { legNumber: 1, status: 'red', deltaMinutes: 40 },
    },
    {
      id: 'd5-green',
      completion: 'completed',
      startedAt: '2026-02-13T09:00:00.000Z',
      scheduleMatched: { legNumber: 1, status: 'green', deltaMinutes: 0 },
    },
    {
      id: 'd7-red',
      completion: 'completed',
      startedAt: '2026-02-15T09:20:00.000Z',
      scheduleMatched: { legNumber: 1, status: 'red', deltaMinutes: 20 },
    },
  ]);

  const summary = computeContractObligationSummary({
    windowStartLocalDateKey,
    windowEndLocalDateKey,
    curriculumStoreState,
    progressStoreState,
  });

  const derivedFromRail = summary.railDays.reduce((acc, day) => {
    const obligations = day.dayStatus === 'gray' ? 0 : day.satisfiedSlots.length;
    const satisfied = day.satisfiedSlots.filter((slot) =>
      CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes(slot.status)
    ).length;
    return {
      totalObligations: acc.totalObligations + obligations,
      satisfiedObligations: acc.satisfiedObligations + satisfied,
      requiredDays: acc.requiredDays + (obligations > 0 ? 1 : 0),
      satisfiedDays: acc.satisfiedDays + (obligations > 0 && satisfied === obligations ? 1 : 0),
    };
  }, {
    totalObligations: 0,
    satisfiedObligations: 0,
    requiredDays: 0,
    satisfiedDays: 0,
  });

  assert.equal(derivedFromRail.totalObligations, summary.totalObligations);
  assert.equal(derivedFromRail.satisfiedObligations, summary.satisfiedObligations);
  assert.equal(derivedFromRail.requiredDays, summary.requiredDays);
  assert.equal(derivedFromRail.satisfiedDays, summary.satisfiedDays);

  summary.dayStates.forEach((dayState, index) => {
    const railDay = summary.railDays[index];
    assert.equal(dayState.dateKeyLocal, railDay.dateKeyLocal);
    if (railDay.dayStatus === 'gray') {
      assert.equal(dayState.isObligationDay, false);
      return;
    }
    assert.equal(dayState.isObligationDay, true);
    if (railDay.dayStatus === 'blank') {
      assert.equal(dayState.daySatisfied, false);
      return;
    }
    assert.ok(railDay.dayStatus === 'green' || railDay.dayStatus === 'red');
    assert.equal(dayState.daySatisfied, true);
  });
});
