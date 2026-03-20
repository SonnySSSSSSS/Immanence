// src/lib/resetLocalData.js
// Utility to wipe all local immanenceOS data and reload.
import { clearTutorialPersistedState } from '../state/tutorialStore.js';
import { getTutorialStorageKeys } from '../tutorials/tutorialRuntime.js';

export function resetLocalData() {
  const confirmed = window.confirm(
    'Reset all local data?\n\nThis will clear:\n• Curriculum progress\n• Navigation/path data\n• Tutorial progress and overrides\n• All completion logs\n• Feedback entries\n\nThis cannot be undone. Continue?'
  );

  if (confirmed) {
    // Clear all immanenceOS localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('immanenceOS.')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    getTutorialStorageKeys().forEach((key) => localStorage.removeItem(key));
    clearTutorialPersistedState();

    // Reload the app
    window.location.reload();
  }
}
