// src/reporting/selectSessions.js
// Pure session selection & filtering over progressStore
// No side effects, no imports from components or UI
// @ts-check

import { useNavigationStore } from '../state/navigationStore.js';
import { useProgressStore } from '../state/progressStore.js';
import { getLocalDateKey } from '../utils/dateUtils.js';

/** @typedef {'lifetime' | 'runId' | 'month' | 'week' | 'today'} SessionScope */
/** @typedef {'7d' | '14d' | '30d' | '90d' | '365d' | 'all'} SessionRange */
/** @typedef {'completed' | 'abandoned' | 'partial' | 'early_exit' | 'earlyExit'} CompletionToken */

/**
 * @typedef {object} SessionLike
 * @property {string} id
 * @property {string | null} startedAt
 * @property {string | null} endedAt
 * @property {number | null} durationSec
 * @property {string | null} practiceId
 * @property {string | null} practiceMode
 * @property {Record<string, unknown> | null} configSnapshot
 * @property {CompletionToken | null} completion
 * @property {{ runId?: string | null } | null} pathContext
 * @property {{ status?: string | null } | null} scheduleMatched
 * @property {{ isHonor?: boolean; honorNote?: string } | null} metadata
 */

/**
 * @typedef {object} HonorLog
 * @property {string} id
 * @property {string} date
 * @property {number | null | undefined} duration
 * @property {string | null | undefined} domain
 * @property {string | null | undefined} note
 */

/**
 * @typedef {object} SelectSessionsOptions
 * @property {SessionScope=} scope
 * @property {SessionRange=} range
 * @property {boolean=} includeHonor
 * @property {CompletionToken[] | null=} completion
 * @property {string[] | null=} practiceIds
 * @property {string[] | null=} familyKeys
 * @property {string | null=} activeRunId
 */

/**
 * @typedef {object} ActiveRunContext
 * @property {string | null} runId
 * @property {string | null} activePathId
 * @property {string | null} startedAt
 */

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
 * @param {SelectSessionsOptions} options
 * @param {boolean} options.includeHonor - Include honor logs as synthetic sessions
 * @param {CompletionToken[]} options.completion - Filter by ['completed', 'abandoned', 'partial']
 * @param {string[]} options.practiceIds - Filter by specific practiceIds
 * @param {string[]} options.familyKeys - Filter by practice family keys
 * @param {string} options.activeRunId - Optional override for 'runId' scope
 *
 * @returns {SessionLike[]} - Canonical session objects with honor logs converted to sessions
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
    const resolvedRunId = scope === 'runId'
        ? (activeRunId || navState.activePath?.runId || null)
        : null;

    /** @type {SessionLike[]} */
    const honorSessions = includeHonor && progressState.honorLogs && progressState.honorLogs.length > 0
        ? progressState.honorLogs.map(h => ({
            id: `honor_${h.id}`,
            startedAt: h.date,
            endedAt: h.date,
            durationSec: (h.duration || 10) * 60,
            practiceId: h.domain || 'honor',
            practiceMode: null,
            configSnapshot: null,
            completion: 'completed',
            pathContext: null,
            scheduleMatched: null,
            metadata: { isHonor: true, honorNote: h.note || '' },
        }))
        : [];

    // Get all sessions (V2 authoritative source plus optional synthetic honor sessions)
    /** @type {SessionLike[]} */
    let sessions = [...(progressState.sessionsV2 || []), ...honorSessions];

    // SCOPE filtering
    if (scope === 'runId') {
        if (resolvedRunId) {
            sessions = sessions.filter(s => s.pathContext?.runId === resolvedRunId);
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

    // Sort by startedAt descending (newest first)
    sessions.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());

    return sessions;
}

/**
 * Filter sessions by family keys
 * Requires familyKeyOfSession function as parameter
 *
 * @param {SessionLike[]} sessions - Sessions to filter
 * @param {string[]} familyKeys - Target family keys
 * @param {(session: SessionLike) => string} familyKeyOfSession - Function to map session to family key
 * @returns {SessionLike[]} - Filtered sessions
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
