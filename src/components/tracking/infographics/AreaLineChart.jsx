import React, { useMemo, useState, useId } from 'react';
import { STROKE, ANIM } from './tokens';
import { ChartTooltip } from './ChartTooltip';
import { useChartTooltip } from './useChartTooltip';

/**
 * Enhanced line chart with gradient area fill.
 * Replaces old Charts.jsx LineChart gradually.
 *
 * Props:
 * - series: Array of { label, color, data: [{value, label?}, ...] }
 * - width: Chart width (default 420)
 * - height: Chart height (default 120)
 * - showArea: Show gradient fill under line (default true)
 * - showGrid: Show subtle grid lines (default true)
 * - showTooltip: Enable hover tooltips (default true)
 */
export function AreaLineChart({
    series = [],
    width = 420,
    height = 120,
    showArea = true,
    showGrid = true,
    showTooltip = true
}) {
    const { tooltipProps, showTooltip: onShowTooltip, hideTooltip } = useChartTooltip();
    const [activeIndex, setActiveIndex] = useState(null);

    // Compute line paths and max value
    const { lines, points } = useMemo(() => {
        if (!series.length) return { lines: [], points: [] };

        // Flatten all values to find min/max
        const allValues = series.flatMap(s => s.data.map(d => d.value || 0));
        const min = Math.min(...allValues, 0);
        const max = Math.max(...allValues, 1);
        const range = max - min || 1;

        const padding = 16;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Build paths for each series
        const lineSeries = series.map(line => {
            const pts = line.data.map((d, i) => {
                const x = padding + (i / Math.max(1, line.data.length - 1)) * chartWidth;
                const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
                return { x, y, value: d.value, label: d.label };
            });

            const linePath = pts.map((p, i) =>
                (i === 0 ? 'M' : 'L') + `${p.x.toFixed(1)},${p.y.toFixed(1)}`
            ).join(' ');

            const areaPath = linePath +
                ` L${pts[pts.length - 1]?.x.toFixed(1) || 0},${height - padding}` +
                ` L${padding},${height - padding} Z`;

            return {
                label: line.label,
                color: line.color,
                linePath,
                areaPath,
                points: pts
            };
        });

        // Flatten all points for hover detection
        const allPoints = [];
        series.forEach((s) => {
            s.data.forEach((d, dataIdx) => {
                allPoints.push({
                    x: padding + (dataIdx / Math.max(1, s.data.length - 1)) * chartWidth,
                    y: padding + chartHeight - ((d.value - min) / range) * chartHeight,
                    value: d.value,
                    label: d.label,
                    seriesLabel: s.label,
                    color: s.color,
                    dataIndex: dataIdx
                });
            });
        });

        return {
            lines: lineSeries,
            points: allPoints
        };
    }, [series, width, height]);

    // Gradient IDs — stable per component instance
    const _baseId = useId();
    const gradientIds = series.map((_s, i) => `area-gradient-${_baseId.replace(/:/g, '')}-${i}`);

    // Grid lines (5 horizontal)
    const gridLines = useMemo(() => {
        const padding = 16;
        const chartHeight = height - padding * 2;
        return Array.from({ length: 4 }, (_, i) => {
            const y = padding + ((i + 1) / 5) * chartHeight;
            return y;
        });
    }, [height]);

    // Handle mouse move for tooltip
    const handleMouseMove = (e) => {
        if (!showTooltip || !points.length) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        // Find closest point
        let closestIdx = 0;
        let closestDist = Infinity;
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - mouseX);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        });

        if (closestDist < 20) {
            setActiveIndex(closestIdx);
            const point = points[closestIdx];
            onShowTooltip(
                { currentTarget: e.currentTarget, clientX: rect.left + point.x, clientY: rect.top + point.y },
                point.value,
                `${point.seriesLabel} - ${point.label || `Point ${point.dataIndex}`}`
            );
        }
    };

    const handleMouseLeave = () => {
        setActiveIndex(null);
        hideTooltip();
    };

    if (!series.length) {
        return (
            <div
                style={{
                    width,
                    height,
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
        <div
            style={{ position: 'relative', width, height }}
            data-tooltip-container
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <svg width={width} height={height} style={{ display: 'block' }}>
                {/* Gradient definitions */}
                {showArea && (
                    <defs>
                        {lines.map((line, i) => (
                            <linearGradient
                                key={gradientIds[i]}
                                id={gradientIds[i]}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor={line.color} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={line.color} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>
                )}

                {/* Grid lines */}
                {showGrid && gridLines.map((y, i) => (
                    <line
                        key={`grid-${i}`}
                        x1={16}
                        y1={y}
                        x2={width - 16}
                        y2={y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                ))}

                {/* Area fills */}
                {showArea && lines.map((line, i) => (
                    <path
                        key={`area-${i}`}
                        d={line.areaPath}
                        fill={`url(#${gradientIds[i]})`}
                        pointerEvents="none"
                    />
                ))}

                {/* Lines */}
                {lines.map((line, i) => (
                    <path
                        key={`line-${i}`}
                        d={line.linePath}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={STROKE.md}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                        style={{
                            transition: `opacity ${ANIM.mount}ms ease-out`
                        }}
                    />
                ))}

                {/* Active point indicator */}
                {activeIndex !== null && points[activeIndex] && (
                    <circle
                        cx={points[activeIndex].x}
                        cy={points[activeIndex].y}
                        r={5}
                        fill={points[activeIndex].color}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={2}
                        pointerEvents="none"
                    />
                )}
            </svg>

            {/* Tooltip */}
            {showTooltip && (
                <ChartTooltip {...tooltipProps} />
            )}
        </div>
    );
}

export default AreaLineChart;
