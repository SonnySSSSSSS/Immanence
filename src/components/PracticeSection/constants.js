// Config components are imported directly by consumers to avoid circular dependencies
// This file only exports configuration data, not React components

export const PRACTICE_REGISTRY = {
  breath: {
    id: "breath",
    label: "Breath & Stillness",
    labelLine1: "BREATH",
    labelLine2: "PRACTICES",
    icon: "✦",
    supportsDuration: true,
    requiresFullscreen: false,
  },
  integration: {
    id: "integration",
    label: "Integration",
    labelLine1: "INTEGRATION",
    labelLine2: "",
    icon: "◈",
    supportsDuration: false,
    configComponent: "RitualSelectionDeck",
    requiresFullscreen: false,
    alias: "ritual",
  },
  circuit: {
    id: "circuit",
    label: "Circuit",
    labelLine1: "CIRCUIT",
    labelLine2: "",
    icon: "↺",
    configComponent: "CircuitConfig",
    supportsDuration: true,
    requiresFullscreen: false,
  },
  awareness: {
    id: "awareness",
    label: "Awareness",
    labelLine1: "AWARENESS",
    labelLine2: "",
    icon: "👁",
    supportsDuration: true,
    requiresFullscreen: false,
    subModes: {
      insight: { id: "cognitive_vipassana", label: "Cognitive" },
      bodyscan: { id: "somatic_vipassana", label: "Somatic" },
      feeling: { id: "feeling", label: "Feeling" }
    },
    defaultSubMode: "insight",
  },
  resonance: {
    id: "resonance",
    label: "Resonance",
    labelLine1: "RESONANCE",
    labelLine2: "",
    icon: "⌇",
    supportsDuration: true,
    requiresFullscreen: false,
    subModes: {
      aural: { id: "sound", label: "Sound", configComponent: "SoundConfig" },
      cymatics: { id: "cymatics", label: "Cymatics", configComponent: "CymaticsConfig" }
    },
    defaultSubMode: "aural",
  },
  perception: {
    id: "perception",
    label: "Perception",
    labelLine1: "PERCEPTION",
    labelLine2: "",
    icon: "✧",
    supportsDuration: true,
    requiresFullscreen: false,
    subModes: {
      visualization: { id: "visualization", label: "Visual", configComponent: "VisualizationConfig" },
      photic: { id: "photic", label: "Photic", configComponent: "PhoticControlPanel" }
    },
    defaultSubMode: "visualization",
  },
};

export const PRACTICE_IDS = Object.keys(PRACTICE_REGISTRY);
export const GRID_PRACTICE_IDS = PRACTICE_IDS.filter(id => id !== 'circuit'); // 8 practices for grid
export const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

// Unified width system for all practice UI components
export const PRACTICE_UI_WIDTH = {
  maxWidth: '560px',
  padding: '16px',
};

export const labelToPracticeId = (label) => {
  if (!label) return 'breath';
  const match = PRACTICE_IDS.find((id) => PRACTICE_REGISTRY[id].label === label);
  return match || 'breath';
};

// Map old practice IDs to new consolidated umbrella IDs
export const OLD_TO_NEW_PRACTICE_MAP = {
  'ritual': 'integration',
  'cognitive_vipassana': 'awareness',
  'somatic_vipassana': 'awareness',
  'feeling': 'awareness',
  'sound': 'resonance',
  'cymatics': 'resonance',
  'visualization': 'perception',
  'photic': 'perception',
};

// Resolve practice ID to current registry (map old IDs to new)
export const resolvePracticeId = (id) => {
  return OLD_TO_NEW_PRACTICE_MAP[id] || id;
};
