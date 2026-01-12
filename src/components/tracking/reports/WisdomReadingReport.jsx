import React from 'react';
import { BarChart } from './Charts.jsx';
import { ReportSection } from './ReportSection.jsx';

export function WisdomReadingReport({ data, deltaLine, milestones }) {
    const interpretation = data.totalSessions === 0
        ? 'No reading sessions recorded in this range.'
        : `You logged ${data.totalSessions} reading sessions totaling ${data.totalMinutes} minutes, with ${data.quizCount || 0} quiz attempts.`;

    const suggestion = data.totalSessions === 0
        ? 'Open one section and record a short read to seed the archive.'
        : 'Schedule a fixed reading slot to raise weekly consistency.';

    return (
        <ReportSection
            title="Wisdom Reading Tempo"
            infographic={<BarChart data={data.buckets} barColor="#8b5cf6" />}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
