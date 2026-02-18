export function emitPickerSelection(storageKey, eventName, payload) {
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
}

export function readPickerSelection(storageKey) {
  const raw = window.localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : null;
}

export function subscribeToPicker(eventName, handler) {
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}
