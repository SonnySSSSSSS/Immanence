// test/storeSyncInvariants.test.js
// Integration tests for the progress/navigation/curriculum three-way sync invariants.
//
// NOTE: Vitest 2.x is not compatible with rolldown-vite 7.2.5 — the SSR transform
// it generates references __vite_ssr_exportName__ which Vitest's module runner does
// not provide. Tests are written using Node's native test runner (node:test) to
// match the project's existing test infrastructure in this directory.
//
// Run: npm test
// Or:  node --test test/storeSyncInvariants.test.js

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeScheduleAnchorStartAt } from '../src/utils/scheduleUtils.js';
import { validatePathActivationSelections } from '../src/utils/pathContract.js';
import { getResumableNavigationPathId } from '../src/state/curriculumStore.js';
import { CONTRACT_ADHERENCE_SATISFIED_STATUSES } from '../src/services/infographics/contractObligations.js';

// ---------------------------------------------------------------------------
// 1. Schedule anchor invariant
//    "Day 1 is not the activation date — it is the first scheduled practice date."
//    Source: scheduleUtils.js computeScheduleAnchorStartAt ("NEVER CHANGE THIS" comment)
//    Note: scheduleUtils.test.js covers the "today is a practice day" case.
//    These tests cover the "today is NOT a practice day" case (the key invariant).
// ---------------------------------------------------------------------------

test('schedule anchor: moves to next scheduled day when activated on a non-practice day', () => {
  // 2024-01-07 is a Sunday (day 0). Practice schedule is Mon–Fri.
  // Activating on a non-practice day must NOT set Day 1 to today.
  const sunday = new Date(2024, 0, 7, 12, 0, 0); // Sunday noon
  const anchor = computeScheduleAnchorStartAt({
    now: sunday,
    firstSlotTime: '09:00',
    selectedDaysOfWeek: [1, 2, 3, 4, 5], // Mon–Fri
  });

  // Anchor must not land on Sunday
  assert.notEqual(anchor.getDay(), 0, 'anchor must not land on the non-practice activation day (Sunday)');
  // Must land on Monday — the next scheduled practice day
  assert.equal(anchor.getDay(), 1, 'anchor must land on Monday (next scheduled practice day)');
  // The anchor date must be strictly after the activation date
  assert.ok(anchor.getTime() > sunday.getTime(), 'anchor must be in the future relative to activation');
});

test('schedule anchor: stays on today when activated on a practice day before the slot expires', () => {
  // 2024-01-08 is a Monday (day 1). Slot at 09:00. Current time 08:30.
  // The slot window has not yet expired → Day 1 stays on today.
  const mondayMorning = new Date(2024, 0, 8, 8, 30, 0); // Monday 08:30
  const anchor = computeScheduleAnchorStartAt({
    now: mondayMorning,
    firstSlotTime: '09:00',
    selectedDaysOfWeek: [1, 2, 3, 4, 5],
  });

  assert.equal(anchor.getDay(), 1, 'anchor must stay on Monday');
  assert.equal(anchor.getFullYear(), 2024);
  assert.equal(anchor.getMonth(), 0); // January
  assert.equal(anchor.getDate(), 8, 'anchor must be the same calendar day as activation');
});

// ---------------------------------------------------------------------------
// 2. Path contract validation
//    validatePathActivationSelections must enforce the path's practiceDaysPerWeek
//    and requiredTimeSlots contract fields, rejecting invalid selections.
// ---------------------------------------------------------------------------

test('path contract: rejects fewer practice days than required', () => {
  const path = { id: 'test-path', contract: { practiceDaysPerWeek: 5 } };
  const result = validatePathActivationSelections(path, { selectedDaysOfWeek: [1, 2, 3] });
  assert.equal(result.ok, false, 'should reject fewer days than required');
  assert.match(result.error, /5/, 'error must mention the required count');
});

test('path contract: rejects more practice days than required', () => {
  const path = { id: 'test-path', contract: { practiceDaysPerWeek: 5 } };
  const result = validatePathActivationSelections(path, { selectedDaysOfWeek: [0, 1, 2, 3, 4, 5] });
  assert.equal(result.ok, false, 'should reject more days than required');
});

test('path contract: accepts exactly the required number of practice days', () => {
  const path = { id: 'test-path', contract: { practiceDaysPerWeek: 5 } };
  const result = validatePathActivationSelections(path, { selectedDaysOfWeek: [1, 2, 3, 4, 5] });
  assert.equal(result.ok, true, 'should accept exactly the required count');
  assert.equal(result.error, null);
});

test('path contract: rejects fewer time slots than required', () => {
  const path = { id: 'test-path', contract: { requiredTimeSlots: 2 } };
  const result = validatePathActivationSelections(path, { selectedTimes: ['09:00'] });
  assert.equal(result.ok, false, 'should reject fewer slots than required');
  assert.match(result.error, /2/, 'error must mention the required count');
});

test('path contract: accepts exactly the required number of time slots', () => {
  const path = { id: 'test-path', contract: { requiredTimeSlots: 2 } };
  const result = validatePathActivationSelections(path, { selectedTimes: ['09:00', '20:00'] });
  assert.equal(result.ok, true, 'should accept exactly the required count');
  assert.equal(result.error, null);
});

test('path contract: accepts any selection when contract has no constraints', () => {
  const path = { id: 'test-path', contract: {} };
  const result = validatePathActivationSelections(path, {
    selectedDaysOfWeek: [1, 2],
    selectedTimes: ['09:00'],
  });
  assert.equal(result.ok, true, 'unconstrained contract should accept any selection');
});

// ---------------------------------------------------------------------------
// 3. Curriculum/navigation coupling invariant
//    getResumableNavigationPathId couples curriculumStore state to the navigation
//    path. Both activeCurriculumId AND practiceTimeSlots must be present — either
//    alone is insufficient. This guards against partial state hydration causing
//    a path to resume before the user has completed schedule setup.
// ---------------------------------------------------------------------------

test('curriculum/navigation coupling: returns null when state is empty', () => {
  assert.equal(getResumableNavigationPathId({}), null);
});

test('curriculum/navigation coupling: returns null when activeCurriculumId is null', () => {
  assert.equal(getResumableNavigationPathId({ activeCurriculumId: null }), null);
});

test('curriculum/navigation coupling: returns null when curriculum matches but no time slots', () => {
  assert.equal(
    getResumableNavigationPathId({ activeCurriculumId: 'ritual-initiation-14-v2', practiceTimeSlots: [] }),
    null,
  );
});

test('curriculum/navigation coupling: returns null when curriculum matches but time slots absent', () => {
  assert.equal(
    getResumableNavigationPathId({ activeCurriculumId: 'ritual-initiation-14-v2' }),
    null,
  );
});

test('curriculum/navigation coupling: returns null when time slots set but curriculum id does not match', () => {
  assert.equal(
    getResumableNavigationPathId({ activeCurriculumId: 'some-other-curriculum', practiceTimeSlots: ['09:00'] }),
    null,
  );
});

test('curriculum/navigation coupling: returns initiation path id when both conditions are met', () => {
  assert.equal(
    getResumableNavigationPathId({ activeCurriculumId: 'ritual-initiation-14-v2', practiceTimeSlots: ['09:00'] }),
    'initiation',
  );
});

test('curriculum/navigation coupling: returns initiation path id with multiple time slots', () => {
  assert.equal(
    getResumableNavigationPathId({ activeCurriculumId: 'ritual-initiation-14-v2', practiceTimeSlots: ['09:00', '20:00'] }),
    'initiation',
  );
});

// ---------------------------------------------------------------------------
// 4. Precision rail adherence threshold contract
//    GREEN and RED both count as "adherence satisfied". RED means "within the
//    30-minute tolerance window" — still counts as a kept obligation.
//    If this is narrowed to ['green'] only, the adherence rate silently breaks
//    for sessions that are slightly off-schedule.
// ---------------------------------------------------------------------------

test('precision rail: green counts as adherence-satisfied', () => {
  assert.ok(CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes('green'));
});

test('precision rail: red also counts as adherence-satisfied (within 30-min tolerance window)', () => {
  assert.ok(CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes('red'));
});

test('precision rail: off-rail statuses do not count as adherence-satisfied', () => {
  assert.ok(!CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes('gray'));
  assert.ok(!CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes('blank'));
  assert.ok(!CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes(null));
});

test('precision rail: exactly two statuses count as adherence-satisfied (no silent additions)', () => {
  assert.equal(CONTRACT_ADHERENCE_SATISFIED_STATUSES.length, 2);
});
