import React from 'react';
import { BarChart } from './Charts.jsx';
import { ReportSection } from './ReportSection.jsx';

export function PracticeConsistencyReport({ data, deltaLine, milestones }) {
    const topDay = data.weekdayCounts.reduce((top, item) => item.value > top.value ? item : top, { label: '-', value: 0 });
    const interpretation = data.totalSessions === 0
        ? 'No practice sessions recorded in this range.'
        : `Most sessions landed on ${topDay.label}, with ${data.totalSessions} total sessions.`;

    const suggestion = data.totalSessions === 0
        ? 'Schedule two anchor days to reestablish momentum.'
        : `Protect your strongest day (${topDay.label}) and add one adjacent support day.`;

    return (
        <ReportSection
            title="Practice Consistency Pattern"
            infographic={<BarChart data={data.weekdayCounts} barColor="#f59e0b" />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
