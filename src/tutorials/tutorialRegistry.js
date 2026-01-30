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

  "practice:circuit": {
    title: "Circuit Mode",
    steps: [
      {
        title: "Circuit exercises",
        body: "Design a multi-practice circuit combining different meditation techniques in sequence.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
      {
        title: "Exercise duration",
        body: "Set the duration for each exercise in your circuit.",
        target: '[data-tutorial="circuit-duration"]',
        placement: "left",
      },
    ],
  },

  "practice:integration": {
    title: "Ritual Integration",
    steps: [
      {
        title: "Select a ritual",
        body: "Choose from guided ritual practices designed to integrate awareness into daily life.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
      {
        title: "Follow the steps",
        body: "Each ritual has structured steps with timed segments for reflection and integration.",
        target: '[data-tutorial="ritual-steps"]',
        placement: "left",
      },
    ],
  },

  "practice:awareness": {
    title: "Awareness Practice",
    steps: [
      {
        title: "Awareness modes",
        body: "Choose from cognitive observation, somatic body scanning, or emotional awareness practice.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
      {
        title: "Observation technique",
        body: "Select your awareness observation method: insight meditation, body scan, or feeling practice.",
        target: '[data-tutorial="awareness-mode-selector"]',
        placement: "left",
      },
    ],
  },

  "practice:cognitive_vipassana": {
    title: "Insight Meditation",
    steps: [
      {
        title: "Cognitive observation",
        body: "Practice neutral observation of thoughts and mental patterns without judgment.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
    ],
  },

  "practice:somatic_vipassana": {
    title: "Body Scan",
    steps: [
      {
        title: "Somatic awareness",
        body: "Progressively scan and observe physical sensations throughout your body.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
    ],
  },

  "practice:feeling": {
    title: "Emotional Awareness",
    steps: [
      {
        title: "Emotional practice",
        body: "Cultivate awareness and capacity for the full range of emotional experience.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
    ],
  },

  "practice:resonance": {
    title: "Resonance & Vibration",
    steps: [
      {
        title: "Sound modes",
        body: "Choose from solfeggio frequencies, cymatics visualization, or binaural beats.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
      {
        title: "Adjust parameters",
        body: "Fine-tune frequency, intensity, and session duration to your preference.",
        target: '[data-tutorial="resonance-config"]',
        placement: "left",
      },
    ],
  },

  "practice:sound": {
    title: "Sound Bath",
    steps: [
      {
        title: "Solfeggio frequencies",
        body: "Experience healing frequencies from 100-500Hz for relaxation and alignment.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
    ],
  },

  "practice:cymatics": {
    title: "Cymatics Visualization",
    steps: [
      {
        title: "Visual harmonics",
        body: "Watch sacred geometric patterns respond to sound frequencies in real-time.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
    ],
  },

  "practice:perception": {
    title: "Perception & Vision",
    steps: [
      {
        title: "Visual practices",
        body: "Choose from sacred geometry visualization, photonic flicker, or visual exploration.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
      {
        title: "Configure visuals",
        body: "Adjust visual parameters like speed, color, and intensity.",
        target: '[data-tutorial="perception-config"]',
        placement: "left",
      },
    ],
  },

  "practice:visualization": {
    title: "Sacred Geometry",
    steps: [
      {
        title: "Geometric forms",
        body: "Meditate on sacred geometric patterns: Flower of Life, Sri Yantra, and more.",
        target: '[data-tutorial="practice-selector"]',
        placement: "bottom",
      },
    ],
  },

  "practice:photic": {
    title: "Photonic Practice",
    steps: [
      {
        title: "Light frequency",
        body: "Adjust pulse rate and flicker pattern for visual entrainment.",
        target: '[data-tutorial="photic-controls"]',
        placement: "left",
      },
      {
        title: "Intensity & color",
        body: "Set brightness and color to a comfortable level for your practice.",
        target: '[data-tutorial="photic-intensity"]',
        placement: "left",
      },
    ],
  },
};
