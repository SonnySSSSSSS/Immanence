const CARD_SELECTOR = '[data-card="true"]';
const ROOT_ENABLED_CLASS = 'dev-card-tuner-enabled';
const PICK_MODE_CLASS = 'dev-card-picker-active';
const SELECTED_CLASS = 'dev-card-selected';

const GLOBAL_PRESET_KEY = 'dev.cardTuner.global.v1';
const CARD_PRESET_KEY = 'dev.cardTuner.cards.v1';

const DEFAULTS = Object.freeze({
  cardTintH: 220,
  cardTintS: 20,
  cardTintL: 12,
  cardAlpha: 0.22,
  cardBorderAlpha: 0.28,
  cardBlur: 16,
});

let selectedEl = null;
let pickMode = false;
let globalSettings = { ...DEFAULTS };
let cardPresets = {};
const subscribers = new Set();

const CSS_VAR_MAP = {
  cardTintH: '--card-tint-h',
  cardTintS: '--card-tint-s',
  cardTintL: '--card-tint-l',
  cardAlpha: '--card-alpha',
  cardBorderAlpha: '--card-border-alpha',
  cardBlur: '--card-blur',
};

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && import.meta.env.DEV;
}

function normalize(settings = {}) {
  const s = { ...DEFAULTS, ...settings };
  return {
    cardTintH: Math.max(0, Math.min(360, Number(s.cardTintH) || 0)),
    cardTintS: Math.max(0, Math.min(100, Number(s.cardTintS) || 0)),
    cardTintL: Math.max(0, Math.min(100, Number(s.cardTintL) || 0)),
    cardAlpha: Math.max(0, Math.min(1, Number(s.cardAlpha) || 0)),
    cardBorderAlpha: Math.max(0, Math.min(1, Number(s.cardBorderAlpha) || 0)),
    cardBlur: Math.max(0, Math.min(60, Number(s.cardBlur) || 0)),
  };
}

function emit() {
  const snapshot = getCardTunerState();
  subscribers.forEach((cb) => cb(snapshot));
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

function removeJson(key) {
  if (!hasDom()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function applyToStyle(style, settings) {
  style.setProperty(CSS_VAR_MAP.cardTintH, `${settings.cardTintH}`);
  style.setProperty(CSS_VAR_MAP.cardTintS, `${settings.cardTintS}%`);
  style.setProperty(CSS_VAR_MAP.cardTintL, `${settings.cardTintL}%`);
  style.setProperty(CSS_VAR_MAP.cardAlpha, `${settings.cardAlpha}`);
  style.setProperty(CSS_VAR_MAP.cardBorderAlpha, `${settings.cardBorderAlpha}`);
  style.setProperty(CSS_VAR_MAP.cardBlur, `${settings.cardBlur}px`);
}

function clearFromStyle(style) {
  Object.values(CSS_VAR_MAP).forEach((k) => style.removeProperty(k));
}

function applyCardPresets() {
  if (!hasDom()) return;
  Object.entries(cardPresets).forEach(([cardId, settings]) => {
    document.querySelectorAll(`${CARD_SELECTOR}[data-card-id="${cardId}"]`).forEach((el) => {
      applyToStyle(el.style, normalize(settings));
    });
  });
}

function onPickClick(event) {
  if (!pickMode) return;
  const target = event.target instanceof Element ? event.target.closest(CARD_SELECTOR) : null;
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  selectCard(target);
}

export function initCardTuner() {
  if (!hasDom()) return getCardTunerState();
  globalSettings = normalize(loadJson(GLOBAL_PRESET_KEY, DEFAULTS));
  cardPresets = loadJson(CARD_PRESET_KEY, {}) || {};
  document.documentElement.classList.add(ROOT_ENABLED_CLASS);
  applyToStyle(document.documentElement.style, globalSettings);
  applyCardPresets();
  emit();
  return getCardTunerState();
}

export function subscribeCardTuner(cb) {
  subscribers.add(cb);
  cb(getCardTunerState());
  return () => subscribers.delete(cb);
}

export function setPickMode(enabled) {
  if (!hasDom()) return;
  pickMode = Boolean(enabled);
  document.documentElement.classList.toggle(PICK_MODE_CLASS, pickMode);
  document.removeEventListener('click', onPickClick, true);
  if (pickMode) document.addEventListener('click', onPickClick, true);
  emit();
}

export function selectCard(el) {
  if (!hasDom()) return;
  if (selectedEl) selectedEl.classList.remove(SELECTED_CLASS);
  selectedEl = el?.closest?.(CARD_SELECTOR) || null;
  if (selectedEl) {
    selectedEl.classList.add(SELECTED_CLASS);
    if (!selectedEl.classList.contains('im-card')) {
      console.info('[cardTuner] Card not using tunable vars');
    }
  }
  emit();
}

export function applyGlobal(settings) {
  if (!hasDom()) return;
  globalSettings = normalize(settings);
  applyToStyle(document.documentElement.style, globalSettings);
  emit();
}

export function applySelected(settings) {
  if (!hasDom() || !selectedEl) return;
  applyToStyle(selectedEl.style, normalize(settings));
  emit();
}

export function saveGlobal(settings) {
  globalSettings = normalize(settings || globalSettings);
  saveJson(GLOBAL_PRESET_KEY, globalSettings);
  applyGlobal(globalSettings);
}

export function saveSelected(settings) {
  if (!selectedEl) return;
  const id = selectedEl.dataset.cardId;
  if (!id) return;
  cardPresets[id] = normalize(settings);
  saveJson(CARD_PRESET_KEY, cardPresets);
  applySelected(settings);
}

export function resetGlobal() {
  globalSettings = { ...DEFAULTS };
  removeJson(GLOBAL_PRESET_KEY);
  applyGlobal(globalSettings);
}

export function resetSelected() {
  if (!selectedEl) return;
  const id = selectedEl.dataset.cardId;
  clearFromStyle(selectedEl.style);
  if (id && cardPresets[id]) {
    delete cardPresets[id];
    saveJson(CARD_PRESET_KEY, cardPresets);
  }
  emit();
}

export function clearAll() {
  if (!hasDom()) return;
  removeJson(GLOBAL_PRESET_KEY);
  removeJson(CARD_PRESET_KEY);
  cardPresets = {};
  globalSettings = { ...DEFAULTS };
  applyGlobal(globalSettings);
  document.querySelectorAll(CARD_SELECTOR).forEach((el) => clearFromStyle(el.style));
  emit();
}

export function getCardTunerState() {
  return {
    pickMode,
    selectedCardId: selectedEl?.dataset?.cardId || null,
    selectedLabel: selectedEl?.dataset?.cardId || selectedEl?.tagName?.toLowerCase() || null,
    hasSelected: Boolean(selectedEl),
    globalSettings: { ...globalSettings },
    selectedSettings: selectedEl ? readSettings(selectedEl) : null,
  };
}

function readSettings(el) {
  const computed = getComputedStyle(el);
  const n = (prop, fallback) => {
    const v = Number.parseFloat(computed.getPropertyValue(prop).trim());
    return Number.isFinite(v) ? v : fallback;
  };
  return normalize({
    cardTintH: n(CSS_VAR_MAP.cardTintH, DEFAULTS.cardTintH),
    cardTintS: n(CSS_VAR_MAP.cardTintS, DEFAULTS.cardTintS),
    cardTintL: n(CSS_VAR_MAP.cardTintL, DEFAULTS.cardTintL),
    cardAlpha: n(CSS_VAR_MAP.cardAlpha, DEFAULTS.cardAlpha),
    cardBorderAlpha: n(CSS_VAR_MAP.cardBorderAlpha, DEFAULTS.cardBorderAlpha),
    cardBlur: n(CSS_VAR_MAP.cardBlur, DEFAULTS.cardBlur),
  });
}

export const CARD_TUNER_DEFAULTS = DEFAULTS;
