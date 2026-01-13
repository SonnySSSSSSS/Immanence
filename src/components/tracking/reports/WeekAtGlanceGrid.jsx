// src/components/tracking/reports/WeekAtGlanceGrid.jsx
// 7-day grid showing activity/consistency at a glance

import React from 'react';

/**
 * WeekAtGlanceGrid
 * @param {Array} dailyData - 7 items, each { day, count, intensity: 0-1 }
 * @param {string} domainColor - CSS color for activity indicators
 * @param {boolean} isLight - Light mode toggle
 */
export function WeekAtGlanceGrid({ dailyData = [], domainColor = '#2563eb', isLight = false }) {
    const config = {
        light: {
            labelColor: 'rgba(60, 50, 40, 0.7)',
            emptyColor: 'rgba(180, 155, 110, 0.15)',
            borderColor: 'rgba(180, 155, 110, 0.2)'
        },
        dark: {
            labelColor: 'rgba(255, 255, 255, 0.6)',
            emptyColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
        }
    };

    const theme = config[isLight ? 'light' : 'dark'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Normalize intensity (0-1) to opacity
    const getOpacity = (intensity) => Math.max(0.2, Math.min(1, intensity));

    return (
        <div className="flex flex-col gap-3">
            {/* Day labels */}
            <div className="flex justify-between px-1 gap-1">
                {dayLabels.map((day, i) => (
                    <div key={i} className="flex-1 text-center">
                        <span
                            className="text-xs font-semibold uppercase tracking-tight"
                            style={{ color: theme.labelColor }}
                        >
                            {day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Activity circles */}
            <div className="flex justify-between gap-1">
                {dailyData.map((day, i) => {
                    const intensity = day.intensity || 0;
                    const opacity = getOpacity(intensity);
                    const isActive = intensity > 0;

                    return (
                        <div
                            key={i}
                            className="flex-1 aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                            style={{
                                background: isActive
                                    ? domainColor
                                    : theme.emptyColor,
                                opacity: isActive ? opacity : 0.5,
                                border: `1px solid ${theme.borderColor}`,
                                color: isActive ? 'rgba(255, 255, 255, 0.8)' : theme.labelColor
                            }}
                            title={`${day.day}: ${day.count || 0} sessions`}
                        >
                            {day.count || 0}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex justify-between text-[10px] mt-1" style={{ color: theme.labelColor }}>
                <span>Low activity</span>
                <span>Peak activity</span>
            </div>
        </div>
    );
}
