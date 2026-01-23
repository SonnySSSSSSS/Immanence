// src/components/tutorial/TutorialOverlay.jsx
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTutorialStore } from '../../state/tutorialStore';
import { TUTORIALS } from '../../tutorials/tutorialRegistry';

const OVERRIDE_STORAGE_KEY = 'immanence.tutorial.overrides';
const TUTORIAL_INSPECT_KEY = "immanence.tutorial.inspect";

// Load tutorial with override support
function loadTutorial(tutorialId) {
  // Try override first
  try {
    const raw = localStorage.getItem(OVERRIDE_STORAGE_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      if (overrides[tutorialId]) {
        return { tutorial: overrides[tutorialId], isOverride: true };
      }
    }
  } catch (err) {
    console.warn('[TutorialOverlay] Failed to load override:', err);
  }
  
  // Fall back to registry
  return { tutorial: TUTORIALS[tutorialId] || null, isOverride: false };
}

// Retry helper: keep checking for target element until it appears or retries exhausted
function resolveTargetRectWithRetry(selector, {
  retries = 12,   // ~200ms if interval=16ms
  interval = 16,
} = {}) {
  return new Promise((resolve) => {
    let attempts = 0;

    const tick = () => {
      const el = selector ? document.querySelector(selector) : null;
      if (el) return resolve(el.getBoundingClientRect());

      attempts += 1;
      if (attempts >= retries) return resolve(null);

      setTimeout(tick, interval);
    };

    tick();
  });
}

export const TutorialOverlay = () => {
  const { isOpen, tutorialId, stepIndex, closeTutorial, nextStep, prevStep, markCompleted } = useTutorialStore();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState(null);
  const [pickModeActive, setPickModeActive] = useState(false);
  const [overrideReloadTrigger, setOverrideReloadTrigger] = useState(0);
  const tooltipRef = useRef(null);

  // Inspect mode: allows devtools to click/select highlight/tooltip instead of scrim
  let inspectMode = false;
  try {
    inspectMode = localStorage.getItem(TUTORIAL_INSPECT_KEY) === "true";
  } catch {
    inspectMode = false;
  }

  // Load tutorial with override support (useMemo to avoid cascading renders)
  const tutorialData = React.useMemo(() => {
    if (!tutorialId) return { tutorial: null, isOverride: false };
    // Trigger recompute when overrideReloadTrigger changes
    void overrideReloadTrigger;
    return loadTutorial(tutorialId);
  }, [tutorialId, overrideReloadTrigger]);

  // Reload when overrides change
  useEffect(() => {
    const handleOverrideChange = () => {
      setOverrideReloadTrigger(prev => prev + 1);
    };
    
    window.addEventListener('tutorial-override-changed', handleOverrideChange);
    return () => window.removeEventListener('tutorial-override-changed', handleOverrideChange);
  }, []);

  // Monitor global pick mode flag and re-render when it changes
  useEffect(() => {
    const checkPickMode = () => {
      setPickModeActive(!!window.__TUTORIAL_PICK_ON__);
    };

    // Check immediately
    checkPickMode();

    // Poll every 100ms to detect changes
    const interval = setInterval(checkPickMode, 100);

    return () => clearInterval(interval);
  }, []);

  const tutorial = tutorialData.tutorial;
  const currentStep = tutorial?.steps?.[stepIndex];
  const isLastStep = tutorial && stepIndex === tutorial.steps.length - 1;

  // Removed: component-owned highlight special case
  // All highlights now wrap the tooltip, not the target element

  // Compute bounds for positioning (phone frame if present, else viewport)
  function getTutorialBounds() {
    const frame = document.querySelector('[data-app-frame="true"]');
    if (frame instanceof HTMLElement) {
      const r = frame.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    }
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  const updatePosition = useCallback(async () => {
    if (!isOpen) return;

    const bounds = getTutorialBounds();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width || 360;
    const tooltipHeight = tooltipRect?.height || 200;
    const PAD = 12;
    const gap = 16;

    const clampTooltip = (top, left) => ({
      top: Math.min(Math.max(top, bounds.top + PAD), bounds.bottom - tooltipHeight - PAD),
      left: Math.min(Math.max(left, bounds.left + PAD), bounds.right - tooltipWidth - PAD),
    });

    // Calculate tooltip position first (regardless of target existence)
    let tooltipTop = bounds.top + (bounds.height - tooltipHeight) / 2;
    let tooltipLeft = bounds.left + (bounds.width - tooltipWidth) / 2;

    // Try to resolve target with retry logic (don't abort if not found)
    if (currentStep?.target) {
      const targetRect = await resolveTargetRectWithRetry(currentStep.target);
      
      if (targetRect) {
        const preferredPlacement = currentStep.placement || 'top';

        switch (preferredPlacement) {
          case 'top':
            tooltipTop = targetRect.top - tooltipHeight - gap;
            tooltipLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            tooltipTop = targetRect.bottom + gap;
            tooltipLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            tooltipTop = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
            tooltipLeft = targetRect.left - tooltipWidth - gap;
            break;
          case 'right':
            tooltipTop = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
            tooltipLeft = targetRect.right + gap;
            break;
          default:
            // center within bounds (already set above)
            break;
        }
      }
      // IMPORTANT: If target not found after retry, we still continue (don't abort)
      // Tooltip will be centered and tutorial progression allowed
    }

    const finalPosition = clampTooltip(tooltipTop, tooltipLeft);
    setTooltipPosition(finalPosition);

    // Defer highlight measurement until AFTER React commits the tooltip position
    // Double RAF ensures we measure after React's paint cycle completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const tooltipEl = document.querySelector('.tutorial-tooltip');
        if (!tooltipEl) {
          // Tooltip not mounted yet; hide highlight but DON'T abort tutorial
          setHighlightRect(null);
          return;
        }

        const r = tooltipEl.getBoundingClientRect();
        const PADDING = 8;

        setHighlightRect({
          left: r.left - PADDING,
          top: r.top - PADDING,
          width: r.width + PADDING * 2,
          height: r.height + PADDING * 2,
        });
      });
    });
  }, [currentStep, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const handleNext = () => {
    if (isLastStep) {
      if (tutorialId) {
        markCompleted(tutorialId);
      }
      closeTutorial();
    } else {
      nextStep();
    }
  };

  const handleClose = () => {
    closeTutorial();
  };

  if (!isOpen || !tutorial) return null;

  // Safety guard for SSR
  if (typeof document === 'undefined') return null;

  // Show "Tutorial not available yet" if no steps
  if (!tutorial.steps || tutorial.steps.length === 0) {
    const overlayJsx = (
      <div className="tutorial-root" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
        <div
          className="tutorial-scrim"
          data-pick-ignore="true"
          data-tutorial-overlay="true"
          style={{ pointerEvents: (pickModeActive || inspectMode) ? 'none' : 'auto' }}
          onClick={handleClose}
        >
          <div
            className="tutorial-tooltip"
            data-pick-ignore="true"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: inspectMode ? 'auto' : 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tutorial-tooltip-header">
              <h3 className="tutorial-tooltip-title">{tutorial.title}</h3>
              <button className="tutorial-tooltip-close" onClick={handleClose} aria-label="Close tutorial">
                x
              </button>
            </div>
            <div className="tutorial-tooltip-body">
              <p>Tutorial not available yet.</p>
            </div>
            <div className="tutorial-tooltip-footer">
              <button className="tutorial-btn tutorial-btn-primary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    return createPortal(overlayJsx, document.body);
  }

  const overlayJsx = (
    <div className="tutorial-root" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div
        className="tutorial-scrim"
        data-pick-ignore="true"
        data-tutorial-overlay="true"
        style={{ pointerEvents: (pickModeActive || inspectMode) ? 'none' : 'auto' }}
        onClick={handleClose}
      >
        {/* Highlight rectangle - always wraps the tooltip */}
        {highlightRect && (
          <div
            className="tutorial-highlight"
            data-pick-ignore="true"
            style={{
              top: `${highlightRect.top}px`,
              left: `${highlightRect.left}px`,
              width: `${highlightRect.width}px`,
              height: `${highlightRect.height}px`,
              pointerEvents: inspectMode ? 'auto' : 'none',
            }}
          />
        )}

        {/* Tooltip card */}
        <div
          className="tutorial-tooltip"
          ref={tooltipRef}
          data-pick-ignore="true"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            pointerEvents: inspectMode ? 'auto' : 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tutorial-tooltip-header">
            <h3 className="tutorial-tooltip-title">
              {currentStep?.title || 'Tutorial'}
              {tutorialData.isOverride && (
                <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '8px' }}>(override)</span>
              )}
            </h3>
            <button className="tutorial-tooltip-close" onClick={handleClose} aria-label="Close tutorial">
              x
            </button>
          </div>

          <div className="tutorial-tooltip-body">
            <p>{currentStep?.body}</p>
          </div>

          <div className="tutorial-tooltip-footer">
            <div className="tutorial-step-counter">
              Step {stepIndex + 1} of {tutorial.steps.length}
            </div>
            <div className="tutorial-btn-group">
              {stepIndex > 0 && (
                <button className="tutorial-btn tutorial-btn-secondary" onClick={prevStep}>
                  Back
                </button>
              )}
              <button className="tutorial-btn tutorial-btn-primary" onClick={handleNext}>
                {isLastStep ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlayJsx, document.body);
};
