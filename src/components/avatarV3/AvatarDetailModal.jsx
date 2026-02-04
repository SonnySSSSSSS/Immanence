import React, { useMemo } from 'react';
import { AccessibleModal } from '../AccessibleModal.jsx';
import { MODE_COLORS, MODE_LABELS, STAGE_LABELS, STAGE_MEANINGS, normalizeModeWeights } from './constants.js';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

export function AvatarDetailModal({ isOpen, onClose, stage, modeWeights }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const normalized = useMemo(() => normalizeModeWeights(modeWeights), [modeWeights]);
  const stageKey = (stage || 'seedling').toLowerCase();

  const modes = Object.keys(MODE_LABELS).map((mode) => ({
    id: mode,
    label: MODE_LABELS[mode],
    weight: normalized[mode],
    color: MODE_COLORS[mode],
  }));

  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} ariaLabel="Avatar details">
      <div
        style={{
          background: isLight
            ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,240,230,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(18, 12, 18, 0.98) 0%, rgba(12, 8, 14, 0.98) 100%)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: isLight
            ? '0 10px 40px rgba(0,0,0,0.12)'
            : '0 10px 60px rgba(0,0,0,0.7)',
          color: isLight ? 'rgba(45,40,35,0.96)' : 'rgba(253,251,245,0.95)',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: 0.7,
          marginBottom: '6px',
        }}>
          Current Stage
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          {STAGE_LABELS[stageKey] || STAGE_LABELS.seedling}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          opacity: isLight ? 0.75 : 0.8,
          marginBottom: '20px',
        }}>
          {STAGE_MEANINGS[stageKey] || STAGE_MEANINGS.seedling}
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: 0.6,
          marginBottom: '12px',
        }}>
          Mode Blend
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {modes.map((mode) => (
            <div key={mode.id} style={{ display: 'grid', gap: '6px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                <span>{mode.label}</span>
                <span>{Math.round(mode.weight * 100)}%</span>
              </div>
              <div style={{
                height: '6px',
                borderRadius: '999px',
                background: isLight ? 'rgba(60,50,40,0.12)' : 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(mode.weight * 100)}%`,
                  background: mode.color,
                  opacity: 0.65,
                  borderRadius: '999px',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AccessibleModal>
  );
}
