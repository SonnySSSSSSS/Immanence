import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const driverRef = useRef(null);
  const rootRef = useRef(null);
  const mountNodeRef = useRef(null);

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
    setIsEditing(false);
  }, [tutorialId, stepIndex]);

  useEffect(() => () => teardownDriver(), [teardownDriver]);

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

    const refresh = () => driverRef.current?.refresh();
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

  return null;
}

export default TutorialOverlay;
