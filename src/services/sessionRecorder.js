// Centralized session recording pipeline for practice completion.
import { useProgressStore } from '../state/progressStore';
import { syncFromProgressStore } from '../state/mandalaStore';
import { logPractice } from './cycleManager';

const mapDomainToCycleType = (domain) => {
    if (domain === 'breathwork') return 'breath';
    if (domain === 'visualization') return 'focus';
    return 'body';
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

    if (persistSession) {
        recordedSession = useProgressStore.getState().recordSession({
            domain,
            duration,
            metadata,
            instrumentation: instrumentationData,
        });

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
