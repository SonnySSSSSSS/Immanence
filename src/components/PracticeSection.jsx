import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from 'react-dom';
import { InsightMeditationPortal } from './vipassana/InsightMeditationPortal.jsx';
import { BreathingRing } from "./BreathingRing.jsx";
import { VisualizationCanvas } from "./VisualizationCanvas.jsx";
import { CymaticsVisualization } from "./CymaticsVisualization.jsx";
import { SensorySession } from "./SensorySession.jsx";
import { VipassanaVisual } from "./vipassana/VipassanaVisual.jsx";
import { VipassanaVariantSelector } from "./vipassana/VipassanaVariantSelector.jsx";
import { NavigationRitualLibrary } from "./NavigationRitualLibrary.jsx";
import { CircuitConfig } from "./Cycle/CircuitConfig.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { VIPASSANA_THEMES } from "../data/vipassanaThemes.js";
import { SoundConfig, BINAURAL_PRESETS, ISOCHRONIC_PRESETS, SOUND_TYPES } from "./SoundConfig.jsx";
import { BreathConfig, BREATH_PRESETS } from "./BreathConfig.jsx";
import { SensoryConfig, SENSORY_TYPES } from "./SensoryConfig.jsx";
import { VisualizationConfig } from "./VisualizationConfig.jsx";
import { CymaticsConfig } from "./CymaticsConfig.jsx";
import { SOLFEGGIO_SET } from "../utils/frequencyLibrary.js";
import { loadPreferences, savePreferences } from "../state/practiceStore.js";
import { ringFXPresets, getCategories } from "../data/ringFXPresets.js";
import { useSessionInstrumentation } from "../hooks/useSessionInstrumentation.js";
import { recordPracticeSession } from '../services/sessionRecorder.js';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { logCircuitCompletion } from '../services/circuitManager.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { SacredTimeSlider } from "./SacredTimeSlider.jsx";
import { SessionSummaryModal } from "./practice/SessionSummaryModal.jsx";
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from "../styles/cardMaterial.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { PostSessionJournal } from "./PostSessionJournal.jsx";
import { useJournalStore } from "../state/journalStore.js";
import { RitualSelectionDeck } from "./RitualSelectionDeck.jsx";
import { PhoticControlPanel } from "./PhoticControlPanel.jsx";
import { BreathPhaseIndicator } from "./BreathPhaseIndicator.jsx";
import { BreathPathChart } from "./BreathPathChart.jsx";
import { BreathWaveVisualization } from "./BreathWaveVisualization.jsx";
import BreathWaveform from "./BreathWaveform.jsx";
import { TrajectoryCard } from "./TrajectoryCard.jsx";
import { ARCHIVE_TABS, REPORT_DOMAINS } from "./tracking/archiveLinkConstants.js";
import { useBreathBenchmarkStore } from "../state/breathBenchmarkStore.js";

const DEV_FX_GALLERY_ENABLED = true;

const PRACTICE_REGISTRY = {
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

const PRACTICE_IDS = Object.keys(PRACTICE_REGISTRY);
const GRID_PRACTICE_IDS = PRACTICE_IDS.filter(id => id !== 'circuit'); // 8 practices for grid
const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

// Unified width system for all practice UI components
const PRACTICE_UI_WIDTH = {
  maxWidth: '560px',
  padding: '16px',
};
const labelToPracticeId = (label) => {
  if (!label) return 'breath';
  const match = PRACTICE_IDS.find((id) => PRACTICE_REGISTRY[id].label === label);
  return match || 'breath';
};

// Inline SVG Icons for Practice Cards
const PracticeIcons = {
  breath: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 24C8 24 12 16 24 16C36 16 40 24 40 24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 28C12 28 16 22 24 22C32 22 36 28 36 28" stroke={color} strokeWidth="1" opacity="0.6" strokeLinecap="round"/>
      <path d="M16 32C16 32 19 28 24 28C29 28 32 32 32 32" stroke={color} strokeWidth="1" opacity="0.3" strokeLinecap="round"/>
      <circle cx="24" cy="12" r="2" fill={color}/>
    </svg>
  ),
  ritual: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 8L38 32H10L24 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M24 8V32" stroke={color} strokeWidth="1" opacity="0.5"/>
      <path d="M17 20L31 20" stroke={color} strokeWidth="1" opacity="0.5"/>
      <rect x="14" y="36" width="20" height="4" rx="1" stroke={color} strokeWidth="1"/>
    </svg>
  ),
  insight: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M14 36C14 30 18 26 24 26C30 26 34 30 34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 20C12 24 12 30 12 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <path d="M30 20C36 24 36 30 36 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
    </svg>
  ),
  bodyScan: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 6C26.21 6 28 7.79 28 10C28 12.21 26.21 14 24 14C21.79 14 20 12.21 20 10C20 7.79 21.79 6 24 6Z" stroke={color} strokeWidth="1.5"/>
      <path d="M24 14V30M24 30L18 42M24 30L30 42M24 18L14 26M24 18L34 26" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4"/>
    </svg>
  ),
  sound: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16 18H10V30H16L24 38V10L16 18Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M30 16C33 19 33 29 30 32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M36 12C41 17 41 31 36 36" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  visualization: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 24C8 24 14 12 24 12C34 12 40 24 40 24C40 24 34 36 24 36C14 36 8 24 8 24Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="5" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="2" fill={color}/>
    </svg>
  ),
  cymatics: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="1.5" opacity="0.7"/>
      <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.5"/>
      <path d="M24 6V42M6 24H42" stroke={color} strokeWidth="0.5" opacity="0.3"/>
    </svg>
  ),
  photic: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1.5" strokeDasharray="2 4" opacity="0.3"/>
      <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6"/>
      <circle cx="24" cy="24" r="10" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="4" fill={color}/>
    </svg>
  ),
};

function PracticeSelector({ selectedId, onSelect, tokens }) {
  const displayMode = useDisplayModeStore(s => s.mode);
  const isSanctuary = displayMode === 'sanctuary';
  const isLight = tokens?.isLight;
  
  return (
    <div className="w-full" style={{ marginBottom: isSanctuary ? '28px' : '16px' }}>
      <div 
        className="grid justify-items-stretch"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          columnGap: isSanctuary ? '18px' : '8px',
          rowGap: isSanctuary ? '18px' : '8px',
          maxWidth: isSanctuary ? '656px' : '100%',
          margin: '0 auto',
          paddingLeft: isSanctuary ? '16px' : '10px',
          paddingRight: isSanctuary ? '16px' : '10px',
        }}
      >
        {GRID_PRACTICE_IDS.map((id) => {
          const p = PRACTICE_REGISTRY[id];
          const isActive = selectedId === id;
          const IconComponent = PracticeIcons[id] || PracticeIcons.breath;
          const iconColor = isActive ? 'var(--accent-color)' : 'var(--accent-60)';
          
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group practice-tab relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center gap-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isSanctuary ? '10px' : '8px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: isSanctuary ? '20px 12px' : '8px 6px',
                minHeight: isSanctuary ? '115px' : '70px',
                aspectRatio: isSanctuary ? '1 / 1.1' : '1 / 1',
                borderRadius: '16px',
                // Glassmorphic background with neon edge glow
                background: isActive 
                  ? 'linear-gradient(135deg, var(--accent-20) 0%, var(--accent-15) 50%, rgba(15, 20, 25, 0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: isActive ? 'blur(24px) saturate(180%)' : 'blur(16px) saturate(120%)',
                WebkitBackdropFilter: isActive ? 'blur(24px) saturate(180%)' : 'blur(16px) saturate(120%)',
                border: isActive 
                  ? '2px solid rgba(212, 175, 55, 0.9)' 
                  : '1px solid rgba(255, 255, 255, 0.12)',
                // Neon edge glow with multiple shadow layers for depth
                boxShadow: isActive 
                  ? `0 0 2px var(--accent-color),
                     0 0 8px var(--accent-80),
                     0 0 16px var(--accent-60),
                     0 0 32px var(--accent-40),
                     0 8px 32px rgba(0, 0, 0, 0.5),
                     inset 0 0 20px var(--accent-15),
                     inset 0 1px 0 rgba(255, 255, 255, 0.3),
                     inset 0 -1px 0 rgba(0, 0, 0, 0.5),
                     0 0 0 3px rgba(212, 175, 55, 0.95),
                     0 0 18px rgba(212, 175, 55, 0.6)` 
                  : `0 0 1px rgba(255, 255, 255, 0.3),
                     0 8px 24px rgba(0, 0, 0, 0.3),
                     0 2px 8px rgba(0, 0, 0, 0.2),
                     inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                color: 'var(--practice-card-text)',
                textShadow: isActive
                  ? '0 0 16px var(--practice-card-glow), 0 2px 4px rgba(0, 0, 0, 0.8)'
                  : '0 1px 2px rgba(0, 0, 0, 0.5)',
                opacity: isActive ? 1 : 0.75,
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isActive ? 'translateY(-2px) scale(1.01)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                  e.currentTarget.style.backdropFilter = 'blur(20px) saturate(150%)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent-15) 0%, rgba(255, 255, 255, 0.04) 100%)';
                  e.currentTarget.style.border = '1px solid rgba(212, 175, 55, 0.8)';
                  e.currentTarget.style.boxShadow = `0 0 2px var(--accent-80),
                                                      0 0 8px var(--accent-60),
                                                      0 0 16px var(--accent-40),
                                                      0 8px 28px rgba(0, 0, 0, 0.4),
                                                      inset 0 0 15px var(--accent-10),
                                                      inset 0 1px 0 rgba(255, 255, 255, 0.15),
                                                      0 0 0 2px rgba(212, 175, 55, 0.9),
                                                      0 0 14px rgba(212, 175, 55, 0.45)`;
                  e.currentTarget.style.textShadow = '0 0 12px var(--practice-card-glow), 0 0 8px rgba(0, 0, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '0.75';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backdropFilter = 'blur(16px) saturate(120%)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(255, 255, 255, 0.3), 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';
                }
              }}
            >
              {/* Ornamental frame overlay (reference-style card border) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: '0',
                  zIndex: 1,
                  opacity: isActive ? 0.9 : 0.55,
                  filter: isActive ? 'drop-shadow(0 0 10px var(--accent-40))' : 'none',
                }}
              >
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="99"
                    height="99"
                    rx="16"
                    stroke={isActive ? 'var(--accent-60)' : 'rgba(255, 255, 255, 0.16)'}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Corner flourishes */}
                  <path
                    d="M2 18 Q2 2 18 2"
                    stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d="M5 14 Q5 5 14 5"
                    stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth="1"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />

                  <g transform="translate(100 0) scale(-1 1)">
                    <path
                      d="M2 18 Q2 2 18 2"
                      stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M5 14 Q5 5 14 5"
                      stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>

                  <g transform="translate(0 100) scale(1 -1)">
                    <path
                      d="M2 18 Q2 2 18 2"
                      stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M5 14 Q5 5 14 5"
                      stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>

                  <g transform="translate(100 100) scale(-1 -1)">
                    <path
                      d="M2 18 Q2 2 18 2"
                      stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M5 14 Q5 5 14 5"
                      stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                </svg>
              </div>

              {/* Inline SVG Icon */}
              <div 
                className="transition-transform duration-500" 
                style={{ 
                  marginBottom: '8px',
                  filter: isActive 
                    ? 'drop-shadow(0 0 4px var(--accent-color)) drop-shadow(0 0 8px var(--accent-80)) drop-shadow(0 0 12px var(--accent-60))' 
                    : 'none',
                }}
              >
                <IconComponent color={iconColor} size={isSanctuary ? 32 : 22} />
              </div>
              <div
                className="text-center leading-tight"
                style={{
                  lineHeight: '1.4',
                  color: 'var(--practice-card-text)',
                  textShadow: '0 0 10px var(--practice-card-glow)',
                }}
              >
                <div>{p.labelLine1}</div>
                {p.labelLine2 && <div>{p.labelLine2}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PracticeOptionsCard({ practiceId, duration, onDurationChange, onStart, tokens, setters, hasExpandedOnce, setHasExpandedOnce, onOpenTrajectory }) {
  const cardRef = useRef(null);
  const p = PRACTICE_REGISTRY[practiceId];
  const isCollapsed = !practiceId;
  const viewportMode = useDisplayModeStore(s => s.viewportMode);
  const isSanctuary = viewportMode === 'sanctuary';
  const maxHeightValue = isSanctuary ? '75vh' : '65vh';

  const [showTrajectory, setShowTrajectory] = useState(false);

  useEffect(() => {
    setShowTrajectory(false);
  }, [practiceId]);

  // Intentional Reveal Logic: Scroll into view when expanded
  useEffect(() => {
    if (practiceId && !hasExpandedOnce && cardRef.current) {
      const timer = setTimeout(() => {
        setHasExpandedOnce(true);
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 400); // Wait for CSS transition
      return () => clearTimeout(timer);
    }
  }, [practiceId, hasExpandedOnce]);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden w-full transition-all duration-500 ease-out ${isCollapsed ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
      style={{
        maxWidth: isSanctuary ? '656px' : '560px',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        maxHeight: isCollapsed ? '88px' : maxHeightValue,
        overflow: isCollapsed ? 'hidden' : 'auto',
        zIndex: 1,
      }}
    >
      {/* Glassmorphic Main Panel */}
      <div 
        className="relative"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.55) 0%, rgba(10, 12, 18, 0.65) 50%, rgba(8, 10, 15, 0.75) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '20px',
          padding: '24px',
          minHeight: isCollapsed ? '88px' : 'auto',
          border: '1px solid var(--accent-30)',
          boxShadow: `
            0 12px 48px rgba(0, 0, 0, 0.6),
            0 4px 16px var(--accent-15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.8),
            inset 0 0 60px var(--accent-10)
          `,
        }}
      >
        {/* Inner decorative border line */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            border: '1px solid var(--accent-25)',
            borderRadius: '10px',
          }}
        />
        
        {/* Corner flourishes - top left */}
        <div className="absolute pointer-events-none" style={{ top: '0', left: '0', width: '40px', height: '40px' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - top right */}
        <div className="absolute pointer-events-none" style={{ top: '0', right: '0', width: '40px', height: '40px', transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - bottom left */}
        <div className="absolute pointer-events-none" style={{ bottom: '0', left: '0', width: '40px', height: '40px', transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - bottom right */}
        <div className="absolute pointer-events-none" style={{ bottom: '0', right: '0', width: '40px', height: '40px', transform: 'scale(-1, -1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="rgba(212, 175, 55, 0.6)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Top highlight line */}
        <div className="absolute top-0 left-[20%] right-[20%] h-[1px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
      
        {isCollapsed ? (
        <div className="h-[88px] flex items-center justify-center">
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '11px', 
            letterSpacing: 'var(--tracking-mythic)', 
            textTransform: 'uppercase',
            color: tokens.textMuted,
            opacity: 0.5
          }}>
            Select a practice to begin config...
          </span>
        </div>
      ) : (
        <div 
          key={practiceId} 
          className="relative px-8 animate-in fade-in duration-300"
        >
          {/* Practice Title & Icon */}
          <div className="flex flex-col items-center text-center" style={{ marginTop: '20px', marginBottom: practiceId === 'breath' ? '16px' : '24px' }}>
            {/* Small decorative star */}
            <div
              style={{
                fontSize: '18px',
                color: '#D4AF37',
                textShadow: '0 0 8px rgba(212, 175, 55, 0.5)',
                marginBottom: '16px'
              }}
            >
              ✦
            </div>
            
            {/* Title with proper typography */}
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '16px', 
              fontWeight: 600,
              letterSpacing: '0.12em', 
              textTransform: 'uppercase',
              color: '#F5E6D3',
              marginBottom: practiceId === 'breath' ? '8px' : '0'
            }}>
              {p.label}
            </h2>
            
            {/* Inline subtitle for breath intentionally removed (redundant with inputs below) */}
            {p.id === 'ritual' && (
              <p className="mt-2 uppercase" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.03em', fontSize: '10px', opacity: 0.5 }}>
                Select an invocation to begin
              </p>
            )}
          </div>

          {/* Dynamic Config Panel */}
          <div className="min-h-[100px]" style={{ marginBottom: practiceId === 'breath' ? '16px' : '32px' }}>
             {practiceId === 'breath' ? (
               <>
                 <div 
                   className="breath-wave-glow"
                   style={{
                     background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 0, 0, 0.1) 100%)',
                     backdropFilter: 'blur(32px) saturate(160%)',
                     WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                     borderRadius: '16px',
                     padding: '20px',
                     border: '1px solid rgba(212, 175, 55, 0.25)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                   }}
                 >
                   <BreathWaveform pattern={setters.pattern} />
                 </div>

                 {/* Breath Phase Input Controls */}
                 <div
                   className="flex justify-center gap-8"
                   style={{ marginTop: '24px', marginBottom: '16px' }}
                 >
                   {[
                     { label: 'INHALE', key: 'inhale', min: 1 },
                     { label: 'HOLD 1', key: 'hold1', min: 0 },
                     { label: 'EXHALE', key: 'exhale', min: 1 },
                     { label: 'HOLD 2', key: 'hold2', min: 0 }
                   ].map((phase) => (
                     <div key={phase.key} className="flex flex-col items-center">
                       <label
                         style={{
                           fontSize: '9px',
                           letterSpacing: '0.12em',
                           color: 'rgba(255,255,255,0.4)',
                           marginBottom: '8px',
                           fontFamily: 'var(--font-display)',
                           fontWeight: 600,
                           textTransform: 'uppercase'
                         }}
                       >
                         {phase.label}
                       </label>
                       <input
                         type="number"
                         min={phase.min}
                         max="60"
                         value={setters.pattern?.[phase.key] ?? (phase.min === 1 ? 4 : 0)}
                         onChange={(e) => {
                           const val = Math.max(phase.min, Math.min(60, parseInt(e.target.value) || 0));
                           setters.setPattern?.((prev) => ({ ...prev, [phase.key]: val }));
                         }}
                         className="breath-input"
                         style={{
                           background: 'rgba(255,255,255,0.03)',
                           border: '1px solid rgba(255,255,255,0.1)',
                           borderRadius: '6px',
                           padding: '6px 0',
                           width: '44px',
                           color: 'var(--accent-color)',
                           textAlign: 'center',
                           fontSize: '18px',
                           fontWeight: 700,
                           fontFamily: 'var(--font-display)',
                           outline: 'none',
                           transition: 'all 200ms'
                         }}
                       />
                     </div>
                   ))}
                 </div>
                 <style>{`
                   .breath-input::-webkit-inner-spin-button,
                   .breath-input::-webkit-outer-spin-button {
                     -webkit-appearance: none;
                     margin: 0;
                   }
                   .breath-input { -moz-appearance: textfield; }
                   .breath-input:focus {
                     border-color: rgba(212, 175, 55, 0.5);
                     background: rgba(212, 175, 55, 0.05);
                     box-shadow: 0 0 12px rgba(212, 175, 55, 0.1);
                   }
                   .breath-wave-glow {
                     position: relative;
                   }
                   .breath-wave-glow::before {
                     content: "";
                     position: absolute;
                     inset: -12px;
                     background: radial-gradient(
                       ellipse at center,
                       rgba(233,195,90,0.25),
                       rgba(233,195,90,0.12) 40%,
                       rgba(233,195,90,0.04) 60%,
                       transparent 70%
                     );
                     filter: blur(18px);
                     pointer-events: none;
                     z-index: 0;
                     animation: breath-pulse-glow 8s infinite ease-in-out;
                   }
                   .breath-wave-glow > * {
                     position: relative;
                     z-index: 1;
                   }
                   @keyframes breath-pulse-glow {
                     0%, 100% { opacity: 0.7; }
                     50%      { opacity: 1; }
                   }
                   .practice-tab::before {
                     content: '';
                     position: absolute;
                     inset: 0;
                     border-radius: 16px;
                     background: radial-gradient(circle at 50% 50%, rgba(233,195,90,0.3) 0%, transparent 70%);
                     opacity: 0;
                     transition: opacity 0.4s;
                     pointer-events: none;
                   }
                   .practice-tab:hover::before {
                     opacity: 0.6;
                   }
                 `}</style>
               </>
             ) : p.Config ? (
               <p.Config 
                 {...setters}
                 isLight={tokens.isLight}
                 selectedRitualId={setters.selectedRitualId}
               />
             ) : (
               <div className="flex items-center justify-center py-12" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: 0.4, fontWeight: 500 }}>
                 No additional configuration required
               </div>
             )}
          </div>

          {/* Shared Duration Slider - Hidden for Circuit as it manages its own total duration */}
          {p.supportsDuration && practiceId !== 'circuit' && (
            <div style={{ marginBottom: practiceId === 'breath' ? '24px' : '40px' }}>
              <div className="font-bold uppercase text-center" style={{ fontFamily: 'var(--font-display)', color: 'rgba(245, 230, 211, 0.5)', marginBottom: practiceId === 'breath' ? '16px' : '24px', letterSpacing: '0.12em', fontSize: '10px', fontWeight: 600, opacity: 1 }}>
                Sacred Duration (minutes)
              </div>
              <SacredTimeSlider 
                value={duration} 
                onChange={onDurationChange} 
                options={DURATIONS} 
              />
            </div>
          )}

          {/* Start Button - Sacred Portal with Ember Theme */}
          {!(practiceId === 'ritual') && (
            <div className="flex flex-col items-center" style={{ marginTop: '32px', marginBottom: '24px' }}>
              <button
                onClick={onStart}
                className="group transition-all duration-300 relative overflow-hidden begin-button"
                style={{
                   width: '100%',
                   maxWidth: '400px',
                   fontFamily: 'var(--font-display)',
                   fontSize: '12px',
                   fontWeight: 700,
                   letterSpacing: '0.15em',
                   textTransform: 'uppercase',
                   padding: '18px 52px',
                   borderRadius: '60px',
                   background: 'var(--ui-button-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)))',
                   color: '#0a0a0a',
                   textShadow: '0 0 10px var(--accent-color)',
                   boxShadow: `
                     0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.8),
                     inset 0 0 30px rgba(255, 255, 255, 0.25),
                     0 8px 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55)
                   `,
                   transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                   position: 'relative',
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = `
                    0 0 100px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 1),
                    inset 0 0 35px rgba(255, 255, 255, 0.35),
                    0 12px 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.75)
                  `;
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `
                    0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.8),
                    inset 0 0 30px rgba(255, 255, 255, 0.25),
                    0 8px 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55)
                  `;
                }}
              >
                {/* Radial glow backdrop with fiery pulse */}
                <div
                  className="portal-glow"
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    background: 'radial-gradient(circle at center, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.6) 0%, transparent 70%)',
                    opacity: 0.7,
                    filter: 'blur(15px)',
                    zIndex: -1,
                    animation: 'portal-pulse 3s infinite ease-in-out',
                  }}
                />
                {/* Ripple effect on hover */}
                <div
                  className="portal-ripple"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '60px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
                    opacity: 0,
                    transform: 'scale(0.5)',
                    transition: 'all 0.6s ease-out',
                    pointerEvents: 'none',
                  }}
                />
                <span className="relative z-10">{practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice'}</span>
              </button>
              <style>{`
                @keyframes portal-pulse {
                  0%, 100% { opacity: 0.7; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.05); }
                }
                .begin-button:hover .portal-ripple {
                  opacity: 1 !important;
                  transform: scale(1.1) !important;
                }
              `}</style>

              {practiceId === 'breath' && (
                <div className="w-full" style={{ maxWidth: '430px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setShowTrajectory(v => !v)}
                    className="w-full text-[9px] font-black uppercase tracking-[0.35em] transition-opacity"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'rgba(253, 251, 245, 0.85)',
                      opacity: showTrajectory ? 0.95 : 0.55,
                      padding: '10px 12px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(10, 12, 18, 0.35)',
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                    }}
                  >
                    {showTrajectory ? 'Hide Trajectory' : 'Show Trajectory'}
                  </button>

                  {showTrajectory && (
                    <div style={{ marginTop: '12px' }}>
                      <TrajectoryCard onTap={() => onOpenTrajectory?.()} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function ScrollingWheel({ value, onChange, options, colorScheme = 'dark' }) {
  const isLight = colorScheme === 'light';
  const wheelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const itemHeight = 48;
  const visibleItems = 3;

  useEffect(() => {
    const index = options.indexOf(value);
    if (index !== -1) {
      setScrollOffset(index * itemHeight);
    }
  }, [value, options, itemHeight]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaY = startY - e.clientY;
    const newOffset = Math.max(0, Math.min(scrollOffset + deltaY, (options.length - 1) * itemHeight));
    setScrollOffset(newOffset);
    setStartY(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const nearestIndex = Math.round(scrollOffset / itemHeight);
    const snappedOffset = nearestIndex * itemHeight;
    setScrollOffset(snappedOffset);
    onChange(options[nearestIndex]);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? itemHeight : -itemHeight;
    const newOffset = Math.max(0, Math.min(scrollOffset + delta, (options.length - 1) * itemHeight));
    setScrollOffset(newOffset);

    const nearestIndex = Math.round(newOffset / itemHeight);
    setScrollOffset(nearestIndex * itemHeight);
    onChange(options[nearestIndex]);
  };

  return (
    <div
      ref={wheelRef}
      className="relative overflow-hidden select-none"
      style={{
        height: `${itemHeight * visibleItems}px`,
        width: "120px",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: `${itemHeight}px`,
          background: isLight
            ? "linear-gradient(180deg, var(--light-bg-surface) 0%, transparent 100%)"
            : "linear-gradient(180deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: `${itemHeight}px`,
          background: isLight
            ? "linear-gradient(0deg, var(--light-bg-surface) 0%, transparent 100%)"
            : "linear-gradient(0deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute left-0 right-0 pointer-events-none z-10"
        style={{
          top: `${itemHeight}px`,
          height: `${itemHeight}px`,
          border: "1px solid var(--accent-20)",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.02)"
        }}
      />

      <div
        className="absolute w-full transition-transform duration-200"
        style={{
          transform: `translateY(${itemHeight - scrollOffset}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {options.map((option, index) => {
          const offset = Math.abs(index * itemHeight - scrollOffset);
          const opacity = Math.max(0.2, 1 - offset / (itemHeight * 2));
          const scale = Math.max(0.7, 1 - offset / (itemHeight * 3));

          return (
            <div
              key={option}
              className="flex items-center justify-center"
              style={{
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "var(--tracking-wide)",
                color: "var(--text-primary)",
                opacity,
                transform: `scale(${scale})`,
                transition: "opacity 0.2s, transform 0.2s"
              }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PracticeSection({ onPracticingChange, onBreathStateChange, avatarPath, showCore, showFxGallery = DEV_FX_GALLERY_ENABLED, onNavigate, onOpenPhotic }) {
  const instrumentation = useSessionInstrumentation();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  // Breath benchmark for progressive patterns
  const hasBenchmark = useBreathBenchmarkStore(s => s.hasBenchmark());
  const getPatternForCycle = useBreathBenchmarkStore(s => s.getPatternForCycle);
  const calculateTotalCycles = useBreathBenchmarkStore(s => s.calculateTotalCycles);
  
  // Theme Tokens for unified styling across components
  const uiTokens = {
    isLight,
    bg: isLight ? 'var(--light-bg-surface)' : 'rgba(15,15,26,1)',
    border: isLight ? 'var(--light-border)' : 'rgba(255, 255, 255, 0.08)',
    borderSelect: isLight ? 'var(--light-border)' : 'rgba(252, 211, 77, 0.4)',
    text: isLight ? 'var(--light-text)' : 'var(--text-primary)',
    textMuted: isLight ? 'var(--light-muted)' : 'var(--text-muted)',
    accent: 'var(--accent-color)',
    cardStyle: isLight ? getCardMaterial(true) : plateauMaterial,
    innerGlow: isLight ? getInnerGlowStyle(true) : innerGlowStyle,
  };

  // Load preferences once on mount
  const savedPrefs = React.useRef(loadPreferences()).current;
  const initialPracticeId = savedPrefs.practiceId || 'breath';
  console.log('[PracticeSection v3.17.28] savedPrefs.practiceId:', savedPrefs.practiceId, 'initialPracticeId:', initialPracticeId);

  // STABILIZE STATE: Core Selection State
  const [practiceId, setPracticeId] = useState(initialPracticeId);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(!!initialPracticeId);
  const [duration, setDuration] = useState(savedPrefs.duration || 10);

  // CURRICULUM INTEGRATION
  const {
    getActivePracticeDay,
    getActivePracticeLeg,
    activePracticeSession,
    clearActivePracticeSession,
  } = useCurriculumStore();
  
  // Handle curriculum auto-start and initialization
  useEffect(() => {
    if (activePracticeSession) {
      const activeLeg = getActivePracticeLeg();
      if (activeLeg) {
        const pid = Object.keys(PRACTICE_REGISTRY).find(k => PRACTICE_REGISTRY[k].label === activeLeg.practiceType);
        if (pid) {
          setPracticeId(pid);
          setHasExpandedOnce(true); // Bypass animation for auto-starts
        }
      }
    }
  }, []);

  // STABILIZE STATE: Keyed Parameters Object
  const [practiceParams, setPracticeParams] = useState(savedPrefs.practiceParams);

  const openTrajectoryReport = useCallback(() => {
    const detail = { tab: ARCHIVE_TABS.REPORTS, reportDomain: REPORT_DOMAINS.PRACTICE };
    try {
      window.__immanence_pending_archive = detail;
    } catch {
      // ignore
    }
    onNavigate?.(null);
    // HomeHub mounts after navigation; dispatch shortly after for best reliability.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('immanence-open-archive', { detail }));
    }, 50);
  }, [onNavigate]);
  
  // Backward compatibility during refactor
  const selectedPractice = PRACTICE_REGISTRY[practiceId] || PRACTICE_REGISTRY.breath;
  const practice = selectedPractice.label;

  const handleSelectPractice = useCallback((id) => {
    console.log('[PracticeSection v3.17.28] handleSelectPractice called with id:', id);
    setPracticeId(id);
    // Save immediately with current state
    savePreferences({
      practiceId: id,
      duration,
      practiceParams,
    });
  }, [duration, practiceParams]);

  const updateParams = (pid, updates) => {
    setPracticeParams(prev => ({
      ...prev,
      [pid]: { ...prev[pid], ...updates }
    }));
  };

  // Shared UI states (non-practice specific)
  const [chevronAngle, setChevronAngle] = useState(0);
  const [haloPulse, setHaloPulse] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isStarting, setIsStarting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [lastSessionId, setLastSessionId] = useState(null);
  const { startMicroNote, pendingMicroNote } = useJournalStore();

  // Practice session internals
  const [activeCircuitId, setActiveCircuitId] = useState(null);
  const [circuitConfig, setCircuitConfig] = useState(null);
  const [circuitExerciseIndex, setCircuitExerciseIndex] = useState(0);
  const [circuitSavedPractice, setCircuitSavedPractice] = useState(null);
  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);
  const [breathCount, setBreathCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [visualizationCycles, setVisualizationCycles] = useState(0);
  const [activeRitual, setActiveRitual] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Sound/Visual ephemeral state
  const [vipassanaVariant, setVipassanaVariant] = useState('thought-labeling');
  const [showVipassanaVariantModal, setShowVipassanaVariantModal] = useState(false);

  // Ring FX ephemeral state
  const [currentFxIndex, setCurrentFxIndex] = useState(0);
  const currentFxPreset = showFxGallery ? ringFXPresets[currentFxIndex] : null;

  // REFACTOR BRIDGE: Map practiceParams to legacy variable names for stable behavior
  const { preset, pattern } = practiceParams.breath;
  const { 
    soundType, 
    volume: soundVolume, 
    binauralPresetId, 
    isochronicPresetId, 
    carrierFrequency 
  } = practiceParams.sound;
  const { 
    geometry, 
    fadeInDuration, 
    displayDuration, 
    fadeOutDuration, 
    voidDuration, 
    audioEnabled 
  } = practiceParams.visualization;
  const { 
    frequencySet, 
    selectedFrequencyIndex, 
    driftEnabled,
    audioEnabled: cymaticsAudioEnabled 
  } = practiceParams.cymatics;

  // Vipassana params correspond to specific visualization types
  const isCognitive = practiceId === 'cognitive_vipassana';
  const vTarget = isCognitive ? 'cognitive_vipassana' : 'somatic_vipassana';
  // Insight Meditation (Cognitive) = Sakshi, Body Scan (Somatic) = BodyScan
  const sensoryType = isCognitive ? 'sakshi' : 'bodyScan';
  const { vipassanaTheme, vipassanaElement } = practiceParams[vTarget];

  // Derived variant for VipassanaVisual
  const effectiveVipassanaVariant = isCognitive ? 'sakshi' : 'thought-labeling';

  // Derived Values
  const selectedFrequency = SOLFEGGIO_SET[selectedFrequencyIndex] || SOLFEGGIO_SET[4];
  const binauralPreset = BINAURAL_PRESETS.find(p => p.name === binauralPresetId) || BINAURAL_PRESETS[0];
  const isochronicPreset = ISOCHRONIC_PRESETS.find(p => p.name === isochronicPresetId) || ISOCHRONIC_PRESETS[0];

  // HELPER SETTERS: Bridging old calls to new updateParams logic
  const setPreset = (val) => updateParams('breath', { preset: val });
  const setPattern = (val) => {
    if (typeof val === 'function') {
      // Handle updater function
      setPracticeParams(prev => ({
        ...prev,
        breath: { ...prev.breath, pattern: val(prev.breath.pattern) }
      }));
    } else {
      // Handle direct value
      updateParams('breath', { pattern: val });
    }
  };
  const setSoundType = (val) => updateParams('sound', { soundType: val });
  const setSoundVolume = (val) => updateParams('sound', { volume: val });
  const setBinauralPreset = (val) => updateParams('sound', { binauralPresetId: val?.name || val });
  const setIsochronicPreset = (val) => updateParams('sound', { isochronicPresetId: val?.name || val });
  const setCarrierFrequency = (val) => updateParams('sound', { carrierFrequency: val });
  const setSensoryType = (val) => updateParams(vTarget, { sensoryType: val });
  const setVipassanaTheme = (val) => updateParams(vTarget, { vipassanaTheme: val });
  const setVipassanaElement = (val) => updateParams(vTarget, { vipassanaElement: val });
  const setGeometry = (val) => updateParams('visualization', { geometry: val });
  const setFadeInDuration = (val) => updateParams('visualization', { fadeInDuration: val });
  const setDisplayDuration = (val) => updateParams('visualization', { displayDuration: val });
  const setFadeOutDuration = (val) => updateParams('visualization', { fadeOutDuration: val });
  const setVoidDuration = (val) => updateParams('visualization', { voidDuration: val });
  const setAudioEnabled = (val) => updateParams('visualization', { audioEnabled: val });
  const setFrequencySet = (val) => updateParams('cymatics', { frequencySet: val });
  const setSelectedFrequency = (val) => {
    const idx = SOLFEGGIO_SET.findIndex(f => f.hz === val.hz);
    updateParams('cymatics', { selectedFrequencyIndex: idx !== -1 ? idx : 4 });
  };
  const setDriftEnabled = (val) => updateParams('cymatics', { driftEnabled: val });

  const handlePrevFx = () => {
    setCurrentFxIndex(prev => (prev - 1 + ringFXPresets.length) % ringFXPresets.length);
  };

  const handleNextFx = () => {
    setCurrentFxIndex(prev => (prev + 1) % ringFXPresets.length);
  };

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isRunning]);

  useEffect(() => {
    let animationId;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      const chevronPhase = (elapsed % 3000) / 3000;
      const angle = Math.sin(chevronPhase * Math.PI * 2) * 8;
      setChevronAngle(angle);

      const haloPhase = (elapsed % 5000) / 5000;
      const pulse = (Math.sin(haloPhase * Math.PI * 2) + 1) / 2;
      setHaloPulse(pulse);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Auto-save preferences when they change (but not during active practice)
  useEffect(() => {
    if (!isRunning) {
      savePreferences({
        practiceId,
        duration,
        practiceParams
      });
    }
  }, [practiceId, duration, practiceParams, isRunning]);

  useEffect(() => {
    if (preset && BREATH_PRESETS[preset]) {
      setPattern(BREATH_PRESETS[preset]);
    }
  }, [preset]);

  useEffect(() => {
    if (practice === "Circuit" && !circuitConfig) {
      const defaultExercises = [
        { exercise: { id: 'breath', name: 'Breath Training', type: 'breath', practiceType: 'Breath & Stillness', preset: 'box' }, duration: 5 },
        { exercise: { id: 'cognitive', name: 'Cognitive Vipassana', type: 'focus', practiceType: 'Cognitive Vipassana' }, duration: 5 },
        { exercise: { id: 'somatic', name: 'Somatic Vipassana', type: 'body', practiceType: 'Somatic Vipassana', sensoryType: 'body' }, duration: 5 },
      ];
      setCircuitConfig({ exercises: defaultExercises, exerciseDuration: 5 });
    }
  }, [practice, circuitConfig]);

  const setupCircuitExercise = (exerciseItem) => {
    const { exercise, duration: exDuration } = exerciseItem;

    if (exercise.practiceType === 'Breath & Stillness') {
      setPracticeId('breath');
      if (exercise.preset) {
        const presetKey = Object.keys(BREATH_PRESETS).find(
          k => k.toLowerCase() === exercise.preset.toLowerCase()
        );
        if (presetKey && BREATH_PRESETS[presetKey]) {
          setPattern(BREATH_PRESETS[presetKey]);
          setPreset(presetKey);
        }
      }
    } else if (exercise.practiceType === 'Cognitive Vipassana') {
      setPracticeId('cognitive_vipassana');
    } else if (exercise.practiceType === 'Somatic Vipassana') {
      setPracticeId('somatic_vipassana');
      if (exercise.sensoryType) {
        setSensoryType(exercise.sensoryType);
      }
    } else {
      setPracticeId(labelToPracticeId(exercise.practiceType));
    }

    setDuration(exDuration);
    setTimeLeft(exDuration * 60);

    setIsRunning(true);
    onPracticingChange && onPracticingChange(true);
    setSessionStartTime(performance.now());
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);
  };

  const handleExerciseComplete = () => {
    if (activeCircuitId && circuitConfig) {
      advanceCircuitExercise();
    } else {
      handleStop();
    }
  };

  const advanceCircuitExercise = () => {
    if (!activeCircuitId || !circuitConfig) return;

    const nextIndex = circuitExerciseIndex + 1;
    if (nextIndex < circuitConfig.exercises.length) {
      setCircuitExerciseIndex(nextIndex);
      const nextExercise = circuitConfig.exercises[nextIndex];
      setupCircuitExercise(nextExercise);
    } else {
      handleCircuitComplete();
    }
  };

  const handleCircuitComplete = () => {
    clearActivePracticeSession();
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);

    logCircuitCompletion('custom', circuitConfig.exercises);

    const totalDuration = circuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0);

    let recordedSession = null;
    try {
      recordedSession = recordPracticeSession({
        domain: 'circuit-training',
        duration: totalDuration,
        metadata: {
          circuitName: 'Custom Circuit',
          exerciseCount: circuitConfig.exercises.length,
          legacyImport: false
        },
        exitType: 'completed',
      });
    } catch (e) {
      console.error("Failed to save circuit session:", e);
    }

    setSessionSummary({
      type: 'circuit',
      circuitName: 'Custom Circuit',
      exercisesCompleted: circuitConfig.exercises.length,
      totalDuration: totalDuration,
    });
    setShowSummary(true);

    if (recordedSession) {
      setLastSessionId(recordedSession.id);
      startMicroNote(recordedSession.id);
    }

    setActiveCircuitId(null);
    setCircuitExerciseIndex(0);
    setPracticeId('circuit');
  };

  const handlePatternChange = (key, value) => {
    setPattern((prev) => ({
      ...prev,
      [key]: Number.parseInt(value, 10) || 0,
    }));
    setPreset(null);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")} `;
  };

  const handleStop = () => {
    // Capture curriculum context BEFORE clearing
    const savedActivePracticeSession = activePracticeSession;
    const isCircuitSession = activeCircuitId && circuitConfig;

    // If this is a circuit session, delegate to circuit handler
    if (isCircuitSession) {
      handleCircuitComplete();
      return;
    }
    const wasFromCurriculum = savedActivePracticeSession;

    // Now clear the session
    clearActivePracticeSession();
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    onBreathStateChange && onBreathStateChange(null);

    const exitType = timeLeft <= 0 ? 'completed' : 'abandoned';
    const instrumentationData = instrumentation.endSession(exitType);

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

    const tapCount = tapErrors.length;
    let avgErrorMs = null;
    let bestErrorMs = null;

    if (tapCount > 0) {
      avgErrorMs = Math.round(
        tapErrors.reduce((sum, v) => sum + Math.abs(v), 0) / tapCount
      );
      bestErrorMs = Math.round(
        Math.min(...tapErrors.map(e => Math.abs(e)))
      );
    }

    let subType = null;
    if (practice === "Somatic Vipassana") subType = sensoryType;
    if (practice === "Sound") subType = soundType;
    if (practice === "Visualization") subType = geometry;
    if (practice === "Cymatics") subType = `${selectedFrequency.hz} Hz - ${selectedFrequency.name} `;
    if (practice === "Ritual") subType = activeRitual?.id;

    const sessionPayload = {
      id,
      date: new Date().toISOString(),
      type: practice.toLowerCase(),
      subType,
      durationMinutes: duration,
      pattern: practice === "Breath & Stillness" ? { ...pattern } : null,
      tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
    };

    let recordedSession = null;
    try {
      let domain = 'breathwork';
      const p = practice.toLowerCase();
      if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
      else if (p === 'somatic vipassana') domain = sensoryType;
      else if (p === 'ritual') domain = 'ritual';
      else if (p === 'sound') domain = 'sound';

      recordedSession = recordPracticeSession({
        domain,
        duration: duration,
        metadata: {
          subType,
          pattern: practice === "Breath & Stillness" ? { ...pattern } : null,
          tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
          ritualId: activeRitual?.id,
          legacyImport: false
        },
        instrumentation: instrumentationData,
        exitType,
        cycleEnabled: true,
        cycleMinDuration: 10,
      });
    } catch (e) {
      console.error("Failed to save session:", e);
    }

    setActiveRitual(null);
    setCurrentStepIndex(0);

    // Use instrumentation duration (in milliseconds) for accurate session length
    const actualDurationSeconds = Math.floor(instrumentationData.duration_ms / 1000);
    const shouldJournal = practice !== 'Ritual' && actualDurationSeconds >= 30;

    // Reset timeLeft for next session
    setTimeLeft(duration * 60);

    // Log leg completion if from curriculum
    let nextLegInfo = null;
    let currentLegNumber = null;
    let totalLegsForDay = null;
    let dailyStatsInfo = null;

    if (wasFromCurriculum && exitType === 'completed') {
      const {
        logLegCompletion,
        getNextIncompleteLeg,
        getDayLegsWithStatus,
        getCurriculumDay,
        practiceTimeSlots
      } = useCurriculumStore.getState();
      const curriculumDay = getActivePracticeDay();

      if (curriculumDay) {
        // Find which leg was just completed
        const completedLegs = getDayLegsWithStatus(savedActivePracticeSession).filter(leg => leg.completed);
        currentLegNumber = completedLegs.length + 1; // Next leg to complete
        totalLegsForDay = curriculumDay.legs ? curriculumDay.legs.length : 1;

        // Log this leg as complete
        logLegCompletion(savedActivePracticeSession, currentLegNumber, {
          duration: actualDurationSeconds / 60,
          focusRating: null, // Will be collected in session summary
          challenges: [],
          notes: '',
        });

        // Get next incomplete leg for "What's Next" display
        const nextLeg = getNextIncompleteLeg();
        if (nextLeg) {
          nextLegInfo = nextLeg.leg;
        }

        // If this is the last leg, calculate daily stats
        if (!nextLeg || currentLegNumber === totalLegsForDay) {
          const allLegsWithStatus = getDayLegsWithStatus(savedActivePracticeSession);
          const totalMinutes = allLegsWithStatus.reduce((sum, leg) =>
            sum + (leg.completion?.duration || 0), 0
          );

          // Calculate precision score from tap stats (if available)
          let precisionScore = 'N/A';
          if (avgErrorMs !== null) {
            // Convert avg error to precision: < 50ms = 5*, < 100ms = 4*, etc.
            if (avgErrorMs < 50) precisionScore = '★★★★★';
            else if (avgErrorMs < 100) precisionScore = '★★★★☆';
            else if (avgErrorMs < 150) precisionScore = '★★★☆☆';
            else if (avgErrorMs < 200) precisionScore = '★★☆☆☆';
            else precisionScore = '★☆☆☆☆';
          }

          // Get tomorrow's practice info
          const tomorrowDay = getCurriculumDay(savedActivePracticeSession + 1);
          const nextPracticeTime = tomorrowDay?.legs?.[0]?.time || practiceTimeSlots[0] || '06:00';
          const nextPracticeType = tomorrowDay?.legs?.[0]?.practiceType || 'Breath & Stillness';

          dailyStatsInfo = {
            totalMinutes: Math.round(totalMinutes),
            precisionScore,
            nextPracticeTime,
            nextPracticeType,
          };
        }
      }
    }

    // Show summary if session was long enough
    if (shouldJournal) {
      setSessionSummary({
        practice,
        duration: Math.round((actualDurationSeconds / 60) * 10) / 10,
        tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
        breathCount,
        exitType,
        nextLeg: nextLegInfo,
        curriculumDayNumber: wasFromCurriculum ? savedActivePracticeSession : null,
        legNumber: currentLegNumber,
        totalLegs: totalLegsForDay,
        dailyStats: dailyStatsInfo,
      });
      setShowSummary(true);

      if (recordedSession) {
        setLastSessionId(recordedSession.id);
        startMicroNote(recordedSession.id);
      }
    }
  };

  const handleFocusRating = (rating) => {
    // Update the leg completion with focus rating
    if (sessionSummary?.curriculumDayNumber) {
      const { logLegCompletion, getDayLegsWithStatus } = useCurriculumStore.getState();
      const completedLegs = getDayLegsWithStatus(sessionSummary.curriculumDayNumber).filter(leg => leg.completed);
      const currentLegNumber = completedLegs.length; // The one that was just marked complete

      // Re-log with focus rating
      logLegCompletion(sessionSummary.curriculumDayNumber, currentLegNumber, {
        duration: sessionSummary.duration,
        focusRating: rating,
        challenges: [],
        notes: '',
      });
    }
  };

  // Load curriculum day settings when active session changes
  useEffect(() => {
    if (!activePracticeSession) {
      return;
    }

    const activeLeg = getActivePracticeLeg();

    if (activeLeg) {
      // Map legacy labels to IDs if necessary
      const pid = Object.keys(PRACTICE_REGISTRY).find(k => PRACTICE_REGISTRY[k].label === activeLeg.practiceType) || "breath";
      
      setPracticeId(pid);

      if (activeLeg.practiceConfig?.duration) {
        setDuration(activeLeg.practiceConfig.duration);
        setTimeLeft(activeLeg.practiceConfig.duration * 60);
      }

      // If there's a breathPattern specified, update the params
      if (activeLeg.practiceConfig?.breathPattern) {
         updateParams('breath', { preset: activeLeg.practiceConfig.breathPattern });
      }

      setIsRunning(true);
      setTimeout(() => {
        executeStart();
      }, 100);
    }
  }, [activePracticeSession]);

  const executeStart = () => {
    if (!practiceId) {
      return;
    }

    savePreferences({
      practiceId,
      duration,
      practiceParams
    });

    const logScheduleAdherenceStart = useNavigationStore.getState().logScheduleAdherenceStart;
    if (logScheduleAdherenceStart) {
      logScheduleAdherenceStart({ actualStartTime: Date.now() });
    }

    if (practiceId === "circuit") {
      if (!circuitConfig || circuitConfig.exercises.length === 0) {
        return;
      }
      setCircuitSavedPractice(practice);
      setActiveCircuitId('custom');
      setCircuitExerciseIndex(0);

      const firstExercise = circuitConfig.exercises[0];
      setupCircuitExercise(firstExercise);
      return;
    }

    if (practiceId === "cognitive_vipassana") {
      // Direct start using the card configuration instead of forcing a modal
      const practiceConfig = PRACTICE_REGISTRY[practiceId];
      setIsRunning(true);
      onPracticingChange && onPracticingChange(true, practiceId, practiceConfig?.requiresFullscreen || false);
      setSessionStartTime(performance.now());
      setTapErrors([]);
      setLastErrorMs(null);
      setLastSignedErrorMs(null);
      setBreathCount(0);

      instrumentation.startSession(
        'focus',
        null,
        sensoryType
      );
      return; 
    }

    const practiceConfig = PRACTICE_REGISTRY[practiceId];
    setIsRunning(true);
    onPracticingChange && onPracticingChange(true, practiceId, practiceConfig?.requiresFullscreen || false);
    setSessionStartTime(performance.now());
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);

    const p = practiceId;
    let domain = 'breathwork';
    if (p === 'visualization' || p === 'cymatics') domain = 'visualization';
    else if (p.includes('vipassana')) domain = isCognitive ? 'focus' : 'body';
    else if (p === 'ritual') domain = 'ritual';
    else if (p === 'sound') domain = 'sound';

    instrumentation.startSession(
      domain,
      activeRitual?.category || null,
      p === 'somatic_vipassana' ? sensoryType : null
    );
  };

  const handleStart = () => {
    // Special handling for Photic practice
    if (practiceId === "photic") {
      onOpenPhotic?.();
      return;
    }

    setIsStarting(true);

    setTimeout(() => {
      setIsStarting(false);
      executeStart();
    }, 1400);
  };

  const handleSelectRitual = (ritual) => {
    setActiveRitual(ritual);
    setCurrentStepIndex(0);
    const totalSeconds = ritual.steps?.reduce((sum, s) => sum + (s.duration || 60), 0) || 600;
    setDuration(Math.ceil(totalSeconds / 60));
    setTimeLeft(totalSeconds);
    handleStart();
  };

  const handleNextStep = () => {
    if (!activeRitual) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeRitual.steps.length) {
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleRitualComplete = () => {
    handleStop();

    // Navigate back to home after ritual completion
    // (ritual doesn't show summary, so we reset to practice selection which shows home)
    setTimeout(() => {
      setPracticeId('breath'); // Reset to practice selection menu
    }, 300);
  };

  const handleAccuracyTap = (errorMs) => {
    if (!isRunning) return;

    instrumentation.recordAliveSignal();

    setLastErrorMs(Math.abs(errorMs));
    setLastSignedErrorMs(errorMs);

    setTapErrors(prev => {
      const updated = [...prev, errorMs];
      if (updated.length > 50) updated.shift();
      return updated;
    });
  };

  useEffect(() => {
    let interval = null;

    if (isRunning && practice !== "Ritual") {
      if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else if (timeLeft === 0) {
        if (activeCircuitId && circuitConfig) {
          advanceCircuitExercise();
        } else {
          handleStop();
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, practice, activeCircuitId]);

  useEffect(() => {
    if (!onBreathStateChange) {
      return;
    }
    
    if (!isRunning || practice !== "Breath & Stillness") {
      onBreathStateChange(null);
      return;
    }
    
    const total = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
    if (!total) {
      onBreathStateChange(null);
      return;
    }

    const now = performance.now() / 1000;
    const cyclePos = (now % total);

    let phase = "inhale";
    let phaseProgress = 0;

    if (cyclePos < pattern.inhale) {
      phase = "inhale";
      phaseProgress = cyclePos / pattern.inhale;
    } else if (cyclePos < pattern.inhale + pattern.hold1) {
      phase = "holdTop";
      phaseProgress =
        (cyclePos - pattern.inhale) / Math.max(pattern.hold1, 0.0001);
    } else if (
      cyclePos <
      pattern.inhale + pattern.hold1 + pattern.exhale
    ) {
      phase = "exhale";
      phaseProgress =
        (cyclePos - (pattern.inhale + pattern.hold1)) /
        Math.max(pattern.exhale, 0.0001);
    } else {
      phase = "holdBottom";
      phaseProgress =
        (cyclePos -
          (pattern.inhale + pattern.hold1 + pattern.exhale)) /
        Math.max(pattern.hold2 || 1, 1);
    }

    onBreathStateChange({
      phase,
      phaseProgress,
    });
  }, [isRunning, practice, pattern, onBreathStateChange]);

  const totalDuration =
    pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2 || 1;
  const width = 100;
  const height = 40;

  const iW = (pattern.inhale / totalDuration) * width;
  const h1W = (pattern.hold1 / totalDuration) * width;
  const eW = (pattern.exhale / totalDuration) * width;

  const pathD = `
    M 0 ${height}
    L ${iW} 0
    L ${iW + h1W} 0
    L ${iW + h1W + eW} ${height}
    L ${width} ${height}
`;

  // Calculate progressive pattern based on benchmark if available
  // Progression: 75% → 85% → 100% by breath count thirds
  const breathingPatternForRing = useMemo(() => {
    if (hasBenchmark && isRunning && practice === "Breath & Stillness") {
      const totalCycles = calculateTotalCycles(duration, pattern);
      const progressivePattern = getPatternForCycle(breathCount + 1, totalCycles);
      if (progressivePattern) {
        return {
          inhale: progressivePattern.inhale,
          holdTop: progressivePattern.hold1,
          exhale: progressivePattern.exhale,
          holdBottom: progressivePattern.hold2,
        };
      }
    }
    // Fallback to static pattern
    return {
      inhale: pattern.inhale,
      holdTop: pattern.hold1,
      exhale: pattern.exhale,
      holdBottom: pattern.hold2,
    };
  }, [hasBenchmark, isRunning, practice, duration, pattern, breathCount, calculateTotalCycles, getPatternForCycle]);

  const theme = useTheme();
  const { primary, secondary, muted, glow } = theme.accent;

  // RENDER PRIORITY 1: Active Practice Session
  if (isRunning) {
    if (practice === "Ritual") {
      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <NavigationRitualLibrary onComplete={handleStop} onNavigate={onNavigate} />
        </section>
      );
    }

    if (practiceId === "cognitive_vipassana") {
      return createPortal(
        <InsightMeditationPortal 
          onExit={activeCircuitId ? handleCircuitComplete : handleStop}
        />,
        document.body
      );
    }

    let buttonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
    let radialGlow = '';
    let buttonShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)';

    let feedbackColor = 'var(--accent-primary)';
    let feedbackText = "";
    let feedbackShadow = "none";

    if (lastSignedErrorMs !== null && practice === "Breath & Stillness") {
      const absError = Math.round(Math.abs(lastSignedErrorMs));

      if (absError > 1000) {
        feedbackColor = '#ef4444';
        feedbackText = "OUT OF BOUNDS";
        feedbackShadow = "0 0 8px rgba(239, 68, 68, 0.5)";
        buttonBg = isLight ? 'linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(180deg, rgba(100,100,100,0.3) 0%, rgba(60,60,60,0.4) 100%)';
        radialGlow = '';
      } else if (absError <= 30) {
        feedbackColor = isLight ? 'var(--text-primary)' : "#f8fafc";
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = isLight ? "none" : "0 0 12px rgba(255,255,255,0.6)";
        buttonBg = isLight ? "linear-gradient(180deg, var(--accent-color) 0%, var(--accent-secondary) 100%)" : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)";
        radialGlow = isLight ? '0 0 40px var(--accent-30)' : '0 0 60px 15px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.7)';
      } else if (absError <= 100) {
        feedbackColor = 'var(--accent-color)';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = '0 0 10px var(--accent-50)';
        buttonBg = 'linear-gradient(180deg, var(--accent-color) 0%, var(--accent-secondary) 100%)';
        radialGlow = '0 0 50px 12px var(--accent-40), 0 0 25px var(--accent-60)';
      } else if (absError <= 300) {
        feedbackColor = '#d97706';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 8px rgba(217, 119, 6, 0.4)";
        buttonBg = 'linear-gradient(180deg, #d97706 0%, #92400e 100%)';
        radialGlow = '0 0 40px 10px rgba(217, 119, 6, 0.3), 0 0 20px rgba(217, 119, 6, 0.5)';
      } else {
        feedbackColor = isLight ? 'var(--text-muted)' : '#9ca3af';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 6px rgba(156, 163, 175, 0.3)";
        buttonBg = 'linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)';
        radialGlow = '0 0 35px 8px rgba(156, 163, 175, 0.25), 0 0 18px rgba(156, 163, 175, 0.4)';
      }
    }

    return (
      <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center pb-12">
        {activeCircuitId && circuitConfig && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: isLight ? 'var(--light-bg-surface)' : 'rgba(0,0,0,0.7)',
              border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-30)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '10px', letterSpacing: 'var(--tracking-mythic)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Circuit
            </span>
            <div className="flex gap-1">
              {circuitConfig.exercises.map((_, idx) => (
                <div
                  key={idx}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: idx < circuitExerciseIndex ? 'var(--accent-color)'
                      : idx === circuitExerciseIndex ? (isLight ? 'var(--text-primary)' : '#fff')
                        : (isLight ? 'rgba(60,50,35,0.2)' : 'rgba(253,251,245,0.2)'),
                    boxShadow: idx === circuitExerciseIndex ? (isLight ? '0 2px 8px rgba(60,50,35,0.2)' : '0 0 8px rgba(255,255,255,0.6)') : 'none',
                  }}
                />
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)' }}>
              {circuitExerciseIndex + 1}/{circuitConfig.exercises.length}
            </span>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center w-full">
          {practice === "Visualization" ? (
            <VisualizationCanvas
              geometry={geometry}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : practice === "Cymatics" ? (
            <CymaticsVisualization
              frequency={selectedFrequency.hz}
              n={selectedFrequency.n}
              m={selectedFrequency.m}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              driftEnabled={driftEnabled}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : practice === "Breath & Stillness" ? (
            <div className="flex flex-col items-center justify-center gap-6" style={{ overflow: 'visible' }}>
              <BreathingRing
                breathPattern={breathingPatternForRing}
                onTap={handleAccuracyTap}
                onCycleComplete={() => setBreathCount(prev => prev + 1)}
                startTime={sessionStartTime}
                pathId={showCore ? null : avatarPath}
                fxPreset={currentFxPreset}
              />
              
              {showFxGallery && (
                <div
                  className="flex items-center gap-3 mt-4 px-4 py-2 rounded-full"
                  style={{
                    background: isLight ? 'var(--light-bg-surface)' : 'rgba(0,0,0,0.5)',
                    border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-20)',
                  }}
                >
                  <button
                    onClick={handlePrevFx}
                    className="transition-colors px-2 py-1"
                    style={{ 
                      fontFamily: 'var(--font-display)', 
                      fontWeight: 600, 
                      fontSize: '16px',
                      color: isLight ? 'rgba(90,77,60,0.6)' : 'rgba(255,255,255,0.6)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isLight ? '#3D3425' : 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isLight ? 'rgba(90,77,60,0.6)' : 'rgba(255,255,255,0.6)'}
                  >
                    ◀
                  </button>
                  <div
                    className="text-center min-w-[200px]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px', marginBottom: '2px' }}>
                      {currentFxPreset?.category}
                    </div>
                    <div>{currentFxPreset?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px', marginTop: '2px' }}>
                      {currentFxIndex + 1} / {ringFXPresets.length}
                    </div>
                  </div>
                  <button
                    onClick={handleNextFx}
                    className="transition-colors px-2 py-1"
                    style={{ 
                      fontFamily: 'var(--font-display)', 
                      fontWeight: 600, 
                      fontSize: '16px',
                      color: isLight ? 'rgba(90,77,60,0.6)' : 'rgba(255,255,255,0.6)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isLight ? '#3D3425' : 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isLight ? 'rgba(90,77,60,0.6)' : 'rgba(255,255,255,0.6)'}
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          ) : practiceId === "somatic_vipassana" ? (
            <SensorySession
              sensoryType={sensoryType}
              duration={duration}
              onStop={handleExerciseComplete}
              onTimeUpdate={(remaining) => setTimeLeft(remaining)}
              isLight={isLight}
            />
          ) : (
            <div className="flex flex-col items-center justify-center animate-fade-in-up">
              <div
                className="text-2xl mb-4 text-center"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  letterSpacing: "var(--tracking-mythic)",
                  color: "var(--accent-color)",
                  textShadow: "0 0 20px var(--accent-30)"
                }}
              >
                {soundType}
              </div>
              <div className="w-32 h-32 rounded-full border border-[var(--accent-20)] flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-[var(--accent-color)] blur-xl"></div>
                <div className="text-4xl opacity-80">✦</div>
              </div>

              <div className="mt-6 w-64">
                <div
                  className="mb-2 flex items-center justify-between"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "8px",
                    fontWeight: 600,
                    letterSpacing: "var(--tracking-wide)",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>Volume</span>
                  <span style={{ color: 'var(--accent-color)' }}>{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="w-full sound-volume-slider"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center z-50">
          <div className="h-6 mb-3 flex items-center justify-center">
            {lastSignedErrorMs !== null && practice === "Breath & Stillness" && (
              <div
                key={lastSignedErrorMs}
                className="font-medium uppercase animate-fade-in-up"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  color: feedbackColor,
                  textShadow: feedbackShadow
                }}
              >
                {feedbackText}
              </div>
            )}
          </div>

          <button
            onClick={handleStop}
            className="rounded-full px-7 py-2.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[200px] relative overflow-hidden"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              letterSpacing: "var(--tracking-mythic)",
              textTransform: "uppercase",
              fontWeight: 600,
              background: buttonBg,
              color: "#050508",
              boxShadow: radialGlow
                ? `${radialGlow}, ${buttonShadow}, inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.15)`
                : `0 0 24px var(--accent-30), ${buttonShadow}, inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.15)`,
              borderRadius: "999px",
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>Stop</span>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
                mixBlendMode: 'soft-light',
                zIndex: 1,
              }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                opacity: 0.06,
                mixBlendMode: 'overlay',
                zIndex: 1,
              }}
            />
          </button>

          <div
            className="mt-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "var(--tracking-mythic)",
              textTransform: "uppercase",
              color: "var(--text-primary)",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {breathCount > 0 && practice === "Breath & Stillness" && (
            <div
              className="mt-2"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "var(--tracking-wide)",
                textTransform: "uppercase",
                color: 'var(--accent-50)',
              }}
            >
              Breath {breathCount}
            </div>
          )}
        </div>

        <style>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.2s ease-out forwards;
          }
          .sound-volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--accent-color);
            cursor: pointer;
            box-shadow: 0 0 8px var(--accent-50);
          }
          .sound-volume-slider::-webkit-slider-runnable-track {
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.2);
          }
          .sound-volume-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--accent-color);
            cursor: pointer;
            border: none;
            box-shadow: 0 0 8px var(--accent-50);
          }
          .sound-volume-slider::-moz-range-track {
            background: transparent;
            border: none;
          }
        `}</style>
      </section>
    );
  }

  // RENDER PRIORITY 2: Session Summary Modal
  if (showSummary && sessionSummary) {
    const { practiceTimeSlots } = useCurriculumStore.getState();
    return (
      <SessionSummaryModal
        summary={sessionSummary}
        practiceTimeSlots={practiceTimeSlots}
        legNumber={sessionSummary.legNumber}
        totalLegs={sessionSummary.totalLegs}
        onContinue={() => {
          setShowSummary(false);
          if (pendingMicroNote) {
            // Journal is already open
          } else {
            // Return to home or practice selection
            setPracticeId('breath');
          }
        }}
        onStartNext={(practiceType) => {
          setShowSummary(false);
          setPracticeId(labelToPracticeId(practiceType));
          // Auto-start the next practice
          setTimeout(() => handleStart(), 500);
        }}
        onFocusRating={handleFocusRating}
      />
    );
  }

  // RENDER PRIORITY 3: Practice Configuration/Selection View
  // Assemble the unified setters/params object for the dynamic config panels
  const configProps = {
    preset, pattern, soundType, soundVolume, binauralPreset, isochronicPreset, carrierFrequency,
    sensoryType, vipassanaTheme, vipassanaElement, geometry, fadeInDuration, displayDuration,
    fadeOutDuration, voidDuration, audioEnabled, frequencySet, selectedFrequency, driftEnabled,
    setPreset, setPattern, setSoundType, setSoundVolume, setBinauralPreset, setIsochronicPreset, 
    setCarrierFrequency, setSensoryType, setVipassanaTheme, setVipassanaElement, setGeometry, 
    setFadeInDuration, setDisplayDuration, setFadeOutDuration, setVoidDuration, setAudioEnabled,
    setFrequencySet, setSelectedFrequency, setDriftEnabled,
    onToggleRunning: handleStart, 
    onSelectRitual: handleSelectRitual, 
    selectedRitualId: activeRitual?.id,
    isEmbedded: true
  };

  const viewportMode = useDisplayModeStore(s => s.viewportMode);
  const isSanctuary = viewportMode === 'sanctuary';

  return (
    <section 
      className="practice-section-container w-full h-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar"
      style={{ paddingTop: '8px', paddingBottom: '16px', position: 'relative' }}
    >
      {/* Radial glow backdrop emanating from center (avatar area) */}
      <div 
        className="practice-radial-glow"
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '60vh',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(233, 195, 90, 0.15) 0%, rgba(233, 195, 90, 0.08) 35%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.6,
        }}
      />
      {/* Circuit Button - Full Width */}
      <div style={{ width: '100%', maxWidth: isSanctuary ? '656px' : '560px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => handleSelectPractice('circuit')}
          className="group relative overflow-hidden transition-all duration-300 w-full flex flex-col items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            padding: '12px 16px',
            minHeight: '48px',
            borderRadius: '12px',
            border: practiceId === 'circuit' ? '1.5px solid var(--accent-70)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 20, 25, 0.12)',
            backdropFilter: 'blur(32px) saturate(140%)',
            WebkitBackdropFilter: 'blur(32px) saturate(140%)',
            color: practiceId === 'circuit' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.6)',
            textShadow: practiceId === 'circuit' ? '0 0 12px var(--accent-40), 0 0 24px var(--accent-20)' : 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (practiceId !== 'circuit') {
              e.currentTarget.style.background = 'rgba(20, 30, 40, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (practiceId !== 'circuit') {
              e.currentTarget.style.background = 'rgba(15, 20, 25, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-color)' }}>CIRCUIT TRAINING</span>
        </button>
      </div>

      {/* Top Layer: Practice Selector */}
      <PracticeSelector 
        selectedId={practiceId}
        onSelect={handleSelectPractice}
        tokens={uiTokens}
      />

      {/* Bottom Layer: Dynamic Options Card */}
      <PracticeOptionsCard 
        practiceId={practiceId}
        duration={duration}
        onDurationChange={setDuration}
        onStart={handleStart}
        tokens={uiTokens}
        params={practiceParams}
        setters={configProps}
        hasExpandedOnce={hasExpandedOnce}
        setHasExpandedOnce={setHasExpandedOnce}
        onOpenTrajectory={openTrajectoryReport}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.1)'}; border-radius: 2px; }
      `}</style>
    </section>
  );
}

export default PracticeSection;
