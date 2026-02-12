import { isDevtoolsEnabled } from './uiDevtoolsGate.js';
import { findUiTargetRootFromEventTarget, validateUiTargetRoot } from './uiTargetContract.js';

function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

let pickingActive = false;
const ROOT_PICKING_CLASS = 'dev-ui-controls-picking-active';
const ROOT_ATTACHED_CLASS = 'dev-ui-controls-capture-attached';

export function isUiPickingActive() {
  return pickingActive;
}

let attached = false;
let onResolvedPick = null;

let suppressToken = null;

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

function composedPathContainsDevPanel(event) {
  const path = typeof event?.composedPath === 'function' ? event.composedPath() : null;
  if (!Array.isArray(path)) return false;
  for (const n of path) {
    if (!(n instanceof Element)) continue;
    if (n.getAttribute?.('data-devpanel-root') === 'true') return true;
  }
  return false;
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

function eventTargetRoot(event) {
  const path = typeof event?.composedPath === 'function' ? event.composedPath() : null;
  if (Array.isArray(path)) {
    for (const n of path) {
      if (!(n instanceof Element)) continue;
      if (n.getAttribute?.('data-ui-target') === 'true') return n;
      const c = findUiTargetRootFromEventTarget(n);
      if (c) return c;
    }
  }
  return findUiTargetRootFromEventTarget(eventTargetElement(event));
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
  if (!attached || !pickingActive) return;
  if (!hasDom()) return;
  if (!isPrimaryPointerDown(event)) return;
  if (composedPathContainsDevPanel(event)) return;

  const root = eventTargetRoot(event);
  if (!root) return;

  const validation = validateUiTargetRoot(root);
  if (!validation.ok) {
    // Do not suppress underlying action for invalid targets; user needs to keep using the UI.
    return;
  }

  suppressEvent(event);

  suppressToken = {
    rootEl: root,
    downTs: typeof event.timeStamp === 'number' ? event.timeStamp : 0,
    expiresTs: (typeof event.timeStamp === 'number' ? event.timeStamp : 0) + 800,
    downX: typeof event.clientX === 'number' ? event.clientX : 0,
    downY: typeof event.clientY === 'number' ? event.clientY : 0,
    pointerType: event.pointerType || 'mouse',
  };

  try {
    onResolvedPick?.(validation);
  } catch {
    // ignore
  }
}

function onClickCapture(event) {
  if (!attached || !pickingActive) return;
  if (!hasDom()) return;
  if (composedPathContainsDevPanel(event)) return;

  if (shouldSuppressClick(event)) {
    suppressEvent(event);
    clearSuppressToken();
    return;
  }

  // Backstop: if a UI only fires a click (no pointerdown), still allow deterministic picking.
  const root = eventTargetRoot(event);
  if (!root) return;
  const validation = validateUiTargetRoot(root);
  if (!validation.ok) return;
  suppressEvent(event);
  clearSuppressToken();
  try {
    onResolvedPick?.(validation);
  } catch {
    // ignore
  }
}

function onPointerUpOrCancelCapture() {
  clearSuppressToken();
}

export function startControlsPicking({ onPick } = {}) {
  if (!hasDom()) return;
  pickingActive = true;
  try {
    document.documentElement.classList.add(ROOT_PICKING_CLASS);
  } catch {
    // ignore
  }
  onResolvedPick = typeof onPick === 'function' ? onPick : null;
  attach();
}

export function stopControlsPicking() {
  pickingActive = false;
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
  try {
    document.documentElement.classList.add(ROOT_ATTACHED_CLASS);
  } catch {
    // ignore
  }
  window.addEventListener('pointerdown', onPointerDownCapture, true);
  window.addEventListener('click', onClickCapture, true);
  window.addEventListener('pointerup', onPointerUpOrCancelCapture, true);
  window.addEventListener('pointercancel', onPointerUpOrCancelCapture, true);
}

export function detach() {
  if (!hasDom() || !attached) return;
  attached = false;
  try {
    document.documentElement.classList.remove(ROOT_ATTACHED_CLASS);
  } catch {
    // ignore
  }
  window.removeEventListener('pointerdown', onPointerDownCapture, true);
  window.removeEventListener('click', onClickCapture, true);
  window.removeEventListener('pointerup', onPointerUpOrCancelCapture, true);
  window.removeEventListener('pointercancel', onPointerUpOrCancelCapture, true);
  clearSuppressToken();
}
