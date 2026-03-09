// src/components/countdown/useCountdown9to0.js
import { useState, useEffect, useRef } from 'react';

const scheduleCountdownReset = (callback) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }
  Promise.resolve().then(callback);
};

export default function useCountdown9to0({ start = 9, end = 0, intervalMs = 1000, enabled = true } = {}) {
  const [value, setValue] = useState(start);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    scheduleCountdownReset(() => {
      if (!cancelled) {
        setValue(start);
      }
    });

    if (!enabled) {
      return () => {
        cancelled = true;
      };
    }

    const tick = (v) => {
      if (cancelled || v <= end) return;
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        setValue((prev) => {
          const next = Math.max(end, prev - 1);
          tick(next);
          return next;
        });
      }, intervalMs);
    };

    tick(start);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [start, end, intervalMs, enabled]);

  return value;
}
