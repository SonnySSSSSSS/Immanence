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

// New modular practice components
import { SessionSummaryModal } from "./practice/SessionSummaryModal.jsx";
import { PracticeConfigCard } from "./practice/PracticeConfigCard.jsx";
import { PracticeControls } from "./practice/PracticeControls.jsx";

const DEV_FX_GALLERY_ENABLED = true;

const PRACTICES = ["Breath & Stillness", "Ritual", "Circuit", "Cognitive Vipassana", "Somatic Vipassana", "Sound", "Visualization", "Cymatics"];
const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

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

export function PracticeSection({ onPracticingChange, onBreathStateChange, avatarPath, showCore, showFxGallery = DEV_FX_GALLERY_ENABLED }) {
  const instrumentation = useSessionInstrumentation();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const savedPrefs = loadPreferences();

  const [practice, setPractice] = useState(savedPrefs.practice || PRACTICES[0]);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);

  // CURRICULUM INTEGRATION
  const { 
    getActivePracticeDay, 
    activePracticeSession,
    clearActivePracticeSession,
  } = useCurriculumStore();

  // Ref to track if we've already auto-started for this session
  const autoStartedRef = useRef(null);

  // Load curriculum day settings when active session changes AND auto-start
  useEffect(() => {
    const curriculumDay = getActivePracticeDay();
    if (curriculumDay && activePracticeSession && autoStartedRef.current !== activePracticeSession) {
      // Mark this session as auto-started to prevent re-triggering
      autoStartedRef.current = activePracticeSession;
      
      const legs = curriculumDay.legs || [];
      const firstLeg = legs[0];
      
      if (!firstLeg) return;

      // Determine if this is a circuit (multiple legs) or a single practice
      if (legs.length > 1) {
        setPractice("Circuit");
        const exercises = legs.map((leg, index) => ({
          exercise: {
            id: leg.id || `leg-${index}`,
            name: leg.label || leg.practiceType,
            type: leg.practiceType,
            practiceType: leg.practiceType,
            preset: leg.preset,
            sensoryType: leg.sensoryType,
          },
          duration: leg.duration,
        }));

        setCircuitConfig({
          exercises,
          exerciseDuration: legs.reduce((acc, leg) => acc + (leg.duration || 0), 0),
        });
        
        setDuration(legs.reduce((acc, leg) => acc + (leg.duration || 0), 0));
        setTimeLeft(legs.reduce((acc, leg) => acc + (leg.duration || 0), 0) * 60);
      } else {
        // Single leg practice
        setPractice(firstLeg.practiceType);
        setDuration(firstLeg.duration || 10);
        setTimeLeft((firstLeg.duration || 10) * 60);
        
        if (firstLeg.preset) {
           if (firstLeg.practiceType === "Breath & Stillness") setPreset(firstLeg.preset);
           if (firstLeg.practiceType === "Somatic Vipassana") setSensoryType(firstLeg.preset);
           if (firstLeg.practiceType === "Sound") setSoundType(firstLeg.preset);
           if (firstLeg.practiceType === "Visualization") setGeometry(firstLeg.preset);
        }
        
        if (firstLeg.pattern) {
          setPattern(firstLeg.pattern);
        }
      }

      // Auto-start the practice session immediately
      setIsRunning(true);
      onPracticingChange && onPracticingChange(true);
      setSessionStartTime(performance.now());
    }
  }, [activePracticeSession, getActivePracticeDay, onPracticingChange]);

  const [chevronAngle, setChevronAngle] = useState(0);
  const [haloPulse, setHaloPulse] = useState(0);
  const [duration, setDuration] = useState(savedPrefs.duration);
  const [preset, setPreset] = useState(savedPrefs.preset);
  const [pattern, setPattern] = useState(savedPrefs.pattern);

  const [sensoryType, setSensoryType] = useState(savedPrefs.sensoryType || SENSORY_TYPES[0].id);
  const [soundType, setSoundType] = useState(savedPrefs.soundType || SOUND_TYPES[0]);
  const [vipassanaTheme, setVipassanaTheme] = useState(savedPrefs.vipassanaTheme);
  const [vipassanaElement, setVipassanaElement] = useState(savedPrefs.vipassanaElement);

  const [vipassanaVariant, setVipassanaVariant] = useState('thought-labeling');
  const [showVipassanaVariantModal, setShowVipassanaVariantModal] = useState(false);

  const [binauralPreset, setBinauralPreset] = useState(BINAURAL_PRESETS[2]);
  const [isochronicPreset, setIsochronicPreset] = useState(ISOCHRONIC_PRESETS[1]);
  const [mantraPreset, setMantraPreset] = useState(null);
  const [naturePreset, setNaturePreset] = useState(null);
  const [carrierFrequency, setCarrierFrequency] = useState(200);
  const [soundVolume, setSoundVolume] = useState(0.5);

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  const [tier2Expanded, setTier2Expanded] = useState(true);
  const [tier3Expanded, setTier3Expanded] = useState(true);

  const [isStarting, setIsStarting] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  const [lastSessionId, setLastSessionId] = useState(null);
  const { startMicroNote, pendingMicroNote } = useJournalStore();

  const [tier2Hovered, setTier2Hovered] = useState(false);
  const [tier3Hovered, setTier3Hovered] = useState(false);

  const [activeCircuitId, setActiveCircuitId] = useState(null);
  const [circuitConfig, setCircuitConfig] = useState(null);
  const [circuitExerciseIndex, setCircuitExerciseIndex] = useState(0);
  const [circuitSavedPractice, setCircuitSavedPractice] = useState(null);

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

  const [frequencySet, setFrequencySet] = useState('solfeggio');
  const [selectedFrequency, setSelectedFrequency] = useState(SOLFEGGIO_SET[4]);
  const [driftEnabled, setDriftEnabled] = useState(false);

  const [activeRitual, setActiveRitual] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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
    console.log('═══════════════════════════════════════');
    console.log('[handleStop] START');
    console.log('[handleStop] Current state:', { 
      practice, 
      duration, 
      timeLeft,
      isRunning,
      activePracticeSession 
    });
    try {
      // Capture the active session before clearing it (needed for summary logic)
      const wasFromCurriculum = activePracticeSession;
      console.log('[handleStop] wasFromCurriculum:', wasFromCurriculum);
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
      
      // Calculate actualDuration BEFORE resetting timeLeft
      const actualDuration = duration * 60 - timeLeft;
      
      // Now reset timeLeft
      setTimeLeft(duration * 60);

      // Show summary for any curriculum session, or for manual sessions >= 30s
      const shouldShowSummary = wasFromCurriculum || (practice !== 'Ritual' && actualDuration >= 30);
      console.log('[handleStop] 🔍 Summary Decision Logic:');
      console.log('  - wasFromCurriculum:', wasFromCurriculum);
      console.log('  - practice:', practice);
      console.log('  - practice !== Ritual:', practice !== 'Ritual');
      console.log('  - actualDuration:', actualDuration, 'seconds');
      console.log('  - actualDuration >= 30:', actualDuration >= 30);
      console.log('  - shouldShowSummary:', shouldShowSummary);

      if (shouldShowSummary) {
        // Check if there's a next leg in curriculum
        const { getNextLeg } = useCurriculumStore.getState();
        const nextLeg = wasFromCurriculum ? getNextLeg(wasFromCurriculum, 1) : null;

        const summaryData = {
            practice,
            duration,
            tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
            breathCount,
            exitType,
            nextLeg: nextLeg,
        };
        console.log('[handleStop] ✅ SHOWING SUMMARY - Setting summaryData:', summaryData);
        setSessionSummary(summaryData);
        setShowSummary(true);
        console.log('[handleStop] State update complete: showSummary=true, sessionSummary=', summaryData);
      } else {
        console.log('[handleStop] ❌ NOT showing summary - criteria not met');
      }
      console.log('[handleStop] END');
      console.log('═══════════════════════════════════════');
    } catch (error) {
      console.error('[handleStop] ERROR:', error);
      console.error('[handleStop] Stack:', error.stack);
    }
  };

  const executeStart = () => {
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

    if (practice === "Circuit") {
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

  const handleStart = () => {
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

  if (isRunning) {
    if (practice === "Ritual") {
      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <RitualPortal
            onComplete={handleRitualComplete}
            onStop={handleStop}
          />
        </section>
      );
    }

    if (practice === "Cognitive Vipassana") {
      if (showVipassanaVariantModal) {
        return (
          <VipassanaVariantSelector
            onSelect={(variant) => {
              setVipassanaVariant(variant);
              setShowVipassanaVariantModal(false);
            }}
            onCancel={() => {
              setShowVipassanaVariantModal(false);
              handleStop();
            }}
          />
        );
      }

      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <div className="flex-1 flex items-center justify-center w-full relative">
            <VipassanaVisual
              isActive={isRunning}
              variant={vipassanaVariant}
              wallpaperId={vipassanaTheme}
              themeId={vipassanaElement}
              durationSeconds={duration * 60}
              stage={theme.stage || 'flame'}
              onComplete={handleExerciseComplete}
              onExit={activeCircuitId ? handleCircuitComplete : handleStop}
              onCancel={handleStop}
            />
          </div>

          <PracticeControls
            onStop={handleStop}
            formattedTime={formatTime(timeLeft)}
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
          ) : practice === "Somatic Vipassana" ? (
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

        <PracticeControls
          onStop={handleStop}
          formattedTime={formatTime(timeLeft)}
          feedbackText={practice === "Breath & Stillness" && lastSignedErrorMs !== null ? feedbackText : ''}
          feedbackColor={feedbackColor}
          feedbackShadow={feedbackShadow}
          buttonBg={buttonBg}
          radialGlow={radialGlow}
        >
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
        </PracticeControls>

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


  if (showSummary && sessionSummary) {
    return (
      <SessionSummaryModal
        summary={sessionSummary}
        onContinue={() => {
          setShowSummary(false);
          setSessionSummary(null);
          if (!pendingMicroNote) {
            // Return to practice selection
            setPractice(PRACTICES[0]);
          }
        }}
        onStartNext={(nextPractice) => {
          setShowSummary(false);
          setSessionSummary(null);
          setPractice(nextPractice);
          // Auto-start the next practice after a short delay
          setTimeout(() => {
            executeStart();
          }, 100);
        }}
      />
    );
  }

  // DEFAULT VIEW - Last Practice with Change Button
  return (
    <>
      <PracticeSelectionModal
        isOpen={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        practices={PRACTICES}
        currentPractice={practice}
        onSelectPractice={(selectedPractice) => {
          setPractice(selectedPractice);
          setPracticeModalOpen(false);
        }}
      />

      <PracticeConfigCard
        practice={practice}
        duration={duration}
        onPracticeChange={() => setPracticeModalOpen(true)} // Open modal instead of direct change
        onDurationChange={(d) => {
          setDuration(d);
          setTimeLeft(d * 60);
        }}
        onStart={handleStart}
        showChangePracticeButton={true}
      />
    </>
  );
}

export default PracticeSection;