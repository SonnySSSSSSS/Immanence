// src/components/infographics/CurriculumPrecisionRail.jsx
// Read-only infographic: 14-day rolling precision rail visualization
// Shows dayStatus and leg-level details on hover

import React, { useState } from 'react';
import { useCurriculumStore } from '../../state/curriculumStore.js';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

/**
 * Format leg details for tooltip
 * @param {Object} slot - satisfiedSlot from rail entry
 * @returns {string} - Formatted leg display
 */
function formatLegDetail(slot) {
    const statusLabel = slot.status === 'green' ? 'green' : slot.status === 'red' ? 'red' : 'unmet';
    const deltaStr = slot.deltaMinutes !== null ? ` ${slot.deltaMinutes > 0 ? '+' : ''}${slot.deltaMinutes}m` : '';
    return `leg${slot.legNumber} ${slot.categoryId} ${slot.time} ${statusLabel}${deltaStr}`;
}

/**
 * Build tooltip string for a rail day entry
 * @param {Object} day - Rail day entry
 * @returns {string} - Multi-line tooltip
 */
function buildDayTooltip(day) {
    const lines = [
        `${day.dateKeyLocal} | ${day.dayStatus}`,
    ];

    if (day.dayStatus === 'gray') {
        if (day.isOffDay) lines.push('(off-day)');
        if (day.isVacation) lines.push('(vacation)');
        if (day.precisionMode === 'advanced') lines.push('(advanced mode)');
    } else if (day.satisfiedSlots && day.satisfiedSlots.length > 0) {
        day.satisfiedSlots.forEach(slot => {
            lines.push(formatLegDetail(slot));
        });
    }

    return lines.join('\n');
}

/**
 * Get background color/style for a day cell based on dayStatus
 * @param {string} dayStatus - 'gray'|'blank'|'green'|'red'
 * @param {boolean} isLight - Is light mode active
 * @returns {Object} - Inline style object
 */
function getDayStyle(dayStatus, isLight) {
    const baseStyle = {
        width: '100%',
        aspectRatio: '1',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        transition: 'opacity 150ms ease-out',
        fontSize: '10px',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: '1.2',
    };

    switch (dayStatus) {
        case 'gray':
            return {
                ...baseStyle,
                background: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? 'rgba(140, 100, 60, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
            };

        case 'blank':
            return {
                ...baseStyle,
                background: 'transparent',
                color: isLight ? 'rgba(140, 100, 60, 0.6)' : 'rgba(255, 255, 255, 0.4)',
                border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
            };

        case 'green':
            return {
                ...baseStyle,
                background: isLight ? 'rgba(100, 150, 80, 0.7)' : 'rgba(76, 175, 80, 0.6)',
                color: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${isLight ? 'rgba(100, 150, 80, 0.9)' : 'rgba(76, 175, 80, 0.8)'}`,
                content: '✓',
            };

        case 'red':
            return {
                ...baseStyle,
                background: isLight ? 'rgba(200, 100, 80, 0.7)' : 'rgba(244, 67, 54, 0.6)',
                color: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${isLight ? 'rgba(200, 100, 80, 0.9)' : 'rgba(244, 67, 54, 0.8)'}`,
                content: '!',
            };

        default:
            return baseStyle;
    }
}

/**
 * CurriculumPrecisionRail — Read-only infographic showing 14-day rolling precision window
 * No interactions; hover tooltip only.
 */
export function CurriculumPrecisionRail() {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPos, setTooltipPos] = useState(null);
    const [showLegend, setShowLegend] = useState(false);

    // Fetch the 14-day rail
    const rail = useCurriculumStore(s => s.getPrecisionRailWindow)(14);

    if (!rail || rail.length === 0) {
        return null; // No rail data; don't render
    }

    const handleMouseEnter = (index, event) => {
        setHoveredIndex(index);
        // Position tooltip near the cell
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
        });
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltipPos(null);
    };

    const handleGridMouseEnter = () => setShowLegend(true);
    const handleGridMouseLeave = () => setShowLegend(false);

    return (
        <div style={{ position: 'relative' }}>
            <div
                className="curriculum-precision-rail"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 0',
                    fontFamily: 'var(--font-body)',
                }}
            >
                {/* Label */}
                <div
                    style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: isLight ? 'rgba(100, 80, 60, 0.7)' : 'var(--accent-40)',
                    }}
                >
                    14-Day Precision Window
                </div>

                {/* Rail cells (14 cells, oldest on left, newest on right) */}
                <div
                    onMouseEnter={handleGridMouseEnter}
                    onMouseLeave={handleGridMouseLeave}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(14, 1fr)',
                        gap: '4px',
                        position: 'relative',
                    }}
            >
                {rail.map((day, index) => {
                    const tooltip = buildDayTooltip(day);
                    const dayStyle = getDayStyle(day.dayStatus, isLight);
                    const isHovered = hoveredIndex === index;

                    return (
                        <div
                            key={`rail-day-${index}`}
                            onMouseEnter={e => handleMouseEnter(index, e)}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                ...dayStyle,
                                opacity: 0.9,
                                boxShadow: 'none',
                            }}
                            title={tooltip}
                        >
                            {day.dayStatus === 'green' && '✓'}
                            {day.dayStatus === 'red' && '!'}
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Legend popup - appears on hover over grid, positioned absolutely */}
            {showLegend && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        marginTop: '6px',
                        fontSize: '9px',
                        color: isLight ? 'rgba(100, 80, 60, 0.7)' : 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        background: isLight ? 'rgba(250, 246, 238, 0.95)' : 'rgba(10, 12, 16, 0.95)',
                        border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '6px',
                        padding: '8px 12px',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10,
                        pointerEvents: 'none',
                        animation: 'fadeIn 150ms ease-out',
                    }}
                >
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                    `}</style>
                    <span>
                        <span
                            style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isLight ? 'rgba(100, 150, 80, 0.7)' : 'rgba(76, 175, 80, 0.6)',
                                marginRight: '4px',
                                verticalAlign: 'middle',
                            }}
                        />
                        on-time
                    </span>
                    <span>
                        <span
                            style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isLight ? 'rgba(200, 100, 80, 0.7)' : 'rgba(244, 67, 54, 0.6)',
                                marginRight: '4px',
                                verticalAlign: 'middle',
                            }}
                        />
                        late
                    </span>
                    <span>
                        <span
                            style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                                background: 'transparent',
                                marginRight: '4px',
                                verticalAlign: 'middle',
                            }}
                        />
                        unmet
                    </span>
                    <span>
                        <span
                            style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                marginRight: '4px',
                                verticalAlign: 'middle',
                            }}
                        />
                        off/pause
                    </span>
                </div>
            )}
        </div>
    );
}

export default CurriculumPrecisionRail;
