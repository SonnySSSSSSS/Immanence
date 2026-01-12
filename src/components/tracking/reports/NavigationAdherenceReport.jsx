import React from 'react';
import { BarChart } from './Charts.jsx';
import { ReportSection } from './ReportSection.jsx';

export function NavigationAdherenceReport({ data, deltaLine, milestones }) {
    const interpretation = data.totalEntries === 0
        ? 'No schedule adherence records in this range.'
        : `Overall adherence rate was ${data.adherenceRate}%, with an average absolute offset of ${data.avgAbsDelta} minutes.`;

    const suggestion = data.totalEntries === 0
        ? 'Log a practice start near a scheduled slot to begin tracking adherence.'
        : 'Pick one slot to tighten within the 15-minute window this week.';

    return (
        <ReportSection
            title="Navigation Schedule Adherence"
            infographic={<BarChart data={data.slotBars} barColor="#14b8a6" />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
