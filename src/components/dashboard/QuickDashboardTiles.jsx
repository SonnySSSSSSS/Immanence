// src/components/dashboard/QuickDashboardTiles.jsx
// Pure dashboard tiles display component
// Renders 5 key metrics: minutes, sessions, days, completion%, on-time%

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
 * QuickDashboardTiles — Read-only dashboard summary
 * @param {Object} props
 * @param {Object} props.tiles - Tiles object from getQuickDashboardTiles()
 *                                 Shape: { minutes_total, sessions_total, days_active, completion_rate, on_time_rate }
 * @param {string} props.variant - 'default' (5 tiles) or 'hub' (4 KPI compact card)
 * @param {Function} props.onOpenDetails - Optional callback when details button clicked (hub variant only)
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
    const tileOrder = variant === 'hub'
        ? ['sessions_total', 'days_active', 'completion_rate', 'on_time_rate']
        : ['minutes_total', 'sessions_total', 'days_active', 'completion_rate', 'on_time_rate'];

    // Build ordered tiles with labels from tiles object
    const orderedTiles = tileOrder.map(id => ({
        id,
        label: tileLabels[id] || id,
        value: tiles[id],
        unit: id === 'minutes_total' ? 'min' : '',
    }));

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
