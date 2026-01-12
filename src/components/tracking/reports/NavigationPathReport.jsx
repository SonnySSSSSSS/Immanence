import React from 'react';
import { ReportSection } from './ReportSection.jsx';

export function NavigationPathReport({ data, deltaLine, milestones }) {
    const interpretation = data.activePathId
        ? `Active path ${data.activePathId} is on week ${data.currentWeek}, with ${data.completedWeeks} weeks completed.`
        : 'No active path selected during this range.';

    const suggestion = data.activePathId
        ? 'Complete the next week to maintain progress and unlock new sections.'
        : 'Select a path to anchor navigation tracking.';

    const infographic = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Path Progress</div>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div
                    style={{
                        height: '100%',
                        width: `${data.progressPercent}%`,
                        background: '#6366f1'
                    }}
                />
            </div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>
                {data.completedWeeks} completed • {data.unlockedSections} unlocked sections
            </div>
        </div>
    );

    return (
        <ReportSection
            title="Navigation Path Progress"
            infographic={infographic}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
