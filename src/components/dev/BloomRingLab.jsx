// src/components/dev/BloomRingLab.jsx
// Phase 2: Stage-aware presets + particle trail prototype
// Control IA: preset chips, stage chips, collapsible advanced/expert/trail tiers

import { useState, useRef, useEffect } from 'react';
import BloomRingRenderer from '../bloomRing/BloomRingRenderer.jsx';

// ─── Stage accent colors (local to lab, portable later) ──────────────────────
const STAGE_ACCENTS = {
  Seedling: { color: '#588B7A', secondary: '#22c55e' },
  Ember:    { color: '#f97316', secondary: '#ea580c' },
  Flame:    { color: '#fcd34d', secondary: '#f59e0b' },
  Beacon:   { color: '#22d3ee', secondary: '#06b6d4' },
  Stellar:  { color: '#a78bfa', secondary: '#8b5cf6' },
};

// ─── Preset bundles ───────────────────────────────────────────────────────────
// Each preset sets a coherent bundle across bloom/rays/ring/trail
const PRESET_BUNDLES = {
  basic: {
    label: 'Basic',
    bloomStrength: 2.0,   bloomRadius: 0.40,  bloomThreshold: 0.30,
    breathSpeed:   0.8,
    streakStrength: 0.0,  streakThreshold: 0.85, streakLength: 0.65, streakAngle: 0,
    rayEnabled: false,
    rayExposure: 0.15, rayWeight: 0.5, rayDecay: 0.95, raySamples: 50, rayDensity: 0.6, rayClampMax: 0.75,
    raySunY: 0.45, raySunZ: -2.0, raySunRadius: 0.10,
    occluderEnabled: false, occluderPattern: 'cross', occluderScale: 1.2, occluderDepthOffset: -1.5,
    trailEnabled: false, trailIntensity: 0.8, trailLength: 40, trailSpread: 0.04, trailSpeed: 0.6, trailSparkle: 0.3,
  },
  soft: {
    label: 'Soft',
    bloomStrength: 1.2,   bloomRadius: 0.60,  bloomThreshold: 0.50,
    breathSpeed:   0.6,
    streakStrength: 0.0,  streakThreshold: 0.85, streakLength: 0.65, streakAngle: 0,
    rayEnabled: false,
    rayExposure: 0.10, rayWeight: 0.4, rayDecay: 0.93, raySamples: 40, rayDensity: 0.5, rayClampMax: 0.6,
    raySunY: 0.45, raySunZ: -2.0, raySunRadius: 0.10,
    occluderEnabled: false, occluderPattern: 'cross', occluderScale: 1.2, occluderDepthOffset: -1.5,
    trailEnabled: false, trailIntensity: 0.5, trailLength: 30, trailSpread: 0.02, trailSpeed: 0.4, trailSparkle: 0.1,
  },
  radiant: {
    label: 'Radiant',
    bloomStrength: 2.4,   bloomRadius: 0.55,  bloomThreshold: 0.28,
    breathSpeed:   0.9,
    streakStrength: 0.30, streakThreshold: 0.85, streakLength: 0.65, streakAngle: 0,
    rayEnabled: true,
    rayExposure: 0.15, rayWeight: 0.5, rayDecay: 0.95, raySamples: 50, rayDensity: 0.6, rayClampMax: 0.75,
    raySunY: 0.45, raySunZ: -2.0, raySunRadius: 0.10,
    occluderEnabled: true, occluderPattern: 'cross', occluderScale: 1.2, occluderDepthOffset: -1.5,
    trailEnabled: true, trailIntensity: 0.8, trailLength: 50, trailSpread: 0.04, trailSpeed: 0.6, trailSparkle: 0.3,
  },
  cinematic: {
    label: 'Cinematic',
    bloomStrength: 2.8,   bloomRadius: 0.60,  bloomThreshold: 0.25,
    breathSpeed:   1.0,
    streakStrength: 0.50, streakThreshold: 0.82, streakLength: 0.70, streakAngle: 0,
    rayEnabled: true,
    rayExposure: 0.18, rayWeight: 0.6, rayDecay: 0.96, raySamples: 60, rayDensity: 0.7, rayClampMax: 0.80,
    raySunY: 0.45, raySunZ: -2.0, raySunRadius: 0.12,
    occluderEnabled: true, occluderPattern: 'cross', occluderScale: 1.3, occluderDepthOffset: -1.5,
    trailEnabled: true, trailIntensity: 1.2, trailLength: 70, trailSpread: 0.06, trailSpeed: 0.8, trailSparkle: 0.5,
  },
};

const PRIMARY_PRESETS = ['basic', 'soft', 'radiant', 'cinematic'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ControlRow({ label, min, max, step, value, onChange, format, isLight }) {
  const fmt = format || ((v) => v.toFixed(2));
  const labelColor = isLight ? 'rgba(60,50,40,0.6)' : 'rgba(255,255,255,0.6)';
  const valueColor = isLight ? 'rgba(60,50,40,0.45)' : 'rgba(255,255,255,0.45)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ minWidth: '92px', fontSize: '11px', color: labelColor, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, minWidth: 0, accentColor: '#f59e0b' }}
      />
      <span style={{
        width: '38px', textAlign: 'right', fontFamily: 'monospace',
        fontSize: '11px', color: valueColor, flexShrink: 0
      }}>
        {fmt(value)}
      </span>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, isLight }) {
  const labelColor = isLight ? 'rgba(60,50,40,0.6)' : 'rgba(255,255,255,0.6)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '11px', color: labelColor }}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#f59e0b', width: '14px', height: '14px' }}
      />
    </div>
  );
}

function SelectRow({ label, value, onChange, options, isLight }) {
  const labelColor = isLight ? 'rgba(60,50,40,0.6)' : 'rgba(255,255,255,0.6)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: labelColor, flexShrink: 0 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: '11px', flex: 1,
          background: isLight ? 'rgba(255,255,255,0.9)' : '#0a0a12',
          border: isLight ? '1px solid rgba(180,155,110,0.3)' : '1px solid rgba(255,255,255,0.2)',
          color: isLight ? 'rgba(60,50,40,0.95)' : 'white',
          borderRadius: '4px', padding: '2px 4px',
          colorScheme: isLight ? 'light' : 'dark'
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionHeader({ label, open, onToggle, isLight }) {
  const color = isLight ? 'rgba(60,50,40,0.5)' : 'rgba(255,255,255,0.45)';
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 0', color
      }}
    >
      <span style={{ fontSize: '9px', fontFamily: 'monospace' }}>{open ? '▾' : '▸'}</span>
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{
        flex: 1, height: '1px',
        background: isLight ? 'rgba(180,155,110,0.2)' : 'rgba(255,255,255,0.1)',
        marginLeft: '4px'
      }} />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BloomRingLab({ isLight = false }) {
  // Preset + Stage
  const [selectedPreset, setSelectedPreset] = useState('basic');
  const [selectedStage, setSelectedStage] = useState('Flame');

  // Primary controls (always visible)
  const [bloomStrength, setBloomStrength] = useState(2.0);
  const [breathSpeed,   setBreathSpeed]   = useState(0.8);

  // Advanced: bloom shape
  const [bloomRadius,    setBloomRadius]    = useState(0.40);
  const [bloomThreshold, setBloomThreshold] = useState(0.30);

  // Advanced: ring layering
  const [streakStrength,   setStreakStrength]   = useState(0.0);
  const [streakThreshold,  setStreakThreshold]  = useState(0.85);
  const [streakLength,     setStreakLength]     = useState(0.65);
  const [streakAngle,      setStreakAngle]      = useState(0);

  // Trail controls
  const [trailEnabled,   setTrailEnabled]   = useState(false);
  const [trailIntensity, setTrailIntensity] = useState(0.8);
  const [trailLength,    setTrailLength]    = useState(40);
  const [trailSpread,    setTrailSpread]    = useState(0.04);
  const [trailSpeed,     setTrailSpeed]     = useState(0.6);
  const [trailSparkle,   setTrailSparkle]   = useState(0.3);

  // Expert: GodRays
  const [rayEnabled,  setRayEnabled]  = useState(false);
  const [rayExposure, setRayExposure] = useState(0.15);
  const [rayWeight,   setRayWeight]   = useState(0.5);
  const [rayDecay,    setRayDecay]    = useState(0.95);
  const [raySamples,  setRaySamples]  = useState(50);
  const [rayDensity,  setRayDensity]  = useState(0.6);
  const [rayClampMax, setRayClampMax] = useState(0.75);

  // Expert: Sun proxy
  const [raySunY,      setRaySunY]      = useState(0.45);
  const [raySunZ,      setRaySunZ]      = useState(-2.0);
  const [raySunRadius, setRaySunRadius] = useState(0.10);

  // Expert: Occluders
  const [occluderEnabled,     setOccluderEnabled]     = useState(false);
  const [occluderPattern,     setOccluderPattern]     = useState('cross');
  const [occluderScale,       setOccluderScale]       = useState(1.2);
  const [occluderDepthOffset, setOccluderDepthOffset] = useState(-1.5);
  const [debugOccluders,      setDebugOccluders]      = useState(false);

  // Section collapse state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [trailOpen,    setTrailOpen]    = useState(false);
  const [expertOpen,   setExpertOpen]   = useState(false);

  // Phase Sim state — default false so lab opens with live sine animation.
  // Enable to lock into a snapshot phase for phase language tuning.
  const [simEnabled,       setSimEnabled]       = useState(false);
  const [simPhase,         setSimPhase]         = useState('inhale');
  const [simPhaseProgress, setSimPhaseProgress] = useState(0.0);
  const [phaseSimOpen,     setPhaseSimOpen]     = useState(true);

  // Size measurement for Canvas mount gating
  const containerRef = useRef(null);
  const [measuredSize, setMeasuredSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setMeasuredSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Preset application ──────────────────────────────────────────────────────
  const applyPreset = (id) => {
    const p = PRESET_BUNDLES[id];
    if (!p) return;
    setSelectedPreset(id);
    setBloomStrength(p.bloomStrength);
    setBloomRadius(p.bloomRadius);
    setBloomThreshold(p.bloomThreshold);
    setBreathSpeed(p.breathSpeed);
    setStreakStrength(p.streakStrength);
    setStreakThreshold(p.streakThreshold);
    setStreakLength(p.streakLength);
    setStreakAngle(p.streakAngle);
    setRayEnabled(p.rayEnabled);
    setRayExposure(p.rayExposure);
    setRayWeight(p.rayWeight);
    setRayDecay(p.rayDecay);
    setRaySamples(p.raySamples);
    setRayDensity(p.rayDensity);
    setRayClampMax(p.rayClampMax);
    setRaySunY(p.raySunY);
    setRaySunZ(p.raySunZ);
    setRaySunRadius(p.raySunRadius);
    setOccluderEnabled(p.occluderEnabled);
    setOccluderPattern(p.occluderPattern);
    setOccluderScale(p.occluderScale);
    setOccluderDepthOffset(p.occluderDepthOffset);
    setTrailEnabled(p.trailEnabled);
    setTrailIntensity(p.trailIntensity);
    setTrailLength(p.trailLength);
    setTrailSpread(p.trailSpread);
    setTrailSpeed(p.trailSpeed);
    setTrailSparkle(p.trailSparkle);
    // Open relevant sections if features are enabled
    if (p.trailEnabled) setTrailOpen(true);
    if (p.rayEnabled)   setExpertOpen(true);
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const accentColor = STAGE_ACCENTS[selectedStage]?.color || '#ffffff';

  const canvasReady = measuredSize.w >= 50 && measuredSize.h >= 50;

  // Guardrail: keep bloom shape safe at high strength
  const normalizedBloomRadius    = bloomStrength > 2.4 ? Math.max(bloomRadius, 0.45)    : bloomRadius;
  const normalizedBloomThreshold = bloomStrength > 2.4 ? Math.max(bloomThreshold, 0.22) : bloomThreshold;

  // ── Style helpers ────────────────────────────────────────────────────────────
  const dividerStyle = {
    borderTop: `1px solid ${isLight ? 'rgba(180,155,110,0.2)' : 'rgba(255,255,255,0.1)'}`,
    marginTop: '8px', paddingTop: '8px'
  };
  const mutedColor = isLight ? 'rgba(60,50,40,0.45)' : 'rgba(255,255,255,0.4)';

  // Chip styles for presets
  const chipBase = {
    fontSize: '11px', fontWeight: 600, borderRadius: '6px',
    padding: '4px 8px', cursor: 'pointer', border: '1px solid',
    transition: 'all 0.15s ease',
  };
  const chipActive = (accent) => ({
    background: `${accent}22`, borderColor: accent, color: accent,
  });
  const chipInactive = {
    background: 'transparent',
    borderColor: isLight ? 'rgba(180,155,110,0.3)' : 'rgba(255,255,255,0.2)',
    color: isLight ? 'rgba(60,50,40,0.55)' : 'rgba(255,255,255,0.5)',
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Preview Frame ── */}
      <div
        ref={containerRef}
        style={{
          background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,18,0.5)',
          borderRadius: '8px', overflow: 'hidden',
          border: `1px solid ${isLight ? 'rgba(180,155,110,0.2)' : 'rgba(255,255,255,0.1)'}`,
          width: '100%', maxWidth: '300px', height: '300px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {canvasReady ? (
          <BloomRingRenderer
            params={{
              width:          measuredSize.w,
              height:         measuredSize.h,
              bloomStrength,
              bloomRadius:    normalizedBloomRadius,
              bloomThreshold: normalizedBloomThreshold,
              breathSpeed,
              streakStrength,
              streakThreshold,
              streakLength,
              rayEnabled,
              rayExposure,
              rayWeight,
              rayDecay,
              raySamples,
              rayDensity,
              rayClampMax,
              raySunY,
              raySunZ,
              raySunRadius,
              occluderEnabled,
              occluderPattern,
              occluderScale,
              occluderDepthOffset,
              debugOccluders,
              trailEnabled,
              trailIntensity,
              trailLength,
              trailSpread,
              trailSpeed,
              trailSparkle,
              ...(simEnabled
                ? { breathDriver: { phase: simPhase, cycleProgress01: 0, phaseProgress01: simPhaseProgress } }
                : {}),
            }}
            accentColor={accentColor}
            mode="lab"
          />
        ) : (
          <div style={{ fontSize: '10px', color: mutedColor }}>Waiting for layout…</div>
        )}
      </div>

      {/* ── Preset Chips ── */}
      <div>
        <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Preset
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PRIMARY_PRESETS.map((id) => {
            const isActive = selectedPreset === id;
            return (
              <button
                key={id}
                onClick={() => applyPreset(id)}
                style={{
                  ...chipBase,
                  ...(isActive ? chipActive(accentColor) : chipInactive),
                }}
              >
                {PRESET_BUNDLES[id].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stage Chips ── */}
      <div>
        <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Stage
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {Object.entries(STAGE_ACCENTS).map(([stage, { color }]) => {
            const isActive = selectedStage === stage;
            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                style={{
                  ...chipBase,
                  fontSize: '10px', padding: '3px 7px',
                  ...(isActive ? chipActive(color) : chipInactive),
                }}
              >
                {stage}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Primary Controls (always visible) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...dividerStyle }}>
        <ControlRow
          label="Breath Speed"
          min={0.1} max={2.5} step={0.05}
          value={breathSpeed} onChange={setBreathSpeed}
          isLight={isLight}
        />
        <ControlRow
          label="Radiance"
          min={0} max={3} step={0.05}
          value={bloomStrength} onChange={setBloomStrength}
          isLight={isLight}
        />
      </div>

      {/* ── Advanced Section ── */}
      <div style={dividerStyle}>
        <SectionHeader
          label="Advanced"
          open={advancedOpen}
          onToggle={() => setAdvancedOpen(v => !v)}
          isLight={isLight}
          accent={accentColor}
        />
        {advancedOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
            {/* Bloom shape */}
            <div style={{ fontSize: '10px', color: mutedColor, marginBottom: '2px' }}>Bloom</div>
            <ControlRow label="Radius"    min={0} max={1}   step={0.01} value={bloomRadius}    onChange={setBloomRadius}    isLight={isLight} />
            <ControlRow label="Threshold" min={0} max={1}   step={0.01} value={bloomThreshold} onChange={setBloomThreshold} isLight={isLight} />

            {/* Ring layering */}
            <div style={{ fontSize: '10px', color: mutedColor, marginTop: '6px', marginBottom: '2px' }}>Ring / Streak</div>
            <ControlRow label="Core/Shoulder" min={0}  max={2}   step={0.01} value={streakStrength}  onChange={setStreakStrength}  isLight={isLight} />
            <ControlRow label="Streak Length" min={0}  max={1}   step={0.01} value={streakLength}    onChange={setStreakLength}    isLight={isLight} />
            <ControlRow label="Streak Angle"  min={-90} max={90} step={1}    value={streakAngle}     onChange={setStreakAngle}     isLight={isLight} format={(v) => `${v}°`} />
          </div>
        )}
      </div>

      {/* ── Trail Section ── */}
      <div style={dividerStyle}>
        <SectionHeader
          label="Trail"
          open={trailOpen}
          onToggle={() => setTrailOpen(v => !v)}
          isLight={isLight}
          accent={accentColor}
        />
        {trailOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
            <ToggleRow label="Enabled" checked={trailEnabled} onChange={setTrailEnabled} isLight={isLight} />
            <ControlRow label="Intensity" min={0}    max={2}    step={0.05} value={trailIntensity} onChange={setTrailIntensity} isLight={isLight} />
            <ControlRow label="Length"    min={5}    max={80}   step={1}    value={trailLength}    onChange={setTrailLength}    isLight={isLight} format={(v) => `${Math.round(v)}`} />
            <ControlRow label="Spread"    min={0}    max={0.2}  step={0.005} value={trailSpread}   onChange={setTrailSpread}    isLight={isLight} format={(v) => v.toFixed(3)} />
            <ControlRow label="Speed"     min={0.05} max={2.0}  step={0.05}  value={trailSpeed}    onChange={setTrailSpeed}     isLight={isLight} />
            <ControlRow label="Sparkle"   min={0}    max={1}    step={0.05}  value={trailSparkle}  onChange={setTrailSparkle}   isLight={isLight} />
          </div>
        )}
      </div>

      {/* ── Phase Sim Section ── */}
      <div style={dividerStyle}>
        <SectionHeader label="Phase Sim" open={phaseSimOpen} onToggle={() => setPhaseSimOpen(v => !v)} isLight={isLight} />
        {phaseSimOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
            <ToggleRow label="Use Phase Truth" checked={simEnabled} onChange={setSimEnabled} isLight={isLight} />
            {simEnabled && (
              <>
                <SelectRow
                  label="Phase"
                  value={simPhase}
                  onChange={setSimPhase}
                  options={[
                    { value: 'inhale',     label: 'Inhale' },
                    { value: 'holdTop',    label: 'Hold Top' },
                    { value: 'exhale',     label: 'Exhale' },
                    { value: 'holdBottom', label: 'Hold Bottom' },
                  ]}
                  isLight={isLight}
                />
                <ControlRow
                  label="Phase Prog"
                  min={0} max={1} step={0.01}
                  value={simPhaseProgress}
                  onChange={setSimPhaseProgress}
                  isLight={isLight}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Expert Section ── */}
      <div style={dividerStyle}>
        <SectionHeader
          label="Expert"
          open={expertOpen}
          onToggle={() => setExpertOpen(v => !v)}
          isLight={isLight}
          accent={accentColor}
        />
        {expertOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
            {/* God Rays */}
            <ToggleRow label="God Rays" checked={rayEnabled} onChange={setRayEnabled} isLight={isLight} />
            {rayEnabled && (
              <>
                <ControlRow label="Ray Exposure" min={0}   max={1}   step={0.01} value={rayExposure} onChange={setRayExposure} isLight={isLight} />
                <ControlRow label="Ray Weight"   min={0}   max={1}   step={0.05} value={rayWeight}   onChange={setRayWeight}   isLight={isLight} />
                <ControlRow label="Ray Decay"    min={0.8} max={1}   step={0.01} value={rayDecay}    onChange={setRayDecay}    isLight={isLight} />
                <ControlRow label="Ray Samples"  min={20}  max={100} step={5}    value={raySamples}  onChange={setRaySamples}  isLight={isLight} format={(v) => `${Math.round(v)}`} />
                <ControlRow label="Ray Density"  min={0}   max={2}   step={0.05} value={rayDensity}  onChange={setRayDensity}  isLight={isLight} />
                <ControlRow label="Ray ClampMax" min={0.2} max={1}   step={0.05} value={rayClampMax} onChange={setRayClampMax} isLight={isLight} />
              </>
            )}

            {/* Sun Proxy */}
            <div style={{ fontSize: '10px', color: isLight ? 'rgba(60,50,40,0.45)' : 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Sun Proxy
            </div>
            <ControlRow label="Sun Y"      min={0}    max={1}    step={0.01} value={raySunY}      onChange={setRaySunY}      isLight={isLight} />
            <ControlRow label="Sun Z"      min={-3}   max={-0.5} step={0.1}  value={raySunZ}      onChange={setRaySunZ}      isLight={isLight} format={(v) => v.toFixed(1)} />
            <ControlRow label="Sun Radius" min={0.02} max={0.25} step={0.01} value={raySunRadius} onChange={setRaySunRadius} isLight={isLight} />

            {/* Occluders */}
            <div style={{ fontSize: '10px', color: isLight ? 'rgba(60,50,40,0.45)' : 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Occluders
            </div>
            <ToggleRow label="Enabled" checked={occluderEnabled} onChange={setOccluderEnabled} isLight={isLight} />
            <SelectRow
              label="Pattern"
              value={occluderPattern}
              onChange={setOccluderPattern}
              options={[{ value: 'cross', label: 'Cross' }, { value: 'grid', label: 'Grid' }, { value: 'radial', label: 'Radial' }]}
              isLight={isLight}
            />
            <ControlRow label="Scale" min={0.5} max={2.5} step={0.1} value={occluderScale}       onChange={setOccluderScale}       isLight={isLight} format={(v) => v.toFixed(1)} />
            <ControlRow label="Depth" min={-3}  max={-0.5} step={0.1} value={occluderDepthOffset} onChange={setOccluderDepthOffset} isLight={isLight} format={(v) => v.toFixed(1)} />
            <ToggleRow label="Debug Occluders" checked={debugOccluders} onChange={setDebugOccluders} isLight={isLight} />
          </div>
        )}
      </div>

      {/* ── Info footer ── */}
      <div style={{
        fontSize: '10px', borderRadius: '6px', padding: '6px 8px', marginTop: '4px',
        background: isLight ? 'rgba(180,155,110,0.08)' : 'rgba(255,255,255,0.05)',
        color: isLight ? 'rgba(60,50,40,0.45)' : 'rgba(255,255,255,0.35)',
      }}>
        Phase 2 · Stage-aware presets + particle trail prototype.
        Trail layer is bloom-aware and stage-accent driven.
      </div>
    </div>
  );
}
