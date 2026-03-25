import { normalizeAndSortTimeSlots } from '../utils/scheduleUtils.js';

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

export function resolveDailyPracticeScheduleState({
    activePath = null,
    activePathObj = null,
    practiceTimeSlots = [],
    onboardingComplete = false,
    activeCurriculumId = null,
    progress = null,
    hasPersistedCurriculumData,
} = {}) {
    const activeDays = normalizeScheduleActiveDays(
        activePath?.schedule?.selectedDaysOfWeek
            || activePath?.schedule?.activeDays
            || []
    );
    const navigationTimeSlots = normalizeAndSortTimeSlots(
        activePath?.schedule?.selectedTimes || [],
        { maxCount: activePath?.schedule?.maxLegsPerDay ?? 3 }
    );
    const curriculumTimeSlots = Array.isArray(practiceTimeSlots) ? practiceTimeSlots : [];
    const hasActivePath = Boolean(activePathObj) && navigationTimeSlots.length > 0;
    const preferredTimeSlots = hasActivePath ? navigationTimeSlots : curriculumTimeSlots;
    const showNoCurriculumSetupState = shouldShowNoCurriculumSetupState({
        activePathObj,
        activeCurriculumId,
        progress,
    });
    const needsSetup = !onboardingComplete && curriculumTimeSlots.length === 0;
    const shouldRenderPathOrSetupState = Boolean(
        hasActivePath
        || needsSetup
        || showNoCurriculumSetupState
        || (!onboardingComplete && hasPersistedCurriculumData === false)
    );

    return {
        activeDays,
        navigationTimeSlots,
        curriculumTimeSlots,
        preferredTimeSlots,
        hasActivePath,
        showNoCurriculumSetupState,
        needsSetup,
        shouldRenderPathOrSetupState,
        isSetupEmptyState: !activePathObj,
    };
}

function getWeekForDay(path, dayIndex) {
    if (!path?.weeks || !dayIndex) return null;
    const weekIndex = Math.ceil(dayIndex / 7);
    return path.weeks.find((week) => week.number === weekIndex) ?? null;
}

function normalizeListForSlots(list, slotCount) {
    if (!Array.isArray(list) || slotCount === 0) return [];
    const out = [];
    for (let idx = 0; idx < slotCount; idx += 1) {
        out.push(list[Math.min(idx, list.length - 1)]);
    }
    return out;
}

function resolvePracticeIdFromType(type) {
    if (!type) return null;
    const lower = type.toLowerCase();

    if (lower.includes('breath')) return 'breath';
    if (lower.includes('circuit')) return 'circuit';
    if (lower.includes('scan') || lower.includes('somatic')) return 'awareness';
    if (lower.includes('resonance') || lower.includes('sound')) return 'resonance';
    if (lower.includes('visualization') || lower.includes('photic')) return 'perception';
    if (lower.includes('feeling') || lower.includes('meditation')) return 'feeling';
    if (lower.includes('integration') || lower.includes('ritual')) return 'integration';

    return null;
}

function resolvePracticeIdFromEntry(entry) {
    if (!entry) return null;

    if (typeof entry === 'string' && !entry.includes('(') && !entry.includes(' ')) {
        return entry;
    }

    if (entry?.practiceId) {
        return entry.practiceId;
    }

    if (entry?.type) {
        return resolvePracticeIdFromType(entry.type);
    }

    if (typeof entry === 'string') {
        return resolvePracticeIdFromType(entry);
    }

    return null;
}

function extractDurationMinFromString(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/(\d+)\s*min/i);
    if (!match) return null;
    const minutes = Number(match[1]);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function extractBreathPresetKeyFromString(value) {
    if (typeof value !== 'string') return null;
    const lower = value.toLowerCase();
    if (lower.includes('box')) return 'box';
    if (lower.includes('resonance')) return 'resonance';
    return null;
}

function normalizeGuidanceSpec(guidance) {
    if (!guidance || typeof guidance !== 'object') return null;

    const audioUrl = typeof guidance.audioUrl === 'string' ? guidance.audioUrl.trim() : '';
    if (!audioUrl) return null;

    const startMode = guidance.startMode === 'manual' ? 'manual' : 'onPracticeStart';
    const resumeMode = guidance.resumeMode === 'restart' ? 'restart' : 'resume';
    const volumeRaw = Number(guidance.volume);
    const volume = Number.isFinite(volumeRaw) ? Math.min(1, Math.max(0, volumeRaw)) : undefined;

    return {
        audioUrl,
        startMode,
        resumeMode,
        ...(volume !== undefined ? { volume } : {}),
    };
}

function normalizeInstructionVideoSpec(video) {
    if (typeof video === 'string') {
        const url = video.trim();
        return url ? { url } : null;
    }

    if (!video || typeof video !== 'object') return null;

    const url = typeof video.url === 'string'
        ? video.url.trim()
        : (typeof video.videoUrl === 'string' ? video.videoUrl.trim() : '');
    if (!url) return null;

    const title = typeof video.title === 'string' ? video.title.trim() : '';
    const poster = typeof video.poster === 'string' ? video.poster.trim() : '';

    return {
        url,
        ...(title ? { title } : {}),
        ...(poster ? { poster } : {}),
    };
}

function normalizeBenchmarkPatternForLaunch(pattern) {
    if (!pattern || typeof pattern !== 'object') return null;

    const inhale = Number(pattern.inhale);
    const holdTop = Number(pattern.holdTop ?? pattern.hold1);
    const exhale = Number(pattern.exhale);
    const holdBottom = Number(pattern.holdBottom ?? pattern.hold2);

    if (
        !Number.isFinite(inhale)
        || !Number.isFinite(holdTop)
        || !Number.isFinite(exhale)
        || !Number.isFinite(holdBottom)
    ) {
        return null;
    }

    return {
        inhale,
        holdTop,
        exhale,
        holdBottom,
    };
}

function resolvePracticeLaunchFromEntry(entry) {
    if (!entry) return null;

    if (typeof entry === 'object') {
        const practiceId = entry.practiceId || (entry.type ? resolvePracticeIdFromType(entry.type) : null);
        if (!practiceId) return null;

        const durationMin = Number.isFinite(Number(entry.duration)) ? Number(entry.duration) : null;

        const practiceConfig = {};
        if (entry.pattern) practiceConfig.breathPattern = String(entry.pattern).toLowerCase();
        if (entry.breathPattern) practiceConfig.breathPattern = String(entry.breathPattern).toLowerCase();
        if (entry.variant) practiceConfig.variant = entry.variant;
        if (entry.circuitId) practiceConfig.circuitId = entry.circuitId;
        if (entry.stillness && typeof entry.stillness === 'object') practiceConfig.stillness = { ...entry.stillness };

        const practiceParamsPatch =
            entry.practiceParamsPatch && typeof entry.practiceParamsPatch === 'object'
                ? { ...entry.practiceParamsPatch }
                : {};
        const guidance = Object.prototype.hasOwnProperty.call(entry, 'guidance')
            ? normalizeGuidanceSpec(entry.guidance)
            : undefined;
        const guidanceVideoCandidate =
            entry.guidance && typeof entry.guidance === 'object'
                ? (
                    entry.guidance.instructionVideo
                    ?? entry.guidance.video
                    ?? (
                        typeof entry.guidance.videoUrl === 'string'
                            ? {
                                videoUrl: entry.guidance.videoUrl,
                                title: entry.guidance.videoTitle,
                                poster: entry.guidance.videoPoster,
                            }
                            : undefined
                    )
                )
                : undefined;
        const instructionVideo = Object.prototype.hasOwnProperty.call(entry, 'instructionVideo')
            ? normalizeInstructionVideoSpec(entry.instructionVideo)
            : (guidanceVideoCandidate !== undefined ? normalizeInstructionVideoSpec(guidanceVideoCandidate) : undefined);

        if (practiceId === 'breath' && practiceConfig.breathPattern) {
            practiceParamsPatch.breath = {
                ...(practiceParamsPatch.breath || {}),
                preset: practiceConfig.breathPattern,
            };
        }

        return {
            practiceId,
            durationMin: durationMin ?? undefined,
            practiceConfig: Object.keys(practiceConfig).length ? practiceConfig : undefined,
            practiceParamsPatch: Object.keys(practiceParamsPatch).length ? practiceParamsPatch : undefined,
            guidance,
            instructionVideo,
            overrides: entry.overrides || undefined,
            locks: entry.locks || undefined,
        };
    }

    if (typeof entry === 'string') {
        const practiceId = resolvePracticeIdFromEntry(entry);
        if (!practiceId) return null;

        const durationMin = extractDurationMinFromString(entry);
        const presetKey = practiceId === 'breath' ? extractBreathPresetKeyFromString(entry) : null;

        const practiceParamsPatch = {};
        if (presetKey) practiceParamsPatch.breath = { preset: presetKey };

        return {
            practiceId,
            durationMin: durationMin ?? undefined,
            practiceParamsPatch: Object.keys(practiceParamsPatch).length ? practiceParamsPatch : undefined,
        };
    }

    return null;
}

function resolvePracticeLaunchFromProgramLeg(leg) {
    if (!leg || typeof leg !== 'object') return null;

    const practiceId = resolvePracticeIdFromType(leg.practiceType) || leg.practiceId || null;
    if (!practiceId) return null;

    const practiceConfigRaw = leg.practiceConfig && typeof leg.practiceConfig === 'object'
        ? leg.practiceConfig
        : {};
    const durationMin = Number.isFinite(Number(practiceConfigRaw.duration))
        ? Number(practiceConfigRaw.duration)
        : null;
    const normalizedEntry = {
        practiceId,
        duration: durationMin ?? undefined,
        guidance: leg.guidance,
        instructionVideo: leg.instructionVideo
            ?? leg.guidance?.instructionVideo
            ?? leg.guidance?.video
            ?? (
                typeof leg.guidance?.videoUrl === 'string'
                    ? {
                        videoUrl: leg.guidance.videoUrl,
                        title: leg.guidance.videoTitle,
                        poster: leg.guidance.videoPoster,
                    }
                    : undefined
            ),
        practiceParamsPatch: leg.practiceParamsPatch,
        overrides: leg.overrides,
        locks: leg.locks,
    };

    if (practiceConfigRaw.breathPattern) normalizedEntry.breathPattern = practiceConfigRaw.breathPattern;
    if (practiceConfigRaw.variant) normalizedEntry.variant = practiceConfigRaw.variant;
    if (practiceConfigRaw.circuitId) normalizedEntry.circuitId = practiceConfigRaw.circuitId;
    if (practiceConfigRaw.stillness && typeof practiceConfigRaw.stillness === 'object') normalizedEntry.stillness = practiceConfigRaw.stillness;

    return resolvePracticeLaunchFromEntry(normalizedEntry);
}

export function resolveDailyPracticeSlotContent({
    activePathObj = null,
    scheduledDayIndex = null,
    scheduledWeekIndex = null,
    scheduledProgramDay = null,
    slotCount = 0,
    benchmark = null,
    getStartingPattern = null,
} = {}) {
    if (!activePathObj || !scheduledDayIndex) {
        return {
            slotLaunches: [],
            practiceLabels: [],
        };
    }

    const safeSlotCount = Number.isFinite(Number(slotCount)) ? Math.max(0, Number(slotCount)) : 0;
    const scheduledProgramLegs = Array.isArray(scheduledProgramDay?.legs)
        ? scheduledProgramDay.legs
        : null;

    let slotLaunches = [];
    if (safeSlotCount > 0) {
        const week = getWeekForDay(activePathObj, scheduledDayIndex);
        const weekPracticesRaw = Array.isArray(week?.practices) ? week.practices : null;
        const weekPracticesStructured = weekPracticesRaw && weekPracticesRaw.some((practice) => typeof practice === 'object')
            ? weekPracticesRaw
            : null;
        const fallbackPractices = Array.isArray(activePathObj?.practices) ? activePathObj.practices : null;

        const raw = normalizeListForSlots(
            scheduledProgramLegs ?? weekPracticesStructured ?? fallbackPractices ?? weekPracticesRaw ?? [],
            safeSlotCount
        );
        const resolved = raw.map((entry) => (
            scheduledProgramLegs
                ? resolvePracticeLaunchFromProgramLeg(entry)
                : resolvePracticeLaunchFromEntry(entry)
        ));

        if (activePathObj.showBreathBenchmark && benchmark && typeof getStartingPattern === 'function') {
            slotLaunches = resolved.map((slot) => {
                if (!slot || slot.practiceId !== 'breath') return slot;

                const normalizedStartingPattern = normalizeBenchmarkPatternForLaunch(getStartingPattern());
                if (!normalizedStartingPattern) return slot;

                return {
                    ...slot,
                    practiceParamsPatch: {
                        ...(slot.practiceParamsPatch || {}),
                        breath: {
                            ...(slot.practiceParamsPatch?.breath || {}),
                            pattern: normalizedStartingPattern,
                        },
                    },
                };
            });
        } else {
            slotLaunches = resolved;
        }
    }

    let practiceLabels = [];
    const weekIndex = scheduledWeekIndex || Math.ceil(scheduledDayIndex / 7);
    const week = activePathObj.weeks?.find((item) => item.number === weekIndex) || activePathObj.weeks?.[0];

    if (scheduledProgramLegs) {
        practiceLabels = scheduledProgramLegs.map((leg) => (
            leg?.label
            || leg?.description
            || leg?.practiceType
            || ''
        ));
    } else if (week?.focus) {
        const parts = week.focus.split(' + ').map((value) => value.trim());
        practiceLabels = parts.length > 1 ? parts : [week.focus];
    } else if (week?.practices && Array.isArray(week.practices)) {
        practiceLabels = week.practices.map((practice) => (
            typeof practice === 'string' ? practice : (practice.name || practice.type || '')
        ));
    }

    while (practiceLabels.length < safeSlotCount) {
        practiceLabels.push(practiceLabels[practiceLabels.length - 1] || practiceLabels[0] || '');
    }

    return {
        slotLaunches,
        practiceLabels: practiceLabels.slice(0, safeSlotCount),
    };
}
