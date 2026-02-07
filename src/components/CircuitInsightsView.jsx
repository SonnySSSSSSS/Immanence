// src/components/CircuitInsightsView.jsx
// Phase 3: Visual insights for circuit practice data
// Shows: Attention trend line, challenge frequency bar chart, exercise heatmap

import React from 'react';
import { useCircuitJournalStore } from '../state/circuitJournalStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useAttentionTrendMemo, useChallengeMemo, useExerciseStatsMemo } from '../hooks/useEntryMemoization';

/**
 * CircuitInsightsView
 * Displays three visualizations:
 * 1. Line chart - Attention Quality over time
 * 2. Bar chart - Challenge frequency
 * 3. Heatmap - Exercise performance by type
 */
export function CircuitInsightsView() {
    const entries = useCircuitJournalStore(s => s.getAllEntries());
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.95)' : 'rgba(20, 25, 35, 0.95)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';
    const gridColor = isLight ? 'rgba(180, 120, 40, 0.1)' : 'rgba(255, 255, 255, 0.05)';

    // Use memoized calculations instead of manual useMemo
    const attentionData = useAttentionTrendMemo(entries);
    const challengeData = useChallengeMemo(entries);
    const heatmapData = useExerciseStatsMemo(entries);

    return (
        <div style={{
            padding: '24px',
            backgroundColor: bgColor,
            color: textColor,
            borderRadius: '16px',
            space: '24px'
        }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '28px', fontWeight: 'bold' }}>
                Practice Insights
            </h2>

            {/* Chart 1: Attention Quality Trend Line */}
            <div style={{
                marginBottom: '32px',
                backgroundColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '16px'
            }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    Attention Quality Trend
                </h3>
                {attentionData.length > 0 ? (
                    <LineChart data={attentionData} height={200} gridColor={gridColor} textColor={textColor} />
                ) : (
                    <p style={{ opacity: 0.6, margin: 0 }}>No data yet</p>
                )}
            </div>

            {/* Chart 2: Challenge Frequency Bar Chart */}
            <div style={{
                marginBottom: '32px',
                backgroundColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '16px'
            }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    Challenge Frequency
                </h3>
                {challengeData.length > 0 ? (
                    <BarChart data={challengeData} height={200} gridColor={gridColor} textColor={textColor} />
                ) : (
                    <p style={{ opacity: 0.6, margin: 0 }}>No challenges logged</p>
                )}
            </div>

            {/* Chart 3: Exercise Performance Heatmap */}
            <div style={{
                backgroundColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '16px'
            }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    Exercise Performance
                </h3>
                {heatmapData.length > 0 ? (
                    <Heatmap data={heatmapData} textColor={textColor} />
                ) : (
                    <p style={{ opacity: 0.6, margin: 0 }}>No exercise data</p>
                )}
            </div>
        </div>
    );
}

/**
 * LineChart: Attention quality over time
 */
function LineChart({ data, height, gridColor, textColor }) {
    if (data.length === 0) return null;

    const width = 600;
    const padding = 40;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const maxValue = 4;
    const yScale = innerHeight / maxValue;
    const xScale = innerWidth / Math.max(data.length - 1, 1);

    // Generate line path
    let pathD = `M ${padding + 0} ${padding + innerHeight - (data[0].value * yScale)}`;
    for (let i = 1; i < data.length; i++) {
        const x = padding + i * xScale;
        const y = padding + innerHeight - (data[i].value * yScale);
        pathD += ` L ${x} ${y}`;
    }

    const qualityColors = {
        scattered: '#ef4444',
        settling: '#f97316',
        stable: '#3b82f6',
        absorbed: '#10b981'
    };

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {[1, 2, 3, 4].map(i => (
                <line
                    key={`grid-${i}`}
                    x1={padding}
                    y1={padding + innerHeight - (i * yScale)}
                    x2={padding + innerWidth}
                    y2={padding + innerHeight - (i * yScale)}
                    stroke={gridColor}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                />
            ))}

            {/* Axes */}
            <line x1={padding} y1={padding} x2={padding} y2={padding + innerHeight} stroke={gridColor} strokeWidth={2} />
            <line x1={padding} y1={padding + innerHeight} x2={padding + innerWidth} y2={padding + innerHeight} stroke={gridColor} strokeWidth={2} />

            {/* Y-axis labels */}
            {[1, 2, 3, 4].map(i => (
                <text
                    key={`y-label-${i}`}
                    x={padding - 10}
                    y={padding + innerHeight - (i * yScale) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill={textColor}
                    opacity="0.6"
                >
                    {['Scattered', 'Settling', 'Stable', 'Absorbed'][i - 1]}
                </text>
            ))}

            {/* Line path */}
            <path
                d={pathD}
                stroke={accentColor}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((point, idx) => (
                <g key={`point-${idx}`}>
                    <circle
                        cx={padding + idx * xScale}
                        cy={padding + innerHeight - (point.value * yScale)}
                        r={4}
                        fill={qualityColors[point.label] || '#999'}
                        opacity="0.8"
                    />
                </g>
            ))}
        </svg>
    );
}

/**
 * BarChart: Challenge frequency
 */
function BarChart({ data, height, gridColor, textColor }) {
    if (data.length === 0) return null;

    const width = 600;
    const padding = 40;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const maxCount = Math.max(...data.map(d => d.count));
    const barWidth = innerWidth / data.length;
    const yScale = innerHeight / maxCount;

    const colors = ['#ef4444', '#f97316', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#94a3b8'];

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map(i => {
                const y = padding + innerHeight - (i * (innerHeight / 5));
                return (
                    <g key={`grid-${i}`}>
                        <line x1={padding} y1={y} x2={padding + innerWidth} y2={y} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />
                        <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="11" fill={textColor} opacity="0.6">
                            {Math.round((i * maxCount) / 5)}
                        </text>
                    </g>
                );
            })}

            {/* Axes */}
            <line x1={padding} y1={padding} x2={padding} y2={padding + innerHeight} stroke={gridColor} strokeWidth={2} />
            <line x1={padding} y1={padding + innerHeight} x2={padding + innerWidth} y2={padding + innerHeight} stroke={gridColor} strokeWidth={2} />

            {/* Bars */}
            {data.map((item, idx) => {
                const barHeight = item.count * yScale;
                const x = padding + idx * barWidth + barWidth * 0.1;
                const y = padding + innerHeight - barHeight;
                const bw = barWidth * 0.8;

                return (
                    <g key={`bar-${idx}`}>
                        <rect x={x} y={y} width={bw} height={barHeight} fill={colors[idx % colors.length]} opacity="0.7" />
                        <text
                            x={x + bw / 2}
                            y={padding + innerHeight + 20}
                            textAnchor="middle"
                            fontSize="11"
                            fill={textColor}
                            opacity="0.7"
                        >
                            {item.name.slice(0, 8)}
                        </text>
                        <text
                            x={x + bw / 2}
                            y={y - 5}
                            textAnchor="middle"
                            fontSize="11"
                            fill={textColor}
                            fontWeight="bold"
                        >
                            {item.count}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

/**
 * Heatmap: Exercise performance grid
 */
function Heatmap({ data, textColor }) {
    const cellSize = 40;
    const labelWidth = 150;
    const totalWidth = labelWidth + data.length * cellSize + 40;

    const getColor = (avgQuality) => {
        const q = parseFloat(avgQuality);
        if (q >= 3.5) return '#10b981'; // Absorbed
        if (q >= 2.5) return '#3b82f6'; // Stable
        if (q >= 1.5) return '#f97316'; // Settling
        return '#ef4444'; // Scattered
    };

    return (
        <div>
            <svg width={totalWidth} height={data.length * cellSize + 60} style={{ overflow: 'visible' }}>
                {/* Header row - quality scale */}
                <text x={labelWidth + 20} y={25} fontSize="12" fill={textColor} fontWeight="bold">
                    Avg Quality
                </text>

                {/* Exercise rows */}
                {data.map((exercise, idx) => {
                    const y = 50 + idx * cellSize;

                    return (
                        <g key={`exercise-${idx}`}>
                            {/* Exercise name */}
                            <text
                                x={labelWidth - 10}
                                y={y + cellSize / 2 + 4}
                                textAnchor="end"
                                fontSize="12"
                                fill={textColor}
                                opacity="0.8"
                            >
                                {exercise.name.slice(0, 20)}
                            </text>

                            {/* Quality cell */}
                            <rect
                                x={labelWidth + 20}
                                y={y}
                                width={cellSize}
                                height={cellSize}
                                fill={getColor(exercise.avgQuality)}
                                opacity="0.7"
                                rx="4"
                            />
                            <text
                                x={labelWidth + 20 + cellSize / 2}
                                y={y + cellSize / 2 + 4}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#fff"
                                fontWeight="bold"
                            >
                                {exercise.avgQuality}
                            </text>

                            {/* Count badge */}
                            <text
                                x={labelWidth + 20 + cellSize + 15}
                                y={y + cellSize / 2 + 4}
                                fontSize="11"
                                fill={textColor}
                                opacity="0.6"
                            >
                                Ã—{exercise.count}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Absorbed', color: '#10b981' },
                    { label: 'Stable', color: '#3b82f6' },
                    { label: 'Settling', color: '#f97316' },
                    { label: 'Scattered', color: '#ef4444' }
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: item.color, borderRadius: '3px', opacity: 0.7 }} />
                        <span style={{ opacity: 0.7 }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CircuitInsightsView;
