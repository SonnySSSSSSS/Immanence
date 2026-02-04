// src/components/dev/BloomRingLab.jsx
// Phase 0: Breathing Ring Lab scaffold (lazy-loaded, code-split)
// No Three.js/R3F yet - just the container and UI stub
// Will unmount cleanly when DevPanel closes

import React, { useState } from 'react';

const PRESET_OPTIONS = [
  { id: 'basic', label: 'Basic Bloom (placeholder)' },
  { id: 'pulsing', label: 'Pulsing Bloom (placeholder)' },
  { id: 'harmonic', label: 'Harmonic Bloom (placeholder)' },
];

export function BloomRingLab({ isLight = false }) {
  const [selectedPreset, setSelectedPreset] = useState('basic');

  return (
    <div className="flex flex-col gap-4">
      {/* Preview Frame - Fixed size container for Three.js later */}
      <div className="rounded-lg overflow-hidden border" style={{
        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 18, 0.5)',
        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        width: '100%',
        aspectRatio: '1',
        maxWidth: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.3)',
        fontSize: '12px',
      }}>
        <div className="text-center">
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔵</div>
          <div>Preview Frame</div>
          <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6 }}>Canvas will mount here</div>
        </div>
      </div>

      {/* Control Stub */}
      <div>
        <label className="text-xs font-semibold block mb-2" style={{
          color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.6)'
        }}>
          Preset (Placeholder)
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-xs font-medium"
          style={{
            background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
            border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
            color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
            colorScheme: isLight ? 'light' : 'dark'
          }}
        >
          {PRESET_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Info Text */}
      <div className="text-[10px] rounded-lg p-2" style={{
        background: isLight ? 'rgba(180, 155, 110, 0.08)' : 'rgba(255, 255, 255, 0.05)',
        color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)'
      }}>
        <strong>Phase 0:</strong> Scaffold only. Canvas and controls coming in Phase 1.
      </div>
    </div>
  );
}
