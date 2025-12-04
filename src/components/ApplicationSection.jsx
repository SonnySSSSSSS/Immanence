// src/components/ApplicationSection.jsx
import React from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { Avatar } from './Avatar.jsx';
import { ActiveTrackingItems } from './ActiveTrackingItems.jsx';
import { QuickLogGesturePad } from './QuickLogGesturePad.jsx';
import { TodayAwarenessLog } from './TodayAwarenessLog.jsx';
import { WeeklyReview } from './WeeklyReview.jsx';

export function ApplicationSection() {
  const { activePath } = useNavigationStore();

  // No active path - show empty state
  if (!activePath) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
        {/* Avatar */}
        <div className="flex justify-center pt-8">
          <div style={{ transform: 'scale(0.75)' }}>
            <Avatar mode="application" />
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-[#0f0f1a] border rounded-3xl p-12 text-center card-accent" style={{ borderColor: 'rgba(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)' }}>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
          >
            Application
          </h2>
          <p
            className="text-base text-[rgba(253,251,245,0.7)] mb-2 leading-relaxed"
            style={{ fontFamily: 'Crimson Pro, serif' }}
          >
            This is where practice meets life.
          </p>
          <p
            className="text-sm text-[rgba(253,251,245,0.6)] mb-6 leading-relaxed italic"
            style={{ fontFamily: 'Crimson Pro, serif' }}
          >
            You'll track moments of awareness—when you catch yourself in old patterns.
          </p>
          <button
            onClick={() => {
              // Navigate to Navigation section
              // This would need to be wired through App.jsx
              window.location.hash = 'navigation';
            }}
            className="px-6 py-3 rounded-full text-[#050508] font-semibold text-sm"
            style={{ fontFamily: 'Cinzel, serif', background: 'var(--ui-button-gradient)' }}
          >
            GO TO NAVIGATION
          </button>
        </div>
      </div>
    );
  }

  // Active path - show tracking interface
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Avatar - smaller */}
      <div className="flex justify-center pt-8">
        <div style={{ transform: 'scale(0.65)' }}>
          <Avatar mode="application" />
        </div>
      </div>

      {/* Active Tracking Items */}
      <ActiveTrackingItems />

      {/* Quick Log Interface */}
      <QuickLogGesturePad />

      {/* Today's Log */}
      <TodayAwarenessLog />

      {/* Weekly Review */}
      <WeeklyReview />
    </div>
  );
}
