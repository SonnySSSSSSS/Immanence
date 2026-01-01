// src/components/FoundationCard.jsx
import React, { useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function FoundationCard() {
    const { hasWatchedFoundation, setWatchedFoundation } = useNavigationStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [isPlaying, setIsPlaying] = useState(false);

    const handleWatch = () => {
        setIsPlaying(true);
        // For now, simulate watching - in real implementation, this would open video player
        // Mark as watched after a delay (simulating completion)
        setTimeout(() => {
            setWatchedFoundation(true);
            setIsPlaying(false);
        }, 2000);
    };

    const handleRevisit = () => {
        setIsPlaying(true);
        setTimeout(() => {
            setIsPlaying(false);
        }, 2000);
    };

    return (
        <div
            className={`
        w-full transition-all duration-700
        ${hasWatchedFoundation ? 'scale-[0.85] opacity-75' : 'scale-100 opacity-100'}
      `}
        >
            <div
                className="relative rounded-3xl p-8 text-center transition-all duration-300 overflow-hidden"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)'
                        : 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                    border: isLight ? '1px solid rgba(180, 140, 90, 0.25)' : '1px solid transparent',
                    backgroundImage: isLight ? 'none' : `
                        linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                        linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: isLight
                        ? (hasWatchedFoundation ? '0 8px 24px rgba(180, 140, 90, 0.1)' : '0 10px 30px rgba(180, 140, 90, 0.15)')
                        : hasWatchedFoundation
                            ? `0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`
                            : `0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-15), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`
                }}
                onMouseEnter={(e) => {
                    if (!hasWatchedFoundation) {
                        e.currentTarget.style.boxShadow = isLight
                            ? '0 15px 40px rgba(180, 140, 90, 0.25), inset 0 0 20px rgba(180, 140, 90, 0.05)'
                            : `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-25), 0 0 80px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
                    }
                }}
                onMouseLeave={(e) => {
                    if (!hasWatchedFoundation) {
                        e.currentTarget.style.boxShadow = isLight
                            ? '0 10px 30px rgba(180, 140, 90, 0.15)'
                            : `0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-15), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
                    }
                }}
            >
                {/* Volcanic glass texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        background: `
                            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
                            repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.015) 3px, rgba(0, 0, 0, 0.015) 6px)
                        `,
                        opacity: 0.7
                    }}
                />

                {/* Inner ember glow */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        background: `radial-gradient(circle at 50% 0%, var(--accent-glow)12 0%, transparent 60%)`
                    }}
                />
                {/* Header */}
                <div className="relative z-10">
                    <h2
                        className="text-sm uppercase tracking-[0.3em] mb-6 font-bold"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-70)'
                        }}
                    >
                        THE FOUNDATION
                    </h2>

                    {/* Play Icon or Checkmark */}
                    <div className="flex justify-center mb-6">
                        {hasWatchedFoundation ? (
                            <div
                                className="w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors"
                                style={{ borderColor: isLight ? 'rgba(180, 140, 90, 0.4)' : 'var(--accent-50)' }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-70)'} strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>
                        ) : (
                            <button
                                onClick={handleWatch}
                                disabled={isPlaying}
                                className={`
                                    w-20 h-20 rounded-full border-2 flex items-center justify-center
                                    transition-all duration-300 group foundation-play-btn
                                `}
                                style={{
                                    borderColor: isLight ? 'rgba(180, 140, 90, 0.4)' : 'var(--accent-40)',
                                    background: isPlaying
                                        ? (isLight ? 'rgba(180, 140, 90, 0.1)' : 'var(--accent-10)')
                                        : 'transparent'
                                }}
                            >
                                {isPlaying ? (
                                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: isLight ? 'rgba(180, 140, 90, 0.8)' : 'var(--accent-color)' }} />
                                ) : (
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill={isLight ? 'rgba(180, 140, 90, 0.6)' : 'var(--accent-80)'}
                                        className="ml-1 transition-colors"
                                        style={{ color: isLight ? 'rgba(180, 140, 90, 0.9)' : 'var(--accent-color)' }}
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Subtitle */}
                    <p
                        className="text-base mb-2 italic font-medium"
                        style={{
                            fontFamily: 'var(--font-body)',
                            letterSpacing: '0.01em',
                            color: isLight ? 'rgba(90, 77, 60, 0.75)' : 'rgba(253,251,245,0.65)'
                        }}
                    >
                        Before you choose a path
                    </p>
                    {/* Duration */}
                    <p className="text-sm mb-6" style={{ color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253,251,245,0.4)' }}>
                        12 minutes
                    </p>

                    {/* Button */}
                    {!hasWatchedFoundation ? (
                        <button
                            onClick={handleWatch}
                            disabled={isPlaying}
                            className={`
                                px-6 py-3 rounded-full font-semibold text-sm
                                transition-all duration-300
                            `}
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: 'var(--tracking-wide)',
                                background: isPlaying
                                    ? (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)')
                                    : (isLight ? 'rgba(180, 140, 90, 0.8)' : 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))'),
                                color: isPlaying
                                    ? (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)')
                                    : (isLight ? 'white' : '#050508'),
                                boxShadow: !isPlaying && isLight ? '0 4px 12px rgba(180, 140, 90, 0.3)' : undefined,
                                cursor: isPlaying ? 'wait' : 'pointer'
                            }}
                        >
                            {isPlaying ? 'LOADING...' : 'WATCH INTRODUCTION'}
                        </button>
                    ) : (
                        <button
                            onClick={handleRevisit}
                            className="text-sm transition-colors font-medium"
                            style={{
                                fontFamily: 'var(--font-body)',
                                letterSpacing: '0.01em',
                                color: isLight ? 'rgba(140, 100, 40, 0.6)' : 'var(--accent-50)'
                            }}
                            onMouseEnter={(e) => e.target.style.color = isLight ? 'rgba(140, 100, 40, 0.9)' : 'var(--accent-80)'}
                            onMouseLeave={(e) => e.target.style.color = isLight ? 'rgba(140, 100, 40, 0.6)' : 'var(--accent-50)'}
                        >
                            Revisit
                        </button>
                    )}
                </div>

                <style>{`
        .foundation-play-btn:not(:disabled) {
          animation: pulse-subtle 4s ease-in-out infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 0 0 0 ${isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-40)'};
          }
          50% {
            box-shadow: 0 0 0 8px transparent;
          }
        }
      `}</style>
            </div>
        </div>
    );
}
