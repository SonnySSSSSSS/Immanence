// src/components/FoundationCard.jsx
import React, { useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';

export function FoundationCard() {
    const { hasWatchedFoundation, setWatchedFoundation } = useNavigationStore();
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
                    background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                    border: '1px solid transparent',
                    backgroundImage: `
                        linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                        linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: hasWatchedFoundation
                        ? `0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`
                        : `0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-15), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`
                }}
                onMouseEnter={(e) => {
                    if (!hasWatchedFoundation) {
                        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 40px var(--accent-25), 0 0 80px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
                    }
                }}
                onMouseLeave={(e) => {
                    if (!hasWatchedFoundation) {
                        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-15), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
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
                        className="text-sm uppercase tracking-[0.3em] text-[var(--accent-70)] mb-6 font-bold"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        THE FOUNDATION
                    </h2>

                    {/* Play Icon or Checkmark */}
                    <div className="flex justify-center mb-6">
                        {hasWatchedFoundation ? (
                            <div className="w-16 h-16 rounded-full border-2 border-[var(--accent-50)] flex items-center justify-center">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-70)" strokeWidth="2">
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
                ${isPlaying
                                        ? 'border-[var(--accent-60)] bg-[var(--accent-10)]'
                                        : 'border-[var(--accent-40)] hover:border-[var(--accent-70)] hover:shadow-[0_0_20px_var(--accent-30)]'
                                    }
              `}
                            >
                                {isPlaying ? (
                                    <div className="w-3 h-3 rounded-full bg-[var(--accent-color)] animate-pulse" />
                                ) : (
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="var(--accent-80)"
                                        className="ml-1 group-hover:fill-[var(--accent-color)] transition-colors"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Subtitle */}
                    <p
                        className="text-base text-[rgba(253,251,245,0.65)] mb-2 italic font-medium"
                        style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
                    >
                        Before you choose a path
                    </p>

                    {/* Duration */}
                    <p className="text-sm text-[rgba(253,251,245,0.4)] mb-6">
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
              ${isPlaying
                                    ? 'bg-[var(--accent-20)] text-[var(--accent-50)] cursor-wait'
                                    : 'text-[#050508] hover:shadow-[0_0_25px_var(--accent-40)]'
                                }
            `}
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: 'var(--tracking-wide)',
                                background: isPlaying ? undefined : 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))'
                            }}
                        >
                            {isPlaying ? 'LOADING...' : 'WATCH INTRODUCTION'}
                        </button>
                    ) : (
                        <button
                            onClick={handleRevisit}
                            className="text-sm text-[var(--accent-50)] hover:text-[var(--accent-80)] transition-colors font-medium"
                            style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
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
            box-shadow: 0 0 0 0 var(--accent-40);
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
