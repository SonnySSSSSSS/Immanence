const PRESETS_KEY = 'immanence.dev.controlsFxPresets.v2';
const LEGACY_PRESETS_KEY = 'immanence.dev.controlsFxPresets.v1';
export const CONTROLS_FX_PRESETS_EVENT = 'immanence-controls-fx-presets-updated';
const SCHEMA_VERSION = 2;

export const CONTROLS_FX_DEFAULTS = Object.freeze({
  thickness: 2,
  speed: 0.052,
  chaos: 0.095,
  offsetPx: 16,
  color: null, // null => use role-group default
  glow: 18,
  blur: 6,
  opacity: 1,
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
    glow: clampNumber(raw.glow, 0, 64, CONTROLS_FX_DEFAULTS.glow),
    blur: clampNumber(raw.blur, 0, 24, CONTROLS_FX_DEFAULTS.blur),
    opacity: clampNumber(raw.opacity, 0.1, 1, CONTROLS_FX_DEFAULTS.opacity),
  };
}

function normalizeAll(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, preset] of Object.entries(raw)) {
    if (!id || typeof id !== 'string') continue;
    out[id] = normalizePreset(preset || {});
  }
  return out;
}

function parseStorageValue(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    if (parsed.version === SCHEMA_VERSION && parsed.presets && typeof parsed.presets === 'object') {
      return normalizeAll(parsed.presets);
    }
    // Legacy v1 stored a direct map object.
    return normalizeAll(parsed);
  } catch {
    return {};
  }
}

function loadAll() {
  if (!hasDom()) return {};
  const primary = parseStorageValue(window.localStorage.getItem(PRESETS_KEY));
  if (Object.keys(primary).length > 0) return primary;

  const legacy = parseStorageValue(window.localStorage.getItem(LEGACY_PRESETS_KEY));
  if (Object.keys(legacy).length > 0) {
    saveAll(legacy);
    return legacy;
  }
  return {};
}

function saveAll(next) {
  if (!hasDom()) return;
  const normalized = normalizeAll(next);
  try {
    window.localStorage.setItem(
      PRESETS_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        presets: normalized,
      })
    );
    // Clean up legacy key once v2 is written.
    window.localStorage.removeItem(LEGACY_PRESETS_KEY);
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

export function resetAllControlsFxPresets() {
  if (!hasDom()) return;
  saveAll({});
}

export function getAllControlsFxPresets() {
  return loadAll();
}

export function exportControlsFxPresetsJson() {
  return JSON.stringify(
    {
      version: SCHEMA_VERSION,
      presets: loadAll(),
    },
    null,
    2
  );
}

export function importControlsFxPresetsJson(rawJson, { replace = true } = {}) {
  if (!hasDom()) return { ok: false, reason: 'no-dom' };
  try {
    const parsed = JSON.parse(String(rawJson || ''));
    const incoming =
      parsed && typeof parsed === 'object' && parsed.presets && typeof parsed.presets === 'object'
        ? normalizeAll(parsed.presets)
        : normalizeAll(parsed);

    if (replace) {
      saveAll(incoming);
      return { ok: true, count: Object.keys(incoming).length };
    }

    const merged = { ...loadAll(), ...incoming };
    saveAll(merged);
    return { ok: true, count: Object.keys(incoming).length };
  } catch (err) {
    return { ok: false, reason: 'invalid-json', error: err };
  }
}

export function subscribeControlsFxPresets(cb) {
  if (!hasDom() || typeof cb !== 'function') return () => {};
  const handler = () => cb();
  window.addEventListener(CONTROLS_FX_PRESETS_EVENT, handler);
  return () => window.removeEventListener(CONTROLS_FX_PRESETS_EVENT, handler);
}
