const PRESETS_V1_KEY = 'immanence.dev.plateFxPresets.v1';
const PRESETS_V2_KEY = 'immanence.dev.plateFxPresets.v2';
const SCHEMA_VERSION = 2;

export const PLATES_FX_PRESETS_EVENT = 'immanence-plate-fx-presets-updated';

export const PLATE_FX_OVERRIDE_FIELDS = Object.freeze([
  'borderW',
  'speed',
  'opacity',
  'glow',
  'glowOpacity',
  'bgOpacity',
  'sheen',
  'animate',
]);

export const SUBTLE_DEFAULTS = Object.freeze({
  borderW: 1.25,
  speed: 14,
  opacity: 0.65,
  glow: 6,
  glowOpacity: 0.18,
  bgOpacity: 0.18,
  sheen: false,
  animate: true,
});

export const MYTHIC_DEFAULTS = Object.freeze({
  borderW: 2.25,
  speed: 8,
  opacity: 0.85,
  glow: 14,
  glowOpacity: 0.32,
  bgOpacity: 0.24,
  sheen: true,
  animate: true,
});

export const PLATES_FX_DEFAULTS = Object.freeze({
  enabled: false,
  profile: 'subtle',
  borderW: null,
  speed: null,
  opacity: null,
  glow: null,
  glowOpacity: null,
  bgOpacity: null,
  sheen: null,
  animate: null,
  colorMode: 'stage',
  color: null,
});

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function clampNumber(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function normalizeProfile(raw) {
  return raw === 'mythic' ? 'mythic' : 'subtle';
}

function normalizeNullableNumber(raw, min, max) {
  if (raw === null || raw === undefined || raw === '') return null;
  const v = Number(raw);
  if (!Number.isFinite(v)) return null;
  return clampNumber(v, min, max, min);
}

function normalizeNullableBoolean(raw) {
  if (raw === null || raw === undefined) return null;
  return Boolean(raw);
}

function normalizeColorMode(raw) {
  return raw === 'custom' ? 'custom' : 'stage';
}

function normalizeColor(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

function normalizePresetV2(raw = {}) {
  return {
    enabled: Boolean(raw.enabled),
    profile: normalizeProfile(raw.profile),
    borderW: normalizeNullableNumber(raw.borderW, 0.5, 6),
    speed: normalizeNullableNumber(raw.speed, 4, 24),
    opacity: normalizeNullableNumber(raw.opacity, 0, 1),
    glow: normalizeNullableNumber(raw.glow, 0, 24),
    glowOpacity: normalizeNullableNumber(raw.glowOpacity, 0, 0.32),
    bgOpacity: normalizeNullableNumber(raw.bgOpacity, 0, 0.45),
    sheen: normalizeNullableBoolean(raw.sheen),
    animate: normalizeNullableBoolean(raw.animate),
    colorMode: normalizeColorMode(raw.colorMode),
    color: normalizeColor(raw.color),
  };
}

function normalizeAllV2(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, preset] of Object.entries(raw)) {
    if (!id || typeof id !== 'string') continue;
    out[id] = normalizePresetV2(preset || {});
  }
  return out;
}

function parseStorageMap(raw, expectedVersion = null) {
  if (!raw) return { kind: 'missing', data: {} };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { kind: 'ok', data: {} };
    if (
      typeof expectedVersion === 'number' &&
      parsed.version === expectedVersion &&
      parsed.presets &&
      typeof parsed.presets === 'object'
    ) {
      return { kind: 'ok', data: parsed.presets };
    }
    if (parsed.presets && typeof parsed.presets === 'object') {
      return { kind: 'ok', data: parsed.presets };
    }
    return { kind: 'ok', data: parsed };
  } catch {
    return { kind: 'malformed', data: {} };
  }
}

function toV2FromV1Preset(v1 = {}) {
  return normalizePresetV2({
    enabled: Boolean(v1.enabled),
    profile: 'subtle',
    borderW: v1.borderW,
    speed: v1.speed,
    opacity: v1.opacity,
    glow: null,
    glowOpacity: null,
    bgOpacity: null,
    sheen: null,
    colorMode: normalizeColorMode(v1.colorMode),
    color: normalizeColor(v1.color),
  });
}

function migrateV1ToV2(v1Map) {
  const out = {};
  if (!v1Map || typeof v1Map !== 'object') return out;
  for (const [id, preset] of Object.entries(v1Map)) {
    if (!id || typeof id !== 'string') continue;
    out[id] = toV2FromV1Preset(preset || {});
  }
  return out;
}

function writeV2(next, { emitEvent = true } = {}) {
  if (!hasDom()) return;
  const normalized = normalizeAllV2(next);
  try {
    window.localStorage.setItem(
      PRESETS_V2_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        presets: normalized,
      })
    );
  } catch {
    // ignore
  }
  if (!emitEvent) return;
  try {
    window.dispatchEvent(new CustomEvent(PLATES_FX_PRESETS_EVENT));
  } catch {
    // ignore
  }
}

function loadAll() {
  if (!hasDom()) return {};

  const rawV2 = window.localStorage.getItem(PRESETS_V2_KEY);
  const parsedV2 = parseStorageMap(rawV2, SCHEMA_VERSION);
  if (parsedV2.kind === 'ok') return normalizeAllV2(parsedV2.data);
  if (parsedV2.kind === 'malformed') {
    writeV2({}, { emitEvent: false });
    return {};
  }

  const rawV1 = window.localStorage.getItem(PRESETS_V1_KEY);
  const parsedV1 = parseStorageMap(rawV1, 1);
  if (parsedV1.kind === 'malformed') {
    writeV2({}, { emitEvent: false });
    return {};
  }

  const migrated = migrateV1ToV2(parsedV1.data);
  writeV2(migrated, { emitEvent: false });
  return migrated;
}

function profileDefaults(profile) {
  return profile === 'mythic' ? MYTHIC_DEFAULTS : SUBTLE_DEFAULTS;
}

export function resolvePlatesFxPreset(rawPreset = {}) {
  const preset = normalizePresetV2(rawPreset);
  const base = profileDefaults(preset.profile);
  const effective = {
    borderW: preset.borderW ?? base.borderW,
    speed: preset.speed ?? base.speed,
    opacity: preset.opacity ?? base.opacity,
    glow: preset.glow ?? base.glow,
    glowOpacity: preset.glowOpacity ?? base.glowOpacity,
    bgOpacity: preset.bgOpacity ?? base.bgOpacity,
    sheen: preset.sheen ?? base.sheen,
    animate: preset.animate ?? base.animate,
  };
  return { ...preset, effective };
}

export function buildPlateFxOverrideResetPatch() {
  return {
    borderW: null,
    speed: null,
    opacity: null,
    glow: null,
    glowOpacity: null,
    bgOpacity: null,
    sheen: null,
    animate: null,
  };
}

export function getPlatesFxPreset(plateId) {
  if (!plateId || typeof plateId !== 'string') return { ...PLATES_FX_DEFAULTS };
  const all = loadAll();
  const raw = all?.[plateId] || null;
  return normalizePresetV2({ ...PLATES_FX_DEFAULTS, ...(raw || {}) });
}

export function getResolvedPlatesFxPreset(plateId) {
  return resolvePlatesFxPreset(getPlatesFxPreset(plateId));
}

export function setPlatesFxPreset(plateId, patch) {
  if (!hasDom()) return;
  if (!plateId || typeof plateId !== 'string') return;
  const all = loadAll();
  const prev = all?.[plateId] || {};
  const nextPreset = normalizePresetV2({ ...prev, ...(patch || {}) });
  const nextAll = { ...all, [plateId]: nextPreset };
  writeV2(nextAll);
}

export function resetPlatesFxPreset(plateId) {
  if (!hasDom()) return;
  if (!plateId || typeof plateId !== 'string') return;
  const all = loadAll();
  if (!all || typeof all !== 'object' || !(plateId in all)) return;
  const nextAll = { ...all };
  delete nextAll[plateId];
  writeV2(nextAll);
}

export function resetPlatesFxOverrides(plateId) {
  if (!hasDom()) return;
  if (!plateId || typeof plateId !== 'string') return;
  const all = loadAll();
  const prev = all?.[plateId] || {};
  const nextPreset = normalizePresetV2({
    ...prev,
    ...buildPlateFxOverrideResetPatch(),
  });
  const nextAll = { ...all, [plateId]: nextPreset };
  writeV2(nextAll);
}

export function getAllPlatesFxPresets() {
  return loadAll();
}

export function subscribePlatesFxPresets(cb) {
  if (!hasDom() || typeof cb !== 'function') return () => {};
  const handler = () => cb();
  window.addEventListener(PLATES_FX_PRESETS_EVENT, handler);
  return () => window.removeEventListener(PLATES_FX_PRESETS_EVENT, handler);
}
