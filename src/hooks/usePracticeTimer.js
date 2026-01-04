// usePracticeTimer.js
// Manages countdown timer for practice sessions

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing practice session timer
 * @param {number} initialDuration - Initial duration in minutes
 * @param {boolean} isRunning - Whether the timer should be counting down
 * @param {function} onComplete - Callback when timer reaches zero
 */
export function usePracticeTimer(initialDuration = 10, isRunning = false, onComplete = null) {
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const timerRef = useRef(null);

  // Format seconds to MM:SS string
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // Update duration and reset timeLeft
  const updateDuration = useCallback((newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
  }, []);

  // Reset timer to current duration
  const resetTimer = useCallback(() => {
    setTimeLeft(duration * 60);
  }, [duration]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          if (onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, onComplete]);

  return {
    duration,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    setDuration: updateDuration,
    setTimeLeft,
    resetTimer,
    formatTime,
  };
}

export default usePracticeTimer;
