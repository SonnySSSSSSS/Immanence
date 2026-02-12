const ROOT_ENABLED_CLASS = 'dev-nav-btn-tuner-enabled';

const STORAGE_KEY = 'dev.navButtonTuner.global.v1';

export const NAV_BUTTON_TUNER_DEFAULTS = Object.freeze({
  enabled: false,
  navBtnBg: '255, 255, 255',
  navBtnBgAlpha: 0.08,
  navBtnBorder: 'var(--accent-30)',
  navBtnBorderWidth: 1,
  navBtnGlow: 25,
  navBtnTextColor: 'var(--accent-color)',
  navBtnTextGlow: 10,
  navBtnBackdropBlur: 8,
  navBtnOpacity: 1,
  navBtnHoverIntensity: 0.25,
});

let settings = { ...NAV_BUTTON_TUNER_DEFAULTS };
const subscribers = new Set();

const CSS_VAR_MAP = {
  navBtnBg: '--nav-btn-bg',
  navBtnBgAlpha: '--nav-btn-bg-alpha',
  navBtnBorder: '--nav-btn-border',
  navBtnBorderWidth: '--nav-btn-border-width',
  navBtnGlow: '--nav-btn-glow',
  navBtnTextColor: '--nav-btn-text-color',
  navBtnTextGlow: '--nav-btn-text-glow',
  navBtnBackdropBlur: '--nav-btn-backdrop-blur',
  navBtnOpacity: '--nav-btn-opacity',
  navBtnHoverIntensity: '--nav-btn-hover-intensity',
};

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && import.meta.env.DEV;
}

function clamp(min, v, max) {
  return Math.max(min, Math.min(max, v));
}

function normalize(next = {}) {
  const s = { ...NAV_BUTTON_TUNER_DEFAULTS, ...next };
  return {
    enabled: Boolean(s.enabled),
    navBtnBg: typeof s.navBtnBg === 'string' && s.navBtnBg.trim() ? s.navBtnBg.trim() : NAV_BUTTON_TUNER_DEFAULTS.navBtnBg,
    navBtnBgAlpha: clamp(0, Number(s.navBtnBgAlpha) || 0, 1),
    navBtnBorder: typeof s.navBtnBorder === 'string' && s.navBtnBorder.trim() ? s.navBtnBorder.trim() : NAV_BUTTON_TUNER_DEFAULTS.navBtnBorder,
    navBtnBorderWidth: clamp(0, Number(s.navBtnBorderWidth) || 0, 6),
    navBtnGlow: clamp(0, Number(s.navBtnGlow) || 0, 80),
    navBtnTextColor: typeof s.navBtnTextColor === 'string' && s.navBtnTextColor.trim() ? s.navBtnTextColor.trim() : NAV_BUTTON_TUNER_DEFAULTS.navBtnTextColor,
    navBtnTextGlow: clamp(0, Number(s.navBtnTextGlow) || 0, 60),
    navBtnBackdropBlur: clamp(0, Number(s.navBtnBackdropBlur) || 0, 40),
    navBtnOpacity: clamp(0, Number(s.navBtnOpacity) || 0, 1),
    navBtnHoverIntensity: clamp(0, Number(s.navBtnHoverIntensity) || 0, 2),
  };
}

function loadJson(key, fallback) {
  if (!hasDom()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  if (!hasDom()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function applyToStyle(style, s) {
  style.setProperty(CSS_VAR_MAP.navBtnBg, `${s.navBtnBg}`);
  style.setProperty(CSS_VAR_MAP.navBtnBgAlpha, `${s.navBtnBgAlpha}`);
  style.setProperty(CSS_VAR_MAP.navBtnBorder, `${s.navBtnBorder}`);
  style.setProperty(CSS_VAR_MAP.navBtnBorderWidth, `${s.navBtnBorderWidth}px`);
  style.setProperty(CSS_VAR_MAP.navBtnGlow, `${s.navBtnGlow}px`);
  style.setProperty(CSS_VAR_MAP.navBtnTextColor, `${s.navBtnTextColor}`);
  style.setProperty(CSS_VAR_MAP.navBtnTextGlow, `${s.navBtnTextGlow}px`);
  style.setProperty(CSS_VAR_MAP.navBtnBackdropBlur, `${s.navBtnBackdropBlur}px`);
  style.setProperty(CSS_VAR_MAP.navBtnOpacity, `${s.navBtnOpacity}`);
  style.setProperty(CSS_VAR_MAP.navBtnHoverIntensity, `${s.navBtnHoverIntensity}`);
}

function clearFromStyle(style) {
  Object.values(CSS_VAR_MAP).forEach((k) => style.removeProperty(k));
}

function emit() {
  const snapshot = getNavButtonTunerState();
  subscribers.forEach((cb) => cb(snapshot));
}

export function getNavButtonTunerState() {
  return {
    enabled: Boolean(settings.enabled),
    settings: { ...settings },
  };
}

export function initNavButtonTuner() {
  if (!hasDom()) return getNavButtonTunerState();
  settings = normalize(loadJson(STORAGE_KEY, NAV_BUTTON_TUNER_DEFAULTS));
  document.body.classList.toggle(ROOT_ENABLED_CLASS, settings.enabled);
  if (settings.enabled) applyToStyle(document.documentElement.style, settings);
  else clearFromStyle(document.documentElement.style);
  emit();
  return getNavButtonTunerState();
}

export function subscribeNavButtonTuner(cb) {
  subscribers.add(cb);
  cb(getNavButtonTunerState());
  return () => subscribers.delete(cb);
}

export function setNavButtonTunerEnabled(enabled) {
  if (!hasDom()) return;
  settings = normalize({ ...settings, enabled: Boolean(enabled) });
  document.body.classList.toggle(ROOT_ENABLED_CLASS, settings.enabled);
  if (settings.enabled) applyToStyle(document.documentElement.style, settings);
  else clearFromStyle(document.documentElement.style);
  saveJson(STORAGE_KEY, settings);
  emit();
}

export function applyNavButtonSettings(nextSettings) {
  if (!hasDom()) return;
  settings = normalize({ ...settings, ...nextSettings, enabled: settings.enabled });
  if (settings.enabled) applyToStyle(document.documentElement.style, settings);
  saveJson(STORAGE_KEY, settings);
  emit();
}

export function resetNavButtonSettings() {
  if (!hasDom()) return;
  const enabled = Boolean(settings.enabled);
  settings = normalize({ ...NAV_BUTTON_TUNER_DEFAULTS, enabled });
  if (settings.enabled) applyToStyle(document.documentElement.style, settings);
  saveJson(STORAGE_KEY, settings);
  emit();
}

export function setNavBtnVar(name, value) {
  if (!hasDom()) return;
  if (typeof name !== 'string' || !name.trim()) return;
  document.documentElement.style.setProperty(name.trim(), String(value ?? ''));
}

export function resetNavBtnDefaults() {
  resetNavButtonSettings();
}

