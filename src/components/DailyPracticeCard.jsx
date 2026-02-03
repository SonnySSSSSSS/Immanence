// src/components/DailyPracticeCard.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useProgressStore } from '../state/progressStore.js';
import { METRIC_LABELS } from "../constants/metricsLabels";
import { calculateGradientAngle, getAvatarCenter } from "../utils/dynamicLighting.js";
import { useTheme } from '../context/ThemeContext.jsx';
import { getPathById } from '../data/navigationData.js';
import { getLocalDateKey } from '../utils/dateUtils.js';
import { useAuthUser, getDisplayName } from "../state/useAuthUser";
import { CurriculumPrecisionRail } from './infographics/CurriculumPrecisionRail.jsx';
import { getProgramDefinition } from '../data/programRegistry.js';

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
function VerticalMeter({ label, valueText, progressRatio, isLight }) {
    const ratio = Math.max(0, Math.min(1, Number.isFinite(progressRatio) ? progressRatio : 0));

    const meterBackground = isLight ? 'rgba(250, 246, 238, 0.20)' : 'rgba(10, 12, 16, 0.22)';
    const meterBorder = isLight ? '1px solid rgba(160, 120, 60, 0.12)' : '1px solid rgba(120, 255, 180, 0.16)';
    const labelColor = isLight ? 'rgba(60, 50, 35, 0.62)' : 'rgba(253, 251, 245, 0.55)';
    const valueColor = isLight ? 'rgba(35, 20, 10, 0.92)' : 'rgba(253, 251, 245, 0.92)';
    const trackColor = isLight ? 'rgba(60, 50, 35, 0.14)' : 'rgba(255, 255, 255, 0.10)';
    const fillColor = isLight ? 'rgba(139, 159, 136, 0.85)' : 'rgba(80, 255, 160, 0.85)';

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    padding: '10px 10px 9px',
                    background: meterBackground,
                    border: meterBorder,
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: isLight
                        ? '0 10px 24px rgba(0, 0, 0, 0.08)'
                        : '0 14px 30px rgba(0, 0, 0, 0.32)',
                }}
                aria-label={`${label}: ${valueText}`}
            >
                <div
                    style={{
                        width: '100%',
                        padding: '7px 8px 6px',
                        borderRadius: '10px',
                        background: isLight ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.22)',
                        border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.10)',
                        textAlign: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: valueColor,
                        lineHeight: 1,
                    }}
                >
                    {valueText}
                </div>

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
                        fontSize: '10px',
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

export function DailyPracticeCard({ onStartPractice, onViewCurriculum, onNavigate, hasPersistedCurriculumData, onStartSetup, onboardingComplete: onboardingCompleteProp, practiceTimeSlots: practiceTimeSlotsProp, isTutorialTarget = false }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.viewportMode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    
    // Firefox detection
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

    // Navigation path fallback
    const activePathId = useNavigationStore(s => s.activePath?.activePathId ?? null);
    const activePathObj = activePathId ? getPathById(activePathId) : null;
    const activePath = useNavigationStore(s => s.activePath);
    const times = activePath?.schedule?.selectedTimes || []; // ["06:00","20:00"]

    // Today's session tracking (using local date key for timezone correctness, scoped to current run)
    const todayKey = getLocalDateKey();
    const sessionsV2 = useProgressStore(s => s.sessionsV2 || []);
    
    const todaySessions = useMemo(() => 
        sessionsV2.filter(
            s => (s.pathContext?.runId === activePath?.runId) && (getLocalDateKey(new Date(s.startedAt)) === todayKey)
        ),
        [sessionsV2, activePath?.runId, todayKey]
    );

    const completedCount = useMemo(
        () => todaySessions.filter(s => s.completion === "completed").length,
        [todaySessions]
    );

    const nextIndex = Math.min(completedCount, times.length);
    
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
    
    const metrics = useMemo(() => computeProgressMetrics(), [computeProgressMetrics, activePath?.startedAt, sessionsV2.length]);
    const missState = useMemo(() => computeMissState(), [computeMissState, sessionsV2.length]);

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
        return raw.map(resolvePracticeLaunchFromEntry);
    }, [activePathObj, metrics.dayIndex, times.length]);

    // Practice names for each slot (based on current week)
    const practiceLabels = useMemo(() => {
        if (!activePathObj || !metrics.dayIndex) return [];
        
        const weekIndex = Math.ceil(metrics.dayIndex / 7);
        const week = activePathObj.weeks?.find(w => w.number === weekIndex) || activePathObj.weeks?.[0];
        
        if (!week) return [];
        
        // Extract practice labels from week.focus or week.practices
        let labels = [];
        if (week.focus) {
            // If focus is a string like "Morning breath (7min) + Evening circuit (15min)", split by patterns
            labels = [week.focus];
        } else if (week.practices && Array.isArray(week.practices)) {
            labels = week.practices.map(p => typeof p === 'string' ? p : (p.name || p.type || ''));
        }
        
        // Pad or repeat to match number of times
        while (labels.length < times.length) {
            labels.push(labels[0] || '');
        }
        
        return labels.slice(0, times.length);
    }, [activePathObj, metrics.dayIndex, times.length]);

    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);
    const [missedLegWarning, setMissedLegWarning] = useState(null);

    const theme = useTheme();
    const currentStage = theme?.stage || 'Flame';
    const stageLower = currentStage.toLowerCase();
    const primaryHex = theme?.accent?.primary || '#4ade80';

    const {
        onboardingComplete: storeOnboardingComplete,
        activeCurriculumId,
        getCurrentDayNumber,
        getTodaysPractice,
        isTodayComplete,
        getProgress,
        getStreak,
        getDayLegsWithStatus,
        setActivePracticeSession,
        _devReset,
        practiceTimeSlots: storePracticeTimeSlots,
        lastSessionFailed,
        clearLastSessionFailed,
    } = useCurriculumStore();

    const onboardingComplete = onboardingCompleteProp ?? storeOnboardingComplete;
    const practiceTimeSlots = practiceTimeSlotsProp ?? storePracticeTimeSlots;

    // Parse hex to RGB for dynamic effects
    const baseAccent = useMemo(() => {
        const hex = primaryHex;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 126, g: 217, b: 87 };
    }, [primaryHex]);

    // Better color transformation from cyan base to stage accent
    const stageColorFilter = useMemo(() => {
        const { r, g, b } = baseAccent;
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        let h = 0;
        if (max !== min) {
            const d = max - min;
            const rn = r / 255, gn = g / 255, bn = b / 255;
            if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
            else if (max === gn) h = ((bn - rn) / d + 2) / 6;
            else h = ((rn - gn) / d + 4) / 6;
        }
        const targetHue = Math.round(h * 360);

        // Map target hue to filter string with sepia for warmer tones
        if (targetHue >= 10 && targetHue <= 60) {
            // Orange/Yellow range (Ember/Flame) - use sepia for warmth
            return `sepia(0.8) saturate(2) hue-rotate(${targetHue - 30}deg) brightness(1.1)`;
        } else if (targetHue >= 90 && targetHue <= 150) {
            // Green range (Seedling) - direct hue shift from cyan
            return `hue-rotate(${targetHue - 180}deg) saturate(1.3) brightness(1.05)`;
        } else if (targetHue >= 180 && targetHue <= 210) {
            // Cyan range (Beacon) - minimal adjustment
            return `saturate(1.4) brightness(1.05) contrast(1.1)`;
        } else if (targetHue >= 260 && targetHue <= 300) {
            // Purple/Violet range (Stellar) - hue shift from cyan
            return `hue-rotate(${targetHue - 180}deg) saturate(1.5) brightness(1.1)`;
        }
        // Default fallback
        return `hue-rotate(${targetHue - 180}deg) saturate(1.3) brightness(1.05)`;
    }, [baseAccent]);

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setGradientAngle(calculateGradientAngle(rect, getAvatarCenter()));
        }
    }, [isLight, displayMode]);

    const needsSetup = !onboardingComplete && (!practiceTimeSlots || practiceTimeSlots.length === 0);

    const user = useAuthUser();
    const displayName = getDisplayName(user);

    if (needsSetup || (!onboardingComplete && hasPersistedCurriculumData === false)) {
        const bgAsset = isLight ? 'ancient_relic_focus.png' : `card_bg_comet_${stageLower}.png`;

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
                    className={isFirefox ? "w-full relative" : "w-full relative glassCardShadowWrap"}
                    style={{
                        borderRadius: '24px',
                        ...(isFirefox ? {
                            boxShadow: isLight
                                ? '0 14px 34px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.06)'
                                : '0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px rgba(95, 255, 170, 0.08)',
                        } : {
                            '--glass-radius': '24px',
                            '--glass-shadow-1': isLight ? '0 14px 34px rgba(0,0,0,0.10)' : '0 18px 40px rgba(0,0,0,0.28)',
                            '--glass-shadow-2': isLight ? '0 6px 14px rgba(0,0,0,0.06)' : '0 6px 14px rgba(0,0,0,0.18)',
                            '--glass-shadow-aura': isLight ? '0 0 0 rgba(0,0,0,0)' : `0 0 18px ${primaryHex}22`,
                        }),
                    }}
                >
                    <div
                        ref={cardRef}
                        className={isFirefox ? "w-full relative overflow-hidden" : "w-full relative glassCardShell"}
                        style={{
                            ...(isFirefox ? {
                                borderRadius: '24px',
                                background: isLight ? 'rgba(250, 246, 238, 0.92)' : 'rgba(10, 12, 16, 0.58)',
                                boxShadow: `
                                    inset 0 0 0 1px ${isLight ? `${primaryHex}30` : `${primaryHex}40`},
                                    0 0 0 1px ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)'}
                                `.trim().replace(/\\s+/g, ' '),
                            } : {
                                background: 'transparent',
                                '--glass-radius': '24px',
                                '--glass-bg': isLight ? 'rgba(250, 246, 238, 0.92)' : 'rgba(10, 12, 16, 0.58)',
                                '--glass-blur': isLight ? '0px' : '16px',
                                '--glass-stroke': isLight ? `${primaryHex}30` : `${primaryHex}40`,
                                '--glass-outline': isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)',
                            }),
                        }}
                    >
                        <div className="glassCardContent">
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/${bgAsset})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: isLight ? 'saturate(1.1)' : 'none',
                                transition: 'all 0.7s ease-in-out',
                            }}
                        />

                        <div className="absolute inset-0 pointer-events-none" style={{ 
                            background: isLight 
                                ? 'linear-gradient(to right, rgba(250, 246, 238, 0) 0%, rgba(250, 246, 238, 0.3) 30%, rgba(250, 246, 238, 0.9) 100%)' 
                                : 'linear-gradient(to right, rgba(20, 15, 25, 0) 0%, rgba(20, 15, 25, 0.45) 40%, rgba(20, 15, 25, 0.95) 100%)' 
                        }} />

                        <div 
                            className="relative z-10 w-full min-h-[460px] flex flex-col"
                            style={{
                                background: isFirefox
                                    ? (isLight ? '#faf6ee' : '#14121a')
                                    : (isLight ? 'rgba(250, 246, 238, 0.85)' : 'rgba(20, 15, 25, 0.85)'),
                                backdropFilter: isFirefox ? 'none' : 'blur(16px)',
                                WebkitBackdropFilter: isFirefox ? 'none' : 'blur(16px)',
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

                            <div className="p-6 sm:p-7 relative z-10 flex flex-col gap-5">
                                <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.12), transparent 30%)' : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.06), transparent 30%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 30%)' }} />

                                {!activePathObj ? (
                                    <>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.32em] opacity-60" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                                                Today's Practice
                                            </div>
                                            <div className="text-lg font-black tracking-wide" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                                NO CURRICULUM DATA
                                            </div>
                                            <div className="text-[11px] opacity-70 leading-snug mt-3" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                This browser has no onboarding/curriculum saved yet.
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <button
                                                onClick={() => onStartSetup?.()}
                                                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                    color: '#fff',
                                                    boxShadow: '0 3px 10px var(--accent-30)',
                                                }}
                                            >
                                                START SETUP
                                            </button>
                                            <p className="mt-4 text-[11px] text-white/60">
                                                Click &quot;Start Setup&quot; to begin your journey
                                            </p>
                                        </div>
                                    </>
                                ) : missState.broken ? (
                                    <div className="text-center">
                                        <div className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>PATH STATUS</div>
                                        <div className="mt-4 text-lg font-semibold" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>Path Broken</div>
                                        <div className="mt-2 text-sm opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>Missed {missState.consecutiveMissedDays} consecutive days.</div>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => restartPath?.()}
                                                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                    color: '#fff',
                                                    boxShadow: '0 3px 10px var(--accent-30)',
                                                }}
                                            >
                                                Restart Path
                                            </button>
                                        </div>
                                    </div>
                                ) : allDone ? (
                                    <div className="text-center">
                                        <div className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>TODAY'S SCHEDULE</div>
                                        <div className="mt-4 text-lg font-semibold" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>TODAY'S PRACTICES COMPLETED</div>
                                        <div className="mt-2 text-sm opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>Great job on your {completedCount} session{completedCount !== 1 ? 's' : ''}!</div>
                                    </div>
                                ) : times.length > 0 ? (
                                    <div>
                                        <div className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>TODAY'S SCHEDULE</div>
                                        <div style={{ fontSize: 12, opacity: 0.85 }}>Hello, {displayName}</div>
                                        <div className="mt-2 text-lg font-semibold" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>{activePathObj.title}</div>
                                        
                                        {/* Progress Meter */}
                                        {metrics.durationDays > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <div className="flex justify-between text-[10px] opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                    <span>DAY {metrics.dayIndex} OF {metrics.durationDays}</span>
                                                    <span>{METRIC_LABELS.adherence}: {Math.round(metrics.adherencePct)}%</span>
                                                </div>
                                                <div className="flex justify-end text-[10px] opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                    <span>{METRIC_LABELS.program}: {Math.round(metrics.timePct)}%</span>
                                                </div>
                                                <div 
                                                    className="h-2 rounded-full overflow-hidden"
                                                    style={{
                                                        background: isLight ? 'rgba(180, 140, 60, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                                                    }}
                                                >
                                                    <div 
                                                        className="h-full transition-all duration-500"
                                                        style={{
                                                            width: `${metrics.adherencePct}%`,
                                                            background: 'linear-gradient(90deg, var(--accent-color), var(--accent-70))',
                                                            boxShadow: '0 0 10px var(--accent-30)'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Precision Rail Infographic */}
                                        <div className="mt-6 pt-4 border-t" style={{ borderColor: isLight ? 'rgba(180, 140, 60, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}>
                                            <CurriculumPrecisionRail />
                                        </div>

                                        <div className="mt-6 space-y-2">
                                            {times.map((time, idx) => {
                                                const isDone = idx < completedCount;
                                                const isNext = idx === nextIndex;
                                                return (
                                                    <div 
                                                        key={idx}
                                                        className="flex items-center justify-between p-3 rounded-lg transition-all"
                                                        style={{
                                                            background: isLight ? 'rgba(180, 140, 60, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                                            opacity: isDone ? 0.5 : 1,
                                                        }}
                                                    >
                                                        <div className={isDone ? 'line-through' : ''} style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                            <span className="text-sm font-semibold">{time}</span>
                                                            {practiceLabels[idx] && (
                                                                <div className="text-[9px] opacity-60 mt-1" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                                    {practiceLabels[idx]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => {
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
                                                                        activePathId: activePath?.activePathId, 
                                                                        slotTime: time, 
                                                                        slotIndex: idx,
                                                                        dayIndex: metrics.dayIndex,
                                                                        weekIndex: Math.ceil(metrics.dayIndex / 7)
                                                                    }
                                                                });
                                                            }}
                                                            disabled={!isNext || !slotLaunches[idx]?.practiceId}
                                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                                isNext && slotLaunches[idx]?.practiceId
                                                                    ? 'btn-primary hover:scale-105 cursor-pointer' 
                                                                    : 'btn-muted opacity-50 cursor-not-allowed'
                                                            }`}
                                                            style={isNext && slotLaunches[idx]?.practiceId ? {
                                                                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                                color: '#fff',
                                                                boxShadow: '0 3px 10px var(--accent-30)',
                                                            } : {
                                                                background: isLight ? 'rgba(180, 140, 60, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                                color: isLight ? 'rgba(60, 50, 35, 0.5)' : 'rgba(253, 251, 245, 0.5)',
                                                            }}
                                                            >
                                                            {isDone ? 'Done' : isNext ? 'Start' : 'Locked'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>TODAY'S PRACTICE</div>
                                        <div style={{ fontSize: 12, opacity: 0.85 }}>Hello, {displayName}</div>
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
    const isComplete = isTodayComplete();
    const progress = getProgress();
    const streak = getStreak();
    const legs = getDayLegsWithStatus(dayNumber);

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

    const dayIndexDisplay = activePathObj ? (metrics?.dayIndex || 1) : dayNumber;

    const nowMinutes = (() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    })();

    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return null;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return null;
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
        if (h < 0 || h > 23 || m < 0 || m > 59) return null;
        return h * 60 + m;
    };

    const resolveLegTimeStr = (leg) => {
        if (!leg) return null;
        if (typeof leg.time === 'string') return leg.time.substring(0, 5);
        if (leg.time && typeof leg.time === 'object' && leg.time.time) return String(leg.time.time).substring(0, 5);
        return null;
    };

    /**
     * Check if a practice leg has expired (window passed).
     * On Day 1 of a path (after begin or reset), legs never expire - fresh start.
     */
    const isLegExpired = (leg) => {
        // On Day 1, no legs are expired (fresh start)
        if (metrics.dayIndex === 1) return false;

        const t = resolveLegTimeStr(leg);
        const scheduledMin = parseTimeToMinutes(t);
        if (scheduledMin == null) return false;
        return (nowMinutes - scheduledMin) > 60;
    };

    const isLegTooEarly = (leg) => {
        const t = resolveLegTimeStr(leg);
        const scheduledMin = parseTimeToMinutes(t);
        if (scheduledMin == null) return false;
        // Allow starting up to 60 minutes early. Earlier than that remains locked.
        // NOTE: Starting early still records a non-zero schedule delta (and will be penalized by precision rules if outside the GREEN window).
        return nowMinutes < (scheduledMin - 60);
    };

    if (dayNumber > 14 || progress.completed >= progress.total) {
        const bgAsset = isLight ? 'ancient_relic_focus.png' : `card_bg_comet_${stageLower}.png`;

        return (
            <div
                className={isFirefox ? "w-full" : "w-full glassCardShadowWrap"}
                style={{
                    borderRadius: '24px',
                    ...(isFirefox ? {
                        boxShadow: isLight
                            ? '0 14px 34px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.06)'
                            : '0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px rgba(95,255,170,0.08)',
                    } : {
                        '--glass-radius': '24px',
                        '--glass-shadow-1': isLight ? '0 14px 34px rgba(0,0,0,0.10)' : '0 18px 40px rgba(0,0,0,0.28)',
                        '--glass-shadow-2': isLight ? '0 6px 14px rgba(0,0,0,0.06)' : '0 6px 14px rgba(0,0,0,0.18)',
                        '--glass-shadow-aura': isLight ? '0 0 0 rgba(0,0,0,0)' : '0 0 18px rgba(95,255,170,0.08)',
                    }),
                }}
            >
                <div
                    className={isFirefox ? "w-full relative overflow-hidden" : "w-full relative glassCardShell"}
                    style={{
                        ...(isFirefox ? {
                            borderRadius: '24px',
                            background: isLight ? 'rgba(245, 239, 229, 0.92)' : 'rgba(10, 10, 15, 0.72)',
                            boxShadow: `
                                inset 0 0 0 1px ${isLight ? 'rgba(160, 120, 60, 0.14)' : 'rgba(95, 255, 170, 0.20)'},
                                0 0 0 1px ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)'}
                            `.trim().replace(/\\s+/g, ' '),
                        } : {
                            '--glass-radius': '24px',
                            '--glass-bg': isLight ? 'rgba(245, 239, 229, 0.92)' : 'rgba(10, 10, 15, 0.72)',
                            '--glass-blur': isLight ? '0px' : '16px',
                            '--glass-stroke': isLight ? 'rgba(160, 120, 60, 0.14)' : 'rgba(95, 255, 170, 0.20)',
                            '--glass-outline': isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)',
                        }),
                    }}
                >
                {/* Relic/Cosmic Background Wallpaper */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${bgAsset})`,
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
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/canvas_grain.png)`,
                            backgroundSize: '200px',
                            mixBlendMode: 'multiply',
                        }}
                    />
                )}

                <div className="glassCardContent relative z-10 p-8 text-center">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}>
                        Curriculum Complete!
                    </h3>
                    <p className="mb-6 opacity-70" style={{ color: config.textSub }}>
                        You completed {progress.completed} of {progress.total} practices
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
                    className="w-full"
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
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Hello, {displayName}</div>
                    <div style={{ fontSize: 14, marginTop: 8, opacity: 0.75 }}>
                        Practice data isn&apos;t available in this browser yet.
                    </div>

                    {activePathObj && times.length > 0 ? (
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {times.map((time, idx) => {
                                const isDone = idx < completedCount;
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
        // Clear any pilot session failure flag on restart
        if (lastSessionFailed) {
            clearLastSessionFailed();
        }
        setMissedLegWarning(null);

        const expired = isLegExpired(leg);
        const tooEarly = isLegTooEarly(leg);

        // Outside the allowed +/- 60 minute window: require hidden Shift override (dev-only).
        // Do not mention Shift in the UI; just surface a neutral message.
        if ((expired || tooEarly) && !evt?.shiftKey) {
            const t = resolveLegTimeStr(leg);
            setMissedLegWarning({
                legNumber: leg?.legNumber || null,
                time: t,
                kind: tooEarly ? 'early' : 'late',
            });
            return;
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
                className={isFirefox ? "w-full relative" : "w-full relative glassCardShadowWrap"}
                style={{
                    borderRadius: '24px',
                    ...(isFirefox ? {
                        boxShadow: isLight
                            ? '0 14px 34px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.06)'
                            : `0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px ${primaryHex}22`,
                    } : {
                        '--glass-radius': '24px',
                        '--glass-shadow-1': isLight ? '0 14px 34px rgba(0,0,0,0.10)' : '0 18px 40px rgba(0,0,0,0.28)',
                        '--glass-shadow-2': isLight ? '0 6px 14px rgba(0,0,0,0.06)' : '0 6px 14px rgba(0,0,0,0.18)',
                        '--glass-shadow-aura': isLight ? '0 0 0 rgba(0,0,0,0)' : `0 0 18px ${primaryHex}22`,
                    }),
                }}
            >
                {/* MIDDLE: Container */}
                <div
                    ref={cardRef}
                    className={isFirefox ? "w-full relative overflow-hidden" : "w-full relative glassCardShell"}
                    style={{
                        ...(isFirefox ? {
                            borderRadius: '24px',
                            background: isLight ? 'rgba(250, 246, 238, 0.92)' : 'rgba(10, 12, 16, 0.58)',
                            boxShadow: `
                                inset 0 0 0 1px ${isLight ? `${primaryHex}30` : `${primaryHex}40`},
                                0 0 0 1px ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)'}
                            `.trim().replace(/\\s+/g, ' '),
                        } : {
                            background: 'transparent',
                            '--glass-radius': '24px',
                            '--glass-bg': isLight ? 'rgba(250, 246, 238, 0.92)' : 'rgba(10, 12, 16, 0.58)',
                            '--glass-blur': isLight ? '0px' : '16px',
                            '--glass-stroke': isLight ? `${primaryHex}30` : `${primaryHex}40`,
                            '--glass-outline': isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)',
                        }),
                    }}
                >
                    <div className="glassCardContent">
                    {/* 1. IMMERSIVE BACKGROUND LAYER (No layout width) */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/${isLight ? config.bgAsset : `card_bg_comet_${stageLower}.png`})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: isLight ? 'saturate(1.1)' : 'none',
                                transition: 'all 0.7s ease-in-out',
                            }}
                    />

                    {/* 2. LEFT BLOOM FADE: image blooms into parchment */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: isLight
                            ? 'linear-gradient(to right, rgba(250, 246, 238, 0) 0%, rgba(250, 246, 238, 0.3) 30%, rgba(250, 246, 238, 0.9) 100%)'
                            : 'linear-gradient(to right, rgba(20, 15, 25, 0) 0%, rgba(20, 15, 25, 0.45) 40%, rgba(20, 15, 25, 0.95) 100%)'
                    }} />

                    {/* 2.5 LEFT STRIP INSTRUMENTATION - rails anchored top/bottom */}
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
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div style={{ width: '72px', height: 'clamp(120px, 18vh, 170px)' }}>
                                    <VerticalMeter
                                        label="COMPLETION"
                                        valueText={`${completedLegs}/${legs.length}`}
                                        progressRatio={legs.length > 0 ? completedLegs / legs.length : 0}
                                        isLight={isLight}
                                    />
                                </div>

                                <div style={{ flex: 1, minHeight: '24px' }} />

                                <div style={{ width: '72px', height: 'clamp(120px, 18vh, 170px)' }}>
                                    <VerticalMeter
                                        label="PATH"
                                        valueText={`${progress.rate}%`}
                                        progressRatio={progress.rate / 100}
                                        isLight={isLight}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. CONTENT PANEL (Owns the readable layout) */}
                    <div 
                        className="relative z-10 ml-auto w-[380px] max-w-[70%] min-w-[320px] overflow-hidden flex flex-col"
                        style={{
                            background: isFirefox 
                                ? (isLight ? '#faf6ee' : '#14121a')
                                : (isLight ? 'rgba(250, 246, 238, 0.95)' : 'rgba(20, 15, 25, 0.95)'),
                            backdropFilter: isFirefox ? 'none' : 'blur(16px)',
                            WebkitBackdropFilter: isFirefox ? 'none' : 'blur(16px)',
                            borderLeft: isLight ? '1px solid rgba(160, 120, 60, 0.1)' : '1px solid var(--accent-15)',
                            color: isLight ? '#3c3020' : '#fdfbf5',
                        }}
                    >
                            {/* Panel texture scrim */}
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

                            {/* Scrollable Container */}
                            <div className="px-6 sm:px-7 pt-5 sm:pt-6 pb-4 relative z-10">
                                {/* Decorative corner embellishments */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.12), transparent 30%)' : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.06), transparent 30%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 30%)' }} />

                                {/* Header */}
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.32em] opacity-60" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                                            Today's Practice
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.85 }}>Hello, {displayName}</div>
                                        <div className="text-lg font-black tracking-wide" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                            {todaysPractice.title || `Day ${dayNumber}`}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-xs font-bold" style={{ color: isLight ? config.accent : 'var(--accent-color)' }}>
                                            DAY {dayIndexDisplay} OF {totalDaysDisplay}
                                        </div>
                                        {streak > 1 && (
                                            <div className="px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1" style={{ background: isLight ? 'rgba(255, 200, 0, 0.12)' : 'rgba(255, 200, 0, 0.1)', border: isLight ? '1px solid rgba(255, 200, 0, 0.3)' : '1px solid rgba(255, 200, 0, 0.3)', color: isLight ? '#8b6b2c' : 'var(--accent-color)' }}>
                                                🔥 {streak}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Legs List */}
                                <div className="space-y-3">
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
                                                    opacity: isLockedLeg ? 0.5 : (expired ? 0.75 : 1),
                                                }}
                                            >
                                                {/* Leg Number / Status */}
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all"
                                                    style={{
                                                        background: leg.completed
                                                            ? 'linear-gradient(135deg, var(--accent-color), var(--accent-60))'
                                                            : (isLight ? 'rgba(160, 120, 60, 0.1)' : 'rgba(255, 255, 255, 0.08)'),
                                                        color: leg.completed ? '#fff' : (isLight ? '#3c3020' : '#fdfbf5'),
                                                        boxShadow: leg.completed ? '0 6px 20px var(--accent-25)' : 'none',
                                                        transform: isActionable ? 'scale(1.05)' : 'scale(1)',
                                                    }}
                                                >
                                                    {leg.completed ? '✓' : leg.legNumber}
                                                </div>

                                                {/* Leg Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-bold leading-tight" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                                            {leg.label || leg.practiceType}
                                                        </div>
                                                        {leg.time && (
                                                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: isLight ? '#8b7b63' : 'var(--accent-40)' }}>
                                                                {typeof leg.time === 'string' 
                                                                    ? leg.time.substring(0, 5) 
                                                                    : (leg.time.time ? String(leg.time.time).substring(0, 5) : String(leg.time).substring(0, 5))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] opacity-70 leading-snug mt-1" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                        {leg.description || 'Guided practice'}
                                                    </div>
                                                    {leg.practiceConfig?.duration && (
                                                        <div className="text-[10px] uppercase tracking-[0.18em] font-black mt-1" style={{ color: isLight ? '#8b7b63' : 'var(--accent-40)' }}>
                                                            {leg.practiceConfig.duration} min
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action */}
                                                {!leg.completed ? (
                                                    <div className="flex flex-col items-end gap-1">
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
                                                            <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: isLight ? '#8b6b2c' : 'var(--accent-50)' }}>
                                                                Next Up
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleStartLeg(leg, e)}
                                                            disabled={isLockedLeg}
                                                            className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                                            style={{
                                                                background: (isLockedLeg || isSoftLocked)
                                                                    ? (isLight ? 'rgba(60,50,35,0.06)' : 'rgba(255,255,255,0.08)')
                                                                    : 'var(--accent-color)',
                                                                color: (isLockedLeg || isSoftLocked) ? (isLight ? '#3c3020' : '#fdfbf5') : '#fff',
                                                                boxShadow: (isLockedLeg || isSoftLocked) ? 'none' : '0 3px 10px var(--accent-30)',
                                                                cursor: isLockedLeg ? 'not-allowed' : 'pointer',
                                                                ...(isActionable && !lastSessionFailed && {
                                                                    boxShadow: '0 8px 20px var(--accent-30)',
                                                                }),
                                                                ...(!isLockedLeg && !isSoftLocked && {
                                                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                                })
                                                            }}
                                                        >
                                                            {expired ? 'Missed' : (tooEarly ? 'Not Yet' : (lastSessionFailed && isActionable ? 'Restart' : (isActionable ? 'Start' : 'Locked')))}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        fontSize: '9px',
                                                        fontFamily: 'var(--font-display)',
                                                        fontWeight: 600,
                                                        color: 'var(--accent-color)',
                                                        opacity: 0.8,
                                                        flexShrink: 0,
                                                    }}>
                                                        Done
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
