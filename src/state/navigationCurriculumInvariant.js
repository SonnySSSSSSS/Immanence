const hasOwnKeys = (value) => !!value && typeof value === 'object' && Object.keys(value).length > 0;

export function hasActiveCurriculumMarkers(curriculumState = {}) {
    return Boolean(
        curriculumState?.activeCurriculumId
        || curriculumState?.curriculumStartDate
        || hasOwnKeys(curriculumState?.dayCompletions)
        || hasOwnKeys(curriculumState?.legCompletions)
        || curriculumState?.activePracticeSession
        || curriculumState?.activePracticeLeg
        || curriculumState?.activePracticeStartedAt
        || curriculumState?.lastSessionFailed
    );
}

export function buildCurriculumInactivePatch() {
    return {
        activeCurriculumId: null,
        curriculumStartDate: null,
        dayCompletions: {},
        legCompletions: {},
        activePracticeSession: null,
        activePracticeLeg: null,
        activePracticeStartedAt: null,
        lastSessionFailed: false,
    };
}

export function reconcileCurriculumForNavigation({
    activePath = null,
    curriculumState = {},
    applyPatch = null,
    isDev = false,
    warn = console.warn,
} = {}) {
    if (activePath) {
        return { cleared: false, reason: 'navigation-active' };
    }

    if (!hasActiveCurriculumMarkers(curriculumState)) {
        return { cleared: false, reason: 'already-clear' };
    }

    const patch = buildCurriculumInactivePatch();
    if (typeof applyPatch === 'function') {
        applyPatch(patch);
    }

    if (isDev && typeof warn === 'function') {
        warn('[INVARIANT] Curriculum active without navigation activePath — auto-clearing.');
    }

    return { cleared: true, reason: 'cleared', patch };
}

