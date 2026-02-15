import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure deterministic tests for the dayIndex formula used in
 * navigationStore.computeProgressMetrics().
 *
 * Formula (from navigationStore.js:516-519):
 *   daysSinceStart = floor((todayDate - startDate) / 86400000)
 *   dayIndex = min(max(daysSinceStart + 1, 1), durationDays)
 *
 * 1-based: Day 1 on start day, clamped to [1, durationDays].
 */
function computeDayIndex(startDateKey, todayDateKey, durationDays) {
    const startDay = new Date(startDateKey);
    const today = new Date(todayDateKey);
    const daysSinceStart = Math.floor((today - startDay) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(daysSinceStart + 1, 1), durationDays);
}

test('dayIndex = 1 on start day', () => {
    const result = computeDayIndex('2026-02-01', '2026-02-01', 14);
    assert.equal(result, 1);
});

test('dayIndex = 2 on day after start', () => {
    const result = computeDayIndex('2026-02-01', '2026-02-02', 14);
    assert.equal(result, 2);
});

test('dayIndex = 7 on seventh calendar day', () => {
    const result = computeDayIndex('2026-02-01', '2026-02-07', 14);
    assert.equal(result, 7);
});

test('dayIndex = 14 on last day of 14-day contract', () => {
    const result = computeDayIndex('2026-02-01', '2026-02-14', 14);
    assert.equal(result, 14);
});

test('dayIndex clamps at durationDays (does not exceed 14 on day 15+)', () => {
    const result = computeDayIndex('2026-02-01', '2026-02-20', 14);
    assert.equal(result, 14);
});

test('dayIndex never goes below 1 even if todayKey equals startKey', () => {
    const result = computeDayIndex('2026-02-15', '2026-02-15', 14);
    assert.equal(result, 1);
});

test('dayIndex advances the same regardless of day-of-week (calendar math only)', () => {
    // Feb 1 2026 = Sunday, Feb 2 = Monday — both advance identically
    const sunday = computeDayIndex('2026-02-01', '2026-02-01', 14);
    const monday = computeDayIndex('2026-02-01', '2026-02-02', 14);
    assert.equal(sunday, 1);
    assert.equal(monday, 2);
});
