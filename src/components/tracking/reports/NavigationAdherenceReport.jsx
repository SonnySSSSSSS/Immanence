import React, { useMemo } from 'react';
import { HorizontalBarStack } from '../infographics/index.js';
import { DOMAIN_COLORS } from '../infographics/tokens.js';
import { ReportSection } from './ReportSection.jsx';

export function NavigationAdherenceReport({ data, deltaLine, milestones }) {
    const interpretation = data.totalEntries === 0
        ? 'No schedule adherence records in this range.'
        : `Overall adherence rate was ${data.adherenceRate}%, with an average absolute offset of ${data.avgAbsDelta} minutes.`;

    const suggestion = data.totalEntries === 0
        ? 'Log a practice start near a scheduled slot to begin tracking adherence.'
        : 'Pick one slot to tighten within the 15-minute window this week.';

    // Convert bars to HBar segments with color
    const bars = useMemo(() => {
        return (data.slotBars || []).map(bar => ({
            label: bar.label,
            value: bar.value,
            color: DOMAIN_COLORS.navigation
        }));
    }, [data.slotBars]);

    return (
        <ReportSection
            title="Navigation Schedule Adherence"
            infographic={
                <HorizontalBarStack
                    bars={bars}
                    maxValue={100}
                    showLabels={true}
                />
            }
            interpretation={interpretation}
            suggestion={suggestion}
            deltaLine={deltaLine}
            milestones={milestones}
        />
    );
}
