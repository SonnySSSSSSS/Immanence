import React from 'react';
import { CircularProgress } from './CircularProgress';
import { StatCard } from './StatCard';
import { DOMAIN_COLORS, METRIC_STATE_COLORS } from './tokens';

/**
 * Dashboard header for Navigation tab.
 * Shows hero adherence ring + stat cards for path progress.
 *
 * Props:
 * - navigationSummary: { activePath, unlockedCount, hasFoundation, pathAssessment }
 * - adherenceSummary7: { adherenceRate, avgAbsDeltaMinutes, bySlot }
 * - adherenceSummary30: same
 * - scheduleSlots: array of { slotId, time }
 * - isLight: Light mode styling
 */
export function NavigationDashboardHeader({
    navigationSummary,
    adherenceSummary7,
    adherenceSummary30,
    scheduleSlots = [],
    isLight = false
}) {
    const {
        activePath = null,
        unlockedCount = 0,
        hasFoundation = false,
        pathAssessment = null
    } = navigationSummary || {};

    // Calculate weeks completed
    const weeksCompleted = Object.keys(activePath?.weekCompletionDates || {}).length;
    const currentWeek = weeksCompleted + 1;

    // 7-day adherence as hero metric
    const adherenceRate7d = adherenceSummary7?.adherenceRate ?? null;
    const avgDelta = adherenceSummary7?.avgAbsDeltaMinutes ?? null;

    // Determine adherence color based on rate
    const getAdherenceColor = (rate) => {
        if (rate === null) return DOMAIN_COLORS.navigation;
        if (rate >= 90) return METRIC_STATE_COLORS.excellent;
        if (rate >= 70) return METRIC_STATE_COLORS.good;
        if (rate >= 50) return METRIC_STATE_COLORS.moderate;
        return METRIC_STATE_COLORS.needsWork;
    };

    // Format delta minutes
    const formatDelta = (value) => {
        if (value === null || value === undefined) return '-';
        if (value < 1) return '<1m';
        return `${Math.round(value)}m`;
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            {/* Hero Row: Adherence Ring + Stats */}
            <div
                style={{
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                }}
            >
                {/* Hero: 7-day Adherence */}
                {adherenceRate7d !== null ? (
                    <CircularProgress
                        value={adherenceRate7d}
                        max={100}
                        size="lg"
                        color={getAdherenceColor(adherenceRate7d)}
                        label="7-Day Adherence"
                        definition="% of scheduled slots started within 30min window"
                        isHero={true}
                        isLight={isLight}
                    />
                ) : (
                    <div
                        style={{
                            width: 140,
                            height: 140,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.4
                        }}
                    >
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>
                            {scheduleSlots.length === 0 ? 'No schedule set' : 'No adherence data'}
                        </span>
                    </div>
                )}

                {/* Stat Cards Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        flex: 1,
                        minWidth: '240px'
                    }}
                >
                    <StatCard
                        icon="🛤️"
                        value={activePath?.activePathId || '-'}
                        label="Active Path"
                        color={DOMAIN_COLORS.navigation}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="📅"
                        value={`Week ${currentWeek}`}
                        label={`${weeksCompleted} Completed`}
                        color={DOMAIN_COLORS.navigation}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="⏰"
                        value={formatDelta(avgDelta)}
                        label="Avg Offset"
                        definition="Average absolute time deviation from scheduled slot"
                        color={avgDelta !== null && avgDelta <= 5
                            ? METRIC_STATE_COLORS.excellent
                            : DOMAIN_COLORS.navigation}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="🔓"
                        value={unlockedCount}
                        label="Unlocked"
                        sublabel={hasFoundation ? 'Foundation ✓' : undefined}
                        color={DOMAIN_COLORS.navigation}
                        isLight={isLight}
                    />
                </div>
            </div>

            {/* Slot breakdown (if slots exist) */}
            {scheduleSlots.length > 0 && adherenceSummary7 && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        fontSize: '11px',
                        opacity: 0.7
                    }}
                >
                    {scheduleSlots.map(slot => {
                        const slotSummary = adherenceSummary7?.bySlot?.[slot.slotId];
                        const rate = slotSummary?.adherenceRate ?? null;
                        return (
                            <div key={slot.slotId} style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ fontWeight: 600 }}>
                                    Slot {slot.slotId} ({slot.time}):
                                </span>
                                <span style={{
                                    color: rate !== null && rate >= 70
                                        ? METRIC_STATE_COLORS.good
                                        : undefined
                                }}>
                                    {rate !== null ? `${rate}%` : '-'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default NavigationDashboardHeader;
