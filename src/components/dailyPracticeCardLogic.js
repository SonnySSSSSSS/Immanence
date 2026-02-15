export function computeCurriculumCompletionState({
    activeCurriculumId = null,
    progress = null,
} = {}) {
    const completed = Number(progress?.completed);
    const total = Number(progress?.total);
    const safeCompleted = Number.isFinite(completed) ? completed : 0;
    const safeTotal = Number.isFinite(total) ? total : 0;

    const isCurriculumActive = Boolean(activeCurriculumId) && safeTotal > 0;
    const isCurriculumComplete = isCurriculumActive && safeCompleted >= safeTotal;

    return {
        completed: safeCompleted,
        total: safeTotal,
        isCurriculumActive,
        isCurriculumComplete,
    };
}

/**
 * Canonicalize schedule day values to JS Date.getDay() integers (0=Sun..6=Sat).
 * Supports legacy inputs (1..7 with 7=Sun, and short/long weekday strings).
 */
export function normalizeScheduleActiveDays(days = []) {
    const input = Array.isArray(days) ? days : [];
    const mapped = input.map((d) => {
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
            const n = Number(lower);
            if (Number.isInteger(n) && n >= 1 && n <= 7) return n % 7;
            if (Number.isInteger(n) && n >= 0 && n <= 6) return n;
        }
        return null;
    }).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

    return [...new Set(mapped)].sort((a, b) => a - b);
}

export function isScheduleActiveDay({ activeDays = [], todayDow = new Date().getDay() } = {}) {
    const normalized = normalizeScheduleActiveDays(activeDays);
    if (normalized.length === 0) return true; // legacy fallback: treat as always active when unknown
    return normalized.includes(todayDow);
}

export function shouldShowNoCurriculumSetupState({
    activePathObj = null,
    activeCurriculumId = null,
    progress = null,
} = {}) {
    const { total } = computeCurriculumCompletionState({
        activeCurriculumId,
        progress,
    });
    return !activePathObj && (!activeCurriculumId || total === 0);
}
