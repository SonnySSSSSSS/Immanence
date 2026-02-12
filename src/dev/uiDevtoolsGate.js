const DEVTOOLS_LS_KEY = 'immanence.devtools.enabled';

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isDevBuild() {
  // Be defensive: some bundlers/plugins may not set `DEV` but will set `MODE`/`PROD`.
  // In true production builds we must never treat this as dev.
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (typeof import.meta.env.DEV === 'boolean') return import.meta.env.DEV;
      if (typeof import.meta.env.PROD === 'boolean') return !import.meta.env.PROD;
      if (typeof import.meta.env.MODE === 'string') return import.meta.env.MODE !== 'production';
    }
  } catch {
    // ignore
  }
  return false;
}

export function hasDevtoolsQueryFlag() {
  if (!hasDom()) return false;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('devtools') === '1';
  } catch {
    return false;
  }
}

export function isDevtoolsUnlocked() {
  if (!hasDom()) return false;
  try {
    return window.localStorage.getItem(DEVTOOLS_LS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDevtoolsUnlocked(enabled) {
  if (!hasDom()) return;
  try {
    if (enabled) window.localStorage.setItem(DEVTOOLS_LS_KEY, '1');
    else window.localStorage.removeItem(DEVTOOLS_LS_KEY);
  } catch {
    // ignore storage errors
  }
}

// Production safety: in non-DEV builds, devtools require BOTH:
//  - query flag `?devtools=1`
//  - persisted unlock `localStorage.immanence.devtools.enabled=1`
export function isDevtoolsEnabled() {
  if (isDevBuild()) return true;
  return hasDevtoolsQueryFlag() && isDevtoolsUnlocked();
}
