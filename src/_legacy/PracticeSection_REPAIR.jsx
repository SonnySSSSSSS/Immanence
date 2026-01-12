// Legacy, not used by app.
// src/components/PracticeSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { BreathingRing } from "./BreathingRing.jsx";
import { VisualizationCanvas } from "./VisualizationCanvas.jsx";
import { CymaticsVisualization } from "./CymaticsVisualization.jsx";
import { SensorySession } from "./SensorySession.jsx";
import { VipassanaVisual } from "./vipassana/VipassanaVisual.jsx";
import { VipassanaVariantSelector } from "./vipassana/VipassanaVariantSelector.jsx";
import { RitualPortal } from "./RitualPortal.jsx";
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
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from "../styles/cardMaterial.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { PostSessionJournal } from "./PostSessionJournal.jsx";
import { useJournalStore } from "../state/journalStore.js";

// DEV GALLERY MODE - now controlled via prop from App.jsx
const DEV_FX_GALLERY_ENABLED = true; // Fallback if prop not passed

const PRACTICES = ["Breath & Stillness", "Ritual", "Circuit", "Cognitive Vipassana", "Somatic Vipassana", "Sound", "Visualization", "Cymatics"];
const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

// Scrolling Wheel Component
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
        height: `${itemHeight * visibleItems} px`,
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
          height: `${itemHeight} px`,
          background: isLight
            ? "linear-gradient(180deg, var(--light-bg-surface) 0%, transparent 100%)"
            : "linear-gradient(180deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: `${itemHeight} px`,
          background: isLight
            ? "linear-gradient(0deg, var(--light-bg-surface) 0%, transparent 100%)"
            : "linear-gradient(0deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute left-0 right-0 pointer-events-none z-10"
        style={{
          top: `${itemHeight} px`,
          height: `${itemHeight} px`,
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

export function PracticeSection({ onPracticingChange, onBreathStateChange, avatarPath, showCore, showFxGallery = DEV_FX_GALLERY_ENABLED }) {
  // Avatar path determines particle effects (Soma, Prana, Dhyana, Drishti, Jnana, Samyoga)
  // When showCore is true, use default particles (no path-specific effects)

  // Attention path instrumentation
  const instrumentation = useSessionInstrumentation();

  // Get color scheme for light mode support
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  // Load saved preferences or use defaults
  const savedPrefs = loadPreferences();

  const [practice, setPractice] = useState(savedPrefs.practice);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  
  // CURRICULUM INTEGRATION - Load active curriculum day if set
const { 
  getActivePracticeDay, 
  activePracticeSession,
  clearActivePracticeSession,
} = useCurriculumStore();

// On mount or when active session changes, load curriculum day settings
useEffect(() => {
  const curriculumDay = getActivePracticeDay();
  if (curriculumDay && activePracticeSession) {
    // Auto-load this day's practice type and settings
    setPractice(curriculumDay.practiceType);
    
    // If it has a circuit, load it
    if (curriculumDay.circuit) {
      const exercises = curriculumDay.circuit.exercises.map(ex => ({
        exercise: {
          id: ex.id,
          name: ex.name,
          type: ex.type,
          practiceType: ex.practiceType,
          preset: ex.preset,
          sensoryType: ex.sensoryType,
        },
        duration: ex.duration,
      }));
      setCircuitConfig({
        exercises,
        exerciseDuration: curriculumDay.circuit.totalDuration,
      });
    }
    
    // Set duration from curriculum
    if (curriculumDay.duration) {
      setDuration(curriculumDay.duration);
      setTimeLeft(curriculumDay.duration * 60);
    }
  }
}, [activePracticeSession, getActivePracticeDay]);
  // Animation states for selectable header affordance
  const [chevronAngle, setChevronAngle] = useState(0);
  const [haloPulse, setHaloPulse] = useState(0);
  const [duration, setDuration] = useState(savedPrefs.duration);
  const [preset, setPreset] = useState(savedPrefs.preset);
  const [pattern, setPattern] = useState(savedPrefs.pattern);

  const [sensoryType, setSensoryType] = useState(savedPrefs.sensoryType || SENSORY_TYPES[0].id);
  const [soundType, setSoundType] = useState(savedPrefs.soundType || SOUND_TYPES[0]);
  const [vipassanaTheme, setVipassanaTheme] = useState(savedPrefs.vipassanaTheme);
  const [vipassanaElement, setVipassanaElement] = useState(savedPrefs.vipassanaElement);

  // Vipassana variant selection state (Thought Labeling vs Sakshi)
  const [vipassanaVariant, setVipassanaVariant] = useState('thought-labeling');
  const [showVipassanaVariantModal, setShowVipassanaVariantModal] = useState(false);

  // Sound configuration state
  const [binauralPreset, setBinauralPreset] = useState(BINAURAL_PRESETS[2]); // Alpha - default
  const [isochronicPreset, setIsochronicPreset] = useState(ISOCHRONIC_PRESETS[1]); // Relaxation
  const [mantraPreset, setMantraPreset] = useState(null);
  const [naturePreset, setNaturePreset] = useState(null);
  const [carrierFrequency, setCarrierFrequency] = useState(200);
  const [soundVolume, setSoundVolume] = useState(0.5);


  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  // 3-tier card collapse states (default expanded)
  const [tier2Expanded, setTier2Expanded] = useState(true);
  const [tier3Expanded, setTier3Expanded] = useState(true);

  // Lock & Begin transition state
  const [isStarting, setIsStarting] = useState(false);

  // Session summary state (Ritual Seal)
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  // Journal state
  const [lastSessionId, setLastSessionId] = useState(null);
  const { startMicroNote, pendingMicroNote } = useJournalStore();

  // Hover states for peripheral halos
  const [tier2Hovered, setTier2Hovered] = useState(false);
  const [tier3Hovered, setTier3Hovered] = useState(false);

  // Circuit training state - PracticeSection orchestrates the circuit internally
  const [activeCircuitId, setActiveCircuitId] = useState(null);
  const [circuitConfig, setCircuitConfig] = useState(null); // User's custom circuit configuration
  const [circuitExerciseIndex, setCircuitExerciseIndex] = useState(0); // Current exercise in circuit
  const [circuitSavedPractice, setCircuitSavedPractice] = useState(null); // Original practice before circuit started

  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);

  const [breathCount, setBreathCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  const [geometry, setGeometry] = useState(savedPrefs.geometry);
  const [fadeInDuration, setFadeInDuration] = useState(2.5);
  const [displayDuration, setDisplayDuration] = useState(10);
  const [fadeOutDuration, setFadeOutDuration] = useState(2.5);
  const [voidDuration, setVoidDuration] = useState(10);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [visualizationCycles, setVisualizationCycles] = useState(0);

  // Cymatics state
  const [frequencySet, setFrequencySet] = useState('solfeggio');
  const [selectedFrequency, setSelectedFrequency] = useState(SOLFEGGIO_SET[4]); // 528 Hz - Love
  const [driftEnabled, setDriftEnabled] = useState(false);

  // Ritual Mode state
  const [activeRitual, setActiveRitual] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // FX Gallery state (DEV MODE - controlled by showFxGallery prop)
  const [currentFxIndex, setCurrentFxIndex] = useState(0);
  const currentFxPreset = showFxGallery ? ringFXPresets[currentFxIndex] : null;

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

  // Selectable header animation loop (chevron sway + halo pulse)
  useEffect(() => {
    // Animations continue even when modal is open (portal renders separately)

    let animationId;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      // Chevron sway: 8 degrees over 3 second period
      const chevronPhase = (elapsed % 3000) / 3000;
      const angle = Math.sin(chevronPhase * Math.PI * 2) * 8;
      setChevronAngle(angle);

      // Halo pulse: 0-1 over 5 second period
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

  // Initialize circuitConfig when switching to Circuit practice
  // This ensures START works even if Options panel hasn't been expanded
  useEffect(() => {
    if (practice === "Circuit" && !circuitConfig) {
      // Default exercises matching CircuitConfig.jsx defaults
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

    // Map exercise to practice type and configure settings
    if (exercise.practiceType === 'Breath & Stillness') {
      setPractice('Breath & Stillness');
      // Set breath pattern from preset if provided
      // Handle case-insensitive preset lookup (CircuitConfig uses 'box', BREATH_PRESETS uses 'Box')
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
      // Fallback - use the practiceType directly if recognized
      setPractice(exercise.practiceType || 'Breath & Stillness');
    }

    // Set duration for this exercise
    setDuration(exDuration);
    setTimeLeft(exDuration * 60);

    // Start running
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
      // In circuit mode - advance to next exercise
      advanceCircuitExercise();
    } else {
      // Normal mode - stop the session
      handleStop();
    }
  };

  // Advance to next circuit exercise or complete circuit
  const advanceCircuitExercise = () => {
    if (!activeCircuitId || !circuitConfig) return;

    const nextIndex = circuitExerciseIndex + 1;
    if (nextIndex < circuitConfig.exercises.length) {
      // More exercises remain
      setCircuitExerciseIndex(nextIndex);
      const nextExercise = circuitConfig.exercises[nextIndex];
      setupCircuitExercise(nextExercise);
    } else {
      // Circuit complete!
      handleCircuitComplete();
    }
  };

  // Circuit completion handler
const handleCircuitComplete = () => {
    clearActivePracticeSession(); // NEW LINE - Clear curriculum session
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    
    // Log completion
    logCircuitCompletion('custom', circuitConfig.exercises);

    // Calculate total duration
    const totalDuration = circuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0);

    // Record circuit session in progress store (same as single sessions)
    let recordedSession = null;
    try {
      recordedSession = useProgressStore.getState().recordSession({
        domain: 'circuit-training',
        duration: totalDuration, // minutes
        metadata: {
          circuitName: 'Custom Circuit',
          exerciseCount: circuitConfig.exercises.length,
          legacyImport: false
        },
      });
    } catch (e) {
      console.error("Failed to save circuit session:", e);
    }

    // Show summary
    setSessionSummary({
      type: 'circuit',
      circuitName: 'Custom Circuit',
      exercisesCompleted: circuitConfig.exercises.length,
      totalDuration: totalDuration,
    });
    setShowSummary(true);

    // Trigger journal micro-note flow (PHASE 2 FIX: Wire circuit journal)
    if (recordedSession) {
      setLastSessionId(recordedSession.id);
      startMicroNote(recordedSession.id);
    }

    // Reset circuit state
    setActiveCircuitId(null);
    setCircuitExerciseIndex(0);
    setPractice('Circuit'); // Restore to Circuit selection
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
    clearActivePracticeSession(); // NEW LINE - Clear curriculum session
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    // ... rest of function continues

    // Determine exit type: completed if timer reached 0, abandoned otherwise
    const exitType = timeLeft <= 0 ? 'completed' : 'abandoned';

    // End instrumentation and get session data
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
      // Map practice to domain for Path calculation
      let domain = 'breathwork';
      const p = practice.toLowerCase();
      if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
      else if (p === 'somatic vipassana') domain = sensoryType;
      else if (p === 'ritual') domain = 'ritual';
      else if (p === 'sound') domain = 'sound';

      // Record in progress store (single source of truth) and capture the returned session
      recordedSession = useProgressStore.getState().recordSession({
        domain,
        duration: duration, // minutes
        metadata: {
          subType,
          pattern: practice === "Breath & Stillness" ? { ...pattern } : null,
          tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
          ritualId: activeRitual?.id,
          legacyImport: false
        },
        // Pass instrumentation data for attention path calculation
        instrumentation: instrumentationData,
      });

      // Log to cycle system (if 10+ minutes)
      if (duration >= 10) {
        const now = new Date();
        const timeOfDay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        logPractice({
          type: domain === 'breathwork' ? 'breath' : domain === 'visualization' ? 'focus' : 'body',
          duration: duration,
          timeOfDay: timeOfDay,
        });
      }

      // Sync mandala store
      syncFromProgressStore();
    } catch (e) {
      console.error("Failed to save session:", e);
    }

    // Reset ritual state
    setActiveRitual(null);
    setCurrentStepIndex(0);
    setTimeLeft(duration * 60);

 // Show summary and trigger journal for any meaningful session (>30s), excluding Ritual
// RitualPortal handles its own completion UI
const actualDuration = duration * 60 - timeLeft; // seconds practiced
const shouldJournal = practice !== 'Ritual' && actualDuration >= 30;

if (shouldJournal) {
    setSessionSummary({
        practice,
        duration,
        tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
        breathCount,
        exitType,
    });
    setShowSummary(true);

    // Log this leg completion if in curriculum mode
    const activePracticeDay = getActivePracticeDay();
    if (activePracticeSession && activePracticeDay) {
        const { logLegCompletion } = useCurriculumStore.getState();
        logLegCompletion(activePracticeSession, 1, {
            duration: duration,
            focusRating: null, // Will be set by journal
            challenges: [],
            notes: '',
        });
    }

    // Trigger journal micro-note flow using the recorded session ID
    if (recordedSession) {
        setLastSessionId(recordedSession.id);
        startMicroNote(recordedSession.id);
    }
}
};
  // The actual start logic (called after ceremony)
  const executeStart = () => {
    // Save current preferences for next session
    savePreferences({
      practice,
      duration,
      preset,
      pattern,
      sensoryType,
      vipassanaTheme,
      vipassanaElement,
      soundType,
      geometry,
    });

    // For Circuit practice, set up the first exercise and run it using existing practice UI
    if (practice === "Circuit") {
      if (!circuitConfig || circuitConfig.exercises.length === 0) {
        // No exercises configured, don't start
        return;
      }
      // Save original practice so we can restore after circuit ends
      setCircuitSavedPractice(practice);
      setActiveCircuitId('custom');
      setCircuitExerciseIndex(0);

      // Set up the first exercise
      const firstExercise = circuitConfig.exercises[0];
      setupCircuitExercise(firstExercise);
      return;
    }

    // For Cognitive Vipassana, show variant selector before starting
    if (practice === "Cognitive Vipassana") {
      setShowVipassanaVariantModal(true);
    }

    setIsRunning(true);
    onPracticingChange && onPracticingChange(true);
    setSessionStartTime(performance.now());
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);

    // Start instrumentation tracking
    const p = practice.toLowerCase();
    let domain = 'breathwork';
    if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
    else if (p === 'sensory') domain = sensoryType;
    else if (p === 'ritual') domain = 'ritual';
    else if (p === 'sound') domain = 'sound';

    instrumentation.startSession(
      domain,
      activeRitual?.category || null,
      p === 'somatic vipassana' ? sensoryType : null
    );
  };

  // Lock & Begin: ceremonial transition before start
  const handleStart = () => {
    // Trigger the "locking" animation
    setIsStarting(true);

    // After 1.4s pause, actually start
    setTimeout(() => {
      setIsStarting(false);
      executeStart();
    }, 1400);
  };

  // Ritual-specific handlers
  const handleSelectRitual = (ritual) => {
    setActiveRitual(ritual);
    setCurrentStepIndex(0);
    // Calculate total duration from steps
    const totalSeconds = ritual.steps?.reduce((sum, s) => sum + (s.duration || 60), 0) || 600;
    setDuration(Math.ceil(totalSeconds / 60));
    setTimeLeft(totalSeconds);
    // Auto-start ritual
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
  };

  const handleAccuracyTap = (errorMs) => {
    if (!isRunning) return;

    // Track tap as alive signal for attention path
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
    // Skip timer countdown for Ritual mode (handled by RitualPortal)
    if (practice === "Ritual") return;

    let interval = null;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // If in circuit mode, advance to next exercise instead of stopping
      if (activeCircuitId && circuitConfig) {
        advanceCircuitExercise();
      } else {
        handleStop();
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
