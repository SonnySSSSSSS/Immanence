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
                        ? 'border-[rgba(253,224,71,0.1)]'
                        : 'border-[rgba(253,224,71,0.2)] hover:border-[rgba(253,224,71,0.3)] hover:shadow-[0_0_30px_rgba(253,224,71,0.1)]'
                    }
        `}
            >
                {/* Header */}
                <h2
                    className="text-sm uppercase tracking-[0.3em] text-[rgba(253,224,71,0.7)] mb-6"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    THE FOUNDATION
                </h2>

                {/* Play Icon or Checkmark */}
                <div className="flex justify-center mb-6">
                    {hasWatchedFoundation ? (
                        <div className="w-16 h-16 rounded-full border-2 border-[rgba(253,224,71,0.5)] flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(253,224,71,0.7)" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                    ) : (
                        <button
                            onClick={handleWatch}
                            disabled={isPlaying}
                            className={`
                w-20 h-20 rounded-full border-2 flex items-center justify-center
                transition-all duration-300 group
                ${isPlaying
                                    ? 'border-[rgba(253,224,71,0.6)] bg-[rgba(253,224,71,0.1)]'
                                    : 'border-[rgba(253,224,71,0.4)] hover:border-[rgba(253,224,71,0.7)] hover:shadow-[0_0_20px_rgba(253,224,71,0.3)]'
                                }
              `}
                            style={{
                                animation: isPlaying ? 'none' : 'pulse-subtle 4s ease-in-out infinite'
                            }}
                        >
                            {isPlaying ? (
                                <div className="w-3 h-3 rounded-full bg-[#fcd34d] animate-pulse" />
                            ) : (
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="rgba(253,224,71,0.8)"
                                    className="ml-1 group-hover:fill-[#fcd34d] transition-colors"
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
                                ? 'bg-[rgba(253,224,71,0.2)] text-[rgba(253,224,71,0.5)] cursor-wait'
                                : 'bg-gradient-to-br from-[#fcd34d] to-[#f59e0b] text-[#050508] hover:shadow-[0_0_25px_rgba(253,224,71,0.4)]'
                            }
            `}
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        {isPlaying ? 'LOADING...' : 'WATCH INTRODUCTION'}
                    </button>
                ) : (
                    <button
                        onClick={handleRevisit}
                        className="text-sm text-[rgba(253,224,71,0.5)] hover:text-[rgba(253,224,71,0.8)] transition-colors"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
                    >
                        Revisit
                    </button>
                )}
            </div>

            <style>{`
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(253, 224, 71, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(253, 224, 71, 0);
          }
        }
      `}</style>
        </div>
    );
}
