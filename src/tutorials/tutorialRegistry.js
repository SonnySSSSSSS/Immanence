// src/tutorials/tutorialRegistry.js
// Tutorial media format: { key: string, alt: string, caption?: string }
// Keys must be filenames under /public/tutorial/ (no path traversal)

export const TUTORIALS = {
  "page:home": {
    title: "Home Hub",
    steps: [
      {
        title: "Daily Practice",
        body: "Your daily practice card shows your schedule and progress. Click to start a practice session.",
        target: '[data-tutorial="home-daily-card"]',
        placement: "bottom",
      },
      {
        title: "Curriculum & Path",
        body: "Click 'Path →' to view your curriculum progress, set up a new path, or track your journey.",
        target: '[data-tutorial="home-curriculum-card"]',
        placement: "left",
      },
      {
        title: "Help Anytime",
        body: "This button opens tutorials on any page. Click it whenever you need guidance.",
        target: '[data-tutorial="global-tutorial-button"]',
        placement: "left",
      },
    ],
  },

  "page:practice": {
    title: "Practice Section",
    steps: [
      {
        title: "Choose Your Practice",
        body: "Select a practice type from the selector: Breath, Circuit, Awareness, and more.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
      {
        title: "Tempo Sync (Optional)",
        body: "Enable Tempo Sync to match your breathing to music. Configure BPM and audio settings here.",
        target: '[data-tutorial="tempo-sync-panel"]',
        placement: "top",
      },
      {
        title: "Tutorial Access",
        body: "Each practice has its own tutorial. Click the Tutorial button in the practice menu for guidance.",
        target: '[data-tutorial="tutorial-button"]',
        placement: "left",
      },
    ],
  },

  "page:wisdom": {
    title: "Wisdom Section",
    steps: [
      {
        title: "Explore Wisdom",
        body: "Browse recommendations, treatise chapters, bookmarks, videos, and self-knowledge tools. Use the tabs to navigate.",
        target: '[data-tutorial="wisdom-root"]',
        placement: "bottom",
      },
      {
        title: "Tutorial Button",
        body: "Access this tutorial anytime from the header button.",
        target: '[data-tutorial="global-tutorial-button"]',
        placement: "left",
      },
    ],
  },

  "page:application": {
    title: "Application Section",
    steps: [
      {
        title: "Apply Your Practice",
        body: "Track moments of awareness and seal intentions. This is where practice meets daily life.",
        target: '[data-tutorial="application-root"]',
        placement: "top",
      },
      {
        title: "Get Help",
        body: "Click the tutorial button anytime to review guidance.",
        target: '[data-tutorial="global-tutorial-button"]',
        placement: "left",
      },
    ],
  },

  "page:navigation": {
    title: "Navigation Section",
    steps: [
      {
        title: "Choose Your Path",
        body: "Browse structured learning paths. Use the Path Finder to get recommendations, then select a path to begin your journey.",
        target: '[data-tutorial="navigation-root"]',
        placement: "top",
      },
      {
        title: "Tutorial Access",
        body: "Access tutorials from the header button on any page.",
        target: '[data-tutorial="global-tutorial-button"]',
        placement: "left",
      },
    ],
  },

  "page:photic-beginner": {
    title: "Photonic Beginner Guide",
    steps: [
      {
        title: "Protocol",
        body: "Set the pulse rate and timing style. If alternating, adjust the gap until it feels comfortable.",
        target: '[data-guide-step="protocol"]',
        placement: "right",
      },
      {
        title: "Intensity",
        body: "Set brightness to a comfortable level. Add glow only if it helps stability without strain.",
        target: '[data-guide-step="intensity"]',
        placement: "right",
      },
      {
        title: "Geometry",
        body: "Set radius and spacing so both circles are clear and balanced in your visual field.",
        target: '[data-guide-step="geometry"]',
        placement: "right",
      },
      {
        title: "Color",
        body: "Choose a comfortable color. Link colors if you want symmetry. When satisfied, exit Beginner Mode.",
        target: '[data-guide-step="color"]',
        placement: "right",
      },
    ],
  },

  "practice:breath": {
    title: "Breath Practice",
    steps: [
      {
        title: "Practice selector",
        body: "Choose Breath here.",
        target: '[data-tutorial="practice-selector"]',
        placement: "right",
      },
      {
        title: "Tempo sync",
        body: "Enable tempo matching to sync breathing to music.",
        target: '[data-tutorial="tempo-sync-panel"]',
        placement: "left",
      },
    ],
  },

  "practice:stillness": {
    title: "Stillness Practice",
    steps: [
      {
        title: "Stillness options",
        body: "Adjust the stillness timer and session options here.",
        target: '[data-tutorial="stillness-options"]',
        placement: "left",
      },
    ],
  },
};
