export const DEV_PANEL_LATCH_KEY = 'immanence-devpanel-enabled';

function readDevPanelParam() {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('devpanel');
  } catch {
    return null;
  }
}

function setLatch(enabled) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(DEV_PANEL_LATCH_KEY, '1');
    } else {
      localStorage.removeItem(DEV_PANEL_LATCH_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

function readLatch() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEV_PANEL_LATCH_KEY) === '1';
  } catch {
    return false;
  }
}

export function getDevPanelProdGate() {
  if (import.meta.env.DEV) return true;

  const param = readDevPanelParam();
  if (param === '1') setLatch(true);
  if (param === '0') setLatch(false);

  return readLatch();
}
