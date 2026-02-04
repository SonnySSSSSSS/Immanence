import React, { useMemo } from 'react';
import { DonutChart } from '../infographics/index.js';
import { DOMAIN_COLORS } from '../infographics/tokens.js';
import { ReportSection } from './ReportSection.jsx';

export function PortfolioSummaryReport({ data, deltaLine, milestones }) {
    const interpretation = data.totalActivities === 0
        ? 'No tracked activity across domains in this range.'
        : `Activity is distributed across ${data.activeDomains} domains with ${data.totalActivities} total events.`;

    const suggestion = data.totalActivities === 0
        ? 'Start with a single practice or reading session to seed the portfolio.'
        : 'Balance the lowest segment with one focused session this week.';

    // Convert bars to donut segments with colors
    const segments = useMemo(() => {
        const colorMap = {
            'Practice': DOMAIN_COLORS.practice,
            'Wisdom': DOMAIN_COLORS.wisdom,
            'Application': DOMAIN_COLORS.application,
            'Video': DOMAIN_COLORS.wisdom
        };

        return data.bars.map(bar => ({
            label: bar.label,
            value: bar.value,
            color: colorMap[bar.label] || '#8b5cf6'
        }));
    }, [data.bars]);

    return (
        <ReportSection
            title="Portfolio Activity Mix"
            infographic={
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <DonutChart segments={segments} size={160} showLegend={true} />
                </div>
            }
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
