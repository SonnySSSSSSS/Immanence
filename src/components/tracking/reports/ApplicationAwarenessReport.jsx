import React from 'react';
import { AreaLineChart } from '../infographics/index.js';
import { DOMAIN_COLORS } from '../infographics/tokens.js';
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
            color: DOMAIN_COLORS.application,
            data: data.buckets.map((bucket) => ({ label: bucket.label, value: bucket.count }))
        }
    ];

    return (
        <ReportSection
            title="Application Awareness Flow"
            infographic={<AreaLineChart series={series} width={chartWidth || 420} height={120} showArea={true} />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
