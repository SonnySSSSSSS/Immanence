// src/reporting/selectSessions.js
// Pure session selection & filtering over progressStore
// No side effects, no imports from components or UI

import { useNavigationStore } from '../state/navigationStore.js';
import { useProgressStore } from '../state/progressStore.js';
import { getLocalDateKey } from '../utils/dateUtils.js';

/**
 * Get active run context (runId, activePathId)
 * Returns null if no active run
 */
export function selectActiveRunContext() {
    const navState = useNavigationStore.getState();
    const { activePath } = navState;

    if (!activePath) {
        return null;
    }

    return {
        runId: activePath.runId || null,
        activePathId: activePath.activePathId || null,
        startedAt: activePath.startedAt || null,
    };
}

/**
 * Pure session selector with filtering
 *
 * @param {Object} options
 * @param {string} options.scope - 'lifetime' | 'runId' | 'month' | 'week' | 'today'
 * @param {string} options.range - '7d' | '14d' | '30d' | '90d' | '365d' | 'all'
 * @param {boolean} options.includeHonor - Include honor logs as synthetic sessions
 * @param {string[]} options.completion - Filter by ['completed', 'abandoned', 'partial']
 * @param {string[]} options.practiceIds - Filter by specific practiceIds
 * @param {string[]} options.familyKeys - Filter by practice family keys
 * @param {string} options.activeRunId - Optional override for 'runId' scope
 *
 * @returns {Array} - Canonical session objects with honor logs converted to sessions
 */
export function selectSessions(options = {}) {
    const {
        scope = 'lifetime',
        range = '365d',
        includeHonor = false,
        completion = null,
        practiceIds = null,
        familyKeys = null,
        activeRunId = null,
    } = options;

    const progressState = useProgressStore.getState();
    const navState = useNavigationStore.getState();

    // Get all sessions (V2 only, authoritative source)
    let sessions = [...(progressState.sessionsV2 || [])];

    // SCOPE filtering
    if (scope === 'runId') {
        const runId = activeRunId || navState.activePath?.runId;
        if (runId) {
            sessions = sessions.filter(s => s.pathContext?.runId === runId);
        } else {
            return []; // No active run
        }
    } else if (scope === 'today') {
        const today = getLocalDateKey(new Date());
        sessions = sessions.filter(s => getLocalDateKey(new Date(s.startedAt)) === today);
    }

    // RANGE filtering
    const now = Date.now();
    const rangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '14d': 14 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '365d': 365 * 24 * 60 * 60 * 1000,
        'all': Infinity,
    }[range] || Infinity;

    const cutoffMs = now - rangeMs;
    sessions = sessions.filter(s => new Date(s.startedAt).getTime() >= cutoffMs);

    // COMPLETION filtering
    if (completion && Array.isArray(completion) && completion.length > 0) {
        sessions = sessions.filter(s => completion.includes(s.completion));
    }

    // PRACTICE ID filtering
    if (practiceIds && Array.isArray(practiceIds) && practiceIds.length > 0) {
        sessions = sessions.filter(s => practiceIds.includes(s.practiceId));
    }

    // FAMILY KEY filtering (requires familyKeyOf function from caller)
    if (familyKeys && Array.isArray(familyKeys) && familyKeys.length > 0) {
        // Note: filtering by family keys is done by caller using familyKeyOfSession
        // This is a no-op here; filtering is applied after caller maps sessions
    }

    // ADD honor logs as synthetic sessions (if requested)
    if (includeHonor && progressState.honorLogs && progressState.honorLogs.length > 0) {
        const honorSessions = progressState.honorLogs
            .filter(h => new Date(h.date).getTime() >= cutoffMs)
            .map(h => ({
                id: `honor_${h.id}`,
                startedAt: h.date, // Assume "date" is ISO string or convertible
                endedAt: h.date,
                durationSec: (h.duration || 10) * 60, // Honor logged in minutes
                practiceId: h.domain || 'honor', // Preserve domain or use generic 'honor'
                practiceMode: null,
                configSnapshot: null,
                completion: 'completed',
                pathContext: null, // Honor logs are off-path
                scheduleMatched: null,
                metadata: { isHonor: true, honorNote: h.note || '' },
            }));

        sessions = [...sessions, ...honorSessions];
    }

    // Sort by startedAt descending (newest first)
    sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return sessions;
}

/**
 * Filter sessions by family keys
 * Requires familyKeyOfSession function as parameter
 *
 * @param {Array} sessions - Sessions to filter
 * @param {string[]} familyKeys - Target family keys
 * @param {Function} familyKeyOfSession - Function to map session to family key
 * @returns {Array} - Filtered sessions
 */
export function filterSessionsByFamilyKeys(sessions, familyKeys, familyKeyOfSession) {
    if (!familyKeys || familyKeys.length === 0) {
        return sessions;
    }

    return sessions.filter(s => {
        const fk = familyKeyOfSession(s);
        return familyKeys.includes(fk);
    });
}
