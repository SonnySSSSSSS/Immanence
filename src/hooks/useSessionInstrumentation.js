// src/hooks/useSessionInstrumentation.js
// ═══════════════════════════════════════════════════════════════════════════
// ATTENTION PATH INSTRUMENTATION — SESSION TRACKING HOOK
// ═══════════════════════════════════════════════════════════════════════════
//
// This hook provides functions to instrument session events for
// future attention path calculation. Phase 1 = data collection only.
//
// IMPORTANT DEFINITIONS:
// - alive_signal_count: Any intentional user interaction during session.
//   Taps, adjustments, pauses — all count equally. NOT correctness.
//
// - switch_count: Switching within the same practice (steps, stages).
//   Switching between practices ends the session and starts a new one.
//
// - exit_type:
//   - 'completed': Timer reached zero or natural end
//   - 'abandoned': User clicked stop before completion
//   - 'backgrounded': App lost focus / mobile interruption
//   - 'system_kill': App force-closed / crash (detected on next launch)
//
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useCallback, useEffect } from 'react';
import { getPracticeFamily } from '../data/practiceFamily';

/**
 * Session instrumentation hook for tracking attention-relevant session data
 * 
 * @returns {Object} Instrumentation functions
 */
export function useSessionInstrumentation() {
    // Use ref to persist across renders without causing re-renders
    const sessionRef = useRef({
        isActive: false,
        startTime: null,
        domain: null,
        ritualCategory: null,
        sensoryType: null,
        practiceFamily: null,
        aliveSignalCount: 0,
        pauseCount: 0,
        pauseTotalMs: 0,
        pauseStartTime: null,
        switchCount: 0,
    });

    // Handle visibility change for backgrounded detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && sessionRef.current.isActive) {
                // App went to background — could trigger 'backgrounded' exit
                // For now, just note the time (Phase 1 doesn't auto-end on background)
                sessionRef.current.backgroundedAt = performance.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    /**
     * Start a new session
     * @param {string} domain - e.g., 'breathwork', 'visualization'
     * @param {string} [ritualCategory] - e.g., 'grounding', 'devotional'
     * @param {string} [sensoryType] - e.g., 'bodyScan', 'bhakti'
     */
    const startSession = useCallback((domain, ritualCategory = null, sensoryType = null) => {
        const practiceFamily = getPracticeFamily({ domain, ritualCategory, sensoryType });

        sessionRef.current = {
            isActive: true,
            startTime: performance.now(),
            domain,
            ritualCategory,
            sensoryType,
            practiceFamily,
            aliveSignalCount: 0,
            pauseCount: 0,
            pauseTotalMs: 0,
            pauseStartTime: null,
            switchCount: 0,
            backgroundedAt: null,
        };

        // Log for DevPanel debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('[Instrumentation] Session started:', {
                domain,
                ritualCategory,
                sensoryType,
                practiceFamily,
            });
        }
    }, []);

    /**
     * Record an alive signal (any intentional user interaction)
     * Includes: taps, adjustments, screen touches, button presses
     */
    const recordAliveSignal = useCallback(() => {
        if (!sessionRef.current.isActive) return;
        sessionRef.current.aliveSignalCount += 1;
    }, []);

    /**
     * Record a pause event
     * @param {boolean} isPaused - Whether the session is now paused
     */
    const recordPause = useCallback((isPaused) => {
        if (!sessionRef.current.isActive) return;

        if (isPaused) {
            // Starting a pause
            sessionRef.current.pauseCount += 1;
            sessionRef.current.pauseStartTime = performance.now();
        } else if (sessionRef.current.pauseStartTime !== null) {
            // Ending a pause
            const pauseDuration = performance.now() - sessionRef.current.pauseStartTime;
            sessionRef.current.pauseTotalMs += pauseDuration;
            sessionRef.current.pauseStartTime = null;
        }
    }, []);

    /**
     * Record a switch event (step/stage navigation within same practice)
     * Note: Switching between different practices should end session, not call this
     */
    const recordSwitch = useCallback(() => {
        if (!sessionRef.current.isActive) return;
        sessionRef.current.switchCount += 1;
    }, []);

    /**
     * End the session and return instrumentation data
     * @param {'completed' | 'abandoned' | 'backgrounded' | 'system_kill'} exitType
     * @returns {Object} Session instrumentation data
     */
    const endSession = useCallback((exitType = 'completed') => {
        if (!sessionRef.current.isActive) {
            return null;
        }

        const endTime = performance.now();
        const session = sessionRef.current;

        // If currently paused, add remaining pause time
        if (session.pauseStartTime !== null) {
            session.pauseTotalMs += endTime - session.pauseStartTime;
        }

        const instrumentation = {
            start_time: session.startTime,
            end_time: endTime,
            duration_ms: endTime - session.startTime,
            exit_type: exitType,
            practice_family: session.practiceFamily,
            alive_signal_count: session.aliveSignalCount,
            pause_count: session.pauseCount,
            pause_total_ms: Math.round(session.pauseTotalMs),
            switch_count: session.switchCount,
        };

        // Log for DevPanel debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('[Instrumentation] Session ended:', instrumentation);
        }

        // Reset session state
        sessionRef.current = {
            isActive: false,
            startTime: null,
            domain: null,
            ritualCategory: null,
            sensoryType: null,
            practiceFamily: null,
            aliveSignalCount: 0,
            pauseCount: 0,
            pauseTotalMs: 0,
            pauseStartTime: null,
            switchCount: 0,
        };

        return instrumentation;
    }, []);

    /**
     * Get current session state (for debugging/DevPanel)
     */
    const getSessionState = useCallback(() => {
        return { ...sessionRef.current };
    }, []);

    return {
        startSession,
        recordAliveSignal,
        recordPause,
        recordSwitch,
        endSession,
        getSessionState,
    };
}
