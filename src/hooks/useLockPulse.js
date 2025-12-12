/**
 * useLockPulse.js
 * Golden-ratio lock feedback: visual pulse + haptic ramp
 * 
 * When user "locks" a frequency or completes a session,
 * this creates visceral feedback that imprints on the nervous system:
 * - Visual: 3-second golden-ratio pulse (1:1.618 rhythm)
 * - Haptic: 5-stage vibration pattern matching the pulse
 */

import { useState, useCallback, useRef } from 'react';

const GOLDEN_RATIO = 1.618;
const SHORT_MS = 350;
const LONG_MS = Math.round(SHORT_MS * GOLDEN_RATIO); // ~566ms

/**
 * Hook for triggering golden-ratio lock pulse feedback
 * @returns {{ triggerLockPulse: Function, lockPulseScale: number, lockPulseOpacity: number, isLockPulsing: boolean }}
 */
export function useLockPulse() {
    const [scale, setScale] = useState(1);
    const [opacity, setOpacity] = useState(1);
    const [isPulsing, setIsPulsing] = useState(false);
    const animationRef = useRef(null);

    const triggerLockPulse = useCallback((intensity = 1.0) => {
        if (isPulsing) return; // Prevent overlapping pulses

        setIsPulsing(true);

        // Calculate intensity-scaled values
        const scaleBoost = 0.25 * intensity;
        const smallBoost = 0.18 * intensity;

        // Visual pulse sequence: golden-ratio timing
        const sequence = [
            { scale: 1 + scaleBoost, duration: SHORT_MS },   // Expand
            { scale: 1.0, duration: LONG_MS },                // Contract
            { scale: 1 + smallBoost, duration: SHORT_MS },    // Smaller expand
            { scale: 1.0, duration: LONG_MS },                // Contract
            { scale: 1.0, opacity: 0.7, duration: 600 },      // Gentle fade
            { scale: 1.0, opacity: 1.0, duration: 400 },      // Return
        ];

        let totalDelay = 0;
        sequence.forEach((step, i) => {
            setTimeout(() => {
                setScale(step.scale);
                if (step.opacity !== undefined) {
                    setOpacity(step.opacity);
                }
            }, totalDelay);
            totalDelay += step.duration;
        });

        // End pulse state
        setTimeout(() => {
            setIsPulsing(false);
            setScale(1);
            setOpacity(1);
        }, totalDelay);

        // Haptic feedback (if available)
        triggerHapticRamp();

    }, [isPulsing]);

    return {
        triggerLockPulse,
        lockPulseScale: scale,
        lockPulseOpacity: opacity,
        isLockPulsing: isPulsing,
    };
}

/**
 * Trigger haptic feedback ramp pattern
 * Pattern: short - long - short - long - fade
 */
function triggerHapticRamp() {
    // Check for Vibration API support
    if (!navigator.vibrate) return;

    try {
        // Pattern: [vibrate, pause, vibrate, pause, ...]
        // short-long-short-long-fade matches golden-ratio visual pulse
        navigator.vibrate([
            SHORT_MS,           // Short vibration
            LONG_MS - 50,       // Pause (slightly shorter to sync)
            SHORT_MS,           // Short vibration  
            LONG_MS - 50,       // Pause
            200,                // Final fade buzz
        ]);
    } catch (e) {
        // Haptics not available - fail silently
        console.debug('Haptic feedback unavailable:', e);
    }
}

/**
 * CSS class to apply lock pulse animation manually via CSS
 */
export const LOCK_PULSE_CSS = `
@keyframes goldenRatioPulse {
  0% { transform: scale(1); opacity: 1; }
  12% { transform: scale(1.25); opacity: 1; }
  30% { transform: scale(1.0); opacity: 1; }
  42% { transform: scale(1.18); opacity: 1; }
  60% { transform: scale(1.0); opacity: 1; }
  80% { transform: scale(1.0); opacity: 0.7; }
  100% { transform: scale(1.0); opacity: 1; }
}

.lock-pulse {
  animation: goldenRatioPulse 2.8s ease-out forwards;
}
`;

export default useLockPulse;
