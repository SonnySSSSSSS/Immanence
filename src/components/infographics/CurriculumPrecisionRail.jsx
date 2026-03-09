// src/components/infographics/CurriculumPrecisionRail.jsx
// Read-only infographic: 14-day rolling precision rail visualization
// Shows dayStatus and leg-level details on hover

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCurriculumStore } from '../../state/curriculumStore.js';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { useNavigationStore } from '../../state/navigationStore.js';

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
        position: 'relative',
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

function getRequiredCountForDay(day, activePath) {
    if (Number.isFinite(day?.requiredCount) && day.requiredCount > 0) {
        return day.requiredCount;
    }
    if (Number.isFinite(day?.expectedLegCount) && day.expectedLegCount > 0) {
        return day.expectedLegCount;
    }
    if (Array.isArray(day?.requiredSlots) && day.requiredSlots.length > 0) {
        return day.requiredSlots.length;
    }
    if (Array.isArray(day?.expectedSlots) && day.expectedSlots.length > 0) {
        return day.expectedSlots.length;
    }
    if (Array.isArray(activePath?.schedule?.selectedTimes) && activePath.schedule.selectedTimes.length > 0) {
        return activePath.schedule.selectedTimes.length;
    }
    if (Number.isFinite(activePath?.schedule?.maxLegsPerDay) && activePath.schedule.maxLegsPerDay > 0) {
        return activePath.schedule.maxLegsPerDay;
    }
    return 0;
}

function getCompletedCountForDay(day) {
    if (Number.isFinite(day?.completedCount) && day.completedCount >= 0) {
        return day.completedCount;
    }
    if (Array.isArray(day?.satisfiedSlots)) {
        // Only count slots that were actually satisfied (status !== null)
        return day.satisfiedSlots.filter(s => s.status !== null).length;
    }
    return 0;
}

function getMarkerPalette(isLight) {
    return {
        greenFill: isLight ? 'rgba(100, 150, 80, 0.7)' : 'rgba(76, 175, 80, 0.6)',
        redFill: isLight ? 'rgba(200, 100, 80, 0.7)' : 'rgba(244, 67, 54, 0.6)',
        greenBorder: isLight ? 'rgba(100, 150, 80, 0.9)' : 'rgba(76, 175, 80, 0.8)',
        redBorder: isLight ? 'rgba(200, 100, 80, 0.9)' : 'rgba(244, 67, 54, 0.8)',
        grayFill: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(255, 255, 255, 0.08)',
        grayBorder: isLight ? 'rgba(180, 140, 90, 0.3)' : 'rgba(255, 255, 255, 0.2)',
        xStroke: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(245, 247, 250, 0.95)',
        text: isLight ? 'rgba(140, 100, 60, 0.6)' : 'rgba(255, 255, 255, 0.4)',
    };
}

function getStatusFill(status, palette) {
    if (status === 'green') {
        return { fill: palette.greenFill, border: palette.greenBorder };
    }
    if (status === 'red') {
        return { fill: palette.redFill, border: palette.redBorder };
    }
    return { fill: 'transparent', border: palette.grayBorder };
}

function getSortedSlots(day) {
    if (!Array.isArray(day?.satisfiedSlots)) return [];
    return [...day.satisfiedSlots].sort((a, b) => {
        const legDiff = (a?.legNumber ?? 0) - (b?.legNumber ?? 0);
        if (legDiff !== 0) return legDiff;
        return String(a?.time || '').localeCompare(String(b?.time || ''));
    });
}

function getMissedMarkerModel(day, activePath) {
    if (!day || day.dayStatus === 'gray' || day.isOffDay || day.isVacation) return null;

    const requiredCount = getRequiredCountForDay(day, activePath);
    const completedCount = getCompletedCountForDay(day);

    if (requiredCount <= 0 || completedCount >= requiredCount) {
        return null;
    }

    const slots = getSortedSlots(day);
    const completedSlots = slots.filter(slot => slot.status !== null);

    if (requiredCount >= 3) {
        if (completedSlots.length === 0) {
            return { shape: 'empty', showX: true };
        }
        if (completedSlots.length >= 2) {
            return {
                shape: 'split',
                showX: true,
                topStatus: completedSlots[0].status,
                bottomStatus: completedSlots[completedSlots.length - 1].status,
            };
        }

        const onlyCompleted = completedSlots[0];
        const coloredHalf = onlyCompleted?.legNumber === 1 ? 'top' : 'bottom';
        return {
            shape: 'split',
            showX: true,
            topStatus: coloredHalf === 'top' ? onlyCompleted.status : null,
            bottomStatus: coloredHalf === 'bottom' ? onlyCompleted.status : null,
        };
    }

    if (completedSlots.length === 1) {
        return {
            shape: 'solid',
            showX: true,
            status: completedSlots[0].status,
        };
    }

    return { shape: 'empty', showX: true };
}

function renderMissedMarker(model, isLight, size = '64%') {
    const palette = getMarkerPalette(isLight);
    const baseStyle = {
        position: 'absolute',
        inset: '18%',
        width: size,
        height: size,
        pointerEvents: 'none',
        overflow: 'visible',
    };

    if (!model) return null;

    if (model.shape === 'solid') {
        const solid = getStatusFill(model.status, palette);
        return (
            <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                focusable="false"
                style={baseStyle}
            >
                <circle cx="6" cy="6" r="5" fill={solid.fill} stroke={solid.border} strokeWidth="1" />
                {model.showX && (
                    <>
                        <line x1="2" y1="2" x2="10" y2="10" stroke={palette.xStroke} strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="10" y1="2" x2="2" y2="10" stroke={palette.xStroke} strokeWidth="1.6" strokeLinecap="round" />
                    </>
                )}
            </svg>
        );
    }

    if (model.shape === 'split') {
        const top = getStatusFill(model.topStatus, palette);
        const bottom = getStatusFill(model.bottomStatus, palette);
        return (
            <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                focusable="false"
                style={baseStyle}
            >
                <circle cx="6" cy="6" r="5" fill={palette.grayFill} stroke={palette.grayBorder} strokeWidth="1" />
                <path d="M1 6 A5 5 0 0 1 11 6 L11 1 L1 1 Z" fill={top.fill} />
                <path d="M1 6 A5 5 0 0 0 11 6 L11 11 L1 11 Z" fill={bottom.fill} />
                {model.showX && (
                    <>
                        <line x1="2" y1="2" x2="10" y2="10" stroke={palette.xStroke} strokeWidth="1.6" strokeLinecap="round" />
                        <line x1="10" y1="2" x2="2" y2="10" stroke={palette.xStroke} strokeWidth="1.6" strokeLinecap="round" />
                    </>
                )}
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            focusable="false"
            style={baseStyle}
        >
            <circle cx="6" cy="6" r="5" fill="transparent" stroke={palette.grayBorder} strokeWidth="1" />
            {model.showX && (
                <>
                    <line x1="2" y1="2" x2="10" y2="10" stroke={palette.xStroke} strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="10" y1="2" x2="2" y2="10" stroke={palette.xStroke} strokeWidth="1.6" strokeLinecap="round" />
                </>
            )}
        </svg>
    );
}

/**
 * CurriculumPrecisionRail — Read-only infographic showing 14-day rolling precision window
 * No interactions; hover tooltip only.
 */
export function CurriculumPrecisionRail() {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [, setHoveredIndex] = useState(null);
    const [, setTooltipPos] = useState(null);
    const [showLegend, setShowLegend] = useState(false);
    const gridRef = useRef(null);
    const [gridRect, setGridRect] = useState(null);
    const activePath = useNavigationStore(s => s.activePath);
    // Path-based runs have no program registry (activeCurriculumId is null in curriculumStore).
    // Inject correct start date + a synthetic getCurriculumDay so the rail service
    // produces 'blank' for obligation days instead of 'gray'.
    const curriculumSnapshot = useCurriculumStore.getState();
    let effectiveCurriculumState = curriculumSnapshot;
    if (activePath?.startedAt) {
        const pathRequiredLegs = activePath.schedule?.requiredLegsPerDay ?? 1;
        effectiveCurriculumState = {
            ...curriculumSnapshot,
            curriculumStartDate: activePath.startedAt,
            getCurriculumDay: (dayNumber) => {
                if (!Number.isInteger(dayNumber) || dayNumber < 1) return null;
                return {
                    dayNumber,
                    legs: Array.from({ length: pathRequiredLegs }, (_, i) => ({
                        legNumber: i + 1,
                        required: true,
                        categoryId: '_path_',
                        matchPolicy: 'ANY',
                    })),
                };
            },
        };
    }

    // Fetch the 14-day rail
    const rail = useCurriculumStore(s => s.getPrecisionRailWindow)(14, {
        selectedDaysOfWeek: Array.isArray(activePath?.schedule?.selectedDaysOfWeek) &&
            activePath.schedule.selectedDaysOfWeek.length > 0
            ? activePath.schedule.selectedDaysOfWeek
            : (activePath ? [0, 1, 2, 3, 4, 5, 6] : null),
        selectedTimes: activePath?.schedule?.selectedTimes || null,
        maxLegsPerDay: activePath?.schedule?.maxLegsPerDay ?? null,
        curriculumStoreState: effectiveCurriculumState,
    });

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

    const handleGridMouseEnter = () => {
        setShowLegend(true);
        if (gridRef.current) setGridRect(gridRef.current.getBoundingClientRect());
    };
    const handleGridMouseLeave = () => {
        setShowLegend(false);
        setGridRect(null);
    };

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
                    ref={gridRef}
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
                    const missMarkerModel = getMissedMarkerModel(day, activePath);

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
                            {!missMarkerModel && day.dayStatus === 'green' && '✓'}
                            {!missMarkerModel && day.dayStatus === 'red' && '!'}
                            {missMarkerModel && renderMissedMarker(missMarkerModel, isLight)}
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Legend popup - portal-rendered to escape overflow:hidden parents */}
            {showLegend && gridRect && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: gridRect.bottom + 6,
                        left: gridRect.left,
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
                        zIndex: 9999,
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ position: 'relative', width: '12px', height: '12px', display: 'inline-block' }}>
                            {renderMissedMarker({ shape: 'empty', showX: true }, isLight, '100%')}
                        </span>
                        X means missed a practice that day
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ position: 'relative', width: '12px', height: '12px', display: 'inline-block' }}>
                            {renderMissedMarker({ shape: 'solid', showX: true, status: 'green' }, isLight, '100%')}
                        </span>
                        2-leg: one missed, one completed
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ position: 'relative', width: '12px', height: '12px', display: 'inline-block' }}>
                            {renderMissedMarker({ shape: 'split', showX: true, topStatus: 'green', bottomStatus: 'red' }, isLight, '100%')}
                        </span>
                        3-leg: one missed, two completed
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ position: 'relative', width: '12px', height: '12px', display: 'inline-block' }}>
                            {renderMissedMarker({ shape: 'split', showX: true, topStatus: 'green', bottomStatus: null }, isLight, '100%')}
                        </span>
                        3-leg: two missed, one earlier completed
                    </span>
                </div>,
                document.body
            )}
        </div>
    );
}

export default CurriculumPrecisionRail;
