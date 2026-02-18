const DEVTOOLS_LS_KEY = 'immanence.devtools.enabled';

export function isBrowserEnvironment() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function resolveImportMetaDevBuild() {
  // Keep the same defensive order as existing gate logic.
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (typeof import.meta.env.DEV === 'boolean') return import.meta.env.DEV;
      if (typeof import.meta.env.PROD === 'boolean') return !import.meta.env.PROD;
      if (typeof import.meta.env.MODE === 'string') return import.meta.env.MODE !== 'production';
    }
  } catch {
    // ignore
  }
  return null;
}

function resolveProcessDevBuild() {
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env.NODE_ENV === 'string') {
      return process.env.NODE_ENV !== 'production';
    }
  } catch {
    // ignore
  }
  return null;
}

export function isDevBuild() {
  const importMetaDev = resolveImportMetaDevBuild();
  const processDev = resolveProcessDevBuild();
  return Boolean(importMetaDev || processDev);
}

function hasDevtoolsQueryFlag() {
  if (!isBrowserEnvironment()) return false;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('devtools') === '1';
  } catch {
    return false;
  }
}

function isDevtoolsUnlocked() {
  if (!isBrowserEnvironment()) return false;
  try {
    return window.localStorage.getItem(DEVTOOLS_LS_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDevtoolsEnabled() {
  // Preserve existing unlock semantics:
  // in DEV build, always enabled; otherwise require query flag + unlock key.
  const importMetaDev = resolveImportMetaDevBuild();
  if (importMetaDev === true) return true;
  return hasDevtoolsQueryFlag() && isDevtoolsUnlocked();
}
