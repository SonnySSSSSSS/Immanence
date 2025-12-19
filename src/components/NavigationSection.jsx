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
import { NavigationSelectionModal } from './NavigationSelectionModal.jsx';
import { ConsistencyFoundation } from './Cycle/ConsistencyFoundation.jsx';
import { CircuitTrainer } from './Cycle/CircuitTrainer.jsx';

export function NavigationSection({ onStageChange, currentStage, previewPath, previewShowCore, previewAttention, onNavigate }) {
  const { selectedPathId, activePath } = useNavigationStore();
  const pathGridRef = useRef(null);
  const [showCodex, setShowCodex] = useState(false);
  const [navModalOpen, setNavModalOpen] = useState(false);

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
          <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} attention={previewAttention} showWelcome={false} />
        </div>
      </div>

      {/* Cycle & Consistency System */}
      <div className="space-y-4 pt-4">
        <ConsistencyFoundation />
        <CircuitTrainer />
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

      {/* Navigation Selector - Dropdown Style (matching practice menu) */}
      <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* Text prompt above button */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: 'rgba(253,251,245,0.5)',
            textTransform: 'uppercase',
          }}
        >
          Choose direction. Progress deliberately.
        </div>
        <button
          onClick={() => setNavModalOpen(true)}
          className="px-6 py-3 rounded-full"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            letterSpacing: '0.1em',
            color: showCodex ? 'rgba(220, 210, 180, 1)' : '#F5D18A',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
            border: showCodex ? '1px solid rgba(220, 210, 180, 0.4)' : '1px solid rgba(250, 208, 120, 0.4)',
            boxShadow: showCodex
              ? '0 0 25px rgba(220, 210, 180, 0.15), inset 0 0 20px rgba(220, 210, 180, 0.08)'
              : '0 0 25px rgba(250, 208, 120, 0.15), inset 0 0 20px rgba(250, 208, 120, 0.08)',
            transform: navModalOpen ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 300ms ease-out, background 300ms ease-out, box-shadow 300ms ease-out',
          }}
        >
          <span>{showCodex ? '◈ Compass' : '◇ Paths'}</span>
          {/* Chevron */}
          <span
            style={{
              fontSize: '10px',
              transform: navModalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease-out',
            }}
          >
            ▼
          </span>
        </button>
      </div>

      {/* Content Container */}
      <div>
        {/* Simple conditional rendering - no complex crossfade */}
        {showCodex ? (
          <CodexChamber onClose={() => setShowCodex(false)} onNavigate={onNavigate} />
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

      {/* Navigation Selection Modal */}
      <NavigationSelectionModal
        isOpen={navModalOpen}
        onClose={() => setNavModalOpen(false)}
        currentView={showCodex ? 'compass' : 'paths'}
        onSelectView={(view) => setShowCodex(view === 'compass')}
      />
    </div>
  );
}
