import React from 'react';
import { CircularProgress } from './CircularProgress';
import { StatCard } from './StatCard';
import { DOMAIN_COLORS, METRIC_STATE_COLORS } from './tokens';

/**
 * Dashboard header for Application tab.
 * Shows hero responded-differently ring + stat cards for logs and mode training.
 *
 * Props:
 * - applicationSummary: { totalLogs, recent7, recent30, recent90, modeStats, modeSessionsCount, chainCount, patternStats }
 * - isLight: Light mode styling
 */
export function ApplicationDashboardHeader({
    applicationSummary,
    isLight = false
}) {
    const {
        totalLogs = 0,
        recent7 = {},
        recent30 = {},
        modeStats = {},
        modeSessionsCount = 0,
        chainCount = 0,
        patternStats = null
    } = applicationSummary || {};

    // Hero metric: responded-differently rate (30-day)
    const respondedDifferentlyRate = recent30?.respondedDifferentlyPercent ?? null;

    // Calculate total mode training count
    const totalModeCount = Object.values(modeStats || {}).reduce(
        (sum, stats) => sum + (stats?.count || 0),
        0
    );

    // Chain completion ratio
    const chainCompletionRate = patternStats?.completionRatio
        ? Math.round(patternStats.completionRatio * 100)
        : null;

    // Get rate color
    const getRateColor = (rate) => {
        if (rate === null) return DOMAIN_COLORS.application;
        if (rate >= 50) return METRIC_STATE_COLORS.excellent;
        if (rate >= 30) return METRIC_STATE_COLORS.good;
        if (rate >= 15) return METRIC_STATE_COLORS.moderate;
        return METRIC_STATE_COLORS.needsWork;
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            {/* Hero Row: Responded Differently Ring + Stats */}
            <div
                style={{
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                }}
            >
                {/* Hero: Responded Differently Rate */}
                {respondedDifferentlyRate !== null && recent30.total > 0 ? (
                    <CircularProgress
                        value={respondedDifferentlyRate}
                        max={100}
                        size="lg"
                        color={getRateColor(respondedDifferentlyRate)}
                        label="Responded Differently"
                        definition="% of logged situations with alternative response (30d)"
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
                            No awareness data
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
                        icon="📝"
                        value={totalLogs}
                        label="Total Logs"
                        sublabel={`${recent7.total || 0} this week`}
                        color={DOMAIN_COLORS.application}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="🧠"
                        value={totalModeCount}
                        label="Mode Training"
                        sublabel={`${modeSessionsCount} sessions`}
                        color={DOMAIN_COLORS.application}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="🔗"
                        value={chainCount}
                        label="Chains"
                        sublabel={chainCompletionRate !== null
                            ? `${chainCompletionRate}% completion`
                            : undefined}
                        color={DOMAIN_COLORS.application}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="📊"
                        value={`${recent30.respondedDifferentlyPercent || 0}%`}
                        label="30-Day Rate"
                        sublabel={`${recent30.respondedDifferently || 0} of ${recent30.total || 0}`}
                        definition="Situations where you responded differently than usual"
                        color={DOMAIN_COLORS.application}
                        isLight={isLight}
                    />
                </div>
            </div>

            {/* Mode breakdown (if any training) */}
            {totalModeCount > 0 && (
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
                    {['Mirror', 'Prism', 'Wave', 'Sword'].map(mode => {
                        const stats = modeStats[mode.toLowerCase()] || modeStats[mode];
                        const count = stats?.count || 0;
                        return (
                            <div key={mode} style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ fontWeight: 600 }}>{mode}:</span>
                                <span>{count}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ApplicationDashboardHeader;
