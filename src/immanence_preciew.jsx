import React, { useState } from 'react';

// Preview of the Immanence OS redesigned Practice panel

const PRACTICES = ["Breathing", "Meditation", "Yoga", "Visualization"];
const DURATIONS = [5, 10, 15, 20];
const PRESETS = ["Box", "4-7-8", "Kumbhaka"];

export default function ImmanencePreview() {
  const [practice, setPractice] = useState("Breathing");
  const [duration, setDuration] = useState(10);
  const [preset, setPreset] = useState("Box");
  const [accuracyView, setAccuracyView] = useState("pulse");

  return (
    <div 
      className="min-h-screen p-6 flex flex-col items-center justify-start"
      style={{
        background: 'linear-gradient(180deg, #050508 0%, #0a0a12 50%, #050508 100%)',
        fontFamily: 'Georgia, serif'
      }}
    >
      {/* Simulated Avatar */}
      <div className="relative w-48 h-48 mb-6">
        {/* Outer glow */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(253,224,71,0.15) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)',
            filter: 'blur(20px)'
          }}
        />
        {/* Ring simulation */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{
            border: '1px solid rgba(253,224,71,0.3)',
            boxShadow: '0 0 30px rgba(251,191,36,0.2), inset 0 0 30px rgba(253,224,71,0.1)'
          }}
        />
        <div 
          className="absolute inset-8 rounded-full"
          style={{
            border: '1px solid rgba(253,224,71,0.25)',
          }}
        />
        <div 
          className="absolute inset-12 rounded-full"
          style={{
            border: '1px solid rgba(253,224,71,0.2)',
          }}
        />
        {/* Core */}
        <div 
          className="absolute inset-16 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(253,224,71,0.4) 0%, rgba(251,191,36,0.1) 70%)',
            boxShadow: '0 0 40px rgba(251,191,36,0.3)'
          }}
        >
          <span style={{ color: 'rgba(253,251,245,0.9)', fontSize: '10px', letterSpacing: '0.2em' }}>✦</span>
        </div>
        {/* Label */}
        <div 
          className="absolute left-full ml-4 top-1/2 -translate-y-1/2"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            letterSpacing: '0.25em',
            color: 'rgba(253,251,245,0.85)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
        >
          Practice
        </div>
      </div>

      {/* Metrics line */}
      <div 
        className="mb-8 text-center"
        style={{ 
          fontSize: '10px', 
          color: 'rgba(253,251,245,0.5)',
          letterSpacing: '0.05em'
        }}
      >
        acc 0 (loose) · wk 0 (sporadic) · phase foundation
      </div>

      {/* ═══════════════════════════════════════════════════════
          MAIN PANEL
          ═══════════════════════════════════════════════════════ */}
      <div 
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(22,22,37,0.95) 0%, rgba(15,15,26,0.98) 100%)',
          border: '1px solid rgba(253,224,71,0.12)',
          boxShadow: '0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        {/* Top glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(253,224,71,0.06) 0%, transparent 70%)'
          }}
        />
        
        {/* Corner ornaments */}
        <div 
          className="absolute top-3 left-4"
          style={{ color: 'rgba(245,158,11,0.4)', fontSize: '6px' }}
        >◆</div>
        <div 
          className="absolute top-3 right-4"
          style={{ color: 'rgba(245,158,11,0.4)', fontSize: '6px' }}
        >◆</div>

        <div className="relative px-5 py-5">
          {/* ─── Row 1: Practice + Duration ─── */}
          <div className="flex items-start justify-between gap-4 mb-6">
            {/* Practice selector */}
            <div className="flex-1">
              <div 
                className="mb-2"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '9px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(253,251,245,0.4)'
                }}
              >
                Practice
              </div>
              <div 
                className="flex gap-0.5 p-1 rounded-full"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(253,224,71,0.06)'
                }}
              >
                {PRACTICES.map((name) => (
                  <button
                    key={name}
                    onClick={() => setPractice(name)}
                    className="rounded-full px-3 py-1.5 transition-all duration-200"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      background: practice === name 
                        ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)'
                        : 'transparent',
                      color: practice === name ? '#050508' : 'rgba(253,251,245,0.4)',
                      boxShadow: practice === name ? '0 0 12px rgba(251,191,36,0.15)' : 'none'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div 
                className="mb-2"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '9px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(253,251,245,0.4)'
                }}
              >
                Duration
              </div>
              <div className="flex gap-1">
                {DURATIONS.map((min) => (
                  <button
                    key={min}
                    onClick={() => setDuration(min)}
                    className="rounded-full px-2 py-1 transition-all duration-200"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '8px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: `1px solid ${duration === min ? 'rgba(253,224,71,0.5)' : 'rgba(253,224,71,0.08)'}`,
                      color: duration === min ? '#fcd34d' : 'rgba(253,251,245,0.4)',
                      boxShadow: duration === min ? '0 0 12px rgba(251,191,36,0.15)' : 'none'
                    }}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Row 2: Timer + Button ─── */}
          <div className="flex items-center justify-between mb-6">
            <div 
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '40px',
                fontWeight: 400,
                letterSpacing: '0.2em',
                color: 'rgba(253,251,245,0.92)',
                textShadow: '0 0 32px rgba(253,224,71,0.2)'
              }}
            >
              10:00
            </div>
            
            <button
              className="rounded-full px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                color: '#050508',
                border: 'none',
                boxShadow: '0 0 24px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}
            >
              Begin
            </button>
          </div>

          {/* ─── Divider ─── */}
          <div className="relative my-5">
            <div 
              style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(253,224,71,0.15) 20%, rgba(253,224,71,0.35) 50%, rgba(253,224,71,0.15) 80%, transparent 100%)'
              }}
            />
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2"
              style={{ 
                fontSize: '8px', 
                color: 'rgba(245,158,11,0.7)',
                background: 'rgba(15,15,26,1)'
              }}
            >
              ✦
            </div>
          </div>

          {/* ─── Pattern Section ─── */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div 
                className="mb-1"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '9px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(253,251,245,0.4)'
                }}
              >
                Pattern
              </div>
              <div 
                style={{ 
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
                  color: 'rgba(253,251,245,0.7)',
                  letterSpacing: '0.02em'
                }}
              >
                4s in · 4s hold · 4s out · 4s hold
              </div>
            </div>
            <div className="flex gap-2">
              {PRESETS.map((name) => (
                <button
                  key={name}
                  onClick={() => setPreset(name)}
                  className="rounded-full px-2.5 py-1 transition-all duration-200"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '8px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    border: `1px solid ${preset === name ? 'rgba(253,224,71,0.5)' : 'rgba(253,224,71,0.08)'}`,
                    color: preset === name ? '#fcd34d' : 'rgba(253,251,245,0.4)',
                    boxShadow: preset === name ? '0 0 12px rgba(251,191,36,0.15)' : 'none'
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Input Fields ─── */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {["Inhale", "Hold", "Exhale", "Hold"].map((label, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label 
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '8px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'rgba(253,251,245,0.4)'
                  }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  defaultValue="4"
                  className="text-center rounded-xl px-2 py-2 outline-none transition-all duration-200"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(253,224,71,0.08)',
                    color: 'rgba(253,251,245,0.9)'
                  }}
                />
              </div>
            ))}
          </div>

          {/* ─── Another Divider ─── */}
          <div className="relative my-5">
            <div 
              style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(253,224,71,0.15) 20%, rgba(253,224,71,0.35) 50%, rgba(253,224,71,0.15) 80%, transparent 100%)'
              }}
            />
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2"
              style={{ 
                fontSize: '8px', 
                color: 'rgba(245,158,11,0.7)',
                background: 'rgba(15,15,26,1)'
              }}
            >
              ✦
            </div>
          </div>

          {/* ─── Tap Target ─── */}
          <div 
            className="relative flex items-center justify-center py-4 rounded-xl mb-4 cursor-pointer transition-all duration-200 hover:border-opacity-100"
            style={{
              background: 'linear-gradient(180deg, rgba(253,224,71,0.02) 0%, rgba(253,224,71,0.01) 100%)',
              border: '1px solid rgba(253,224,71,0.08)'
            }}
          >
            <span 
              style={{ 
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                color: 'rgba(253,251,245,0.6)',
                letterSpacing: '0.03em'
              }}
            >
              Tap at the peak of each breath
            </span>
          </div>

          {/* ─── Resonance Toggle ─── */}
          <div className="flex items-center justify-between mb-3">
            <span 
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '9px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(253,251,245,0.4)'
              }}
            >
              Resonance
            </span>
            <div 
              className="flex gap-0.5 p-0.5 rounded-full"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(253,224,71,0.06)'
              }}
            >
              {["pulse", "petals"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAccuracyView(mode)}
                  className="rounded-full px-2.5 py-1 transition-all duration-200"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '8px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: accuracyView === mode 
                      ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)'
                      : 'transparent',
                    color: accuracyView === mode ? '#050508' : 'rgba(253,251,245,0.4)'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Accuracy Visual ─── */}
          <div className="flex justify-center mb-4">
            <div className="relative w-28 h-28">
              <div 
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(253,224,71,0.15)' }}
              />
              <div 
                className="absolute inset-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(253,224,71,0.08) 70%, transparent 100%)',
                  animation: 'pulse 4s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute inset-10 rounded-full"
                style={{
                  border: '1px solid rgba(253,224,71,0.25)',
                  background: 'rgba(253,224,71,0.03)'
                }}
              />
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div 
            className="flex items-center justify-between pt-4"
            style={{ borderTop: '1px solid rgba(253,224,71,0.08)' }}
          >
            <span 
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '8px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(253,251,245,0.2)'
              }}
            >
              Breathing · 10m
            </span>
            <span style={{ fontSize: '6px', color: 'rgba(245,158,11,0.4)' }}>✦</span>
            <span 
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '8px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(253,251,245,0.2)'
              }}
            >
              Immanence OS
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}