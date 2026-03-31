// src/reporting/tilePolicy.ts
// Pure policy helper: determine dashboard selector inputs (NOT data)
// Used by HomeHub to decide scope/range/honor settings for tile rendering

export type UserMode = 'student' | 'explorer';
export type AccessPosture = 'guided' | 'full';
export type DashboardScope = 'runId' | 'lifetime';
export type DashboardRange = '14d' | '90d';
export type DashboardVariant = 'hubCard';
export type PrimaryMetricId = 'completion_rate' | 'on_time_rate' | 'sessions_total' | 'days_active';

export interface HomeDashboardPolicy {
  scope: DashboardScope;
  range: DashboardRange;
  includeHonor: boolean;
  activeRunId: string | null;
  variant: DashboardVariant;
  primaryMetricIds: PrimaryMetricId[];
  /** Show honor bank UI in guided/student mode */
  includeHonorBank: boolean;
}

interface GetHomeDashboardPolicyOptions {
  activeRunId?: string | null;
  accessPosture?: AccessPosture | null;
  userMode?: UserMode;
}

/**
 * Determine dashboard tile selector inputs based on navigation state
 * Pure function: no side effects, no store reads
 * @param options - Configuration object
 * @returns Home dashboard policy object
 */
export function getHomeDashboardPolicy(options: GetHomeDashboardPolicyOptions = {}): HomeDashboardPolicy {
    const { activeRunId = null, accessPosture = null, userMode = 'explorer' } = options;

    // Resolve effective posture: prefer accessPosture, fall back to userMode for compat
    const effectivePosture: AccessPosture = accessPosture !== null
        ? accessPosture
        : (userMode === 'student' ? 'guided' : 'full');

    // Scope logic: if active run exists, use it; else lifetime
    const scope: DashboardScope = activeRunId ? 'runId' : 'lifetime';

    // Range is posture-aware: guided=14d, full=90d
    const range: DashboardRange = effectivePosture === 'guided' ? '14d' : '90d';

    // Include honor logs: true by default for comprehensive view
    const includeHonor = true;
    const variant: DashboardVariant = 'hubCard';
    const includeHonorBank = effectivePosture === 'guided';
    const primaryMetricIds: PrimaryMetricId[] = effectivePosture === 'guided'
        ? ['completion_rate', 'on_time_rate']
        : ['sessions_total', 'days_active'];

    return {
        scope,
        range,
        includeHonor,
        activeRunId,
        variant,
        primaryMetricIds,
      includeHonorBank,
    };
}
