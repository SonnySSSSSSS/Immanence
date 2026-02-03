// src/hooks/useEffectiveSettings.js
// Helper hooks that merge persisted settings with session-scoped overrides.
// Used to prevent path/curriculum launches from polluting global defaults.

import { useMemo } from 'react';
import { useSettingsStore } from '../state/settingsStore';
import { useSessionOverrideStore } from '../state/sessionOverrideStore';

export function useEffectivePhotic() {
  const base = useSettingsStore((s) => s.photic);
  const override = useSessionOverrideStore((s) => s.overrides?.settings?.photic || null);

  return useMemo(() => {
    if (!override) return base;
    return { ...base, ...override };
  }, [base, override]);
}

export function useEffectiveBreathSoundEnabled() {
  const base = useSettingsStore((s) => s.breathSoundEnabled);
  const override = useSessionOverrideStore((s) => s.overrides?.settings?.breathSoundEnabled);
  return typeof override === 'boolean' ? override : base;
}

export function useLocked(path) {
  return useSessionOverrideStore((s) => s.isLocked(path));
}

