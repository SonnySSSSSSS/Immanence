// src/components/ApplicationTrackingCard.jsx
// Displays awareness tracking metrics on the Home Hub
// Read-only information card showing Application section stats

import { useRef, useState, useEffect } from 'react';
import { useApplicationStore } from '../state/applicationStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { getPathById } from '../data/navigationData.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from '../utils/dynamicLighting.js';

export function ApplicationTrackingCard() {
    const { getStats, intention } = useApplicationStore();
    const { activePath } = useNavigationStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setGradientAngle(calculateGradientAngle(rect, getAvatarCenter()));
        }
    }, [isLight]);

    // Get week stats
    const weekStats = getStats(7);

    // Get path application items if available
    const path = activePath ? getPathById(activePath.pathId) : null;
    const applicationItems = path?.applicationItems || [];

    // Map stats to directions (N/E/S/W)
    const directionStats = {
        north: {
            label: applicationItems[0] || 'Awareness',
            count: weekStats.byCategory?.[applicationItems[0]?.toLowerCase().replace(/\s+/g, '-')] || 0,
            color: '#FF6B35'
        },
        east: {
            label: applicationItems[3] || 'Awareness',
            count: weekStats.byCategory?.[applicationItems[3]?.toLowerCase().replace(/\s+/g, '-')] || 0,
            color: '#9B5DE5'
        },
        south: {
            label: applicationItems[2] || 'Awareness',
            count: weekStats.byCategory?.[applicationItems[2]?.toLowerCase().replace(/\s+/g, '-')] || 0,
            color: '#4ECDC4'
        },
        west: {
            label: applicationItems[1] || 'Awareness',
            count: weekStats.byCategory?.[applicationItems[1]?.toLowerCase().replace(/\s+/g, 'minus')] || 0,
            color: '#F7DC6F'
        }
    };

    const totalGestures = weekStats.total || 0;

    return (
        <div
            ref={cardRef}
            className="w-full rounded-[32px] px-6 py-5 relative overflow-hidden transition-all duration-700 ease-in-out"
            style={{
                maxWidth: '430px',
                margin: '0 auto',
                border: isLight ? '2px solid transparent' : '2px solid var(--accent-color)',
                backgroundImage: isLight
                    ? `linear-gradient(rgba(252, 248, 240, 0.98), rgba(248, 244, 235, 0.96)), 
                       ${getDynamicGoldGradient(gradientAngle, true)}`
                    : `linear-gradient(135deg, rgba(20, 15, 25, 0.98), rgba(10, 8, 15, 0.98)), 
                       linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: isLight
                    ? `0 0 0 1px rgba(160, 120, 80, 0.3),
                       0 12px 40px rgba(120, 90, 60, 0.12), 
                       inset 0 2px 0 rgba(255, 255, 255, 0.8)`
                    : `0 30px 80px rgba(0, 0, 0, 0.7), 
                       inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
            }}
        >
            {/* Background Ambient */}
            <div
                className="absolute -top-32 -right-32 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20"
                style={{ background: isLight ? 'rgba(180, 120, 40, 0.4)' : 'var(--accent-color)' }}
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{
                            background: isLight ? 'rgba(255, 250, 240, 0.6)' : 'rgba(10, 15, 25, 0.75)',
                            border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`
                        }}
                    >
                        🧭
                    </div>
                    <div>
                        <div
                            className="text-[12px] font-black uppercase tracking-[0.3em]"
                            style={{ color: isLight ? 'rgba(60, 45, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)' }}
                        >
                            Awareness
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)' }}
                            />
                            <div
                                className="text-[8px] font-black uppercase tracking-[0.1em] opacity-40"
                                style={{ color: isLight ? 'rgba(60, 45, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)' }}
                            >
                                Week: {totalGestures}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direction Breakdown (N/E/S/W) - Compact 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(directionStats).map(([dir, data]) => (
                    <div
                        key={dir}
                        className="rounded-xl px-3 py-2 transition-all duration-300"
                        style={{
                            background: isLight
                                ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(248, 244, 235, 0.5))'
                                : 'rgba(10, 15, 25, 0.5)',
                            border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div
                                    className="text-[9px] uppercase tracking-wider mb-0.5 opacity-50"
                                    style={{ color: isLight ? 'rgba(100, 80, 60, 0.75)' : 'rgba(253, 251, 245, 0.5)' }}
                                >
                                    {dir.charAt(0).toUpperCase()}
                                </div>
                                <div
                                    className="text-[10px] leading-tight truncate"
                                    style={{
                                        color: isLight ? 'rgba(60, 45, 35, 0.8)' : 'rgba(253, 251, 245, 0.7)',
                                        fontFamily: 'var(--font-body)'
                                    }}
                                >
                                    {data.label}
                                </div>
                            </div>
                            <div
                                className="text-[20px] font-black tabular-nums ml-2"
                                style={{
                                    color: data.count > 0
                                        ? (isLight ? data.color : data.color)
                                        : (isLight ? 'rgba(100, 80, 60, 0.2)' : 'rgba(253, 251, 245, 0.1)')
                                }}
                            >
                                {data.count}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Current Intention - Compact inline */}
            {intention && (
                <div
                    className="rounded-xl px-4 py-2.5 mb-3"
                    style={{
                        background: isLight
                            ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.8), rgba(248, 244, 235, 0.7))'
                            : 'rgba(10, 15, 25, 0.6)',
                        border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                    }}
                >
                    <div
                        className="text-[8px] uppercase tracking-[0.2em] mb-1 opacity-50"
                        style={{ color: isLight ? 'rgba(100, 80, 60, 0.75)' : 'rgba(253, 251, 245, 0.5)' }}
                    >
                        Intention
                    </div>
                    <p
                        className="text-[11px] italic leading-snug line-clamp-2"
                        style={{
                            color: isLight ? 'rgba(60, 45, 35, 0.85)' : 'rgba(253, 251, 245, 0.7)',
                            fontFamily: 'var(--font-body)'
                        }}
                    >
                        "{intention}"
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-center px-2 opacity-20">
                <span
                    className="text-[7px] font-black uppercase tracking-[0.6em]"
                    style={{ color: isLight ? 'rgba(60, 45, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)' }}
                >
                    FIELD
                </span>
            </div>
        </div>
    );
}

export default ApplicationTrackingCard;
