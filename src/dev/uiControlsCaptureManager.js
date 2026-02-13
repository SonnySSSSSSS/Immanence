import { validateUiTargetRoot } from './uiTargetContract.js';

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

let pickingActive = false;
const ROOT_PICKING_CLASS = 'dev-ui-controls-picking-active';
const ROOT_ATTACHED_CLASS = 'dev-ui-controls-capture-attached';
const DEVPANEL_ROOT_SELECTOR = '[data-devpanel-root="true"]';
const TARGET_ATTR = 'data-ui-target';
const ID_ATTR = 'data-ui-id';
const PLATE_TOKEN = ':plate:';

export function isUiPickingActive() {
  return pickingActive;
}

let attached = false;
let onResolvedPick = null;
let pickingKind = 'controls';

let suppressToken = null;

function normalizePickingKind(kind) {
  return kind === 'plates' ? 'plates' : 'controls';
}

function modeState() {
  return {
    attached,
    armed: typeof onResolvedPick === 'function',
    pickingActive,
    kind: pickingKind,
  };
}

function isPickerDebugEnabled() {
  if (!hasDom()) return false;
  return Boolean(window.__IMMANENCE_PICKER_DEBUG);
}

function dbg(message, extra = {}) {
  if (!isPickerDebugEnabled()) return;
  try {
    console.log(`[uiControlsCapture] ${message}`, extra);
  } catch {
    // ignore
  }
}

function dbgReturn(reason, extra = {}) {
  dbg(`RETURN ${reason}`, { ...modeState(), ...extra });
}

function isPrimaryPointerDown(e) {
  // PointerEvent.button is 0 for primary (left click / primary touch)
  if (typeof e?.button === 'number') return e.button === 0;
  // Fallback: buttons bitmask includes primary bit
  if (typeof e?.buttons === 'number') return (e.buttons & 1) === 1;
  return true;
}

function pointerThresholdPx(pointerType) {
  const t = String(pointerType || '').toLowerCase();
  if (t === 'touch' || t === 'pen') return 32;
  return 12; // mouse + unknown
}

function distSq(ax, ay, bx, by) {
  const dx = (ax || 0) - (bx || 0);
  const dy = (ay || 0) - (by || 0);
  return dx * dx + dy * dy;
}

function composedPathElements(event) {
  const path = typeof event?.composedPath === 'function' ? event.composedPath() : null;
  if (!Array.isArray(path)) return [];
  return path.filter((n) => n instanceof Element);
}

function eventTargetElement(event) {
  const t = event?.target;
  if (t instanceof Element) return t;
  const path = typeof event?.composedPath === 'function' ? event.composedPath() : null;
  if (!Array.isArray(path)) return null;
  for (const n of path) {
    if (n instanceof Element) return n;
  }
  return null;
}

function getUiId(el) {
  if (!(el instanceof Element)) return null;
  const id = el.getAttribute(ID_ATTR);
  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : null;
}

function hasUiTargetId(el) {
  if (!(el instanceof Element)) return false;
  if (el.getAttribute(TARGET_ATTR) !== 'true') return false;
  return Boolean(getUiId(el));
}

function resolveCandidateRoot(event) {
  const path = composedPathElements(event);
  for (const n of path) {
    if (hasUiTargetId(n)) return n;
  }

  let cur = eventTargetElement(event);
  while (cur) {
    if (hasUiTargetId(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function eventInsideDevPanel(event) {
  const target = eventTargetElement(event);
  const viaClosest = Boolean(target?.closest?.(DEVPANEL_ROOT_SELECTOR));
  const viaPath = composedPathElements(event).some((el) => el.matches?.(DEVPANEL_ROOT_SELECTOR));
  return {
    inside: viaClosest || viaPath,
    viaClosest,
    viaPath,
  };
}

function filterMatchesCurrentKind(rootId) {
  if (pickingKind === 'plates') return rootId.includes(PLATE_TOKEN);
  if (pickingKind === 'controls') return !rootId.includes(PLATE_TOKEN);
  return true;
}

function resolveValidationForEvent(event, phase) {
  if (!attached) {
    dbgReturn('NOT_ATTACHED', { phase });
    return null;
  }
  if (!pickingActive) {
    dbgReturn('NOT_PICKING_ACTIVE', { phase });
    return null;
  }
  if (!onResolvedPick) {
    dbgReturn('NOT_ARMED', { phase });
    return null;
  }

  const panelState = eventInsideDevPanel(event);
  if (panelState.inside) {
    dbgReturn('TARGET_IN_DEVPANEL', {
      phase,
      devpanelClosest: panelState.viaClosest,
      devpanelInComposedPath: panelState.viaPath,
    });
    return null;
  }

  const root = resolveCandidateRoot(event);
  if (!root) {
    dbgReturn('NO_ROOT_FOUND', { phase });
    return null;
  }

  const rootId = getUiId(root);
  if (!rootId) {
    dbgReturn('NO_ROOT_FOUND', { phase, candidateTag: String(root.tagName || '').toLowerCase() });
    return null;
  }

  if (!filterMatchesCurrentKind(rootId)) {
    dbgReturn('FILTER_REJECTED', { phase, kind: pickingKind, candidateRootId: rootId });
    return null;
  }

  const validation = validateUiTargetRoot(root);
  if (!validation.ok) {
    dbgReturn('VALIDATION_FAILED', { phase, candidateRootId: rootId, reasons: validation.reasons });
    return null;
  }

  return validation;
}

function invokeResolvedPick({ validation, event, phase }) {
  dbg('RESOLVED', {
    phase,
    rootId: validation?.rootId || null,
    ok: Boolean(validation?.ok),
    modeState: modeState(),
  });

  if (typeof onResolvedPick !== 'function') {
    dbgReturn('CALLBACK_MISSING', { phase, rootId: validation?.rootId || null });
    return;
  }

  dbg('CALLBACK', { phase, rootId: validation?.rootId || null });
  try {
    onResolvedPick({ validation, event });
  } catch {
    // ignore
  }
}

function clearSuppressToken() {
  suppressToken = null;
}

function shouldSuppressClick(event) {
  if (!suppressToken) return false;
  const target = event?.target instanceof Element ? event.target : null;
  if (!target) return false;
  if (!(suppressToken.rootEl instanceof Element)) return false;
  if (!suppressToken.rootEl.contains(target)) return false;

  const clickTs = typeof event.timeStamp === 'number' ? event.timeStamp : 0;
  if (clickTs > suppressToken.expiresTs) return false;

  const threshold = pointerThresholdPx(suppressToken.pointerType);
  const maxSq = threshold * threshold;
  const cx = typeof event.clientX === 'number' ? event.clientX : 0;
  const cy = typeof event.clientY === 'number' ? event.clientY : 0;
  return distSq(cx, cy, suppressToken.downX, suppressToken.downY) <= maxSq;
}

function suppressEvent(event) {
  try {
    event.preventDefault?.();
    event.stopPropagation?.();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  } catch {
    // ignore
  }
}

function onPointerDownCapture(event) {
  dbg('EVENT pointerdown', {
    target: event.target && (event.target.getAttribute?.('data-ui-id') || event.target.tagName),
    hasComposedPath: typeof event.composedPath === 'function',
    ...modeState(),
  });
  if (!hasDom()) return;
  if (!isPrimaryPointerDown(event)) {
    dbgReturn('NOT_PRIMARY_POINTER', { phase: 'pointerdown', button: event?.button, buttons: event?.buttons });
    return;
  }

  const validation = resolveValidationForEvent(event, 'pointerdown');
  if (!validation) return;

  suppressEvent(event);

  const root = resolveCandidateRoot(event);
  suppressToken = {
    rootEl: root,
    downTs: typeof event.timeStamp === 'number' ? event.timeStamp : 0,
    expiresTs: (typeof event.timeStamp === 'number' ? event.timeStamp : 0) + 800,
    downX: typeof event.clientX === 'number' ? event.clientX : 0,
    downY: typeof event.clientY === 'number' ? event.clientY : 0,
    pointerType: event.pointerType || 'mouse',
  };
  invokeResolvedPick({ validation, event, phase: 'pointerdown' });
}

function onClickCapture(event) {
  dbg('EVENT click', {
    target: event.target && (event.target.getAttribute?.('data-ui-id') || event.target.tagName),
    hasComposedPath: typeof event.composedPath === 'function',
    ...modeState(),
  });
  if (!hasDom()) return;

  if (suppressToken) {
    if (shouldSuppressClick(event)) {
      suppressEvent(event);
      clearSuppressToken();
      dbgReturn('SUPPRESSED_BY_POINTERDOWN', { phase: 'click' });
      return;
    }
    clearSuppressToken();
    dbgReturn('SUPPRESS_TOKEN', { phase: 'click' });
    return;
  }

  const validation = resolveValidationForEvent(event, 'click');
  if (!validation) return;

  suppressEvent(event);
  clearSuppressToken();
  invokeResolvedPick({ validation, event, phase: 'click' });
}

function onPointerCancelCapture() {
  if (!suppressToken) return;
  clearSuppressToken();
}

export function startControlsPicking({ onPick, kind = 'controls' } = {}) {
  if (!hasDom()) return;
  pickingActive = true;
  pickingKind = normalizePickingKind(kind);
  console.log('[uiControlsCapture] start picking', { kind: pickingKind });
  try {
    document.documentElement.classList.add(ROOT_PICKING_CLASS);
  } catch {
    // ignore
  }
  onResolvedPick = typeof onPick === 'function' ? onPick : null;
}

export function stopControlsPicking() {
  pickingActive = false;
  pickingKind = 'controls';
  console.log('[uiControlsCapture] stop picking');
  try {
    document.documentElement.classList.remove(ROOT_PICKING_CLASS);
  } catch {
    // ignore
  }
  onResolvedPick = null;
  clearSuppressToken();
}

export function attach() {
  if (!hasDom() || attached) return;
  attached = true;
  console.log('[uiControlsCapture] attach');
  try {
    document.documentElement.classList.add(ROOT_ATTACHED_CLASS);
  } catch {
    // ignore
  }
  window.addEventListener('pointerdown', onPointerDownCapture, true);
  window.addEventListener('click', onClickCapture, true);
  window.addEventListener('pointercancel', onPointerCancelCapture, true);
}

export function detach() {
  if (!hasDom() || !attached) return;
  attached = false;
  console.log('[uiControlsCapture] detach');
  try {
    document.documentElement.classList.remove(ROOT_ATTACHED_CLASS);
  } catch {
    // ignore
  }
  window.removeEventListener('pointerdown', onPointerDownCapture, true);
  window.removeEventListener('click', onClickCapture, true);
  window.removeEventListener('pointercancel', onPointerCancelCapture, true);
  clearSuppressToken();
}

export function __setUiControlsCaptureDebug(enabled) {
  if (!hasDom()) return;
  try {
    window.__IMMANENCE_PICKER_DEBUG = Boolean(enabled);
  } catch {
    // ignore
  }
}
