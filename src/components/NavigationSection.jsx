// src/components/NavigationSection.jsx
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationStore } from '../state/navigationStore.js';
import { PathSelectionGrid } from './PathSelectionGrid.jsx';
import { PathOverviewPanel } from './PathOverviewPanel.jsx';
import { ActivePathState, PathLifecycleActions } from './ActivePathState.jsx';
import { NavigationPathReport } from './navigation/NavigationPathReport.jsx';
import { PathFinderCard } from './PathFinderCard.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { getPathById } from '../data/navigationData.js';
import { AvatarV3 } from './avatarV3/AvatarV3.jsx';
import { useAvatarV3State } from '../state/avatarV3Store.js';
import { usePathStore } from '../state/pathStore.js';
import { CurriculumOnboarding } from './CurriculumOnboarding.jsx';

const normalizeInitiationPathIdentity = (pathId) => (pathId === 'initiation-2' ? 'initiation' : pathId);

export function NavigationSection({ currentStage, previewPath, onNavigate, isPracticing = false }) {
  const { activePath, beginPath } = useNavigationStore();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const { stage: avatarStage, modeWeights, lastStageChange, lastModeChange, lastSessionComplete } = useAvatarV3State();
  // Prefer the stage coming from the main app/dev controls (`currentStage`), then fall back to avatar store stage.
  const effectiveStage = currentStage || avatarStage;
  const normalizedStage = String(effectiveStage || 'seedling').toLowerCase();
  const getDisplayPath = usePathStore(s => s.getDisplayPath);
  const storedPath = getDisplayPath ? getDisplayPath(effectiveStage) : null;
  const avatarPath = previewPath ?? storedPath;
  const pathGridRef = useRef(null);

  // Local state for path overlay - only opens via explicit user click, never from persisted state
  const [overlayPathId, setOverlayPathId] = useState(null);
  const overlayPath = overlayPathId ? getPathById(overlayPathId) : null;

  // Local state for initiation onboarding — rendered directly here when HomeHub is not mounted
  const [showInitiationOnboarding, setShowInitiationOnboarding] = useState(false);

  // Handler for when user clicks a path card in the grid
  const handlePathSelected = (pathId) => {
    const normalizedId = normalizeInitiationPathIdentity(pathId);
    const normalizedActiveId = normalizeInitiationPathIdentity(activePath?.activePathId ?? null);
    // Initiation path when not currently active: open canonical onboarding directly in this section.
    // Active initiation path falls through to show progress overlay as normal.
    if (normalizedId === 'initiation' && normalizedActiveId !== 'initiation') {
      setShowInitiationOnboarding(true);
      return;
    }
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
        gap: '20px',
        paddingBottom: '32px',
      }}
    >
      <div className="flex items-center justify-center" style={{ paddingTop: '4px' }}>
        <AvatarV3
          stage={normalizedStage}
          modeWeights={modeWeights}
          isPracticing={isPracticing}
          lastStageChange={lastStageChange}
          lastModeChange={lastModeChange}
          lastSessionComplete={lastSessionComplete}
          path={avatarPath}
        />
      </div>
      {/* The Threshold - Foundation & Path Finder (only show if no active path) */}
      {!activePath && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            paddingTop: '12px',
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

      {/* Active path actions (only when an active path exists) */}
      {activePath && (
        <div
          className="flex flex-col items-center px-4 py-3 rounded-2xl"
          style={{
            gap: '6px',
            background: isLight
              ? 'rgba(60, 52, 37, 0.25)'
              : 'rgba(0, 0, 0, 0.45)',
            border: isLight
              ? '1px solid rgba(180, 140, 90, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <div
            className="type-caption uppercase"
            style={{
              fontSize: '9px',
              letterSpacing: '0.1em',
              fontWeight: 700,
              color: isLight ? 'rgba(90, 77, 60, 0.9)' : '#ffffff',
              textShadow: !isLight ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
            }}
          >
            Active path actions
          </div>
          <PathLifecycleActions compact />
        </div>
      )}

      {/* Paths Content */}
      <div className="space-y-6" ref={pathGridRef}>
        {/* Path Selection Grid - always visible */}
        <PathSelectionGrid onPathSelected={handlePathSelected} selectedPathId={overlayPathId} />

        {/* Active Path Display - shows current path progress inline */}
        {activePath && (
            <div className="mt-8 im-card" data-card-id="navigation:activePathPanel">
            {/* Active Path Header */}
            <div
              className="type-label mb-3"
              style={{ color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253,251,245,0.5)' }}
            >
              Active Path
            </div>
            <ActivePathState onNavigate={onNavigate} />
            <NavigationPathReport />
            <div
              className="mt-4 pt-4 border-t"
              style={{ borderColor: 'rgba(253,251,245,0.06)' }}
            />
          </div>
        )}
      </div>

      {/* Path Overlay Modal - fixed rail layout */}
      {/* Uses LOCAL state (overlayPathId) so it NEVER auto-opens from persisted store */}
      {/* Shows ActivePathState if clicking on already-active path, else PathOverviewPanel */}
      {overlayPathId && createPortal((
        <div
          data-testid="path-overview-overlay"
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
            data-card="true"
            data-card-id="pathOverview"
            className="im-card"
              style={{
                width: '100%',
                maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
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
            {normalizeInitiationPathIdentity(activePath?.activePathId) === normalizeInitiationPathIdentity(overlayPathId) ? (
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
                  const result = beginPath(pathId);
                  if (result?.ok !== false) {
                    closeOverlay();
                  }
                  return result;
                }}
                onClose={closeOverlay}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>
      ), document.body)}

      {/* Initiation onboarding — opened locally when HomeHub is not mounted */}
      {showInitiationOnboarding && createPortal(
        <CurriculumOnboarding
          onDismiss={() => setShowInitiationOnboarding(false)}
          onComplete={() => {
            useNavigationStore.getState().beginPathForCurriculum('ritual-initiation-14-v2');
            setShowInitiationOnboarding(false);
          }}
        />,
        document.body
      )}
    </div>
  );
}
