// src/components/BreathWaveVisualization.jsx
// Clean SVG wave visualization with accent-colored stroke and glow
// Represents breath cycles with smooth bezier curves

import React from 'react';

export function BreathWaveVisualization({ className, style }) {
  // Generate smooth wave path with 2.5-3 peaks
  const wavePath = "M 0,40 Q 15,15 30,40 T 60,40 T 90,40 T 120,40 T 150,40 T 180,40 T 210,40 T 240,40 T 270,40 T 300,40";
  
  return (
    <div 
      className={className}
      style={{ 
        width: '100%', 
        maxWidth: '520px',
        margin: '0 auto',
        marginBottom: '24px',
        ...style 
      }}
    >
      <svg 
        viewBox="0 0 300 80" 
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          width: '100%', 
          height: '80px',
          overflow: 'visible'
        }}
      >
        <defs>
          {/* Accent-colored glow filter */}
          <filter id="wave-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feFlood floodColor="var(--accent-primary)" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Main wave path */}
        <path
          d={wavePath}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#wave-glow)"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
