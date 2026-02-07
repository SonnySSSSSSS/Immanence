import React from 'react';
import { useTempoSyncSessionStore } from '../state/tempoSyncSessionStore.js';

/**
 * TempoSyncSessionPanel - Live display during tempo-synced breath practice
 *
 * Shows:
 * - Current phase (1/3, 2/3, 3/3) with cap percentage
 * - Beat counter (X / Y)
 * - Effective vs max phase durations
 */
export function TempoSyncSessionPanel() {
  const isActive = useTempoSyncSessionStore(s => s.isActive);
  const segmentIndex = useTempoSyncSessionStore(s => s.segmentIndex);
  const segmentCap = useTempoSyncSessionStore(s => s.segmentCap);
  const cycleBeatCount = useTempoSyncSessionStore(s => s.cycleBeatCount);
  const cycleBeatsPerCycle = useTempoSyncSessionStore(s => s.cycleBeatsPerCycle);
  const effectivePhaseDurations = useTempoSyncSessionStore(s => s.effectivePhaseDurations);
  const maxPhaseDurations = useTempoSyncSessionStore(s => s.maxPhaseDurations);

  if (!isActive) return null;

  const phaseLabel = `Phase ${segmentIndex + 1}/3`;
  const capPercent = Math.round(segmentCap * 100);

  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: 'rgba(74, 222, 128, 0.08)',
        borderRadius: '10px',
        border: '1px solid rgba(74, 222, 128, 0.25)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '10px',
        letterSpacing: '0.05em',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header row: Phase + Cap + Beats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--accent-primary)',
              fontSize: '11px',
              letterSpacing: '0.08em',
            }}
          >
            {phaseLabel}
          </span>
          <span
            style={{
              padding: '2px 6px',
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              borderRadius: '4px',
              fontWeight: 600,
              color: 'var(--accent-primary)',
            }}
          >
            {capPercent}%
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: '9px' }}>BEATS</span>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontSize: '11px',
            }}
          >
            {cycleBeatCount}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{cycleBeatsPerCycle}</span>
        </div>
      </div>

      {/* Duration grid: 2x2 for inhale/exhale/holdIn/holdOut */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px 12px',
          fontSize: '9px',
        }}
      >
        <DurationRow
          label="Inhale"
          effective={effectivePhaseDurations.inhale}
          max={maxPhaseDurations.inhale}
        />
        <DurationRow
          label="Exhale"
          effective={effectivePhaseDurations.exhale}
          max={maxPhaseDurations.exhale}
        />
        <DurationRow
          label="Hold In"
          effective={effectivePhaseDurations.holdIn}
          max={maxPhaseDurations.holdIn}
        />
        <DurationRow
          label="Hold Out"
          effective={effectivePhaseDurations.holdOut}
          max={maxPhaseDurations.holdOut}
        />
      </div>
    </div>
  );
}

function DurationRow({ label, effective, max }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 0',
      }}
    >
      <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span>
        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
          {effective.toFixed(1)}s
        </span>
        <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
          / {max.toFixed(1)}s
        </span>
      </span>
    </div>
  );
}
