import { useSettingsStore } from '../state/settingsStore.js';
import { ANCHORS, GUIDE_STEPS, guideStepSelector, tutorialSelector } from './anchorIds.js';

function setPhoticGuideStep(activeGuideStep) {
  const settings = useSettingsStore.getState();
  settings.setPhoticSetting('beginnerMode', true);
  settings.setPhoticSetting('activeGuideStep', activeGuideStep);
}

function resetPhoticGuide() {
  const settings = useSettingsStore.getState();
  settings.setPhoticSetting('activeGuideStep', null);
  settings.setPhoticSetting('beginnerMode', false);
}

function tutorialAnchorTarget(...anchorIds) {
  return () => {
    if (typeof document === 'undefined') return null;
    for (const anchorId of anchorIds) {
      if (!anchorId) continue;
      const el = document.querySelector(tutorialSelector(anchorId));
      if (el) return el;
    }
    return null;
  };
}

export const TUTORIALS = {
  'page:home': {
    title: 'Home Hub',
    steps: [
      {
        id: 'home-sessions-panel',
        title: 'Sessions And Active Days',
        body: 'This panel summarizes your recent activity. Use it as a quick health check for consistency.',
        target: tutorialSelector(ANCHORS.HOME_SESSIONS_PANEL),
        placement: 'bottom',
      },
      {
        id: 'home-avatar-ring',
        title: 'Center Focus',
        body: 'This is your home instrument. It anchors the page and reflects your current stage aesthetic.',
        target: tutorialSelector(ANCHORS.HOME_AVATAR_RING),
        placement: 'bottom',
      },
      {
        id: 'home-stage-panel',
        title: 'Stage And Timing',
        body: 'This panel shows stage progress and a shortcut to reports. It helps you understand momentum over time.',
        target: tutorialSelector(ANCHORS.HOME_STAGE_PANEL),
        placement: 'bottom',
      },
      {
        id: 'home-daily-card',
        title: 'Today\'s Practice',
        body: 'This is the fastest path back into training. Start the next scheduled practice from here.',
        target: tutorialSelector(ANCHORS.HOME_DAILY_CARD),
        placement: 'top',
        allowInteraction: true,
      },
      {
        id: 'home-navigation-card',
        title: 'Navigation And Path',
        body: 'Open **Navigation** to manage your path, review stage lanes, and begin or resume a structured run.',
        target: tutorialSelector(ANCHORS.HOME_CURRICULUM_CARD),
        placement: 'top',
        allowInteraction: true,
      },
      {
        id: 'home-global-help',
        title: 'Help Anytime',
        body: 'Use this button to reopen the current page tutorial. It is always available in the app shell.',
        target: tutorialSelector(ANCHORS.GLOBAL_TUTORIAL_BUTTON),
        placement: 'left',
        allowInteraction: true,
      },
    ],
  },

  'page:practice': {
    title: 'Practice Section',
    steps: [
      {
        id: 'practice-selector',
        title: 'Choose Your Practice',
        body: 'Select the practice family here: Breath, Circuit, Awareness, Resonance, Perception, and more.',
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
        placement: 'bottom',
      },
      {
        id: 'practice-tempo-sync',
        title: 'Tempo Sync',
        body: 'Tempo Sync lets breath sessions follow a loaded track. Use it when you want pacing to stay locked to audio.',
        target: tutorialSelector(ANCHORS.PRACTICE_TEMPO_SYNC_PANEL),
        placement: 'top',
      },
      {
        id: 'practice-local-help',
        title: 'Practice Tutorials',
        body: 'Each practice menu keeps its own tutorial entry point. Open this button whenever you need mode-specific guidance.',
        target: tutorialSelector(ANCHORS.PRACTICE_TUTORIAL_BUTTON),
        placement: 'left',
      },
    ],
  },

  'page:wisdom': {
    title: 'Wisdom Section',
    steps: [
      {
        id: 'wisdom-root',
        title: 'Explore Wisdom',
        body: 'Browse treatises, bookmarks, videos, and self-knowledge tools from this surface.',
        target: tutorialSelector(ANCHORS.WISDOM_SECTION_ROOT),
        placement: 'bottom',
      },
      {
        id: 'wisdom-global-help',
        title: 'Tutorial Button',
        body: 'You can reopen this tutorial from the global help button without leaving the section.',
        target: tutorialSelector(ANCHORS.GLOBAL_TUTORIAL_BUTTON),
        placement: 'left',
      },
    ],
  },

  'page:application': {
    title: 'Application Section',
    steps: [
      {
        id: 'application-root',
        title: 'Apply Your Practice',
        body: 'Use this section to record lived moments, intentions, and application signals from the rest of the system.',
        target: tutorialSelector(ANCHORS.APPLICATION_SECTION_ROOT),
        placement: 'top',
      },
      {
        id: 'application-global-help',
        title: 'Get Help',
        body: 'The global tutorial button stays available here too.',
        target: tutorialSelector(ANCHORS.GLOBAL_TUTORIAL_BUTTON),
        placement: 'left',
      },
    ],
  },

  'page:navigation': {
    title: 'Navigation Section',
    steps: [
      {
        id: 'navigation-root',
        title: 'Choose Your Path',
        body: 'Navigation is where stage lanes, path selection, and curriculum entry all converge.',
        target: tutorialSelector(ANCHORS.NAVIGATION_SECTION_ROOT),
        placement: 'top',
      },
      {
        id: 'navigation-programs-panel',
        title: 'Programs',
        body: 'Programs are guided practice schedules. Pick one to commit to a cadence and let the system structure your next sessions.',
        target: tutorialSelector(ANCHORS.NAVIGATION_PROGRAMS_PANEL),
        placement: 'top',
      },
      {
        id: 'navigation-stage-dots',
        title: 'Program Levels',
        body: 'These dots switch the level of programs you are viewing. Move through Seedling to Stellar to find what matches your current capacity.',
        target: tutorialSelector(ANCHORS.NAVIGATION_STAGE_DOTS),
        placement: 'left',
      },
      {
        id: 'navigation-active-path-actions',
        title: 'Restart Or Abandon',
        body: 'Restart re-begins the current path from day 1. Abandon clears it entirely so you can choose a different program.',
        target: tutorialSelector(ANCHORS.NAVIGATION_ACTIVE_PATH_ACTIONS),
        placement: 'bottom',
        waitFor: {
          target: tutorialSelector(ANCHORS.NAVIGATION_ACTIVE_PATH_ACTIONS),
          timeoutMs: 800,
          intervalMs: 50,
          optional: true,
        },
      },
      {
        id: 'navigation-program-summary',
        title: 'Program Summary',
        body: 'This block summarizes your active program schedule and today’s status: active days, times, legs per day, and what is next.',
        target: tutorialSelector(ANCHORS.NAVIGATION_PROGRAM_SUMMARY),
        placement: 'top',
        waitFor: {
          target: tutorialSelector(ANCHORS.NAVIGATION_PROGRAM_SUMMARY),
          timeoutMs: 800,
          intervalMs: 50,
          optional: true,
        },
      },
      {
        id: 'navigation-global-help',
        title: 'Tutorial Access',
        body: 'Use the global help button whenever you want to revisit this section guide.',
        target: tutorialSelector(ANCHORS.GLOBAL_TUTORIAL_BUTTON),
        placement: 'left',
      },
    ],
  },

  'navigation:programs': {
    title: 'Programs',
    steps: [
      {
        id: 'navigation-programs-panel',
        title: 'Programs',
        body: 'Programs are guided practice schedules. Pick one to commit to a cadence and let the system structure your next sessions.',
        target: tutorialSelector(ANCHORS.NAVIGATION_PROGRAMS_PANEL),
        placement: 'top',
      },
    ],
  },

  'navigation:stage-dots': {
    title: 'Program Levels',
    steps: [
      {
        id: 'navigation-stage-dots',
        title: 'Program Levels',
        body: 'These dots switch the level of programs you are viewing. Move through Seedling to Stellar to find what matches your current capacity.',
        target: tutorialSelector(ANCHORS.NAVIGATION_STAGE_DOTS),
        placement: 'left',
      },
    ],
  },

  'navigation:active-path-actions': {
    title: 'Active Path Actions',
    steps: [
      {
        id: 'navigation-active-path-actions',
        title: 'Restart Or Abandon',
        body: 'Restart re-begins the current path from day 1. Abandon clears it entirely so you can choose a different program.',
        target: tutorialSelector(ANCHORS.NAVIGATION_ACTIVE_PATH_ACTIONS),
        placement: 'bottom',
        waitFor: {
          target: tutorialSelector(ANCHORS.NAVIGATION_ACTIVE_PATH_ACTIONS),
          timeoutMs: 800,
          intervalMs: 50,
          optional: true,
        },
      },
    ],
  },

  'page:photic-beginner': {
    title: 'Photonic Beginner Guide',
    onOpen: () => setPhoticGuideStep(GUIDE_STEPS.PHOTIC_PROTOCOL),
    onClose: () => resetPhoticGuide(),
    steps: [
      {
        id: 'photic-protocol',
        title: 'Protocol',
        body: 'Start with rate and timing. Find a pulse that feels stable before adjusting anything else.',
        target: guideStepSelector(GUIDE_STEPS.PHOTIC_PROTOCOL),
        placement: 'right',
        allowInteraction: true,
        onEnter: () => setPhoticGuideStep(GUIDE_STEPS.PHOTIC_PROTOCOL),
      },
      {
        id: 'photic-intensity',
        title: 'Intensity',
        body: 'Raise brightness only until the circles are clear and comfortable. If strain appears, reduce intensity and keep the pattern simple.',
        target: guideStepSelector(GUIDE_STEPS.PHOTIC_INTENSITY),
        placement: 'right',
        allowInteraction: true,
        waitFor: {
          target: guideStepSelector(GUIDE_STEPS.PHOTIC_INTENSITY),
          timeoutMs: 1500,
          intervalMs: 50,
          optional: true,
        },
        media: [
          {
            id: 'photic-intensity-reference',
            kind: 'image',
            src: 'tutorial/breath and stillness/intensity 1.webp',
            alt: 'Reference image for comfortable beginner photic intensity',
            caption: 'Keep the circles readable first. Stronger intensity is optional.',
          },
        ],
        actions: [
          {
            id: 'open-practice-photic',
            label: 'Open the full photic tutorial',
            intent: 'openTutorial',
            tutorialId: 'practice:photic',
            variant: 'secondary',
          },
        ],
        onEnter: () => setPhoticGuideStep(GUIDE_STEPS.PHOTIC_INTENSITY),
      },
      {
        id: 'photic-geometry',
        title: 'Geometry',
        body: 'Adjust radius and spacing until both circles stay balanced inside your field of view.',
        target: guideStepSelector(GUIDE_STEPS.PHOTIC_GEOMETRY),
        placement: 'right',
        allowInteraction: true,
        onEnter: () => setPhoticGuideStep(GUIDE_STEPS.PHOTIC_GEOMETRY),
      },
      {
        id: 'photic-color',
        title: 'Color',
        body: 'Pick a comfortable color pair. Linked colors are the simplest starting point; unlink them only when you want asymmetry.',
        target: guideStepSelector(GUIDE_STEPS.PHOTIC_COLOR),
        placement: 'right',
        allowInteraction: true,
        onEnter: () => setPhoticGuideStep(GUIDE_STEPS.PHOTIC_COLOR),
      },
    ],
  },

  'practice:breath': {
    title: 'Breath Practice',
    steps: [
      {
        id: 'breath-selector',
        title: 'Practice Selector',
        body: 'Breath starts here. Use the selector to return to it from any other practice family.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : (document.querySelector(tutorialSelector(ANCHORS.PRACTICE_SELECTOR))
              || document.querySelector('[data-ui-id="practice:dropdown:method"]'))),
        placement: 'right',
      },
      {
        id: 'breath-edit',
        title: 'Edit To Explore',
        body: 'Start in Focus mode for simplicity. Tap Edit when you want the full configuration surface.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'bottom',
        allowInteraction: true,
      },
      {
        id: 'breath-method',
        title: 'Traditional vs Expansion',
        body: 'Traditional is lineage-defined breathing. Expansion is our technique lab: smooth ramps, deliberate holds, and experiment-driven patterns.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BREATH_METHOD,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-traditional-ratios',
        title: 'Traditional Ratios',
        body: 'In Traditional mode, ratio presets load classic inhale-hold-exhale patterns. Switch to Traditional, then pick one to load it into the cycle.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_TRADITIONAL_RATIOS,
          ANCHORS.FOUNDATIONS_BREATH_METHOD,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-traditional-cadence',
        title: 'Cadence (Advanced)',
        body: 'In Traditional mode, Cadence scales a ratio slower or faster without changing its structure. Open Advanced to adjust cadence.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_TRADITIONAL_CADENCE,
          ANCHORS.FOUNDATIONS_TRADITIONAL_RATIOS,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-waveform',
        title: 'Breath Preview',
        body: 'This preview shows the shape of the cycle you are building. Use it to feel the pattern visually before you run it.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BREATH_WAVEFORM,
          ANCHORS.FOUNDATIONS_BREATH_METHOD,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-cycle',
        title: 'Cycle Inputs',
        body: 'Configure inhale, holds, and exhale. Expansion mode is not about fixed ratios, it is about intentional control of pacing and breath holds.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BREATH_CYCLE,
          ANCHORS.FOUNDATIONS_BREATH_METHOD,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-duration',
        title: 'Duration',
        body: 'Set how long you want to practice for this run.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BREATH_DURATION,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-tempo-sync',
        title: 'Tempo Sync (Advanced)',
        body: 'Tempo Sync is for advanced practitioners: align breath timing with a song so the emotional contour of the music can shape the session.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BREATH_TEMPO_TOGGLE,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'breath-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BEGIN,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
      },
      {
        id: 'breath-trajectory',
        title: 'Trajectory',
        body: 'Toggle the Trajectory panel when you want a higher-level view of where your breathing practice is heading over time.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_TRAJECTORY_TOGGLE,
          ANCHORS.FOUNDATIONS_BEGIN,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
    ],
  },

  'practice:stillness': {
    title: 'Stillness Practice',
    steps: [
      {
        id: 'stillness-options',
        title: 'Edit To Explore',
        body: 'Stillness starts simple. Tap Edit to access intensity, timing, and duration controls.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'bottom',
        allowInteraction: true,
      },
      {
        id: 'stillness-intensity',
        title: 'Focus Intensity',
        body: 'Choose how strong your stillness focus should be. This sets the tone of the session.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_STILLNESS_INTENSITY,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'stillness-timing',
        title: 'Timing',
        body: 'Set focus, rest, and pre-delay. You are defining the rhythm of your stillness set.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_STILLNESS_TIMING,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'stillness-duration',
        title: 'Duration',
        body: 'Set how long you want to practice for this run.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_STILLNESS_DURATION,
          ANCHORS.FOUNDATIONS_EDIT,
          ANCHORS.FOUNDATIONS_COLLAPSE,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'stillness-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: tutorialAnchorTarget(
          ANCHORS.FOUNDATIONS_BEGIN,
          ANCHORS.FOUNDATIONS_ROOT
        ),
        placement: 'top',
      },
    ],
  },

  'practice:circuit': {
    title: 'Circuit Mode',
    steps: [
      {
        id: 'circuit-selector',
        title: 'Practice Selector',
        body: 'Select Circuit to build a multi-exercise session.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : (document.querySelector(tutorialSelector(ANCHORS.PRACTICE_SELECTOR))
              || document.querySelector('[data-ui-id="practice:dropdown:method"]'))),
        placement: 'right',
      },
      {
        id: 'circuit-root',
        title: 'Circuit Builder',
        body: 'A circuit is a sequence of practices you will run back-to-back. Build the sequence here.',
        target: tutorialAnchorTarget(
          ANCHORS.CIRCUIT_ROOT,
          ANCHORS.PRACTICE_CIRCUIT_DURATION
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'circuit-pick-practices',
        title: 'Select Practices',
        body: 'Tap practices to add them to the circuit. Avoid placing the same type back-to-back.',
        target: tutorialAnchorTarget(
          ANCHORS.CIRCUIT_PRACTICE_PICKER,
          ANCHORS.CIRCUIT_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
        allowInteraction: true,
      },
      {
        id: 'circuit-sequence',
        title: 'Energy Pathway',
        body: 'This is your circuit sequence. You can adjust durations per exercise and remove items.',
        target: tutorialAnchorTarget(
          ANCHORS.CIRCUIT_SEQUENCE,
          ANCHORS.CIRCUIT_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'circuit-exercise-duration',
        title: 'Per-Exercise Duration',
        body: 'Set how many minutes each practice should run for. This changes the circuit total.',
        target: tutorialAnchorTarget(
          ANCHORS.CIRCUIT_EXERCISE_DURATION,
          ANCHORS.CIRCUIT_SEQUENCE,
          ANCHORS.CIRCUIT_ROOT
        ),
        placement: 'left',
        waitFor: 1200,
        allowInteraction: true,
      },
      {
        id: 'circuit-break-between',
        title: 'Break Between',
        body: 'Set the rest time between exercises. Keep it short unless you want full resets.',
        target: tutorialAnchorTarget(
          ANCHORS.CIRCUIT_BREAK_BETWEEN,
          ANCHORS.CIRCUIT_TOTAL_DURATION,
          ANCHORS.CIRCUIT_ROOT
        ),
        placement: 'left',
        waitFor: 1200,
        allowInteraction: true,
      },
      {
        id: 'circuit-begin',
        title: 'Begin Circuit',
        body: 'Start the circuit run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : (document.querySelector('[data-ui-id="practice:cta:begin"]')
              || document.querySelector(tutorialSelector(ANCHORS.CIRCUIT_ROOT)))),
        placement: 'top',
      },
    ],
  },

  'practice:integration': {
    title: 'Ritual Integration',
    steps: [
      {
        id: 'integration-selector',
        title: 'Select A Ritual',
        body: 'Ritual Integration starts from the main selector, then moves into the ritual deck below.',
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
        placement: 'bottom',
      },
      {
        id: 'integration-steps',
        title: 'Ritual Steps',
        body: 'Choose the invocation or ritual flow you want to run from this deck.',
        target: tutorialSelector(ANCHORS.PRACTICE_RITUAL_STEPS),
        placement: 'left',
      },
    ],
  },

  'practice:awareness': {
    title: 'Awareness Practice',
    steps: [
      {
        id: 'awareness-selector',
        title: 'Awareness Modes',
        body: 'Awareness practice keeps all observation modes under one family entry.',
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
        placement: 'bottom',
      },
      {
        id: 'awareness-submodes',
        title: 'Observation Technique',
        body: 'Use these sub-mode controls to move between cognitive, somatic, and emotional observation styles.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'top',
        allowInteraction: true,
        actions: [
          {
            label: 'Cognitive tour',
            intent: 'openTutorial',
            tutorialId: 'practice:cognitive_vipassana',
            variant: 'secondary',
          },
          {
            label: 'Somatic tour',
            intent: 'openTutorial',
            tutorialId: 'practice:somatic_vipassana',
            variant: 'secondary',
          },
          {
            label: 'Emotion tour',
            intent: 'openTutorial',
            tutorialId: 'practice:feeling',
            variant: 'secondary',
          },
        ],
      },
      {
        id: 'awareness-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-ui-id="practice:cta:begin"]')),
        placement: 'top',
      },
    ],
  },

  'practice:cognitive_vipassana': {
    title: 'Insight Meditation',
    steps: [
      {
        id: 'cognitive-selector',
        title: 'Select Cognitive',
        body: 'Cognitive observation focuses on witnessing thought patterns without forcing them away.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'top',
        allowInteraction: true,
      },
      {
        id: 'cognitive-sakshi-1',
        title: 'Sakshi I',
        body: 'Witnessing Presence: observe the self as it moves through life. Thoughts arise. Thoughts dissolve.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_SAKSHI_1,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'cognitive-sakshi-2',
        title: 'Sakshi II',
        body: 'Noticing and labeling: watch the mind through a reflective lens and return to silence.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_SAKSHI_2,
          ANCHORS.AWARENESS_SAKSHI_1,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'cognitive-scene',
        title: 'Scene',
        body: 'Pick the scene for the Sakshi portal. Use it to set the emotional tone of the witness state.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_SCENE_GRID,
          ANCHORS.AWARENESS_SAKSHI_1,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'cognitive-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-ui-id="practice:cta:begin"]')),
        placement: 'top',
      },
    ],
  },

  'practice:somatic_vipassana': {
    title: 'Body Scan',
    steps: [
      {
        id: 'somatic-selector',
        title: 'Select Somatic',
        body: 'Somatic awareness is sensation-first: use the body field to stabilize attention.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'top',
        allowInteraction: true,
      },
      {
        id: 'somatic-rail',
        title: 'Body Regions',
        body: 'Choose a region rail to focus your scan: upper, middle, lower, or full field.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_BODY_RAIL,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'somatic-scans',
        title: 'Scan Options',
        body: 'Pick the scan variation within the active region. This sets the route your attention will follow.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_BODY_SCANS,
          ANCHORS.AWARENESS_BODY_RAIL,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'somatic-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-ui-id="practice:cta:begin"]')),
        placement: 'top',
      },
    ],
  },

  'practice:feeling': {
    title: 'Emotional Awareness',
    steps: [
      {
        id: 'feeling-selector',
        title: 'Select Emotion',
        body: 'Emotional awareness trains you to hold feeling without flinching and without chasing.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'top',
        allowInteraction: true,
      },
      {
        id: 'feeling-modes',
        title: 'Emotion Modes',
        body: 'Choose the emotion domain you want to practice with. Each one has its own training frame.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_EMOTION_MODES,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS,
          ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'feeling-frame',
        title: 'The Frame',
        body: 'This is the current frame: what you hold your attention on while the feeling rises, shifts, and fades.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_EMOTION_FRAME,
          ANCHORS.AWARENESS_EMOTION_MODES,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'feeling-prompts',
        title: 'Prompt Style',
        body: 'Minimal stays silent. Guided offers more structured prompting. Pick what matches your current level.',
        target: tutorialAnchorTarget(
          ANCHORS.AWARENESS_EMOTION_PROMPTS,
          ANCHORS.AWARENESS_EMOTION_FRAME,
          ANCHORS.PRACTICE_AWARENESS_MODE_TABS
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'feeling-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-ui-id="practice:cta:begin"]')),
        placement: 'top',
      },
    ],
  },

  'practice:resonance': {
    title: 'Resonance And Vibration',
    steps: [
      {
        id: 'resonance-selector',
        title: 'Sound Modes',
        body: 'Start in the main selector, then tune the current sound mode from the configuration surface.',
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
        placement: 'bottom',
      },
      {
        id: 'resonance-tabs',
        title: 'Choose A Mode',
        body: 'Resonance is the entrainment family: sound and vibration used to tune your nervous system. Use these mode tabs to choose the current instrument.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_RESONANCE_MODE_TABS,
          ANCHORS.PRACTICE_RESONANCE_CONFIG,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'bottom',
        allowInteraction: true,
        actions: [
          {
            label: 'Sound (Entrainment)',
            intent: 'openTutorial',
            tutorialId: 'practice:sound',
            variant: 'secondary',
          },
          {
            label: 'Cymatics',
            intent: 'openTutorial',
            tutorialId: 'practice:cymatics',
            variant: 'secondary',
          },
        ],
      },
      {
        id: 'resonance-config',
        title: 'Configure Parameters',
        body: 'This surface owns your resonance settings. You are defining the entrainment target and the sound texture that carries it.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_RESONANCE_CONFIG,
          ANCHORS.SOUND_ROOT,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'left',
        waitFor: 1200,
      },
      {
        id: 'resonance-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-ui-id="practice:cta:begin"]')),
        placement: 'top',
      },
    ],
  },

  'practice:sound': {
    title: 'Sound (Entrainment)',
    steps: [
      {
        id: 'sound-selector',
        title: 'Select Sound',
        body: 'Sound is the entrainment instrument: choose it when you want frequency to shape your state directly.',
        target: tutorialAnchorTarget(
          ANCHORS.PRACTICE_RESONANCE_MODE_TABS,
          ANCHORS.PRACTICE_RESONANCE_CONFIG,
          ANCHORS.PRACTICE_SELECTOR
        ),
        placement: 'bottom',
        allowInteraction: true,
      },
      {
        id: 'sound-engine',
        title: 'Entrainment Engine',
        body: 'Pick the engine: **Binaural** (difference tone), **Isochronic** (pulses), **Mantra/Nature** (support), or **Silence** (baseline).',
        target: tutorialAnchorTarget(
          ANCHORS.SOUND_TYPE_GRID,
          ANCHORS.SOUND_ROOT,
          ANCHORS.PRACTICE_RESONANCE_CONFIG
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'sound-exact-hz',
        title: 'Exact Frequency (Hz)',
        body: 'This is the entrainment target. Adjusting it shifts the training frequency directly, and it becomes a Custom preset when you do.',
        target: tutorialAnchorTarget(
          ANCHORS.SOUND_EXACT_FREQUENCY,
          ANCHORS.SOUND_ROOT,
          ANCHORS.PRACTICE_RESONANCE_CONFIG
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'sound-binaural',
        title: 'Binaural Beats',
        body: 'Binaural entrainment uses two close tones; the perceived difference is the target Hz.',
        target: tutorialAnchorTarget(
          ANCHORS.SOUND_BINAURAL_PANEL,
          ANCHORS.SOUND_EXACT_FREQUENCY,
          ANCHORS.SOUND_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'sound-isochronic',
        title: 'Isochronic Tones',
        body: 'Isochronic entrainment uses a pulse. Presets quickly set the pulse Hz, and you can still dial in Custom frequency.',
        target: tutorialAnchorTarget(
          ANCHORS.SOUND_ISOCHRONIC_PANEL,
          ANCHORS.SOUND_EXACT_FREQUENCY,
          ANCHORS.SOUND_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'sound-advanced',
        title: 'Advanced Controls',
        body: 'Use Advanced to shape texture without changing the entrainment target. Carrier changes tone color (not Hz). Reverb and chorus add comfort and depth.',
        target: tutorialAnchorTarget(
          ANCHORS.SOUND_ADVANCED_TOGGLE,
          ANCHORS.SOUND_ADVANCED_CONTROLS,
          ANCHORS.SOUND_ROOT
        ),
        placement: 'top',
        allowInteraction: true,
        waitFor: 1200,
      },
      {
        id: 'sound-volume',
        title: 'Volume',
        body: 'Keep volume comfortable. Entrainment is about consistency, not intensity.',
        target: tutorialAnchorTarget(
          ANCHORS.SOUND_VOLUME,
          ANCHORS.SOUND_ROOT
        ),
        placement: 'top',
        waitFor: 1200,
      },
      {
        id: 'sound-begin',
        title: 'Begin Practice',
        body: 'Launch the run when you are ready.',
        target: () =>
          (typeof document === 'undefined'
            ? null
            : document.querySelector('[data-ui-id="practice:cta:begin"]')),
        placement: 'top',
      },
    ],
  },

  'practice:cymatics': {
    title: 'Cymatics Visualization',
    steps: [
      {
        id: 'cymatics-config',
        title: 'Visual Harmonics',
        body: 'Cymatics runs from the resonance configuration panel and changes the visual response to sound.',
        target: tutorialSelector(ANCHORS.PRACTICE_RESONANCE_CONFIG),
        placement: 'left',
      },
    ],
  },

  'practice:perception': {
    title: 'Perception And Vision',
    steps: [
      {
        id: 'perception-selector',
        title: 'Visual Practices',
        body: 'Perception groups the visual practices into one family entry.',
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
        placement: 'bottom',
      },
      {
        id: 'perception-config',
        title: 'Configure Visuals',
        body: 'Adjust visual parameters like speed, color, and intensity from this configuration surface.',
        target: tutorialSelector(ANCHORS.PRACTICE_PERCEPTION_CONFIG),
        placement: 'left',
      },
    ],
  },

  'practice:visualization': {
    title: 'Sacred Geometry',
    steps: [
      {
        id: 'visualization-config',
        title: 'Geometric Forms',
        body: 'Sacred Geometry uses the shared perception configuration surface.',
        target: tutorialSelector(ANCHORS.PRACTICE_PERCEPTION_CONFIG),
        placement: 'left',
      },
    ],
  },

  'practice:photic': {
    title: 'Photonic Practice',
    steps: [
      {
        id: 'photic-controls',
        title: 'Light Frequency',
        body: 'Use the photic controls to set rate and timing before the session begins.',
        target: tutorialSelector(ANCHORS.PRACTICE_PHOTIC_CONTROLS),
        placement: 'left',
      },
      {
        id: 'photic-intensity-panel',
        title: 'Intensity And Color',
        body: 'Brightness and color live in this section of the photic controls.',
        target: tutorialSelector(ANCHORS.PRACTICE_PHOTIC_INTENSITY),
        placement: 'left',
      },
    ],
  },
};
