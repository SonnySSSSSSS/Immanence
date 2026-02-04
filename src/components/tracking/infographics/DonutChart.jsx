import React, { useMemo, useState } from 'react';
import { STROKE, RADIUS, ANIM } from './tokens';
import { ChartTooltip, useChartTooltip } from './ChartTooltip';

/**
 * Donut chart for category breakdowns.
 * Shows proportional segments with legend below.
 *
 * Props:
 * - segments: Array of { label, value, color }
 * - size: Chart diameter in pixels (default 160)
 * - innerRadius: Inner circle radius (default 60% of outer)
 * - showLegend: Show legend below (default true)
 * - showTooltip: Enable hover tooltips (default true)
 */
export function DonutChart({
    segments = [],
    size = 160,
    innerRadius = null,
    showLegend = true,
    showTooltip = true
}) {
    const { tooltipProps, showTooltip: onShowTooltip, hideTooltip } = useChartTooltip();
    const [activeIndex, setActiveIndex] = useState(null);

    // Calculate dimensions
    const radius = size / 2;
    const innerR = innerRadius ?? radius * 0.6;
    const outerR = radius;

    // Calculate arcs
    const { arcs, total } = useMemo(() => {
        const t = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
        let currentAngle = -Math.PI / 2; // Start at top

        const arcSegments = segments.map((segment, i) => {
            const sliceAngle = (segment.value / t) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;

            // Calculate start point
            const x1 = radius + outerR * Math.cos(startAngle);
            const y1 = radius + outerR * Math.sin(startAngle);

            // Calculate end point
            const x2 = radius + outerR * Math.cos(endAngle);
            const y2 = radius + outerR * Math.sin(endAngle);

            // Calculate inner points
            const x3 = radius + innerR * Math.cos(endAngle);
            const y3 = radius + innerR * Math.sin(endAngle);

            const x4 = radius + innerR * Math.cos(startAngle);
            const y4 = radius + innerR * Math.sin(startAngle);

            // Create SVG path
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const path = [
                `M ${x1} ${y1}`,
                `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
                'Z'
            ].join(' ');

            currentAngle = endAngle;

            // Midpoint for label positioning
            const midAngle = startAngle + sliceAngle / 2;
            const labelRadius = (outerR + innerR) / 2;
            const labelX = radius + labelRadius * Math.cos(midAngle);
            const labelY = radius + labelRadius * Math.sin(midAngle);

            return {
                path,
                color: segment.color,
                label: segment.label,
                value: segment.value,
                percent: Math.round((segment.value / t) * 100),
                labelX,
                labelY,
                midAngle
            };
        });

        return { arcs: arcSegments, total: t };
    }, [segments, radius, innerR, outerR]);

    // Percentage calculation
    const getPercent = (value) => Math.round((value / total) * 100);

    const handleMouseEnter = (e, arc, index) => {
        setActiveIndex(index);
        const rect = e.currentTarget.getBoundingClientRect();
        onShowTooltip(
            { currentTarget: e.currentTarget, clientX: rect.left + arc.labelX, clientY: rect.top + arc.labelY },
            `${arc.value}`,
            `${arc.percent}%`
        );
    };

    const handleMouseLeave = () => {
        setActiveIndex(null);
        hideTooltip();
    };

    if (segments.length === 0) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.4,
                    fontSize: '11px'
                }}
            >
                No data
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Chart */}
            <div
                style={{ position: 'relative', width: size, height: size }}
                data-tooltip-container
            >
                <svg width={size} height={size} style={{ display: 'block' }}>
                    {arcs.map((arc, i) => (
                        <g key={i}>
                            <path
                                d={arc.path}
                                fill={arc.color}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={1}
                                opacity={activeIndex === i ? 1 : 0.8}
                                style={{
                                    cursor: 'pointer',
                                    transition: `opacity ${ANIM.hover}ms ease`
                                }}
                                onMouseEnter={(e) => handleMouseEnter(e, arc, i)}
                                onMouseLeave={handleMouseLeave}
                            />

                            {/* Label */}
                            {arc.percent >= 10 && (
                                <text
                                    x={arc.labelX}
                                    y={arc.labelY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="10"
                                    fontWeight="600"
                                    fill="rgba(255,255,255,0.9)"
                                    pointerEvents="none"
                                >
                                    {arc.percent}%
                                </text>
                            )}
                        </g>
                    ))}
                </svg>

                {/* Tooltip */}
                {showTooltip && (
                    <ChartTooltip {...tooltipProps} />
                )}
            </div>

            {/* Legend */}
            {showLegend && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        justifyContent: 'center',
                        fontSize: '11px'
                    }}
                >
                    {segments.map((seg, i) => (
                        <div
                            key={seg.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                opacity: activeIndex === i ? 1 : 0.7,
                                transition: `opacity ${ANIM.hover}ms ease`
                            }}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: seg.color
                                }}
                            />
                            <span>{seg.label}</span>
                            <span style={{ opacity: 0.6 }}>({getPercent(seg.value)}%)</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DonutChart;
