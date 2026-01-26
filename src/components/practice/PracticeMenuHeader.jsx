import React, { useState, useEffect } from "react";
import { useTutorialStore } from "../../state/tutorialStore.js";

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
  // Tutorial hint state
  const TUTORIAL_HINT_KEY = "immanence.tutorialHintSeen";
  const [showTutorialHint, setShowTutorialHint] = useState(false);
  const openTutorial = useTutorialStore((s) => s.openTutorial);
  const isOpen = useTutorialStore((s) => s.isOpen);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(TUTORIAL_HINT_KEY) === "true";
      if (!seen) setShowTutorialHint(true);
    } catch {
      setShowTutorialHint(true);
    }
  }, []);

  // Hide hint if tutorial is open
  useEffect(() => {
    if (isOpen) {
      setShowTutorialHint(false);
    }
  }, [isOpen]);

  const dismissTutorialHint = () => {
    try {
      localStorage.setItem(TUTORIAL_HINT_KEY, "true");
    } catch {}
    setShowTutorialHint(false);
  };

  const handleTutorialClick = () => {
    dismissTutorialHint();
    if (tutorialId) {
      openTutorial(tutorialId);
    }
  };

  return (
    <div className="practiceMenuHeader" style={{ marginTop: '20px', marginBottom }}>
      {/* Top row: tutorial button centered */}
      <div className="practiceMenuHeaderTopRow">
        <div />
        {showTutorial && (
          <div className="tutorialButtonWrap">
            <button
              type="button"
              className="practiceMenuHeaderTutorial"
              data-tutorial="tutorial-button"
              onClick={handleTutorialClick}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.05)';
                e.target.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              TUTORIAL
            </button>

            {showTutorialHint && (
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
        )}
        <div />
      </div>

      {/* Title row: centered title on its own line (only render if title provided) */}
      {title && (
        <div className="practiceMenuHeaderTitleRow">
          <div
            className="practiceMenuHeaderTitle"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#F5E6D3',
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
