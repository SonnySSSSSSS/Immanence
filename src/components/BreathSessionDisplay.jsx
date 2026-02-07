// src/components/BreathSessionDisplay.jsx
// Enhanced Breath Session UI with glassmorphic styling and glowing phase boxes
// Displays: Waveform + Phase Labels + Duration Slider

import React from 'react';
import BreathWaveform from './BreathWaveform.jsx';
import { EmberLightRays } from './EmberLightRays.jsx';

export function BreathSessionDisplay({ pattern, duration }) {
  const { inhale = 4, hold1 = 4, exhale = 4, hold2 = 4 } = pattern || {};

  const phases = [
    { label: 'INHALE', key: 'inhale', value: inhale },
    { label: 'HOLD 1', key: 'hold1', value: hold1 },
    { label: 'EXHALE', key: 'exhale', value: exhale },
    { label: 'HOLD 2', key: 'hold2', value: hold2 },
  ];

  return (
    <div className="breath-session-display">
      {/* Glassmorphic Breath Section Container */}
      <div className="breath-section">
        {/* Ember Light Rays radiating from center */}
        <EmberLightRays />
        
        {/* Header */}
        <div className="breath-header">
          <h2 className="breath-title">BREATH & STILLNESS</h2>
        </div>

        {/* Waveform Container with Pulsing Effect */}
        <div className="waveform-container">
          <BreathWaveform pattern={pattern} cycles={1} showTracer={true} />
        </div>

        {/* Phase Boxes Row */}
        <div className="phase-boxes-grid">
          {phases.map((phase) => (
            <div key={phase.key} className="phase-box">
              <div className="phase-label">{phase.label}</div>
              <div className="phase-value">{phase.value}s</div>
            </div>
          ))}
        </div>

        {/* Duration Info */}
        <div className="breath-duration-info">
          <div className="duration-label">SESSION DURATION</div>
          <div className="duration-time">{duration} min</div>
        </div>
      </div>

      <style>{`
        .breath-session-display {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        /* Main Glassmorphic Container */
        .breath-section {
          background: rgba(20, 20, 35, 0.4);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(251, 146, 60, 0.45);
          border-radius: 32px;
          box-shadow: 
            0 25px 70px rgba(251, 146, 60, 0.35),
            inset 0 0 60px rgba(249, 115, 22, 0.25);
          padding: 2.5rem 3rem;
          position: relative;
          overflow: hidden;
          max-width: 600px;
          width: 100%;
          animation: breath-panel-intro 0.8s ease-out;
        }

        .breath-section::before {
          content: "";
          position: absolute;
          inset: -100px;
          background: radial-gradient(
            circle at 50% 40%,
            rgba(255, 69, 0, 0.45) 0%,
            rgba(255, 140, 0, 0.25) 40%,
            transparent 65%
          );
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 0;
          animation: orb-light-pulse 8s infinite ease-in-out;
        }

        @keyframes orb-light-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .breath-section > * {
          position: relative;
          z-index: 1;
        }

        @keyframes breath-panel-intro {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .breath-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .breath-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ff8c00;
          text-shadow: 0 0 15px rgba(255, 69, 0, 0.8);
          margin: 0;
        }

        /* Waveform Container */
        .waveform-container {
          position: relative;
          width: 100%;
          height: 80px;
          margin-bottom: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 24px;
          border: 1px solid rgba(255, 69, 0, 0.3);
          box-shadow: inset 0 0 30px rgba(255, 69, 0, 0.18);
          overflow: visible;
        }

        .waveform-container::before {
          content: "";
          position: absolute;
          inset: -12px;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 69, 0, 0.25),
            rgba(255, 140, 0, 0.15) 40%,
            transparent 70%
          );
          filter: blur(25px);
          pointer-events: none;
          z-index: 0;
          animation: sacred-breath-glow 8s infinite ease-in-out;
          border-radius: 24px;
        }

        @keyframes sacred-breath-glow {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        .waveform-container > * {
          position: relative;
          z-index: 1;
          width: 100%;
        }

        /* Phase Boxes Grid */
        .phase-boxes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .phase-box {
          background: rgba(255, 69, 0, 0.12);
          border: 1.5px solid rgba(255, 69, 0, 0.55);
          border-radius: 20px;
          padding: 1.2rem 1rem;
          text-align: center;
          box-shadow: 
            0 0 35px rgba(255, 69, 0, 0.65),
            inset 0 0 20px rgba(255, 140, 0, 0.3);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .phase-box::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 0%,
            rgba(255, 69, 0, 0.3),
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .phase-box:hover {
          transform: translateY(-4px) scale(1.15);
          box-shadow: 
            0 0 60px rgba(255, 69, 0, 0.85),
            inset 0 0 25px rgba(255, 140, 0, 0.4),
            0 12px 30px rgba(255, 69, 0, 0.5);
          background: rgba(255, 69, 0, 0.25);
          border-color: rgba(255, 69, 0, 0.75);
        }

        .phase-box:hover::before {
          opacity: 1;
        }

        .phase-label {
          font-family: var(--font-display);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255, 140, 0, 0.75);
          margin-bottom: 0.6rem;
          opacity: 0.85;
          transition: opacity 0.4s ease;
        }

        .phase-box:hover .phase-label {
          opacity: 1;
          text-shadow: 0 0 12px rgba(255, 69, 0, 0.9);
        }

        .phase-value {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: #ff8c00;
          text-shadow: 0 0 12px #ff4500;
        }

        /* Duration Info */
        .breath-duration-info {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 69, 0, 0.3);
        }

        .duration-label {
          font-family: var(--font-display);
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255, 140, 0, 0.65);
          margin-bottom: 0.5rem;
        }

        .duration-time {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: #ff8c00;
          text-shadow: 0 0 12px rgba(255, 69, 0, 0.6);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .breath-section {
            padding: 1.5rem 1.5rem;
            border-radius: 20px;
          }

          .phase-boxes-grid {
            gap: 0.75rem;
          }

          .phase-box {
            padding: 0.8rem 0.6rem;
            border-radius: 14px;
          }

          .phase-label {
            font-size: 7px;
          }

          .phase-value {
            font-size: 14px;
          }

          .breath-title {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
