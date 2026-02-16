// src/reporting/tilePolicy.js
// Pure policy helper: determine dashboard selector inputs (NOT data)
// Used by HomeHub to decide scope/range/honor settings for tile rendering

/**
 * Determine dashboard tile selector inputs based on navigation state
 * Pure function: no side effects, no store reads
 * @param {Object} options
 * @param {string} options.activeRunId - Optional active run ID
 * @param {string} options.userMode - User mode ('student' | 'explorer')
 * @returns {Object} - Home dashboard policy object
 */
export function getHomeDashboardPolicy(options = {}) {
    const { activeRunId = null, userMode = 'explorer' } = options;

    // Scope logic: if active run exists, use it; else lifetime
    const scope = activeRunId ? 'runId' : 'lifetime';

    // Range is mode-aware: student=14d, explorer=90d
    const range = userMode === 'student' ? '14d' : '90d';

    // Include honor logs: true by default for comprehensive view
    const includeHonor = true;
    const variant = 'hubCard';
    const primaryMetricIds = userMode === 'student'
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
