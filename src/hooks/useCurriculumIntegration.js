// useCurriculumIntegration.js
// Handles curriculum-specific practice session logic

import { useEffect, useRef, useCallback, useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';

/**
 * Custom hook for curriculum integration
 * @param {function} onSessionReady - Callback when curriculum session is ready to start
 * @returns {object} Curriculum integration state and methods
 */
export function useCurriculumIntegration(onSessionReady = null) {
  const {
    getActivePracticeDay,
    activePracticeSession,
    clearActivePracticeSession,
  } = useCurriculumStore();

  // Ref to track if we've already auto-started for this session
  const autoStartedRef = useRef(null);
  const [wasFromCurriculum, setWasFromCurriculum] = useState(false);

  // Parse curriculum day into practice configuration
  const parseCurriculumDay = useCallback((curriculumDay) => {
    if (!curriculumDay) return null;

    const legs = curriculumDay.legs || [];
    const firstLeg = legs[0];

    if (!firstLeg) return null;

    // Determine if this is a circuit (multiple legs) or single practice
    if (legs.length > 1) {
      // Multi-leg circuit
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

      const totalDuration = legs.reduce((acc, leg) => acc + (leg.duration || 0), 0);

      return {
        isCircuit: true,
        practice: "Circuit",
        duration: totalDuration,
        circuitConfig: {
          exercises,
          exerciseDuration: totalDuration,
        },
      };
    } else {
      // Single leg practice
      return {
        isCircuit: false,
        practice: firstLeg.practiceType,
        duration: firstLeg.duration || 10,
        preset: firstLeg.preset,
        pattern: firstLeg.pattern,
        sensoryType: firstLeg.sensoryType,
      };
    }
  }, []);

  // Check for active curriculum session and trigger auto-start
  useEffect(() => {
    const curriculumDay = getActivePracticeDay();
    
    if (curriculumDay && activePracticeSession && autoStartedRef.current !== activePracticeSession) {
      // Mark this session as auto-started to prevent re-triggering
      autoStartedRef.current = activePracticeSession;
      setWasFromCurriculum(true);
      
      const config = parseCurriculumDay(curriculumDay);
      
      if (config && onSessionReady) {
        console.log('[useCurriculumIntegration] Auto-starting curriculum session:', config);
        onSessionReady(config);
      }
    }
  }, [activePracticeSession, getActivePracticeDay, parseCurriculumDay, onSessionReady]);

  useEffect(() => {
    if (!activePracticeSession) {
      setWasFromCurriculum(false);
    }
  }, [activePracticeSession]);

  // Get next leg info for summary display
  const getNextLeg = useCallback((currentSession, offset = 1) => {
    const { getNextLeg: storeGetNextLeg } = useCurriculumStore.getState();
    return currentSession ? storeGetNextLeg(currentSession, offset) : null;
  }, []);

  return {
    activePracticeSession,
    clearActivePracticeSession,
    getActivePracticeDay,
    parseCurriculumDay,
    getNextLeg,
    wasFromCurriculum,
  };
}

export default useCurriculumIntegration;
