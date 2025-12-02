// src/components/NavigationSection.jsx
import React, { useRef } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { PathSelectionGrid } from './PathSelectionGrid.jsx';
import { PathOverviewPanel } from './PathOverviewPanel.jsx';
import { ActivePathState } from './ActivePathState.jsx';
import { FoundationCard } from './FoundationCard.jsx';
import { PathFinderCard } from './PathFinderCard.jsx';

export function NavigationSection() {
  const { selectedPathId, activePath } = useNavigationStore();
  const pathGridRef = useRef(null);

  const handlePathRecommended = (pathId) => {
    if (pathId && pathGridRef.current) {
      // Scroll to path grid with smooth behavior
      pathGridRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      {/* The Threshold - Foundation & Path Finder (only show if no active path) */}
      {!activePath && (
        <div className="space-y-6 pt-8">
          {/* Foundation Card */}
          <FoundationCard />

          {/* Ornamental Divider */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-4 text-[rgba(253,224,71,0.3)]">
              <div className="w-32 h-[1px] bg-gradient-to-r from-transparent to-[rgba(253,224,71,0.3)]" />
              <div style={{ fontSize: '12px' }}>◆</div>
              <div className="w-32 h-[1px] bg-gradient-to-l from-transparent to-[rgba(253,224,71,0.3)]" />
            </div>
          </div>

          {/* Path Finder Card */}
          <PathFinderCard onPathRecommended={handlePathRecommended} />
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6" ref={pathGridRef}>
        {/* Path Selection Grid - always visible */}
        <PathSelectionGrid />

        {/* Path Overview or Active Path State */}
        {activePath ? (
          // Show active path state if a path is in progress
          <ActivePathState />
        ) : selectedPathId ? (
          // Show overview panel if a path is selected but not started
          <PathOverviewPanel pathId={selectedPathId} />
        ) : (
          // No selection yet - show helper text
          <div className="text-center py-12">
            <p
              className="text-sm text-[rgba(253,251,245,0.5)] italic"
              style={{ fontFamily: 'Crimson Pro, serif' }}
            >
              Select a path to view details and begin your journey
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
