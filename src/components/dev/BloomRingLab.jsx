// src/components/dev/BloomRingLab.jsx
// Phase 2A-2: Breathing Ring Lab with analog bloom + anamorphic streak
// Uses BloomRingCanvas to render the preview
// Includes live control sliders for bloom and streak parameters

import React, { useState, useRef, useEffect } from 'react';
import BloomRingCanvas from './BloomRingCanvas.jsx';

const PRESET_OPTIONS = [
  { id: 'basic', label: 'Basic Bloom', strength: 2.0, radius: 0.4, threshold: 0.3, breathSpeed: 0.8 },
  { id: 'soft', label: 'Soft Glow', strength: 1.2, radius: 0.6, threshold: 0.5, breathSpeed: 0.6 },
  { id: 'intense', label: 'Intense Bloom', strength: 2.8, radius: 0.60, threshold: 0.28, breathSpeed: 1.0 },
];

export function BloomRingLab({ isLight = false }) {
  const [selectedPreset, setSelectedPreset] = useState('basic');
  const [bloomStrength, setBloomStrength] = useState(2.0);
  const [bloomRadius, setBloomRadius] = useState(0.4);
  const [bloomThreshold, setBloomThreshold] = useState(0.3);
  const [breathSpeed, setBreathSpeed] = useState(0.8);
  const [streakStrength, setStreakStrength] = useState(0.20);
  const [streakThreshold, setStreakThreshold] = useState(0.85);
  const [streakLength, setStreakLength] = useState(0.65);
  const [streakAngle, setStreakAngle] = useState(0);

  // GodRays controls (Phase 2C-3)
  const [rayEnabled, setRayEnabled] = useState(true);
  const [rayExposure, setRayExposure] = useState(0.12);
  const [rayWeight, setRayWeight] = useState(0.4);
  const [rayDecay, setRayDecay] = useState(0.93);
  const [raySamples, setRaySamples] = useState(40);
  const [rayDensity, setRayDensity] = useState(0.8);
  const [rayClampMax, setRayClampMax] = useState(1.0);

  // Sun proxy controls (Phase 2C-3: critical for shaft structure)
  const [raySunY, setRaySunY] = useState(0.45);
  const [raySunZ, setRaySunZ] = useState(-2.0);
  const [raySunRadius, setRaySunRadius] = useState(0.08);

  // Occluder controls (Phase 2C-3)
  const [occluderEnabled, setOccluderEnabled] = useState(true);
  const [occluderPattern, setOccluderPattern] = useState('cross'); // 'cross', 'grid', 'radial'
  const [occluderScale, setOccluderScale] = useState(1.2);
  const [occluderDepthOffset, setOccluderDepthOffset] = useState(-1.5);
  const [debugOccluders, setDebugOccluders] = useState(false);

  // Size measurement for Canvas mount gating
  const containerRef = useRef(null);
  const [measuredSize, setMeasuredSize] = useState({ w: 0, h: 0 });

  // ResizeObserver to track container size
  useEffect(() => {
    if (!containerRef.current) return;

    const DEBUG = false;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (DEBUG) console.log('[BloomRingLab] size', width, height);
        setMeasuredSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const preset = PRESET_OPTIONS.find(p => p.id === presetId);
    if (preset) {
      setBloomStrength(preset.strength);
      setBloomRadius(preset.radius);
      setBloomThreshold(preset.threshold);
      setBreathSpeed(preset.breathSpeed);
    }
  };

  const canvasReady = measuredSize.w >= 50 && measuredSize.h >= 50;

  // Guardrail normalization: prevent harsh bloom combinations
  // If strength is high, ensure radius and threshold stay in softer range
  const normalizedBloomRadius = bloomStrength > 2.4
    ? Math.max(bloomRadius, 0.45)
    : bloomRadius;
  const normalizedBloomThreshold = bloomStrength > 2.4
    ? Math.max(bloomThreshold, 0.22)
    : bloomThreshold;

  return (
    <div className="flex flex-col gap-4">
      {/* Preview Frame - Canvas Container */}
      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden border"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 18, 0.5)',
          borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '300px',
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {canvasReady ? (
          <BloomRingCanvas
            width={measuredSize.w}
            height={measuredSize.h}
            isLight={isLight}
            bloomStrength={bloomStrength}
            bloomRadius={normalizedBloomRadius}
            bloomThreshold={normalizedBloomThreshold}
            breathSpeed={breathSpeed}
            streakStrength={streakStrength}
            streakThreshold={streakThreshold}
            streakLength={streakLength}
            streakAngle={streakAngle}
            rayEnabled={rayEnabled}
            rayExposure={rayExposure}
            rayWeight={rayWeight}
            rayDecay={rayDecay}
            raySamples={raySamples}
            rayDensity={rayDensity}
            rayClampMax={rayClampMax}
            raySunY={raySunY}
            raySunZ={raySunZ}
            raySunRadius={raySunRadius}
            occluderEnabled={occluderEnabled}
            occluderPattern={occluderPattern}
            occluderScale={occluderScale}
            occluderDepthOffset={occluderDepthOffset}
            debugOccluders={debugOccluders}
          />
        ) : (
          <div style={{
            fontSize: '10px',
            color: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(255, 255, 255, 0.3)',
          }}>
            Waiting for layout...
          </div>
        )}
      </div>

      {/* Preset Dropdown */}
      <div>
        <label className="text-xs font-semibold block mb-2" style={{
          color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.6)'
        }}>
          Preset
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
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

      {/* Control Sliders */}
      <div className="space-y-3 pt-2 border-t" style={{
        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
      }}>
        {/* Bloom Strength */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Bloom Strength
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {bloomStrength.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={bloomStrength}
            onChange={(e) => setBloomStrength(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Bloom Radius */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Bloom Radius
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {bloomRadius.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bloomRadius}
            onChange={(e) => setBloomRadius(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Bloom Threshold */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Bloom Threshold
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {bloomThreshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bloomThreshold}
            onChange={(e) => setBloomThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Breath Speed */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Breath Speed
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {breathSpeed.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={breathSpeed}
            onChange={(e) => setBreathSpeed(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Streak Strength */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Streak Strength
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {streakStrength.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.01"
            value={streakStrength}
            onChange={(e) => setStreakStrength(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Streak Threshold */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Streak Threshold
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {streakThreshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={streakThreshold}
            onChange={(e) => setStreakThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Streak Length */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Streak Length
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {streakLength.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={streakLength}
            onChange={(e) => setStreakLength(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Streak Angle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Streak Angle
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {streakAngle}°
            </span>
          </div>
          <input
            type="range"
            min="-90"
            max="90"
            step="1"
            value={streakAngle}
            onChange={(e) => setStreakAngle(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Phase 2C-3: GodRays Controls */}
        {/* Ray Enabled Toggle */}
        <div className="pt-3 mt-3 border-t" style={{
          borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              God Rays
            </label>
            <input
              type="checkbox"
              checked={rayEnabled}
              onChange={(e) => setRayEnabled(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
        </div>

        {/* Ray Exposure */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Ray Exposure
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {rayExposure.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.01"
            value={rayExposure}
            onChange={(e) => setRayExposure(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Ray Weight */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Ray Weight
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {rayWeight.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={rayWeight}
            onChange={(e) => setRayWeight(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Ray Decay */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Ray Decay
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {rayDecay.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.0"
            step="0.01"
            value={rayDecay}
            onChange={(e) => setRayDecay(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Ray Samples */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Ray Samples
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {raySamples}
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={raySamples}
            onChange={(e) => setRaySamples(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Ray Density */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Ray Density
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {rayDensity.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.05"
            value={rayDensity}
            onChange={(e) => setRayDensity(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Ray Clamp Max */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Ray Clamp Max
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {rayClampMax.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={rayClampMax}
            onChange={(e) => setRayClampMax(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Sun Proxy Controls */}
        <div className="pt-3 mt-3 border-t" style={{
          borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
        }}>
          <div className="mb-2">
            <label className="text-xs font-semibold block" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Sun Proxy (Emitter)
            </label>
          </div>
        </div>

        {/* Sun Y Position */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Sun Y Position
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {raySunY.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.01"
            value={raySunY}
            onChange={(e) => setRaySunY(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Sun Z Position */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Sun Z Position
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {raySunZ.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="-3.0"
            max="-0.5"
            step="0.1"
            value={raySunZ}
            onChange={(e) => setRaySunZ(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Sun Radius */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Sun Radius
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {raySunRadius.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.25"
            step="0.01"
            value={raySunRadius}
            onChange={(e) => setRaySunRadius(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Occluder Controls */}
        <div className="pt-3 mt-3 border-t" style={{
          borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Occluders
            </label>
            <input
              type="checkbox"
              checked={occluderEnabled}
              onChange={(e) => setOccluderEnabled(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
        </div>

        {/* Occluder Pattern */}
        <div>
          <label className="text-xs text-white/60 block mb-1" style={{
            color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
          }}>
            Pattern
          </label>
          <select
            value={occluderPattern}
            onChange={(e) => setOccluderPattern(e.target.value)}
            className="w-full rounded px-2 py-1.5 text-xs font-medium"
            style={{
              background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
              border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
              colorScheme: isLight ? 'light' : 'dark'
            }}
          >
            <option value="cross">Cross</option>
            <option value="grid">Grid</option>
            <option value="radial">Radial</option>
          </select>
        </div>

        {/* Occluder Scale */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Occluder Scale
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {occluderScale.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={occluderScale}
            onChange={(e) => setOccluderScale(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Occluder Depth Offset */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Occluder Depth
            </label>
            <span className="text-xs text-white/50 font-mono" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {occluderDepthOffset.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="-3.0"
            max="-0.5"
            step="0.1"
            value={occluderDepthOffset}
            onChange={(e) => setOccluderDepthOffset(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Debug Occluders Toggle */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/60" style={{
              color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Debug Occluders
            </label>
            <input
              type="checkbox"
              checked={debugOccluders}
              onChange={(e) => setDebugOccluders(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="text-[10px] rounded-lg p-2" style={{
        background: isLight ? 'rgba(180, 155, 110, 0.08)' : 'rgba(255, 255, 255, 0.05)',
        color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)'
      }}>
        <strong>Phase 2A-2:</strong> Analog bloom + lens-like anamorphic streak (hot-pixel keyed).
      </div>
    </div>
  );
}
