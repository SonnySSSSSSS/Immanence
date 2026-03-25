import { treatiseChapters } from '../data/treatise.generated.js';
import { getScheduleConstraintForPath, validateSelectedTimes } from '../utils/scheduleSelectionConstraints.js';
import { getPathContract } from '../utils/pathContract.js';

export const ACCEPTANCE_STEP_VIDEO_MAP = Object.freeze({
    1: {
        title: 'The Mechanics of Meaning',
        videoUrl: '/videos/The_Mechanics_of_Meaning.mp4',
    },
    2: {
        title: 'Music: A Transmission of Consciousness',
        videoUrl: '/videos/Music__A_Transmission_of_Consciousness.mp4',
    },
});

export const ACCEPTANCE_PATH_ID = 'initiation';
export const TOTAL_STEPS = 5;
export const ORDERED_DAY_OPTIONS = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' },
];

export function normalizeInitiationPathIdentity(pathId) {
    return pathId === 'initiation-2' ? 'initiation' : pathId;
}

export function getSelectedDays({ selectedDaysOfWeekDraft, getSelectedDaysOfWeekDraft }) {
    const fromGetter = getSelectedDaysOfWeekDraft?.();
    const base = Array.isArray(fromGetter) ? fromGetter : selectedDaysOfWeekDraft;
    const normalized = Array.isArray(base)
        ? base.filter((dayValue) => Number.isInteger(dayValue) && dayValue >= 0 && dayValue <= 6)
        : [];

    return [...new Set(normalized)].sort((a, b) => a - b);
}

export function getNextSelectedDays({ selectedDays, dayValue, maxDays }) {
    if (selectedDays.includes(dayValue)) {
        return selectedDays.filter((selectedDay) => selectedDay !== dayValue);
    }

    if (selectedDays.length >= (maxDays ?? 7)) {
        return selectedDays;
    }

    return [...selectedDays, dayValue].sort((a, b) => a - b);
}

export function buildPathOverviewViewModel({
    path,
    activePath,
    resumablePathId,
    practiceTimeSlots,
    selectedDaysOfWeekDraft,
    getSelectedDaysOfWeekDraft,
    attemptBenchmarkDone,
    currentStep
}) {
    const isInitiationPath = path.id === ACCEPTANCE_PATH_ID;
    const isAcceptancePath = path.id === ACCEPTANCE_PATH_ID;
    const normalizedViewedPathId = normalizeInitiationPathIdentity(path.id);
    const normalizedActivePathId = normalizeInitiationPathIdentity(activePath?.activePathId ?? null);
    const normalizedResumablePathId = normalizeInitiationPathIdentity(resumablePathId);
    const contract = getPathContract(path);
    const selectedDays = getSelectedDays({
        selectedDaysOfWeekDraft,
        getSelectedDaysOfWeekDraft
    });
    const scheduleTimes = (practiceTimeSlots || []).filter(Boolean);
    const scheduleConstraint = getScheduleConstraintForPath(path.id);
    const scheduleValidation = validateSelectedTimes(scheduleTimes, scheduleConstraint);
    const requiredDays = contract.practiceDaysPerWeek;
    const daysValidation = isInitiationPath && Number.isInteger(requiredDays)
        ? {
            ok: selectedDays.length === requiredDays,
            error: selectedDays.length !== requiredDays
                ? `Select exactly ${requiredDays} active practice days. One rest day is required.`
                : null,
        }
        : { ok: true, error: null };
    const benchmarkValidation = path.showBreathBenchmark
        ? {
            ok: attemptBenchmarkDone,
            error: attemptBenchmarkDone ? null : 'Complete the breathing benchmark first.',
        }
        : { ok: true, error: null };
    const canBeginPath = scheduleValidation.ok && daysValidation.ok && benchmarkValidation.ok;
    const canAdvanceStep3 = daysValidation.ok && scheduleValidation.ok;
    const canAdvanceStep4 = benchmarkValidation.ok;
    const canAdvanceCurrentStep = currentStep === 3
        ? canAdvanceStep3
        : currentStep === 4
            ? canAdvanceStep4
            : true;
    const scheduleInstruction = scheduleConstraint?.requiredCount === 2 && scheduleConstraint?.maxCount === 2
        ? 'Select exactly 2 time slots for practice (morning and evening).'
        : 'Choose at least one time to begin this path.';

    return {
        isInitiationPath,
        isAcceptancePath,
        isViewedPathActive: normalizedViewedPathId === normalizedActivePathId,
        isViewedPathResumable: normalizedViewedPathId === normalizedResumablePathId,
        contract,
        orderedDayOptions: ORDERED_DAY_OPTIONS,
        selectedDays,
        scheduleTimes,
        scheduleConstraint,
        scheduleValidation,
        requiredDays,
        daysValidation,
        benchmarkValidation,
        canBeginPath,
        totalSteps: TOTAL_STEPS,
        canAdvanceCurrentStep,
        scheduleInstruction
    };
}

export function getAutoInstructionVideo({ isAcceptancePath, currentStep }) {
    return isAcceptancePath ? ACCEPTANCE_STEP_VIDEO_MAP[currentStep] ?? null : null;
}

export function getChapterTitle(chapterId) {
    const chapter = treatiseChapters.find((entry) => entry.id === chapterId);
    if (chapter) return chapter.title;

    return chapterId
        .replace(/chapter-/g, 'Chapter ')
        .replace(/-/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function normalizeChapterEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') return { chapterId: entry, durationMin: undefined };
    if (typeof entry === 'object') {
        const chapterId = entry.chapterId || entry.id || entry.sectionId || null;
        const durationMinRaw = entry.durationMin ?? entry.minutes ?? entry.min ?? undefined;
        const durationMin = typeof durationMinRaw === 'number' ? durationMinRaw : undefined;
        return chapterId ? { chapterId, durationMin } : null;
    }
    return null;
}

export function normalizeVideoEntry(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') return { videoId: entry, durationMin: undefined };
    if (typeof entry === 'object') {
        const videoId = entry.videoId || entry.id || null;
        const durationMinRaw = entry.durationMin ?? entry.minutes ?? entry.min ?? undefined;
        const durationMin = typeof durationMinRaw === 'number' ? durationMinRaw : undefined;
        return videoId ? { videoId, durationMin } : null;
    }
    return null;
}
