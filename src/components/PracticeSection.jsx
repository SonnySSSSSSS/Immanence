import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { createPortal } from 'react-dom';
import { InsightMeditationPortal } from './vipassana/InsightMeditationPortal.jsx';
import { SensorySession } from "./SensorySession.jsx";
import { GuidanceAudioController } from "./audio/GuidanceAudioController.jsx";
import { BreathingRing } from "./BreathingRing.jsx";
import { BREATH_RING_PRESETS } from "./breathingRingPresets.js";
import { VisualizationCanvas } from "./VisualizationCanvas.jsx";
import { CymaticsVisualization } from "./CymaticsVisualization.jsx";
import { VipassanaVisual } from "./vipassana/VipassanaVisual.jsx";
import { NavigationRitualLibrary } from "./NavigationRitualLibrary.jsx";
import { CircuitConfig } from "./Cycle/CircuitConfig.jsx";
import { VIPASSANA_THEMES } from "../data/vipassanaThemes.js";
import { SoundConfig, BINAURAL_PRESETS, ISOCHRONIC_PRESETS, SOUND_TYPES } from "./SoundConfig.jsx";
import { BreathConfig } from "./BreathConfig.jsx";
import { BREATH_PRESETS } from "./breathPresets.js";
import { BreathBenchmark } from "./BreathBenchmark.jsx";
import { SensoryConfig, SENSORY_TYPES } from "./SensoryConfig.jsx";
import { VisualizationConfig } from "./VisualizationConfig.jsx";
import { CymaticsConfig } from "./CymaticsConfig.jsx";
import { SOLFEGGIO_SET, FREQUENCY_SETS } from "../utils/frequencyLibrary.js";
import { loadPreferences, savePreferences } from "../state/practiceStore.js";
import { usePracticeSessionInstrumentation } from "./practice/usePracticeSessionInstrumentation.js";
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useUiStore } from "../state/uiStore.js";
import { useSessionOverrideStore } from "../state/sessionOverrideStore.js";
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
import { StillnessRingSession } from "./practice/StillnessRingSession.jsx";
import PracticeMenu from "./practice/PracticeMenu.jsx";
import { PracticeOptionsCard } from "./practice/PracticeOptionsCard.jsx";
import { InstructionVideoPanel } from "./InstructionVideoPanel.jsx";
import { GlassIconButton, SUB_MODE_ICON_MAP } from "./GlassIconButton.jsx";
import ParallaxForest from "./ParallaxForest.jsx";
import { SakshiVisual } from "./SakshiVisual.jsx";
import { useAwarenessSceneStore } from "../state/awarenessSceneStore.js";
import { recordPracticeSession } from "../services/sessionRecorder.js";
import { getPathById } from "../data/navigationData.js";
import { PRACTICE_REGISTRY, PRACTICE_IDS, GRID_PRACTICE_IDS, DURATIONS, OLD_TO_NEW_PRACTICE_MAP, resolvePracticeId, labelToPracticeId } from "./PracticeSection/constants.js";
import { getRitualById } from "../data/bhaktiRituals.js";

// Import EmotionConfig
import { EmotionConfig } from './EmotionConfig.jsx';
import { getEmotionClosingLine, getEmotionLabel } from '../data/emotionPractices.js';
import { useProgressStore } from '../state/progressStore.js';
import { useBreathSessionManager } from '../hooks/useBreathSessionManager.js';
import { audioGuidance } from "../services/audioGuidanceService.js";

// CONFIG_COMPONENTS moved to PracticeOptionsCard.jsx

const PRESET_SWITCHER_Z_INDEX = 10020;
const SAFE_LAUNCH_FALLBACK = Object.freeze({
  practiceId: 'breath',
  durationMin: 10,
});
const DEFAULT_STILLNESS_CONFIG = Object.freeze({
  focusIntensity: "medium",
  focusSec: 45,
  restSec: 15,
  preDelaySec: 0,
});
const GUIDANCE_FALLBACK_LINE = "For the remaining time, continue breathing until the timer ends.";
const GUIDANCE_FALLBACK_MIN_REMAINING_MS = 8000;
const GUIDANCE_LOOP_WRAP_EPSILON_SEC = 0.75;
const GUIDANCE_LOOP_END_WINDOW_SEC = 1.25;
const GUIDANCE_FALLBACK_SUBTITLE_MS = 6000;
const BREATH_CYCLE_BOUNDARY_EPSILON_MS = 180;

function normalizeSeconds(value, fallback, min = 0, max = 600) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizeFocusIntensity(value, fallback = "medium") {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "light" || raw === "medium" || raw === "heavy") return raw;
  return fallback;
}

function normalizeStillnessConfig(raw, { fallback = DEFAULT_STILLNESS_CONFIG, sharedPreDelaySec = 0 } = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const fallbackCfg = fallback && typeof fallback === "object" ? fallback : DEFAULT_STILLNESS_CONFIG;
  const fallbackPreDelay = Number.isFinite(Number(fallbackCfg.preDelaySec))
    ? Number(fallbackCfg.preDelaySec)
    : Number(sharedPreDelaySec) || 0;

  return {
    focusIntensity: normalizeFocusIntensity(src.focusIntensity, fallbackCfg.focusIntensity || "medium"),
    focusSec: normalizeSeconds(src.focusSec, normalizeSeconds(fallbackCfg.focusSec, DEFAULT_STILLNESS_CONFIG.focusSec, 5, 300), 5, 300),
    restSec: normalizeSeconds(src.restSec, normalizeSeconds(fallbackCfg.restSec, DEFAULT_STILLNESS_CONFIG.restSec, 3, 180), 3, 180),
    preDelaySec: normalizeSeconds(
      src.preDelaySec,
      normalizeSeconds(fallbackPreDelay, DEFAULT_STILLNESS_CONFIG.preDelaySec, 0, 20),
      0,
      20
    ),
  };
}

function isTypingIntoEditableElement(activeEl) {
  if (!activeEl) return false;
  const tagName = activeEl.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true;
  if (activeEl.isContentEditable) return true;
  return activeEl.getAttribute?.('contenteditable') === 'true';
}

const DevCompleteNowOverlay =
  import.meta.env.DEV === true
    ? function DevCompleteNowOverlay({ isRunning, onCompleteNow }) {
        if (!isRunning) return null;
        return (
          <div
            style={{
              position: 'fixed',
              right: 14,
              bottom: 14,
              zIndex: 10050,
              display: 'flex',
              alignItems: 'flex-end',
              pointerEvents: 'none',
            }}
          >
            <button
              type="button"
              onClick={onCompleteNow}
              style={{
                pointerEvents: 'auto',
                padding: '8px 10px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.65)',
                color: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              title="DEV: Immediately complete the active practice using normal completion logic"
            >
              DEV: Complete Now
            </button>
          </div>
        );
      }
    : function DevCompleteNowOverlay() {
        return null;
      };

// Safe practice config lookup that resolves old IDs
const getPracticeConfig = (id) => {
  const resolvedId = resolvePracticeId(id);
  return PRACTICE_REGISTRY[resolvedId];
};

// Unified width system for all practice UI components
const PRACTICE_UI_WIDTH = {
  maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
  padding: '16px',
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
      data-tutorial="practice-selector"
      items={items}
      value={selectedId}
      onChange={onSelect}
    />
  );
}

// PracticeOptionsCard component extracted to ./practice/PracticeOptionsCard.jsx

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

function getPathPracticeOccurrences(pathDef, dayIndex) {
  if (!pathDef || typeof pathDef !== "object") return [];

  const weekIndex = Number.isFinite(dayIndex) ? Math.ceil(dayIndex / 7) : null;
  const currentWeek = weekIndex && Array.isArray(pathDef.weeks)
    ? pathDef.weeks.find((week) => week?.number === weekIndex) || null
    : null;
  const weekPracticesRaw = Array.isArray(currentWeek?.practices) ? currentWeek.practices : null;
  const weekPracticesStructured = weekPracticesRaw && weekPracticesRaw.some((entry) => entry && typeof entry === "object")
    ? weekPracticesRaw
    : null;
  const topLevelPractices = Array.isArray(pathDef.practices) ? pathDef.practices : null;

  return weekPracticesStructured || topLevelPractices || weekPracticesRaw || [];
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getInvalidPracticeLaunchContextReason(ctx) {
  if (!isPlainObject(ctx)) return 'ctx_not_object';

  if (typeof ctx.source !== 'undefined' && typeof ctx.source !== 'string') {
    return 'source_not_string';
  }

  if (typeof ctx.practiceId !== 'undefined') {
    if (typeof ctx.practiceId !== 'string') return 'practice_id_not_string';
    const resolvedPracticeId = resolvePracticeId(ctx.practiceId);
    if (!PRACTICE_REGISTRY[resolvedPracticeId]) return `unknown_practice_id:${ctx.practiceId}`;
  }

  if (typeof ctx.durationMin !== 'undefined') {
    const durationMin = Number(ctx.durationMin);
    if (!Number.isFinite(durationMin) || durationMin <= 0) return 'duration_min_invalid';
  }

  if (typeof ctx.practiceParamsPatch !== 'undefined' && !isPlainObject(ctx.practiceParamsPatch)) {
    return 'practice_params_patch_invalid';
  }

  if (typeof ctx.overrides !== 'undefined') {
    if (!isPlainObject(ctx.overrides)) return 'overrides_invalid';

    if ('practiceParams' in ctx.overrides && !isPlainObject(ctx.overrides.practiceParams)) {
      return 'overrides_practice_params_invalid';
    }
    if ('settings' in ctx.overrides && !isPlainObject(ctx.overrides.settings)) {
      return 'overrides_settings_invalid';
    }
    if ('tempoSync' in ctx.overrides && !isPlainObject(ctx.overrides.tempoSync)) {
      return 'overrides_tempo_sync_invalid';
    }
    if ('awarenessScene' in ctx.overrides && !isPlainObject(ctx.overrides.awarenessScene)) {
      return 'overrides_awareness_scene_invalid';
    }
  }

  if (typeof ctx.pathContext !== 'undefined' && !isPlainObject(ctx.pathContext)) {
    return 'path_context_invalid';
  }

  if (typeof ctx.locks !== 'undefined' && !Array.isArray(ctx.locks) && !isPlainObject(ctx.locks)) {
    return 'locks_invalid';
  }

  return null;
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
      queueMicrotask(() => setScrollOffset(index * itemHeight));
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
              className="type-h2 flex items-center justify-center"
              style={{
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

export function PracticeSection({ onPracticingChange, onBreathStateChange, avatarPath, onNavigate, onOpenPhotic, isActiveBreathSession = false }) {
  const {
    startSession,
    endSession,
    recordAliveSignal,
    logCircuitCompletionEvent,
  } = usePracticeSessionInstrumentation();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const isSanctuary = false;

  // Breath benchmark for progressive patterns
  const benchmark = useBreathBenchmarkStore(s => s.benchmark);
  const hasBenchmark = Boolean(
    benchmark &&
    Number.isFinite(benchmark.inhale) && benchmark.inhale > 0 &&
    Number.isFinite(benchmark.hold1) && benchmark.hold1 > 0 &&
    Number.isFinite(benchmark.exhale) && benchmark.exhale > 0 &&
    Number.isFinite(benchmark.hold2) && benchmark.hold2 > 0
  );
  const getStartingPattern = useBreathBenchmarkStore(s => s.getStartingPattern);
  const hasSong = useTempoAudioStore((s) => s.hasSong);
  const isSongPlaying = useTempoAudioStore((s) => s.isPlaying);
  const guidanceStatus = useTempoAudioStore((s) => s.status);
  const guidanceSource = useTempoAudioStore((s) => s.source);
  const guidanceCurrentTime = useTempoAudioStore((s) => s.currentTime);
  const guidanceDuration = useTempoAudioStore((s) => s.duration);
  const activePath = useNavigationStore(s => s.activePath);
  
  // Tempo sync state for music-synced breathing
  const tempoSyncEnabled = useTempoSyncStore(s => s.enabled);
  const tempoSyncBpm = useTempoSyncStore(s => s.bpm);
  const tempoPhaseDuration = useTempoSyncStore(s => s.getPhaseDuration());
  const tempoBeatsPerPhase = useTempoSyncStore(s => s.beatsPerPhase);

  // Tempo sync session state (3-phase cap schedule)
  const tempoSessionActive = useTempoSyncSessionStore(s => s.isActive);
  const tempoSessionEffective = useTempoSyncSessionStore(s => s.effectivePhaseDurations);
  const songDurationSec = useTempoAudioStore(s => s.songDurationSec);

  // Sakshi practice version and scene selection
  const { sakshiVersion } = useAwarenessSceneStore();

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

  // Load preferences once on mount (use lazy initializer to avoid re-computation)
  const [savedPrefs] = useState(() => loadPreferences());
  const initialPracticeId = savedPrefs.practiceId || 'breath';
  const lastSavedPrefsRef = useRef({
    practiceId: savedPrefs.practiceId,
    duration: savedPrefs.duration,
    practiceParams: savedPrefs.practiceParams,
  });

  // STABILIZE STATE: Core Selection State
  const [practiceId, setPracticeId] = useState(initialPracticeId);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(!!initialPracticeId);
  const [duration, setDuration] = useState(savedPrefs.duration || 10);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [showBreathBenchmark, setShowBreathBenchmark] = useState(false);
  const [initiationBenchmarkContext, setInitiationBenchmarkContext] = useState(null);
  const [pathLaunchGuidance, setPathLaunchGuidance] = useState(undefined);
  const [pathLaunchInstructionVideo, setPathLaunchInstructionVideo] = useState(undefined);
  const [pendingPathAutoStart, setPendingPathAutoStart] = useState(null);
  const queuedPathAutoStartRequestIdRef = useRef(null);
  const consumedPathAutoStartRequestIdRef = useRef(null);

  // CURRICULUM INTEGRATION (use selectors to prevent unnecessary re-renders)
  const getActivePracticeLeg = useCurriculumStore(s => s.getActivePracticeLeg);
  const activePracticeSession = useCurriculumStore(s => s.activePracticeSession);
  const clearActivePracticeSession = useCurriculumStore(s => s.clearActivePracticeSession);
  const getCircuit = useCurriculumStore(s => s.getCircuit);
  
  // STABILIZE STATE: Keyed Parameters Object
  const [practiceParams, setPracticeParams] = useState(savedPrefs.practiceParams);
  const [launchStillnessConfig, setLaunchStillnessConfig] = useState(null);
  const sharedBreathPreDelaySec = normalizeSeconds(
    practiceParams?.breath?.preDelaySec,
    DEFAULT_STILLNESS_CONFIG.preDelaySec,
    0,
    20
  );
  const persistedStillnessDefaults = useMemo(
    () => normalizeStillnessConfig(practiceParams?.breath?.stillness, {
      fallback: DEFAULT_STILLNESS_CONFIG,
      sharedPreDelaySec: sharedBreathPreDelaySec,
    }),
    [practiceParams?.breath?.stillness, sharedBreathPreDelaySec]
  );
  const practiceLaunchContext = useUiStore(s => s.practiceLaunchContext);
  const clearPracticeLaunchContext = useUiStore(s => s.clearPracticeLaunchContext);
  const applyLaunchConstraints = useSessionOverrideStore(s => s.applyLaunchConstraints);
  const clearLaunchConstraints = useSessionOverrideStore(s => s.clearLaunchConstraints);
  const isLocked = useSessionOverrideStore(s => s.isLocked);

  // When we enter PracticeSection from a recommendation/schedule, we should NOT overwrite user prefs.
  const suppressPrefSaveRef = useRef(false);

  // Persist pathContext from launch context so it survives clearPracticeLaunchContext
  const activePathContextRef = useRef(null);
  const activePathLaunchGuidanceRef = useRef(undefined);
  const activePathInstructionVideoRef = useRef(undefined);
  const getForceScheduleMatchedPayload = useCallback(() => {
    const pathCtx = activePathContextRef.current;
    if (!pathCtx || pathCtx.forceStart !== true || pathCtx.forceWindowBypass !== true) {
      return null;
    }

    return {
      source: 'shift-click',
      slotIndex: Number.isFinite(Number(pathCtx.slotIndex)) ? Number(pathCtx.slotIndex) : null,
      slotTime: typeof pathCtx.slotTime === 'string' ? pathCtx.slotTime : null,
      scheduleDateKey: typeof pathCtx.scheduleDateKey === 'string' ? pathCtx.scheduleDateKey : null,
    };
  }, []);
  const pausedAtRef = useRef(null);
  const pathGuidanceStartedRef = useRef(false);
  const pathGuidanceWasPausedRef = useRef(false);
  const pathGuidanceRanRef = useRef(false);
  const pathGuidanceCompletedRef = useRef(false);
  const guidanceFallbackFiredRef = useRef(false);
  const previousGuidanceTimeRef = useRef(0);
  const guidanceFallbackSubtitleTimerRef = useRef(null);
  const guidanceFallbackSessionIdRef = useRef(null);
  const [guidanceFallbackSubtitle, setGuidanceFallbackSubtitle] = useState(null);
  const clearGuidanceFallbackCue = useCallback(() => {
    if (guidanceFallbackSubtitleTimerRef.current !== null) {
      clearTimeout(guidanceFallbackSubtitleTimerRef.current);
      guidanceFallbackSubtitleTimerRef.current = null;
    }
    setGuidanceFallbackSubtitle(null);
  }, []);
  const resetGuidanceCompletionState = useCallback(() => {
    pathGuidanceCompletedRef.current = false;
    guidanceFallbackFiredRef.current = false;
    previousGuidanceTimeRef.current = 0;
    guidanceFallbackSessionIdRef.current = null;
    clearGuidanceFallbackCue();
  }, [clearGuidanceFallbackCue]);

  useEffect(() => () => {
    clearGuidanceFallbackCue();
    audioGuidance.stop();
  }, [clearGuidanceFallbackCue]);

  const resolveInitiationV2BenchmarkContext = useCallback((ctx) => {
    if (!ctx || ctx.source !== 'dailySchedule' || ctx.practiceId !== 'breath') {
      return null;
    }

    const pathCtx = ctx.pathContext || {};
    const pathId = pathCtx.activePathId || activePath?.activePathId || null;
    const pathDef = pathId ? getPathById(pathId) : null;
    const curriculumId = pathDef?.tracking?.curriculumId || null;
    if (curriculumId !== 'ritual-initiation-14-v2') {
      return null;
    }

    const dayIndex = Number(pathCtx.dayIndex);
    if (!(dayIndex === 1 || dayIndex === 14)) {
      return null;
    }

    const slotIndexRaw = Number(pathCtx.slotIndex);
    let isMorningLeg = Number.isFinite(slotIndexRaw) ? slotIndexRaw === 0 : false;
    if (!Number.isFinite(slotIndexRaw)) {
      const selectedTimes = Array.isArray(activePath?.schedule?.selectedTimes)
        ? activePath.schedule.selectedTimes
        : [];
      const firstSlotTime = selectedTimes[0] || null;
      const slotTime = typeof pathCtx.slotTime === 'string' ? pathCtx.slotTime.substring(0, 5) : null;
      isMorningLeg = !!firstSlotTime && !!slotTime && firstSlotTime.substring(0, 5) === slotTime;
    }
    if (!isMorningLeg) {
      return null;
    }

    return {
      runId: pathCtx.runId || activePath?.runId || null,
      activePathId: pathId,
      dayIndex,
      slotIndex: Number.isFinite(slotIndexRaw) ? slotIndexRaw : 0,
      weekIndex: Number(pathCtx.weekIndex) || Math.ceil(dayIndex / 7),
    };
  }, [activePath]);

  const mergePracticeParamsPatch = useCallback((patch) => {
    if (!patch || typeof patch !== 'object') return;
    setPracticeParams((prev) => {
      const next = { ...(prev || {}) };
      for (const [k, v] of Object.entries(patch)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          next[k] = { ...(next[k] || {}), ...v };
        } else {
          next[k] = v;
        }
      }
      return next;
    });
  }, []);

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
    suppressPrefSaveRef.current = false;
    clearLaunchConstraints?.(); // Manual selection exits path/curriculum locks
    setInitiationBenchmarkContext(null);
    setPathLaunchGuidance(undefined);
    setPathLaunchInstructionVideo(undefined);
    setLaunchStillnessConfig(null);
    activePathContextRef.current = null;
    activePathInstructionVideoRef.current = undefined;
    pathGuidanceStartedRef.current = false;
    pathGuidanceWasPausedRef.current = false;
    pathGuidanceRanRef.current = false;
    resetGuidanceCompletionState();
    setPracticeId(id);
    // Save immediately with current state
    savePreferences({
      practiceId: id,
      duration,
      practiceParams,
    });
    lastSavedPrefsRef.current = {
      practiceId: id,
      duration,
      practiceParams,
    };
    // Notify parent of menu selection (for tutorial context)
    onPracticingChange(false, null, false, id);
  }, [duration, practiceParams, onPracticingChange, clearLaunchConstraints, resetGuidanceCompletionState]);

  const updateParams = useCallback((pid, updates) => {
    if (!pid || !updates || typeof updates !== 'object') return;

    // Enforce session locks by filtering out locked keys (and sub-keys for nested objects).
    setPracticeParams((prev) => {
      const next = { ...(prev || {}) };
      const prevBucket = (next[pid] && typeof next[pid] === 'object') ? next[pid] : {};
      const bucketNext = { ...prevBucket };

      for (const [k, v] of Object.entries(updates)) {
        const basePath = `practiceParams.${pid}.${k}`;
        if (isLocked?.(basePath)) {
          continue;
        }

        if (v && typeof v === 'object' && !Array.isArray(v)) {
          // Filter nested keys if they are individually locked.
          const nestedNext = { ...(bucketNext[k] && typeof bucketNext[k] === 'object' ? bucketNext[k] : {}) };
          let changed = false;
          for (const [nk, nv] of Object.entries(v)) {
            const nestedPath = `${basePath}.${nk}`;
            if (isLocked?.(nestedPath)) continue;
            nestedNext[nk] = nv;
            changed = true;
          }
          if (changed) bucketNext[k] = nestedNext;
        } else {
          bucketNext[k] = v;
        }
      }

      next[pid] = bucketNext;
      return next;
    });
  }, [isLocked]);

  // Get the actual practice ID to run, accounting for subModes in consolidated practices
  const getActualPracticeId = useCallback((baseId) => {
    const practice = PRACTICE_REGISTRY[baseId];
    if (!practice?.subModes) return baseId; // No subModes, return as-is
    
    const activeMode = practiceParams[baseId]?.activeMode || practice.defaultSubMode;
    const subMode = practice.subModes[activeMode];
    return subMode?.id || baseId; // Return the subMode's practice ID
  }, [practiceParams]);

  // Shared UI states (non-practice specific)
  const [isRunning, setIsRunning] = useState(false);
  
  // When running a practice, get the actual practice ID (accounting for subModes)
  const actualRunningPracticeId = isRunning ? getActualPracticeId(practiceId) : practiceId;
  const isBreathRunningSession = isRunning && actualRunningPracticeId === "breath";
  const breathViewportRootRef = useRef(null);
  const [breathViewportHeightPx, setBreathViewportHeightPx] = useState(null);

  // CANONICAL RENDER PRACTICE ID: Use this for ALL render-path decisions
  const renderPracticeId = isRunning ? actualRunningPracticeId : practiceId;

  // RENDER-SPECIFIC: Derive from renderPracticeId for render-path decisions
  const renderPracticeConfig = getPracticeConfig(renderPracticeId) || PRACTICE_REGISTRY.breath;
  const renderPractice = renderPracticeConfig.label;

  useLayoutEffect(() => {
    if (!isBreathRunningSession) {
      queueMicrotask(() => setBreathViewportHeightPx(null));
      return undefined;
    }

    let rafId = null;
    const measure = () => {
      const rootEl = breathViewportRootRef.current;
      if (!rootEl) return;
      const top = rootEl.getBoundingClientRect().top || 0;
      const available = Math.max(0, window.innerHeight - top);
      setBreathViewportHeightPx((prev) => (Math.abs((prev ?? 0) - available) < 1 ? prev : available));
    };

    const scheduleMeasure = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [isBreathRunningSession]);

  useEffect(() => {
    if (!isBreathRunningSession) return undefined;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isBreathRunningSession]);

  const [breathSubmode, setBreathSubmode] = useState("breath");

  // Handle curriculum auto-start and initialization (with guards to prevent override during practice)
  useEffect(() => {
    if (isRunning) return;
    if (!activePracticeSession) return;
    const activeLeg = getActivePracticeLeg();
    if (!activeLeg) return;

    const pid = labelToPracticeId(activeLeg.practiceType);
    if (pid !== practiceId) {
      console.error(`[CURRICULUM EFFECT] Resetting from ${practiceId} to ${pid}`);
      console.trace(`Stack trace - curriculum resetting practiceId to ${pid}`);
      queueMicrotask(() => setPracticeId(pid));
      queueMicrotask(() => setHasExpandedOnce(true)); // Bypass animation for auto-starts
    }

    // Apply curriculum leg duration (minutes) to the practice timer.
    const nextDurationMinRaw = activeLeg?.practiceConfig?.duration;
    const nextDurationMin = Number(nextDurationMinRaw);
    if (Number.isFinite(nextDurationMin) && nextDurationMin > 0 && nextDurationMin !== duration) {
      queueMicrotask(() => setDuration(nextDurationMin));
    }

    if (pid === "breath") {
      const legStillnessConfig = activeLeg?.practiceConfig?.stillness;
      if (legStillnessConfig && typeof legStillnessConfig === "object") {
        const normalizedStillnessConfig = normalizeStillnessConfig(legStillnessConfig, {
          fallback: persistedStillnessDefaults,
          sharedPreDelaySec: sharedBreathPreDelaySec,
        });
        queueMicrotask(() => {
          setLaunchStillnessConfig(normalizedStillnessConfig);
          setBreathSubmode("stillness");
        });
      } else {
        queueMicrotask(() => setLaunchStillnessConfig(null));
      }
    } else {
      queueMicrotask(() => setLaunchStillnessConfig(null));
    }
  }, [
    activePracticeSession,
    isRunning,
    practiceId,
    duration,
    getActivePracticeLeg,
    persistedStillnessDefaults,
    sharedBreathPreDelaySec,
    resetGuidanceCompletionState,
  ]);

  const _circuitPendingRef = useRef(null);

  // Apply launch context (from paths / navigation recommendations / schedule tiles).
  useEffect(() => {
    if (isRunning) return;
    if (!practiceLaunchContext) return;

    const invalidLaunchContextReason = getInvalidPracticeLaunchContextReason(practiceLaunchContext);
    if (invalidLaunchContextReason) {
      console.warn('[PracticeSection] Invalid practiceLaunchContext; applying safe fallback.', {
        reason: invalidLaunchContextReason,
        practiceLaunchContext,
      });

      pathGuidanceStartedRef.current = false;
      pathGuidanceWasPausedRef.current = false;
      pathGuidanceRanRef.current = false;
      resetGuidanceCompletionState();
      activePathContextRef.current = null;
      activePathLaunchGuidanceRef.current = undefined;
      activePathInstructionVideoRef.current = undefined;
      suppressPrefSaveRef.current = false;
      queueMicrotask(() => setLaunchStillnessConfig(null));
      clearLaunchConstraints?.();
      const _fbResetPracticeId = practiceId !== SAFE_LAUNCH_FALLBACK.practiceId;
      const _fbResetDuration = duration !== SAFE_LAUNCH_FALLBACK.durationMin;
      queueMicrotask(() => {
        setPathLaunchGuidance(undefined);
        setPathLaunchInstructionVideo(undefined);
        setInitiationBenchmarkContext(null);
        setPendingPathAutoStart(null);
        queuedPathAutoStartRequestIdRef.current = null;
        if (_fbResetPracticeId) setPracticeId(SAFE_LAUNCH_FALLBACK.practiceId);
        setHasExpandedOnce(true);
        if (_fbResetDuration) setDuration(SAFE_LAUNCH_FALLBACK.durationMin);
      });
      clearPracticeLaunchContext?.();
      return;
    }

    const ctx = practiceLaunchContext;
    queueMicrotask(() => setPathLaunchGuidance(undefined));
    queueMicrotask(() => setPathLaunchInstructionVideo(
      Object.prototype.hasOwnProperty.call(ctx, 'instructionVideo')
        ? (ctx.instructionVideo ?? null)
        : undefined
    ));
    pathGuidanceStartedRef.current = false;
    pathGuidanceWasPausedRef.current = false;
    pathGuidanceRanRef.current = false;
    resetGuidanceCompletionState();
    const benchmarkCtx = resolveInitiationV2BenchmarkContext(ctx);
    queueMicrotask(() => setInitiationBenchmarkContext(benchmarkCtx));
    suppressPrefSaveRef.current = ctx.persistPreferences === false;

    // Apply session overrides + locks (ephemeral). This prevents global defaults (e.g. photic) from being mutated.
    // Locking is only intended for curriculum-card launches ("dailySchedule").
    if (ctx.source) {
      const normalizedOverrides = ctx.overrides && typeof ctx.overrides === 'object' ? ctx.overrides : null;

      // Backward compat: treat practiceParamsPatch as overrides.practiceParams.
      const practiceParamsOverride =
        (normalizedOverrides?.practiceParams && typeof normalizedOverrides.practiceParams === 'object')
          ? normalizedOverrides.practiceParams
          : (ctx.practiceParamsPatch && typeof ctx.practiceParamsPatch === 'object' ? ctx.practiceParamsPatch : null);

      const mergedOverrides = {
        ...(normalizedOverrides || {}),
        ...(practiceParamsOverride ? { practiceParams: practiceParamsOverride } : {}),
      };

      // If locks aren't explicitly provided, infer locks from overridden practiceParams keys for dailySchedule.
      const inferredLocks = (() => {
        if (ctx.locks) return ctx.locks;
        if (ctx.source === 'dailySchedule') {
          // Curriculum card sessions are immutable by default: lock practice params + global settings overlays.
          // Caller can pass explicit ctx.locks to soften this if desired.
          return ['practiceParams', 'settings', 'tempoSync', 'awarenessScene'];
        }
        if (!practiceParamsOverride) return null;
        const out = [];
        for (const [bucketKey, bucketVal] of Object.entries(practiceParamsOverride)) {
          if (!bucketVal || typeof bucketVal !== 'object') continue;
          for (const k of Object.keys(bucketVal)) {
            out.push(`practiceParams.${bucketKey}.${k}`);
          }
        }
        return out.length ? out : null;
      })();

      applyLaunchConstraints?.({
        source: ctx.source,
        overrides: Object.keys(mergedOverrides).length ? mergedOverrides : null,
        locks: inferredLocks,
      });
    } else {
      clearLaunchConstraints?.();
    }

    if (ctx.practiceId && ctx.practiceId !== practiceId) {
      queueMicrotask(() => setPracticeId(ctx.practiceId));
      queueMicrotask(() => setHasExpandedOnce(true));
    } else if (ctx.practiceId) {
      queueMicrotask(() => setHasExpandedOnce(true));
    }

    const nextDurationMin = Number(ctx.durationMin);
    if (Number.isFinite(nextDurationMin) && nextDurationMin > 0 && nextDurationMin !== duration) {
      queueMicrotask(() => setDuration(nextDurationMin));
    }

    // Apply practice param overrides.
    if (ctx.overrides?.practiceParams && typeof ctx.overrides.practiceParams === 'object') {
      queueMicrotask(() => mergePracticeParamsPatch(ctx.overrides.practiceParams));
    } else if (ctx.practiceParamsPatch) {
      queueMicrotask(() => mergePracticeParamsPatch(ctx.practiceParamsPatch));
    }

    // Best-effort mapping for common config fields.
    if (ctx.practiceId === 'breath') {
      const breathPattern = ctx.practiceConfig?.breathPattern;
      const stillnessConfig = ctx.practiceConfig?.stillness;
      if (breathPattern && typeof breathPattern === 'string') {
        queueMicrotask(() => setBreathSubmode('breath'));
        queueMicrotask(() => mergePracticeParamsPatch({ breath: { preset: breathPattern.toLowerCase() } }));
      }
      if (stillnessConfig && typeof stillnessConfig === 'object') {
        const normalizedStillnessConfig = normalizeStillnessConfig(stillnessConfig, {
          fallback: persistedStillnessDefaults,
          sharedPreDelaySec: sharedBreathPreDelaySec,
        });
        queueMicrotask(() => {
          setLaunchStillnessConfig(normalizedStillnessConfig);
          setBreathSubmode('stillness');
        });
      } else {
        queueMicrotask(() => setLaunchStillnessConfig(null));
      }
    } else {
      queueMicrotask(() => setLaunchStillnessConfig(null));
    }

    // Handle circuit practice from curriculum (load circuit definition by ID)
    if (ctx.practiceId === 'circuit' && ctx.practiceConfig?.circuitId) {
      const circuitDef = getCircuit(ctx.practiceConfig.circuitId);
      if (circuitDef && circuitDef.exercises && circuitDef.exercises.length > 0) {
        // Transform circuit definition into the format expected by PracticeSection
        const circuitExercises = circuitDef.exercises.map((ex) => ({
          exercise: {
            id: ex.type || ex.id,
            name: ex.name,
            type: ex.type,
            practiceType: ex.practiceType,
            preset: ex.preset,
            sensoryType: ex.sensoryType,
          },
          duration: ex.duration,
        }));
        _circuitPendingRef.current = {
          exercises: circuitExercises,
          intervalBreakSec: circuitDef.intervalBreakSec ?? 10,
          circuitId: ctx.practiceConfig.circuitId,
        };
      }
    }

    // Preserve pathContext for session recording (survives clearPracticeLaunchContext)
    if (ctx.pathContext) {
      activePathContextRef.current = ctx.pathContext;
    } else {
      activePathContextRef.current = null;
    }
    activePathLaunchGuidanceRef.current = Object.prototype.hasOwnProperty.call(ctx, 'guidance')
      ? (ctx.guidance ?? null)
      : undefined;
    activePathInstructionVideoRef.current = Object.prototype.hasOwnProperty.call(ctx, 'instructionVideo')
      ? (ctx.instructionVideo ?? null)
      : undefined;

    const shouldAutoStartBreathLaunch =
      ctx.source === 'dailySchedule' &&
      ctx.autoStart === true &&
      ctx.practiceId === 'breath';
    const autoStartRequestId =
      typeof ctx.autoStartRequestId === 'string' && ctx.autoStartRequestId.length > 0
        ? ctx.autoStartRequestId
        : null;
    const expectedDurationSec =
      Number.isFinite(nextDurationMin) && nextDurationMin > 0
        ? Math.round(nextDurationMin * 60)
        : null;
    const expectedBreathSubmode =
      ctx.practiceConfig?.stillness && typeof ctx.practiceConfig.stillness === 'object'
        ? 'stillness'
        : 'breath';
    if (
      shouldAutoStartBreathLaunch &&
      autoStartRequestId &&
      queuedPathAutoStartRequestIdRef.current !== autoStartRequestId &&
      consumedPathAutoStartRequestIdRef.current !== autoStartRequestId
    ) {
      queuedPathAutoStartRequestIdRef.current = autoStartRequestId;
      queueMicrotask(() => {
        setPendingPathAutoStart({
          requestId: autoStartRequestId,
          practiceId: 'breath',
          durationSec: expectedDurationSec,
          breathSubmode: expectedBreathSubmode,
        });
      });
    } else if (!shouldAutoStartBreathLaunch) {
      queueMicrotask(() => setPendingPathAutoStart(null));
    }

    clearPracticeLaunchContext?.();
  }, [
    practiceLaunchContext,
    isRunning,
    practiceId,
    duration,
    mergePracticeParamsPatch,
    clearPracticeLaunchContext,
    applyLaunchConstraints,
    clearLaunchConstraints,
    getCircuit,
    resolveInitiationV2BenchmarkContext,
    persistedStillnessDefaults,
    sharedBreathPreDelaySec,
    resetGuidanceCompletionState,
  ]);

  useEffect(() => {
    if (isRunning && pathLaunchGuidance !== undefined) {
      pathGuidanceRanRef.current = true;
      return;
    }

    if (!isRunning && pathGuidanceRanRef.current) {
      pathGuidanceRanRef.current = false;
      pathGuidanceStartedRef.current = false;
      pathGuidanceWasPausedRef.current = false;
      resetGuidanceCompletionState();
      activePathContextRef.current = null;
      activePathLaunchGuidanceRef.current = undefined;
      queueMicrotask(() => setPathLaunchGuidance(undefined));
    }
  }, [isRunning, pathLaunchGuidance, resetGuidanceCompletionState]);

  useEffect(() => {
    if (isRunning) return;
    clearGuidanceFallbackCue();
    audioGuidance.stop();
  }, [isRunning, clearGuidanceFallbackCue]);

  const [_isStarting, setIsStarting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [pendingSummaryPayload, setPendingSummaryPayload] = useState(null);
  const [pendingSummaryNeedsRingUnmount, setPendingSummaryNeedsRingUnmount] = useState(false);
  const [ringTeardownRequested, setRingTeardownRequested] = useState(false);
  const [_lastSessionId, setLastSessionId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { startMicroNote, pendingMicroNote } = useJournalStore();
  const showSummaryModal = Boolean(showSummary && sessionSummary);
  const practiceActive = isRunning;
  const appMarker = practiceActive ? "practice:running" : "practice:idle";
  const isStillnessRuntime = Boolean(
    practiceActive
    && actualRunningPracticeId === "breath"
    && breathSubmode === "stillness"
  );
  const shouldRenderRingCanvas = Boolean(
    practiceActive
    && actualRunningPracticeId === "breath"
    && breathSubmode !== "stillness"
    && appMarker !== "practice:idle"
    && !showSummaryModal
    && !ringTeardownRequested
  );
  const awaitingRingUnmountForSummaryRef = useRef(false);
  const ringUnmountedForSummaryRef = useRef(false);

  const onPracticingChangeRef = useRef(onPracticingChange);
  const onBreathStateChangeRef = useRef(onBreathStateChange);

  useEffect(() => {
    onPracticingChangeRef.current = onPracticingChange;
  }, [onPracticingChange]);

  useEffect(() => {
    onBreathStateChangeRef.current = onBreathStateChange;
  }, [onBreathStateChange]);

  const notifyPracticingChange = useCallback((isPracticing, practiceId = null, requiresFullscreen = false) => {
    onPracticingChangeRef.current?.(isPracticing, practiceId, requiresFullscreen);
  }, []);

  const notifyBreathStateChange = useCallback((next) => {
    onBreathStateChangeRef.current?.(next);
  }, []);

  const queueSummaryAfterRingUnmount = useCallback((summaryPayload, expectRingUnmount = false) => {
    if (!summaryPayload) return;
    const mustWaitForUnmount = Boolean(expectRingUnmount);
    awaitingRingUnmountForSummaryRef.current = mustWaitForUnmount;
    ringUnmountedForSummaryRef.current = !mustWaitForUnmount;
    setPendingSummaryNeedsRingUnmount(mustWaitForUnmount);
    setPendingSummaryPayload(summaryPayload);
    setRingTeardownRequested(true);
  }, []);

  const handleBreathingRingUnmount = useCallback(() => {
    if (!awaitingRingUnmountForSummaryRef.current) return;
    ringUnmountedForSummaryRef.current = true;
    console.log("[BreathingRing] unmounted before summary");
  }, []);

  const prepareSessionSurfaceForRun = useCallback(() => {
    // A fresh run must clear any pending summary teardown before the next
    // ring-mount gate is evaluated, but only on an actual new run.
    awaitingRingUnmountForSummaryRef.current = false;
    ringUnmountedForSummaryRef.current = false;
    setPendingSummaryPayload(null);
    setPendingSummaryNeedsRingUnmount(false);
    setShowSummary(false);
    setSessionSummary(null);
    setRingTeardownRequested(false);
  }, []);

  useEffect(() => {
    if (!pendingSummaryPayload) return;
    if (shouldRenderRingCanvas) return;
    if (pendingSummaryNeedsRingUnmount && !ringUnmountedForSummaryRef.current) return;

    const _payload = pendingSummaryPayload;
    queueMicrotask(() => {
      setSessionSummary(_payload);
      setShowSummary(true);
      setPendingSummaryPayload(null);
      setPendingSummaryNeedsRingUnmount(false);
    });
    awaitingRingUnmountForSummaryRef.current = false;
    ringUnmountedForSummaryRef.current = false;
    console.log("[SessionSummaryModal] mounted after ring unmount");
  }, [pendingSummaryPayload, pendingSummaryNeedsRingUnmount, shouldRenderRingCanvas]);

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
    notifyPracticingChange(false, tutorialPracticeId ?? null, false);
  }, [isRunning, tutorialPracticeId, notifyPracticingChange]);

  // Initialize custom hooks for state management
  const breathSessionState = useBreathSessionManager();
  // Destructure breath session state for convenience
  const {
    timeLeft, setTimeLeft,
    countdownValue, setCountdownValue,
    circuitCountdownRef,
    breathCount, setBreathCount,
    sessionStartTime, setSessionStartTime,
    tapErrors, setTapErrors,
    setLastErrorMs,
    lastSignedErrorMs, setLastSignedErrorMs,
    activeCircuitId, setActiveCircuitId,
    circuitValidationError, setCircuitValidationError,
    circuitExerciseIndex, setCircuitExerciseIndex,
    circuitConfig, setCircuitConfig,
    setCircuitSavedPractice,
    setVisualizationCycles,
    activeRitual, setActiveRitual,
    setCurrentStepIndex,
    ringPresetIndex, setRingPresetIndex,
    isPresetSwitcherOpen, setIsPresetSwitcherOpen,
  } = breathSessionState;
  // Apply pending circuit setup written by the launch-context effect above
  useEffect(() => {
    if (!_circuitPendingRef.current) return;
    const pending = _circuitPendingRef.current;
    _circuitPendingRef.current = null;
    queueMicrotask(() => {
      setCircuitConfig({ exercises: pending.exercises, intervalBreakSec: pending.intervalBreakSec });
      setActiveCircuitId(pending.circuitId);
    });
  }, [practiceLaunchContext, setCircuitConfig, setActiveCircuitId]);

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
    }, [isRunning, activePracticeSession, activeCircuitId, clearActivePracticeSession]);

  const currentRingPreset = BREATH_RING_PRESETS[ringPresetIndex] || BREATH_RING_PRESETS[0];

  // REFACTOR BRIDGE: Map practiceParams to legacy variable names for stable behavior
  const { preset, pattern } = practiceParams.breath;
  const { 
    soundType, 
    volume: soundVolume, 
    binauralPresetId, 
    isochronicPresetId, 
    carrierFrequency,

    // Isochronic advanced (persisted)
    exactHz: isochronicExactHz,
    reverbWet: isochronicReverbWet,
    chorusWet: isochronicChorusWet,
  } = practiceParams.sound || {};
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
    audioEnabled: _cymaticsAudioEnabled
  } = practiceParams.cymatics;

  // Emotion params
  const { mode: emotionMode = 'discomfort', promptMode: emotionPromptMode = 'minimal' } = practiceParams.feeling || {};

  // Vipassana params correspond to specific visualization types
  const actualPracticeIdForVippa = getActualPracticeId(practiceId);
  const isCognitive = actualPracticeIdForVippa === 'cognitive_vipassana';
  const vTarget = isCognitive ? 'cognitive_vipassana' : 'somatic_vipassana';
  // Insight Meditation (Cognitive) defaults to Sakshi, Somatic defaults to Body Scan
  const sensoryType = practiceParams?.[vTarget]?.sensoryType || (isCognitive ? 'sakshi' : 'bodyScan');
  const { vipassanaTheme, vipassanaElement, scanType = 'full' } = practiceParams[vTarget];

  // Derived variant for VipassanaVisual

  // Derived Values
  const activeFreqSet = FREQUENCY_SETS[frequencySet] || SOLFEGGIO_SET;
  const selectedFrequency = activeFreqSet[selectedFrequencyIndex] || activeFreqSet[0];
  const binauralPreset = BINAURAL_PRESETS.find(p => p.name === binauralPresetId) || BINAURAL_PRESETS[0];
  const isochronicPreset = ISOCHRONIC_PRESETS.find(p => p.name === isochronicPresetId) || ISOCHRONIC_PRESETS[0];

  // HELPER SETTERS: Bridging old calls to new updateParams logic
  const setPreset = useCallback((val) => updateParams('breath', { preset: val }), [updateParams]);
  const setPattern = useCallback((val) => {
    if (typeof val === 'function') {
      // Handle updater function (must respect locks; do not bypass updateParams).
      setPracticeParams((prev) => {
        const basePath = 'practiceParams.breath.pattern';
        if (isLocked?.(basePath)) return prev;

        const prevBreath = prev?.breath || {};
        const prevPattern = prevBreath?.pattern || {};
        const computed = val(prevPattern);
        if (!computed || typeof computed !== 'object' || Array.isArray(computed)) return prev;

        const nextPattern = { ...prevPattern };
        for (const [k, v] of Object.entries(computed)) {
          if (isLocked?.(`${basePath}.${k}`)) continue;
          nextPattern[k] = v;
        }

        return {
          ...prev,
          breath: { ...prevBreath, pattern: nextPattern },
        };
      });
    } else {
      // Handle direct value
      updateParams('breath', { pattern: val });
    }
  }, [isLocked, setPracticeParams, updateParams]);
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
  // Isochronic advanced setters
  const setIsochronicExactHz = (val) => updateParams('sound', { exactHz: val });
  const setIsochronicReverbWet = (val) => updateParams('sound', { reverbWet: val });
  const setIsochronicChorusWet = (val) => updateParams('sound', { chorusWet: val });
  const setSensoryType = useCallback((val) => updateParams(vTarget, { sensoryType: val }), [updateParams, vTarget]);
  const setVipassanaTheme = (val) => updateParams(vTarget, { vipassanaTheme: val });
  const setVipassanaElement = (val) => updateParams(vTarget, { vipassanaElement: val });
  const setScanType = (val) => updateParams(vTarget, { scanType: val });
  const setGeometry = (val) => updateParams('visualization', { geometry: val });
  const setFadeInDuration = (val) => updateParams('visualization', { fadeInDuration: val });
  const setDisplayDuration = (val) => updateParams('visualization', { displayDuration: val });
  const setFadeOutDuration = (val) => updateParams('visualization', { fadeOutDuration: val });
  const setVoidDuration = (val) => updateParams('visualization', { voidDuration: val });
  const setAudioEnabled = (val) => updateParams('visualization', { audioEnabled: val });
  const setFrequencySet = (val) => updateParams('cymatics', { frequencySet: val });
  const setSelectedFrequency = (val) => {
    const currentSet = FREQUENCY_SETS[frequencySet] || SOLFEGGIO_SET;
    const idx = currentSet.findIndex(f => f.hz === val.hz);
    updateParams('cymatics', { selectedFrequencyIndex: idx !== -1 ? idx : 0 });
  };
  const setDriftEnabled = (val) => updateParams('cymatics', { driftEnabled: val });
  const setEmotionMode = (val) => updateParams('feeling', { mode: val });
  const setEmotionPromptMode = (val) => updateParams('feeling', { promptMode: val });
  const launchStillnessRuntimeConfig = launchStillnessConfig
    ? normalizeStillnessConfig(launchStillnessConfig, {
      fallback: persistedStillnessDefaults,
      sharedPreDelaySec: sharedBreathPreDelaySec,
    })
    : null;
  const isStillnessLocked = Boolean(
    breathSubmode === 'stillness'
    && launchStillnessRuntimeConfig
    && (activePracticeSession || isLocked?.('practiceParams.breath.stillness') || isLocked?.('practiceParams.breath') || isLocked?.('practiceParams'))
  );
  const stillnessConfig = isStillnessLocked && launchStillnessRuntimeConfig
    ? launchStillnessRuntimeConfig
    : persistedStillnessDefaults;
  const setPreDelaySec = (val) => {
    updateParams('breath', { preDelaySec: normalizeSeconds(val, sharedBreathPreDelaySec, 0, 20) });
  };
  const setStillness = (updates) => {
    if (!updates || typeof updates !== 'object') return;
    if (isStillnessLocked) return;

    const nextStillness = normalizeStillnessConfig(
      { ...(stillnessConfig || DEFAULT_STILLNESS_CONFIG), ...updates },
      { fallback: stillnessConfig || DEFAULT_STILLNESS_CONFIG, sharedPreDelaySec: sharedBreathPreDelaySec }
    );
    updateParams('breath', { stillness: nextStillness });
  };

  // Generic setter for consolidated practices with subModes (awareness, resonance, perception)
  const setActiveMode = (practiceId, modeKey) => updateParams(practiceId, { activeMode: modeKey });

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isRunning, setTimeLeft]);

  useEffect(() => {
    const audioStore = useTempoAudioStore.getState();

    if (!isRunning) {
      audioStore.stopReset();
      if (audioStore.source) {
        audioStore.setSource(null);
      }
      return;
    }

    if (pathLaunchGuidance === undefined) {
      return;
    }

    const guidanceSpec = pathLaunchGuidance;
    const audioFile = guidanceSpec?.audioUrl || null;

    if (!audioFile) {
      audioStore.stopReset();
      if (audioStore.source) {
        audioStore.setSource(null);
      }
      pathGuidanceStartedRef.current = false;
      pathGuidanceWasPausedRef.current = false;
      resetGuidanceCompletionState();
      return;
    }

    if (Number.isFinite(guidanceSpec?.volume)) {
      audioStore.setVolume(guidanceSpec.volume);
    }

    if (pathGuidanceCompletedRef.current) {
      audioStore.stopReset();
      if (audioStore.source) {
        audioStore.setSource(null);
      }
      return;
    }

    if (audioStore.source !== audioFile) {
      audioStore.setSource(audioFile);
      pathGuidanceStartedRef.current = false;
      pathGuidanceWasPausedRef.current = false;
      resetGuidanceCompletionState();
    }

    if (isSessionPaused) {
      pathGuidanceWasPausedRef.current = pathGuidanceStartedRef.current;
      audioStore.pause();
      return;
    }

    if (pathGuidanceWasPausedRef.current && guidanceSpec.resumeMode === 'restart') {
      audioStore.setSource(audioFile);
    }

    const shouldAutoplay = guidanceSpec.startMode !== 'manual' || pathGuidanceStartedRef.current;
    if (!shouldAutoplay) {
      return;
    }

    pathGuidanceWasPausedRef.current = false;
    pathGuidanceStartedRef.current = true;
    audioStore.play();
  }, [isRunning, isSessionPaused, pathLaunchGuidance, resetGuidanceCompletionState]);

  useEffect(() => {
    if (!isRunning || !guidanceSource || pathLaunchGuidance === undefined || pathGuidanceCompletedRef.current) {
      previousGuidanceTimeRef.current = Number.isFinite(guidanceCurrentTime) ? guidanceCurrentTime : 0;
      return;
    }

    if (guidanceStatus !== "playing" || isSessionPaused) {
      previousGuidanceTimeRef.current = Number.isFinite(guidanceCurrentTime) ? guidanceCurrentTime : 0;
      return;
    }

    const durationSec = Number.isFinite(guidanceDuration) ? guidanceDuration : 0;
    const currentTimeSec = Number.isFinite(guidanceCurrentTime) ? guidanceCurrentTime : 0;
    const previousTimeSec = Number.isFinite(previousGuidanceTimeRef.current) ? previousGuidanceTimeRef.current : 0;
    const nearGuidanceEndSec = Math.max(GUIDANCE_LOOP_WRAP_EPSILON_SEC, durationSec - GUIDANCE_LOOP_END_WINDOW_SEC);
    const wrappedFromLoop =
      durationSec > GUIDANCE_LOOP_END_WINDOW_SEC &&
      previousTimeSec >= nearGuidanceEndSec &&
      currentTimeSec <= GUIDANCE_LOOP_WRAP_EPSILON_SEC;

    previousGuidanceTimeRef.current = currentTimeSec;
    if (!wrappedFromLoop) {
      return;
    }

    pathGuidanceCompletedRef.current = true;
    useTempoAudioStore.getState().stopReset();
    if (useTempoAudioStore.getState().source) {
      useTempoAudioStore.getState().setSource(null);
    }

    const remainingMs = Math.max(0, Math.round((Number.isFinite(timeLeft) ? timeLeft : 0) * 1000));
    if (remainingMs < GUIDANCE_FALLBACK_MIN_REMAINING_MS || guidanceFallbackFiredRef.current) {
      return;
    }

    const sessionId =
      guidanceFallbackSessionIdRef.current ||
      activePathContextRef.current?.runId ||
      `practice-${Math.round(Number.isFinite(sessionStartTime) ? sessionStartTime : Date.now())}`;
    guidanceFallbackSessionIdRef.current = sessionId;
    guidanceFallbackFiredRef.current = true;

    console.info("[PROBE:guidance-ended-with-remaining-time]", {
      remainingMs,
      sessionId,
      source: guidanceSource,
      guidanceDurationSec: durationSec,
      guidanceCurrentTimeSec: currentTimeSec,
    });

    setGuidanceFallbackSubtitle(GUIDANCE_FALLBACK_LINE);
    guidanceFallbackSubtitleTimerRef.current = window.setTimeout(() => {
      guidanceFallbackSubtitleTimerRef.current = null;
      setGuidanceFallbackSubtitle(null);
    }, GUIDANCE_FALLBACK_SUBTITLE_MS);

    try {
      audioGuidance.speak(GUIDANCE_FALLBACK_LINE);
    } catch {
      void 0;
    }
  }, [
    guidanceCurrentTime,
    guidanceDuration,
    guidanceSource,
    guidanceStatus,
    isRunning,
    isSessionPaused,
    pathLaunchGuidance,
    sessionStartTime,
    timeLeft,
  ]);

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
      st.stopReset();
      if (st.source) {
        st.setSource(null);
      }
      // End tempo sync session on unmount
      useTempoSyncSessionStore.getState().endSession();
      // Clear any session-scoped overrides/locks to prevent leakage across mounts.
      useSessionOverrideStore.getState().clearLaunchConstraints?.();
    };
  }, []);

  // Auto-save preferences when they change (but not during active practice)
  useEffect(() => {
    // Don't persist curriculum/pilot overrides into user preferences.
    if (!isRunning && !activePracticeSession && !suppressPrefSaveRef.current) {
      const prev = lastSavedPrefsRef.current;
      const hasChanged = prev.practiceId !== practiceId ||
        prev.duration !== duration ||
        prev.practiceParams !== practiceParams;
      if (hasChanged) {
        savePreferences({
          practiceId,
          duration,
          practiceParams
        });
        lastSavedPrefsRef.current = { practiceId, duration, practiceParams };
      }
    }
  }, [practiceId, duration, practiceParams, isRunning, activePracticeSession]);

  useEffect(() => {
    if (preset && BREATH_PRESETS[preset]) {
      queueMicrotask(() => setPattern(BREATH_PRESETS[preset]));
    }
  }, [preset, setPattern]);

  useEffect(() => {
    if (practice === "Circuit" && !circuitConfig) {
      const defaultExercises = [
        { exercise: { id: 'breath', name: 'Breath Training', type: 'breath', practiceType: 'Breath & Stillness', preset: 'box' }, duration: 5 },
        { exercise: { id: 'cognitive', name: 'Cognitive Vipassana', type: 'focus', practiceType: 'Cognitive Vipassana' }, duration: 5 },
        { exercise: { id: 'somatic', name: 'Somatic Vipassana', type: 'body', practiceType: 'Somatic Vipassana', sensoryType: 'body' }, duration: 5 },
      ];
      queueMicrotask(() => setCircuitConfig({ exercises: defaultExercises, exerciseDuration: 5 }));
    }
  }, [practice, circuitConfig, setCircuitConfig]);

  const setupCircuitExercise = useCallback((exerciseItem) => {
    const { exercise, duration: exDuration } = exerciseItem;
    console.error(`[CIRCUIT SETUP] Setting up exercise: ${exercise.practiceType}`);
    prepareSessionSurfaceForRun();

    if (exercise.practiceType === 'Breath & Stillness') {
      console.trace(`[CIRCUIT] Setting practiceId to 'breath' for ${exercise.practiceType}`);
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
      console.trace(`[CIRCUIT] Setting practiceId to 'awareness' for ${exercise.practiceType}`);
      setPracticeId('awareness');
    } else if (exercise.practiceType === 'Somatic Vipassana') {
      console.trace(`[CIRCUIT] Setting practiceId to 'awareness' for ${exercise.practiceType}`);
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
    notifyPracticingChange(true);
    setSessionStartTime(performance.now());
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);
  }, [
    notifyPracticingChange,
    prepareSessionSurfaceForRun,
    setBreathCount,
    setDuration,
    setIsRunning,
    setLastErrorMs,
    setLastSignedErrorMs,
    setPattern,
    setPracticeId,
    setPreset,
    setSensoryType,
    setSessionStartTime,
    setTapErrors,
    setTimeLeft,
  ]);

  const startCircuitCountdown = useCallback((nextExercise) => {
    if (circuitCountdownRef.current) {
      clearInterval(circuitCountdownRef.current);
    }

    // Read intervalBreakSec from local circuitConfig state instead of circuit manager
    const breakDuration = Math.max(1, Math.min(60, circuitConfig?.intervalBreakSec ?? 10));
    setCountdownValue(breakDuration);
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
  }, [circuitConfig, circuitCountdownRef, setCountdownValue, setupCircuitExercise]);

  const handleCircuitComplete = useCallback(() => {
    // Capture curriculum context BEFORE clearing (same pattern as handleStop)
    const savedActivePracticeSession = activePracticeSession;
    const ringCanvasWasMounted = shouldRenderRingCanvas;
    const activeSessionDayNumber = typeof savedActivePracticeSession === 'object'
      ? savedActivePracticeSession?.dayNumber
      : savedActivePracticeSession;
    const activeSessionLegNumberRaw = typeof savedActivePracticeSession === 'object'
      ? savedActivePracticeSession?.legNumber
      : null;
    const activeSessionLegNumber = Number(activeSessionLegNumberRaw);
    const wasFromCurriculum = !!activeSessionDayNumber;

    clearActivePracticeSession();
    setRingTeardownRequested(true);
    setIsRunning(false);
    notifyPracticingChange(false);

    logCircuitCompletionEvent('custom', circuitConfig.exercises);

    const totalDuration = circuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0);

    // Log leg completion if from curriculum
    if (wasFromCurriculum) {
      const {
        logLegCompletion,
        getDayLegsWithStatus,
        getCurriculumDay,
      } = useCurriculumStore.getState();
      const curriculumDay = getCurriculumDay(activeSessionDayNumber);

      if (curriculumDay) {
        const completedLegs = getDayLegsWithStatus(activeSessionDayNumber).filter(leg => leg.completed);
        const currentLegNumber = Number.isFinite(activeSessionLegNumber) && activeSessionLegNumber > 0
          ? activeSessionLegNumber
          : (completedLegs.length + 1);

        logLegCompletion(activeSessionDayNumber, currentLegNumber, {
          duration: totalDuration,
          focusRating: null,
          challenges: [],
          notes: '',
        });
      }
    }

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
        activePathId: activePathContextRef.current?.activePathId || null,
        runId: activePathContextRef.current?.runId || null,
        dayIndex: activePathContextRef.current?.dayIndex || null,
        weekIndex: activePathContextRef.current?.weekIndex || null,
        forceScheduleMatched: getForceScheduleMatchedPayload(),
      });
    } catch (e) {
      console.error("Failed to save circuit session:", e);
    }

    queueSummaryAfterRingUnmount({
      type: 'circuit',
      circuitName: 'Custom Circuit',
      exercisesCompleted: circuitConfig.exercises.length,
      totalDuration: totalDuration,
    }, ringCanvasWasMounted);

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
  }, [
    activeCircuitId,
    activePracticeSession,
    circuitConfig,
    clearActivePracticeSession,
    getForceScheduleMatchedPayload,
    logCircuitCompletionEvent,
    notifyPracticingChange,
    queueSummaryAfterRingUnmount,
    setActiveCircuitId,
    setCircuitExerciseIndex,
    setIsRunning,
    setLastSessionId,
    setPracticeId,
    setRingTeardownRequested,
    shouldRenderRingCanvas,
    startMicroNote,
  ]);

  const advanceCircuitExercise = useCallback(() => {
    if (!activeCircuitId || !circuitConfig) return;

    const nextIndex = circuitExerciseIndex + 1;
    if (nextIndex < circuitConfig.exercises.length) {
      setCircuitExerciseIndex(nextIndex);
      const nextExercise = circuitConfig.exercises[nextIndex];
      startCircuitCountdown(nextExercise);
    } else {
      handleCircuitComplete();
    }
  }, [
    activeCircuitId,
    circuitConfig,
    circuitExerciseIndex,
    handleCircuitComplete,
    setCircuitExerciseIndex,
    startCircuitCountdown,
  ]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")} `;
  };

  const handleTogglePause = useCallback(() => {
    if (!isRunning) return;

    setIsSessionPaused((wasPaused) => {
      if (!wasPaused) {
        pausedAtRef.current = performance.now();
        return true;
      }

      const pausedAt = pausedAtRef.current;
      const pausedDurationMs = Number.isFinite(pausedAt) ? performance.now() - pausedAt : 0;
      pausedAtRef.current = null;

      if (pausedDurationMs > 0) {
        setSessionStartTime((previousStart) =>
          Number.isFinite(previousStart) ? previousStart + pausedDurationMs : previousStart
        );
      }

      return false;
    });
  }, [isRunning, setIsSessionPaused, setSessionStartTime]);

  const handleStop = useCallback((options = {}) => {
    // options.completed = true means the session timer naturally reached 0
    // If not provided (manual stop), we check timeLeft
    const wasNaturalCompletion = options.completed === true;
    const ringCanvasWasMounted = shouldRenderRingCanvas;
    
    // Capture curriculum context BEFORE clearing
    const savedActivePracticeSession = activePracticeSession;
    const activeSessionDayNumber = typeof savedActivePracticeSession === 'object'
      ? savedActivePracticeSession?.dayNumber
      : savedActivePracticeSession;
    const activeSessionLegNumberRaw = typeof savedActivePracticeSession === 'object'
      ? savedActivePracticeSession?.legNumber
      : null;
    const activeSessionLegNumber = Number(activeSessionLegNumberRaw);
    const isCircuitSession = activeCircuitId && circuitConfig;

    // If this is a circuit session, delegate to circuit handler
    if (isCircuitSession) {
      handleCircuitComplete();
      return;
    }
    if (wasNaturalCompletion) {
      completionProbeMetaRef.current = null;
    }
    const wasFromCurriculum = !!activeSessionDayNumber;

    // Stop tempo sync audio if playing
    if (window.__tempoSyncStopAudio) {
      window.__tempoSyncStopAudio();
    }

    // Now clear the session
    pausedAtRef.current = null;
    setIsSessionPaused(false);
    clearActivePracticeSession();
    setRingTeardownRequested(true);
    setIsRunning(false);
    notifyPracticingChange(false);
    notifyBreathStateChange(null);

    // Use passed completion status if available (from SensorySession timer),
    // otherwise fall back to checking timeLeft (may be stale due to React batching)
    const exitType = wasNaturalCompletion ? 'completed' : (timeLeft <= 0 ? 'completed' : 'abandoned');
    const instrumentationData = endSession(exitType);

    // Calculate actual duration
    // If wasNaturalCompletion, the full planned duration elapsed (don't trust stale timeLeft)
    // Otherwise, use timer-based calculation
    const planedDurationSeconds = duration * 60;
    const timerBasedDurationSeconds = wasNaturalCompletion 
      ? planedDurationSeconds  // Full duration when naturally completed
      : planedDurationSeconds - timeLeft; // How much time elapsed before manual stop
    const instrumentationDurationSeconds = instrumentationData?.duration_ms
      ? Math.floor(instrumentationData.duration_ms / 1000)
      : 0;
    // Use the larger of the two (timer is more accurate for completion, instrumentation for analytics)
    const actualDurationSeconds = Math.max(timerBasedDurationSeconds, instrumentationDurationSeconds);

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

    let recordedSession = null;
    try {
      let domain = 'breathwork';
      const p = practice.toLowerCase();
      if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
      else if (p === 'somatic vipassana') domain = sensoryType;
      else if (p === 'ritual') domain = 'ritual';
      else if (p === 'sound') domain = 'sound';
      else if (p.includes('feeling')) domain = 'focus';
      else if (p.includes('cognitive') || p.includes('insight')) domain = 'focus';

      const actualPracticeId = getActualPracticeId(practiceId);

      // Use exitType (timer-based) as the source of truth for completion status
      // exitType is 'completed' when timeLeft <= 0, which means the session ran to completion
      const completion = exitType;

      if (import.meta.env.DEV) {
        console.log('[PracticeSection] recordPracticeSession about to run', {
          practiceId,
          actualPracticeId,
          sensoryType,
          sakshiVersion,
          exitType: completion,
        });
      }

      // For emotion practice (feeling), use emotionMode; for others use activeMode or breathSubmode
      let practiceMode = practiceParams?.activeMode || (practiceId === 'breath' ? breathSubmode : null);
      if (actualPracticeId === 'feeling') {
        practiceMode = emotionMode;
      }

      const endedAtIso = new Date().toISOString();
      const actualDurationMinutes = Math.round((actualDurationSeconds / 60) * 10) / 10;
      const actualDomain = domain;

      recordedSession = recordPracticeSession({
        domain: actualDomain,
        duration: actualDurationMinutes,
        durationSec: actualDurationSeconds,
        exitType: completion,

        practiceId: actualPracticeId ?? practiceId,
        practiceMode: practiceMode ?? null,
        configSnapshot: {
          breathSubmode: breathSubmode ?? null,
          breathPreset: preset ?? null,
          sakshiVersion: actualPracticeId === 'cognitive_vipassana' ? sakshiVersion : null,
        },

        endedAt: endedAtIso,
        activePathId: activePathContextRef.current?.activePathId || null,
        runId: activePathContextRef.current?.runId || null,
        dayIndex: activePathContextRef.current?.dayIndex || null,
        weekIndex: activePathContextRef.current?.weekIndex || null,
        forceScheduleMatched: getForceScheduleMatchedPayload(),
      });
    } catch (e) {
      console.error("Failed to save session:", e);
    }

    setActiveRitual(null);
    setCurrentStepIndex(0);

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
      const curriculumDay = getCurriculumDay(activeSessionDayNumber);

      if (curriculumDay) {
        // Find which leg was just completed
        const completedLegs = getDayLegsWithStatus(activeSessionDayNumber).filter(leg => leg.completed);
        currentLegNumber = Number.isFinite(activeSessionLegNumber) && activeSessionLegNumber > 0
          ? activeSessionLegNumber
          : (completedLegs.length + 1);
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

    // For emotion practice, always show summary. For others, show if >= 30 seconds
    const actualPracticeIdCheck = getActualPracticeId(practiceId);
    const isEmotionPractice = actualPracticeIdCheck === 'feeling';
    const isCognitiveVipassana = actualPracticeIdCheck === 'cognitive_vipassana';
    const shouldShowSummary = isEmotionPractice || shouldJournal;

    if (shouldShowSummary) {
      // For emotion practice, calculate completion count and get closing line
      let emotionClosingLine = null;
      let emotionCompletionCount = null;
      let sakshiCompletionCount = null;
      if (isEmotionPractice) {
        const { sessionsV2 } = useProgressStore.getState();
        const allSessions = sessionsV2 || [];
        // Use the emotionMode captured at function start (it was used for recording)
        // This is the same value that was assigned to practiceMode in the try block
        emotionCompletionCount = allSessions.filter(s =>
          s.practiceId === 'feeling' &&
          s.practiceMode === emotionMode &&
          s.completion === 'completed'
        ).length;
        emotionClosingLine = getEmotionClosingLine(emotionMode);
      }
      const sakshiVersionRecorded = recordedSession?.configSnapshot?.sakshiVersion ?? sakshiVersion;

      if (isCognitiveVipassana) {
        const { sessionsV2 } = useProgressStore.getState();
        const allSessions = sessionsV2 || [];
        sakshiCompletionCount = allSessions.filter(s =>
          s.practiceId === 'cognitive_vipassana' &&
          s.completion === 'completed' &&
          (s.configSnapshot?.sakshiVersion ?? null) === sakshiVersionRecorded
        ).length;
      }

      // For emotion practice, use the emotion label instead of practice name
      const summaryPracticeLabel = isEmotionPractice
        ? getEmotionLabel(emotionMode)
        : (isCognitiveVipassana
          ? (sakshiVersionRecorded === 1 ? 'Sakshi I' : 'Sakshi II')
          : practice);

      const recordedDurationMinutes = recordedSession?.durationSec
        ? Math.round((recordedSession.durationSec / 60) * 10) / 10
        : Math.round((actualDurationSeconds / 60) * 10) / 10;

      queueSummaryAfterRingUnmount({
        practice: summaryPracticeLabel,
        duration: recordedDurationMinutes,
        tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
        breathCount,
        exitType,
        nextLeg: nextLegInfo,
        curriculumDayNumber: wasFromCurriculum ? activeSessionDayNumber : null,
        legNumber: currentLegNumber,
        totalLegs: totalLegsForDay,
        dailyStats: dailyStatsInfo,
        practiceMode: isEmotionPractice ? emotionMode : null,
        closingLine: emotionClosingLine,
        emotionCompletionCount: emotionCompletionCount,
        sakshiCompletionCount: sakshiCompletionCount,
        sessionRecord: recordedSession,
      }, ringCanvasWasMounted);

      if (recordedSession) {
        setLastSessionId(recordedSession.id);
        startMicroNote(recordedSession.id);
      }
    }
  }, [
    activeCircuitId,
    activePracticeSession,
    breathCount,
    breathSubmode,
    circuitConfig,
    clearActivePracticeSession,
    duration,
    emotionMode,
    endSession,
    getActualPracticeId,
    getForceScheduleMatchedPayload,
    handleCircuitComplete,
    notifyBreathStateChange,
    notifyPracticingChange,
    practice,
    practiceId,
    practiceParams,
    preset,
    queueSummaryAfterRingUnmount,
    sakshiVersion,
    sensoryType,
    setActiveRitual,
    setCurrentStepIndex,
    setIsRunning,
    setIsSessionPaused,
    setLastSessionId,
    setRingTeardownRequested,
    setTimeLeft,
    shouldRenderRingCanvas,
    startMicroNote,
    tapErrors,
    timeLeft,
  ]);

  const queueNaturalSessionCompletion = useCallback((meta) => {
    if (completionDispatchedRef.current) return;
    const pendingFinishWasArmed = pendingCycleFinishRef.current;
    completionDispatchedRef.current = true;
    pendingCycleFinishRef.current = false;
    setPendingCycleFinish(false);
    completionProbeMetaRef.current = {
      ...meta,
      pendingFinish: pendingFinishWasArmed,
      completedAtMs: performance.now(),
    };
    queueMicrotask(() => handleStop({ completed: true }));
  }, [handleStop]);

  const getBreathCycleSnapshotRef = useRef(null);
  const queueNaturalSessionCompletionRef = useRef(null);
  const advanceCircuitExerciseRef = useRef(null);

  useEffect(() => {
    queueNaturalSessionCompletionRef.current = queueNaturalSessionCompletion;
  }, [queueNaturalSessionCompletion]);

  useEffect(() => {
    advanceCircuitExerciseRef.current = advanceCircuitExercise;
  }, [advanceCircuitExercise]);

  const handleBreathCycleComplete = useCallback(() => {
    lastCycleBoundaryAtRef.current = performance.now();
    setBreathCount((prev) => prev + 1);

    if (!pendingCycleFinishRef.current) {
      return;
    }

    queueNaturalSessionCompletion({
      trigger: 'pending-finish-cycle-boundary',
      phase: 'cycle-end',
      boundary: 'cycle-end',
    });
  }, [queueNaturalSessionCompletion, setBreathCount]);

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


  // Declare executeStart before useEffect that calls it
  // Deferred exhaustive-deps follow-up: this callback participates in a broader
  // start-session helper chain, so dependency cleanup should be handled as one
  // bounded callback-surface task rather than a one-line dependency edit.
  const executeStart = useCallback(() => {
    // Validate circuit for consecutive duplicate exercises
    const validateCircuitExercises = (exercises) => {
      if (!exercises || exercises.length === 0) {
        return null;
      }
      for (let i = 1; i < exercises.length; i++) {
        if (exercises[i].exercise?.id === exercises[i - 1].exercise?.id) {
          return "You can't run the same practice twice in a row. Insert a different practice between repeats.";
        }
      }
      return null;
    };
    if (!practiceId) {
      return;
    }

    // Get the actual practice ID to run (handles subModes)
    const actualPracticeId = getActualPracticeId(practiceId);

    const activePathContext = activePathContextRef.current;
    const launchedPathGuidance = activePathLaunchGuidanceRef.current;
    const launchedPathInstructionVideo = activePathInstructionVideoRef.current;
    const pathSlotIndex = Number(activePathContext?.slotIndex);
    const hasPathOccurrenceContext = Boolean(activePathContext?.activePathId) && Number.isFinite(pathSlotIndex);
    let resolvedPathGuidance = launchedPathGuidance;
    let resolvedPathInstructionVideo = launchedPathInstructionVideo;

    if ((resolvedPathGuidance === undefined || resolvedPathInstructionVideo === undefined) && hasPathOccurrenceContext) {
      const pathDef = getPathById(activePathContext.activePathId);
      const pathDayIndex = Number(activePathContext?.dayIndex);
      const occurrences = getPathPracticeOccurrences(pathDef, pathDayIndex);
      const occurrence = occurrences[pathSlotIndex] ?? null;
      if (resolvedPathGuidance === undefined) {
        resolvedPathGuidance = occurrence && typeof occurrence === 'object'
          ? (occurrence.guidance ?? null)
          : null;
      }
      if (resolvedPathInstructionVideo === undefined) {
        resolvedPathInstructionVideo = occurrence && typeof occurrence === 'object'
          ? (occurrence.instructionVideo ?? null)
          : null;
      }
    }

    if ((resolvedPathGuidance === undefined || resolvedPathInstructionVideo === undefined) && !hasPathOccurrenceContext && activePracticeSession) {
      const activeLeg = getActivePracticeLeg();
      if (resolvedPathGuidance === undefined) {
        resolvedPathGuidance = activeLeg?.guidance ?? null;
      }
      if (resolvedPathInstructionVideo === undefined) {
        resolvedPathInstructionVideo = activeLeg?.instructionVideo ?? null;
      }
    }

    // Persist preferences only for manual starts (not curriculum/schedule recommendations).
    if (!activePracticeSession && !suppressPrefSaveRef.current) {
      savePreferences({
        practiceId,
        duration,
        practiceParams
      });
      lastSavedPrefsRef.current = { practiceId, duration, practiceParams };
    }

    const logScheduleAdherenceStart = useNavigationStore.getState().logScheduleAdherenceStart;
    if (logScheduleAdherenceStart) {
      logScheduleAdherenceStart({ actualStartTime: Date.now() });
    }

    if (practiceId === "circuit") {
      if (!circuitConfig || circuitConfig.exercises.length === 0) {
        return;
      }

      // Validate circuit for consecutive duplicates
      const validationError = validateCircuitExercises(circuitConfig.exercises);
      if (validationError) {
        setCircuitValidationError(validationError);
        return;
      }

      setCircuitValidationError(null);
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
      setPathLaunchGuidance(resolvedPathGuidance !== undefined ? resolvedPathGuidance : undefined);
      setPathLaunchInstructionVideo(resolvedPathInstructionVideo !== undefined ? resolvedPathInstructionVideo : undefined);
      setIsRunning(true);
      notifyPracticingChange(true, actualPracticeId, practiceConfig?.requiresFullscreen || false);
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
    setPathLaunchGuidance(resolvedPathGuidance !== undefined ? resolvedPathGuidance : undefined);
    setPathLaunchInstructionVideo(resolvedPathInstructionVideo !== undefined ? resolvedPathInstructionVideo : undefined);
    // Clear any residual teardown state in the same batch as isRunning=true so that
    // shouldRenderRingCanvas evaluates true on the first render of the new session.
    // Pre-session edits can leave ringTeardownRequested=true from a prior session's
    // teardown; resetting here pairs with prepareSessionSurfaceForRun to guarantee
    // the gate is open exactly when the run becomes active.
    setRingTeardownRequested(false);
    setIsRunning(true);
    notifyPracticingChange(true, actualPracticeId, practiceConfig?.requiresFullscreen || false);
    const nextSessionStartTime = performance.now();
    setSessionStartTime(nextSessionStartTime);
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
  }, [practiceId, circuitConfig, duration, practiceParams, sensoryType, tempoSyncEnabled, tempoSyncBpm, setupCircuitExercise, startSession, getActualPracticeId, notifyPracticingChange, practice, activeRitual, isCognitive, activePracticeSession, getActivePracticeLeg, setCircuitValidationError, setCircuitSavedPractice, setActiveCircuitId, setCircuitExerciseIndex, setPathLaunchGuidance, setRingTeardownRequested, setIsRunning, setSessionStartTime, setTapErrors, setLastErrorMs, setLastSignedErrorMs, setBreathCount]);

  // Clear validation error when circuit config changes (user edits circuit)
  useEffect(() => {
    if (circuitValidationError && practiceId === 'circuit') {
      queueMicrotask(() => setCircuitValidationError(null));
    }
  }, [circuitConfig, practiceId, circuitValidationError, setCircuitValidationError]);

  const handleStart = useCallback((durationOverrideSec = null, ritualOverride = null, options = null) => {
    const consumePendingAutoStart = options?.consumePendingAutoStart === true;

    if (consumePendingAutoStart) {
      setPendingPathAutoStart(null);
    }

    // Clear initiation context — benchmark gating removed; recording happens at path selection only
    if (practiceId === 'breath' && initiationBenchmarkContext) {
      setInitiationBenchmarkContext(null);
    }

    // Get the actual practice ID to run (handles subModes)
    const actualPracticeId = getActualPracticeId(practiceId);

    // Special handling for Photic practice
    if (practiceId === "photic" || actualPracticeId === "photic") {
      onOpenPhotic?.();
      return;
    }

    const ritualForStart = ritualOverride ?? activeRitual;

    // Validate that a ritual is selected before starting a Ritual practice
    if (practiceId === "integration" && !ritualForStart) {
      console.warn("[PracticeSection] Cannot start ritual practice - no ritual selected");
      // Show alert to user
      alert("Please select a ritual before beginning practice.");
      return;
    }

    if (Number.isFinite(durationOverrideSec) && durationOverrideSec > 0) {
      setDuration(durationOverrideSec / 60);
      setTimeLeft(durationOverrideSec);
    }

    prepareSessionSurfaceForRun();
    pausedAtRef.current = null;
    setIsSessionPaused(false);
    setIsStarting(true);

    const isStillnessStart = practiceId === "breath" && breathSubmode === "stillness";
    const modePreDelaySec = isStillnessStart
      ? normalizeSeconds(stillnessConfig?.preDelaySec, sharedBreathPreDelaySec, 0, 20)
      : normalizeSeconds(sharedBreathPreDelaySec, 0, 0, 20);
    const needsAudioCountdown = practiceId === "breath" && !isStillnessStart && tempoSyncEnabled;
    const totalCountdownSec = modePreDelaySec + (needsAudioCountdown ? 3 : 0);
    const shouldSkipDirectBreathPreDelay = (
      practiceId === "breath"
      && !isStillnessStart
      && !consumePendingAutoStart
      && !needsAudioCountdown
      && modePreDelaySec > 0
    );
    const effectiveCountdownSec = shouldSkipDirectBreathPreDelay ? 0 : totalCountdownSec;
    const shouldBypassDirectBreathHandoff = (
      practiceId === "breath"
      && !isStillnessStart
      && !consumePendingAutoStart
      && effectiveCountdownSec === 0
    );

    if (effectiveCountdownSec > 0) {
      setCountdownValue(effectiveCountdownSec);

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
      }, effectiveCountdownSec * 1000);
    } else if (shouldBypassDirectBreathHandoff) {
      setIsStarting(false);
      queueMicrotask(() => {
        executeStart();
      });
    } else {
      // Normal start animation (1.4 seconds)
      setTimeout(() => {
        setIsStarting(false);
        executeStart();
      }, 1400);
    }
  }, [
    practiceId,
    initiationBenchmarkContext,
    getActualPracticeId,
    onOpenPhotic,
    activeRitual,
    setPendingPathAutoStart,
    setInitiationBenchmarkContext,
    setDuration,
    setTimeLeft,
    prepareSessionSurfaceForRun,
    breathSubmode,
    stillnessConfig,
    sharedBreathPreDelaySec,
    tempoSyncEnabled,
    setIsSessionPaused,
    setIsStarting,
    setCountdownValue,
    executeStart,
  ]);

  useLayoutEffect(() => {
    if (!pendingPathAutoStart || isRunning) return;
    if (consumedPathAutoStartRequestIdRef.current === pendingPathAutoStart.requestId) return;
    if (practiceId !== pendingPathAutoStart.practiceId) return;
    if (
      pendingPathAutoStart.durationSec !== null &&
      Math.round(duration * 60) !== pendingPathAutoStart.durationSec
    ) {
      return;
    }
    if (practiceId === 'breath' && breathSubmode !== pendingPathAutoStart.breathSubmode) {
      return;
    }

    consumedPathAutoStartRequestIdRef.current = pendingPathAutoStart.requestId;
    queueMicrotask(() => {
      handleStart(null, null, { consumePendingAutoStart: true });
    });
  }, [pendingPathAutoStart, isRunning, practiceId, duration, breathSubmode, handleStart]);

  const handleSelectRitual = (ritual) => {
    // Persist default ritual on selection
    localStorage.setItem('immanenceOS.rituals.defaultRitualId', ritual.id);

    setActiveRitual(ritual);
    setCurrentStepIndex(0);
    const totalSeconds = ritual.steps?.reduce((sum, s) => sum + (s.duration || 60), 0) || 600;
    setDuration(Math.ceil(totalSeconds / 60));
    setTimeLeft(totalSeconds);
  };

  const handleRitualReturn = () => {
    console.log("[PRACTICE SECTION] handleRitualReturn called");
    console.log("[PRACTICE SECTION] Current state:", {
      activeRitual: activeRitual?.id || "null",
      isRunning,
      showSummary,
      sessionSummary: sessionSummary ? "exists" : "null"
    });

    // CRITICAL FIX: Clear ALL state that gates the practice menu visibility
    // The menu is hidden by: display: showSummaryModal || isRunning ? 'none' : 'flex'
    // So we must clear both conditions
    
    console.log("[PRACTICE SECTION] Clearing all session state...");
    
    // 1. Clear summary state (in case something triggered it)
    setShowSummary(false);
    setSessionSummary(null);
    
    // 2. Exit session surface by setting isRunning = false
    pausedAtRef.current = null;
    setIsSessionPaused(false);
    setIsRunning(false);
    
    // 3. Clear the ritual selection
    setActiveRitual(null);
    setCurrentStepIndex(0);
    
    // 4. Notify parent that we're no longer practicing
    notifyPracticingChange(false);

    console.log("[PRACTICE SECTION] ✓ All state cleared - RitualSelectionDeck should now appear");
  };

  const handleQuickStart = () => {
    const defaultRitualId = localStorage.getItem('immanenceOS.rituals.defaultRitualId');
    if (!defaultRitualId) return;

    const ritual = getRitualById(defaultRitualId);
    if (!ritual) return;

    handleSelectRitual(ritual);
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

  const previousTimeLeftRef = useRef(timeLeft);

  // Update tempo sync session elapsed time (calculates segment transitions)
  useEffect(() => {
    if (!tempoSessionActive || !isRunning || !songDurationSec) return;
    // Calculate elapsed from remaining timeLeft
    const totalElapsedSec = songDurationSec - timeLeft;
    useTempoSyncSessionStore.getState().updateElapsed(totalElapsedSec, tempoSyncBpm);
  }, [tempoSessionActive, isRunning, timeLeft, songDurationSec, tempoSyncBpm]);

  const runtimeBreathBenchmarkActive = Boolean(tempoSyncEnabled && hasBenchmark);
  const runtimeBreathBenchmark = runtimeBreathBenchmarkActive ? benchmark : null;

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
    hasBenchmark: runtimeBreathBenchmarkActive,
    benchmark: runtimeBreathBenchmark,
    tempoSyncEnabled,
    tempoSyncBpm,
    tempoPhaseDuration,
    tempoBeatsPerPhase,
    tempoSessionActive,
    tempoSessionEffective,
    sessionStartTime,
    onBreathStateChange: notifyBreathStateChange,
  });

  const showFeedback = lastSignedErrorMs !== null && isBreathPractice && !isStillnessRuntime;
  const showBreathCountUi = showBreathCount && !isStillnessRuntime;
  const timeLeftText = formatTime(timeLeft);
  const pendingCycleFinishRef = useRef(false);
  const completionDispatchedRef = useRef(false);
  const completionProbeMetaRef = useRef(null);
  const lastCycleBoundaryAtRef = useRef(null);
  const [pendingCycleFinish, setPendingCycleFinish] = useState(false);

  const getBreathCycleSnapshot = useCallback((atMs = performance.now()) => {
    if (!isBreathRunningSession || breathSubmode === 'stillness') return null;
    if (!Number.isFinite(sessionStartTime)) return null;

    const inhale = Number(breathingPatternForRing?.inhale) || 0;
    const holdTop = Number(breathingPatternForRing?.holdTop) || 0;
    const exhale = Number(breathingPatternForRing?.exhale) || 0;
    const holdBottom = Number(breathingPatternForRing?.holdBottom) || 0;
    const cycleDurationSec = inhale + holdTop + exhale + holdBottom;
    if (!(cycleDurationSec > 0)) return null;

    const cycleDurationMs = cycleDurationSec * 1000;
    const elapsedMs = Math.max(0, atMs - sessionStartTime);
    const cyclePositionMs = elapsedMs % cycleDurationMs;
    const boundaryDistanceMs = Math.min(cyclePositionMs, cycleDurationMs - cyclePositionMs);
    const cyclePositionSec = cyclePositionMs / 1000;

    let phase = 'holdBottom';
    if (cyclePositionSec < inhale) {
      phase = 'inhale';
    } else if (cyclePositionSec < inhale + holdTop) {
      phase = 'holdTop';
    } else if (cyclePositionSec < inhale + holdTop + exhale) {
      phase = 'exhale';
    }

    return {
      phase,
      cycleDurationMs,
      cyclePositionMs,
      boundaryDistanceMs,
      atBoundary: boundaryDistanceMs <= BREATH_CYCLE_BOUNDARY_EPSILON_MS,
    };
  }, [breathSubmode, breathingPatternForRing, isBreathRunningSession, sessionStartTime]);

  useEffect(() => {
    getBreathCycleSnapshotRef.current = getBreathCycleSnapshot;
  }, [getBreathCycleSnapshot]);

  useEffect(() => {
    if (!pendingCycleFinish) return undefined;
    if (!isRunning || isSessionPaused || !isBreathRunningSession || breathSubmode === 'stillness') {
      return undefined;
    }

    let frameId = null;

    const checkBoundary = () => {
      const now = performance.now();
      const cycleSnapshot = getBreathCycleSnapshot(now);
      if (cycleSnapshot?.atBoundary) {
        lastCycleBoundaryAtRef.current = now;
        queueNaturalSessionCompletion({
          trigger: 'pending-finish-local-boundary',
          phase: cycleSnapshot.phase || 'inhale',
          boundary: 'exact-cycle-boundary',
        });
        return;
      }

      frameId = requestAnimationFrame(checkBoundary);
    };

    frameId = requestAnimationFrame(checkBoundary);
    return () => {
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [
    breathSubmode,
    getBreathCycleSnapshot,
    isBreathRunningSession,
    isRunning,
    isSessionPaused,
    pendingCycleFinish,
    queueNaturalSessionCompletion,
  ]);

  useEffect(() => {
    let interval = null;
    const previousTimeLeft = previousTimeLeftRef.current;
    const reachedZeroThisRender = previousTimeLeft > 0 && timeLeft === 0;
    previousTimeLeftRef.current = timeLeft;
    const isBreathCycleCompletionSession =
      isBreathRunningSession &&
      breathSubmode !== 'stillness' &&
      !activeCircuitId &&
      !circuitConfig;

    if (isRunning && !isSessionPaused && practice !== "Rituals") {
      if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
      } else if (reachedZeroThisRender && countdownValue === null) {
        const now = performance.now();
        const cycleSnapshot = getBreathCycleSnapshotRef.current?.(now) ?? null;

        if (activeCircuitId && circuitConfig) {
          advanceCircuitExerciseRef.current?.();
        } else if (isBreathCycleCompletionSession) {
          const boundaryJustCrossed =
            Number.isFinite(lastCycleBoundaryAtRef.current) &&
            Math.abs(now - lastCycleBoundaryAtRef.current) <= BREATH_CYCLE_BOUNDARY_EPSILON_MS;

          if (boundaryJustCrossed || cycleSnapshot?.atBoundary) {
            queueNaturalSessionCompletionRef.current?.({
              trigger: 'raw-expiry-immediate',
              phase: cycleSnapshot?.phase || 'inhale',
              boundary: 'exact-cycle-boundary',
            });
          } else {
            pendingCycleFinishRef.current = true;
            setPendingCycleFinish(true);
          }
        } else {
          queueNaturalSessionCompletionRef.current?.({
            trigger: 'raw-expiry-non-breath',
            phase: 'n/a',
            boundary: 'timer-zero',
          });
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    activeCircuitId,
    breathSubmode,
    circuitConfig,
    countdownValue,
    isBreathRunningSession,
    isRunning,
    isSessionPaused,
    practice,
    setTimeLeft,
    timeLeft,
  ]);

  const isBreathPracticeRef = useRef(isBreathPractice);
  const isPresetSwitcherOpenRef = useRef(isPresetSwitcherOpen);

  useEffect(() => {
    isBreathPracticeRef.current = isBreathPractice;
  }, [isBreathPractice]);

  useEffect(() => {
    isPresetSwitcherOpenRef.current = isPresetSwitcherOpen;
  }, [isPresetSwitcherOpen]);

  useEffect(() => {
    if (isBreathPractice) return;
    setIsPresetSwitcherOpen(false);
  }, [isBreathPractice, setIsPresetSwitcherOpen]);

  useEffect(() => {
    if (isRunning) return;
    pendingCycleFinishRef.current = false;
    completionDispatchedRef.current = false;
    completionProbeMetaRef.current = null;
    lastCycleBoundaryAtRef.current = null;
    setPendingCycleFinish(false);
  }, [isRunning]);

  useEffect(() => {
    const onWindowKeyDown = (event) => {
      const code = event.code;
      const key = event.key;
      const isF2 = code === 'F2' || key === 'F2';
      const isArrowLeft = code === 'ArrowLeft' || key === 'ArrowLeft';
      const isArrowRight = code === 'ArrowRight' || key === 'ArrowRight';
      const isEscape = code === 'Escape' || key === 'Escape';

      if (!(isF2 || isArrowLeft || isArrowRight || isEscape)) return;
      if (isTypingIntoEditableElement(document.activeElement)) return;
      if (!isBreathPracticeRef.current) return;

      if (isF2) {
        event.preventDefault();
        event.stopPropagation();
        setIsPresetSwitcherOpen((prev) => !prev);
        return;
      }

      if (!isPresetSwitcherOpenRef.current) return;

      if (isEscape) {
        event.preventDefault();
        event.stopPropagation();
        setIsPresetSwitcherOpen(false);
        return;
      }

      if (isArrowLeft) {
        event.preventDefault();
        event.stopPropagation();
        setRingPresetIndex((prev) => (prev - 1 + BREATH_RING_PRESETS.length) % BREATH_RING_PRESETS.length);
        return;
      }

      if (isArrowRight) {
        event.preventDefault();
        event.stopPropagation();
        setRingPresetIndex((prev) => (prev + 1) % BREATH_RING_PRESETS.length);
      }
    };

    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [setIsPresetSwitcherOpen, setRingPresetIndex]);

  // RENDER PRIORITY 1: Active Practice Session
  const sessionView = isRunning ? (() => {
    const breathViewportReady = !isBreathRunningSession || Number.isFinite(breathViewportHeightPx);
    if (renderPractice === "Rituals") {
      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <NavigationRitualLibrary
            onComplete={handleStop}
            onNavigate={onNavigate}
            selectedRitual={activeRitual}
            onSelectRitual={handleSelectRitual}
            onRitualReturn={handleRitualReturn}
          />
        </section>
      );
    }

    // Render vipassana portal when renderPracticeId is cognitive vipassana (thought labeling)
    // Somatic vipassana uses inline SensorySession component (mobile-friendly)
    if (renderPracticeId === "cognitive_vipassana") {
      if (sensoryType === "sakshi") {
        const sakshiButtonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
        const sakshiButtonShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)';
        const sakshiTitle = sakshiVersion === 1 ? 'Sakshi (Forest)' : 'Sakshi (Reflection)';
        return (
          <section className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-10">
            <div
              className="relative"
              style={{
                width: 'min(92vw, 420px)',
                aspectRatio: '3 / 4',
                borderRadius: '20px',
                overflow: 'hidden',
                border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-20)',
                background: isLight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.25)',
                boxShadow: isLight ? '0 12px 36px rgba(0,0,0,0.12)' : '0 20px 60px rgba(0,0,0,0.65)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none z-0">
                {sakshiVersion === 1 ? <ParallaxForest /> : <SakshiVisual />}
              </div>
              <div className="relative z-[1] flex items-start justify-center w-full pt-3">
                <div
                  className="type-label tracking-[0.18em]"
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    textShadow: '0 2px 16px rgba(0,0,0,0.6)',
                  }}
                >
                  {sakshiTitle}
                </div>
              </div>
            </div>

            <div className="relative z-[2] mt-8">
              <SessionControls
                isBreathPractice={false}
                breathingPatternText={breathingPatternText}
                showFeedback={false}
                lastSignedErrorMs={lastSignedErrorMs}
                feedbackColor="var(--accent-primary)"
                feedbackShadow="none"
                feedbackText=""
                onStop={handleStop}
                buttonBg={sakshiButtonBg}
                radialGlow=""
                buttonShadow={sakshiButtonShadow}
                timeLeftText={timeLeftText}
                showBreathCount={false}
                breathCount={breathCount}
              />
            </div>
          </section>
        );
      }
      return createPortal(
        <InsightMeditationPortal 
          onExit={activeCircuitId ? handleCircuitComplete : handleStop}
        />,
        document.body
      );
    }
    
    // Somatic vipassana - use inline SensorySession (body scan with guided prompts)
    if (renderPracticeId === "somatic_vipassana") {
      return (
        <section className="w-full h-full min-h-[400px] flex flex-col items-center justify-center overflow-visible pb-8">
          <SensorySession
            sensoryType={sensoryType}
            duration={duration}
            onStop={activeCircuitId ? handleCircuitComplete : handleStop}
            onTimeUpdate={(remaining) => setTimeLeft(remaining)}
            scanType={scanType}
            onScanTypeChange={setScanType}
            isLight={isLight}
          />
        </section>
      );
    }

    // Emotion practice - use SensorySession with emotion mode and prompt style
    if (renderPracticeId === "feeling") {
      return (
        <section className="w-full h-full min-h-[400px] flex flex-col items-center justify-center overflow-visible pb-8">
          <SensorySession
            sensoryType="emotion"
            duration={duration}
            onStop={activeCircuitId ? handleCircuitComplete : handleStop}
            onTimeUpdate={(remaining) => setTimeLeft(remaining)}
            emotionMode={emotionMode}
            emotionPromptMode={emotionPromptMode}
            isLight={isLight}
          />
        </section>
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
      <section
        ref={isBreathRunningSession ? breathViewportRootRef : null}
        className={`w-full h-full min-h-[600px] flex flex-col items-center ${isBreathRunningSession ? "" : "justify-center"}`}
        style={{
          position: "relative",
          width: "100%",
          minHeight: isBreathRunningSession ? 0 : undefined,
          height: isBreathRunningSession
            ? (breathViewportHeightPx ? `${breathViewportHeightPx}px` : "100dvh")
            : undefined,
          maxHeight: isBreathRunningSession
            ? (breathViewportHeightPx ? `${breathViewportHeightPx}px` : "100dvh")
            : undefined,
          overflow: isBreathRunningSession ? "hidden" : undefined,
          paddingBottom: isBreathRunningSession ? 0 : "3rem",
          justifyContent: isBreathRunningSession ? "flex-start" : undefined,
        }}
      >
        {isBreathRunningSession && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "#020207",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        )}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            minHeight: 0,
            height: isBreathRunningSession ? "100%" : undefined,
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            overflow: isBreathRunningSession ? "hidden" : undefined,
            visibility: breathViewportReady ? "visible" : "hidden",
          }}
        >
        {activeCircuitId && circuitConfig && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: isLight ? 'var(--light-bg-surface)' : 'rgba(0,0,0,0.7)',
              border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-30)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="type-label" style={{ color: 'var(--text-secondary)' }}>
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
            <span className="type-caption text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {circuitExerciseIndex + 1}/{circuitConfig.exercises.length}
            </span>
          </div>
        )}

        {pathLaunchInstructionVideo && (
          <div
            style={{
              flex: "0 0 auto",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: isBreathRunningSession ? "max(12px, env(safe-area-inset-top)) 16px 0" : "0 16px 16px",
            }}
          >
            <InstructionVideoPanel
              video={pathLaunchInstructionVideo}
              className="w-full max-w-[560px]"
            />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center w-full" style={{ minHeight: 0 }}>
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
          <div
            className="w-full h-full flex flex-col"
            style={{
              overflow: isBreathRunningSession ? "hidden" : "visible",
              minHeight: 0,
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
              <div
                style={{
                  flex: "0 0 auto",
                  minHeight: 0,
                  paddingTop: "env(safe-area-inset-top)",
                }}
              />

              <div
                style={{
                  flex: "1 1 auto",
                  minHeight: 0,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {breathSubmode === 'stillness' ? (
                  <StillnessRingSession
                    isRunning={isRunning}
                    isPaused={isSessionPaused}
                    sessionStartTime={sessionStartTime}
                    totalDurationSec={duration * 60}
                    config={stillnessConfig}
                    ringMode={currentRingPreset.id}
                    onComplete={() => handleStop({ completed: true })}
                  />
                ) : shouldRenderRingCanvas ? (
                  <BreathingRing
                    breathPattern={breathingPatternForRing}
                    onTap={handleAccuracyTap}
                    onCycleComplete={handleBreathCycleComplete}
                    startTime={sessionStartTime}
                    practiceActive={isRunning}
                    onUnmount={handleBreathingRingUnmount}
                    pathId={avatarPath}
                    ringMode={currentRingPreset.id}
                    totalSessionDurationSec={duration}
                  />
                ) : null}
              </div>

              <div
                style={{
                  flex: "0 0 auto",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "8px",
                  paddingBottom: "env(safe-area-inset-bottom)",
                }}
              >
                {tempoSessionActive && breathSubmode !== 'stillness' && (
                  <div style={{ width: '100%', maxWidth: '320px' }}>
                    <TempoSyncSessionPanel />
                  </div>
                )}
                {pendingCycleFinish && (
                  <div
                    className="type-caption text-center"
                    style={{ color: 'var(--text-muted)', maxWidth: '320px' }}
                  >
                    Finishing the current breath cycle...
                  </div>
                )}
                <SessionControls
                  // Breath pattern + timer are rendered inside the BreathingRing plates.
                  isBreathPractice={false}
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
                  showBreathCount={showBreathCountUi}
                  breathCount={breathCount}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center animate-fade-in-up">
              <div
                className="type-h2 mb-4 text-center"
                style={{
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
                  className="type-label text-[8px] mb-2 flex items-center justify-between"
                  style={{
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

        {!isBreathRunningSession && <SessionControls
          // Breath pattern + timer are rendered inside the BreathingRing plates.
          isBreathPractice={false}
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
          showBreathCount={showBreathCountUi}
          breathCount={breathCount}
        />}

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
        </div>
      </section>
    );
  })() : null;

  // RENDER PRIORITY 2: Session Summary Modal
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
    isochronicExactHz, isochronicReverbWet, isochronicChorusWet,
    stillness: stillnessConfig,
    isStillnessLocked,
    preDelaySec: sharedBreathPreDelaySec,
    sensoryType, vipassanaTheme, vipassanaElement, scanType, geometry, fadeInDuration, displayDuration,
    fadeOutDuration, voidDuration, audioEnabled, frequencySet, selectedFrequency, driftEnabled,
    mode: emotionMode, promptMode: emotionPromptMode,
    activeMode,
    setPreset, setPattern, setSoundType, setSoundVolume, setBinauralPreset, setIsochronicPreset,
    setStillness, setPreDelaySec,
    setCarrierFrequency, setIsochronicExactHz, setIsochronicReverbWet, setIsochronicChorusWet,
    setSensoryType, setVipassanaTheme, setVipassanaElement, setScanType, setGeometry,
    setFadeInDuration, setDisplayDuration, setFadeOutDuration, setVoidDuration, setAudioEnabled,
    setFrequencySet, setSelectedFrequency, setDriftEnabled,
    setMode: setEmotionMode, setPromptMode: setEmotionPromptMode,
    setActiveMode: (modeKey) => setActiveMode(practiceId, modeKey),
    onToggleRunning: handleStart,
    onSelectRitual: handleSelectRitual,
    selectedRitualId: activeRitual?.id,
    isEmbedded: true
  };
  return (
    <>
      <GuidanceAudioController />
      <BreathBenchmark isOpen={showBreathBenchmark} onClose={handleBenchmarkClose} />
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 10060,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(8, 10, 18, 0.84)',
          color: 'rgba(255,255,255,0.96)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.32)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <span
          className="type-label"
          style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          GUIDANCE AUDIO: {String(guidanceStatus || 'idle').toUpperCase()}
        </span>
        {isRunning && (
          <button
            type="button"
            onClick={handleTogglePause}
            className="type-label"
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.96)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {isSessionPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
      {isRunning && (
        <div
          style={{
            position: 'fixed',
            top: 52,
            right: 10,
            zIndex: 10059,
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            fontFamily: 'monospace',
            padding: '4px 8px',
            borderRadius: 8,
            background: 'rgba(8, 10, 18, 0.42)',
            maxWidth: 'min(92vw, 420px)',
            wordBreak: 'break-all',
          }}
        >
          Audio: {guidanceSource || 'NULL'}
        </div>
      )}
      {!isActiveBreathSession && (
        <DevCompleteNowOverlay
          isRunning={isRunning}
          onCompleteNow={() => handleStop({ completed: true })}
        />
      )}
      {isRunning && guidanceFallbackSubtitle && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'max(88px, calc(env(safe-area-inset-bottom) + 72px))',
            transform: 'translateX(-50%)',
            zIndex: 10058,
            width: 'min(92vw, 460px)',
            padding: '10px 14px',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(8, 10, 18, 0.84)',
            color: 'rgba(255,255,255,0.94)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          <div className="type-caption" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {guidanceFallbackSubtitle}
          </div>
        </div>
      )}
      {sessionView}
      {summaryView}
      {isPresetSwitcherOpen && isBreathPractice && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: PRESET_SWITCHER_Z_INDEX,
            minWidth: '260px',
            maxWidth: 'min(94vw, 420px)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(8, 10, 18, 0.86)',
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            boxShadow: '0 14px 50px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        >
          <div className="type-caption text-[10px]" style={{ opacity: 0.72 }}>
            Ring Presets
          </div>
          <div className="type-label mt-1" style={{ color: 'var(--accent-color)' }}>
            {currentRingPreset.label}
          </div>
          <div
            className="type-caption text-[10px] mt-2"
            style={{ opacity: 0.7, display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}
          >
            {BREATH_RING_PRESETS.map((preset, index) => (
              <span
                key={preset.id}
                style={{
                  opacity: index === ringPresetIndex ? 1 : 0.5,
                  color: index === ringPresetIndex ? 'var(--accent-color)' : 'rgba(255,255,255,0.75)',
                }}
              >
                {preset.label}
              </span>
            ))}
          </div>
          <div className="type-caption text-[10px] mt-2" style={{ opacity: 0.55 }}>
            F2 open/close | ← → change | Esc close
          </div>
        </div>
      )}
      
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
            className="type-display text-[120px] font-bold"
            style={{
              color: 'var(--accent-color)',
              textShadow: '0 0 40px var(--accent-color), 0 0 80px var(--accent-color)',
              animation: 'countdown-pulse 1s ease-in-out',
            }}
          >
            {countdownValue}
          </div>
          <div
            className="type-label text-[14px] mt-8"
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Get Ready...
          </div>
          {/* Next practice info for circuit transitions */}
          {activeCircuitId && circuitConfig && circuitExerciseIndex < circuitConfig.exercises.length && (
            <div
              className="type-body text-[16px] text-center mt-6"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="type-caption text-[12px] mb-2" style={{ opacity: 0.6 }}>Next:</div>
              <div>
                {circuitConfig.exercises[circuitExerciseIndex].exercise.name}
                {' '}({circuitConfig.exercises[circuitExerciseIndex].duration}m)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Circuit Validation Error Modal */}
      {circuitValidationError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setCircuitValidationError(null)}
        >
          <div
            className="type-body"
            style={{
              background: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(200, 100, 100, 0.4)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '420px',
              color: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="type-h3 mb-4"
              style={{
                color: 'rgba(255, 100, 100, 0.9)',
              }}
            >
              Circuit Configuration Error
            </div>
            <div
              className="type-body text-[14px] mb-6"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              {circuitValidationError}
            </div>
            <button
              onClick={() => setCircuitValidationError(null)}
              className="type-body text-[14px] font-semibold"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(100, 150, 200, 0.3)',
                border: '1px solid rgba(100, 150, 200, 0.5)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(100, 150, 200, 0.5)';
                e.target.style.boxShadow = '0 0 20px rgba(100, 150, 200, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(100, 150, 200, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Back to Circuit Config
            </button>
          </div>
        </div>
      )}

      <PracticeSectionShell
        className="practice-section-container w-full flex flex-col items-center justify-start"
        style={{ paddingTop: '8px', paddingBottom: '16px', position: 'relative', display: showSummaryModal || isRunning || _isStarting || pendingPathAutoStart ? 'none' : 'flex' }}
      >
        <div className="relative z-[1] w-full flex flex-col items-center justify-start">
        {/* Sub-Mode Toggle Buttons (above selector) */}
        {(() => {
          const practice = getPracticeConfig(practiceId);
          const hasSubModes = practice?.subModes && Object.keys(practice.subModes).length > 0;

          // Handle breath practice separately (uses breathSubmode instead of subModes)
          if (practiceId === 'breath') {
            const modes = [
              { id: 'breath', label: 'Breath' },
              { id: 'stillness', label: 'Stillness' }
            ];

            return (
              <div
                className="flex items-center justify-center w-full"
                style={{
                  marginTop: '16px',
                  marginBottom: '16px',
                  gap: '64px',
                }}
              >
                {modes.map((mode) => (
                  <GlassIconButton
                    key={mode.id}
                    label={mode.label}
                    iconName={mode.id}
                    onClick={() => setBreathSubmode(mode.id)}
                    selected={breathSubmode === mode.id}
                    data-ui="practice-button"
                    data-practice-type={mode.id}
                    data-practice-id={`practice-submode:${mode.id}`}
                  />
                ))}
              </div>
            );
          }

          // Handle practices with subModes
          if (!hasSubModes) return null;

          const activeMode = practiceParams[practiceId]?.activeMode || practice.defaultSubMode;
          const buttonCount = Object.keys(practice.subModes).length;
          const practiceTypeForFx = practiceId === 'perception' ? 'visual' : (practiceId === 'resonance' ? 'sound' : practiceId);

          return (
            <div
              className="flex items-center justify-center w-full"
              style={{
                marginTop: '16px',
                marginBottom: '16px',
                gap: buttonCount === 3 ? '48px' : '64px',
              }}
            >
              {Object.entries(practice.subModes).map(([modeKey, modeConfig]) => {
                const isActive = activeMode === modeKey;
                const iconName = SUB_MODE_ICON_MAP[modeKey] || SUB_MODE_ICON_MAP[modeConfig.id] || 'cognitive';
                const utcSubmodeId = practiceId === 'awareness'
                  ? (modeKey === 'insight'
                    ? 'practice:submode:cognitive'
                    : (modeKey === 'bodyscan'
                      ? 'practice:submode:somatic'
                      : (modeKey === 'feeling' ? 'practice:submode:emotion' : null)))
                  : null;

                return (
                  <GlassIconButton
                    key={modeKey}
                    label={modeConfig.label}
                    iconName={iconName}
                    onClick={() => updateParams(practiceId, { activeMode: modeKey })}
                    selected={isActive}
                    data-ui="practice-button"
                    data-practice-type={practiceTypeForFx}
                    data-practice-id={`practice-submode:${practiceId}:${modeKey}`}
                    {...(utcSubmodeId ? {
                      'data-ui-target': 'true',
                      'data-ui-scope': 'role',
                      'data-ui-role-group': 'practice',
                      'data-ui-id': utcSubmodeId,
                    } : {})}
                  />
                );
              })}
            </div>
          );
        })()}

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

        {pathLaunchInstructionVideo && (
          <div className="w-full flex justify-center px-4 pb-4">
            <InstructionVideoPanel
              video={pathLaunchInstructionVideo}
              className="max-w-[720px]"
            />
          </div>
        )}

        {/* Bottom Layer: Dynamic Options Card */}
        <PracticeOptionsCard
          practiceId={practiceId}
          duration={duration}
          onDurationChange={setDuration}
          onStart={handleStart}
          onQuickStart={handleQuickStart}
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
          getPracticeConfig={getPracticeConfig}
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
        </div>
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
