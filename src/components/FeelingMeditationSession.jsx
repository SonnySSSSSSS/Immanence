// src/components/FeelingMeditationSession.jsx
// Feeling Meditation practice with fixed guidance script
import React, { useState, useEffect } from 'react';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function FeelingMeditationSession({ duration, onStop, onTimeUpdate }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onStop?.();
          return 0;
        }
        onTimeUpdate?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onStop, onTimeUpdate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const guidanceLines = [
    'Set compassion as your target feeling.',
    'Hold it gently. When it fades, return.',
    'At the end, notice what changed.',
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      {/* Title */}
      <div
        className="text-2xl mb-8 font-bold tracking-wide"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-color)',
          textShadow: '0 0 20px var(--accent-30)',
        }}
      >
        Feeling Meditation
      </div>

      {/* Visual Element */}
      <div 
        className="w-32 h-32 rounded-full mb-8 flex items-center justify-center relative"
        style={{
          border: '1px solid var(--accent-20)',
        }}
      >
        <div 
          className="absolute inset-0 rounded-full animate-pulse opacity-20 blur-xl"
          style={{
            background: 'var(--accent-color)',
          }}
        />
        <div 
          className="text-4xl opacity-80"
          style={{
            filter: 'drop-shadow(0 0 8px var(--accent-30))',
          }}
        >
          💚
        </div>
      </div>

      {/* Guidance Lines */}
      <div className="w-full max-w-md space-y-4 mb-8">
        {guidanceLines.map((line, index) => (
          <div
            key={index}
            className="text-center py-3 px-4 rounded-lg"
            style={{
              background: isLight 
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isLight
                ? '1px solid rgba(180, 140, 90, 0.15)'
                : '1px solid var(--accent-15)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: '1.6',
              color: isLight ? '#3c3020' : '#fdfbf5',
              fontStyle: 'italic',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Timer */}
      <div
        className="text-5xl font-bold mb-8 tabular-nums"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-color)',
        }}
      >
        {formatTime(timeLeft)}
      </div>

      {/* Stop Button */}
      <button
        onClick={onStop}
        className="px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all"
        style={{
          background: isLight
            ? 'rgba(60, 50, 35, 0.08)'
            : 'rgba(255, 255, 255, 0.08)',
          border: isLight
            ? '1px solid rgba(60, 50, 35, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          color: isLight ? '#3c3020' : '#fdfbf5',
          fontFamily: 'var(--font-display)',
        }}
      >
        End Session
      </button>

      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
