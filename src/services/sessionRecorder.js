// Centralized session recording pipeline for practice completion.
import { useProgressStore } from '../state/progressStore';
import { useNavigationStore } from '../state/navigationStore.js';
import { syncFromProgressStore } from '../state/mandalaStore';
import { logPractice } from './cycleManager';

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
        return { activePathId: null, dayIndex: null };
    }

    const resolvedActivePathId = activePathId || activePath?.activePathId || activePath?.pathId || null;
    const pathStart = activePath?.startedAt || activePath?.startDate || null;
    if (!pathStart || !endedAt) {
        return { activePathId: resolvedActivePathId, dayIndex: null };
    }

    const startMs = new Date(pathStart).getTime();
    const endMs = new Date(endedAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
        return { activePathId: resolvedActivePathId, dayIndex: null };
    }

    const dayIndex = Math.floor((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1;
    return {
        activePathId: resolvedActivePathId,
        dayIndex: dayIndex > 0 ? dayIndex : null,
    };
};

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
            activePathId: normalizedPathContext.activePathId,
            dayIndex: dayIndex ?? normalizedPathContext.dayIndex,
        },
    };

    if (persistSession) {
        recordedSession = useProgressStore.getState().recordSession({
            domain,
            duration,
            metadata,
            instrumentation: instrumentationData,
        });

        if (recordedSession?.id) {
            normalizedSession.id = recordedSession.id;
        } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
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

    return recordedSession;
}
