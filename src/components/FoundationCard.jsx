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
                className={`
          bg-[#0f0f1a] border rounded-3xl p-8 text-center
          transition-all duration-300
          ${hasWatchedFoundation
                        ? 'border-[var(--accent-10)]'
                        : 'border-[var(--accent-20)] hover:border-[var(--accent-30)] hover:shadow-[0_0_30px_var(--accent-10)]'
                    }
        `}
            >
                {/* Header */}
                <h2
                    className="text-sm uppercase tracking-[0.3em] text-[var(--accent-70)] mb-6"
                    style={{ fontFamily: 'Cinzel, serif' }}
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
                    className="text-base text-[rgba(253,251,245,0.65)] mb-2 italic"
                    style={{ fontFamily: 'Crimson Pro, serif' }}
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
                            fontFamily: 'Cinzel, serif',
                            background: isPlaying ? undefined : 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))'
                        }}
                    >
                        {isPlaying ? 'LOADING...' : 'WATCH INTRODUCTION'}
                    </button>
                ) : (
                    <button
                        onClick={handleRevisit}
                        className="text-sm text-[var(--accent-50)] hover:text-[var(--accent-80)] transition-colors"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
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
    );
}
