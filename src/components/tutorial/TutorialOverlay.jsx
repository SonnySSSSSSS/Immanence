// src/components/tutorial/TutorialOverlay.jsx
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { useTutorialStore, isTutorialAdminMode } from '../../state/tutorialStore';
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
  const [isEditing, setIsEditing] = useState(false);
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
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {isTutorialAdminMode() && (
                <button
                  className="tutorial-tooltip-close"
                  onClick={() => setIsEditing(!isEditing)}
                  aria-label="Edit tutorial"
                  style={{ fontSize: '16px' }}
                >
                  ✎
                </button>
              )}
              <button className="tutorial-tooltip-close" onClick={handleClose} aria-label="Close tutorial">
                x
              </button>
            </div>
          </div>

          <div className="tutorial-tooltip-body">
            {isEditing ? (
              <InlineStepEditor
                tutorial={tutorial}
                stepIndex={stepIndex}
                onSave={() => {
                  setOverrideReloadTrigger(prev => prev + 1);
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <ReactMarkdown
                  allowedElements={['p', 'br', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'a']}
                  unwrapDisallowed={true}
                  components={{
                    a: ({ href, ...props }) => {
                      const safeHref =
                        href && (href.startsWith('https://') || href.startsWith('http://'))
                          ? href
                          : '#';

                      return (
                        <a
                          {...props}
                          href={safeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      );
                    },
                  }}
                >
                  {currentStep?.body || ''}
                </ReactMarkdown>
                {currentStep?.media && currentStep.media.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    {currentStep.media.map((m, i) => (
                      <div key={i}>
                        <img
                          src={import.meta.env.BASE_URL + 'tutorial/' + m.key}
                          alt={m.alt}
                          style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }}
                        />
                        {m.caption && (
                          <div className="tutorial-tooltip-media-caption">{m.caption}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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

// Inline step editor component
function InlineStepEditor({ tutorial, stepIndex, onSave, onCancel }) {
  const step = tutorial.steps[stepIndex];
  const [title, setTitle] = useState(step?.title || '');
  const [body, setBody] = useState(step?.body || '');
  const [errors, setErrors] = useState([]);

  const validateStep = () => {
    const newErrors = [];
    if (!title.trim()) {
      newErrors.push('Title is required');
    }
    if (title.length > 60) {
      newErrors.push('Title must be max 60 characters');
    }
    if (!body.trim()) {
      newErrors.push('Body is required');
    }
    if (body.length > 1200) {
      newErrors.push('Body must be max 1200 characters');
    }
    if (body.includes('<') || body.includes('>')) {
      newErrors.push('HTML tags not allowed');
    }
    if (body.includes('```') || body.includes('|---')) {
      newErrors.push('Code blocks and tables not allowed');
    }
    return newErrors;
  };

  const handleSave = () => {
    const newErrors = validateStep();
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save override
    try {
      const overrideKey = 'immanence.tutorial.overrides';
      const raw = localStorage.getItem(overrideKey);
      const overrides = raw ? JSON.parse(raw) : {};
      const tutorialId = Object.keys(overrides).find(key => overrides[key] === tutorial) ||
                         Object.keys(TUTORIALS).find(key => TUTORIALS[key] === tutorial);

      if (tutorialId) {
        const updatedTutorial = JSON.parse(JSON.stringify(tutorial));
        updatedTutorial.steps[stepIndex] = { ...step, title, body };
        overrides[tutorialId] = updatedTutorial;
        localStorage.setItem(overrideKey, JSON.stringify(overrides));
        window.dispatchEvent(new CustomEvent('tutorial-override-changed'));
        onSave();
      }
    } catch (err) {
      setErrors(['Failed to save: ' + err.message]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>Title (max 60 chars)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors([]);
          }}
          maxLength={60}
          style={{
            width: '100%',
            padding: '6px 8px',
            marginTop: '4px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '13px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>Body (max 1200 chars, markdown OK)</label>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setErrors([]);
          }}
          maxLength={1200}
          style={{
            width: '100%',
            height: '100px',
            padding: '8px',
            marginTop: '4px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '12px',
            fontFamily: 'monospace',
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
          {body.length} / 1200
        </div>
      </div>

      {errors.length > 0 && (
        <div style={{ fontSize: '11px', color: '#ff6b6b' }}>
          {errors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '6px 12px',
            background: 'rgba(147, 197, 253, 0.2)',
            border: '1px solid rgba(147, 197, 253, 0.4)',
            borderRadius: '4px',
            color: 'rgba(147, 197, 253, 0.9)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(147, 197, 253, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(147, 197, 253, 0.2)'}
        >
          Save
        </button>
      </div>
    </div>
  );
}
