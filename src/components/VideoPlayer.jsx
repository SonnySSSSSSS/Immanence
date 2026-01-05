// src/components/VideoPlayer.jsx
// YouTube embed with progress tracking and provider abstraction

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVideoStore } from '../state/videoStore.js';
import { getEmbedUrl } from '../data/videoData.js';

/**
 * VideoPlayer - Embeds video with progress tracking
 * 
 * @param {Object} video - Video object from videoData
 * @param {Function} onComplete - Called when video reaches 90% or ends
 * @param {Function} onClose - Called when player should close
 * @param {boolean} autoplay - Start playing immediately
 */
export function VideoPlayer({ video, onComplete, onClose, autoplay = false }) {
    const {
        updateProgress,
        markCompleted,
        setCurrentVideo,
        clearCurrentVideo,
        getResumePosition
    } = useVideoStore();

    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const iframeRef = useRef(null);
    const playerRef = useRef(null);
    const progressIntervalRef = useRef(null);

    // Get resume position
    const resumePosition = getResumePosition(video.id);

    // Set current video on mount
    useEffect(() => {
        setCurrentVideo(video.id);
        return () => {
            clearCurrentVideo();
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [video.id, setCurrentVideo, clearCurrentVideo]);

    const handlePlayerReady = useCallback(() => {
        setIsLoading(false);

        // Start progress tracking (every 2 seconds)
        progressIntervalRef.current = setInterval(() => {
            if (!playerRef.current || !playerRef.current.getCurrentTime) return;

            try {
                const currentTime = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();

                if (duration > 0) {
                    const progress = currentTime / duration;
                    updateProgress(video.id, progress, currentTime);

                    // Check for completion (90%)
                    if (progress >= 0.9) {
                        markCompleted(video.id);
                        onComplete?.();
                    }
                }
            } catch (_e) {
                // Player might be destroyed
            }
        }, 2000);
    }, [video.id, updateProgress, markCompleted, onComplete]);

    const handleStateChange = useCallback((event) => {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            markCompleted(video.id);
            onComplete?.();
        }
    }, [video.id, markCompleted, onComplete]);

    const handlePlayerError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
    }, []);

    // Initialize YouTube Player API
    useEffect(() => {
        if (video.provider !== 'youtube') return;

        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Initialize player when API is ready
        const initPlayer = () => {
            if (!iframeRef.current) return;

            playerRef.current = new window.YT.Player(iframeRef.current, {
                events: {
                    onReady: handlePlayerReady,
                    onStateChange: handleStateChange,
                    onError: handlePlayerError
                }
            });
        };

        if (window.YT && window.YT.Player) {
            // Small delay to ensure iframe is mounted
            setTimeout(initPlayer, 100);
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [video.id, video.provider, handlePlayerReady, handleStateChange, handlePlayerError]);

    const handleIframeLoad = () => {
        // For non-YouTube providers
        if (video.provider !== 'youtube') {
            setIsLoading(false);
        }
    };

    // Get embed URL with resume position
    const embedUrl = getEmbedUrl(video, {
        autoplay,
        start: resumePosition
    });

    if (!embedUrl) {
        return (
            <div className="aspect-video bg-[rgba(0,0,0,0.3)] rounded-xl flex items-center justify-center">
                <p className="text-[rgba(253,251,245,0.5)] text-sm">Video unavailable</p>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            {/* Video container with 16:9 aspect ratio */}
            <div className="aspect-video rounded-xl overflow-hidden relative bg-black">
                {/* Loading skeleton */}
                {isLoading && (
                    <div className="absolute inset-0 bg-[rgba(22,22,37,0.9)] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-2 border-[var(--accent-30)] border-t-[var(--accent-color)] rounded-full animate-spin" />
                            <span className="text-[11px] text-[rgba(253,251,245,0.5)]">Loading video...</span>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {hasError && (
                    <div className="absolute inset-0 bg-[rgba(22,22,37,0.95)] flex items-center justify-center">
                        <div className="text-center p-4">
                            <div className="text-3xl mb-2">😓</div>
                            <p className="text-[rgba(253,251,245,0.7)] text-sm mb-3">
                                Video failed to load
                            </p>
                            {video.provider === 'youtube' && (
                                <a
                                    href={`https://youtube.com/watch?v=${video.externalId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 rounded-full text-[11px] bg-[var(--accent-20)] text-[var(--accent-color)] hover:bg-[var(--accent-30)] transition-all"
                                >
                                    Open on YouTube →
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Local video (self provider) - HTML5 video element */}
                {video.provider === 'self' && (
                    <video
                        ref={iframeRef}
                        src={embedUrl}
                        className="w-full h-full object-contain"
                        style={{
                            colorScheme: 'dark',
                            backgroundColor: '#000'
                        }}
                        controls
                        autoPlay={autoplay}
                        onLoadedData={() => setIsLoading(false)}
                        onError={() => { setHasError(true); setIsLoading(false); }}
                        onTimeUpdate={(e) => {
                            const current = e.target.currentTime;
                            const duration = e.target.duration;
                            if (duration > 0) {
                                const progress = current / duration;
                                updateProgress(video.id, progress, current);
                                if (progress >= 0.9) {
                                    markCompleted(video.id);
                                    onComplete?.();
                                }
                            }
                        }}
                        onEnded={() => {
                            markCompleted(video.id);
                            onComplete?.();
                        }}
                    />
                )}

                {/* YouTube/External iframe */}
                {video.provider !== 'self' && (
                    <iframe
                        ref={iframeRef}
                        id={`youtube-player-${video.id}`}
                        src={embedUrl}
                        title={video.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={handleIframeLoad}
                    />
                )}
            </div>

            {/* Video info bar */}
            <div className="mt-3 flex items-start justify-between">
                <div className="flex-1">
                    <h3
                        className="text-sm font-semibold text-white mb-1"
                        style={{ fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-wide)' }}
                    >
                        {video.title}
                    </h3>
                    <p className="text-[10px] text-[rgba(253,251,245,0.5)]">
                        {video.duration} • {video.category}
                    </p>
                </div>

                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[rgba(253,251,245,0.1)] transition-colors"
                    >
                        <span className="text-[rgba(253,251,245,0.6)]">✕</span>
                    </button>
                )}
            </div>

            {/* Resume indicator */}
            {resumePosition > 0 && (
                <div className="mt-2 text-[9px] text-[var(--accent-color)] opacity-70">
                    ↻ Resuming from {formatTime(resumePosition)}
                </div>
            )}
        </div>
    );
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Compact video player for modal use
 */
export function VideoPlayerModal({ video, isOpen, onClose }) {
    if (!isOpen || !video) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(10, 10, 18, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <VideoPlayer video={video} onClose={onClose} />
            </div>
        </div>
    );
}
