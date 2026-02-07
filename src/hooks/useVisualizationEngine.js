// src/hooks/useVisualizationEngine.js
// 4-phase state machine for Visualization practice
// Phases: fadeIn → display → fadeOut → void → (cycle repeats)

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const PHASES = ['fadeIn', 'display', 'fadeOut', 'void'];

export function useVisualizationEngine({
    fadeInDuration = 2.5,
    displayDuration = 10,
    fadeOutDuration = 2.5,
    voidDuration = 10,
    onPhaseChange = null,
    onCycleComplete = null,
} = {}) {
    // Core state
    const [phase, setPhase] = useState('fadeIn');
    const [progress, setProgress] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);
    const [totalElapsed, setTotalElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Session seed for procedural variance (generated once per session)
    const [sessionSeed, setSessionSeed] = useState(0);

    // Keep latest callbacks/durations in refs so the animation loop stays stable
    const onPhaseChangeRef = useRef(onPhaseChange);
    const onCycleCompleteRef = useRef(onCycleComplete);
    const durationsRef = useRef({
        fadeIn: fadeInDuration * 1000,
        display: displayDuration * 1000,
        fadeOut: fadeOutDuration * 1000,
        void: voidDuration * 1000,
    });
    const isRunningRef = useRef(false);

    // Animation refs
    const frameRef = useRef(null);
    const startTimeRef = useRef(null);
    const phaseStartTimeRef = useRef(null);
    const currentPhaseRef = useRef('fadeIn');
    const cycleCountRef = useRef(0);

    // Duration lookup
    const phaseDurations = useMemo(
        () => ({
            fadeIn: fadeInDuration * 1000,
            display: displayDuration * 1000,
            fadeOut: fadeOutDuration * 1000,
            void: voidDuration * 1000,
        }),
        [fadeInDuration, displayDuration, fadeOutDuration, voidDuration]
    );

    // Keep ref in sync for the animation loop
    useEffect(() => {
        durationsRef.current = phaseDurations;
    }, [phaseDurations]);

    const totalCycleDuration = useMemo(
        () => Object.values(phaseDurations).reduce((a, b) => a + b, 0),
        [phaseDurations]
    );

    // Get next phase in cycle
    const getNextPhase = (currentPhase) => {
        const idx = PHASES.indexOf(currentPhase);
        return PHASES[(idx + 1) % PHASES.length];
    };

    // Keep callback refs updated so animate never re-subscribes
    useEffect(() => {
        onPhaseChangeRef.current = onPhaseChange;
    }, [onPhaseChange]);

    useEffect(() => {
        onCycleCompleteRef.current = onCycleComplete;
    }, [onCycleComplete]);

    // Main animation loop - drift-free using absolute timestamps
    const animate = useCallback((now) => {
        if (!isRunningRef.current) return;

        if (!startTimeRef.current) {
            startTimeRef.current = now;
            phaseStartTimeRef.current = now;
        }

        // Calculate total elapsed time
        const elapsed = now - startTimeRef.current;
        setTotalElapsed(elapsed / 1000);

        // Calculate time within current phase
        const phaseElapsed = now - phaseStartTimeRef.current;
        const currentPhaseDuration = durationsRef.current[currentPhaseRef.current];

        // Calculate progress within phase (0.0 to 1.0)
        const phaseProgress = Math.min(phaseElapsed / currentPhaseDuration, 1.0);
        setProgress(phaseProgress);

        // Check for phase transition
        if (phaseElapsed >= currentPhaseDuration) {
            const oldPhase = currentPhaseRef.current;
            const newPhase = getNextPhase(oldPhase);

            // Update refs and state
            currentPhaseRef.current = newPhase;
            phaseStartTimeRef.current = now;
            setPhase(newPhase);
            setProgress(0);

            // Fire phase change callback
            if (onPhaseChangeRef.current) {
                onPhaseChangeRef.current(newPhase, oldPhase);
            }

            // Check for cycle completion (when void ends → fadeIn begins)
            if (oldPhase === 'void') {
                cycleCountRef.current += 1;
                setCycleCount(cycleCountRef.current);

                if (onCycleCompleteRef.current) {
                    onCycleCompleteRef.current(cycleCountRef.current);
                }
            }
        }

        // Continue animation loop
        frameRef.current = requestAnimationFrame(animate);
    }, []);

    // Start the engine
     
    const start = useCallback(() => {
        if (isRunningRef.current) return;

        // Generate new session seed
         
        setSessionSeed(Math.random());

        // Reset state
        setPhase('fadeIn');
        setProgress(0);
        setCycleCount(0);
        setTotalElapsed(0);
        currentPhaseRef.current = 'fadeIn';
        cycleCountRef.current = 0;
        startTimeRef.current = null;
        phaseStartTimeRef.current = null;

        // Start animation loop
        isRunningRef.current = true;
        setIsRunning(true);
        frameRef.current = requestAnimationFrame(animate);
    }, [animate]);

    // Stop the engine
    const stop = useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        isRunningRef.current = false;
        setIsRunning(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    // Calculate estimated total cycles for session
    const getEstimatedCycles = (sessionDurationMinutes) => {
        return Math.floor((sessionDurationMinutes * 60 * 1000) / totalCycleDuration);
    };

    return {
        // Current state
        phase,
        progress,
        cycleCount,
        totalElapsed,
        isRunning,
        sessionSeed,

        // Actions
        start,
        stop,

        // Utilities
        getEstimatedCycles,
        totalCycleDuration: totalCycleDuration / 1000, // in seconds
    };
}
