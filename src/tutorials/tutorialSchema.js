const VALID_PLACEMENTS = new Set(['top', 'right', 'bottom', 'left', 'center']);
const VALID_ACTION_VARIANTS = new Set(['primary', 'secondary', 'ghost']);
const VALID_ACTION_INTENTS = new Set([
  'nextStep',
  'prevStep',
  'closeTutorial',
  'completeTutorial',
  'openTutorial',
  'openUrl',
]);

function asTrimmedString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function normalizePlacement(value) {
  const placement = asTrimmedString(value, 'center').toLowerCase();
  return VALID_PLACEMENTS.has(placement) ? placement : 'center';
}

function normalizeWaitFor(value, target) {
  if (!value && !target) return null;

  if (typeof value === 'number') {
    return {
      enabled: true,
      target,
      timeoutMs: Math.max(0, value),
      intervalMs: 50,
      optional: false,
      fallbackToCenter: true,
    };
  }

  if (!value || typeof value !== 'object') {
    return target
      ? {
          enabled: true,
          target,
          timeoutMs: 0,
          intervalMs: 50,
          optional: true,
          fallbackToCenter: true,
        }
      : null;
  }

  return {
    enabled: value.enabled !== false,
    target: typeof value.target === 'string' ? value.target : target,
    timeoutMs: Number.isFinite(value.timeoutMs) ? Math.max(0, Number(value.timeoutMs)) : 0,
    intervalMs: Number.isFinite(value.intervalMs) ? Math.max(16, Number(value.intervalMs)) : 50,
    optional: value.optional !== false,
    fallbackToCenter: value.fallbackToCenter !== false,
  };
}

function normalizeMediaItem(mediaItem, index) {
  if (!mediaItem || typeof mediaItem !== 'object') return null;

  const src = asTrimmedString(mediaItem.src || mediaItem.key, '');
  if (!src) return null;

  return {
    id: asTrimmedString(mediaItem.id, `media-${index + 1}`),
    kind: asTrimmedString(mediaItem.kind, 'image').toLowerCase(),
    src,
    alt: asTrimmedString(mediaItem.alt, ''),
    caption: asTrimmedString(mediaItem.caption, ''),
  };
}

function normalizeAction(action, index) {
  if (!action || typeof action !== 'object') return null;

  const intent = asTrimmedString(action.intent, '').trim();
  if (!VALID_ACTION_INTENTS.has(intent)) return null;

  const variant = asTrimmedString(action.variant, 'secondary').toLowerCase();

  return {
    id: asTrimmedString(action.id, `action-${index + 1}`),
    label: asTrimmedString(action.label, ''),
    intent,
    tutorialId: asTrimmedString(action.tutorialId, ''),
    href: asTrimmedString(action.href, ''),
    target: asTrimmedString(action.target, ''),
    variant: VALID_ACTION_VARIANTS.has(variant) ? variant : 'secondary',
  };
}

function normalizeStep(step, tutorialId, index) {
  const rawStep = step && typeof step === 'object' ? step : {};
  const target =
    typeof rawStep.target === 'string' || typeof rawStep.target === 'function'
      ? rawStep.target
      : null;

  return {
    id: asTrimmedString(rawStep.id, `${tutorialId}:step:${index + 1}`),
    title: asTrimmedString(rawStep.title, 'Tutorial'),
    body: typeof rawStep.body === 'string' ? rawStep.body : '',
    target,
    placement: normalizePlacement(rawStep.placement),
    media: Array.isArray(rawStep.media)
      ? rawStep.media.map(normalizeMediaItem).filter(Boolean)
      : [],
    canSkip: rawStep.canSkip !== false,
    allowInteraction: rawStep.allowInteraction === true,
    waitFor: normalizeWaitFor(rawStep.waitFor, target),
    actions: Array.isArray(rawStep.actions)
      ? rawStep.actions.map(normalizeAction).filter(Boolean)
      : [],
    onEnter: typeof rawStep.onEnter === 'function' ? rawStep.onEnter : null,
    onExit: typeof rawStep.onExit === 'function' ? rawStep.onExit : null,
  };
}

export function normalizeTutorialDefinition(tutorialId, tutorial) {
  const rawTutorial = tutorial && typeof tutorial === 'object' ? tutorial : {};

  return {
    id: tutorialId,
    title: asTrimmedString(rawTutorial.title, tutorialId),
    description: asTrimmedString(rawTutorial.description, ''),
    onOpen: typeof rawTutorial.onOpen === 'function' ? rawTutorial.onOpen : null,
    onClose: typeof rawTutorial.onClose === 'function' ? rawTutorial.onClose : null,
    steps: Array.isArray(rawTutorial.steps)
      ? rawTutorial.steps.map((step, index) => normalizeStep(step, tutorialId, index))
      : [],
  };
}

export function validateTutorialDefinition(tutorialId, tutorial) {
  const errors = [];
  const normalized = normalizeTutorialDefinition(tutorialId || 'tutorial', tutorial);

  if (!normalized.title) {
    errors.push('Missing tutorial title.');
  }

  if (!Array.isArray(tutorial?.steps)) {
    errors.push('Missing or invalid "steps" array.');
    return errors;
  }

  normalized.steps.forEach((step, index) => {
    const stepLabel = `Step ${index + 1}`;

    if (!step.title) errors.push(`${stepLabel}: title is required.`);
    if (!step.body) errors.push(`${stepLabel}: body is required.`);

    if (step.target !== null && typeof step.target !== 'string' && typeof step.target !== 'function') {
      errors.push(`${stepLabel}: target must be a string, function, or null.`);
    }

    if (!VALID_PLACEMENTS.has(step.placement)) {
      errors.push(`${stepLabel}: placement must be top, right, bottom, left, or center.`);
    }

    step.media.forEach((mediaItem, mediaIndex) => {
      if (!mediaItem.src) {
        errors.push(`${stepLabel}: media ${mediaIndex + 1} is missing src.`);
      }
    });

    if (Array.isArray(tutorial?.steps?.[index]?.actions)) {
      tutorial.steps[index].actions.forEach((action, actionIndex) => {
        const normalizedAction = normalizeAction(action, actionIndex);
        if (!normalizedAction) {
          errors.push(`${stepLabel}: action ${actionIndex + 1} is invalid or uses an unsupported intent.`);
          return;
        }

        if (!normalizedAction.label) {
          errors.push(`${stepLabel}: action ${actionIndex + 1} must include a label.`);
        }

        if (normalizedAction.intent === 'openTutorial' && !normalizedAction.tutorialId) {
          errors.push(`${stepLabel}: openTutorial actions must include tutorialId.`);
        }

        if (normalizedAction.intent === 'openUrl' && !normalizedAction.href) {
          errors.push(`${stepLabel}: openUrl actions must include href.`);
        }
      });
    }
  });

  return errors;
}

export function stripTutorialFunctions(tutorial) {
  return JSON.parse(JSON.stringify(tutorial));
}

export { VALID_ACTION_INTENTS, VALID_ACTION_VARIANTS, VALID_PLACEMENTS };
