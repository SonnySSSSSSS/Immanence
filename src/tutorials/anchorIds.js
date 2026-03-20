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
  PRACTICE_RITUAL_QUICK_START: 'ritual-quick-start',
  PRACTICE_AWARENESS_MODE_SELECTOR: 'awareness-mode-selector',
  PRACTICE_AWARENESS_MODE_TABS: 'awareness-mode-tabs',
  AWARENESS_SAKSHI_1: 'awareness-sakshi-1',
  AWARENESS_SAKSHI_2: 'awareness-sakshi-2',
  AWARENESS_SCENE_GRID: 'awareness-scene-grid',
  AWARENESS_BODY_RAIL: 'awareness-body-rail',
  AWARENESS_BODY_SCANS: 'awareness-body-scans',
  AWARENESS_EMOTION_MODES: 'awareness-emotion-modes',
  AWARENESS_EMOTION_FRAME: 'awareness-emotion-frame',
  AWARENESS_EMOTION_PROMPTS: 'awareness-emotion-prompts',
  PRACTICE_RESONANCE_CONFIG: 'resonance-config',
  PRACTICE_RESONANCE_MODE_TABS: 'resonance-mode-tabs',
  SOUND_ROOT: 'sound-root',
  SOUND_TYPE_GRID: 'sound-type-grid',
  SOUND_EXACT_FREQUENCY: 'sound-exact-frequency',
  SOUND_BINAURAL_PANEL: 'sound-binaural-panel',
  SOUND_ISOCHRONIC_PANEL: 'sound-isochronic-panel',
  SOUND_VOLUME: 'sound-volume',
  SOUND_ADVANCED_TOGGLE: 'sound-advanced-toggle',
  SOUND_ADVANCED_CONTROLS: 'sound-advanced-controls',

  BINAURAL_ROOT: 'binaural-root',
  BINAURAL_ENABLE_AUDIO: 'binaural-enable-audio',
  BINAURAL_START_STOP: 'binaural-start-stop',
  BINAURAL_ADVANCED_TOGGLE: 'binaural-advanced-toggle',
  BINAURAL_MASTER_CARRIER: 'binaural-master-carrier',
  BINAURAL_DELTAF: 'binaural-deltaf',
  BINAURAL_RATIO: 'binaural-ratio',
  BINAURAL_SPREAD_MODE: 'binaural-spread-mode',
  BINAURAL_CHAOS: 'binaural-chaos',
  BINAURAL_BALANCE_PRESETS: 'binaural-balance-presets',
  BINAURAL_CUSTOM_GAINS: 'binaural-custom-gains',
  PRACTICE_PERCEPTION_CONFIG: 'perception-config',
  PRACTICE_PHOTIC_CONTROLS: 'photic-controls',
  PRACTICE_PHOTIC_INTENSITY: 'photic-intensity',

  WISDOM_SECTION_ROOT: 'wisdom-root',
  WISDOM_TAB_BAR: 'wisdom-tab-bar',
  WISDOM_TAB_TREATISE: 'wisdom-tab-treatise',
  WISDOM_TAB_BOOKMARKS: 'wisdom-tab-bookmarks',
  WISDOM_TAB_VIDEOS: 'wisdom-tab-videos',
  WISDOM_TAB_SELF_KNOWLEDGE: 'wisdom-tab-self-knowledge',
  WISDOM_TREATISE_SEARCH: 'wisdom-treatise-search',
  WISDOM_TREATISE_PARTS: 'wisdom-treatise-parts',
  WISDOM_TREATISE_BOOKMARK_STAR: 'wisdom-treatise-bookmark-star',
  WISDOM_BOOKMARKS_PANEL: 'wisdom-bookmarks-panel',
  WISDOM_BOOKMARKS_REMOVE: 'wisdom-bookmarks-remove',
  APPLICATION_SECTION_ROOT: 'application-root',
  NAVIGATION_SECTION_ROOT: 'navigation-root',
  NAVIGATION_PROGRAMS_PANEL: 'navigation-programs-panel',
  NAVIGATION_STAGE_DOTS: 'navigation-stage-dots',
  NAVIGATION_ACTIVE_PATH_ACTIONS: 'navigation-active-path-actions',
  NAVIGATION_PROGRAM_SUMMARY: 'navigation-program-summary',

  FOUNDATIONS_EDIT: 'foundations-edit',
  FOUNDATIONS_ROOT: 'foundations-root',
  FOUNDATIONS_COLLAPSE: 'foundations-collapse',
  FOUNDATIONS_BREATH_METHOD: 'foundations-breath-method',
  FOUNDATIONS_BREATH_WAVEFORM: 'foundations-breath-waveform',
  FOUNDATIONS_BREATH_CYCLE: 'foundations-breath-cycle',
  FOUNDATIONS_BREATH_TEMPO_TOGGLE: 'foundations-breath-tempo-toggle',
  FOUNDATIONS_BREATH_DURATION: 'foundations-breath-duration',
  FOUNDATIONS_BEGIN: 'foundations-begin',
  FOUNDATIONS_TRAJECTORY_TOGGLE: 'foundations-trajectory-toggle',

  FOUNDATIONS_STILLNESS_INTENSITY: 'foundations-stillness-intensity',
  FOUNDATIONS_STILLNESS_TIMING: 'foundations-stillness-timing',
  FOUNDATIONS_STILLNESS_DURATION: 'foundations-stillness-duration',

  FOUNDATIONS_TRADITIONAL_RATIOS: 'foundations-traditional-ratios',
  FOUNDATIONS_TRADITIONAL_CADENCE: 'foundations-traditional-cadence',

  CIRCUIT_ROOT: 'circuit-root',
  CIRCUIT_TOTAL_DURATION: 'circuit-total-duration',
  CIRCUIT_BREAK_BETWEEN: 'circuit-break-between',
  CIRCUIT_PRACTICE_PICKER: 'circuit-practice-picker',
  CIRCUIT_SEQUENCE: 'circuit-sequence',
  CIRCUIT_EXERCISE_DURATION: 'circuit-exercise-duration',
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
