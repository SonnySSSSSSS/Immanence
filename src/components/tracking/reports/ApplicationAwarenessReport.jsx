import React from 'react';
import { LineChart } from './Charts.jsx';
import { ReportSection } from './ReportSection.jsx';

export function ApplicationAwarenessReport({ data, deltaLine, milestones, chartWidth }) {
    const interpretation = data.totalLogs === 0
        ? 'No awareness logs recorded in this range.'
        : `${data.totalLogs} awareness logs with ${data.respondedDifferentlyPercent}% responded-differently rate.`;

    const suggestion = data.totalLogs === 0
        ? 'Log a single awareness moment to re-open the streak.'
        : 'Pick one category and add a short reflection to raise response quality.';

    const series = [
        {
            label: 'Logs',
            color: '#f97316',
            data: data.buckets.map((bucket) => ({ label: bucket.label, value: bucket.count }))
        }
    ];

    return (
        <ReportSection
            title="Application Awareness Flow"
            infographic={<LineChart series={series} width={chartWidth} />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
