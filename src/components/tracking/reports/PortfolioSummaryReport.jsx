import React from 'react';
import { BarChart } from './Charts.jsx';
import { ReportSection } from './ReportSection.jsx';

export function PortfolioSummaryReport({ data, deltaLine, milestones }) {
    const interpretation = data.totalActivities === 0
        ? 'No tracked activity across domains in this range.'
        : `Activity is distributed across ${data.activeDomains} domains with ${data.totalActivities} total events.`;

    const suggestion = data.totalActivities === 0
        ? 'Start with a single practice or reading session to seed the portfolio.'
        : 'Balance the lowest bar with one focused session this week.';

    return (
        <ReportSection
            title="Portfolio Activity Mix"
            infographic={<BarChart data={data.bars} barColor="#0ea5e9" />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
