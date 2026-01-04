// usePracticeSession.js
// Manages practice session lifecycle, start/stop logic, and progress recording

import { useState, useCallback, useRef } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { syncFromProgressStore } from '../state/mandalaStore.js';
import { loadPreferences, savePreferences } from '../state/practiceStore.js';
import { logPractice } from '../services/cycleManager.js';
import { useSessionInstrumentation } from './useSessionInstrumentation.js';
import { useCurriculumStore } from '../state/curriculumStore.js';

/**
 * Custom hook for managing practice session lifecycle
 * @param {object} options - Configuration options
 * @returns {object} Session state and control methods
 */
export function usePracticeSession(options = {}) {
  const {
    onPracticingChange,
    onBreathStateChange,
  } = options;

  const instrumentation = useSessionInstrumentation();
  const savedPrefs = loadPreferences();

  // Session state
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  // Tap tracking for breath accuracy
  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);
  const [breathCount, setBreathCount] = useState(0);

  // Track if session was from curriculum
  const wasFromCurriculumRef = useRef(null);

  // Handle accuracy tap for breath practice
  const handleAccuracyTap = useCallback((errorMs) => {
    if (typeof errorMs !== 'number' || isNaN(errorMs)) return;
    
    setTapErrors(prev => [...prev, errorMs]);
    setLastErrorMs(Math.abs(errorMs));
    setLastSignedErrorMs(errorMs);
  }, []);

  // Calculate tap stats
  const calculateTapStats = useCallback(() => {
    const tapCount = tapErrors.length;
    if (tapCount === 0) return null;

    const avgErrorMs = Math.round(
      tapErrors.reduce((sum, v) => sum + Math.abs(v), 0) / tapCount
    );
    const bestErrorMs = Math.round(
      Math.min(...tapErrors.map(e => Math.abs(e)))
    );

    return { tapCount, avgErrorMs, bestErrorMs };
  }, [tapErrors]);

  // Start session
  const startSession = useCallback((practiceConfig) => {
    const {
      practice,
      duration,
      preset,
      pattern,
      sensoryType,
      vipassanaTheme,
      vipassanaElement,
      soundType,
      geometry,
      fromCurriculum = false,
    } = practiceConfig;

    // Save preferences
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

    // Track curriculum source
    wasFromCurriculumRef.current = fromCurriculum;

    // Reset tracking state
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);
    setSessionStartTime(performance.now());
    setIsRunning(true);

    // Notify parent
    if (onPracticingChange) onPracticingChange(true);

    // Start instrumentation
    const p = practice.toLowerCase();
    let domain = 'breathwork';
    if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
    else if (p === 'somatic vipassana') domain = sensoryType;
    else if (p === 'ritual') domain = 'ritual';
    else if (p === 'sound') domain = 'sound';

    instrumentation.startSession(domain, null, p === 'somatic vipassana' ? sensoryType : null);

    console.log('[usePracticeSession] Session started:', { practice, duration, domain });
  }, [instrumentation, onPracticingChange]);

  // Stop session
  const stopSession = useCallback((practiceConfig) => {
    const {
      practice,
      duration,
      timeLeft,
      pattern,
      sensoryType,
      soundType,
      geometry,
      selectedFrequency,
      activeRitual,
    } = practiceConfig;

    try {
      // Capture curriculum state before clearing
      const { activePracticeSession, clearActivePracticeSession } = useCurriculumStore.getState();
      const wasFromCurriculum = activePracticeSession || wasFromCurriculumRef.current;
      
      console.log('[usePracticeSession] Stopping session:', { wasFromCurriculum, practice });

      clearActivePracticeSession();
      setIsRunning(false);
      
      if (onPracticingChange) onPracticingChange(false);
      if (onBreathStateChange) onBreathStateChange(null);

      const exitType = timeLeft <= 0 ? 'completed' : 'abandoned';
      const instrumentationData = instrumentation.endSession(exitType);

      // Calculate tap stats
      const tapStats = calculateTapStats();

      // Determine subType
      let subType = null;
      if (practice === "Somatic Vipassana") subType = sensoryType;
      if (practice === "Sound") subType = soundType;
      if (practice === "Visualization") subType = geometry;
      if (practice === "Cymatics" && selectedFrequency) {
        subType = `${selectedFrequency.hz} Hz - ${selectedFrequency.name}`;
      }
      if (practice === "Ritual") subType = activeRitual?.id;

      // Record session to progress store
      try {
        const p = practice.toLowerCase();
        let domain = 'breathwork';
        if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
        else if (p === 'somatic vipassana') domain = sensoryType;
        else if (p === 'ritual') domain = 'ritual';
        else if (p === 'sound') domain = 'sound';

        useProgressStore.getState().recordSession({
          domain,
          duration: duration,
          metadata: {
            subType,
            pattern: practice === "Breath & Stillness" ? { ...pattern } : null,
            tapStats,
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
        console.error("[usePracticeSession] Failed to save session:", e);
      }

      // Determine if summary should be shown
      const actualDuration = duration * 60 - timeLeft;
      const shouldShowSummary = wasFromCurriculum || (practice !== 'Ritual' && actualDuration >= 30);

      console.log('[usePracticeSession] shouldShowSummary:', shouldShowSummary);

      if (shouldShowSummary) {
        const { getNextLeg } = useCurriculumStore.getState();
        const nextLeg = wasFromCurriculum ? getNextLeg(wasFromCurriculum, 1) : null;

        setSessionSummary({
          practice,
          duration,
          tapStats,
          breathCount,
          exitType,
          nextLeg,
        });
        setShowSummary(true);
      }

      // Reset curriculum ref
      wasFromCurriculumRef.current = null;

    } catch (error) {
      console.error('[usePracticeSession] Error in stopSession:', error);
    }
  }, [instrumentation, onPracticingChange, onBreathStateChange, calculateTapStats, breathCount]);

  // Dismiss summary
  const dismissSummary = useCallback(() => {
    setShowSummary(false);
    setSessionSummary(null);
  }, []);

  // Handle start with animation delay
  const handleStart = useCallback((practiceConfig, delay = 1400) => {
    setIsStarting(true);
    
    setTimeout(() => {
      setIsStarting(false);
      startSession(practiceConfig);
    }, delay);
  }, [startSession]);

  return {
    // State
    isRunning,
    isStarting,
    sessionStartTime,
    showSummary,
    sessionSummary,
    tapErrors,
    lastErrorMs,
    lastSignedErrorMs,
    breathCount,
    
    // Methods
    startSession,
    stopSession,
    handleStart,
    handleAccuracyTap,
    dismissSummary,
    setBreathCount,
    
    // Saved preferences
    savedPrefs,
  };
}

export default usePracticeSession;
