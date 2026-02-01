// Centralized session recording pipeline for practice completion.
// ARCHITECTURAL NOTE: Session snapshots (computeScheduleMatchedSnapshot) implement
// precision rail matching rules from docs/ARCHITECTURE.md § "Curriculum Precision Rail"
// and § "Non-Negotiable Invariants". Time thresholds (GREEN ≤15, RED ≤60),
// category/matchPolicy enforcement, and snapshot determinism must not be changed
// without updating architecture.md and reviewing curriculumRail.js § "Phase 7".
import { useProgressStore } from '../state/progressStore';
import { useNavigationStore } from '../state/navigationStore.js';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { syncFromProgressStore } from '../state/mandalaStore';
import { logPractice } from './cycleManager';
import { resolveCategoryIdFromSessionV2 } from './infographics/sessionCategory.js';
import { MATCH_POLICY } from '../data/curriculumMatching.js';

// DEV-only regression guard: prevent legacy writer reintroduction
if (import.meta.env.DEV) {
  const ps = useProgressStore.getState();
  if (typeof ps.recordSession === "function") {
    console.error("[LEGACY BLOCK] progressStore.recordSession exists; do not use legacy sessions.");
  }
}

const mapDomainToCycleType = (domain) => {
    if (domain === 'breathwork') return 'breath';
    if (domain === 'visualization') return 'focus';
    return 'body';
};

const resolveCompletion = (explicitCompletion, exitType) => {
    if (explicitCompletion) return explicitCompletion;
    if (exitType === 'completed') return 'completed';
    if (exitType === 'abandoned') return 'abandoned';
    return 'partial';
};

const resolveDurationSec = ({ durationSec, durationMinutes, instrumentation }) => {
    if (typeof durationSec === 'number' && !Number.isNaN(durationSec)) return Math.round(durationSec);
    if (instrumentation?.duration_ms) return Math.round(instrumentation.duration_ms / 1000);
    if (typeof durationMinutes === 'number' && !Number.isNaN(durationMinutes)) return Math.round(durationMinutes * 60);
    return null;
};

const resolveStartedAt = ({ startedAt, endedAt, durationSec }) => {
    if (startedAt) return startedAt;
    if (!endedAt || !durationSec) return null;
    const endMs = new Date(endedAt).getTime();
    if (Number.isNaN(endMs)) return null;
    return new Date(endMs - (durationSec * 1000)).toISOString();
};

const buildPathContext = ({ activePath, activePathId, endedAt }) => {
    if (!activePathId && !activePath) {
        return { activePathId: null, runId: null, dayIndex: null, weekIndex: null };
    }

    const resolvedActivePathId = activePathId || activePath?.activePathId || null;
    const resolvedRunId = activePath?.runId || null;
    const pathStart = activePath?.startedAt || null;
    if (!pathStart || !endedAt) {
        return { activePathId: resolvedActivePathId, runId: resolvedRunId, dayIndex: null, weekIndex: null };
    }

    const startMs = new Date(pathStart).getTime();
    const endMs = new Date(endedAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
        return { activePathId: resolvedActivePathId, runId: resolvedRunId, dayIndex: null, weekIndex: null };
    }

    const dayIndex = Math.floor((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1;
    const weekIndex = dayIndex > 0 ? Math.ceil(dayIndex / 7) : null;
    return {
        activePathId: resolvedActivePathId,
        runId: resolvedRunId,
        dayIndex: dayIndex > 0 ? dayIndex : null,
        weekIndex,
    };
};

/**
 * Parse "HH:mm" time string to minutes since midnight
 * MUST MATCH curriculumRail.js implementation
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
 * MUST MATCH curriculumRail.js implementation
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
 * MUST MATCH curriculumRail.js implementation
 */
function computeDeltaMinutes(actualMinutes, scheduledMinutes) {
    return actualMinutes - scheduledMinutes;
}

/**
 * Determine status based on time delta
 * GREEN: |delta| <= 15
 * RED: 15 < |delta| <= 60
 * null (does not count): |delta| > 60
 * MUST MATCH curriculumRail.js implementation
 */
function getDeltaStatus(deltaMinutes) {
    const absDelta = Math.abs(deltaMinutes);
    if (absDelta <= 15) return 'green';
    if (absDelta <= 60) return 'red';
    return null;
}

/**
 * Compute curriculum day number for a given date
 * MUST MATCH curriculumRail.js implementation
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


/**
 * Compute deterministic scheduleMatched snapshot for a session
 * Snapshots are persisted at record time so rail can use them without recomputing
 * Returns null if session does not satisfy any curriculum leg requirement
 */
function computeScheduleMatchedSnapshot({ startedAtISO, practiceId, practiceMode }) {
    if (!startedAtISO) return null;

    const curriculumStore = useCurriculumStore.getState();
    const progressStore = useProgressStore.getState();

    // Gate: check early conditions that make precision rail unavailable
    if (curriculumStore.precisionMode === 'advanced') return null;
    if (progressStore.vacation?.active === true) return null;
    if (!curriculumStore.curriculumStartDate) return null;

    // Compute curriculum day number
    const curriculumDayNumber = getCurriculumDayNumber(new Date(startedAtISO), curriculumStore.curriculumStartDate);

    if (!curriculumDayNumber) return null;

    // Get curriculum day definition
    const dayDef = curriculumStore.getCurriculumDay(curriculumDayNumber);
    if (!dayDef) return null;

    // Extract required legs
    const requiredLegs = (dayDef.legs || []).filter(leg => leg.required === true);
    if (requiredLegs.length === 0) return null;

    // Resolve session category
    const sessionCategory = resolveCategoryIdFromSessionV2({ practiceId, practiceMode });
    if (!sessionCategory) return null;

    // Try to match to a leg
    let bestMatch = null;
    let bestAbsDelta = Infinity;

    for (const leg of requiredLegs) {
        // Check scheduled time exists
        const timeIndex = leg.legNumber - 1;
        const scheduledTime = curriculumStore.practiceTimeSlots?.[timeIndex];
        const scheduledMinutes = scheduledTime ? parseTimeToMinutes(scheduledTime) : null;

        if (scheduledMinutes === null) continue; // No valid time slot

        // Check category/matchPolicy match
        if (leg.categoryId !== sessionCategory) continue;
        if (leg.matchPolicy === MATCH_POLICY.EXACT_PRACTICE) {
            if (!leg.practiceId || practiceId !== leg.practiceId) continue;
        }

        // Compute time delta
        const actualMinutes = getLocalMinutesFromISO(startedAtISO);
        if (actualMinutes === null) continue;

        const deltaMin = computeDeltaMinutes(actualMinutes, scheduledMinutes);
        const absDelta = Math.abs(deltaMin);

        // Outside acceptable range (>60 min)
        if (absDelta > 60) continue;

        // Pick best match (closest time, or lower legNumber on tie)
        if (absDelta < bestAbsDelta) {
            bestAbsDelta = absDelta;
            bestMatch = {
                legNumber: leg.legNumber,
                categoryId: leg.categoryId,
                matchPolicy: leg.matchPolicy,
                scheduledTime,
                deltaMinutes: deltaMin,
                status: getDeltaStatus(deltaMin),
                matchedAt: startedAtISO,
            };
        }
    }

    // DEV-only safety checks
    if (import.meta.env.DEV && bestMatch) {
        if (Math.abs(bestMatch.deltaMinutes) > 60) {
            console.error('[computeScheduleMatchedSnapshot] BUG: deltaMinutes exceeds 60', bestMatch);
        }
        if (!bestMatch.status) {
            console.error('[computeScheduleMatchedSnapshot] BUG: missing status', bestMatch);
        }
    }

    return bestMatch;
}

/**
 * Record a completed practice session through the centralized pipeline.
 * Payload supports: domain, duration, metadata, instrumentation, exitType,
 * persistSession, syncMandala, cycleEnabled, cycleMinDuration, cyclePracticeData.
 */
export function recordPracticeSession(payload = {}, options = {}) {
    const {
        domain,
        duration,
        metadata = {},
        instrumentation = null,
        exitType = null,
        practiceId = null,
        practiceMode = null,
        configSnapshot = null,
        completion = null,
        activePathId = null,
        dayIndex = null,
        startedAt = null,
        endedAt = null,
        durationSec = null,
    } = payload;

    const persistSession = options.persistSession ?? payload.persistSession ?? true;
    const syncMandala = options.syncMandala ?? payload.syncMandala ?? true;
    const cycleEnabled = options.cycleEnabled ?? payload.cycleEnabled ?? false;
    const cycleMinDuration = options.cycleMinDuration ?? payload.cycleMinDuration ?? 10;
    const cyclePracticeData = options.cyclePracticeData ?? payload.cyclePracticeData ?? null;
    let recordedSession = null;
    let instrumentationData = instrumentation;

    if (exitType && !instrumentationData) {
        instrumentationData = { exit_type: exitType };
    } else if (exitType && !instrumentationData.exit_type) {
        instrumentationData = { ...instrumentationData, exit_type: exitType };
    }

    const isDev =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
        (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

    if (isDev && persistSession && (duration == null || duration === 0 || !exitType)) {
        const type = cyclePracticeData?.type || null;
        console.warn('[recordPracticeSession] Missing duration/exitType', {
            domain: domain || type || null,
            duration,
            exitType,
            note: 'Sessions should include duration and exitType; verify caller.'
        });
    }

    const navState = useNavigationStore.getState();
    const activePath = navState?.activePath || null;
    const normalizedEndedAt = endedAt || new Date().toISOString();
    const normalizedDurationSec = resolveDurationSec({
        durationSec,
        durationMinutes: duration,
        instrumentation: instrumentationData,
    });
    const normalizedStartedAt = resolveStartedAt({
        startedAt,
        endedAt: normalizedEndedAt,
        durationSec: normalizedDurationSec,
    });
    const normalizedCompletion = resolveCompletion(completion, exitType || instrumentationData?.exit_type || null);
    const normalizedPathContext = buildPathContext({
        activePath,
        activePathId,
        endedAt: normalizedEndedAt,
    });

    const normalizedSession = {
        id: null,
        startedAt: normalizedStartedAt,
        endedAt: normalizedEndedAt,
        durationSec: normalizedDurationSec,
        practiceId,
        practiceMode,
        configSnapshot,
        completion: normalizedCompletion,
        pathContext: {
            runId: normalizedPathContext.runId,
            activePathId: normalizedPathContext.activePathId,
            dayIndex: dayIndex ?? normalizedPathContext.dayIndex,
            weekIndex: normalizedPathContext.weekIndex,
        },
        // Phase 7: deterministic scheduleMatched snapshot (computed at record time)
        scheduleMatched: normalizedStartedAt ? computeScheduleMatchedSnapshot({
            startedAtISO: normalizedStartedAt,
            practiceId,
            practiceMode,
        }) : null,
    };

    // DEV-ONLY: Guard against missing runId when activePath exists
    if (isDev && activePath && !normalizedPathContext?.runId) {
        console.error('[sessionRecorder] CRITICAL: Missing runId in pathContext despite active path', {
            activePath,
            normalizedPathContext,
            providedActivePathId: activePathId,
            note: 'This session will be orphaned from run tracking'
        });
    }

    if (persistSession) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            normalizedSession.id = crypto.randomUUID();
        } else {
            normalizedSession.id = String(Date.now());
        }

        useProgressStore.getState().recordSessionV2(normalizedSession);

        // Update lifetime tracking after session recording
        useProgressStore.getState().updateLifetimeTracking();

        if (syncMandala) {
            syncFromProgressStore();
        }
    }

    if (cycleEnabled && (duration || 0) >= cycleMinDuration) {
        const practiceData = cyclePracticeData || {
            type: mapDomainToCycleType(domain),
            duration,
        };

        logPractice(practiceData);
    }

    return persistSession ? normalizedSession : null;
}
