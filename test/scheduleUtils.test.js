import test from 'node:test';
import assert from 'node:assert/strict';

import { getLocalDateKey } from '../src/utils/dateUtils.js';
import { computeScheduleAnchorStartAt, normalizeAndSortTimeSlots } from '../src/utils/scheduleUtils.js';

test('normalizeAndSortTimeSlots normalizes, de-dupes, and sorts ascending', () => {
  const result = normalizeAndSortTimeSlots(['20:00', '9:00', '09:00', ' 08:30 ', null, 'bad'], { maxCount: 5 });
  assert.deepEqual(result, ['08:30', '09:00', '20:00']);
});

test('computeScheduleAnchorStartAt anchors to tomorrow when first slot window already passed', () => {
  const now = new Date(2026, 1, 9, 10, 22, 0, 0); // Feb 9, 2026 @ 10:22 local time
  const startAt = computeScheduleAnchorStartAt({ now, firstSlotTime: '09:00', lateWindowMin: 60 });
  assert.equal(getLocalDateKey(startAt), '2026-02-10');
});

test('computeScheduleAnchorStartAt anchors to today when within the late window', () => {
  const now = new Date(2026, 1, 9, 9, 30, 0, 0); // Feb 9, 2026 @ 09:30 local time
  const startAt = computeScheduleAnchorStartAt({ now, firstSlotTime: '09:00', lateWindowMin: 60 });
  assert.equal(getLocalDateKey(startAt), '2026-02-09');
});

