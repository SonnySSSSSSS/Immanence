// src/components/NavigationSection.jsx
import React, { useRef, useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { PathSelectionGrid } from './PathSelectionGrid.jsx';
import { PathOverviewPanel } from './PathOverviewPanel.jsx';
import { ActivePathState } from './ActivePathState.jsx';
import { PathFinderCard } from './PathFinderCard.jsx';
import { CodexChamber } from './Codex/CodexChamber.jsx';
import { StageTitle } from './StageTitle.jsx';
import { NavigationSelectionModal } from './NavigationSelectionModal.jsx';
import { ConsistencyFoundation } from './Cycle/ConsistencyFoundation.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { getPathById } from '../data/navigationData.js';

export function NavigationSection({ onStageChange, currentStage, previewPath, previewShowCore, previewAttention, onNavigate, onOpenHardwareGuide }) {
  const { selectedPathId, activePath } = useNavigationStore();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const displayMode = useDisplayModeStore(s => s.mode);
  const isLight = colorScheme === 'light';
  const isSanctuary = displayMode === 'sanctuary';
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
    <div
      className="w-full max-w-6xl mx-auto"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isSanctuary ? '32px' : '20px',
        paddingBottom: isSanctuary ? '48px' : '32px',
      }}
    >
      {/* Cycle & Consistency System */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: isSanctuary ? '16px' : '8px',
        }}
      >
        <ConsistencyFoundation />
      </div>

      {/* The Threshold - Foundation & Path Finder (only show if no active path) */}
      {!activePath && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isSanctuary ? '24px' : '18px',
            paddingTop: isSanctuary ? '24px' : '12px',
          }}
        >
          {/* Ornamental Divider */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-4" style={{ color: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-30)' }}>
              <div className={`w-32 h-[1px] bg-gradient-to-r from-transparent ${isLight ? 'to-[rgba(180,140,90,0.4)]' : 'to-[var(--accent-30)]'}`} />
              <div style={{ fontSize: '12px' }}>◆</div>
              <div className={`w-32 h-[1px] bg-gradient-to-l from-transparent ${isLight ? 'to-[rgba(180,140,90,0.4)]' : 'to-[var(--accent-30)]'}`} />
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
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: 'var(--tracking-wide)',
            color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253,251,245,0.4)',
            textTransform: 'uppercase',
            fontStyle: 'italic'
          }}
        >
          Choose direction. Progress deliberately.
        </div>
        <button
          onClick={() => setNavModalOpen(true)}
          className="px-6 py-3 rounded-full"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: 'var(--tracking-wide)',
            color: isLight ? (showCodex ? 'rgba(140, 100, 40, 1)' : 'rgba(180, 120, 40, 1)') : (showCodex ? 'rgba(220, 210, 180, 1)' : '#F5D18A'),
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: isLight
              ? 'rgba(255, 255, 255, 0.4)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
            border: isLight
              ? (showCodex ? '1px solid rgba(140, 100, 40, 0.4)' : '1px solid rgba(180, 140, 90, 0.4)')
              : (showCodex ? '1px solid rgba(220, 210, 180, 0.4)' : '1px solid rgba(250, 208, 120, 0.4)'),
            boxShadow: isLight
              ? '0 4px 12px rgba(180, 140, 90, 0.1)'
              : (showCodex
                ? '0 0 25px rgba(220, 210, 180, 0.15), inset 0 0 20px rgba(220, 210, 180, 0.08)'
                : '0 0 25px rgba(250, 208, 120, 0.15), inset 0 0 20px rgba(250, 208, 120, 0.08)'),
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
              <PathOverviewPanel
                path={getPathById(selectedPathId)}
                onClose={() => useNavigationStore.getState().setSelectedPath(null)}
              />
            ) : (
              <div className="text-center py-12">
                <p
                  className="text-sm italic font-medium"
                  style={{
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.01em',
                    color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253,251,245,0.5)'
                  }}
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
