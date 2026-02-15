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

