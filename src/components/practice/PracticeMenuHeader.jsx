import React, { useState } from "react";
import { useTutorialStore } from "../../state/tutorialStore.js";
import { useDisplayModeStore } from "../../state/displayModeStore.js";

const TUTORIAL_HINT_KEY = "immanence.tutorialHintSeen";

function getInitialTutorialHintVisibility() {
  try {
    return localStorage.getItem(TUTORIAL_HINT_KEY) !== "true";
  } catch {
    return true;
  }
}

/**
 * Unified practice menu header component.
 * Provides 2-row layout: "TUTORIAL" button centered at top, title centered below.
 *
 * @param {string} title - The menu title (e.g., "BREATH & STILLNESS")
 * @param {string} tutorialId - The tutorial ID to open (e.g., "practice:breath")
 * @param {boolean} showTutorial - Whether to show the Tutorial button (default: true)
 * @param {React.ReactNode} children - Optional content below the header row (e.g., submode toggles)
 * @param {string} marginBottom - Optional margin-bottom for the header container
 */
export function PracticeMenuHeader({
  title,
  tutorialId,
  showTutorial = true,
  children,
  marginBottom = '24px',
}) {
  const hasTitle = Boolean(title);
  const hasHeaderRows = showTutorial || hasTitle;
  const [showTutorialHint, setShowTutorialHint] = useState(getInitialTutorialHintVisibility);
  const openTutorial = useTutorialStore((s) => s.openTutorial);
  const isOpen = useTutorialStore((s) => s.isOpen);
  const tutorialHintVisible = showTutorialHint && !isOpen;
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const isLight = colorScheme === 'light';

  const dismissTutorialHint = () => {
    try {
      localStorage.setItem(TUTORIAL_HINT_KEY, "true");
    } catch {
      // Local storage persistence is best-effort only.
    }
    setShowTutorialHint(false);
  };

  const handleTutorialClick = () => {
    dismissTutorialHint();
    if (tutorialId) {
      openTutorial(tutorialId);
    }
  };

  return (
    <div className="practiceMenuHeader" style={{ marginTop: hasHeaderRows ? '16px' : '0px', marginBottom }}>
      {/* Top row: tutorial button centered */}
      {showTutorial && (
        <div className="practiceMenuHeaderTopRow">
          <div />
          <div className="tutorialButtonWrap">
            <button
              type="button"
              className="practiceMenuHeaderTutorial type-label"
              data-tutorial="tutorial-button"
              onClick={handleTutorialClick}
              style={{
                padding: '8px 12px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '8px',
                border: isLight ? '1px solid rgba(60,50,35,0.25)' : '1px solid rgba(255,255,255,0.2)',
                background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.05)',
                color: isLight ? 'rgba(35,20,10,0.8)' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (isLight) {
                  e.target.style.background = 'rgba(60,50,35,0.15)';
                  e.target.style.color = 'rgba(35,20,10,0.95)';
                } else {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.color = 'rgba(255,255,255,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (isLight) {
                  e.target.style.background = 'rgba(60,50,35,0.08)';
                  e.target.style.color = 'rgba(35,20,10,0.8)';
                } else {
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                  e.target.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
            >
              TUTORIAL
            </button>

            {tutorialHintVisible && (
              <div className="tutorialHint" role="note" aria-label="Tutorial hint">
                <div className="tutorialHintText">
                  Need a guide? Click <b>Tutorial</b>.
                </div>
                <button
                  type="button"
                  className="tutorialHintClose"
                  aria-label="Dismiss tutorial hint"
                  onClick={dismissTutorialHint}
                >
                  ×
                </button>
                <div className="tutorialHintArrow" />
              </div>
            )}
          </div>
          <div />
        </div>
      )}

      {/* Title row: centered title on its own line (only render if title provided) */}
      {hasTitle && (
        <div className="practiceMenuHeaderTitleRow">
          <div
            className="practiceMenuHeaderTitle type-h2"
            title={title}
            style={{
              color: isLight ? 'rgba(35,20,10,0.95)' : '#F5E6D3',
            }}
          >
            {title}
          </div>
        </div>
      )}

      {/* Optional children (e.g., submode toggles) */}
      {children}
    </div>
  );
}

export default PracticeMenuHeader;
