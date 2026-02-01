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
 * QuickDashboardTiles — Read-only dashboard summary (5 tiles)
 * @param {Object} props
 * @param {Object} props.tiles - Tiles object from getQuickDashboardTiles()
 *                                 Shape: { minutes_total, sessions_total, days_active, completion_rate, on_time_rate }
 */
export function QuickDashboardTiles({ tiles = {} }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    if (!tiles || Object.keys(tiles).length === 0) {
        return null;
    }

    // Define tile labels and ordering by ID
    const tileLabels = {
        minutes_total: 'Total Minutes',
        sessions_total: 'Sessions',
        days_active: 'Active Days',
        completion_rate: 'Completion Rate',
        on_time_rate: 'On-Time Rate',
    };

    // Canonical tile order
    const tileOrder = ['minutes_total', 'sessions_total', 'days_active', 'completion_rate', 'on_time_rate'];

    // Build ordered tiles with labels from tiles object
    const orderedTiles = tileOrder.map(id => ({
        id,
        label: tileLabels[id] || id,
        value: tiles[id],
        unit: id === 'minutes_total' ? 'min' : '',
    }));

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
