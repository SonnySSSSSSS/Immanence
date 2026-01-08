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
import { useProgressStore } from "../state/progressStore.js";
import { syncFromProgressStore } from "../state/mandalaStore.js";
import { loadPreferences, savePreferences } from "../state/practiceStore.js";
import { ringFXPresets, getCategories } from "../data/ringFXPresets.js";
import { useSessionInstrumentation } from "../hooks/useSessionInstrumentation.js";
import { logPractice } from '../services/cycleManager.js';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { logCircuitCompletion } from '../services/circuitManager.js';
import { PracticeSelectionModal } from "./PracticeSelectionModal.jsx";
import { SacredTimeSlider } from "./SacredTimeSlider.jsx";
import { PeripheralHalo } from "./ui/PeripheralHalo.jsx";
import { BreathPatternPreview } from "./BreathPatternPreview.jsx";
import { SessionSummaryModal } from "./practice/SessionSummaryModal.jsx";
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from "../styles/cardMaterial.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { PostSessionJournal } from "./PostSessionJournal.jsx";
import { useJournalStore } from "../state/journalStore.js";
import { RitualSelectionDeck } from "./RitualSelectionDeck.jsx";
import { PhoticControlPanel } from "./PhoticControlPanel.jsx";

const DEV_FX_GALLERY_ENABLED = true;

const PRACTICE_REGISTRY = {
  breath: {
    id: "breath",
    label: "Breath & Stillness",
    icon: "✦",
    Config: BreathConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  ritual: {
    id: "ritual",
    label: "Ritual Library",
    icon: "◈",
    supportsDuration: false,
    Config: RitualSelectionDeck,
    requiresFullscreen: false,
  },
  circuit: {
    id: "circuit",
    label: "Circuit",
    icon: "↺",
    Config: CircuitConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  cognitive_vipassana: {
    id: "cognitive_vipassana",
    label: "Insight Meditation",
    icon: "👁",
    supportsDuration: true,
    requiresFullscreen: true,
  },
  somatic_vipassana: {
    id: "somatic_vipassana",
    label: "Body Scan",
    icon: "⌬",
    supportsDuration: true,
    requiresFullscreen: false,
  },
  sound: {
    id: "sound",
    label: "Sound",
    icon: "⌇",
    Config: SoundConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  visualization: {
    id: "visualization",
    label: "Visualization",
    icon: "✧",
    Config: VisualizationConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  cymatics: {
    id: "cymatics",
    label: "Cymatics",
    icon: "◍",
    Config: CymaticsConfig,
    supportsDuration: true,
    requiresFullscreen: false,
  },
  photic: {
    id: "photic",
    label: "Photic Circles",
    icon: "☼",
    supportsDuration: false,
    Config: PhoticControlPanel,
    requiresFullscreen: false,
  }
};

const PRACTICE_IDS = Object.keys(PRACTICE_REGISTRY);
const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

function PracticeSelector({ selectedId, onSelect, tokens }) {
  return (
    <div className="w-full max-w-2xl mb-12">
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-3 justify-items-center">
        {PRACTICE_IDS.map((id) => {
          const p = PRACTICE_REGISTRY[id];
          const isActive = selectedId === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full px-4 py-4 rounded-2xl transition-all duration-300 flex flex-col items-center gap-2 group relative overflow-hidden"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                letterSpacing: 'var(--tracking-mythic)',
                textTransform: 'uppercase',
                border: isActive ? `1px solid ${tokens.accent}` : `1px solid ${tokens.border}`,
                background: isActive ? `${tokens.accent}15` : 'rgba(255,255,255,0.01)',
                color: isActive ? tokens.accent : tokens.textMuted,
                boxShadow: isActive ? `0 0 20px ${tokens.accent}20` : 'none',
              }}
            >
              <div className={`text-2xl mb-1 transition-transform duration-500 ${isActive ? 'scale-110 rotate-[360deg]' : 'group-hover:scale-110'}`} style={{ color: isActive ? tokens.accent : tokens.textMuted }}>
                {p.icon}
              </div>
              <span className="text-center leading-tight font-bold">{p.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PracticeOptionsCard({ practiceId, duration, onDurationChange, onStart, tokens, setters, hasExpandedOnce, setHasExpandedOnce }) {
  const cardRef = useRef(null);
  const p = PRACTICE_REGISTRY[practiceId];
  const isCollapsed = !practiceId;

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
      className={`rounded-[32px] relative overflow-hidden w-full transition-all duration-500 ease-out ${isCollapsed ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
      style={{
        maxWidth: 'min(620px, 94vw)',
        maxHeight: isCollapsed ? '88px' : '1000px', // Animating max-height for V1 reveal
        ...tokens.cardStyle,
        border: `1px solid ${isCollapsed ? tokens.border : tokens.borderSelect}`,
        boxShadow: tokens.isLight 
          ? '0 12px 48px rgba(60,50,35,0.12)' 
          : '0 24px 72px rgba(0,0,0,0.6)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={tokens.innerGlow} />
      
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
          className="relative px-8 py-10 animate-in fade-in duration-300"
        >
          {/* Practice Title & Icon */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div 
              className="text-5xl mb-4 drop-shadow-lg"
              style={{ 
                color: tokens.accent,
                filter: 'drop-shadow(0 0 20px var(--accent-30))'
              }}
            >
              {p.icon}
            </div>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '20px', 
              fontWeight: 600,
              letterSpacing: 'var(--tracking-mythic)', 
              textTransform: 'uppercase',
              color: tokens.text,
              textShadow: tokens.isLight ? 'none' : '0 0 15px var(--accent-30)'
            }}>
              {p.label}
            </h2>
            {p.id === 'ritual' && (
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Select an invocation to begin
              </p>
            )}
          </div>

          {/* Dynamic Config Panel */}
          <div className="min-h-[100px] mb-10">
             {p.Config ? (
               <p.Config 
                 {...setters}
                 isLight={tokens.isLight}
                 selectedRitualId={setters.selectedRitualId}
               />
             ) : (
               <div className="flex items-center justify-center py-12 text-xs uppercase tracking-widest opacity-30 font-display">
                 No additional configuration required
               </div>
             )}
          </div>

          {/* Shared Duration Slider - Hidden for Circuit as it manages its own total duration */}
          {p.supportsDuration && practiceId !== 'circuit' && (
            <div className="mb-12">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-center mb-6 opacity-50" style={{ color: tokens.text }}>
                Sacred Duration (minutes)
              </div>
              <SacredTimeSlider 
                value={duration} 
                onChange={onDurationChange} 
                options={DURATIONS} 
              />
            </div>
          )}

          {/* Start Button */}
          {!(practiceId === 'ritual') && (
            <div className="flex justify-center mt-4">
              <button
                onClick={onStart}
                className="group px-16 py-5 rounded-full font-black uppercase tracking-[0.4em] transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
                style={{
                   background: tokens.accent,
                   color: '#050508',
                   boxShadow: `0 10px 40px ${tokens.accent}40`,
                   fontSize: '12px'
                }}
              >
                <span className="relative z-10">{practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice'}</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            </div>
          )}
        </div>
      )}
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
  
  // Theme Tokens for unified styling across components
  const uiTokens = {
    isLight,
    bg: isLight ? 'var(--light-bg-surface)' : 'rgba(15,15,26,1)',
    border: isLight ? 'var(--light-border)' : 'var(--accent-20)',
    borderSelect: isLight ? 'var(--light-border)' : 'var(--accent-40)',
    text: isLight ? 'var(--light-text)' : 'var(--text-primary)',
    textMuted: isLight ? 'var(--light-muted)' : 'var(--text-muted)',
    accent: 'var(--accent-color)',
    cardStyle: isLight ? getCardMaterial(true) : plateauMaterial,
    innerGlow: isLight ? getInnerGlowStyle(true) : innerGlowStyle,
  };

  const savedPrefs = loadPreferences();

  // STABILIZE STATE: Core Selection State
  const [practiceId, setPracticeId] = useState(null);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(false);
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
  
  // Backward compatibility during refactor
  const selectedPractice = PRACTICE_REGISTRY[practiceId] || PRACTICE_REGISTRY.breath;
  const practice = selectedPractice.label;

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
  const setPattern = (val) => updateParams('breath', { pattern: val });
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
      setPractice('Breath & Stillness');
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
      setPractice('Cognitive Vipassana');
    } else if (exercise.practiceType === 'Somatic Vipassana') {
      setPractice('Somatic Vipassana');
      if (exercise.sensoryType) {
        setSensoryType(exercise.sensoryType);
      }
    } else {
      setPractice(exercise.practiceType || 'Breath & Stillness');
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
      recordedSession = useProgressStore.getState().recordSession({
        domain: 'circuit-training',
        duration: totalDuration,
        metadata: {
          circuitName: 'Custom Circuit',
          exerciseCount: circuitConfig.exercises.length,
          legacyImport: false
        },
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
    setPractice('Circuit');
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

      recordedSession = useProgressStore.getState().recordSession({
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
      });

      if (duration >= 10) {
        const now = new Date();
        const timeOfDay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        logPractice({
          type: domain === 'breathwork' ? 'breath' : domain === 'visualization' ? 'focus' : 'body',
          duration: duration,
          timeOfDay: timeOfDay,
        });
      }

      syncFromProgressStore();
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
        duration,
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
    if (!activePracticeSession) return;

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
    if (!practiceId) return;

    savePreferences({
      practiceId,
      duration,
      practiceParams
    });

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
      setPractice(PRACTICES[0]); // Reset to practice selection menu
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
    if (!isRunning) return;
    if (practice === "Ritual") return;

    let interval = null;
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, practice, activeCircuitId]);

  useEffect(() => {
    if (!onBreathStateChange) return;
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

  const breathingPatternForRing = {
    inhale: pattern.inhale,
    holdTop: pattern.hold1,
    exhale: pattern.exhale,
    holdBottom: pattern.hold2,
  };

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
            <div className="flex flex-col items-center justify-center" style={{ overflow: 'visible' }}>
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
                    className={`${isLight ? 'text-[#5A4D3C]/60 hover:text-[#3D3425]' : 'text-white/60 hover:text-white'} transition-colors px-2 py-1`}
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px' }}
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
                    className={`${isLight ? 'text-[#5A4D3C]/60 hover:text-[#3D3425]' : 'text-white/60 hover:text-white'} transition-colors px-2 py-1`}
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px' }}
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
                className="text-[11px] font-medium tracking-[0.15em] uppercase animate-fade-in-up"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  letterSpacing: "var(--tracking-wide)",
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
            setPractice(PRACTICES[0]);
          }
        }}
        onStartNext={(practiceType) => {
          setShowSummary(false);
          setPractice(practiceType);
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

  return (
    <section className="w-full h-full flex flex-col items-center justify-start pt-12 pb-24 overflow-y-auto custom-scrollbar">
      {/* Top Layer: Practice Selector */}
      <PracticeSelector 
        selectedId={practiceId}
        onSelect={setPracticeId}
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
