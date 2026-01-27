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
import { BreathBenchmark } from "./BreathBenchmark.jsx";
import { SensoryConfig, SENSORY_TYPES } from "./SensoryConfig.jsx";
import { VisualizationConfig } from "./VisualizationConfig.jsx";
import { CymaticsConfig } from "./CymaticsConfig.jsx";
import { SOLFEGGIO_SET } from "../utils/frequencyLibrary.js";
import { loadPreferences, savePreferences } from "../state/practiceStore.js";
import { ringFXPresets, getCategories } from "../data/ringFXPresets.js";
import { usePracticeSessionInstrumentation } from "./practice/usePracticeSessionInstrumentation.js";
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { SacredTimeSlider } from "./SacredTimeSlider.jsx";
import { SessionSummaryModal } from "./practice/SessionSummaryModal.jsx";
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from "../styles/cardMaterial.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { PostSessionJournal } from "./PostSessionJournal.jsx";
import { useJournalStore } from "../state/journalStore.js";
import { RitualSelectionDeck } from "./RitualSelectionDeck.jsx";
import { PhoticControlPanel } from "./PhoticControlPanel.jsx";
import { useTempoAudioStore } from "../state/tempoAudioStore.js";
import { BreathPhaseIndicator } from "./BreathPhaseIndicator.jsx";
import { BreathPathChart } from "./BreathPathChart.jsx";
import { BreathWaveVisualization } from "./BreathWaveVisualization.jsx";
import { ARCHIVE_TABS, REPORT_DOMAINS } from "./tracking/archiveLinkConstants.js";
import { useBreathBenchmarkStore } from "../state/breathBenchmarkStore.js";
import { useTempoSyncStore } from "../state/tempoSyncStore.js";
import { useTempoSyncSessionStore } from "../state/tempoSyncSessionStore.js";
import { TempoSyncPanel } from "./TempoSyncPanel.jsx";
import { TempoSyncSessionPanel } from "./TempoSyncSessionPanel.jsx";
import { useBreathSessionState } from "./practice/useBreathSessionState.js";
import { CircuitTrainingSelector } from "./practice/CircuitTrainingSelector.jsx";
import PracticeSectionShell from "./practice/PracticeSectionShell.jsx";
import { FeedbackModal } from "./FeedbackModal.jsx";
import PracticeHeader from "./practice/PracticeHeader.jsx";
import BreathPracticeCard from "./practice/BreathPracticeCard.jsx";
import { SessionControls } from "./practice/SessionControls.jsx";
import PracticeMenu from "./practice/PracticeMenu.jsx";
import { recordPracticeSession } from "../services/sessionRecorder.js";
import { PRACTICE_REGISTRY, PRACTICE_IDS, GRID_PRACTICE_IDS, DURATIONS, OLD_TO_NEW_PRACTICE_MAP, resolvePracticeId } from "./PracticeSection/constants.js";
import { getRitualById } from "../data/bhaktiRituals.js";

// Map string names to actual components (components already imported above)
const CONFIG_COMPONENTS = {
  CircuitConfig,
  SoundConfig,
  VisualizationConfig,
  CymaticsConfig,
  RitualSelectionDeck,
  PhoticControlPanel,
};

const DEV_FX_GALLERY_ENABLED = true;
const DEFAULT_RITUAL_KEY = "immanenceOS.rituals.defaultRitualId";
const LAST_RITUAL_ID_KEY = "immanenceOS.rituals.lastRitualId";
const LAST_RITUAL_AT_KEY = "immanenceOS.rituals.lastRitualAt";

// Safe practice config lookup that resolves old IDs
const getPracticeConfig = (id) => {
  const resolvedId = resolvePracticeId(id);
  return PRACTICE_REGISTRY[resolvedId];
};

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
  integration: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 8L38 32H10L24 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M24 8V32" stroke={color} strokeWidth="1" opacity="0.5"/>
      <path d="M17 20L31 20" stroke={color} strokeWidth="1" opacity="0.5"/>
      <rect x="14" y="36" width="20" height="4" rx="1" stroke={color} strokeWidth="1"/>
    </svg>
  ),
  circuit: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="16" stroke={color} strokeWidth="1.5"/>
      <path d="M24 8V40M8 24H40" stroke={color} strokeWidth="1" opacity="0.5"/>
      <circle cx="24" cy="8" r="2" fill={color}/>
      <circle cx="40" cy="24" r="2" fill={color}/>
      <circle cx="24" cy="40" r="2" fill={color}/>
      <circle cx="8" cy="24" r="2" fill={color}/>
    </svg>
  ),
  awareness: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="1.5"/>
      <path d="M14 36C14 30 18 26 24 26C30 26 34 30 34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 20C12 24 12 30 12 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <path d="M30 20C36 24 36 30 36 30" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
    </svg>
  ),
  resonance: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16 18H10V30H16L24 38V10L16 18Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M30 16C33 19 33 29 30 32" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M36 12C41 17 41 31 36 36" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  feeling: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 36C18 30 12 26 12 20C12 15.6 15.6 12 20 12C22.6 12 24.8 13.2 26 15C27.2 13.2 29.4 12 32 12C36.4 12 40 15.6 40 20C40 26 34 30 28 36L24 40L24 40" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  perception: ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M8 24C8 24 14 12 24 12C34 12 40 24 40 24C40 24 34 36 24 36C14 36 8 24 8 24Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="5" stroke={color} strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="2" fill={color}/>
    </svg>
  ),
};

function PracticeSelector({ selectedId, onSelect }) {
  const items = useMemo(() => {
    return ['breath', 'integration', 'circuit', 'awareness', 'resonance', 'perception'].map((id) => {
      const p = PRACTICE_REGISTRY[id];
      return {
        id: id,
        label: p.label,
        rail: getRailColor(id),
      };
    });
  }, []);

  return (
    <CircuitTrainingSelector 
      items={items}
      value={selectedId}
      onChange={onSelect}
    />
  );
}

function getRailColor(id) {
  const colors = {
    breath: "rgba(52,211,153,0.95)",
    integration: "rgba(245,158,11,0.95)",
    circuit: "rgba(168,85,247,0.95)",
    awareness: "rgba(56,189,248,0.95)",
    resonance: "rgba(245,158,11,0.95)",
    perception: "rgba(96,165,250,0.95)",
  };
  return colors[id] || "rgba(255,255,255,0.65)";
}

function PracticeOptionsCard({ practiceId, duration, onDurationChange, onStart, tokens, setters, hasExpandedOnce, setHasExpandedOnce, onOpenTrajectory, isRunning, tempoSyncEnabled, tempoPhaseDuration, tempoBeatsPerPhase, onRunBenchmark, onDisableBenchmark, breathSubmode, onBreathSubmodeChange }) {
  const cardRef = useRef(null);
  const p = getPracticeConfig(practiceId);
  const practice = p?.label;
  const isCollapsed = !practiceId;
  const viewportMode = useDisplayModeStore(s => s.viewportMode);
  const isSanctuary = viewportMode === 'sanctuary';

  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showTempoSync, setShowTempoSync] = useState(false);
  const [defaultRitualId, setDefaultRitualId] = useState(() => localStorage.getItem(DEFAULT_RITUAL_KEY));
  const label = p?.label;
  const pattern = setters?.pattern;
  const onPatternChange = setters?.setPattern;
  const selectedRitualId = setters?.selectedRitualId;
  const durationOptions = DURATIONS;
  const supportsDuration = p?.supportsDuration;
  const onToggleTrajectory = () => setShowTrajectory(v => !v);
  const menuTitleContainerMarginBottom = practiceId === 'breath' ? '16px' : '24px';
  const menuTitleTextMarginBottom = practiceId === 'breath' ? '8px' : '0';
  const menuConfigPanelMarginBottom = practiceId === 'breath' ? '16px' : '32px';
  const menuShowRitualSubtitle = p?.id === 'ritual';
  const menuShowDuration = p?.supportsDuration && practiceId !== 'circuit';
  const menuDurationMarginBottom = practiceId === 'breath' ? '24px' : '40px';
  const menuDurationTitleMarginBottom = practiceId === 'breath' ? '16px' : '24px';
  const menuShowStartButton = practiceId !== 'ritual';
  const menuStartButtonLabel = practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice';

  useEffect(() => {
    setShowTrajectory(false);
  }, [practiceId]);

  useEffect(() => {
    setDefaultRitualId(localStorage.getItem(DEFAULT_RITUAL_KEY));
  }, [isRunning]);

  useEffect(() => {
    if (selectedRitualId) setDefaultRitualId(selectedRitualId);
  }, [selectedRitualId]);

  useEffect(() => {
    if (practiceId !== 'breath' && breathSubmode !== 'breath') {
      onBreathSubmodeChange('breath');
    }
  }, [practiceId, breathSubmode, onBreathSubmodeChange]);

  useEffect(() => {
    if (practiceId !== 'breath' || breathSubmode !== 'stillness') return;
    setShowTempoSync(false);
    useTempoSyncStore.getState().setEnabled(false);
    useTempoSyncSessionStore.getState().endSession();
    useTempoAudioStore.getState().stop("stillness-submode");
    onDisableBenchmark?.();
  }, [practiceId, breathSubmode, onDisableBenchmark]);

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

  const handleBeginPractice = () => {
    const tempoEnabled = useTempoSyncStore.getState().enabled;
    const st = useTempoAudioStore.getState();

    // Only use song duration if tempo sync is enabled AND a song is loaded
    const songSec =
      tempoEnabled && st.hasSong && st.songDurationSec
        ? Math.max(5, Math.floor(st.songDurationSec - 2))
        : null;

    // Audio will be started by executeStart via window.__tempoSyncStartAudio
    onStart(songSec);
  };
  const handleQuickStartRitual = () => {
    const ritualId = localStorage.getItem(DEFAULT_RITUAL_KEY) || defaultRitualId;
    if (!ritualId) return;

    const ritual = getRitualById(ritualId);
    if (!ritual) return;
    if (ritual?.id) setDefaultRitualId(ritual.id);

    // Prefer the same path the ritual grid uses
    if (typeof setters?.onSelectRitual === "function") {
      setters.onSelectRitual(ritual);
      return;
    }

    // Fallback: set selection + start
    if (typeof setters?.setSelectedRitualId === "function") {
      setters.setSelectedRitualId(ritual.id);
      handleBeginPractice();
      return;
    }
  };

  // Read and compute last-practiced ritual for integration practice
  const lastRitualId = localStorage.getItem(LAST_RITUAL_ID_KEY);
  const lastRitualAtMs = lastRitualId ? parseInt(localStorage.getItem(LAST_RITUAL_AT_KEY) || '0', 10) : 0;
  const isLastRecent = lastRitualAtMs > 0 && (Date.now() - lastRitualAtMs) < (7 * 24 * 60 * 60 * 1000);
  const lastRitual = isLastRecent && lastRitualId ? getRitualById(lastRitualId) : null;
  const lastPracticedLabel = lastRitual ? (lastRitual.name || lastRitual.title || lastRitual.id) : null;

  const handleLastPracticedStart = () => {
    if (!lastRitual) return;

    // Use the same path as Quick Start
    if (typeof setters?.onSelectRitual === "function") {
      setters.onSelectRitual(lastRitual);
      return;
    }

    // Fallback: set selection + start
    if (typeof setters?.setSelectedRitualId === "function") {
      setters.setSelectedRitualId(lastRitual.id);
      handleBeginPractice();
      return;
    }
  };

  const tempoSyncSlot = <TempoSyncPanel isPracticing={isRunning} />;

  return (
    <div
      ref={cardRef}
      className={`relative w-full transition-all duration-500 ease-out ${isCollapsed ? 'opacity-40 grayscale-[0.5] overflow-hidden' : 'opacity-100 overflow-visible'}`}
      style={{
        maxWidth: isSanctuary ? '656px' : '560px',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        maxHeight: isCollapsed ? '88px' : 'none',
        zIndex: 1,
      }}
    >
      {/* Glassmorphic Main Panel */}
      <div 
        className="relative PracticePanelShell overflow-x-hidden"
        style={{
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
        practiceId === 'breath' ? (
          <BreathPracticeCard
            practiceId={practiceId}
            label={label}
            breathSubmode={breathSubmode}
            onBreathSubmodeChange={onBreathSubmodeChange}
            pattern={pattern}
            onPatternChange={onPatternChange}
            onRunBenchmark={onRunBenchmark}
            duration={duration}
            onDurationChange={onDurationChange}
            durationOptions={durationOptions}
            supportsDuration={supportsDuration}
            showTempoSync={showTempoSync}
            onToggleTempoSync={() => setShowTempoSync(!showTempoSync)}
            tempoSyncSlot={tempoSyncSlot}
            onStart={handleBeginPractice}
            showTrajectory={showTrajectory}
            onToggleTrajectory={onToggleTrajectory}
            onOpenTrajectory={onOpenTrajectory}
          />
        ) : (
          <PracticeMenu
            containerKey={practiceId}
            label={label}
            showRitualSubtitle={menuShowRitualSubtitle}
            ritualSubtitleText="Select an invocation to begin"
            titleContainerMarginBottom={menuTitleContainerMarginBottom}
            titleTextMarginBottom={menuTitleTextMarginBottom}
            configPanelMarginBottom={menuConfigPanelMarginBottom}
            practice={p}
            ConfigComponent={p.configComponent ? CONFIG_COMPONENTS[p.configComponent] : null}
            setters={setters}
            isLight={tokens.isLight}
            selectedRitualId={selectedRitualId}
            showDuration={menuShowDuration}
            duration={duration}
            onDurationChange={onDurationChange}
            durationOptions={durationOptions}
            durationMarginBottom={menuDurationMarginBottom}
            durationTitleMarginBottom={menuDurationTitleMarginBottom}
            showStartButton={menuShowStartButton}
            onStart={handleBeginPractice}
            onQuickStart={practiceId === "integration" ? handleQuickStartRitual : undefined}
            onLastPracticedStart={practiceId === "integration" && lastRitual ? handleLastPracticedStart : undefined}
            lastPracticedLabel={practiceId === "integration" && lastRitual ? lastPracticedLabel : undefined}
            startButtonLabel={menuStartButtonLabel}
          />
        ))}
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

export function PracticeSection({ onPracticingChange, onBreathStateChange, avatarPath, showFxGallery = DEV_FX_GALLERY_ENABLED, onNavigate, onOpenPhotic }) {
  const {
    startSession,
    endSession,
    recordAliveSignal,
    recordSession,
    logCircuitCompletionEvent,
  } = usePracticeSessionInstrumentation();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const viewportMode = useDisplayModeStore(s => s.viewportMode);
  const isSanctuary = viewportMode === 'sanctuary';

  // Breath benchmark for progressive patterns
  const benchmark = useBreathBenchmarkStore(s => s.benchmark);
  const hasBenchmark = Boolean(
    benchmark &&
    Number.isFinite(benchmark.inhale) && benchmark.inhale > 0 &&
    Number.isFinite(benchmark.hold1) && benchmark.hold1 > 0 &&
    Number.isFinite(benchmark.exhale) && benchmark.exhale > 0 &&
    Number.isFinite(benchmark.hold2) && benchmark.hold2 > 0
  );
  const getPatternForCycle = useBreathBenchmarkStore(s => s.getPatternForCycle);
  const calculateTotalCycles = useBreathBenchmarkStore(s => s.calculateTotalCycles);
  const getStartingPattern = useBreathBenchmarkStore(s => s.getStartingPattern);
  const hasSong = useTempoAudioStore((s) => s.hasSong);
  const isSongPlaying = useTempoAudioStore((s) => s.isPlaying);
  
  // Tempo sync state for music-synced breathing
  const tempoSyncEnabled = useTempoSyncStore(s => s.enabled);
  const tempoSyncBpm = useTempoSyncStore(s => s.bpm);
  const tempoPhaseDuration = useTempoSyncStore(s => s.getPhaseDuration());
  const tempoBeatsPerPhase = useTempoSyncStore(s => s.beatsPerPhase);

  // Tempo sync session state (3-phase cap schedule)
  const tempoSessionActive = useTempoSyncSessionStore(s => s.isActive);
  const tempoSessionCap = useTempoSyncSessionStore(s => s.segmentCap);
  const tempoSessionEffective = useTempoSyncSessionStore(s => s.effectivePhaseDurations);
  const songDurationSec = useTempoAudioStore(s => s.songDurationSec);

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
  const lastSavedPrefsRef = useRef({
    practiceId: savedPrefs.practiceId,
    duration: savedPrefs.duration,
    practiceParams: savedPrefs.practiceParams,
  });

  // STABILIZE STATE: Core Selection State
  const [practiceId, setPracticeId] = useState(initialPracticeId);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(!!initialPracticeId);
  const [duration, setDuration] = useState(savedPrefs.duration || 10);
  const [showBreathBenchmark, setShowBreathBenchmark] = useState(false);

  // CURRICULUM INTEGRATION
  const {
    getActivePracticeDay,
    getActivePracticeLeg,
    activePracticeSession,
    activePracticeLeg,
    clearActivePracticeSession,
    getCircuit,
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
  const selectedPractice = getPracticeConfig(practiceId) || PRACTICE_REGISTRY.breath;
  const practice = selectedPractice.label;

  const handleSelectPractice = useCallback((id) => {
    console.log('[PracticeSection v3.17.28] handleSelectPractice called with id:', id);
    setPracticeId(id);
    // Save immediately with current state
    // savePreferences({
    //   practiceId: id,
    //   duration,
    //   practiceParams,
    // });
    lastSavedPrefsRef.current = {
      practiceId: id,
      duration,
      practiceParams,
    };
  }, [duration, practiceParams]);

  const updateParams = (pid, updates) => {
    setPracticeParams(prev => ({
      ...prev,
      [pid]: { ...prev[pid], ...updates }
    }));
  };

  // Get the actual practice ID to run, accounting for subModes in consolidated practices
  const getActualPracticeId = (baseId) => {
    const practice = PRACTICE_REGISTRY[baseId];
    if (!practice?.subModes) return baseId; // No subModes, return as-is
    
    const activeMode = practiceParams[baseId]?.activeMode || practice.defaultSubMode;
    const subMode = practice.subModes[activeMode];
    return subMode?.id || baseId; // Return the subMode's practice ID
  };

  // Shared UI states (non-practice specific)
  const [chevronAngle, setChevronAngle] = useState(0);
  const [haloPulse, setHaloPulse] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  
  // When running a practice, get the actual practice ID (accounting for subModes)
  const actualRunningPracticeId = isRunning ? getActualPracticeId(practiceId) : practiceId;

  const [isStarting, setIsStarting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [lastSessionId, setLastSessionId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [breathSubmode, setBreathSubmode] = useState("breath");
  const { startMicroNote, pendingMicroNote } = useJournalStore();

  const resolveTutorialPracticeId = useCallback((baseId) => {
    if (!baseId) return null;
    if (baseId === 'breath') {
      return breathSubmode === 'stillness' ? 'stillness' : 'breath';
    }
    const practice = PRACTICE_REGISTRY[baseId];
    if (!practice?.subModes) return baseId;
    const activeMode = practiceParams[baseId]?.activeMode || practice.defaultSubMode;
    const subMode = practice.subModes[activeMode];
    return subMode?.id || baseId;
  }, [breathSubmode, practiceParams]);

  const tutorialPracticeId = resolveTutorialPracticeId(practiceId);

  useEffect(() => {
    if (isRunning) return;
    onPracticingChange?.(false, tutorialPracticeId ?? null, false);
  }, [isRunning, tutorialPracticeId, onPracticingChange]);

  // Practice session internals - MUST be declared before any useEffect that references them
  const [activeCircuitId, setActiveCircuitId] = useState(null);
  const [circuitConfig, setCircuitConfig] = useState(null);
  const [circuitExerciseIndex, setCircuitExerciseIndex] = useState(0);
  const [circuitSavedPractice, setCircuitSavedPractice] = useState(null);
  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);
  const [breathCount, setBreathCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Fail-on-exit: Mark pilot session failed if unmounting mid-practice (pilot only, no curriculum mutation)
  useEffect(() => {
    return () => {
      if (isRunning && activePracticeSession) {
        // Detect pilot session via embedded owner marker or evening circuit id
        const session = useCurriculumStore.getState().activePracticeSession;
        const isPilotByMarker = typeof session === 'object' && session?.owner === 'pilot';
        const isPilotEvening = activeCircuitId === "evening-test-circuit";
        const isPilotSession = isPilotByMarker || isPilotEvening;
        
        if (isPilotSession) {
          useCurriculumStore.getState().setLastSessionFailed(true);
        }
        
        // Only clear curriculum state if this is a curriculum-owned session
        const isCurriculumSession = !isPilotSession && activePracticeSession;
        if (isCurriculumSession) {
          clearActivePracticeSession();
        }
      }
    };
    }, [isRunning, activePracticeSession, activeCircuitId]);
  const [visualizationCycles, setVisualizationCycles] = useState(0);
  const [activeRitual, setActiveRitual] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [countdownValue, setCountdownValue] = useState(null);
  const circuitCountdownRef = useRef(null);

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
  const actualPracticeIdForVippa = getActualPracticeId(practiceId);
  const isCognitive = actualPracticeIdForVippa === 'cognitive_vipassana';
  const vTarget = isCognitive ? 'cognitive_vipassana' : 'somatic_vipassana';
  const isRitualPractice = practiceId === "integration"
    || actualPracticeIdForVippa === "ritual"
    || selectedPractice?.alias === "ritual";
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
  const handleBenchmarkClose = (results) => {
    setShowBreathBenchmark(false);
    if (results) {
      const startingPattern = getStartingPattern();
      if (startingPattern) {
        setPattern(startingPattern);
        setPreset(null);
      }
    }
  };
  const handleRunBenchmark = () => setShowBreathBenchmark(true);
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

  // Generic setter for consolidated practices with subModes (awareness, resonance, perception)
  const setActiveMode = (practiceId, modeKey) => updateParams(practiceId, { activeMode: modeKey });

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
    if (!isRunning && hasSong && isSongPlaying) {
      useTempoAudioStore.getState().stop("practice-end");
    }
    // End tempo sync session when practice stops
    if (!isRunning && tempoSessionActive) {
      useTempoSyncSessionStore.getState().endSession();
    }
  }, [isRunning, hasSong, isSongPlaying, tempoSessionActive]);

  useEffect(() => {
    return () => {
      const st = useTempoAudioStore.getState();
      if (st.hasSong && st.isPlaying) st.stop("practice-unmount");
      // End tempo sync session on unmount
      useTempoSyncSessionStore.getState().endSession();
    };
  }, []);

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
      const prev = lastSavedPrefsRef.current;
      const hasChanged = prev.practiceId !== practiceId ||
        prev.duration !== duration ||
        prev.practiceParams !== practiceParams;
      if (hasChanged) {
        // savePreferences({
        //   practiceId,
        //   duration,
        //   practiceParams
        // });
        lastSavedPrefsRef.current = { practiceId, duration, practiceParams };
      }
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
      setPracticeId('awareness');
    } else if (exercise.practiceType === 'Somatic Vipassana') {
      setPracticeId('awareness');
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

  const startCircuitCountdown = (nextExercise) => {
    if (circuitCountdownRef.current) {
      clearInterval(circuitCountdownRef.current);
    }

    setCountdownValue(10);
    circuitCountdownRef.current = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(circuitCountdownRef.current);
          circuitCountdownRef.current = null;
          setupCircuitExercise(nextExercise);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const advanceCircuitExercise = () => {
    if (!activeCircuitId || !circuitConfig) return;

    const nextIndex = circuitExerciseIndex + 1;
    if (nextIndex < circuitConfig.exercises.length) {
      setCircuitExerciseIndex(nextIndex);
      const nextExercise = circuitConfig.exercises[nextIndex];
      startCircuitCountdown(nextExercise);
    } else {
      handleCircuitComplete();
    }
  };

  const handleCircuitComplete = () => {
    clearActivePracticeSession();
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);

    logCircuitCompletionEvent('custom', circuitConfig.exercises);

    const totalDuration = circuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0);

    let recordedSession = null;
    try {
      const endedAtIso = new Date().toISOString();
      const startedAtIso = new Date(Date.now() - (totalDuration * 60 * 1000)).toISOString();

      recordedSession = recordPracticeSession({
        domain: 'circuit-training',
        duration: totalDuration,
        exitType: 'completed',
        practiceId: 'circuit',
        practiceMode: null,
        configSnapshot: {
          circuitName: 'Custom Circuit',
          exerciseCount: circuitConfig.exercises.length,
          exercises: circuitConfig.exercises,
        },
        startedAt: startedAtIso,
        endedAt: endedAtIso,
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
    
    // Show evening feedback for evening circuit completion (pilot)
    if (activeCircuitId === 'evening-test-circuit') {
      setTimeout(() => setShowFeedbackModal(true), 500);
    }

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
    const activeSessionDayNumber = typeof savedActivePracticeSession === 'object'
      ? savedActivePracticeSession?.dayNumber
      : savedActivePracticeSession;
    const isCircuitSession = activeCircuitId && circuitConfig;

    // If this is a circuit session, delegate to circuit handler
    if (isCircuitSession) {
      handleCircuitComplete();
      return;
    }
    const wasFromCurriculum = !!activeSessionDayNumber;

    // Stop tempo sync audio if playing
    if (window.__tempoSyncStopAudio) {
      window.__tempoSyncStopAudio();
    }

    // Now clear the session
    clearActivePracticeSession();
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    onBreathStateChange && onBreathStateChange(null);

    const exitType = timeLeft <= 0 ? 'completed' : 'abandoned';
    if (isRitualPractice && exitType !== 'completed' && activeRitual?.id) {
      localStorage.setItem(DEFAULT_RITUAL_KEY, activeRitual.id);
    }
    const instrumentationData = endSession(exitType);

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
    if (isRitualPractice) subType = activeRitual?.id;

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
      else if (p.includes('feeling')) domain = 'focus';

      const activePath = useNavigationStore.getState().activePath;
      const activePathId = activePath?.activePathId || activePath?.pathId || null;
      const actualPracticeId = getActualPracticeId(practiceId);
      const completion = exitType === 'completed' ? 'completed' : 'abandoned';
      const practiceMode = practiceParams?.activeMode || (practiceId === 'breath' ? breathSubmode : null);

      const endedAtIso = new Date().toISOString();
      const startedAtIso = new Date(Date.now() - (instrumentationData.duration_ms || 0)).toISOString();
      const exitTypeString = exitType ?? 'abandoned';
      const actualDurationMinutes = duration;
      const actualDomain = domain;

      recordedSession = recordPracticeSession({
        domain: actualDomain,
        duration: actualDurationMinutes,
        exitType: exitTypeString,

        practiceId: actualPracticeId ?? practiceId,
        practiceMode: practiceMode ?? null,
        configSnapshot: {
          breathSubmode: breathSubmode ?? null,
        },

        startedAt: startedAtIso,
        endedAt: endedAtIso,
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
        const completedLegs = getDayLegsWithStatus(activeSessionDayNumber).filter(leg => leg.completed);
        currentLegNumber = completedLegs.length + 1; // Next leg to complete
        totalLegsForDay = curriculumDay.legs ? curriculumDay.legs.length : 1;

        // Log this leg as complete
        logLegCompletion(activeSessionDayNumber, currentLegNumber, {
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
          const allLegsWithStatus = getDayLegsWithStatus(activeSessionDayNumber);
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
          const tomorrowDay = getCurriculumDay(activeSessionDayNumber + 1);
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
        curriculumDayNumber: wasFromCurriculum ? activeSessionDayNumber : null,
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

      if (activeLeg.practiceType === 'Circuit' && activeLeg.practiceConfig?.circuitId) {
        const circuitDef = getCircuit?.(activeLeg.practiceConfig.circuitId);
        if (circuitDef?.exercises?.length) {
          const exercises = circuitDef.exercises.map((exercise) => ({
            exercise,
            duration: exercise.duration,
          }));
          setCircuitConfig({ exercises, exerciseDuration: null });
        }
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

    // Get the actual practice ID to run (handles subModes)
    const actualPracticeId = getActualPracticeId(practiceId);

    // savePreferences({
    //   practiceId,
    //   duration,
    //   practiceParams
    // });
    lastSavedPrefsRef.current = { practiceId, duration, practiceParams };

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

    // Check for vipassana practices (both old IDs and new awareness umbrella)
    if (practiceId === "awareness" || actualPracticeId === "cognitive_vipassana" || actualPracticeId === "somatic_vipassana") {
      // Direct start using the card configuration instead of forcing a modal
      const practiceConfig = getPracticeConfig(actualPracticeId);
      setIsRunning(true);
      onPracticingChange && onPracticingChange(true, actualPracticeId, practiceConfig?.requiresFullscreen || false);
      setSessionStartTime(performance.now());
      setTapErrors([]);
      setLastErrorMs(null);
      setLastSignedErrorMs(null);
      setBreathCount(0);

      startSession(
        'focus',
        null,
        sensoryType
      );
      return; 
    }

    const practiceConfig = getPracticeConfig(actualPracticeId);
    setIsRunning(true);
    onPracticingChange && onPracticingChange(true, actualPracticeId, practiceConfig?.requiresFullscreen || false);
    setSessionStartTime(performance.now());
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);

    // Start audio playback if tempo sync is enabled and breath practice
    if (practiceId === "breath" && tempoSyncEnabled) {
      console.log('[PracticeSection] Starting tempo sync audio via window.__tempoSyncStartAudio');
      if (window.__tempoSyncStartAudio) {
        window.__tempoSyncStartAudio();
      } else {
        console.warn('[PracticeSection] __tempoSyncStartAudio not available - TempoSyncPanel may not be mounted');
      }

      // Start tempo sync session with 3-phase cap schedule if song is loaded
      const audioStore = useTempoAudioStore.getState();
      const benchmarkStore = useBreathBenchmarkStore.getState();
      if (audioStore.hasSong && audioStore.songDurationSec > 0 && benchmarkStore.benchmark) {
        // Use benchmark max values (user's measured capacity), NOT tempo phase duration
        const bm = benchmarkStore.benchmark;
        const maxDurations = {
          inhale: bm.inhale,
          exhale: bm.exhale,
          holdIn: bm.hold1,
          holdOut: bm.hold2,
        };
        useTempoSyncSessionStore.getState().startSession(
          audioStore.songDurationSec,
          maxDurations,
          tempoSyncBpm
        );
        console.log('[PracticeSection] Started tempo sync session', {
          songDuration: audioStore.songDurationSec,
          bpm: tempoSyncBpm,
          maxDurations
        });
      }
    }

    const p = actualPracticeId; // Use the actual practice ID to determine domain
    let domain = 'breathwork';
    if (p === 'visualization' || p === 'cymatics') domain = 'visualization';
    else if (p.includes('vipassana')) domain = isCognitive ? 'focus' : 'body';
    else if (p === 'ritual' || practiceId === 'integration') domain = 'ritual';
    else if (p === 'sound') domain = 'sound';
    else if (p === 'photic') domain = 'photic';
    else if (p === 'feeling') domain = 'focus';
    else if (practiceId === 'resonance') domain = p === 'cymatics' ? 'visualization' : 'sound'; // resonance maps to sub-domain

    startSession(
      domain,
      activeRitual?.category || null,
      p === 'somatic_vipassana' ? sensoryType : null
    );
  };

  const handleStart = (durationOverrideSec = null) => {
    // Get the actual practice ID to run (handles subModes)
    const actualPracticeId = getActualPracticeId(practiceId);
    
    // Special handling for Photic practice
    if (practiceId === "photic" || actualPracticeId === "photic") {
      onOpenPhotic?.();
      return;
    }

    if (Number.isFinite(durationOverrideSec) && durationOverrideSec > 0) {
      setDuration(durationOverrideSec / 60);
      setTimeLeft(durationOverrideSec);
    }

    setIsStarting(true);

    // Check if we need to start audio with countdown
    const needsAudioCountdown = practiceId === "breath" && tempoSyncEnabled;
    
    if (needsAudioCountdown) {
      // 3-second countdown before starting breath practice with audio
      setCountdownValue(3);
      
      const countdownInterval = setInterval(() => {
        setCountdownValue((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setIsStarting(false);
        setCountdownValue(null);
        executeStart();
      }, 3000); // 3 seconds for countdown
    } else {
      // Normal start animation (1.4 seconds)
      setTimeout(() => {
        setIsStarting(false);
        executeStart();
      }, 1400);
    }
  };

  const handleSelectRitual = (ritual) => {
    if (ritual?.id) localStorage.setItem(DEFAULT_RITUAL_KEY, ritual.id);
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
    if (activeRitual?.id) {
      localStorage.setItem(DEFAULT_RITUAL_KEY, activeRitual.id);
      localStorage.setItem(LAST_RITUAL_ID_KEY, activeRitual.id);
      localStorage.setItem(LAST_RITUAL_AT_KEY, String(Date.now()));
    }
    handleStop();
  };

  const handleAccuracyTap = (errorMs) => {
    if (!isRunning) return;

    recordAliveSignal();

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
      } else if (timeLeft === 0 && countdownValue === null) {
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

  // Update tempo sync session elapsed time (calculates segment transitions)
  useEffect(() => {
    if (!tempoSessionActive || !isRunning || !songDurationSec) return;
    // Calculate elapsed from remaining timeLeft
    const totalElapsedSec = songDurationSec - timeLeft;
    useTempoSyncSessionStore.getState().updateElapsed(totalElapsedSec, tempoSyncBpm);
  }, [tempoSessionActive, isRunning, timeLeft, songDurationSec, tempoSyncBpm]);

  const {
    isBreathPractice,
    breathingPatternForRing,
    breathingPatternText,
    showBreathCount,
  } = useBreathSessionState({
    isRunning,
    practice,
    pattern,
    duration,
    breathCount,
    hasBenchmark,
    calculateTotalCycles,
    getPatternForCycle,
    tempoSyncEnabled,
    tempoSyncBpm,
    tempoPhaseDuration,
    tempoBeatsPerPhase,
    tempoSessionActive,
    tempoSessionEffective,
    onBreathStateChange,
  });

  const theme = useTheme();
  const { primary, secondary, muted, glow } = theme.accent;
  const showFeedback = lastSignedErrorMs !== null && isBreathPractice;
  const timeLeftText = formatTime(timeLeft);

  // RENDER PRIORITY 1: Active Practice Session
  const sessionView = isRunning ? (() => {
    if (isRitualPractice) {
      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <NavigationRitualLibrary onComplete={handleRitualComplete} onExit={handleStop} />
        </section>
      );
    }

    // Resolve actual practice ID for showing correct vipassana variant
    const actualId = getActualPracticeId(practiceId);
    if (actualId === "cognitive_vipassana" || actualId === "somatic_vipassana") {
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

    if (lastSignedErrorMs !== null && actualRunningPracticeId === "breath") {
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
          {actualRunningPracticeId === "visualization" ? (
            <VisualizationCanvas
              geometry={geometry}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : actualRunningPracticeId === "cymatics" ? (
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
          ) : actualRunningPracticeId === "breath" ? (
          <div className="flex flex-col items-center justify-center gap-6" style={{ overflow: 'visible' }}>
              <BreathingRing
                breathPattern={breathingPatternForRing}
                onTap={handleAccuracyTap}
                onCycleComplete={() => setBreathCount(prev => prev + 1)}
                startTime={sessionStartTime}
                pathId={avatarPath}
                fxPreset={currentFxPreset}
                totalSessionDurationSec={duration}
              />

              {/* Tempo Sync Session Panel - 3-phase cap schedule display */}
              {tempoSessionActive && (
                <div style={{ width: '100%', maxWidth: '320px', marginTop: '8px' }}>
                  <TempoSyncSessionPanel />
                </div>
              )}

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

        <SessionControls
          isBreathPractice={isBreathPractice}
          breathingPatternText={breathingPatternText}
          showFeedback={showFeedback}
          lastSignedErrorMs={lastSignedErrorMs}
          feedbackColor={feedbackColor}
          feedbackShadow={feedbackShadow}
          feedbackText={feedbackText}
          onStop={handleStop}
          buttonBg={buttonBg}
          radialGlow={radialGlow}
          buttonShadow={buttonShadow}
          timeLeftText={timeLeftText}
          showBreathCount={showBreathCount}
          breathCount={breathCount}
        />

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
  })() : null;

  // RENDER PRIORITY 2: Session Summary Modal
  const showSummaryModal = showSummary && sessionSummary;
  const summaryView = showSummaryModal ? (() => {
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
  })() : null;

  // RENDER PRIORITY 3: Practice Configuration/Selection View
  // Assemble the unified setters/params object for the dynamic config panels
  const activeMode = practiceParams[practiceId]?.activeMode;
  const configProps = {
    preset, pattern, soundType, soundVolume, binauralPreset, isochronicPreset, carrierFrequency,
    sensoryType, vipassanaTheme, vipassanaElement, geometry, fadeInDuration, displayDuration,
    fadeOutDuration, voidDuration, audioEnabled, frequencySet, selectedFrequency, driftEnabled,
    activeMode,
    setPreset, setPattern, setSoundType, setSoundVolume, setBinauralPreset, setIsochronicPreset, 
    setCarrierFrequency, setSensoryType, setVipassanaTheme, setVipassanaElement, setGeometry, 
    setFadeInDuration, setDisplayDuration, setFadeOutDuration, setVoidDuration, setAudioEnabled,
    setFrequencySet, setSelectedFrequency, setDriftEnabled,
    setActiveMode: (modeKey) => setActiveMode(practiceId, modeKey),
    onToggleRunning: handleStart, 
    onSelectRitual: handleSelectRitual, 
    selectedRitualId: activeRitual?.id,
    isEmbedded: true
  };

  return (
    <>
      <BreathBenchmark isOpen={showBreathBenchmark} onClose={handleBenchmarkClose} />
      {sessionView}
      {summaryView}
      
      {/* Countdown Overlay */}
      {countdownValue !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '120px',
              fontWeight: 700,
              color: 'var(--accent-color)',
              textShadow: '0 0 40px var(--accent-color), 0 0 80px var(--accent-color)',
              animation: 'countdown-pulse 1s ease-in-out',
            }}
          >
            {countdownValue}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '32px',
            }}
          >
            Get Ready...
          </div>
          {/* Next practice info for circuit transitions */}
          {activeCircuitId && circuitConfig && circuitExerciseIndex < circuitConfig.exercises.length && (
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ opacity: 0.6, fontSize: '12px', marginBottom: '8px' }}>Next:</div>
              <div>
                {circuitConfig.exercises[circuitExerciseIndex].exercise.name}
                {' '}({circuitConfig.exercises[circuitExerciseIndex].duration}m)
              </div>
            </div>
          )}
        </div>
      )}

      <PracticeSectionShell
        className="practice-section-container w-full flex flex-col items-center justify-start"
        style={{ paddingTop: '8px', paddingBottom: '16px', position: 'relative', display: showSummaryModal || isRunning ? 'none' : 'flex' }}
      >
        <PracticeHeader
          isSanctuary={isSanctuary}
          practiceId={practiceId}
          onSelectPractice={handleSelectPractice}
          selector={(
            <PracticeSelector
              selectedId={practiceId}
              onSelect={handleSelectPractice}
              tokens={uiTokens}
            />
          )}
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
        isRunning={isRunning}
        tempoSyncEnabled={tempoSyncEnabled}
        tempoPhaseDuration={tempoPhaseDuration}
        tempoBeatsPerPhase={tempoBeatsPerPhase}
        onRunBenchmark={handleRunBenchmark}
        onDisableBenchmark={() => setShowBreathBenchmark(false)}
        breathSubmode={breathSubmode}
        onBreathSubmodeChange={setBreathSubmode}
      />

      <style>{`
        .practiceMenuHeader .tutorialButtonWrap { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.1)'}; border-radius: 2px; }
        @keyframes countdown-pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      </PracticeSectionShell>
      
      {/* Evening Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={() => setShowFeedbackModal(false)}
      />
    </>
  );
}

export default PracticeSection;
