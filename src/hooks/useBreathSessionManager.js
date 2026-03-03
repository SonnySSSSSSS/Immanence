import { useState, useRef } from 'react';

/**
 * useBreathSessionState - Manages breath practice session state
 * Includes timing, error tracking, breath counting, and circuit management
 */
export function useBreathSessionManager() {
  // Session timing and countdown
  const [timeLeft, setTimeLeft] = useState(null);
  const [countdownValue, setCountdownValue] = useState(null);
  const circuitCountdownRef = useRef(null);

  // Breath practice state
  const [breathCount, setBreathCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Error tracking for breath feedback
  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);

  // Circuit training state
  const [activeCircuitId, setActiveCircuitId] = useState(null);
  const [circuitValidationError, setCircuitValidationError] = useState(null);
  const [circuitExerciseIndex, setCircuitExerciseIndex] = useState(0);
  const [circuitConfig, setCircuitConfig] = useState(null);
  const [_circuitSavedPractice, setCircuitSavedPractice] = useState(null);

  // Visualization state
  const [_visualizationCycles, setVisualizationCycles] = useState(0);

  // Ritual/integration state
  const [activeRitual, setActiveRitual] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Breath ring preset state
  const [ringPresetIndex, setRingPresetIndex] = useState(0);
  const [isPresetSwitcherOpen, setIsPresetSwitcherOpen] = useState(false);

  return {
    // Timing
    timeLeft,
    setTimeLeft,
    countdownValue,
    setCountdownValue,
    circuitCountdownRef,

    // Breath tracking
    breathCount,
    setBreathCount,
    sessionStartTime,
    setSessionStartTime,

    // Error tracking
    tapErrors,
    setTapErrors,
    lastErrorMs,
    setLastErrorMs,
    lastSignedErrorMs,
    setLastSignedErrorMs,

    // Circuit
    activeCircuitId,
    setActiveCircuitId,
    circuitValidationError,
    setCircuitValidationError,
    circuitExerciseIndex,
    setCircuitExerciseIndex,
    circuitConfig,
    setCircuitConfig,
    setCircuitSavedPractice,

    // Visualization
    setVisualizationCycles,

    // Ritual/integration
    activeRitual,
    setActiveRitual,
    currentStepIndex,
    setCurrentStepIndex,

    // Breath ring
    ringPresetIndex,
    setRingPresetIndex,
    isPresetSwitcherOpen,
    setIsPresetSwitcherOpen,
  };
}
