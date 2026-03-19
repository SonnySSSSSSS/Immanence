export const ANCHORS = {
  GLOBAL_TUTORIAL_BUTTON: 'global-tutorial-button',

  HOME_DAILY_CARD: 'home-daily-card',
  HOME_CURRICULUM_CARD: 'home-curriculum-card',
  HOME_SESSIONS_PANEL: 'home-sessions-panel',
  HOME_AVATAR_RING: 'home-avatar-ring',
  HOME_STAGE_PANEL: 'home-stage-panel',

  PRACTICE_SELECTOR: 'practice-selector',
  PRACTICE_TUTORIAL_BUTTON: 'tutorial-button',
  PRACTICE_TEMPO_SYNC_PANEL: 'tempo-sync-panel',
  PRACTICE_CIRCUIT_DURATION: 'circuit-duration',
  PRACTICE_RITUAL_STEPS: 'ritual-steps',
  PRACTICE_AWARENESS_MODE_SELECTOR: 'awareness-mode-selector',
  PRACTICE_RESONANCE_CONFIG: 'resonance-config',
  PRACTICE_PERCEPTION_CONFIG: 'perception-config',
  PRACTICE_PHOTIC_CONTROLS: 'photic-controls',
  PRACTICE_PHOTIC_INTENSITY: 'photic-intensity',

  WISDOM_SECTION_ROOT: 'wisdom-root',
  APPLICATION_SECTION_ROOT: 'application-root',
  NAVIGATION_SECTION_ROOT: 'navigation-root',
  NAVIGATION_PROGRAMS_PANEL: 'navigation-programs-panel',
  NAVIGATION_STAGE_DOTS: 'navigation-stage-dots',
  NAVIGATION_ACTIVE_PATH_ACTIONS: 'navigation-active-path-actions',
  NAVIGATION_PROGRAM_SUMMARY: 'navigation-program-summary',
};

export const GUIDE_STEPS = {
  PHOTIC_PROTOCOL: 'protocol',
  PHOTIC_INTENSITY: 'intensity',
  PHOTIC_GEOMETRY: 'geometry',
  PHOTIC_COLOR: 'color',
};

export function tutorialSelector(anchorId) {
  return `[data-tutorial="${anchorId}"]`;
}

export function guideStepSelector(stepId) {
  return `[data-guide-step="${stepId}"]`;
}
