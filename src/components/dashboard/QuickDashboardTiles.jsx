// src/components/dashboard/QuickDashboardTiles.jsx
// Pure dashboard tiles display component
// Renders 5 key metrics: minutes, sessions, days, completion%, on-time%
// Plus hubCard variant with SVG infographics

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

/**
 * Render a single dashboard tile
 * @param {Object} tile - { id, label, value, subvalue?, unit? }
 * @param {boolean} isLight - Light mode flag
 */
function DashboardTile({ tile, isLight }) {
    const { id, label, value, unit } = tile;

    // Format value based on tile type
    let displayValue = value;
    if (value === null || value === undefined) {
        displayValue = '—';
    } else if (typeof value === 'number') {
        // For percent tiles, show with one decimal max
        if (id === 'completion_rate' || id === 'on_time_rate') {
            displayValue = `${Math.round(value)}%`;
        } else {
            // For count tiles, ensure integer
            displayValue = Math.round(value);
        }
    }

    return (
        <div
            className="rounded-lg p-3 backdrop-blur-sm"
            style={{
                background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isLight
                    ? 'rgba(200, 160, 100, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                flex: '1 1 auto',
                minWidth: '120px',
            }}
        >
            <div
                style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: isLight
                        ? 'rgba(100, 80, 60, 0.6)'
                        : 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '6px',
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: isLight
                        ? 'rgba(45, 35, 25, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    lineHeight: '1.2',
                }}
            >
                {displayValue}
            </div>
            {unit && (
                <div
                    style={{
                        fontSize: '9px',
                        color: isLight
                            ? 'rgba(100, 80, 60, 0.5)'
                            : 'rgba(255, 255, 255, 0.4)',
                        marginTop: '2px',
                    }}
                >
                    {unit}
                </div>
            )}
        </div>
    );
}

/**
 * Sessions infographic: horizontal bar + number
 */
function SessionsModule({ value, isLight }) {
    const cap = 60;
    const fill = Math.min(value / cap, 1);
    const barHeight = 6;
    const barColor = isLight ? 'rgba(100, 80, 60, 0.4)' : 'rgba(255, 255, 255, 0.2)';
    const fillColor = isLight ? 'rgba(100, 80, 60, 0.8)' : 'rgba(76, 175, 80, 0.8)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                {Math.round(value)}
            </div>
            <svg width="100%" height="12" viewBox="0 0 100 12" style={{ overflow: 'visible' }}>
                <rect x="0" y="3" width="100" height={barHeight} rx="3" fill={barColor} />
                <rect x="0" y="3" width={fill * 100} height={barHeight} rx="3" fill={fillColor} />
            </svg>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                Sessions
            </div>
        </div>
    );
}

/**
 * Active Days infographic: dot strip (14 dots) + number
 */
function ActiveDaysModule({ value, isLight }) {
    const dotCount = 14;
    const filled = Math.min(value, dotCount);
    const dotRadius = 3;
    const dotSpacing = 8;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                {Math.round(value)}
            </div>
            <svg width="100%" height="10" viewBox={`0 0 ${dotCount * dotSpacing} 10`} style={{ overflow: 'visible' }}>
                {Array.from({ length: dotCount }).map((_, i) => (
                    <circle
                        key={i}
                        cx={i * dotSpacing + dotRadius}
                        cy="5"
                        r={dotRadius}
                        fill={i < filled
                            ? (isLight ? 'rgba(100, 80, 60, 0.8)' : 'rgba(76, 175, 80, 0.8)')
                            : (isLight ? 'rgba(100, 80, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)')}
                    />
                ))}
            </svg>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                Active Days
            </div>
        </div>
    );
}

/**
 * Donut ring infographic for rates (completion/on-time)
 */
function RateRingModule({ value, label, isLight }) {
    const r = 20;
    const circumference = 2 * Math.PI * r;
    const progress = value === null ? 0 : Math.max(0, Math.min(value / 100, 1));
    const dashLength = progress * circumference;

    const ringColor = isLight ? 'rgba(100, 80, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    const fillColor = isLight
        ? (value === null ? ringColor : 'rgba(100, 80, 60, 0.8)')
        : (value === null ? ringColor : 'rgba(76, 175, 80, 0.8)');

    const displayValue = value === null ? '—' : `${Math.round(value)}%`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
                {/* Background ring */}
                <circle
                    cx="30"
                    cy="30"
                    r={r}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="4"
                />
                {/* Progress ring */}
                {value !== null && (
                    <circle
                        cx="30"
                        cy="30"
                        r={r}
                        fill="none"
                        stroke={fillColor}
                        strokeWidth="4"
                        strokeDasharray={`${dashLength} ${circumference}`}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                    />
                )}
            </svg>
            <div style={{ fontSize: '16px', fontWeight: '700', color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                {displayValue}
            </div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                {label}
            </div>
        </div>
    );
}

/**
 * QuickDashboardTiles — Read-only dashboard summary
 * @param {Object} props
 * @param {Object} props.tiles - Tiles object from getQuickDashboardTiles()
 *                                 Shape: { minutes_total, sessions_total, days_active, completion_rate, on_time_rate }
 * @param {string} props.variant - 'default' (5 tiles), 'hub' (4 KPI compact), or 'hubCard' (infographic card)
 * @param {Function} props.onOpenDetails - Optional callback when details button clicked (hub variants only)
 */
export function QuickDashboardTiles({ tiles = {}, variant = 'default', onOpenDetails = null }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    if (!tiles || Object.keys(tiles).length === 0) {
        return null;
    }

    // Define tile labels
    const tileLabels = {
        minutes_total: 'Total Minutes',
        sessions_total: 'Sessions',
        days_active: 'Active Days',
        completion_rate: 'Completion Rate',
        on_time_rate: 'On-Time Rate',
    };

    // Tile order based on variant
    const tileOrder = (variant === 'hub' || variant === 'hubCard')
        ? ['sessions_total', 'days_active', 'completion_rate', 'on_time_rate']
        : ['minutes_total', 'sessions_total', 'days_active', 'completion_rate', 'on_time_rate'];

    // Build ordered tiles with labels from tiles object
    const orderedTiles = tileOrder.map(id => ({
        id,
        label: tileLabels[id] || id,
        value: tiles[id],
        unit: id === 'minutes_total' ? 'min' : '',
    }));

    // HubCard variant: infographic card with glass container
    if (variant === 'hubCard') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    background: isLight
                        ? 'rgba(255, 250, 240, 0.6)'
                        : 'rgba(20, 25, 30, 0.6)',
                    border: `1px solid ${isLight
                        ? 'rgba(200, 160, 100, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 8px 24px ${isLight
                        ? 'rgba(0, 0, 0, 0.1)'
                        : 'rgba(0, 0, 0, 0.3)'}`,
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '8px', borderBottom: `1px solid ${isLight ? 'rgba(200, 160, 100, 0.15)' : 'rgba(255, 255, 255, 0.08)'}` }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                        Progress Overview
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                        90 Days
                    </div>
                </div>

                {/* 2x2 infographic grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                    }}
                >
                    <SessionsModule value={tiles.sessions_total || 0} isLight={isLight} />
                    <ActiveDaysModule value={tiles.days_active || 0} isLight={isLight} />
                    <RateRingModule value={tiles.completion_rate ?? null} label="Completion" isLight={isLight} />
                    <RateRingModule value={tiles.on_time_rate ?? null} label="On-Time" isLight={isLight} />
                </div>

                {/* Details button */}
                {onOpenDetails && (
                    <button
                        onClick={onOpenDetails}
                        style={{
                            padding: '8px 12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            border: 'none',
                            borderRadius: '6px',
                            background: isLight
                                ? 'rgba(100, 80, 60, 0.15)'
                                : 'rgba(255, 255, 255, 0.08)',
                            color: isLight
                                ? 'rgba(45, 35, 25, 0.8)'
                                : 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            transition: 'all 150ms ease-out',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = isLight
                                ? 'rgba(100, 80, 60, 0.25)'
                                : 'rgba(255, 255, 255, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = isLight
                                ? 'rgba(100, 80, 60, 0.15)'
                                : 'rgba(255, 255, 255, 0.08)';
                        }}
                    >
                        View Details
                    </button>
                )}
            </div>
        );
    }

    // Hub variant: compact 4-KPI card with details button
    if (variant === 'hub') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '8px',
                    marginBottom: '8px',
                }}
            >
                {/* 4-tile compact grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                    }}
                >
                    {orderedTiles.map(tile => (
                        <DashboardTile key={tile.id} tile={tile} isLight={isLight} />
                    ))}
                </div>

                {/* Details button */}
                {onOpenDetails && (
                    <button
                        onClick={onOpenDetails}
                        style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            border: 'none',
                            borderRadius: '4px',
                            background: isLight
                                ? 'rgba(100, 80, 60, 0.2)'
                                : 'rgba(255, 255, 255, 0.1)',
                            color: isLight
                                ? 'rgba(45, 35, 25, 0.8)'
                                : 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            transition: 'all 150ms ease-out',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = isLight
                                ? 'rgba(100, 80, 60, 0.3)'
                                : 'rgba(255, 255, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = isLight
                                ? 'rgba(100, 80, 60, 0.2)'
                                : 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        View Details
                    </button>
                )}
            </div>
        );
    }

    // Default variant: 5-tile horizontal layout
    return (
        <div
            style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '16px',
            }}
        >
            {orderedTiles.map(tile => (
                <DashboardTile key={tile.id} tile={tile} isLight={isLight} />
            ))}
        </div>
    );
}

export default QuickDashboardTiles;
