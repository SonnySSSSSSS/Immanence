// src/components/EmotionConfig.jsx
// Configuration panel for Emotion practice mode
// Emotion mode selector and prompt style (minimal vs guided)

import React from 'react';
import { EMOTION_PRACTICES } from '../data/emotionPractices.js';

// Emotion modes in canonical order
// eslint-disable-next-line react-refresh/only-export-components
export const EMOTION_MODES = [
  { id: 'discomfort', label: 'Discomfort' },
  { id: 'fear', label: 'Fear' },
  { id: 'pleasure', label: 'Pleasure' },
  { id: 'neutrality', label: 'Neutrality' },
  { id: 'care', label: 'Care' },
  { id: 'compassion', label: 'Compassion' },
  { id: 'notknowing', label: 'Not Knowing' },
];

// Prompt modes
// eslint-disable-next-line react-refresh/only-export-components
export const PROMPT_MODES = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'guided', label: 'Guided' },
];

export function EmotionConfig({
  mode = 'discomfort',
  setMode,
  promptMode = 'minimal',
  setPromptMode,
  isLight = false,
}) {
  // Light-mode-aware text colors
  const textColors = {
    primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.7)',
    secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.55)',
    muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.45)',
    description: isLight ? '#6B5E4A' : 'rgba(253,251,245,0.5)',
  };

  const currentPractice = EMOTION_PRACTICES[mode];
  const frameText = currentPractice?.oneLineFrame || 'Hold space for what arises.';

  return (
    <div className="emotion-config flex flex-col gap-6">
      {/* Emotion Mode Selector */}
      <div>
        <div
          className="grid grid-cols-2 gap-2"
          data-tutorial="awareness-emotion-modes"
          style={{
            maxWidth: '100%',
          }}
        >
          {EMOTION_MODES.map((emotionMode) => {
            const isActive = mode === emotionMode.id;
            return (
              <button
                key={emotionMode.id}
                onClick={() => setMode?.(emotionMode.id)}
                className="rounded-lg px-3 py-3 transition-all duration-300 text-center group hover:scale-105 active:scale-95"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-wide)',
                  background: isActive
                    ? isLight
                      ? 'rgba(212, 175, 55, 0.15)'
                      : 'linear-gradient(135deg, rgba(212, 175, 55, 0.45) 0%, rgba(212, 175, 55, 0.2) 100%)'
                    : isLight
                      ? 'rgba(0,0,0,0.2)'
                      : 'linear-gradient(135deg, rgba(40, 50, 60, 0.4) 0%, rgba(10, 15, 25, 0.6) 100%)',
                  border: isActive
                    ? `1px solid ${isLight ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.8)'}`
                    : `1px solid ${isLight ? 'rgba(255,255,255,0.1)' : 'rgba(100, 120, 140, 0.25)'}`,
                  color: isActive ? 'rgba(212, 175, 55, 1)' : textColors.secondary,
                  cursor: 'pointer',
                  boxShadow: (isActive
                    ? (isLight
                      ? 'inset 0 0 12px rgba(212, 175, 55, 0.1), 0 0 20px rgba(212, 175, 55, 0.15)'
                      : 'inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.5), 0 0 40px rgba(212, 175, 55, 0.35), 0 10px 30px rgba(0,0,0,0.6), 0 -4px 12px rgba(212, 175, 55, 0.25), 0 2px 4px rgba(0,0,0,0.4)')
                    : (isLight
                      ? 'none'
                      : 'inset 0 1px 2px rgba(100, 150, 160, 0.1), 0 6px 18px rgba(0,0,0,0.35), 0 -2px 6px rgba(0,0,0,0.2)')),
                  transformOrigin: 'center',
                }}
              >
                {emotionMode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Text */}
      {currentPractice && (
        <div
          className="rounded-lg p-3"
          data-tutorial="awareness-emotion-frame"
          style={{
            background: isLight ? 'rgba(0,0,0,0.2)' : 'linear-gradient(180deg, rgba(20, 35, 45, 0.4) 0%, rgba(8, 15, 22, 0.5) 100%)',
            border: isLight ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(78, 214, 226, 0.12)',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontStyle: 'italic',
            color: textColors.description,
            textAlign: 'center',
            lineHeight: '1.6',
            boxShadow: isLight ? 'none' : 'inset 0 1px 0 rgba(168, 241, 248, 0.04), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          "{frameText}"
        </div>
      )}

      {/* Prompt Mode Selector */}
      <div>
        <div className="flex gap-2 justify-center" data-tutorial="awareness-emotion-prompts">
          {PROMPT_MODES.map((pMode) => {
            const isActive = promptMode === pMode.id;
            return (
              <button
                key={pMode.id}
                onClick={() => setPromptMode?.(pMode.id)}
                className="rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-wide)',
                  background: isActive
                    ? isLight
                      ? 'rgba(212, 175, 55, 0.15)'
                      : 'linear-gradient(135deg, rgba(212, 175, 55, 0.45) 0%, rgba(212, 175, 55, 0.2) 100%)'
                    : isLight
                      ? 'rgba(0,0,0,0.2)'
                      : 'linear-gradient(135deg, rgba(40, 50, 60, 0.4) 0%, rgba(10, 15, 25, 0.6) 100%)',
                  border: isActive
                    ? `1px solid ${isLight ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.8)'}`
                    : `1px solid ${isLight ? 'rgba(255,255,255,0.1)' : 'rgba(100, 120, 140, 0.25)'}`,
                  color: isActive ? 'rgba(212, 175, 55, 1)' : textColors.secondary,
                  cursor: 'pointer',
                  boxShadow: (isActive
                    ? (isLight
                      ? 'inset 0 0 12px rgba(212, 175, 55, 0.1), 0 0 20px rgba(212, 175, 55, 0.15)'
                      : 'inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.5), 0 0 40px rgba(212, 175, 55, 0.35), 0 10px 30px rgba(0,0,0,0.6), 0 -4px 12px rgba(212, 175, 55, 0.25), 0 2px 4px rgba(0,0,0,0.4)')
                    : (isLight
                      ? 'none'
                      : 'inset 0 1px 2px rgba(100, 150, 160, 0.1), 0 6px 18px rgba(0,0,0,0.35), 0 -2px 6px rgba(0,0,0,0.2)')),
                  transformOrigin: 'center',
                }}
              >
                {pMode.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
