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
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
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
        title: 'Circuit Exercises',
        body: 'Circuit mode lets you sequence multiple practices into one run.',
        target: tutorialSelector(ANCHORS.PRACTICE_SELECTOR),
        placement: 'bottom',
      },
      {
        id: 'circuit-config',
        title: 'Exercise Duration',
        body: 'Adjust durations and sequence details from this circuit configuration surface.',
        target: tutorialSelector(ANCHORS.PRACTICE_CIRCUIT_DURATION),
        placement: 'left',
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
        body: 'Use these sub-mode buttons to move between cognitive, somatic, and emotional observation styles.',
        target: tutorialSelector(ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR),
        placement: 'top',
      },
    ],
  },

  'practice:cognitive_vipassana': {
    title: 'Insight Meditation',
    steps: [
      {
        id: 'cognitive-selector',
        title: 'Cognitive Observation',
        body: 'Insight mode focuses on observing thought patterns without forcing them away.',
        target: tutorialSelector(ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR),
        placement: 'top',
      },
    ],
  },

  'practice:somatic_vipassana': {
    title: 'Body Scan',
    steps: [
      {
        id: 'somatic-selector',
        title: 'Somatic Awareness',
        body: 'Body Scan uses the awareness sub-mode controls to switch into sensation-focused observation.',
        target: tutorialSelector(ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR),
        placement: 'top',
      },
    ],
  },

  'practice:feeling': {
    title: 'Emotional Awareness',
    steps: [
      {
        id: 'feeling-selector',
        title: 'Emotional Practice',
        body: 'Feeling practice lives inside the same awareness family and uses the same sub-mode controls.',
        target: tutorialSelector(ANCHORS.PRACTICE_AWARENESS_MODE_SELECTOR),
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
        id: 'resonance-config',
        title: 'Adjust Parameters',
        body: 'This configuration area owns the current resonance settings for frequency, intensity, and duration.',
        target: tutorialSelector(ANCHORS.PRACTICE_RESONANCE_CONFIG),
        placement: 'left',
      },
    ],
  },

  'practice:sound': {
    title: 'Sound Bath',
    steps: [
      {
        id: 'sound-config',
        title: 'Solfeggio Frequencies',
        body: 'Sound Bath is configured from the resonance settings surface.',
        target: tutorialSelector(ANCHORS.PRACTICE_RESONANCE_CONFIG),
        placement: 'left',
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
