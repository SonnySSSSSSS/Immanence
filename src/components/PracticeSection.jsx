// src/components/PracticeSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { BreathingRing } from "./BreathingRing.jsx";
import { VisualizationCanvas } from "./VisualizationCanvas.jsx";
import { CymaticsVisualization } from "./CymaticsVisualization.jsx";
import { SensorySession } from "./SensorySession.jsx";
import { VipassanaVisual } from "./vipassana/VipassanaVisual.jsx";
import { RitualPortal } from "./RitualPortal.jsx";
import { RitualSelectionDeck } from "./RitualSelectionDeck.jsx";
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
import { PeripheralHalo } from "./ui/PeripheralHalo.jsx";
import { plateauMaterial, innerGlowStyle } from "../styles/cardMaterial.js";

// DEV GALLERY MODE - now controlled via prop from App.jsx
const DEV_FX_GALLERY_ENABLED = true; // Fallback if prop not passed

const PRACTICES = ["Breath & Stillness", "Ritual", "Circuit", "Cognitive Vipassana", "Somatic Vipassana", "Sound", "Visualization", "Cymatics"];
const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

// Scrolling Wheel Component
function ScrollingWheel({ value, onChange, options }) {
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
          background: "linear-gradient(180deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: `${itemHeight} px`,
          background: "linear-gradient(0deg, rgba(15,15,26,1) 0%, transparent 100%)"
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
                height: `${itemHeight} px`,
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                color: "rgba(253,251,245,0.9)",
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

  // Load saved preferences or use defaults
  const savedPrefs = loadPreferences();

  const [practice, setPractice] = useState(savedPrefs.practice);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);

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

  // Sound configuration state
  const [binauralPreset, setBinauralPreset] = useState(BINAURAL_PRESETS[2]); // Alpha - default
  const [isochronicPreset, setIsochronicPreset] = useState(ISOCHRONIC_PRESETS[1]); // Relaxation
  const [mantraPreset, setMantraPreset] = useState(null);
  const [naturePreset, setNaturePreset] = useState(null);
  const [carrierFrequency, setCarrierFrequency] = useState(200);
  const [soundVolume, setSoundVolume] = useState(0.5);


  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  // 3-tier card collapse states
  const [tier2Expanded, setTier2Expanded] = useState(false);
  const [tier3Expanded, setTier3Expanded] = useState(false);

  // Lock & Begin transition state
  const [isStarting, setIsStarting] = useState(false);

  // Session summary state (Ritual Seal)
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

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
    if (practiceModalOpen) return; // Stop animations when modal is open

    let animationId;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      // Chevron sway: ±8 degrees over 3 second period
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
  }, [practiceModalOpen]);

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

  // Set up a circuit exercise - configure practice settings and start
  const setupCircuitExercise = (exerciseItem) => {
    const { exercise, duration: exDuration } = exerciseItem;

    console.log('[Circuit] Setting up exercise:', exercise.name, 'practiceType:', exercise.practiceType);

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
          console.log('[Circuit] Set breath pattern:', presetKey);
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

    console.log('[Circuit] Exercise setup complete, practice now:', exercise.practiceType);
  };

  // Handle exercise completion - circuit-aware
  // This is used as onComplete callback for practice components
  const handleExerciseComplete = () => {
    if (activeCircuitId && circuitConfig) {
      // In circuit mode - advance to next exercise
      console.log('[Circuit] Exercise completed, advancing...');
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
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);

    // Log completion
    logCircuitCompletion('custom', circuitConfig.exercises);

    // Show summary
    setSessionSummary({
      type: 'circuit',
      circuitName: 'Custom Circuit',
      exercisesCompleted: circuitConfig.exercises.length,
      totalDuration: circuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0),
    });
    setShowSummary(true);

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
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    onBreathStateChange && onBreathStateChange(null);

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

    try {
      // Map practice to domain for Path calculation
      let domain = 'breathwork';
      const p = practice.toLowerCase();
      if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
      else if (p === 'somatic vipassana') domain = sensoryType;
      else if (p === 'ritual') domain = 'ritual';
      else if (p === 'sound') domain = 'sound';

      // Record in progress store (single source of truth)
      useProgressStore.getState().recordSession({
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

    // Show summary if this was a completed session (for non-ritual practices)
    // RitualPortal handles its own completion UI
    if (exitType === 'completed' && practice !== 'Ritual') {
      setSessionSummary({
        practice,
        duration,
        tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
        breathCount,
        exitType,
      });
      setShowSummary(true);
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

  // ───────────────────────────────────────────────────────────
  // RUNNING VIEW
  // ───────────────────────────────────────────────────────────
  if (isRunning) {
    // RITUAL MODE - Different running view
    if (practice === "Ritual" && activeRitual) {
      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <RitualPortal
            ritual={activeRitual}
            currentStepIndex={currentStepIndex}
            onNextStep={handleNextStep}
            onComplete={handleRitualComplete}
            onStop={handleStop}
            onSwitch={instrumentation.recordSwitch}
            onPause={instrumentation.recordPause}
            onAliveSignal={instrumentation.recordAliveSignal}
          />
        </section>
      );
    }

    // Cognitive Vipassana MODE - Thought labeling meditation
    if (practice === "Cognitive Vipassana") {
      return (
        <VipassanaVisual
          wallpaperId={vipassanaTheme}
          themeId={vipassanaElement}
          durationSeconds={duration * 60}
          stage={theme.stage || 'flame'}
          onComplete={handleExerciseComplete}
          onExit={activeCircuitId ? handleCircuitComplete : handleStop}
        />
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
        buttonBg = 'linear-gradient(180deg, rgba(100,100,100,0.3) 0%, rgba(60,60,60,0.4) 100%)';
        radialGlow = '';
      } else if (absError <= 30) {
        feedbackColor = "#f8fafc";
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 12px rgba(255,255,255,0.6)";
        buttonBg = "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)";
        radialGlow = '0 0 60px 15px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.7)';
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
        feedbackColor = '#9ca3af';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 6px rgba(156, 163, 175, 0.3)";
        buttonBg = 'linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)';
        radialGlow = '0 0 35px 8px rgba(156, 163, 175, 0.25), 0 0 18px rgba(156, 163, 175, 0.4)';
      }
    }

    return (
      <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center pb-12">
        {/* Circuit Progress Indicator */}
        {activeCircuitId && circuitConfig && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--accent-30)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(253,251,245,0.6)', textTransform: 'uppercase' }}>
              Circuit
            </span>
            <div className="flex gap-1">
              {circuitConfig.exercises.map((_, idx) => (
                <div
                  key={idx}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: idx < circuitExerciseIndex ? 'var(--accent-color)'
                      : idx === circuitExerciseIndex ? '#fff'
                        : 'rgba(253,251,245,0.2)',
                    boxShadow: idx === circuitExerciseIndex ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                  }}
                />
              ))}
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: 'rgba(253,251,245,0.5)' }}>
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
            <div className="flex flex-col items-center" style={{ overflow: 'visible', padding: '40px 0' }}>
              {/* FX GALLERY SWITCHER - controlled by prop */}
              {showFxGallery && (
                <div
                  className="flex items-center gap-3 mb-4 px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--accent-20)',
                  }}
                >
                  <button
                    onClick={handlePrevFx}
                    className="text-white/60 hover:text-white transition-colors px-2 py-1"
                    style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}
                  >
                    ◀
                  </button>
                  <div
                    className="text-center min-w-[200px]"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'var(--accent-color)',
                    }}
                  >
                    <div style={{ color: 'rgba(253,251,245,0.55)', fontSize: '8px', marginBottom: '2px' }}>
                      {currentFxPreset?.category}
                    </div>
                    <div>{currentFxPreset?.name}</div>
                    <div style={{ color: 'rgba(253,251,245,0.55)', fontSize: '8px', marginTop: '2px' }}>
                      {currentFxIndex + 1} / {ringFXPresets.length}
                    </div>
                  </div>
                  <button
                    onClick={handleNextFx}
                    className="text-white/60 hover:text-white transition-colors px-2 py-1"
                    style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}
                  >
                    ▶
                  </button>
                </div>
              )}
              <BreathingRing
                breathPattern={breathingPatternForRing}
                onTap={handleAccuracyTap}
                onCycleComplete={() => setBreathCount(prev => prev + 1)}
                startTime={sessionStartTime}
                pathId={showCore ? null : avatarPath}
                fxPreset={currentFxPreset}
              />
            </div>
          ) : practice === "Somatic Vipassana" ? (
            <SensorySession
              sensoryType={sensoryType}
              duration={duration}
              onStop={handleExerciseComplete}
              onTimeUpdate={(remaining) => setTimeLeft(remaining)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center animate-fade-in-up">
              <div
                className="text-2xl mb-4 text-center"
                style={{
                  fontFamily: "Georgia, serif",
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
            </div>
          )}
        </div >

        <div className="flex flex-col items-center z-50">
          <div className="h-6 mb-3 flex items-center justify-center">
            {lastSignedErrorMs !== null && practice === "Breath & Stillness" && (
              <div
                key={lastSignedErrorMs}
                className="text-[11px] font-medium tracking-[0.15em] uppercase animate-fade-in-up"
                style={{
                  fontFamily: "Georgia, serif",
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
              fontFamily: "Georgia, serif",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
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
            {/* Radial gradient overlay */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
                mixBlendMode: 'soft-light',
                zIndex: 1,
              }}
            />
            {/* Grain texture overlay */}
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
              fontFamily: "Georgia, serif",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(253,251,245,0.6)",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {breathCount > 0 && practice === "Breath & Stillness" && (
            <div
              className="mt-2"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: 'var(--accent-50)',
              }}
            >
              Breath {breathCount}
            </div>
          )}
        </div>

        <style>{`
@keyframes fade -in -up {
  0 % { opacity: 0; transform: translateY(5px); }
  100 % { opacity: 1; transform: translateY(0); }
}
          .animate - fade -in -up {
  animation: fade -in -up 0.2s ease - out forwards;
}
`}</style>
      </section >
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RITUAL SEAL - SESSION SUMMARY VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (showSummary && sessionSummary) {
    return (
      <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center pb-12">
        <div
          className="rounded-[32px] relative overflow-hidden"
          style={{
            width: '460px',
            ...plateauMaterial,
            border: '1px solid var(--accent-20)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 pointer-events-none" style={innerGlowStyle} />

          <div className="relative px-8 py-10 text-center">
            {/* Seal Icon */}
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
                filter: 'drop-shadow(0 0 20px var(--accent-40))',
              }}
            >
              ⚜
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                letterSpacing: '0.15em',
                color: 'rgba(253,251,245,0.9)',
                marginBottom: '24px',
                textShadow: '0 0 10px var(--accent-30)',
              }}
            >
              SESSION COMPLETE
            </div>

            {/* Stats */}
            <div
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--accent-10)',
                marginBottom: '24px',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(253,251,245,0.5)',
                }}>
                  Practice
                </span>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  color: 'rgba(253,251,245,0.85)',
                  marginTop: '4px',
                }}>
                  {sessionSummary.practice}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(253,251,245,0.5)',
                }}>
                  Duration
                </span>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  color: 'rgba(253,251,245,0.85)',
                  marginTop: '4px',
                }}>
                  {sessionSummary.duration} minutes
                </div>
              </div>

              {sessionSummary.tapStats && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '10px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'rgba(253,251,245,0.5)',
                    }}>
                      Breath Count
                    </span>
                    <div style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '14px',
                      color: 'rgba(253,251,245,0.85)',
                      marginTop: '4px',
                    }}>
                      {sessionSummary.breathCount} cycles
                    </div>
                  </div>

                  <div>
                    <span style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '10px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'rgba(253,251,245,0.5)',
                    }}>
                      Best Tap Accuracy
                    </span>
                    <div style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '14px',
                      color: 'rgba(253,251,245,0.85)',
                      marginTop: '4px',
                    }}>
                      ±{sessionSummary.tapStats.bestErrorMs}ms
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Seal & Return Button */}
            <button
              onClick={() => {
                setShowSummary(false);
                setSessionSummary(null);
              }}
              className="w-full rounded-full py-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                background: 'var(--accent-color)',
                color: '#0B1F16',
                boxShadow: '0 0 18px rgba(120,255,190,0.35), inset 0 2px 6px rgba(255,255,255,0.15)',
              }}
            >
              Seal & Return
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ───────────────────────────────────────────────────────────
  // CONFIG VIEW - OPTIMIZED LAYOUT
  // ───────────────────────────────────────────────────────────
  return (
    <section className="w-full flex flex-col items-center pt-8 pb-24">
      {/* 3-TIER CEREMONIAL CARD */}
      <div
        className="relative w-full max-w-[420px] overflow-hidden transition-all duration-300"
        style={{
          // Softened background to let nebula bleed through
          background: 'rgba(10,14,18,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          // Faint amber border instead of strict line
          border: '1px solid rgba(255, 147, 0, 0.15)',
          // Softer shadow
          boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.2)',
          borderRadius: '32px',
          opacity: isStarting ? 0.92 : 1,
          transform: isStarting ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Mandala background - dual mask for mid-radius emphasis */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          {/* Mandala image - fairly visible, slightly scaled */}
          <img
            src={`${import.meta.env.BASE_URL}bg/practice-breath-mandala.png`}
            alt="Breath mandala"
            className="object-contain w-full h-full"
            style={{
              opacity: 0.2,
              transform: 'scale(1.25) translateY(-8%)',
              transformOrigin: 'center',
            }}
          />

          {/* INNER mask: darken the very center behind the timer */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, rgba(0,0,0,0.55) 0%, transparent 42%)',
            }}
          />

          {/* OUTER mask: soften edges so lines near panel border don't compete */}
          <div
            className="absolute inset-0 rounded-[32px]"
            style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.45) 100%)',
            }}
          />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 40% at 50% 0%, var(--accent-10) 0%, transparent 70%)',
          }}
        />

        <div
          className="absolute top-3 left-4"
          style={{ color: 'var(--accent-40)', fontSize: "6px" }}
        >
          ◆
        </div>
        <div
          className="absolute top-3 right-4"
          style={{ color: 'var(--accent-40)', fontSize: "6px" }}
        >
          ◆
        </div>

        <div className="relative px-8 py-10">
          {/* Practice selector - LEVEL 2: Primary Decision (Selectable Header Pattern) */}
          <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Text prompt above button */}
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '11px',
                letterSpacing: '0.15em',
                color: 'rgba(253,251,245,0.5)',
                textTransform: 'uppercase',
              }}
            >
              Choose your practice mode..
            </div>
            <button
              onClick={() => setPracticeModalOpen(true)}
              className="px-6 py-3 rounded-full relative overflow-hidden"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                // State-driven background
                background: practiceModalOpen
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                // Accent color border
                border: '1px solid var(--accent-30)',
                // State-driven halo pulse + asymmetric inner shadow (ember core)
                boxShadow: practiceModalOpen
                  ? `0 0 35px var(--accent-15), inset 0 0 25px var(--accent-08), inset 3px 4px 8px rgba(0,0,0,0.4), inset -2px -3px 6px var(--accent-20)`
                  : `0 0 ${20 + haloPulse * 30}px var(--accent-${Math.round(5 + haloPulse * 8)}), inset 0 0 ${20 + haloPulse * 15}px var(--accent-${Math.round(3 + haloPulse * 5)}), inset 3px 4px 8px rgba(0,0,0,0.35), inset -2px -3px 6px var(--accent-15)`,
                // State-driven scale + press feedback
                transform: practiceModalOpen ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 300ms ease-out, background 300ms ease-out, box-shadow 300ms ease-out',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = practiceModalOpen ? 'scale(1.04)' : 'scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = practiceModalOpen ? 'scale(1.06)' : 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = practiceModalOpen ? 'scale(1.06)' : 'scale(1)'}
            >
              <span>{practice}</span>
              {/* Chevron: static when closed, rotates 180° when open */}
              <span
                style={{
                  display: 'inline-block',
                  transition: 'transform 300ms ease-out',
                  transform: practiceModalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  fontSize: '14px',
                  opacity: 0.85,
                }}
              >
                ▾
              </span>
              {/* Radial gradient overlay for depth */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
                  mixBlendMode: 'soft-light',
                }}
              />
              {/* Grain texture overlay */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  opacity: 0.08,
                  mixBlendMode: 'overlay',
                }}
              />
            </button>
          </div>

          {/* RITUAL MODE: Show deck instead of duration/timer/start */}
          {practice === "Ritual" ? (
            <RitualSelectionDeck
              onSelectRitual={handleSelectRitual}
              selectedRitualId={activeRitual?.id}
            />
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* TIER 1 — INTENTION (Always Visible, Ceremonial, Decisive)   */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div
                className="mb-7"
                style={{
                  transition: 'opacity 200ms ease-out',
                  opacity: isStarting ? 0.6 : 1,
                }}
              >
                {/* Duration - centered, large - HIDE FOR CIRCUIT MODE */}
                {practice !== "Circuit" && (
                  <div className="flex flex-col items-center mb-5">
                    <div
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: "11px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(253,251,245,0.55)",
                        marginBottom: '10px',
                      }}
                    >
                      Duration
                    </div>
                    <div
                      style={{
                        fontFamily: "Georgia, serif",
                        fontSize: "36px",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        color: "rgba(253,251,245,0.92)",
                        textShadow: '0 0 6px rgba(0,0,0,0.6), 0 0 32px var(--accent-30)',
                      }}
                    >
                      {formatTime(timeLeft)}
                    </div>
                    <ScrollingWheel
                      value={duration}
                      onChange={setDuration}
                      options={DURATIONS}
                    />
                  </div>
                )}

                {/* START BUTTON — DOMINANT ANCHOR */}
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="w-full rounded-full py-3 transition-all duration-150 relative overflow-hidden"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    height: '46px',
                    // Circuit mode: glassmorphic pulsing
                    ...(practice === "Circuit" ? {
                      background: isStarting
                        ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.25)'
                        : 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: "var(--accent-color)",
                      border: "1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)",
                      boxShadow: isStarting
                        ? 'inset 0 0 25px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.35), 0 0 50px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)'
                        : 'inset 0 0 20px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.25), 0 0 40px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.2)',
                      animation: isStarting ? 'none' : 'heartbeat 1s ease-in-out infinite',
                    } : {
                      // Default styling for other practices
                      background: isStarting
                        ? 'rgba(120,255,190,0.4)'
                        : 'var(--accent-color)',
                      color: "#0B1F16",
                      border: "none",
                      boxShadow: isStarting
                        ? '0 0 30px rgba(120,255,190,0.5), inset 3px 4px 10px rgba(0,0,0,0.3), inset -2px -3px 8px rgba(255,255,255,0.25)'
                        : '0 0 18px rgba(120,255,190,0.35), inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.2)',
                    }),
                    transform: isStarting ? 'scale(1.015)' : 'scale(1)',
                    cursor: isStarting ? 'default' : 'pointer',
                  }}
                  onMouseDown={(e) => !isStarting && (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={(e) => !isStarting && (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={(e) => !isStarting && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {isStarting ? 'Initiating...' : 'Start'}
                  {/* Radial gradient overlay for depth */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                      mixBlendMode: 'soft-light',
                    }}
                  />
                  {/* Grain texture overlay */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      opacity: 0.06,
                      mixBlendMode: 'overlay',
                    }}
                  />
                </button>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* TIER 2 — FORM (Collapsed by default, selection-focused)     */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div
                style={{
                  transition: 'opacity 200ms ease-out, max-height 260ms ease-in-out',
                  opacity: isStarting ? 0 : 1,
                  pointerEvents: isStarting ? 'none' : 'auto',
                }}
              >
                {/* Collapsible Header */}
                <button
                  onClick={() => setTier2Expanded(!tier2Expanded)}
                  onMouseEnter={() => setTier2Hovered(true)}
                  onMouseLeave={() => setTier2Hovered(false)}
                  className="w-full flex items-center justify-between py-2 mb-2 relative"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "12px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(253,251,245,0.6)",
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      animation: tier2Expanded || tier2Hovered ? 'none' : 'text-pulse 3.2s ease-in-out infinite',
                      opacity: tier2Hovered ? 0.85 : undefined,
                    }}
                  >
                    Options
                  </span>
                  <span style={{
                    transition: 'transform 200ms ease-out',
                    transform: tier2Expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    opacity: 0.6,
                  }}>▾</span>
                </button>

                <style>{`
                  @keyframes text-pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.75; }
                  }
                `}</style>

                {/* Collapsible Content */}
                <div
                  style={{
                    maxHeight: tier2Expanded ? '800px' : '0',
                    overflow: tier2Expanded ? 'auto' : 'hidden',
                    opacity: tier2Expanded ? 1 : 0,
                    transition: 'max-height 260ms ease-in-out, opacity 180ms ease-in-out',
                  }}
                >
                  {/* Practice-specific config components */}
                  {practice === "Breath & Stillness" && (
                    <BreathConfig
                      pattern={pattern}
                      setPattern={setPattern}
                      preset={preset}
                      setPreset={setPreset}
                    />
                  )}

                  {practice === "Somatic Vipassana" && (
                    <SensoryConfig
                      sensoryType={sensoryType}
                      setSensoryType={setSensoryType}
                    />
                  )}

                  {practice === "Circuit" && (
                    <CircuitConfig
                      value={circuitConfig}
                      onChange={setCircuitConfig}
                    />
                  )}

                  {practice === "Cognitive Vipassana" && (
                    <div className="mb-4">
                      <div
                        className="mb-3"
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "9px",
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          color: "rgba(253,251,245,0.55)",
                          textAlign: "center"
                        }}
                      >
                        Theme
                      </div>
                      <div
                        className="flex gap-2 p-1 rounded-full flex-wrap justify-center"
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid var(--accent-10)",
                        }}
                      >
                        {Object.values(VIPASSANA_THEMES).map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setVipassanaTheme(theme.id)}
                            className="rounded-full px-3 py-1.5 transition-all duration-200"
                            style={{
                              fontFamily: "Georgia, serif",
                              fontSize: "9px",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              background:
                                vipassanaTheme === theme.id
                                  ? 'var(--accent-color)'
                                  : "transparent",
                              color:
                                vipassanaTheme === theme.id
                                  ? "#050508"
                                  : "rgba(253,251,245,0.55)",
                              opacity: vipassanaTheme && vipassanaTheme !== theme.id ? 0.35 : 1,
                              boxShadow:
                                vipassanaTheme === theme.id
                                  ? '0 0 10px rgba(120,255,190,0.25)'
                                  : "none",
                              transform: vipassanaTheme === theme.id ? 'scale(1.05)' : 'scale(1)',
                              transition: 'transform 160ms ease-out, background 200ms, color 200ms, box-shadow 200ms, opacity 200ms',
                            }}
                          >
                            {theme.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {practice === "Sound" && (
                    <SoundConfig
                      soundType={soundType}
                      setSoundType={setSoundType}
                      binauralPreset={binauralPreset}
                      setBinauralPreset={setBinauralPreset}
                      isochronicPreset={isochronicPreset}
                      setIsochronicPreset={setIsochronicPreset}
                      mantraPreset={mantraPreset}
                      setMantraPreset={setMantraPreset}
                      naturePreset={naturePreset}
                      setNaturePreset={setNaturePreset}
                      carrierFrequency={carrierFrequency}
                      setCarrierFrequency={setCarrierFrequency}
                      volume={soundVolume}
                      setVolume={setSoundVolume}
                    />
                  )}

                  {practice === "Visualization" && (
                    <VisualizationConfig
                      geometry={geometry}
                      setGeometry={setGeometry}
                      fadeInDuration={fadeInDuration}
                      setFadeInDuration={setFadeInDuration}
                      displayDuration={displayDuration}
                      setDisplayDuration={setDisplayDuration}
                      fadeOutDuration={fadeOutDuration}
                      setFadeOutDuration={setFadeOutDuration}
                      voidDuration={voidDuration}
                      setVoidDuration={setVoidDuration}
                      duration={duration}
                      setDuration={setDuration}
                      audioEnabled={audioEnabled}
                      setAudioEnabled={setAudioEnabled}
                    />
                  )}

                  {practice === "Cymatics" && (
                    <CymaticsConfig
                      frequencySet={frequencySet}
                      setFrequencySet={setFrequencySet}
                      selectedFrequency={selectedFrequency}
                      setSelectedFrequency={setSelectedFrequency}
                      fadeInDuration={fadeInDuration}
                      setFadeInDuration={setFadeInDuration}
                      displayDuration={displayDuration}
                      setDisplayDuration={setDisplayDuration}
                      fadeOutDuration={fadeOutDuration}
                      setFadeOutDuration={setFadeOutDuration}
                      voidDuration={voidDuration}
                      setVoidDuration={setVoidDuration}
                      driftEnabled={driftEnabled}
                      setDriftEnabled={setDriftEnabled}
                      audioEnabled={audioEnabled}
                      setAudioEnabled={setAudioEnabled}
                    />
                  )}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* TIER 3 — BREATH MECHANICS (Advanced, Collapsed)             */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {practice === "Breath & Stillness" && (
                <div
                  style={{
                    marginTop: '20px',
                    transition: 'opacity 200ms ease-out',
                    opacity: isStarting ? 0 : 1,
                    pointerEvents: isStarting ? 'none' : 'auto',
                  }}
                >
                  {/* Pattern preview collapsed header */}
                  <button
                    onClick={() => setTier3Expanded(!tier3Expanded)}
                    onMouseEnter={() => setTier3Hovered(true)}
                    onMouseLeave={() => setTier3Hovered(false)}
                    className="w-full flex items-center justify-between py-2"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(253,251,245,0.45)",
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        animation: tier3Expanded || tier3Hovered ? 'none' : 'text-pulse 3.2s ease-in-out infinite',
                        opacity: tier3Hovered ? 0.75 : undefined,
                      }}
                    >
                      Pattern Preview
                    </span>
                    <span style={{
                      transition: 'transform 200ms ease-out',
                      transform: tier3Expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      opacity: 0.5,
                    }}>▾</span>
                  </button>

                  <div
                    style={{
                      maxHeight: tier3Expanded ? '200px' : '0',
                      overflow: 'hidden',
                      opacity: tier3Expanded ? 1 : 0,
                      transition: 'max-height 260ms ease-in-out, opacity 180ms ease-in-out',
                    }}
                  >
                    {/* Pattern preview SVG */}
                    <div className="relative w-full h-16 mt-2">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="patternGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--accent-20)"
                            />
                            <stop
                              offset="100%"
                              stopColor="transparent"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d={pathD}
                          fill="url(#patternGradient)"
                          stroke="var(--accent-primary)"
                          strokeWidth="0.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      <div className="flex justify-between w-full px-1 mt-1">
                        <span style={{ fontSize: "6px", color: "rgba(253,251,245,0.45)", width: `${(pattern.inhale / totalDuration) * 100}%`, textAlign: "center" }}>IN</span>
                        <span style={{ fontSize: "6px", color: "rgba(253,251,245,0.45)", width: `${(pattern.hold1 / totalDuration) * 100}%`, textAlign: "center" }}>HOLD</span>
                        <span style={{ fontSize: "6px", color: "rgba(253,251,245,0.45)", width: `${(pattern.exhale / totalDuration) * 100}%`, textAlign: "center" }}>OUT</span>
                        <span style={{ fontSize: "6px", color: "rgba(253,251,245,0.45)", width: `${(pattern.hold2 / totalDuration) * 100}%`, textAlign: "center" }}>HOLD</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Practice Selection Modal */}
      <PracticeSelectionModal
        isOpen={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        practices={PRACTICES}
        currentPractice={practice}
        onSelectPractice={setPractice}
      />
    </section>
  );
}

