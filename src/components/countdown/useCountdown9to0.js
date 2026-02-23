// src/components/countdown/useCountdown9to0.js
import { useState, useEffect, useRef } from 'react';

export default function useCountdown9to0({ start = 9, end = 0, intervalMs = 1000, enabled = true } = {}) {
  const [value, setValue] = useState(start);
  const timerRef = useRef(null);

  useEffect(() => {
    setValue(start);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) return;

    const tick = (v) => {
      if (v <= end) return;
      timerRef.current = setTimeout(() => {
        setValue((prev) => {
          const next = Math.max(end, prev - 1);
          tick(next);
          return next;
        });
      }, intervalMs);
    };

    tick(start);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [start, end, intervalMs, enabled]);

  return value;
}
