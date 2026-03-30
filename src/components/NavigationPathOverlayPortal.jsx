import { createPortal } from 'react-dom';
import { PathOverviewPanel } from './PathOverviewPanel.jsx';
import { ActivePathState } from './ActivePathState.jsx';

const normalizeInitiationPathIdentity = (pathId) => (pathId === 'initiation-2' ? 'initiation' : pathId);

function NavigationPathOverlayPortal({
  overlayPathId,
  overlayPath,
  activePathId,
  isLight,
  onNavigate,
  onClose,
  onBeginPath,
}) {
  if (!overlayPathId) return null;

  return createPortal((
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
          onClose();
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
        {normalizeInitiationPathIdentity(activePathId) === normalizeInitiationPathIdentity(overlayPathId) ? (
          <div className="p-4">
            <ActivePathState onNavigate={onNavigate} />
            <button
              onClick={onClose}
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
              const result = onBeginPath(pathId);
              if (result?.ok !== false) {
                onClose();
              }
              return result;
            }}
            onClose={onClose}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  ), document.body);
}

export { NavigationPathOverlayPortal };
