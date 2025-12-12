// src/components/NavigationSection.jsx
import React, { useRef, useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { PathSelectionGrid } from './PathSelectionGrid.jsx';
import { PathOverviewPanel } from './PathOverviewPanel.jsx';
import { ActivePathState } from './ActivePathState.jsx';
import { FoundationCard } from './FoundationCard.jsx';
import { PathFinderCard } from './PathFinderCard.jsx';
import { CodexChamber } from './Codex/CodexChamber.jsx';
import { Avatar } from './Avatar.jsx';
import { StageTitle } from './StageTitle.jsx';

export function NavigationSection({ onStageChange, currentStage, previewPath, previewShowCore }) {
  const { selectedPathId, activePath } = useNavigationStore();
  const pathGridRef = useRef(null);
  const [showCodex, setShowCodex] = useState(false);

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
      {/* Avatar - consistent across sections */}
      <div className="flex flex-col items-center pt-8">
        <div style={{ transform: 'scale(0.65)' }}>
          <Avatar mode="navigation" onStageChange={onStageChange} stage={currentStage} path={previewPath} showCore={previewShowCore} />
        </div>
        {/* Stage Title */}
        <div className="mt-4">
          <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} showWelcome={false} />
        </div>
      </div>

      {/* The Threshold - Foundation & Path Finder (only show if no active path) */}
      {!activePath && (
        <div className="space-y-6 pt-8">
          {/* Foundation Card */}
          <FoundationCard />

          {/* Ornamental Divider */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-4 text-[var(--accent-30)]">
              <div className="w-32 h-[1px] bg-gradient-to-r from-transparent to-[var(--accent-30)]" />
              <div style={{ fontSize: '12px' }}>◆</div>
              <div className="w-32 h-[1px] bg-gradient-to-l from-transparent to-[var(--accent-30)]" />
            </div>
          </div>

          {/* Path Finder Card */}
          <PathFinderCard onPathRecommended={handlePathRecommended} />
        </div>
      )}

      {/* Tab Bar: Paths | Codex - Differentiated by temperature + geometry */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Paths Tab - Warm gold, continuous, progression */}
          <button
            onClick={() => setShowCodex(false)}
            className="relative px-4 py-2 text-sm uppercase tracking-wider transition-all duration-300"
            style={{
              fontFamily: "'Outfit', sans-serif",
              borderRadius: !showCodex ? '12px' : '8px',
              background: !showCodex ? 'rgba(250, 208, 120, 0.15)' : 'transparent',
              border: `1px solid ${!showCodex ? 'rgba(250, 208, 120, 0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: !showCodex ? '#F5D18A' : 'rgba(253, 251, 245, 0.5)',
              letterSpacing: !showCodex ? '0.1em' : '0.15em',
            }}
          >
            <span>◇ Paths</span>
            {/* Continuous underline for Paths */}
            {!showCodex && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(250, 208, 120, 0.6), transparent)',
                }}
              />
            )}
          </button>

          {/* Codex Tab - Cold gold, notched, correction */}
          <button
            onClick={() => setShowCodex(true)}
            className="relative px-4 py-2 text-sm uppercase tracking-wider transition-all duration-300"
            style={{
              fontFamily: "'Outfit', sans-serif",
              borderRadius: showCodex ? '8px' : '8px',
              background: showCodex ? 'rgba(220, 210, 180, 0.15)' : 'transparent',
              border: `1px solid ${showCodex ? 'rgba(220, 210, 180, 0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: showCodex ? 'rgba(220, 210, 180, 1)' : 'rgba(253, 251, 245, 0.5)',
              letterSpacing: showCodex ? '0.05em' : '0.15em',
            }}
          >
            <span>◈ Codex</span>
            {/* Notched underline for Codex - interruption signature */}
            {showCodex && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] flex items-center justify-center">
                <div
                  className="flex-1 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(220, 210, 180, 0.6))' }}
                />
                <div className="w-2" /> {/* Notch - the "cut" */}
                <div
                  className="flex-1 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, rgba(220, 210, 180, 0.6), transparent)' }}
                />
              </div>
            )}
          </button>
        </div>

        {/* Descriptor Text - Declarative, rule-like */}
        <p
          className="text-xs text-center transition-opacity duration-300"
          style={{
            fontFamily: "'Crimson Pro', serif",
            color: 'rgba(253, 251, 245, 0.4)',
            fontStyle: 'italic',
          }}
        >
          {showCodex ? 'Restore agency. Do not advance.' : 'Choose direction. Progress deliberately.'}
        </p>
      </div>

      {/* Content Container */}
      <div
        className="transition-all duration-[2000ms] ease-in-out"
        style={{
          opacity: showCodex ? 0.95 : 1,
          letterSpacing: showCodex ? '0.03em' : '0em',
        }}
      >
        {/* Simple conditional rendering - no complex crossfade */}
        {showCodex ? (
          <CodexChamber onClose={() => setShowCodex(false)} />
        ) : (
          <div className="space-y-6" ref={pathGridRef}>
            {/* Path Selection Grid - always visible */}
            <PathSelectionGrid />

            {/* Path panels - simple conditional */}
            {activePath ? (
              <ActivePathState />
            ) : selectedPathId ? (
              <PathOverviewPanel pathId={selectedPathId} />
            ) : (
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
        )}
      </div>
    </div>
  );
}
