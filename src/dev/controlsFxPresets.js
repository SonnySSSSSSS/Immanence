const PRESETS_KEY = 'immanence.dev.controlsFxPresets.v1';
export const CONTROLS_FX_PRESETS_EVENT = 'immanence-controls-fx-presets-updated';

export const CONTROLS_FX_DEFAULTS = Object.freeze({
  thickness: 2,
  speed: 0.052,
  chaos: 0.095,
  offsetPx: 16,
  color: null, // null => use role-group default
});

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function clampNumber(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function normalizePreset(raw = {}) {
  return {
    thickness: clampNumber(raw.thickness, 1, 12, CONTROLS_FX_DEFAULTS.thickness),
    speed: clampNumber(raw.speed, 0, 0.2, CONTROLS_FX_DEFAULTS.speed),
    chaos: clampNumber(raw.chaos, 0, 0.3, CONTROLS_FX_DEFAULTS.chaos),
    offsetPx: clampNumber(raw.offsetPx, 0, 40, CONTROLS_FX_DEFAULTS.offsetPx),
    color: typeof raw.color === 'string' && raw.color.trim().length ? raw.color.trim() : null,
  };
}

function loadAll() {
  if (!hasDom()) return {};
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(next) {
  if (!hasDom()) return;
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(next || {}));
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent(CONTROLS_FX_PRESETS_EVENT));
  } catch {
    // ignore
  }
}

export function getControlsFxPreset(controlId) {
  if (!controlId || typeof controlId !== 'string') return { ...CONTROLS_FX_DEFAULTS };
  const all = loadAll();
  const raw = all?.[controlId] || null;
  return normalizePreset({ ...CONTROLS_FX_DEFAULTS, ...(raw || {}) });
}

export function setControlsFxPreset(controlId, patch) {
  if (!hasDom()) return;
  if (!controlId || typeof controlId !== 'string') return;
  const all = loadAll();
  const prev = all?.[controlId] || {};
  const nextPreset = normalizePreset({ ...prev, ...(patch || {}) });
  const nextAll = { ...all, [controlId]: nextPreset };
  saveAll(nextAll);
}

export function resetControlsFxPreset(controlId) {
  if (!hasDom()) return;
  if (!controlId || typeof controlId !== 'string') return;
  const all = loadAll();
  if (!all || typeof all !== 'object' || !(controlId in all)) return;
  const nextAll = { ...all };
  delete nextAll[controlId];
  saveAll(nextAll);
}

export function subscribeControlsFxPresets(cb) {
  if (!hasDom() || typeof cb !== 'function') return () => {};
  const handler = () => cb();
  window.addEventListener(CONTROLS_FX_PRESETS_EVENT, handler);
  return () => window.removeEventListener(CONTROLS_FX_PRESETS_EVENT, handler);
}

