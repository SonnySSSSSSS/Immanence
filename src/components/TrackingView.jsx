// src/components/TrackingView.jsx
// Extracted tracking interface from ApplicationSection

import React from 'react';
import { ActiveTrackingItems } from './ActiveTrackingItems.jsx';
import { QuickLogGesturePad } from './QuickLogGesturePad.jsx';
import { TodayAwarenessLog } from './TodayAwarenessLog.jsx';
import { WeeklyReview } from './WeeklyReview.jsx';
import { PathJourneyLog } from './PathJourneyLog.jsx';

export function TrackingView() {
    return (
        <div className="space-y-6">
            {/* Active Tracking Items */}
            <ActiveTrackingItems />

            {/* Quick Log Interface */}
            <QuickLogGesturePad />

            {/* Today's Log */}
            <TodayAwarenessLog />

            {/* Weekly Review */}
            <WeeklyReview />

            {/* Path Journey */}
            <PathJourneyLog />
        </div>
    );
}
