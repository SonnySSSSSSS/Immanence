// src/components/NavigationSection.jsx
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationStore } from '../state/navigationStore.js';
import { PathSelectionGrid } from './PathSelectionGrid.jsx';
import { PathOverviewPanel } from './PathOverviewPanel.jsx';
import { ActivePathState } from './ActivePathState.jsx';
import { NavigationPathReport } from './navigation/NavigationPathReport.jsx';
import { PathFinderCard } from './PathFinderCard.jsx';
import { CodexChamber } from './Codex/CodexChamber.jsx';
import { StageTitle } from './StageTitle.jsx';
import { NavigationSelectionModal } from './NavigationSelectionModal.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { getPathById } from '../data/navigationData.js';
import { AvatarV3 } from './avatarV3/AvatarV3.jsx';
import { useAvatarV3State } from '../state/avatarV3Store.js';
import { usePathStore } from '../state/pathStore.js';

export function NavigationSection({ currentStage, previewPath, onNavigate, isPracticing = false }) {
  const { activePath, beginPath } = useNavigationStore();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const displayMode = useDisplayModeStore(s => s.mode);
  const isLight = colorScheme === 'light';
  const isSanctuary = displayMode === 'sanctuary';
  const isHearth = displayMode === 'hearth';
  const { stage: avatarStage, modeWeights, lastStageChange, lastModeChange, lastSessionComplete } = useAvatarV3State();
  const effectiveStage = avatarStage || currentStage;
  const normalizedStage = String(effectiveStage || 'seedling').toLowerCase();
  const getDisplayPath = usePathStore(s => s.getDisplayPath);
  const storedPath = getDisplayPath ? getDisplayPath(effectiveStage) : null;
  const avatarPath = previewPath ?? storedPath;
  const pathGridRef = useRef(null);
  const [showCodex, setShowCodex] = useState(false);
  const [navModalOpen, setNavModalOpen] = useState(false);

  // Local state for path overlay - only opens via explicit user click, never from persisted state
  const [overlayPathId, setOverlayPathId] = useState(null);
  const overlayPath = overlayPathId ? getPathById(overlayPathId) : null;

  // Handler for when user clicks a path card in the grid
  const handlePathSelected = (pathId) => {
    setOverlayPathId(pathId);
  };

  const closeOverlay = () => {
    setOverlayPathId(null);
  };

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
      data-tutorial="navigation-root"
      className="w-full max-w-6xl mx-auto"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isSanctuary ? '32px' : '20px',
        paddingBottom: isSanctuary ? '48px' : '32px',
      }}
    >
      <div className="flex items-center justify-center" style={{ paddingTop: isSanctuary ? '12px' : '4px' }}>
        <AvatarV3
          stage={normalizedStage}
          modeWeights={modeWeights}
          isPracticing={isPracticing}
          lastStageChange={lastStageChange}
          lastModeChange={lastModeChange}
          lastSessionComplete={lastSessionComplete}
          path={avatarPath}
          size={isSanctuary ? 'sanctuary' : 'hearth'}
        />
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
          <PathFinderCard onPathRecommended={handlePathRecommended} selectedPathId={overlayPathId} />
        </div>
      )}

      {/* Navigation Selector - Dropdown Style (matching practice menu) */}
      <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* Text prompt above button */}
        <div
          className="type-label italic"
          style={{
            color: isLight ? 'rgba(60, 52, 37, 0.7)' : 'rgba(253,251,245,0.8)',
            textShadow: isLight ? 'none' : '0 2px 8px rgba(0,0,0,0.5)'
          }}
        >
          Choose direction. Progress deliberately.
        </div>
        <button
          onClick={() => setNavModalOpen(true)}
          className="type-label px-6 py-3 rounded-full"
          style={{
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
            <PathSelectionGrid onPathSelected={handlePathSelected} selectedPathId={overlayPathId} />

            {/* Active Path Display - shows current path progress inline */}
            {activePath && (
                <div className="mt-8">
                {/* Active Path Header */}
                <div
                  className="type-label mb-3"
                  style={{ color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253,251,245,0.5)' }}
                >
                  Active Path
                </div>
                <ActivePathState onNavigate={onNavigate} />
                <NavigationPathReport />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Path Overlay Modal - adapts to hearth/sanctuary */}
      {/* Uses LOCAL state (overlayPathId) so it NEVER auto-opens from persisted store */}
      {/* Shows ActivePathState if clicking on already-active path, else PathOverviewPanel */}
      {overlayPathId && createPortal((
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            WebkitOverflowScrolling: 'touch',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeOverlay();
            }
          }}
        >
          {/* Hearth: max 430px; Sanctuary: max 760px - both centered */}
          <div
            style={{
              width: '100%',
              maxWidth: isHearth ? '430px' : '760px',
              borderRadius: '28px',
              margin: '16px auto',
              background: isLight
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(26, 15, 28, 0.99) 0%, rgba(21, 11, 22, 1) 100%)',
              boxShadow: isLight
                ? '0 8px 40px rgba(0, 0, 0, 0.15)'
                : '0 8px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(250, 208, 120, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* If this is the user's active path, show progress; else show overview to begin */}
            {activePath?.activePathId === overlayPathId ? (
              <div className="p-4">
                <ActivePathState onNavigate={onNavigate} />
                <button
                  onClick={closeOverlay}
                  className="mt-4 w-full py-3 rounded-full border transition-colors text-center"
                  style={{
                    borderColor: isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-30)',
                    color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.7)',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <PathOverviewPanel
                path={overlayPath}
                onBegin={(pathId) => {
                  beginPath(pathId);
                  closeOverlay();
                }}
                onClose={closeOverlay}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>
      ), document.body)}

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
