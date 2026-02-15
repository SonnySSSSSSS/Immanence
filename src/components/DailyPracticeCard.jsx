// src/components/DailyPracticeCard.jsx
import React, { useState, useMemo, useTransition } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useProgressStore } from '../state/progressStore.js';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { getPathById } from '../data/navigationData.js';
import { addDaysToDateKey, getLocalDateKey, parseDateKeyToUtcMs } from '../utils/dateUtils.js';
import { getStartWindowState, localDateTimeFromDateKeyAndTime, normalizeAndSortTimeSlots } from '../utils/scheduleUtils.js';
import { useAuthUser, getDisplayName } from "../state/useAuthUser";
import { CurriculumPrecisionRail } from './infographics/CurriculumPrecisionRail.jsx';
import { getProgramDefinition } from '../data/programRegistry.js';
import { isUiPickingActive } from '../dev/uiControlsCaptureManager.js';
import {
    computeCurriculumCompletionState,
    isScheduleActiveDay,
    normalizeScheduleActiveDays,
    shouldShowNoCurriculumSetupState,
} from './dailyPracticeCardLogic.js';

/**
 * THEME CONFIGURATION
 * Synchronized with CompactStatsCard for "Ancient Relic" aesthetic
 */
const THEME_CONFIG = {
    light: {
        accent: 'rgba(139, 159, 136, 0.85)',
        textMain: 'rgba(35, 20, 10, 0.98)',
        textSub: 'rgba(65, 45, 25, 0.9)',
        bgAsset: 'ancient_relic_focus.png',
        canvasGrain: 'canvas_grain.png',
        border: 'rgba(139, 115, 85, 0.25)',
        shadow: '0 12px 32px rgba(0, 0, 0, 0.10), 0 4px 12px rgba(0, 0, 0, 0.06)'
    },
    dark: {
        accent: 'var(--accent-color)',
        textMain: 'rgba(253, 251, 245, 0.95)',
        textSub: 'rgba(253, 251, 245, 0.5)',
        bgAsset: 'card_bg_comet_{stage}.png',  // Placeholder, will be replaced below
        border: 'var(--accent-20)',
        shadow: '0 12px 32px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.10)'
    }
};

/**
 * Adherence color: neutral gray at 0%, transitions to soft green when >0%.
 * Avoids competing with the START button's saturated accent.
 */
function getAdherenceColor(adherencePct, isLight) {
    if (Math.round(adherencePct) <= 0) {
        return isLight ? 'rgba(60, 50, 35, 0.45)' : 'rgba(253, 251, 245, 0.40)';
    }
    return isLight ? 'rgba(60, 110, 60, 0.75)' : 'rgba(120, 200, 140, 0.75)';
}

/**
 * Map practice type to canonical practiceId
 * Handles common variations in navigationData type names
 */
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

/**
 * Get the week object for a given dayIndex (1-based)
 */
function getWeekForDay(path, dayIndex) {
    if (!path?.weeks || !dayIndex) return null;
    const weekIndex = Math.ceil(dayIndex / 7); // 1-based
    return path.weeks.find(w => w.number === weekIndex) ?? null;
}

/**
 * Vertical meter for left-pane progression
 * Two stacked meters (Completion + Path) live in the wallpaper strip.
 */
function VerticalMeter({ label, valueText, progressRatio, isLight, progressBarColor, isHighlighted = false }) {
    const ratio = Math.max(0, Math.min(1, Number.isFinite(progressRatio) ? progressRatio : 0));

    const meterBackground = isLight ? 'rgba(250, 246, 238, 0.06)' : 'rgba(10, 12, 16, 0.22)';
    const meterBorder = isLight ? '1px solid rgba(160, 120, 60, 0.12)' : '1px solid rgba(120, 255, 180, 0.16)';
    const labelColor = isLight ? 'rgba(60, 50, 35, 0.62)' : 'rgba(253, 251, 245, 0.55)';
    const valueColor = isLight ? 'rgba(35, 20, 10, 0.92)' : 'rgba(253, 251, 245, 0.92)';
    const trackColor = isLight ? 'rgba(60, 50, 35, 0.14)' : 'rgba(255, 255, 255, 0.10)';
    const fillColor = progressBarColor;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    padding: '8px 8px 7px',
                    background: meterBackground,
                    border: isHighlighted ? `1px solid ${progressBarColor}` : meterBorder,
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: isLight
                        ? '0 2px 8px rgba(0, 0, 0, 0.06)'
                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
                aria-label={`${label}: ${valueText}`}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        flex: 1,
                        borderRadius: '12px',
                        background: trackColor,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: `${ratio * 100}%`,
                            background: fillColor,
                            boxShadow: isLight ? 'inset 0 0 0 1px rgba(0,0,0,0.02)' : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                            transition: 'height 420ms ease-out',
                        }}
                    />

                </div>

                <div
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 11,
                        lineHeight: 1,
                        color: valueColor,
                        textAlign: 'center',
                    }}
                >
                    {valueText}
                </div>

                <div
                    style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        fontFamily: 'var(--font-ui)',
                        color: labelColor,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}

/**
 * Normalize a list to match slot count
 * Pads by repeating the last element if necessary
 */
function normalizeListForSlots(list, slotCount) {
    if (!Array.isArray(list) || slotCount === 0) return [];
    const out = [];
    for (let i = 0; i < slotCount; i++) {
        out.push(list[Math.min(i, list.length - 1)]);
    }
    return out;
}

/**
 * Resolve practice ID from various entry formats
 * Supports: string (direct ID), object with .type or .practiceId
 */
function resolvePracticeIdFromEntry(entry) {
    if (!entry) return null;
    
    // Direct string ID
    if (typeof entry === 'string' && !entry.includes('(') && !entry.includes(' ')) {
        return entry; // Assume it's a practiceId
    }
    
    // Object with practiceId field
    if (entry?.practiceId) {
        return entry.practiceId;
    }
    
    // Object with type field (use type resolver)
    if (entry?.type) {
        return resolvePracticeIdFromType(entry.type);
    }
    
    // String description - try to infer from keywords
    if (typeof entry === 'string') {
        return resolvePracticeIdFromType(entry);
    }
    
    return null;
}

function extractDurationMinFromString(s) {
    if (typeof s !== 'string') return null;
    const m = s.match(/(\d+)\s*min/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function extractBreathPresetKeyFromString(s) {
    if (typeof s !== 'string') return null;
    const lower = s.toLowerCase();
    if (lower.includes('box')) return 'box';
    if (lower.includes('resonance')) return 'resonance';
    return null;
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

        const practiceParamsPatch =
            entry.practiceParamsPatch && typeof entry.practiceParamsPatch === 'object'
                ? { ...entry.practiceParamsPatch }
                : {};

        // Backward-compat convenience: allow shorthand breathPattern/pattern to map into breath preset.
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

export function DailyPracticeCard({ onStartPractice, onViewCurriculum, onNavigate, hasPersistedCurriculumData, onStartSetup, onboardingComplete: onboardingCompleteProp, practiceTimeSlots: practiceTimeSlotsProp, isTutorialTarget = false, showPerLegCompletion = true, showDailyCompletionNotice = false, showSessionMeter = true, debugShadowOff = false, debugBlurOff = false, debugBorderOff = false, debugMaskOff = false, devCardActive = null, devCardCarouselId = null }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.viewportMode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];

    const dataCardActive = import.meta.env.DEV && typeof devCardActive === 'boolean' ? String(devCardActive) : undefined;
    const dataCardCarousel = import.meta.env.DEV && devCardCarouselId ? String(devCardCarouselId) : undefined;
    
    // Navigation path fallback
    const activePathId = useNavigationStore(s => s.activePath?.activePathId ?? null);
    const activePathObj = activePathId ? getPathById(activePathId) : null;
    const isInitiationV2Path = activePathObj?.tracking?.curriculumId === 'ritual-initiation-14-v2';
    const activePath = useNavigationStore(s => s.activePath);
    const todayDow = new Date().getDay();
    const frozenActiveDays = normalizeScheduleActiveDays(
        activePath?.schedule?.selectedDaysOfWeek
            || activePath?.schedule?.activeDays
            || []
    );
    const isActiveDay = isScheduleActiveDay({ activeDays: frozenActiveDays, todayDow });
    const isRestDayToday = Boolean(activePathObj) && !isActiveDay;
    const times = normalizeAndSortTimeSlots(
        activePath?.schedule?.selectedTimes || [],
        { maxCount: activePath?.schedule?.maxLegsPerDay ?? 3 }
    ); // ["06:00","20:00"]

    // Today's session tracking (using local date key for timezone correctness, scoped to current run)
    const todayKey = getLocalDateKey();
    const sessionsV2 = useProgressStore(s => s.sessionsV2 || []);

    const startDayKey = useMemo(() => {
        if (!activePath?.startedAt) return todayKey;
        const d = new Date(activePath.startedAt);
        if (Number.isNaN(d.getTime())) return todayKey;
        return getLocalDateKey(d);
    }, [activePath?.startedAt, todayKey]);

    const displayDayKey = useMemo(() => {
        if (times.length === 0 || !activePath?.startedAt) return todayKey;

        const activeRunId = activePath?.runId ?? null;
        const activePathIdForRun = activePath?.activePathId ?? null;
        const activePathStartMs = activePath?.startedAt ? new Date(activePath.startedAt).getTime() : NaN;

        const isSessionInActiveRun = (session) => {
            const sessionRunId = session?.pathContext?.runId ?? null;
            if (activeRunId && sessionRunId) {
                return sessionRunId === activeRunId;
            }

            const sessionPathId = session?.pathContext?.activePathId ?? null;
            if (!activePathIdForRun || !sessionPathId || sessionPathId !== activePathIdForRun) return false;

            const sessionAnchorIso = session?.startedAt || session?.endedAt || null;
            if (!sessionAnchorIso) return false;
            const sessionMs = new Date(sessionAnchorIso).getTime();
            if (Number.isNaN(sessionMs)) return false;
            return Number.isNaN(activePathStartMs) ? true : sessionMs >= activePathStartMs;
        };

        const baseKey = startDayKey > todayKey ? startDayKey : todayKey;
        const isFutureScheduledDay = baseKey > todayKey;

        const dayIndexForKey = (() => {
            const fromMs = parseDateKeyToUtcMs(startDayKey);
            const toMs = parseDateKeyToUtcMs(baseKey);
            if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return 1;
            return Math.max(1, Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1);
        })();

        const completedSlots = new Set();
        for (const s of sessionsV2) {
            if (s?.completion !== 'completed') continue;
            if (!isSessionInActiveRun(s)) continue;

            const sessionDayIndexRaw = s?.pathContext?.dayIndex;
            const sessionDayIndex = Number(sessionDayIndexRaw);
            const hasSessionDayIndex = Number.isFinite(sessionDayIndex);
            if (hasSessionDayIndex && sessionDayIndex !== dayIndexForKey) continue;

            if (!hasSessionDayIndex) {
                const sessionAnchorIso = s?.startedAt || s?.endedAt || null;
                if (!sessionAnchorIso) continue;
                if (getLocalDateKey(new Date(sessionAnchorIso)) !== baseKey) continue;
            }

            const slotIndexRaw = s?.pathContext?.slotIndex;
            const slotIndex = Number(slotIndexRaw);
            if (Number.isFinite(slotIndex) && slotIndex >= 0 && slotIndex < times.length) {
                completedSlots.add(slotIndex);
                continue;
            }

            const slotTime = typeof s?.pathContext?.slotTime === 'string' ? s.pathContext.slotTime.substring(0, 5) : null;
            if (slotTime) {
                const idx = times.indexOf(slotTime);
                if (idx >= 0) completedSlots.add(idx);
            }
        }

        const completedAllSlots = completedSlots.size >= times.length && times.length > 0;
        if (!isFutureScheduledDay && completedAllSlots) {
            return addDaysToDateKey(baseKey, 1) || baseKey;
        }

        const lastSlotTime = times[times.length - 1];
        const lastSlotScheduledAt = localDateTimeFromDateKeyAndTime(baseKey, lastSlotTime);
        const { expired } = lastSlotScheduledAt
            ? getStartWindowState({ now: new Date(), scheduledAt: lastSlotScheduledAt })
            : { expired: false };

        if (!isFutureScheduledDay && expired && completedSlots.size < times.length) {
            return addDaysToDateKey(baseKey, 1) || baseKey;
        }

        return baseKey;
    }, [times, activePath?.startedAt, activePath?.runId, activePath?.activePathId, sessionsV2, todayKey, startDayKey]);

    const displayDayIndex = useMemo(() => {
        if (!activePath?.startedAt) return 1;
        const fromMs = parseDateKeyToUtcMs(startDayKey);
        const toMs = parseDateKeyToUtcMs(displayDayKey);
        if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return 1;
        return Math.max(1, Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000)) + 1);
    }, [activePath?.startedAt, startDayKey, displayDayKey]);

    const displaySessions = useMemo(() => {
        const activeRunId = activePath?.runId || null;
        const activePathIdForRun = activePath?.activePathId || null;
        const activePathStartMs = activePath?.startedAt ? new Date(activePath.startedAt).getTime() : NaN;

        const isSessionInActiveRun = (session) => {
            const sessionRunId = session?.pathContext?.runId || null;
            if (activeRunId && sessionRunId) {
                return sessionRunId === activeRunId;
            }

            // Fallback for legacy/orphaned records missing runId.
            const sessionPathId = session?.pathContext?.activePathId ?? null;
            if (!activePathIdForRun || !sessionPathId || sessionPathId !== activePathIdForRun) return false;

            const sessionAnchorIso = session?.startedAt || session?.endedAt || null;
            if (!sessionAnchorIso) return false;
            const sessionMs = new Date(sessionAnchorIso).getTime();
            if (Number.isNaN(sessionMs)) return false;
            return Number.isNaN(activePathStartMs) ? true : sessionMs >= activePathStartMs;
        };

        return sessionsV2.filter((s) => {
            return isSessionInActiveRun(s);
        });
    }, [sessionsV2, activePath?.runId, activePath?.activePathId, activePath?.startedAt]);

    const completedSlotIndices = useMemo(() => {
        const set = new Set();
        for (const s of displaySessions) {
            if (s?.completion !== 'completed') continue;

            const sessionDayIndexRaw = s?.pathContext?.dayIndex;
            const sessionDayIndex = Number(sessionDayIndexRaw);
            const hasSessionDayIndex = Number.isFinite(sessionDayIndex);
            if (hasSessionDayIndex && sessionDayIndex !== displayDayIndex) continue;

            if (!hasSessionDayIndex) {
                const sessionAnchorIso = s?.startedAt || s?.endedAt || null;
                if (!sessionAnchorIso) continue;
                if (getLocalDateKey(new Date(sessionAnchorIso)) !== displayDayKey) continue;
            }

            const slotIndexRaw = s?.pathContext?.slotIndex;
            const slotIndex = Number(slotIndexRaw);
            if (Number.isFinite(slotIndex) && slotIndex >= 0 && slotIndex < times.length) {
                set.add(slotIndex);
                continue;
            }

            const slotTime = typeof s?.pathContext?.slotTime === 'string' ? s.pathContext.slotTime.substring(0, 5) : null;
            if (slotTime) {
                const idx = times.indexOf(slotTime);
                if (idx >= 0) set.add(idx);
            }
        }
        return set;
    }, [displaySessions, displayDayIndex, displayDayKey, times]);

    const completedCount = completedSlotIndices.size;

    const nextIndex = useMemo(() => {
        for (let i = 0; i < times.length; i++) {
            if (!completedSlotIndices.has(i)) return i;
        }
        return times.length;
    }, [times.length, completedSlotIndices]);
     
    // Deterministic "today complete" flag: all expected slots completed
    const isScheduleComplete = useMemo(
        () => times.length > 0 && completedCount >= times.length,
        [times.length, completedCount]
    );
    
    // Backward compat: allDone is same as isScheduleComplete
    const allDone = isScheduleComplete;

    // Progress metrics (time + adherence)
    const computeProgressMetrics = useNavigationStore(s => s.computeProgressMetrics);
    const computeMissState = useNavigationStore(s => s.computeMissState);
    const restartPath = useNavigationStore(s => s.restartPath);
    const abandonPath = useNavigationStore(s => s.abandonPath);
    
    const metrics = useMemo(() => computeProgressMetrics(), [computeProgressMetrics, activePath?.startedAt, sessionsV2.length]);

    const pathDayIndexDisplay = metrics?.dayIndex ?? 1;

    const pathDayProgressRatio = metrics.durationDays > 0 ? pathDayIndexDisplay / metrics.durationDays : 0;
    const missState = useMemo(() => computeMissState(), [
        computeMissState,
        sessionsV2.length,
        activePath?.runId,
        activePath?.startedAt,
        activePath?.activePathId,
        activePath?.schedule?.selectedTimes?.length,
    ]);

    // Benchmark data for breath practices
    const benchmark = useBreathBenchmarkStore(s => s.benchmark);
    const getStartingPattern = useBreathBenchmarkStore(s => s.getStartingPattern);
    const hasBenchmark = useBreathBenchmarkStore(s => s.hasBenchmark);

    // Canonical practice launches for each slot (practiceId + duration + params)
    const slotLaunches = useMemo(() => {
        if (!activePathObj || !metrics.dayIndex || times.length === 0) return [];

        const week = getWeekForDay(activePathObj, metrics.dayIndex);

        // Prefer structured practices, but many week.practices entries are descriptive strings.
        const weekPracticesRaw = Array.isArray(week?.practices) ? week.practices : null;
        const weekPracticesStructured = weekPracticesRaw && weekPracticesRaw.some(p => typeof p === 'object')
            ? weekPracticesRaw
            : null;
        const fallbackPractices = Array.isArray(activePathObj?.practices) ? activePathObj.practices : null;

        const raw = normalizeListForSlots(weekPracticesStructured ?? fallbackPractices ?? weekPracticesRaw ?? [], times.length);
        const resolved = raw.map(resolvePracticeLaunchFromEntry);

        // If path requires benchmark and user has completed it, add breath cycle patterns
        if (activePathObj.showBreathBenchmark && benchmark) {
            return resolved.map(slot => {
                if (!slot || slot.practiceId !== 'breath') return slot;

                // Calculate starting pattern (75% of benchmark)
                const startingPattern = getStartingPattern();
                if (!startingPattern) return slot;

                // Add the pattern to practiceParamsPatch
                return {
                    ...slot,
                    practiceParamsPatch: {
                        ...(slot.practiceParamsPatch || {}),
                        breath: {
                            ...(slot.practiceParamsPatch?.breath || {}),
                            pattern: startingPattern,
                        },
                    },
                };
            });
        }

        return resolved;
    }, [activePathObj, metrics.dayIndex, times.length, benchmark, getStartingPattern]);

    // Practice names for each slot (based on current week)
    const practiceLabels = useMemo(() => {
        if (!activePathObj || !metrics.dayIndex) return [];

        const weekIndex = Math.ceil(metrics.dayIndex / 7);
        const week = activePathObj.weeks?.find(w => w.number === weekIndex) || activePathObj.weeks?.[0];

        if (!week) return [];

        // Extract practice labels from week.focus or week.practices
        let labels = [];
        if (week.focus) {
            // If focus is a string like "Morning breath (7min) + Evening circuit (15min)", split by " + "
            const parts = week.focus.split(' + ').map(s => s.trim());
            labels = parts.length > 1 ? parts : [week.focus];
        } else if (week.practices && Array.isArray(week.practices)) {
            labels = week.practices.map(p => typeof p === 'string' ? p : (p.name || p.type || ''));
        }

        // Pad or repeat to match number of times
        while (labels.length < times.length) {
            labels.push(labels[labels.length - 1] || labels[0] || '');
        }

        return labels.slice(0, times.length);
    }, [activePathObj, metrics.dayIndex, times.length]);

    // Calculate slot dates based on path start time and current time
    const slotDates = useMemo(() => {
        if (times.length === 0 || !activePath?.startedAt) return [];
        return times.map(() => displayDayKey);
    }, [times, activePath?.startedAt, displayDayKey]);

    const [missedLegWarning, setMissedLegWarning] = useState(null);
    const [_isPending, startTransition] = useTransition();

    const theme = useTheme();
    const currentStage = theme?.stage || 'Flame';
    const stageLower = currentStage.toLowerCase();
    const primaryHex = theme?.accent?.primary || '#4ade80';
    const progressBarColor = theme?.ui?.progressBar || '#4ade80';

    const maybeShadow = (shadow) => (debugShadowOff ? 'none' : shadow);
    const maybeBlur = (blur) => (debugBlurOff ? 'none' : blur);
    const maybeBorder = (border) => (debugBorderOff ? 'none' : border);
    const clipOverflow = debugMaskOff ? 'visible' : 'hidden';

    const {
        onboardingComplete: storeOnboardingComplete,
        activeCurriculumId,
        getCurrentDayNumber,
        getTodaysPractice,
        getProgress,
        getStreak,
        getDayLegsWithStatus,
        curriculumStartDate,
        setActivePracticeSession,
        _devReset,
        practiceTimeSlots: storePracticeTimeSlots,
        lastSessionFailed,
        clearLastSessionFailed,
        activePracticeSession = null,
        legCompletions = null,
    } = useCurriculumStore();

    const onboardingComplete = onboardingCompleteProp ?? storeOnboardingComplete;
    const practiceTimeSlots = practiceTimeSlotsProp ?? storePracticeTimeSlots;
    const progressSnapshot = getProgress();
    const {
        completed: curriculumCompletedCount,
        total: curriculumTotalCount,
        isCurriculumActive,
        isCurriculumComplete,
    } = computeCurriculumCompletionState({
        activeCurriculumId,
        progress: progressSnapshot,
    });
    const showNoCurriculumSetupState = shouldShowNoCurriculumSetupState({
        activePathObj,
        activeCurriculumId,
        progress: progressSnapshot,
    });

    const needsSetup = !onboardingComplete && (!practiceTimeSlots || practiceTimeSlots.length === 0);

    const user = useAuthUser();
    const displayName = getDisplayName(user);

    // Show path-based daily card when an active path with scheduled times exists,
    // regardless of onboarding status — prevents falling through to stale curriculum modal
    const hasActivePath = activePathObj && times.length > 0;

    if (hasActivePath || needsSetup || showNoCurriculumSetupState || (!onboardingComplete && hasPersistedCurriculumData === false)) {
        const bgAssetUrl = `${import.meta.env.BASE_URL}bg/practice-breath-mandala.png`;
        const isSetupEmptyState = !activePathObj;

        return (
            <div
                className="w-full relative transition-all duration-700 ease-in-out"
                style={{
                    ...(isSanctuary ? {} : {
                        maxWidth: '430px',
                        margin: '0 auto',
                    }),
                    ...(isSanctuary && { width: '100%' }),
                }}
            >
                <div
                    className="w-full relative"
                    style={{
                        borderRadius: '24px',
                        overflow: 'visible',
                        boxShadow: maybeShadow(isLight
                            ? '0 14px 34px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.06)'
                            : `0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px ${primaryHex}22`),
                    }}
                >
                 <div
                     data-card="true"
                     data-card-id="dailyPractice"
                     data-card-active={dataCardActive}
                     data-card-carousel={dataCardCarousel}
                     className="im-card w-full relative dpBlurSurface"
                     style={{
                         borderRadius: '24px',
                         overflow: clipOverflow,
                        background: isLight
                            ? (isSetupEmptyState ? 'rgba(250, 246, 238, 0.96)' : 'rgba(250, 246, 238, 0.92)')
                            : (isSetupEmptyState ? 'rgba(10, 12, 16, 0.72)' : 'rgba(10, 12, 16, 0.58)'),
                         border: maybeBorder(isLight ? '1px solid rgba(160, 120, 60, 0.2)' : '1px solid var(--accent-30)'),
                         '--dp-radius': '24px',
                         // Set inset-only shadow via CSS var + !important class to prevent accidental depth shadows on this layer.
                         '--dp-inset-shadow': isLight
                             ? 'inset 0 1px 0 rgba(255,255,255,0.22)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        backdropFilter: isLight ? 'none' : maybeBlur('blur(16px)'),
                        WebkitBackdropFilter: isLight ? 'none' : maybeBlur('blur(16px)'),
                        isolation: 'isolate',
                    }}
                >
                        {/* Inner decorative border - matches practice card styling */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                top: '8px',
                                left: '8px',
                                right: '8px',
                                bottom: '8px',
                                border: isLight ? '1px solid rgba(160, 120, 60, 0.15)' : '1px solid var(--accent-25)',
                                borderRadius: '14px',
                                zIndex: 10,
                            }}
                        />
                        <div className="glassCardContent">
                        <div className="dpClipSurface">
                        <div
                            className="absolute inset-0 pointer-events-none dpRadiusInherit"
                            style={{
                                backgroundImage: `url(${bgAssetUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: isSetupEmptyState ? 0.72 : 1,
                                filter: isLight ? (isSetupEmptyState ? 'saturate(0.95)' : 'saturate(1.1)') : 'none',
                                transition: 'all 0.7s ease-in-out',
                            }}
                        />

                        <div className="absolute inset-0 pointer-events-none dpRadiusInherit" style={{
                            background: isLight
                                ? (isSetupEmptyState
                                    ? 'linear-gradient(180deg, rgba(250, 246, 238, 0.58) 0%, rgba(250, 246, 238, 0.78) 100%)'
                                    : 'linear-gradient(180deg, rgba(250, 246, 238, 0.42) 0%, rgba(250, 246, 238, 0.62) 100%)')
                                : (isSetupEmptyState
                                    ? 'linear-gradient(180deg, rgba(20, 15, 25, 0.66) 0%, rgba(20, 15, 25, 0.84) 100%)'
                                    : 'linear-gradient(180deg, rgba(20, 15, 25, 0.48) 0%, rgba(20, 15, 25, 0.72) 100%)')
                        }} />

                        {!isSetupEmptyState && (
                            <div
                                className="absolute"
                                style={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 'clamp(320px, 70%, 380px)',
                                    zIndex: 5,
                                    pointerEvents: 'none',
                                }}
                            >
                                <div className="w-full h-full relative">
                                    <div
                                        className="absolute flex flex-col pointer-events-none"
                                        style={{
                                            top: '12px',
                                            left: '12px',
                                            right: '12px',
                                            bottom: '12px',
                                            justifyContent: 'flex-start',
                                            alignItems: showSessionMeter ? 'center' : 'stretch',
                                            gap: showSessionMeter ? '12px' : '0px',
                                        }}
                                    >
                                        {showSessionMeter && (
                                            <div style={{ width: '72px', flex: 2, minHeight: '110px' }}>
                                                <VerticalMeter
                                                    label="SESSION"
                                                    valueText={`${completedCount}/${times.length}`}
                                                    progressRatio={times.length > 0 ? completedCount / times.length : 0}
                                                    isLight={isLight}
                                                    progressBarColor={progressBarColor}
                                                    isHighlighted={shouldHighlightCompletion}
                                                />
                                            </div>
                                        )}

                                        {metrics.durationDays > 0 && (
                                            <div style={showSessionMeter ? { width: '72px', flex: 3, minHeight: '140px' } : { width: '100%', flex: 1, minHeight: '100%', height: '100%' }}>
                                                <VerticalMeter
                                                    label="DAY"
                                                    valueText={`${pathDayIndexDisplay}/${metrics.durationDays}`}
                                                    progressRatio={pathDayProgressRatio}
                                                    isLight={isLight}
                                                    progressBarColor={progressBarColor}
                                                    isHighlighted={pathDayProgressRatio >= 1}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* Right content panel */}
                        <div
                            className={`relative z-10 overflow-hidden flex flex-col ${isSetupEmptyState ? 'w-full max-w-full min-w-0' : 'ml-auto w-[380px] max-w-[70%] min-w-[320px]'}`}
                            style={{
                                background: isSetupEmptyState
                                    ? (isLight ? 'rgba(250, 246, 238, 0.55)' : 'rgba(0, 0, 0, 0.18)')
                                    : 'transparent',
                                borderLeft: isSetupEmptyState
                                    ? 'none'
                                    : (isLight ? '1px solid rgba(160, 120, 60, 0.1)' : '1px solid var(--accent-15)'),
                                color: isLight ? '#3c3020' : '#fdfbf5',
                            }}
                        >
                            {isLight && (
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-40"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/parchment_blank.png)`,
                                        backgroundSize: 'cover',
                                        mixBlendMode: 'multiply',
                                    }}
                                />
                            )}

                            <div className="px-6 sm:px-7 pt-4 sm:pt-5 pb-4 sm:pb-5 relative z-10 flex flex-col flex-1">
                                <div className="absolute inset-0 pointer-events-none" style={{
                                    background: isLight
                                        ? (isSetupEmptyState
                                            ? 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.06), transparent 32%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.06), transparent 32%)'
                                            : 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.12), transparent 30%)')
                                        : (isSetupEmptyState
                                            ? 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.03), transparent 32%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.03), transparent 32%)'
                                            : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.06), transparent 30%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 30%)')
                                }} />

                                {!activePathObj ? (
                                    <div className="flex flex-col justify-center flex-1">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.32em] opacity-60" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                                                Today's Practice
                                            </div>
                                            <div className="text-lg font-black tracking-wide" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                                Setup required
                                            </div>
                                            <div className="text-[12px] opacity-80 leading-snug mt-3" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                No curriculum is saved in this browser yet. Start setup to choose a path and set your practice times.
                                            </div>
                                        </div>

                                        <div className="mt-6 sm:mt-7 -translate-y-2.5 transform flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => onStartSetup?.()}
                                                className="px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-60)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                    color: '#fff',
                                                    boxShadow: '0 3px 10px var(--accent-30)',
                                                }}
                                            >
                                                Start Setup
                                            </button>
                                        </div>

                                        <div className="mt-6 w-full">
                                            <img
                                                src={`${import.meta.env.BASE_URL}enter%20temple.png`}
                                                alt="Enter temple"
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '180px',
                                                    objectFit: 'contain',
                                                    opacity: isLight ? 0.82 : 0.72,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : missState.broken ? (
                                    <div className="text-center">
                                        <div className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>PATH STATUS</div>
                                        <div className="mt-4 text-lg font-semibold" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>Path Broken</div>
                                        <div className="mt-2 text-sm opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>Missed {missState.consecutiveMissedDays} consecutive days.</div>
                                        <div className="mt-6 flex flex-col gap-3">
                                            <button
                                                onClick={() => {
                                                    console.log('[DailyPracticeCard] Restart Path clicked');
                                                    restartPath();
                                                }}
                                                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                    color: '#fff',
                                                    boxShadow: '0 3px 10px var(--accent-30)',
                                                }}
                                            >
                                                Restart Path
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('[DailyPracticeCard] Abandon Path clicked');
                                                    if (window.confirm('Are you sure you want to abandon this path? All progress will be lost.')) {
                                                        abandonPath();
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                                                style={{
                                                    background: isLight ? 'rgba(60, 50, 35, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                                    color: isLight ? 'rgba(60, 50, 35, 0.7)' : 'rgba(253, 251, 245, 0.7)',
                                                    border: isLight ? '1px solid rgba(60, 50, 35, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)',
                                                }}
                                            >
                                                Abandon Path
                                            </button>
                                        </div>
                                    </div>
                                ) : isRestDayToday ? (
                                    <div className="text-center">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{
                                            color: isLight ? 'rgba(60, 50, 35, 0.5)' : 'var(--accent-60)',
                                            letterSpacing: '0.08em'
                                        }}>
                                            Today's Practice
                                        </div>
                                        <div className="mt-2 text-xl font-bold tracking-tight" style={{
                                            fontFamily: 'var(--font-display)',
                                            color: isLight ? '#3c3020' : 'var(--accent-color)',
                                        }}>
                                            Rest Day
                                        </div>
                                        <div className="mt-2 text-sm opacity-80" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                            No contract obligations today.
                                        </div>
                                        <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                            <img
                                                src={`${import.meta.env.BASE_URL}off%20day.png`}
                                                alt="Rest day"
                                                style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '16px', opacity: 0.9 }}
                                            />
                                        </div>
                                        <div className="mt-4 pt-3 border-t" style={{ borderColor: isLight ? 'rgba(180, 140, 60, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}>
                                            <CurriculumPrecisionRail />
                                        </div>
                                    </div>
                                ) : allDone ? (
                                    <div className="text-center">
                                        <div className="text-lg font-semibold" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>Schedule complete</div>
                                        <div className="mt-2 text-sm opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>Great job on your {completedCount} session{completedCount !== 1 ? 's' : ''}!</div>
                                    </div>
                                ) : times.length > 0 ? (
                                    <div>
                                        {/* TODAY'S PRACTICE label - matches curriculum style */}
                                        <div className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{
                                            color: isLight ? 'rgba(60, 50, 35, 0.5)' : 'var(--accent-60)',
                                            letterSpacing: '0.08em'
                                        }}>
                                            Today's Practice
                                        </div>

                                        {/* Path title - matches curriculum "Test Program" style */}
                                        <div className="mt-2 text-xl font-bold tracking-tight" style={{
                                            fontFamily: 'var(--font-display)',
                                            color: isLight ? '#3c3020' : 'var(--accent-color)',
                                        }}>
                                            {activePathObj.title}
                                        </div>

                                        {/* Precision Rail Infographic */}
                                        <div className="mt-4 pt-3 border-t" style={{ borderColor: isLight ? 'rgba(180, 140, 60, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}>
                                            <CurriculumPrecisionRail />
                                        </div>

                                        <div className="mt-4 space-y-5">
                                            {times.map((time, idx) => {
                                                const isDone = completedSlotIndices.has(idx);
                                                const slotDateKey = slotDates[idx] || todayKey;
                                                // Check time window for this slot using the correct date
                                                const scheduledAt = localDateTimeFromDateKeyAndTime(slotDateKey, time);
                                                const { tooEarly, expired } = scheduledAt ? getStartWindowState({ now: new Date(), scheduledAt }) : { tooEarly: false, expired: false };
                                                const isOutsideWindow = tooEarly || expired;
                                                // Check if benchmark is required but not completed
                                                const requiresBenchmark = activePathObj?.showBreathBenchmark
                                                    && !isInitiationV2Path
                                                    && slotLaunches[idx]?.practiceId === 'breath';
                                                const benchmarkMissing = requiresBenchmark && !hasBenchmark();
                                                // Each slot opens independently based on its own time window (allows partial day completion)
                                                const isActionable = !isDone && !isOutsideWindow && !benchmarkMissing && slotLaunches[idx]?.practiceId;
                                                // Format the date for display
                                                const slotDate = new Date(`${slotDateKey}T00:00:00`);
                                                const dateStr = slotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                const legNumber = idx + 1;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="rounded-2xl border p-4 flex items-center gap-3 transition-all"
                                                        style={{
                                                            borderColor: isLight ? 'rgba(160, 120, 60, 0.18)' : 'var(--accent-15)',
                                                            background: isLight
                                                                ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                                                                : 'linear-gradient(135deg, rgba(30, 25, 35, 0.95) 0%, rgba(24, 20, 30, 0.92) 100%)',
                                                            boxShadow: isLight
                                                                ? '0 6px 18px rgba(120, 90, 60, 0.1)'
                                                                : '0 10px 30px rgba(0,0,0,0.45)',
                                                            opacity: isDone ? 0.7 : 1,
                                                        }}
                                                    >
                                                        {/* Leg Number / Status */}
                                                        <div
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 transition-all"
                                                            style={{
                                                                background: isDone
                                                                    ? 'linear-gradient(135deg, var(--accent-color), var(--accent-60))'
                                                                    : (isLight ? 'rgba(160, 120, 60, 0.1)' : 'rgba(255, 255, 255, 0.08)'),
                                                                color: isDone ? '#fff' : (isLight ? '#3c3020' : '#fdfbf5'),
                                                                boxShadow: 'none',
                                                                transform: 'scale(1)',
                                                            }}
                                                        >
                                                            {isDone ? '✓' : legNumber}
                                                        </div>

                                                        {/* Leg Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] leading-snug" style={{ color: isLight ? 'rgba(60, 50, 35, 0.7)' : 'rgba(253,251,245,0.55)' }}>
                                                                {dateStr}
                                                            </div>
                                                            {practiceLabels[idx] && (
                                                                <div className="text-sm font-bold leading-tight mt-1" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                                                    {practiceLabels[idx]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Action - matches curriculum styling */}
                                                        {!isDone ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                {/* Time label */}
                                                                <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>
                                                                    {time}
                                                                </div>
                                                                {/* Status text */}
                                                                {expired && (
                                                                    <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: isLight ? '#8b7b63' : 'rgba(253,251,245,0.55)' }}>
                                                                        Window Passed
                                                                    </div>
                                                                )}
                                                                {isActionable && (
                                                                    <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--accent-color)' }}>
                                                                        Next Up
                                                                    </div>
                                                                )}
                                                                {/* Wrapper catches shift-click even when button disabled */}
                                                                <div onClick={(e) => {
                                                                    if (e.shiftKey && slotLaunches[idx]?.practiceId) {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        console.log('[DEV] Shift-click override: bypassing time window');
                                                                        const slot = slotLaunches[idx];
                                                                        const practiceId = slot?.practiceId;
                                                                        const durationMin = slot?.durationMin;
                                                                        const practiceParamsPatch = slot?.practiceParamsPatch;
                                                                        const practiceConfig = slot?.practiceConfig;
                                                                        onStartPractice?.({
                                                                            practiceId,
                                                                            durationMin,
                                                                            practiceParamsPatch,
                                                                            overrides: slot?.overrides,
                                                                            locks: slot?.locks,
                                                                            practiceConfig,
                                                                            pathContext: {
                                                                                runId: activePath?.runId,
                                                                                activePathId: activePath?.activePathId,
                                                                                slotTime: time,
                                                                                slotIndex: idx,
                                                                                dayIndex: metrics.dayIndex,
                                                                                weekIndex: Math.ceil(metrics.dayIndex / 7)
                                                                            }
                                                                        });
                                                                    }
                                                                }}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            if (isUiPickingActive()) return;
                                                                            if (!e.shiftKey) {
                                                                                const slot = slotLaunches[idx];
                                                                                const practiceId = slot?.practiceId;
                                                                                const durationMin = slot?.durationMin;
                                                                                const practiceParamsPatch = slot?.practiceParamsPatch;
                                                                                const practiceConfig = slot?.practiceConfig;
                                                                                console.log("[DailyPracticeCard] START slot", {
                                                                                    slotTime: time,
                                                                                    slotIndex: idx,
                                                                                    practiceId,
                                                                                    durationMin,
                                                                                    activePathId: activePath?.activePathId,
                                                                                    dayIndex: metrics.dayIndex,
                                                                                    weekIndex: Math.ceil(metrics.dayIndex / 7)
                                                                                });

                                                                                if (!practiceId) {
                                                                                    console.warn("[DailyPracticeCard] No practiceId resolved for slot", idx);
                                                                                    return;
                                                                                }

                                                                                onStartPractice?.({
                                                                                    practiceId,
                                                                                    durationMin,
                                                                                    practiceParamsPatch,
                                                                                    overrides: slot?.overrides,
                                                                                    locks: slot?.locks,
                                                                                    practiceConfig,
                                                                                    pathContext: {
                                                                                        runId: activePath?.runId,
                                                                                        activePathId: activePath?.activePathId,
                                                                                        slotTime: time,
                                                                                        slotIndex: idx,
                                                                                        dayIndex: metrics.dayIndex,
                                                                                        weekIndex: Math.ceil(metrics.dayIndex / 7)
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                        disabled={isOutsideWindow || benchmarkMissing}
                                                                        data-ui-target="true"
                                                                        data-ui-scope="role"
                                                                        data-ui-role-group="dailyPractice"
                                                                        data-ui-id="dailyPractice:legStatusPill"
                                                                        data-ui-fx-surface="true"
                                                                        data-ui="practice-button"
                                                                        data-practice-type={slotLaunches[idx]?.practiceId === 'perception' ? 'visual' : (slotLaunches[idx]?.practiceId === 'resonance' ? 'sound' : (slotLaunches[idx]?.practiceId || undefined))}
                                                                        data-practice-id={slotLaunches[idx]?.practiceId ? `daily-slot:${idx}:${slotLaunches[idx].practiceId}` : undefined}
                                                                        className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                        style={{
                                                                            background: (isOutsideWindow || benchmarkMissing)
                                                                                ? (isLight ? 'rgba(60,50,35,0.06)' : 'rgba(255,255,255,0.08)')
                                                                                : 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                                            color: (isOutsideWindow || benchmarkMissing) ? (isLight ? '#3c3020' : 'var(--accent-color)') : '#fff',
                                                                            boxShadow: (isOutsideWindow || benchmarkMissing) ? 'none' : '0 3px 10px var(--accent-30)',
                                                                            cursor: (isOutsideWindow || benchmarkMissing) ? 'not-allowed' : 'pointer',
                                                                            ...(isActionable && {
                                                                                boxShadow: '0 8px 20px var(--accent-30)',
                                                                            }),
                                                                            pointerEvents: (isOutsideWindow || benchmarkMissing) ? 'none' : 'auto',
                                                                        }}
                                                                    >
                                                                        {benchmarkMissing ? 'Benchmark Required' : (expired ? 'Missed' : (tooEarly ? 'Not Yet' : 'Start'))}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
                                                                <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: isLight ? '#8b7b63' : 'var(--accent-40)' }}>
                                                                    {time}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '9px',
                                                                    fontFamily: 'var(--font-display)',
                                                                    fontWeight: 600,
                                                                    color: 'var(--accent-color)',
                                                                    opacity: 0.8,
                                                                }}>
                                                                    Done
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>TODAY'S PRACTICE</div>
                                        <div className="mt-2 text-lg font-semibold" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>{activePathObj.title}</div>
                                        <div className="mt-2 text-sm opacity-80" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>No practice times scheduled for today</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const dayNumber = getCurrentDayNumber();
    const todaysPractice = getTodaysPractice();
    const progress = progressSnapshot;
    const streak = getStreak();
    const legs = getDayLegsWithStatus(dayNumber);
    const hasStartedCurriculum = !!activePracticeSession || (legCompletions && Object.keys(legCompletions).length > 0);

    // Use *days* for "DAY X OF Y" (not total legs/sessions).
    // Priority: program duration (when curriculum is active) > path duration > fallback
    const totalDaysDisplay = (() => {
        // If there's an active curriculum program, prioritize its duration
        const program = getProgramDefinition(activeCurriculumId);
        const programDays = program?.curriculum?.duration;
        if (typeof programDays === 'number' && programDays > 0) return programDays;

        // Fall back to counting days array in program
        const fallbackDays = (program?.curriculum?.days && Array.isArray(program.curriculum.days))
            ? program.curriculum.days.length
            : null;
        if (typeof fallbackDays === 'number' && fallbackDays > 0) return fallbackDays;

        // If no program duration, use path duration
        const pathDays = activePathObj?.tracking?.durationDays
            ?? (typeof activePathObj?.duration === 'number' ? activePathObj.duration * 7 : null);
        if (typeof pathDays === 'number' && pathDays > 0) return pathDays;

        return 14;
    })();

    const dayIndexDisplay = activePathObj ? (metrics?.dayIndex || 1) : (hasStartedCurriculum ? dayNumber : 0);
    const dayProgressRatio = (() => {
        const n = Number(dayIndexDisplay);
        const d = Number(totalDaysDisplay);
        if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
        return Math.max(0, Math.min(1, n / d));
    })();

    const curriculumStartKey = (() => {
        if (!curriculumStartDate) return getLocalDateKey();
        const d = new Date(curriculumStartDate);
        if (Number.isNaN(d.getTime())) return getLocalDateKey();
        return getLocalDateKey(d);
    })();

    const practiceDayKey = addDaysToDateKey(curriculumStartKey, Math.max(0, (dayNumber || 1) - 1)) || getLocalDateKey();

    const resolveLegTimeStr = (leg) => {
        if (!leg) return null;
        if (typeof leg.time === 'string') return leg.time.substring(0, 5);
        if (leg.time && typeof leg.time === 'object' && leg.time.time) return String(leg.time.time).substring(0, 5);
        return null;
    };

    /**
     * Check if a practice leg has expired (window passed).
     */
    const isLegExpired = (leg) => {
        const t = resolveLegTimeStr(leg);
        if (!t) return false;

        const scheduledAt = localDateTimeFromDateKeyAndTime(practiceDayKey, t);
        const { expired } = getStartWindowState({ now: new Date(), scheduledAt });
        return expired;
    };

    const isLegTooEarly = (leg) => {
        const t = resolveLegTimeStr(leg);
        if (!t) return false;

        const scheduledAt = localDateTimeFromDateKeyAndTime(practiceDayKey, t);
        const { tooEarly } = getStartWindowState({ now: new Date(), scheduledAt });
        return tooEarly;
    };

    if ((isCurriculumActive && dayNumber > 14) || isCurriculumComplete) {
        const bgAssetUrl = `${import.meta.env.BASE_URL}bg/practice-breath-mandala.png`;

        return (
            <div
                className="w-full"
                style={{
                    borderRadius: '24px',
                    overflow: 'visible',
                    boxShadow: maybeShadow(isLight
                        ? '0 14px 34px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.06)'
                        : '0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px rgba(95,255,170,0.08)'),
                }}
            >
                <div
                    data-card="true"
                    data-card-id="dailyPracticeComplete"
                    data-card-active={dataCardActive}
                    data-card-carousel={dataCardCarousel}
                    className="im-card w-full relative dpBlurSurface"
                    style={{
                        borderRadius: '24px',
                        overflow: clipOverflow,
                        background: isLight ? 'rgba(245, 239, 229, 0.92)' : 'rgba(10, 10, 15, 0.72)',
                        border: maybeBorder(isLight ? '1px solid rgba(160, 120, 60, 0.2)' : '1px solid var(--accent-30)'),
                        '--dp-radius': '24px',
                        '--dp-inset-shadow': isLight
                            ? 'inset 0 1px 0 rgba(255,255,255,0.22)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        backdropFilter: isLight ? 'none' : maybeBlur('blur(16px)'),
                        WebkitBackdropFilter: isLight ? 'none' : maybeBlur('blur(16px)'),
                        isolation: 'isolate',
                    }}
                >
                {/* Inner decorative border - matches practice card styling */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '8px',
                        left: '8px',
                        right: '8px',
                        bottom: '8px',
                        border: isLight ? '1px solid rgba(160, 120, 60, 0.15)' : '1px solid var(--accent-25)',
                        borderRadius: '14px',
                        zIndex: 10,
                    }}
                />
                <div className="dpClipSurface">
                {/* Relic/Cosmic Background Wallpaper */}
                <div
                    className="absolute inset-0 pointer-events-none dpRadiusInherit"
                    style={{
                        backgroundImage: `url(${bgAssetUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: isLight ? 0.21 : 0.36,
                        mixBlendMode: isLight ? 'multiply' : 'screen',
                        filter: 'none',
                    }}
                />

                {/* Canvas Grain Texture (Light mode only) */}
                {isLight && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03] dpRadiusInherit"
                        style={{
                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/canvas_grain.png)`,
                            backgroundSize: '200px',
                            mixBlendMode: 'multiply',
                        }}
                    />
                )}
                </div>

                <div className="glassCardContent relative z-10 p-8 text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}>
                        Curriculum Complete!
                    </h3>
                    <p className="mb-6 opacity-70" style={{ color: config.textSub }}>
                        You completed {curriculumCompletedCount} of {curriculumTotalCount} practices
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onViewCurriculum}
                            className="px-6 py-2.5 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                            style={{
                                background: 'var(--accent-color)',
                                color: isLight ? '#fff' : '#000',
                                boxShadow: '0 4px 20px var(--accent-30)',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            View Report
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (window.confirm('Reset this curriculum? All progress will be cleared.')) {
                                        _devReset();
                                    }
                                }}
                                className="flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)',
                                    border: isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid rgba(255,255,255,0.15)',
                                    color: config.textMain,
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                Reset Program
                            </button>

                            <button
                                onClick={() => onNavigate?.('navigation')}
                                className="flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)',
                                    border: isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid rgba(255,255,255,0.15)',
                                    color: config.textMain,
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                New Curriculum
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    if (!todaysPractice) {
        return (
            <div
                data-tutorial="home-daily-card"
                className={`w-full relative transition-all duration-700 ease-in-out${isTutorialTarget ? ' tutorial-target' : ''}`}
                style={{
                    ...(isSanctuary ? {} : {
                        maxWidth: '430px',
                        margin: '0 auto',
                    }),
                    ...(isSanctuary && { width: '100%' }),
                }}
            >
                <div
                    data-card="true"
                    data-card-id="dailyPracticeFallback"
                    data-card-active={dataCardActive}
                    data-card-carousel={dataCardCarousel}
                    className="im-card w-full"
                    style={{
                        borderRadius: '24px',
                        padding: '20px',
                        background: isLight ? '#f5efe5' : '#14121a',
                        border: isLight ? '1px solid rgba(160, 120, 60, 0.2)' : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: isLight
                            ? '0 14px 34px rgba(0,0,0,0.10)'
                            : '0 18px 40px rgba(0,0,0,0.28)',
                        color: isLight ? '#3c3020' : '#fdfbf5',
                    }}
                >
                    <div style={{ fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.7 }}>
                        Today&apos;s Practice
                    </div>
                    <div style={{ fontSize: 14, marginTop: 8, opacity: 0.75 }}>
                        Practice data isn&apos;t available in this browser yet.
                    </div>

                    {activePathObj && times.length > 0 ? (
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {times.map((time, idx) => {
                                const isDone = completedSlotIndices.has(idx);
                                const isNext = idx === nextIndex;
                                return (
                                    <div
                                        key={`${time}-${idx}`}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            background: isLight ? 'rgba(160, 120, 60, 0.06)' : 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            opacity: isDone ? 0.6 : 1,
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                {time}
                                            </div>
                                            {practiceLabels[idx] && (
                                                <div style={{ fontSize: 11, opacity: 0.6 }}>
                                                    {practiceLabels[idx]}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const slot = slotLaunches[idx];
                                                const practiceId = slot?.practiceId;
                                                const durationMin = slot?.durationMin;
                                                const practiceParamsPatch = slot?.practiceParamsPatch;
                                                const practiceConfig = slot?.practiceConfig;
                                                if (!practiceId) return;
                                                onStartPractice?.({
                                                    practiceId,
                                                    durationMin,
                                                    practiceParamsPatch,
                                                    overrides: slot?.overrides,
                                                    locks: slot?.locks,
                                                    practiceConfig,
                                                    pathContext: {
                                                        runId: activePath?.runId,
                                                        activePathId: activePath?.activePathId,
                                                        slotTime: time,
                                                        slotIndex: idx,
                                                        dayIndex: metrics.dayIndex,
                                                        weekIndex: Math.ceil(metrics.dayIndex / 7),
                                                    },
                                                });
                                            }}
                                            disabled={!isNext || !slotLaunches[idx]?.practiceId}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '999px',
                                                border: 'none',
                                                background: isNext && slotLaunches[idx]?.practiceId
                                                    ? 'linear-gradient(135deg, var(--accent-color), var(--accent-70))'
                                                    : (isLight ? 'rgba(160, 120, 60, 0.12)' : 'rgba(255,255,255,0.08)'),
                                                color: isNext && slotLaunches[idx]?.practiceId ? '#fff' : (isLight ? '#6b5b45' : '#cfc8bc'),
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                                cursor: isNext && slotLaunches[idx]?.practiceId ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            {isDone ? 'Done' : isNext ? 'Start' : 'Locked'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onStartSetup?.()}
                            style={{
                                marginTop: 16,
                                padding: '8px 14px',
                                borderRadius: '999px',
                                border: 'none',
                                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Start Setup
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const handleStartLeg = (leg, evt) => {
        // DEV: Shift-click bypasses time window restrictions
        const isDevForceStart = evt?.shiftKey === true;

        // Clear any pilot session failure flag on restart
        if (lastSessionFailed) {
            clearLastSessionFailed();
        }
        setMissedLegWarning(null);

        const expired = isLegExpired(leg);
        const tooEarly = isLegTooEarly(leg);

        // Outside the allowed +/- 60 minute window: block start UNLESS shift-click bypass
        if (!isDevForceStart && (expired || tooEarly)) {
            const t = resolveLegTimeStr(leg);
            setMissedLegWarning({
                legNumber: leg?.legNumber || null,
                time: t,
                kind: tooEarly ? 'early' : 'late',
            });
            return;
        }

        if (isDevForceStart) {
            console.log('[DEV] Force-starting session via shift-click (bypassing time window):', { dayNumber, legNumber: leg.legNumber, leg });
        }
        
        // Inject pilot metadata based on the leg being launched (not curriculum id)
        const isPilotLeg =
            leg?.label === 'Morning Breath' ||
            leg?.label === 'Evening Circuit' ||
            leg?.practiceConfig?.circuitId === 'evening-test-circuit';

        const metadata = isPilotLeg
            ? { owner: 'pilot', programId: 'pilot-test-program' }
            : {};

        if (leg.launcherId) {
            onStartPractice?.(leg, { dayNumber, programId: activeCurriculumId, metadata });
            return;
        }
        setActivePracticeSession(dayNumber, leg.legNumber, metadata);
        onStartPractice?.(leg, { dayNumber, programId: activeCurriculumId, metadata });
    };

    const completedLegs = legs.filter(l => l.completed).length;
    const isDailyComplete = legs.length > 0 && completedLegs === legs.length;
    const shouldHighlightCompletion = showDailyCompletionNotice && isDailyComplete;

    return (
            <div
                data-tutorial="home-daily-card"
                className={`w-full relative transition-all duration-700 ease-in-out${isTutorialTarget ? ' tutorial-target' : ''}`}
                style={{
                    ...(isSanctuary ? {} : {
                        maxWidth: '430px',
                        margin: '0 auto',
                    }),
                    ...(isSanctuary && { width: '100%' }),
                }}
            >
            {/* OUTER: Frame with Shadow */}
            <div
                className="w-full relative"
                style={{
                    borderRadius: '24px',
                    overflow: 'visible',
                    // Depth shadow belongs on the non-blurred wrapper to avoid jagged edges on rounded corners.
                    boxShadow: maybeShadow(isLight
                        ? '0 14px 34px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.06)'
                        : `0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px ${primaryHex}22`),
                }}
            >
                {/* MIDDLE: Container */}
                <div
                    data-card="true"
                    data-card-id="dailyPractice"
                    data-card-active={dataCardActive}
                    data-card-carousel={dataCardCarousel}
                    className="im-card w-full relative dpBlurSurface"
                    style={{
                        borderRadius: '24px',
                        overflow: clipOverflow,
                        background: isLight ? 'rgba(250, 246, 238, 0.92)' : 'rgba(12, 18, 22, 0.85)',
                        border: maybeBorder(isLight ? '1px solid rgba(180, 140, 60, 0.25)' : '1px solid var(--accent-30)'),
                        '--dp-radius': '24px',
                        '--dp-inset-shadow': isLight
                            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                            : 'inset 0 1px 0 rgba(80, 180, 160, 0.20)',
                        backdropFilter: isLight ? 'none' : maybeBlur('blur(16px)'),
                        WebkitBackdropFilter: isLight ? 'none' : maybeBlur('blur(16px)'),
                        isolation: 'isolate',
                    }}
                >
                    {/* Inner decorative border - matches practice card styling */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: '8px',
                            left: '8px',
                            right: '8px',
                            bottom: '8px',
                            border: isLight ? '1px solid rgba(180, 140, 60, 0.15)' : '1px solid var(--accent-25)',
                            borderRadius: '14px',
                            zIndex: 10,
                        }}
                    />
                    <div className="glassCardContent">
                    <div className="dpClipSurface">
                    {/* 1. IMMERSIVE BACKGROUND LAYER (No layout width) */}
                    <div
                        className="absolute inset-0 pointer-events-none dpRadiusInherit"
                        style={{
                            background: isLight
                                ? 'radial-gradient(ellipse at 60% 40%, rgba(250, 246, 238, 0.95) 0%, rgba(245, 235, 220, 0.90) 40%, rgba(240, 228, 208, 0.85) 100%)'
                                : 'radial-gradient(ellipse at 60% 40%, rgba(18, 28, 32, 1) 0%, rgba(12, 20, 24, 1) 50%, rgba(8, 14, 18, 1) 100%)',
                            transition: 'all 0.7s ease-in-out',
                        }}
                    />

                    {/* 2.5 LEFT STRIP INSTRUMENTATION - rails anchored top/bottom */}
                    <div
                        className="absolute"
                        style={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '96px',
                            zIndex: 5,
                            pointerEvents: 'none',
                        }}
                    >
                        {/* Left wallpaper strip container (relative) */}
                        <div className="w-full h-full relative">
                            <div
                                className="absolute flex flex-col pointer-events-none"
                                style={{
                                    top: '12px',
                                    left: '12px',
                                    right: '12px',
                                    bottom: '12px',
                                    justifyContent: 'flex-start',
                                    alignItems: showSessionMeter ? 'center' : 'stretch',
                                    gap: '20px',
                                }}
                            >
                                {showSessionMeter && (
                                    <div style={{ width: '72px', flex: 2, minHeight: '110px' }}>
                                        <VerticalMeter
                                            label="SESSION"
                                            valueText={`${completedLegs}/${legs.length}`}
                                            progressRatio={legs.length > 0 ? completedLegs / legs.length : 0}
                                            isLight={isLight}
                                            progressBarColor={progressBarColor}
                                            isHighlighted={shouldHighlightCompletion}
                                        />
                                    </div>
                                )}

                                <div style={showSessionMeter ? { width: '72px', flex: 3, minHeight: '140px' } : { width: '100%', flex: 1, minHeight: '100%', height: '100%' }}>
                                      <VerticalMeter
                                          label="DAY"
                                          valueText={`${dayIndexDisplay}/${totalDaysDisplay}`}
                                          progressRatio={dayProgressRatio}
                                          isLight={isLight}
                                          progressBarColor={progressBarColor}
                                          isHighlighted={dayProgressRatio >= 1}
                                      />
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* 3. CONTENT PANEL (Owns the readable layout) */}
                    <div
                        className="relative z-10 ml-auto w-[380px] max-w-[70%] min-w-[320px] overflow-hidden flex flex-col"
                        style={{
                            background: 'transparent',
                            borderLeft: isLight ? '1px solid rgba(160, 120, 60, 0.30)' : '1px solid var(--accent-15)',
                            color: isLight ? '#3c3020' : '#fdfbf5',
                        }}
                    >
                            {/* Scrollable Container */}
                            <div className="px-6 sm:px-7 pt-4 sm:pt-5 pb-4 relative z-10">
                                {/* Decorative corner embellishments */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.12), transparent 30%)' : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.06), transparent 30%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 30%)' }} />

                                {/* Header */}
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: isLight ? 'rgba(60, 50, 35, 0.5)' : 'var(--accent-60)', letterSpacing: '0.08em' }}>
                                        Today's Practice
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-xl font-bold tracking-tight" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                            {todaysPractice.title || `Day ${dayNumber}`}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {streak > 1 && (
                                                <div className="px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1" style={{ background: 'var(--accent-15)', border: '1px solid var(--accent-30)', color: 'var(--accent-color)' }}>
                                                    🔥 {streak}-DAY STREAK
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {showDailyCompletionNotice && isDailyComplete && (
                                    <div
                                        className="mt-4 w-full text-center text-[11px] font-semibold tracking-wide"
                                        style={{
                                            color: isLight ? 'rgba(60, 110, 60, 0.75)' : 'rgba(120, 200, 140, 0.65)',
                                            letterSpacing: '0.02em'
                                        }}
                                    >
                                        Completed today's sessions — see you tomorrow!
                                    </div>
                                )}

                                {/* Legs List */}
                                <div className="space-y-5">
                                    {missedLegWarning && (
                                        <div
                                            className="rounded-xl border px-4 py-3"
                                            style={{
                                                borderColor: isLight ? 'rgba(220, 90, 60, 0.28)' : 'rgba(255, 160, 120, 0.28)',
                                                background: isLight ? 'rgba(220, 90, 60, 0.06)' : 'rgba(255, 160, 120, 0.06)',
                                                color: isLight ? 'rgba(60, 50, 35, 0.85)' : 'rgba(253,251,245,0.85)',
                                                fontFamily: 'var(--font-body)',
                                                fontSize: 12,
                                            }}
                                        >
                                            {missedLegWarning.kind === 'early'
                                                ? `This session is not available yet${missedLegWarning.time ? ` (${missedLegWarning.time})` : ''}.`
                                                : `This session window has passed${missedLegWarning.time ? ` (${missedLegWarning.time})` : ''}.`
                                            }
                                        </div>
                                    )}
                                    {legs.map((leg, index) => {
                                        const expired = !leg.completed && isLegExpired(leg);
                                        const isNextCandidate = !leg.completed && legs.slice(0, index).every(l => l.completed || isLegExpired(l));
                                        const tooEarly = isNextCandidate && !leg.completed && isLegTooEarly(leg);
                                        const isSoftLocked = expired || tooEarly; // requires hidden Shift override (dev-only)
                                        const isActionable = isNextCandidate && !isSoftLocked;
                                        const isLockedLeg = !leg.completed && !isNextCandidate; // sequencing lock only
                                        const legTimeStr = resolveLegTimeStr(leg);
                                        return (
                                            <div
                                                key={`${dayNumber}-${leg.legNumber}`}
                                                className="rounded-2xl border p-4 flex items-center gap-3 transition-all"
                                                style={{
                                                    borderColor: isLight ? 'rgba(160, 120, 60, 0.18)' : 'var(--accent-15)',
                                                    background: isLight
                                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                                                        : 'linear-gradient(135deg, rgba(30, 25, 35, 0.95) 0%, rgba(24, 20, 30, 0.92) 100%)',
                                                    boxShadow: isLight
                                                        ? '0 6px 18px rgba(120, 90, 60, 0.1)'
                                                        : '0 10px 30px rgba(0,0,0,0.45)',
                                                    opacity: isLockedLeg ? 0.5 : ((expired || tooEarly) ? 0.75 : 1),
                                                }}
                                            >
                                                {/* Leg Number / Status */}
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all"
                                                    style={{
                                                        background: leg.completed
                                                            ? 'linear-gradient(135deg, var(--accent-color), var(--accent-60))'
                                                            : (isLight ? 'rgba(160, 120, 60, 0.1)' : 'rgba(255, 255, 255, 0.08)'),
                                                        color: leg.completed ? '#fff' : (isLight ? '#3c3020' : 'var(--accent-60)'),
                                                        boxShadow: leg.completed ? '0 6px 20px var(--accent-25)' : 'none',
                                                        transform: isActionable ? 'scale(1.05)' : 'scale(1)',
                                                    }}
                                                >
                                                    {leg.completed && showPerLegCompletion ? '✓' : leg.legNumber}
                                                </div>

                                                {/* Leg Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-bold leading-tight" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                                            {leg.label || leg.practiceType}
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] leading-snug mt-1" style={{ color: isLight ? 'rgba(60, 50, 35, 0.7)' : 'rgba(253,251,245,0.55)' }}>
                                                        {leg.description || 'Guided practice'}
                                                    </div>
                                                    {leg.practiceConfig?.duration && (
                                                        <div className="text-[10px] uppercase tracking-[0.18em] font-black mt-1" style={{ color: 'var(--accent-color)' }}>
                                                            {leg.practiceConfig.duration} min
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action */}
                                                {!leg.completed ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        {legTimeStr && (
                                                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>
                                                                {legTimeStr}
                                                            </div>
                                                        )}
                                                        {isActionable && lastSessionFailed && (
                                                            <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: isLight ? '#dc2626' : '#ff6b6b' }}>
                                                                ⚠ Incomplete
                                                            </div>
                                                        )}
                                                        {expired && (
                                                            <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: isLight ? '#8b7b63' : 'rgba(253,251,245,0.55)' }}>
                                                                Window Passed
                                                            </div>
                                                        )}
                                                        {isActionable && !lastSessionFailed && (
                                                            <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--accent-color)' }}>
                                                                Next Up
                                                            </div>
                                                        )}
                                                        {/* Wrapper catches shift-click even when button disabled */}
                                                        <div onClick={(e) => {
                                                            if (e.shiftKey) {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                startTransition(() => handleStartLeg(leg, e));
                                                            }
                                                        }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    if (isUiPickingActive()) return;
                                                                    if (!e.shiftKey) {
                                                                        handleStartLeg(leg, e);
                                                                    }
                                                                }}
                                                                disabled={isLockedLeg || isSoftLocked}
                                                                data-ui-target="true"
                                                                data-ui-scope="role"
                                                                data-ui-role-group="dailyPractice"
                                                                data-ui-id="dailyPractice:legStatusPill"
                                                                data-ui-fx-surface="true"
                                                                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                style={{
                                                                    background: (isLockedLeg || isSoftLocked)
                                                                        ? (isLight ? 'rgba(60,50,35,0.06)' : 'rgba(255,255,255,0.08)')
                                                                        : 'var(--accent-color)',
                                                                    color: (isLockedLeg || isSoftLocked) ? (isLight ? '#3c3020' : 'rgba(253,251,245,0.50)') : '#fff',
                                                                    boxShadow: (isLockedLeg || isSoftLocked) ? 'none' : '0 3px 10px var(--accent-30)',
                                                                    cursor: (isLockedLeg || isSoftLocked) ? 'not-allowed' : 'pointer',
                                                                    ...(isActionable && !lastSessionFailed && {
                                                                        boxShadow: '0 8px 20px var(--accent-30)',
                                                                    }),
                                                                    ...(!isLockedLeg && !isSoftLocked && {
                                                                        background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                                    }),
                                                                    pointerEvents: (isLockedLeg || isSoftLocked) ? 'none' : 'auto',
                                                                }}
                                                            >
                                                                {expired ? 'Missed' : (tooEarly ? 'Not Yet' : (lastSessionFailed && isActionable ? 'Restart' : (isActionable ? 'Start' : 'Locked')))}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
                                                        {legTimeStr && (
                                                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: isLight ? '#8b7b63' : 'var(--accent-40)' }}>
                                                                {legTimeStr}
                                                            </div>
                                                        )}
                                                        {showPerLegCompletion && (
                                                            <div style={{
                                                                fontSize: '9px',
                                                                fontFamily: 'var(--font-display)',
                                                                fontWeight: 600,
                                                                color: 'var(--accent-color)',
                                                                opacity: 0.8,
                                                            }}>
                                                                Done
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        );
}

export default DailyPracticeCard;
