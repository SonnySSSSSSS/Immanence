// @ts-check

import { computeScheduleAnchorStartAt, normalizeAndSortTimeSlots } from '../utils/scheduleUtils.js';

/**
 * @typedef {object} NavigationScheduleContract
 * @property {number | null | undefined} practiceDaysPerWeek
 * @property {number | null | undefined} requiredTimeSlots
 * @property {number | null | undefined} requiredLegsPerDay
 * @property {number | null | undefined} maxLegsPerDay
 */

/**
 * @typedef {object} NavigationSchedule
 * @property {string[] | null | undefined} selectedTimes
 * @property {Array<number | string> | null | undefined} selectedDaysOfWeek
 * @property {Array<number | string> | null | undefined} activeDays
 * @property {number | null | undefined} practiceDaysPerWeek
 * @property {number | null | undefined} requiredTimeSlots
 * @property {number | null | undefined} requiredLegsPerDay
 * @property {number | null | undefined} maxLegsPerDay
 */

/** @typedef {NavigationSchedule & { selectedTimes: string[], selectedDaysOfWeek: number[], activeDays: number[] }} NormalizedNavigationSchedule */

/** @param {string | null | undefined} startedAt */
/** @param {number | null | undefined} durationDays */
/** @returns {string | null} */
export function computeEndsAt(startedAt, durationDays) {
    if (!startedAt || !durationDays) return null;
    const start = new Date(startedAt);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000));
    return end.toISOString();
}

/** @returns {string | null} */
export function getTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        return null;
    }
}

/** @param {unknown} [days=[]] */
/** @returns {number[]} */
export function normalizeDayOfWeekList(days = []) {
    const normalized = Array.isArray(days)
        ? days.map((d) => {
            if (Number.isInteger(d) && d >= 0 && d <= 6) return d;
            if (Number.isInteger(d) && d >= 1 && d <= 7) return d % 7;
            if (typeof d === 'string') {
                const lower = d.trim().toLowerCase();
                const byName = {
                    sun: 0, sunday: 0,
                    mon: 1, monday: 1,
                    tue: 2, tues: 2, tuesday: 2,
                    wed: 3, wednesday: 3,
                    thu: 4, thur: 4, thurs: 4, thursday: 4,
                    fri: 5, friday: 5,
                    sat: 6, saturday: 6,
                };
                if (Object.prototype.hasOwnProperty.call(byName, lower)) return byName[lower];
                const parsed = Number(lower);
                if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 7) return parsed % 7;
                if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) return parsed;
            }
            return null;
        }).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [];
    return [...new Set(normalized)].sort((a, b) => a - b);
}

/** @param {NavigationSchedule | null} [schedule] */
/** @returns {number[]} */
export function getFrozenScheduleDaysOfWeek(schedule = null) {
    const selectedDaysOfWeek = normalizeDayOfWeekList(schedule?.selectedDaysOfWeek || []);
    if (selectedDaysOfWeek.length > 0) return selectedDaysOfWeek;

    const activeDays = normalizeDayOfWeekList(schedule?.activeDays || []);
    if (activeDays.length > 0) {
        // NEVER CHANGE THIS: legacy runs missing selectedDaysOfWeek must still honor their frozen activeDays.
        // If this falls through to "every day", pre-start runs jump to Day 1 before the first scheduled practice date.
        return activeDays;
    }

    return [0, 1, 2, 3, 4, 5, 6];
}

/**
 * @param {{ startedAt?: string | null, selectedTimes?: string[], selectedDaysOfWeek?: number[] }} [arg0]
 * @returns {Date | null}
 */
export function getCanonicalScheduledStartDate({
    startedAt = null,
    selectedTimes = [],
    selectedDaysOfWeek = [],
} = {}) {
    if (!startedAt) return null;
    const rawStartDate = new Date(startedAt);
    if (Number.isNaN(rawStartDate.getTime())) return null;

    const normalizedTimes = normalizeAndSortTimeSlots(selectedTimes, { maxCount: 3 });
    const firstSlotTime = normalizedTimes[0] || null;
    if (!firstSlotTime) return rawStartDate;

    return computeScheduleAnchorStartAt({
        now: rawStartDate,
        firstSlotTime,
        selectedDaysOfWeek,
    });
}

/** @param {unknown[]} [offDays=[]] */
/** @returns {number[]} */
export function selectedDaysFromOffDays(offDays = []) {
    // LEGACY migration helper only. Do not use this for new run contract authoring.
    const offSet = new Set(normalizeDayOfWeekList(offDays));
    return [0, 1, 2, 3, 4, 5, 6].filter((day) => !offSet.has(day));
}

/**
 * @param {{ schedule?: NavigationSchedule | null, contract?: NavigationScheduleContract, maxLegsPerDay?: number, fallbackOffDays?: number[] }} [arg0]
 * @returns {NormalizedNavigationSchedule}
 */
export function normalizePersistedNavigationSchedule({
    schedule = null,
    contract = {},
    maxLegsPerDay = 3,
    fallbackOffDays = [0],
} = {}) {
    const selectedTimes = normalizeAndSortTimeSlots(schedule?.selectedTimes || [], {
        maxCount: maxLegsPerDay,
    });
    const selectedDaysOfWeek = normalizeDayOfWeekList(schedule?.selectedDaysOfWeek || []);
    const activeDays = normalizeDayOfWeekList(schedule?.activeDays || []);
    const frozenSelectedDaysOfWeek = selectedDaysOfWeek.length > 0
        ? selectedDaysOfWeek
        : (
            activeDays.length > 0
                ? activeDays
                : selectedDaysFromOffDays(fallbackOffDays)
        );

    return {
        ...(schedule || {}),
        selectedTimes,
        selectedDaysOfWeek: frozenSelectedDaysOfWeek,
        activeDays: frozenSelectedDaysOfWeek,
        practiceDaysPerWeek: schedule?.practiceDaysPerWeek ?? contract.practiceDaysPerWeek ?? null,
        requiredTimeSlots: schedule?.requiredTimeSlots ?? contract.requiredTimeSlots ?? null,
        requiredLegsPerDay: schedule?.requiredLegsPerDay ?? contract.requiredLegsPerDay ?? null,
        maxLegsPerDay: schedule?.maxLegsPerDay ?? contract.maxLegsPerDay ?? null,
    };
}

/**
 * @param {{ schedule?: NavigationSchedule | null, contract?: NavigationScheduleContract, fallbackOffDays?: number[] }} [arg0]
 * @returns {NormalizedNavigationSchedule}
 */
export function normalizeRehydratedNavigationSchedule({
    schedule = null,
    contract = {},
    fallbackOffDays = [0],
} = {}) {
    const selectedDaysOfWeek = normalizeDayOfWeekList(schedule?.selectedDaysOfWeek || []);
    const activeDays = normalizeDayOfWeekList(schedule?.activeDays || []);
    const frozenSelectedDaysOfWeek = selectedDaysOfWeek.length > 0
        ? selectedDaysOfWeek
        : (
            activeDays.length > 0
                ? activeDays
                : selectedDaysFromOffDays(fallbackOffDays)
        );

    return {
        ...(schedule || {}),
        selectedDaysOfWeek: frozenSelectedDaysOfWeek,
        activeDays: frozenSelectedDaysOfWeek,
        practiceDaysPerWeek: schedule?.practiceDaysPerWeek ?? contract.practiceDaysPerWeek ?? null,
        requiredTimeSlots: schedule?.requiredTimeSlots ?? contract.requiredTimeSlots ?? null,
        requiredLegsPerDay: schedule?.requiredLegsPerDay ?? contract.requiredLegsPerDay ?? null,
        maxLegsPerDay: schedule?.maxLegsPerDay ?? contract.maxLegsPerDay ?? null,
    };
}
