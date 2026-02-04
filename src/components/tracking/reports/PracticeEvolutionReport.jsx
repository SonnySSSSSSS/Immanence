import React from 'react';
import { AreaLineChart } from '../infographics/index.js';
import { DOMAIN_COLORS } from '../infographics/tokens.js';
import { ReportSection } from './ReportSection.jsx';

export function PracticeEvolutionReport({ data, deltaLine, milestones, bucketLabel, chartWidth }) {
    const series = [
        {
            label: 'Minutes',
            color: DOMAIN_COLORS.practice,
            data: data.buckets.map((bucket) => ({ label: bucket.label, value: bucket.minutes }))
        }
    ];

    if (data.hasAccuracy) {
        series.push({
            label: 'Accuracy',
            color: '#10b981',
            data: data.buckets.map((bucket) => ({ label: bucket.label, value: bucket.accuracy }))
        });
    }

    const interpretation = data.totalMinutes === 0
        ? 'No practice sessions recorded in this range.'
        : `Practice minutes averaged ${Math.round(data.totalMinutes / Math.max(1, data.buckets.length))} per ${bucketLabel}, with ${data.totalSessions} total sessions.`;

    const suggestion = data.totalMinutes === 0
        ? 'Complete one short session to seed the timeline.'
        : 'Aim for a consistent cadence across buckets to smooth the line.';

    return (
        <ReportSection
            title="Practice Evolution Timeline"
            infographic={<AreaLineChart series={series} width={chartWidth || 420} height={120} showArea={true} />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
