// src/reporting/tilePolicy.js
// Pure policy helper: determine dashboard selector inputs (NOT data)
// Used by HomeHub to decide scope/range/honor settings for tile rendering

/**
 * Determine dashboard tile selector inputs based on navigation state
 * Pure function: no side effects, no store reads
 * @param {Object} options
 * @param {string} options.activeRunId - Optional active run ID
 * @returns {Object} - { scope, range, includeHonor } policy object
 */
export function getHomeDashboardPolicy(options = {}) {
    const { activeRunId = null } = options;

    // Scope logic: if active run exists, use it; else lifetime
    const scope = activeRunId ? 'runId' : 'lifetime';

    // Range: default to 30d for home dashboard
    const range = '30d';

    // Include honor logs: true by default for comprehensive view
    const includeHonor = true;

    return {
        scope,
        range,
        includeHonor,
        // Pass activeRunId for 'runId' scope resolution
        activeRunId,
    };
}
