import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import 'driver.js/dist/driver.css';
import './tutorialDriver.css';
import { createDriverInstance, createDriverStep } from '../../tutorials/driverAdapter.js';
import { useTutorialStore, isTutorialAdminMode } from '../../state/tutorialStore.js';
import {
  resolveTutorialDefinition,
  saveTutorialOverride,
  waitForTutorialTarget,
} from '../../tutorials/tutorialRuntime.js';
import { stripTutorialFunctions, validateTutorialDefinition } from '../../tutorials/tutorialSchema.js';

const BODY_MAX_CHARS = 2000;
const POPOVER_SAFE_MARGIN_PX = 12;
const POPOVER_TARGET_GAP_PX = 14;

function rectsIntersect(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function expandRect(rect, byPx) {
  return {
    left: rect.left - byPx,
    top: rect.top - byPx,
    right: rect.right + byPx,
    bottom: rect.bottom + byPx,
    width: rect.width + byPx * 2,
    height: rect.height + byPx * 2,
  };
}

function getAppFrameBounds() {
  const frame =
    typeof document !== 'undefined'
      ? document.querySelector('[data-app-frame]')
      : null;

  const viewport = {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  };

  if (!(frame instanceof HTMLElement)) return viewport;

  const rect = frame.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}

function applyPopoverTranslate(wrapper, dx, dy) {
  // Use translate so we don't stomp Driver's internal positioning (left/top).
  const x = Math.round(dx);
  const y = Math.round(dy);

  // Prefer the translate property when available; fall back to appending a translate() transform.
  // Driver sets left/top for positioning, so this is safe and reversible.
  if ('translate' in wrapper.style) {
    wrapper.style.translate = `${x}px ${y}px`;
    return;
  }

  const base = wrapper.dataset.immanenceDriverBaseTransform ?? wrapper.style.transform ?? '';
  if (!wrapper.dataset.immanenceDriverBaseTransform) {
    wrapper.dataset.immanenceDriverBaseTransform = base;
  }
  wrapper.style.transform = `${base} translate(${x}px, ${y}px)`.trim();
}

function clampPopoverToBounds(rect, bounds) {
  let dx = 0;
  let dy = 0;

  if (rect.left < bounds.left) dx += bounds.left - rect.left;
  if (rect.right > bounds.right) dx += bounds.right - rect.right;
  if (rect.top < bounds.top) dy += bounds.top - rect.top;
  if (rect.bottom > bounds.bottom) dy += bounds.bottom - rect.bottom;

  return { dx, dy };
}

function adjustPopoverPosition({ wrapper, targetEl }) {
  if (!(wrapper instanceof HTMLElement)) return;

  const bounds = getAppFrameBounds();
  const safe = {
    left: bounds.left + POPOVER_SAFE_MARGIN_PX,
    top: bounds.top + POPOVER_SAFE_MARGIN_PX,
    right: bounds.right - POPOVER_SAFE_MARGIN_PX,
    bottom: bounds.bottom - POPOVER_SAFE_MARGIN_PX,
  };

  // Reset prior adjustments before measuring.
  applyPopoverTranslate(wrapper, 0, 0);

  const rect = wrapper.getBoundingClientRect();
  const clamp1 = clampPopoverToBounds(rect, safe);
  let dx = clamp1.dx;
  let dy = clamp1.dy;

  const virtual = {
    left: rect.left + dx,
    top: rect.top + dy,
    right: rect.right + dx,
    bottom: rect.bottom + dy,
    width: rect.width,
    height: rect.height,
  };

  if (targetEl instanceof HTMLElement) {
    const targetRect = expandRect(targetEl.getBoundingClientRect(), 6);

    if (rectsIntersect(virtual, targetRect)) {
      const spaceTop = targetRect.top - safe.top;
      const spaceBottom = safe.bottom - targetRect.bottom;
      const spaceLeft = targetRect.left - safe.left;
      const spaceRight = safe.right - targetRect.right;

      // Prefer vertical moves unless horizontal space is meaningfully better.
      const preferBottom = spaceBottom >= spaceTop;
      const preferRight = spaceRight >= spaceLeft;

      const candidates = [
        { dir: 'bottom', score: spaceBottom, enabled: true },
        { dir: 'top', score: spaceTop, enabled: true },
        { dir: 'right', score: spaceRight, enabled: true },
        { dir: 'left', score: spaceLeft, enabled: true },
      ];

      candidates.sort((a, b) => b.score - a.score);
      let best = candidates[0]?.dir || null;

      // Bias toward the preferred vertical side if it has non-trivial space.
      if (preferBottom && spaceBottom > 24) best = 'bottom';
      if (!preferBottom && spaceTop > 24) best = 'top';
      if (best === 'left' || best === 'right') {
        // Only use horizontal if vertical space is very tight.
        if (Math.max(spaceTop, spaceBottom) > rect.height * 0.6) {
          best = preferBottom ? 'bottom' : 'top';
        } else {
          best = preferRight ? 'right' : 'left';
        }
      }

      if (best === 'top') {
        dy += (targetRect.top - POPOVER_TARGET_GAP_PX) - virtual.bottom;
      } else if (best === 'bottom') {
        dy += (targetRect.bottom + POPOVER_TARGET_GAP_PX) - virtual.top;
      } else if (best === 'left') {
        dx += (targetRect.left - POPOVER_TARGET_GAP_PX) - virtual.right;
      } else if (best === 'right') {
        dx += (targetRect.right + POPOVER_TARGET_GAP_PX) - virtual.left;
      }

      // Final clamp after overlap avoidance.
      const rect2 = {
        left: rect.left + dx,
        top: rect.top + dy,
        right: rect.right + dx,
        bottom: rect.bottom + dy,
      };
      const clamp2 = clampPopoverToBounds(rect2, safe);
      dx += clamp2.dx;
      dy += clamp2.dy;
    }
  }

  applyPopoverTranslate(wrapper, dx, dy);
}

function resolveMediaSrc(src) {
  if (!src) return '';
  if (/^(https?:)?\/\//i.test(src)) return src;

  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.replace(/\/?$/, '/')}${String(src).replace(/^\/+/, '')}`;
}

function renderSafeLink({ href, ...props }) {
  const safeHref =
    href && (href.startsWith('https://') || href.startsWith('http://'))
      ? href
      : '#';

  return <a {...props} href={safeHref} target="_blank" rel="noopener noreferrer" />;
}

function getActionClassName(variant = 'secondary') {
  if (variant === 'primary') return 'tutorial-driver-action tutorial-driver-action-primary';
  if (variant === 'ghost') return 'tutorial-driver-action tutorial-driver-action-ghost';
  return 'tutorial-driver-action tutorial-driver-action-secondary';
}

function TutorialPopoverCard({
  tutorial,
  tutorialId,
  step,
  stepIndex,
  totalSteps,
  isOverride,
  isEditing,
  onToggleEditing,
  onPrev,
  onNext,
  onClose,
  onAction,
  onSaved,
  targetResolved,
}) {
  const rawBody = step?.body || '';
  const safeBody = rawBody.length > BODY_MAX_CHARS ? rawBody.slice(0, BODY_MAX_CHARS) : rawBody;
  const isLastStep = stepIndex === totalSteps - 1;
  const showClose = step?.canSkip !== false;

  return (
    <div className="tutorial-driver-card" data-pick-ignore="true">
      <div className="tutorial-driver-header">
        <div className="tutorial-driver-title-wrap">
          <h3 className="tutorial-driver-title">{step?.title || tutorial?.title || 'Tutorial'}</h3>
          {isOverride && <span className="tutorial-driver-badge">override</span>}
        </div>
        {isTutorialAdminMode() && (
          <button
            type="button"
            className="tutorial-driver-edit"
            onClick={onToggleEditing}
          >
            {isEditing ? 'Close editor' : 'Edit step'}
          </button>
        )}
      </div>

      <div className="tutorial-driver-body">
        {isEditing ? (
          <InlineStepEditor
            tutorial={tutorial}
            tutorialId={tutorialId}
            stepIndex={stepIndex}
            onCancel={onToggleEditing}
            onSave={onSaved}
          />
        ) : (
          <>
            {!targetResolved && step?.target && (
              <div className="tutorial-driver-note">
                Target not found. This step is centered until the UI appears.
              </div>
            )}

            <ReactMarkdown
              allowedElements={['p', 'br', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'a']}
              unwrapDisallowed={true}
              components={{ a: renderSafeLink }}
            >
              {safeBody}
            </ReactMarkdown>

            {step?.media?.length > 0 && (
              <div className="tutorial-driver-media-list">
                {step.media.map((mediaItem) => (
                  <figure key={mediaItem.id} className="tutorial-driver-media">
                    {mediaItem.kind === 'image' && (
                      <img
                        src={resolveMediaSrc(mediaItem.src)}
                        alt={mediaItem.alt || ''}
                        className="tutorial-driver-image"
                      />
                    )}
                    {mediaItem.caption && (
                      <figcaption className="tutorial-driver-caption">{mediaItem.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!isEditing && step?.actions?.length > 0 && (
        <div className="tutorial-driver-action-row">
          {step.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={getActionClassName(action.variant)}
              onClick={() => onAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {!isEditing && (
        <div className="tutorial-driver-footer">
          <div className="tutorial-driver-progress">
            Step {Math.min(stepIndex + 1, totalSteps)} of {Math.max(totalSteps, 1)}
          </div>
          <div className="tutorial-driver-nav">
            {stepIndex > 0 && (
              <button type="button" className="tutorial-driver-btn tutorial-driver-btn-secondary" onClick={onPrev}>
                Back
              </button>
            )}
            {showClose && (
              <button type="button" className="tutorial-driver-btn tutorial-driver-btn-ghost" onClick={onClose}>
                Close
              </button>
            )}
            <button type="button" className="tutorial-driver-btn tutorial-driver-btn-primary" onClick={onNext}>
              {isLastStep ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineStepEditor({ tutorial, tutorialId, stepIndex, onCancel, onSave }) {
  const step = tutorial?.steps?.[stepIndex];
  const [title, setTitle] = useState(step?.title || '');
  const [body, setBody] = useState(step?.body || '');
  const [errors, setErrors] = useState([]);

  const handleSave = () => {
    const updatedTutorial = stripTutorialFunctions(tutorial);
    updatedTutorial.steps[stepIndex] = {
      ...updatedTutorial.steps[stepIndex],
      title,
      body,
    };

    const validationErrors = validateTutorialDefinition(tutorialId, updatedTutorial);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    saveTutorialOverride(tutorialId, updatedTutorial);
    setErrors([]);
    onSave();
  };

  return (
    <div className="tutorial-driver-editor">
      <label className="tutorial-driver-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          maxLength={60}
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors([]);
          }}
        />
      </label>

      <label className="tutorial-driver-field">
        <span>Body</span>
        <textarea
          rows={7}
          value={body}
          maxLength={1200}
          onChange={(event) => {
            setBody(event.target.value);
            setErrors([]);
          }}
        />
      </label>

      {errors.length > 0 && (
        <div className="tutorial-driver-errors">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}

      <div className="tutorial-driver-editor-actions">
        <button type="button" className="tutorial-driver-btn tutorial-driver-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="tutorial-driver-btn tutorial-driver-btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

export function TutorialOverlay() {
  const {
    isOpen,
    tutorialId,
    stepIndex,
    closeTutorial,
    nextStep,
    openTutorial,
    prevStep,
    markCompleted,
  } = useTutorialStore();
  const [overrideVersion, setOverrideVersion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState(() => isTutorialAdminMode());
  const driverRef = useRef(null);
  const rootRef = useRef(null);
  const mountNodeRef = useRef(null);
  const popoverWrapperRef = useRef(null);
  const activeTargetRef = useRef(null);

  const tutorialData = useMemo(() => {
    if (!tutorialId) {
      return { tutorial: null, isOverride: false, errors: [] };
    }

    void overrideVersion;
    return resolveTutorialDefinition(tutorialId);
  }, [tutorialId, overrideVersion]);

  const tutorial = tutorialData.tutorial;
  const step =
    tutorial?.steps?.[stepIndex] ||
    (tutorial
      ? {
          id: `${tutorial.id}:empty`,
          title: tutorial.title,
          body: 'Tutorial not available yet.',
          target: null,
          placement: 'center',
          media: [],
          actions: [],
          canSkip: true,
          allowInteraction: false,
          waitFor: null,
          onEnter: null,
          onExit: null,
        }
      : null);

  const teardownDriver = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }

    if (mountNodeRef.current) {
      mountNodeRef.current.remove();
      mountNodeRef.current = null;
    }

    popoverWrapperRef.current = null;
    activeTargetRef.current = null;

    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (tutorialId) {
      markCompleted(tutorialId);
    }
    closeTutorial();
  }, [closeTutorial, markCompleted, tutorialId]);

  const handleNext = useCallback(() => {
    if (!tutorial) return;

    if (stepIndex >= tutorial.steps.length - 1) {
      handleComplete();
      return;
    }

    nextStep();
  }, [handleComplete, nextStep, stepIndex, tutorial]);

  const handleAction = useCallback((action) => {
    if (!action?.intent) return;

    switch (action.intent) {
      case 'nextStep':
        handleNext();
        return;
      case 'prevStep':
        prevStep();
        return;
      case 'closeTutorial':
        closeTutorial();
        return;
      case 'completeTutorial':
        handleComplete();
        return;
      case 'openTutorial':
        if (action.tutorialId) {
          openTutorial(action.tutorialId);
        }
        return;
      case 'openUrl':
        if (action.href) {
          window.open(action.href, action.target || '_blank', 'noopener,noreferrer');
        }
        return;
      default:
        return;
    }
  }, [closeTutorial, handleComplete, handleNext, openTutorial, prevStep]);

  useEffect(() => {
    const onOverrideChanged = () => setOverrideVersion((value) => value + 1);
    window.addEventListener('tutorial-override-changed', onOverrideChanged);
    return () => window.removeEventListener('tutorial-override-changed', onOverrideChanged);
  }, []);

  useEffect(() => {
    // Avoid synchronous setState inside effects (eslint plugin rule); schedule next frame.
    const raf = window.requestAnimationFrame(() => setIsEditing(false));
    return () => window.cancelAnimationFrame(raf);
  }, [tutorialId, stepIndex]);

  useEffect(() => () => teardownDriver(), [teardownDriver]);

  const setTutorialAdminMode = useCallback((enabled) => {
    try {
      if (enabled) {
        window.localStorage.setItem('immanence.tutorial.admin', '1');
      } else {
        window.localStorage.removeItem('immanence.tutorial.admin');
      }
    } catch {
      // ignore
    }
    setAdminEnabled(Boolean(enabled));
  }, []);

  useEffect(() => {
    // Keep local state in sync if the key is toggled elsewhere (DevPanel, console, another tab).
    const sync = () => setAdminEnabled(isTutorialAdminMode());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !tutorial?.onOpen) return undefined;
    tutorial.onOpen({ tutorialId: tutorial.id });
    return () => {
      tutorial.onClose?.({ tutorialId: tutorial.id });
    };
  }, [isOpen, tutorial]);

  useEffect(() => {
    if (!isOpen || !step) return undefined;
    step.onEnter?.({ tutorialId, stepIndex, stepId: step.id });
    return () => {
      step.onExit?.({ tutorialId, stepIndex, stepId: step.id });
    };
  }, [isOpen, step, stepIndex, tutorialId]);

  useEffect(() => {
    if (!isOpen || !tutorial || !step) {
      teardownDriver();
      return undefined;
    }

    let cancelled = false;
    teardownDriver();

    const render = async () => {
      const targetElement = await waitForTutorialTarget(step);
      if (cancelled) return;

      const driverInstance = createDriverInstance(step, { onClose: closeTutorial });
      driverRef.current = driverInstance;

      const driverStep = createDriverStep(step, targetElement, {
        onClose: closeTutorial,
        onPopoverRender: (popover) => {
          if (cancelled) return;

          popover.wrapper.setAttribute('data-tutorial-runtime', 'driver');
          popover.wrapper.setAttribute('data-tutorial-overlay', 'true');
          popover.wrapper.setAttribute('data-pick-ignore', 'true');
          popoverWrapperRef.current = popover.wrapper;
          activeTargetRef.current = targetElement || null;
          popover.description.innerHTML = '';
          popover.title.style.display = 'none';
          popover.footer.style.display = 'none';
          popover.description.style.marginTop = '0';

          const mountNode = document.createElement('div');
          mountNode.className = 'tutorial-driver-root';
          mountNode.setAttribute('data-pick-ignore', 'true');
          popover.description.appendChild(mountNode);
          mountNodeRef.current = mountNode;

          const root = createRoot(mountNode);
          rootRef.current = root;
          root.render(
            <TutorialPopoverCard
              tutorial={tutorial}
              tutorialId={tutorial.id}
              step={step}
              stepIndex={stepIndex}
              totalSteps={Math.max(tutorial.steps.length, 1)}
              isOverride={tutorialData.isOverride}
              isEditing={isEditing}
              onToggleEditing={() => setIsEditing((value) => !value)}
              onPrev={prevStep}
              onNext={handleNext}
              onClose={closeTutorial}
              onAction={handleAction}
              onSaved={() => {
                setIsEditing(false);
                setOverrideVersion((value) => value + 1);
              }}
              targetResolved={Boolean(targetElement)}
            />
          );

          // After mounting, the popover size can change. Clamp to the app frame and avoid overlap.
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              if (cancelled) return;
              adjustPopoverPosition({ wrapper: popover.wrapper, targetEl: targetElement });
            });
          });
        },
      });

      driverInstance.highlight(driverStep);
    };

    render();

    return () => {
      cancelled = true;
      teardownDriver();
    };
  }, [
    closeTutorial,
    handleAction,
    handleNext,
    isEditing,
    isOpen,
    prevStep,
    step,
    stepIndex,
    teardownDriver,
    tutorial,
    tutorialData.isOverride,
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const refresh = () => {
      driverRef.current?.refresh();
      const wrapper = popoverWrapperRef.current;
      const targetEl = activeTargetRef.current;
      if (wrapper instanceof HTMLElement) {
        window.requestAnimationFrame(() => adjustPopoverPosition({ wrapper, targetEl }));
      }
    };
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (tutorialData.errors?.length > 0) {
      console.warn('[TutorialOverlay] Tutorial validation warnings:', tutorialData.errors);
    }
  }, [tutorialData.errors]);

  const showDevWidget = isOpen && (import.meta.env.DEV || adminEnabled);

  return showDevWidget
    ? createPortal(
        <div
          data-tutorial-overlay="true"
          data-pick-ignore="true"
          style={{
            position: 'fixed',
            right: 14,
            bottom: 14,
            zIndex: 1000000001,
            display: 'flex',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.14)',
            background: 'rgba(10, 10, 14, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'rgba(245, 247, 250, 0.9)',
            fontSize: 12,
            pointerEvents: 'auto',
            alignItems: 'center',
            maxWidth: 'min(520px, calc(100vw - 28px))',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Tutorial Dev
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tutorialId || '(none)'} {Number.isFinite(stepIndex) ? `· step ${stepIndex + 1}` : ''}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !adminEnabled;
              setTutorialAdminMode(next);
              if (next) setIsEditing(true);
            }}
            style={{
              padding: '8px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: adminEnabled ? 'rgba(120,255,210,0.14)' : 'rgba(255,255,255,0.06)',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 700,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {adminEnabled ? 'Admin: ON' : 'Admin: OFF'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!adminEnabled) setTutorialAdminMode(true);
              setIsEditing((v) => !v);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(88, 170, 255, 0.18)',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 800,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {isEditing ? 'Close Editor' : 'Edit Step'}
          </button>
        </div>,
        document.body
      )
    : null;
}

export default TutorialOverlay;
