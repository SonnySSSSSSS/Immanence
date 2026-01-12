import React from 'react';
import { ReportSection } from './ReportSection.jsx';

export function WisdomVideoReport({ data, deltaLine, milestones }) {
    const completionRate = data.videosStarted > 0
        ? Math.round((data.videosCompleted / data.videosStarted) * 100)
        : 0;
    const interpretation = data.videosStarted === 0
        ? 'No video activity recorded in this range.'
        : `${data.videosCompleted} of ${data.videosStarted} videos completed (${completionRate}%).`;

    const suggestion = data.videosStarted === 0
        ? 'Start one video to begin tracking completion rate.'
        : 'Finish one in-progress video to push completion above baseline.';

    const infographic = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
                <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${completionRate}%`,
                            background: '#8b5cf6'
                        }}
                    />
                </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{completionRate}%</div>
        </div>
    );

    return (
        <ReportSection
            title="Wisdom Video Completion"
            infographic={infographic}
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
