import React from 'react';
import { TREND_COLORS, TYPOGRAPHY } from './tokens';

/**
 * Simple trend indicator arrow.
 * Uses teal/rose/gray instead of green/red to avoid color collisions.
 *
 * Props:
 * - direction: 'up' | 'down' | 'neutral'
 * - value: Optional percentage or number to display
 * - size: 'sm' | 'md' (default 'sm')
 * - showValue: Whether to show the value (default true if value provided)
 */
export function TrendArrow({
    direction = 'neutral',
    value,
    size = 'sm',
    showValue = true
}) {
    const color = TREND_COLORS[direction] || TREND_COLORS.neutral;
    const fontSize = size === 'md' ? TYPOGRAPHY.medium.size : TYPOGRAPHY.small.size;

    // Arrow character based on direction
    const arrow = direction === 'up' ? '↑'
        : direction === 'down' ? '↓'
        : '→';

    // Format value
    const displayValue = value !== undefined && showValue
        ? (direction === 'up' ? '+' : direction === 'down' ? '' : '')
            + (typeof value === 'number' ? Math.abs(value) : value)
        : null;

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                color,
                fontSize: `${fontSize}px`,
                fontWeight: 600
            }}
        >
            <span style={{ lineHeight: 1 }}>{arrow}</span>
            {displayValue !== null && (
                <span>{displayValue}</span>
            )}
        </span>
    );
}

export default TrendArrow;
