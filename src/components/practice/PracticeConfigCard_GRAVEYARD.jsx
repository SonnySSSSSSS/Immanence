// PracticeConfigCard.jsx
// Pre-session configuration UI - shows current practice and duration selection

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

const QUICK_DURATIONS = [5, 10, 15, 20, 30];

/**
 * Practice Configuration Card - shows current practice and duration
 * @param {object} props
 * @param {string} props.practice - Currently selected practice type
 * @param {number} props.duration - Currently selected duration in minutes
 * @param {function} props.onPracticeChange - Callback to open practice selection modal
 * @param {function} props.onDurationChange - Callback when duration changes
 * @param {function} props.onStart - Callback when Start button is clicked
 * @param {boolean} props.showChangePracticeButton - Whether to show Change Practice button
 */
export function PracticeConfigCard({
  practice,
  duration,
  onPracticeChange,
  onDurationChange,
  onStart,
  showChangePracticeButton = false,
}) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  return (
    <section className="w-full h-full flex flex-col items-center justify-center pb-24">
      <div className="flex flex-col items-center gap-8">
        {/* Current Practice Display */}
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-mythic)',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Practice
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {practice}
          </div>
          {showChangePracticeButton && (
            <button
              onClick={onPracticeChange}
              className="px-4 py-2 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
              style={{
                background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)',
                color: isLight ? 'var(--light-text-secondary)' : 'var(--text-secondary)',
                border: isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid var(--accent-20)',
              }}
            >
              Change Practice
            </button>
          )}
        </div>

        {/* Duration Selector */}
        <div className="flex flex-col items-center gap-2">
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-mythic)',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Duration
          </div>
          <div className="flex gap-2">
            {QUICK_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => onDurationChange(d)}
                className="w-12 h-12 rounded-full text-sm font-bold transition-all"
                style={{
                  background: duration === d 
                    ? 'var(--accent-color)' 
                    : isLight ? 'rgba(60, 50, 35, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                  color: duration === d 
                    ? '#fff' 
                    : isLight ? 'var(--light-text-secondary)' : 'var(--text-secondary)',
                  border: duration === d 
                    ? '1px solid var(--accent-color)' 
                    : isLight ? '1px solid rgba(60, 50, 35, 0.15)' : '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={!practice}
          className="px-12 py-4 rounded-full text-lg font-bold uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            color: '#050508',
            boxShadow: '0 8px 24px var(--accent-30), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          Start Practice
        </button>
      </div>
    </section>
  );
}

export default PracticeConfigCard;
