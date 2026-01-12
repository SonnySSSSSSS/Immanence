import { CircuitConfig } from "../Cycle/CircuitConfig.jsx";
import { SoundConfig } from "../SoundConfig.jsx";
import { VisualizationConfig } from "../VisualizationConfig.jsx";
import { CymaticsConfig } from "../CymaticsConfig.jsx";
import { RitualSelectionDeck } from "../RitualSelectionDeck.jsx";
import { PhoticControlPanel } from "../PhoticControlPanel.jsx";

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
  ritual: {
    id: "ritual",
    label: "Ritual Library",
    labelLine1: "RITUAL",
    labelLine2: "LIBRARY",
    icon: "◈",
    supportsDuration: false,
    Config: RitualSelectionDeck,
    requiresFullscreen: false,
  },
  circuit: {
    id: "circuit",
    label: "Circuit",
    labelLine1: "CIRCUIT",
    labelLine2: "",
    icon: "↺",
    Config: CircuitConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  cognitive_vipassana: {
    id: "cognitive_vipassana",
    label: "Insight Meditation",
    labelLine1: "INSIGHT",
    labelLine2: "MEDITATION",
    icon: "👁",
    supportsDuration: true,
    requiresFullscreen: true,
  },
  somatic_vipassana: {
    id: "somatic_vipassana",
    label: "Body Scan",
    labelLine1: "BODY SCAN",
    labelLine2: "",
    icon: "⌬",
    supportsDuration: true,
    requiresFullscreen: false,
  },
  sound: {
    id: "sound",
    label: "Sound",
    labelLine1: "SOUND",
    labelLine2: "",
    icon: "⌇",
    Config: SoundConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  visualization: {
    id: "visualization",
    label: "Visualization",
    labelLine1: "VISUALIZATION",
    labelLine2: "",
    icon: "✧",
    Config: VisualizationConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  cymatics: {
    id: "cymatics",
    label: "Cymatics",
    labelLine1: "CYMATICS",
    labelLine2: "",
    icon: "◍",
    Config: CymaticsConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  photic: {
    id: "photic",
    label: "Photic Circles",
    labelLine1: "PHOTIC",
    labelLine2: "CIRCLES",
    icon: "☼",
    supportsDuration: false,
    Config: PhoticControlPanel,
    requiresFullscreen: false,
  }
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
