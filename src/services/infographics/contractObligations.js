import { getLocalDateKey } from '../../utils/dateUtils.js';
import { resolveCategoryIdFromSessionV2 } from './sessionCategory.js';
import { MATCH_POLICY } from '../../data/curriculumMatching.js';

// Adherence contract uses "did the obligation happen", not "was it perfectly on time":
// GREEN + RED both count as satisfied because RED is still within the 60-minute rail window.
export const CONTRACT_ADHERENCE_SATISFIED_STATUSES = Object.freeze(['green', 'red']);

/**
 * Parse "HH:mm" time string to minutes since midnight
 * Must stay aligned with curriculum rail/session snapshot semantics.
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
}

/**
 * Extract hour and minute from ISO timestamp in local timezone
 */
function getLocalMinutesFromISO(isoTime) {
    if (!isoTime) return null;
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) return null;
    return date.getHours() * 60 + date.getMinutes();
}

/**
 * Compute time delta: actual - scheduled (in minutes)
 * Positive = late, negative = early
 */
function computeDeltaMinutes(actualMinutes, scheduledMinutes) {
    return actualMinutes - scheduledMinutes;
}

/**
 * Determine status based on time delta
 * GREEN: |delta| <= 15
 * RED: 15 < |delta| <= 60
 * null (does not count): |delta| > 60
 */
function getDeltaStatus(deltaMinutes) {
    const absDelta = Math.abs(deltaMinutes);
    if (absDelta <= 15) return 'green';
    if (absDelta <= 60) return 'red';
    return null;
}

/**
 * Get day of week (0=Sun, 1=Mon, ..., 6=Sat) from local date string.
 * NOTE: This intentionally preserves existing rail behavior.
 */
function getDayOfWeek(dateKeyLocal) {
    const date = new Date(dateKeyLocal);
    return date.getDay();
}

/**
 * Compute curriculum day number for a given date
 */
function getCurriculumDayNumber(date, curriculumStartDate) {
    if (!curriculumStartDate) return null;
    const start = new Date(curriculumStartDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((target - start) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return null;
    return daysDiff + 1;
}

function resolveWindowRange({
    today = new Date(),
    windowDays = 14,
    windowStartLocalDateKey = null,
    windowEndLocalDateKey = null,
} = {}) {
    if (windowStartLocalDateKey && windowEndLocalDateKey) {
        return {
            windowStartLocalDateKey,
            windowEndLocalDateKey,
        };
    }

    const safeDays = Number.isFinite(windowDays) ? Math.max(1, Math.floor(windowDays)) : 14;
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (safeDays - 1));

    return {
        windowStartLocalDateKey: getLocalDateKey(startDate),
        windowEndLocalDateKey: getLocalDateKey(endDate),
    };
}

function enumerateDateKeys(windowStartLocalDateKey, windowEndLocalDateKey) {
    if (!windowStartLocalDateKey || !windowEndLocalDateKey) return [];
    if (windowStartLocalDateKey > windowEndLocalDateKey) return [];

    const cursor = new Date(windowStartLocalDateKey);
    const end = new Date(windowEndLocalDateKey);
    if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return [];

    const keys = [];
    while (cursor <= end) {
        keys.push(getLocalDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return keys;
}

function isSnapshotStatusCountable(status) {
    return status === 'green' || status === 'red';
}

function isStatusSatisfiedForAdherence(status) {
    return CONTRACT_ADHERENCE_SATISFIED_STATUSES.includes(status);
}

function getSessionDateKeyLocal(session) {
    const iso = session?.startedAt || null;
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return getLocalDateKey(d);
}

/**
 * Check if a session matches a curriculum leg's category/matchPolicy requirement.
 */
export function doesSessionMatchLegCategory(session, leg) {
    if (!leg || !leg.categoryId) return false;

    const sessionCategory = resolveCategoryIdFromSessionV2(session);
    if (sessionCategory === null) return false;
    if (sessionCategory !== leg.categoryId) return false;

    if (leg.matchPolicy === MATCH_POLICY.EXACT_PRACTICE) {
        if (!leg.practiceId || session.practiceId !== leg.practiceId) {
            return false;
        }
    }

    return true;
}

/**
 * Build a session predicate for a specific active path run.
 * Mirrors existing run-scoping fallback behavior for backward compatibility.
 */
export function createPathRunSessionFilter({
    runId = null,
    activePathId = null,
    startedAt = null,
} = {}) {
    const activePathStartMs = startedAt ? new Date(startedAt).getTime() : NaN;

    return (session) => {
        const sessionRunId = session?.pathContext?.runId || null;
        if (runId && sessionRunId) {
            return sessionRunId === runId;
        }

        const sessionPathId = session?.pathContext?.activePathId || null;
        if (!activePathId || !sessionPathId || sessionPathId !== activePathId) return false;

        const sessionAnchorIso = session?.startedAt || session?.endedAt || null;
        if (!sessionAnchorIso) return false;
        const sessionMs = new Date(sessionAnchorIso).getTime();
        if (Number.isNaN(sessionMs)) return false;

        return Number.isNaN(activePathStartMs) ? true : sessionMs >= activePathStartMs;
    };
}

/**
 * Shared contract-obligation model used by both:
 * - curriculum rail rendering
 * - navigation adherence + miss-state metrics
 */
export function computeContractObligationSummary({
    today = new Date(),
    windowDays = 14,
    windowStartLocalDateKey = null,
    windowEndLocalDateKey = null,
    selectedDaysOfWeek = null,
    selectedTimes = null,
    curriculumStoreState = null,
    progressStoreState = null,
    sessions = null,
    isSessionEligible = null,
} = {}) {
    const range = resolveWindowRange({
        today,
        windowDays,
        windowStartLocalDateKey,
        windowEndLocalDateKey,
    });

    const dayKeys = enumerateDateKeys(range.windowStartLocalDateKey, range.windowEndLocalDateKey);
    const precisionMode = curriculumStoreState?.precisionMode || 'curriculum';
    const hasFrozenSelectedDays = Array.isArray(selectedDaysOfWeek) && selectedDaysOfWeek.length > 0;
    const normalizedSelectedDays = hasFrozenSelectedDays
        ? selectedDaysOfWeek.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [];
    const offDaysOfWeek = hasFrozenSelectedDays
        // Active-run path: derive off-days from frozen selected days only.
        ? [0, 1, 2, 3, 4, 5, 6].filter((d) => !normalizedSelectedDays.includes(d))
        // Legacy/non-run fallback only. Do not use live offDaysOfWeek for path contracts.
        : (curriculumStoreState?.offDaysOfWeek || [0]);
    const practiceTimeSlots = Array.isArray(selectedTimes)
        ? selectedTimes
        : (curriculumStoreState?.practiceTimeSlots || []);
    const curriculumStartDate = curriculumStoreState?.curriculumStartDate || null;
    const getCurriculumDay = curriculumStoreState?.getCurriculumDay;
    const isVacation = progressStoreState?.vacation?.active || false;

    const sourceSessions = Array.isArray(sessions)
        ? sessions
        : (progressStoreState?.sessionsV2 || []);

    const completedSessions = sourceSessions
        .filter((session) => session?.completion === 'completed')
        .filter((session) => (typeof isSessionEligible === 'function' ? isSessionEligible(session) : true));

    const dayStates = [];
    const railDays = [];

    for (const dateKeyLocal of dayKeys) {
        const dayOfWeek = getDayOfWeek(dateKeyLocal);

        let dayStatus = 'gray';
        let isOffDay = false;
        let displayVacation = isVacation;
        let satisfiedSlots = [];
        let curriculumDayNumber = null;
        let obligations = 0;
        let satisfied = 0;
        let isObligationDay = false;

        if (precisionMode === 'advanced') {
            dayStatus = 'gray';
        } else if (isVacation) {
            dayStatus = 'gray';
            displayVacation = true;
        } else if (offDaysOfWeek.includes(dayOfWeek)) {
            dayStatus = 'gray';
            isOffDay = true;
        } else {
            curriculumDayNumber = getCurriculumDayNumber(new Date(dateKeyLocal), curriculumStartDate);

            if (!curriculumDayNumber) {
                dayStatus = 'gray';
            } else {
                const curriculumDay = typeof getCurriculumDay === 'function'
                    ? getCurriculumDay(curriculumDayNumber)
                    : null;

                if (!curriculumDay) {
                    dayStatus = 'gray';
                } else {
                    const requiredLegs = (curriculumDay.legs || []).filter((leg) => leg.required === true);

                    if (requiredLegs.length === 0) {
                        dayStatus = 'gray';
                    } else {
                        obligations = requiredLegs.length;
                        isObligationDay = true;

                        const sessionsThisDay = completedSessions.filter(
                            (session) => getSessionDateKeyLocal(session) === dateKeyLocal
                        );
                        const usedSessionIds = new Set();

                        satisfiedSlots = requiredLegs.map((leg) => {
                            const timeIndex = leg.legNumber - 1;
                            const time = practiceTimeSlots[timeIndex];
                            const scheduledMinutes = time ? parseTimeToMinutes(time) : null;

                            if (scheduledMinutes === null) {
                                return {
                                    legNumber: leg.legNumber,
                                    categoryId: leg.categoryId,
                                    matchPolicy: leg.matchPolicy,
                                    time: time || null,
                                    status: null,
                                    deltaMinutes: null,
                                    matchedSessionId: null,
                                };
                            }

                            let bestMatch = null;
                            let bestAbsDelta = Infinity;

                            for (const session of sessionsThisDay) {
                                if (usedSessionIds.has(session.id)) continue;

                                if (session.scheduleMatched) {
                                    if (
                                        session.scheduleMatched.legNumber === leg.legNumber &&
                                        isSnapshotStatusCountable(session.scheduleMatched.status)
                                    ) {
                                        const absDelta = Math.abs(session.scheduleMatched.deltaMinutes);
                                        if (absDelta < bestAbsDelta) {
                                            bestAbsDelta = absDelta;
                                            bestMatch = {
                                                session,
                                                deltaMinutes: session.scheduleMatched.deltaMinutes,
                                                status: session.scheduleMatched.status,
                                            };
                                        }
                                    }
                                    continue;
                                }

                                if (!doesSessionMatchLegCategory(session, leg)) {
                                    continue;
                                }

                                const actualMinutes = getLocalMinutesFromISO(session.startedAt);
                                if (actualMinutes === null) continue;

                                const deltaMin = computeDeltaMinutes(actualMinutes, scheduledMinutes);
                                const absDelta = Math.abs(deltaMin);
                                if (absDelta > 60) continue;

                                if (absDelta < bestAbsDelta) {
                                    bestAbsDelta = absDelta;
                                    bestMatch = {
                                        session,
                                        deltaMinutes: deltaMin,
                                        status: getDeltaStatus(deltaMin),
                                    };
                                }
                            }

                            if (bestMatch) {
                                usedSessionIds.add(bestMatch.session.id);
                                return {
                                    legNumber: leg.legNumber,
                                    categoryId: leg.categoryId,
                                    matchPolicy: leg.matchPolicy,
                                    time,
                                    status: bestMatch.status,
                                    deltaMinutes: bestMatch.deltaMinutes,
                                    matchedSessionId: bestMatch.session.id,
                                };
                            }

                            return {
                                legNumber: leg.legNumber,
                                categoryId: leg.categoryId,
                                matchPolicy: leg.matchPolicy,
                                time,
                                status: null,
                                deltaMinutes: null,
                                matchedSessionId: null,
                            };
                        });

                        const hasUnsatisfiedLeg = satisfiedSlots.some((slot) => slot.status === null);
                        if (hasUnsatisfiedLeg) {
                            dayStatus = 'blank';
                        } else {
                            const hasRed = satisfiedSlots.some((slot) => slot.status === 'red');
                            dayStatus = hasRed ? 'red' : 'green';
                        }

                        satisfied = satisfiedSlots.filter((slot) => isStatusSatisfiedForAdherence(slot.status)).length;
                    }
                }
            }
        }

        const daySatisfied = obligations > 0 ? satisfied === obligations : false;

        dayStates.push({
            dateKeyLocal,
            isObligationDay,
            obligations,
            satisfied,
            daySatisfied,
        });

        railDays.push({
            dateKeyLocal,
            dayOfWeek,
            isOffDay,
            isVacation: displayVacation,
            precisionMode,
            curriculumDayNumber,
            satisfiedSlots,
            dayStatus,
        });
    }

    const totalObligations = dayStates.reduce((sum, day) => sum + day.obligations, 0);
    const satisfiedObligations = dayStates.reduce((sum, day) => sum + day.satisfied, 0);
    const requiredDays = dayStates.filter((day) => day.isObligationDay).length;
    const satisfiedDays = dayStates.filter((day) => day.daySatisfied).length;

    return {
        windowStartLocalDateKey: range.windowStartLocalDateKey,
        windowEndLocalDateKey: range.windowEndLocalDateKey,
        totalObligations,
        satisfiedObligations,
        satisfiedDays,
        requiredDays,
        dayStates,
        railDays,
    };
}

/**
 * Contract miss rule: a day is missed if it is an obligation day and is not fully satisfied.
 */
export function computeContractMissState(dayStates = []) {
    if (!Array.isArray(dayStates) || dayStates.length === 0) {
        return { consecutiveMissedDays: 0, broken: false };
    }

    let consecutiveMissedDays = 0;

    for (let i = dayStates.length - 1; i >= 0; i--) {
        const day = dayStates[i];
        if (!day?.isObligationDay) continue;

        if (day.daySatisfied) {
            break;
        }

        consecutiveMissedDays++;
    }

    return {
        consecutiveMissedDays,
        broken: consecutiveMissedDays >= 2,
    };
}

/**
 * Strict day-completion metrics:
 * - daysPracticed: obligation days where all obligations are satisfied
 * - streakCurrent: consecutive satisfied obligation days up to window end (off-days skipped)
 * - streakBest: best consecutive satisfied obligation-day streak in window (off-days skipped)
 */
export function computeContractDayCompletionStats(dayStates = []) {
    if (!Array.isArray(dayStates) || dayStates.length === 0) {
        return { daysPracticed: 0, streakCurrent: 0, streakBest: 0 };
    }

    const obligationDays = dayStates.filter((day) => day?.isObligationDay);
    if (obligationDays.length === 0) {
        return { daysPracticed: 0, streakCurrent: 0, streakBest: 0 };
    }

    const daysPracticed = obligationDays.filter((day) => day.daySatisfied).length;

    let streakBest = 0;
    let running = 0;
    for (const day of obligationDays) {
        if (day.daySatisfied) {
            running += 1;
            if (running > streakBest) streakBest = running;
        } else {
            running = 0;
        }
    }

    let streakCurrent = 0;
    for (let i = obligationDays.length - 1; i >= 0; i--) {
        if (obligationDays[i].daySatisfied) {
            streakCurrent += 1;
            continue;
        }
        break;
    }

    return { daysPracticed, streakCurrent, streakBest };
}
