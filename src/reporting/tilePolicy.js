// src/reporting/tilePolicy.js
// Pure policy helper: determine dashboard selector inputs (NOT data)
// Used by HomeHub to decide scope/range/honor settings for tile rendering

/**
 * Determine dashboard tile selector inputs based on navigation state
 * Pure function: no side effects, no store reads
 * @param {Object} options
 * @param {string} options.activeRunId - Optional active run ID
 * @param {string} options.accessPosture - Access posture ('guided' | 'full'). Replaces legacy userMode.
 * @param {string} [options.userMode] - Legacy compat: still accepted, ignored if accessPosture provided
 * @returns {Object} - Home dashboard policy object
 */
export function getHomeDashboardPolicy(options = {}) {
    const { activeRunId = null, accessPosture = null, userMode = 'explorer' } = options;

    // Resolve effective posture: prefer accessPosture, fall back to userMode for compat
    const effectivePosture = accessPosture !== null
        ? accessPosture
        : (userMode === 'student' ? 'guided' : 'full');

    // Scope logic: if active run exists, use it; else lifetime
    const scope = activeRunId ? 'runId' : 'lifetime';

    // Range is posture-aware: guided=14d, full=90d
    const range = effectivePosture === 'guided' ? '14d' : '90d';

    // Include honor logs: true by default for comprehensive view
    const includeHonor = true;
    const variant = 'hubCard';
    const primaryMetricIds = effectivePosture === 'guided'
        ? ['completion_rate', 'on_time_rate']
        : ['sessions_total', 'days_active'];

    return {
        scope,
        range,
        includeHonor,
        activeRunId,
        variant,
        primaryMetricIds,
    };
}
