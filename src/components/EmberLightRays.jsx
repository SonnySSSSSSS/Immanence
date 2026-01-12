// src/components/EmberLightRays.jsx
// Fiery light rays radiating from the avatar orb with Stage 2 Ember colors

import React from 'react';

export function EmberLightRays() {
  const rays = [
    { angle: 30, length: 180, delay: 0 },
    { angle: 75, length: 200, delay: 0.3 },
    { angle: 120, length: 170, delay: 0.6 },
    { angle: 165, length: 190, delay: 0.9 },
    { angle: 210, length: 175, delay: 1.2 },
    { angle: 255, length: 195, delay: 1.5 },
  ];

  return (
    <div className="ember-light-rays">
      <svg 
        viewBox="0 0 400 400" 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <defs>
          <radialGradient id="ray-gradient-ember">
            <stop offset="0%" stopColor="rgba(255, 69, 0, 0.6)" />
            <stop offset="50%" stopColor="rgba(255, 140, 0, 0.35)" />
            <stop offset="100%" stopColor="rgba(255, 140, 0, 0)" />
          </radialGradient>
          <filter id="ray-glow-ember">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {rays.map((ray, idx) => {
          const x1 = 200;
          const y1 = 200;
          const x2 = 200 + Math.cos((ray.angle * Math.PI) / 180) * ray.length;
          const y2 = 200 + Math.sin((ray.angle * Math.PI) / 180) * ray.length;
          
          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#ray-gradient-ember)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#ray-glow-ember)"
              className="ember-ray"
              style={{
                animationDelay: `${ray.delay}s`,
              }}
            />
          );
        })}
      </svg>

      <style>{`
        .ember-light-rays {
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.7;
        }

        .ember-ray {
          animation: ray-pulse-ember 4s infinite ease-in-out;
          opacity: 0.4;
        }

        @keyframes ray-pulse-ember {
          0%, 100% {
            opacity: 0.3;
            stroke-width: 2;
          }
          50% {
            opacity: 0.7;
            stroke-width: 4;
          }
        }
      `}</style>
    </div>
  );
}
