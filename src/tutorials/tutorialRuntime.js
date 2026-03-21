import { TUTORIALS } from './tutorialRegistry.js';
import { normalizeTutorialDefinition, stripTutorialFunctions, validateTutorialDefinition } from './tutorialSchema.js';

export const TUTORIAL_OVERRIDE_STORAGE_KEY = 'immanence.tutorial.overrides';
export const TUTORIAL_PERSIST_KEY = 'immanence.tutorial';
export const TUTORIAL_ADMIN_KEY = 'immanence.tutorial.admin';
export const TUTORIAL_HINT_KEY = 'immanence.tutorialHintSeen';
export const TUTORIAL_INSPECT_KEY = 'immanence.tutorial.inspect';
export const TUTORIAL_OVERRIDE_CHANGED_EVENT = 'tutorial-override-changed';

function parseJson(raw, fallback) {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mergeStep(baseStep, overrideStep) {
  if (!overrideStep || typeof overrideStep !== 'object') return baseStep;
  if (!baseStep || typeof baseStep !== 'object') return overrideStep;

  return {
    ...baseStep,
    ...overrideStep,
    media: Array.isArray(overrideStep.media) ? overrideStep.media : baseStep.media,
    actions: Array.isArray(overrideStep.actions) ? overrideStep.actions : baseStep.actions,
  };
}

function mergeTutorialDefinition(baseTutorial, overrideTutorial) {
  if (!overrideTutorial || typeof overrideTutorial !== 'object') return baseTutorial;
  if (!baseTutorial || typeof baseTutorial !== 'object') return overrideTutorial;

  const baseSteps = Array.isArray(baseTutorial.steps) ? baseTutorial.steps : [];
  const overrideSteps = Array.isArray(overrideTutorial.steps) ? overrideTutorial.steps : [];
  const maxSteps = Math.max(baseSteps.length, overrideSteps.length);
  const steps = Array.from({ length: maxSteps }, (_, index) => mergeStep(baseSteps[index], overrideSteps[index]));

  return {
    ...baseTutorial,
    ...overrideTutorial,
    steps,
  };
}

export function readTutorialOverrides() {
  if (typeof window === 'undefined') return {};
  return parseJson(window.localStorage.getItem(TUTORIAL_OVERRIDE_STORAGE_KEY), {});
}

export function writeTutorialOverrides(overrides) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TUTORIAL_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(TUTORIAL_OVERRIDE_CHANGED_EVENT));
}

export function saveTutorialOverride(tutorialId, tutorial) {
  const overrides = readTutorialOverrides();
  overrides[tutorialId] = stripTutorialFunctions(tutorial);
  writeTutorialOverrides(overrides);
}

export function clearTutorialOverride(tutorialId) {
  const overrides = readTutorialOverrides();
  delete overrides[tutorialId];
  writeTutorialOverrides(overrides);
}

export function resolveTutorialDefinition(tutorialId) {
  const baseTutorial = TUTORIALS[tutorialId] || null;
  const overrides = readTutorialOverrides();
  const overrideTutorial = overrides[tutorialId] || null;
  const tutorial = mergeTutorialDefinition(baseTutorial, overrideTutorial);

  if (!tutorial) {
    return {
      tutorial: null,
      isOverride: false,
      errors: [`Unknown tutorial: ${tutorialId}`],
    };
  }

  return {
    tutorial: normalizeTutorialDefinition(tutorialId, tutorial),
    isOverride: Boolean(overrideTutorial),
    errors: validateTutorialDefinition(tutorialId, tutorial),
  };
}

function resolveElementFromTarget(target) {
  if (!target) return null;

  const MAX_DEPTH = 6;
  const resolve = (value, depth) => {
    if (!value) return null;
    if (depth > MAX_DEPTH) return null;

    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value;

    if (typeof value === 'string') {
      try {
        return document.querySelector(value);
      } catch {
        return null;
      }
    }

    if (typeof value === 'function') {
      try {
        return resolve(value(), depth + 1);
      } catch {
        return null;
      }
    }

    if (Array.isArray(value)) {
      for (const candidate of value) {
        const resolved = resolve(candidate, depth + 1);
        if (resolved) return resolved;
      }
      return null;
    }

    if (value && typeof value === 'object') {
      // Legacy/override-friendly shapes (all optional): { element }, { selector }, { target }
      if (typeof HTMLElement !== 'undefined' && value.element instanceof HTMLElement) return value.element;
      if (value.selector && typeof value.selector === 'string') {
        return resolve(value.selector, depth + 1);
      }
      if (value.target) return resolve(value.target, depth + 1);
      return null;
    }

    return null;
  };

  return resolve(target, 0);
}

export function resolveTutorialTarget(step) {
  if (typeof document === 'undefined') return null;
  return resolveElementFromTarget(step?.target || null);
}

export async function waitForTutorialTarget(step, options = {}) {
  if (typeof document === 'undefined') return null;

  const waitFor = step?.waitFor;
  if (!waitFor?.enabled) {
    return resolveTutorialTarget(step);
  }

  const startedAt = Date.now();
  const timeoutMs = Number(waitFor.timeoutMs) || 0;
  const intervalMs = Number(waitFor.intervalMs) || 50;
  const target = waitFor.target || step?.target || null;

  while (true) {
    const element = resolveElementFromTarget(target);
    if (element) return element;

    if (options.signal?.aborted) return null;
    if (timeoutMs <= 0) return null;
    if (Date.now() - startedAt >= timeoutMs) return null;

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }
}

export function getTutorialStorageKeys() {
  return [
    TUTORIAL_PERSIST_KEY,
    TUTORIAL_OVERRIDE_STORAGE_KEY,
    TUTORIAL_ADMIN_KEY,
    TUTORIAL_HINT_KEY,
    TUTORIAL_INSPECT_KEY,
  ];
}
