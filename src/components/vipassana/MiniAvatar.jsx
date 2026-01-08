// src/components/vipassana/MiniAvatar.jsx
// Miniaturized avatar for Vipassana scene - steady presence signal

import React from 'react';
import { OrbCore } from '../avatar/OrbCore';
import { useDisplayModeStore } from '../../state/displayModeStore';

export function MiniAvatar({ stage = 'flame', opacity = 0.3 }) {
    const isLight = useDisplayModeStore((state) => state.colorScheme === 'light');

    // Light mode: use reduced orb avatar
    if (isLight) {
        return (
            <div
                className="fixed top-6 right-6 pointer-events-none z-20"
                style={{ 
                    opacity,
                    width: '96px',
                    height: '96px',
                }}
            >
                <OrbCore isPracticing={false} reduced={true} />
            </div>
        );
    }

    // Dark mode: use existing simple circle design
    // Stage color mapping
    const stageColors = {
        seedling: '#5CB95F',
        ember: '#FF8C3C',
        flame: '#FBBF24',
        beacon: '#60A5FA',
        stellar: '#C084FC',
    };

    const color = stageColors[stage] || stageColors.flame;

    return (
        <div
            className="fixed top-6 right-6 pointer-events-none z-20"
            style={{ opacity }}
        >
            <div
                className="relative"
                style={{
                    width: '48px',
                    height: '48px',
                }}
            >
                {/* Subtle glow */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                        animation: 'avatarPulse 4s ease-in-out infinite',
                    }}
                />

                {/* Avatar circle */}
                <div
                    className="absolute inset-2 rounded-full border"
                    style={{
                        borderColor: `${color}60`,
                        background: `radial-gradient(circle at 40% 40%, ${color}20 0%, transparent 60%)`,
                    }}
                />

                {/* Center dot */}
                <div
                    className="absolute rounded-full"
                    style={{
                        width: '8px',
                        height: '8px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: color,
                        boxShadow: `0 0 8px ${color}`,
                    }}
                />
            </div>

            <style>{`
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
        </div>
    );
}

export default MiniAvatar;
