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

export function tutorialAnchorTarget(...anchorIds) {
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

function ensureWisdomTab(anchorId) {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(tutorialSelector(anchorId));
  if (!(el instanceof HTMLElement)) return;
  if (el.getAttribute('aria-pressed') === 'true') return;
  el.click();
}

export const PAGE_TUTORIAL_DEFINITIONS = {
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
        target: () =>
          (typeof document === 'undefined'
            ? null
            : (document.querySelector(tutorialSelector(ANCHORS.HOME_CURRICULUM_CARD))
              || document.querySelector('[data-nav-pill-id="home:navigation"]')
              || document.querySelector('[data-ui-id="homeHub:mode:navigation"]'))),
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
        body: 'Wisdom is a study surface: treatise reading, bookmarks, videos, and self-knowledge tools.',
        target: tutorialAnchorTarget(ANCHORS.WISDOM_SECTION_ROOT),
        placement: 'bottom',
      },
      {
        id: 'wisdom-tab-bar',
        title: 'Switch Views',
        body: 'Use these tabs to move between Treatise, Bookmarks, Videos, and Self-Knowledge.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'bottom',
        allowInteraction: true,
      },
      {
        id: 'wisdom-treatise-search',
        title: 'Search The Treatise',
        body: 'Search titles and excerpts to find a chapter quickly. If you are on a different tab, switch back to Treatise.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_TREATISE_SEARCH,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'bottom',
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_TREATISE),
      },
      {
        id: 'wisdom-treatise-parts',
        title: 'Parts And Chapters',
        body: 'The Treatise is organized by Parts. Expand a Part to open a chapter and begin reading.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_TREATISE_PARTS,
          ANCHORS.WISDOM_TREATISE_SEARCH,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'top',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_TREATISE),
      },
      {
        id: 'wisdom-treatise-bookmark-star',
        title: 'Bookmark A Chapter',
        body: 'Open a chapter (or expand a Part) and use the star to save it. Bookmarks build your personal constellation.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_TREATISE_BOOKMARK_STAR,
          ANCHORS.WISDOM_TREATISE_PARTS,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'left',
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_TREATISE),
      },
      {
        id: 'wisdom-bookmarks-panel',
        title: 'Your Bookmarks',
        body: 'Switch to Bookmarks to see saved chapters. This view shows either an empty sky or your filled constellation.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_BOOKMARKS_PANEL,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'top',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_BOOKMARKS),
      },
      {
        id: 'wisdom-bookmarks-remove',
        title: 'Remove A Star',
        body: 'When your constellation is populated, use the X on a star to remove it. If the sky is empty, add a bookmark first.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_BOOKMARKS_REMOVE,
          ANCHORS.WISDOM_BOOKMARKS_PANEL,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'left',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_BOOKMARKS),
      },
      {
        id: 'wisdom-videos-self',
        title: 'Videos',
        body: 'Switch to **Videos** for short teachings and structured study sessions.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_TAB_VIDEOS,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'bottom',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_VIDEOS),
      },
      {
        id: 'wisdom-videos-hearth',
        title: 'The Hearth',
        body: 'This is the viewing hearth. Pick a video token below to load it here. Use the X to clear and return to idle embers.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_VIDEOS_HEARTH,
          ANCHORS.WISDOM_VIDEOS_ROOT,
          ANCHORS.WISDOM_TAB_VIDEOS,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'bottom',
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_VIDEOS),
      },
      {
        id: 'wisdom-videos-featured-band',
        title: 'Featured Offerings',
        body: 'Featured is a short curriculum-priority list: the videos you most want watched for the current arc. If no Featured band is present, everything is in Library.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_VIDEOS_FEATURED_BAND,
          ANCHORS.WISDOM_VIDEOS_LIBRARY_BAND,
          ANCHORS.WISDOM_VIDEOS_ROOT,
          ANCHORS.WISDOM_TAB_VIDEOS,
          ANCHORS.WISDOM_TAB_BAR,
        ),
        placement: 'top',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_VIDEOS),
      },
      {
        id: 'wisdom-videos-library-band',
        title: 'Library',
        body: 'Library is the full catalog. Scroll horizontally and select any token to load it into the hearth.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_VIDEOS_LIBRARY_BAND,
          ANCHORS.WISDOM_VIDEOS_ROOT,
          ANCHORS.WISDOM_TAB_VIDEOS,
          ANCHORS.WISDOM_TAB_BAR,
        ),
        placement: 'top',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_VIDEOS),
      },
      {
        id: 'wisdom-self-tab',
        title: 'Self-Knowledge',
        body: 'Switch to **Self-Knowledge** for reflection tools and your personal Wave Function profile.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'bottom',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE),
      },
      {
        id: 'wisdom-self-root',
        title: 'Wave Function',
        body: 'This surface summarizes traits that the system can use for Four Modes guidance. It is practical and self-directed.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_SELF_ROOT,
          ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE,
          ANCHORS.WISDOM_TAB_BAR,
        ),
        placement: 'top',
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE),
      },
      {
        id: 'wisdom-self-bigfive',
        title: 'Personality (Big Five)',
        body: 'The Big Five assessment is the primary calibration. Complete it once to activate the profile, then retake when needed.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_SELF_BIGFIVE_CARD,
          ANCHORS.WISDOM_SELF_ROOT,
          ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE,
        ),
        placement: 'top',
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE),
      },
      {
        id: 'wisdom-self-bigfive-action',
        title: 'Begin Or Retake',
        body: 'Use this button to begin the assessment, or retake it to refresh the profile. It takes a few minutes.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_SELF_BIGFIVE_ACTION,
          ANCHORS.WISDOM_SELF_BIGFIVE_CARD,
          ANCHORS.WISDOM_SELF_ROOT,
        ),
        placement: 'top',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE),
      },
      {
        id: 'wisdom-self-tags',
        title: 'Self-Described Patterns',
        body: 'Add short tags that describe your tendencies. This is optional, but it sharpens reflection and future guidance.',
        target: tutorialAnchorTarget(
          ANCHORS.WISDOM_SELF_TAGS,
          ANCHORS.WISDOM_SELF_ROOT,
          ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE,
        ),
        placement: 'top',
        allowInteraction: true,
        onEnter: () => ensureWisdomTab(ANCHORS.WISDOM_TAB_SELF_KNOWLEDGE),
      },
      {
        id: 'wisdom-global-help',
        title: 'Help Anytime',
        body: 'Use this button to reopen the current page tutorial. It is always available in the app shell.',
        target: tutorialAnchorTarget(
          ANCHORS.GLOBAL_TUTORIAL_BUTTON,
          ANCHORS.WISDOM_TAB_BAR,
          ANCHORS.WISDOM_SECTION_ROOT,
        ),
        placement: 'left',
        allowInteraction: true,
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
};
