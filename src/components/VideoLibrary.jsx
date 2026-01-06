// src/components/VideoLibrary.jsx
// FLAME Video Section - Single-focus hearth with horizontal offering bands
// Selection replaces state, not layout. No modals.

import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../state/videoStore.js';
import { VIDEOS, getEmbedUrl } from '../data/videoData.js';
import { IdleHearth } from './IdleHearth.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO HEARTH - The active video player (fixed aspect ratio, centered)
// ═══════════════════════════════════════════════════════════════════════════
function VideoHearth({ video, isPlaying, setIsPlaying, isTransitioning, onClear, isLight }) {
    const videoRef = useRef(null);
    const { updateProgress, markCompleted } = useVideoStore();

    // Reset video when source changes
    useEffect(() => {
        if (videoRef.current && video) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            videoRef.current.load();
        }
    }, [video?.id]);

    const videoUrl = video ? getEmbedUrl(video) : null;

    return (
        <section
            className="w-full flex flex-col items-center justify-center px-4 pt-4 pb-8 relative z-10"
            style={{
                // Solid background to hide decorative elements
                background: isLight
                    ? 'rgba(250, 245, 235, 0.98)'
                    : 'rgba(10,10,15,0.98)',
                // Subtle warmth when playing
                boxShadow: isPlaying
                    ? isLight
                        ? 'inset 0 0 80px rgba(180, 140, 100, 0.15)'
                        : 'inset 0 0 80px rgba(255,120,40,0.08)'
                    : 'none',
                transition: 'all 0.5s ease',
            }}
        >
            {/* Video frame with ember border glow when playing */}
            <div
                className="w-full max-w-3xl rounded-xl overflow-hidden relative"
                style={{
                    aspectRatio: '16 / 9',
                    background: '#0a0a0f',
                    boxShadow: video
                        ? '0 0 60px rgba(255,100,30,0.25), 0 0 120px rgba(255,80,20,0.15), 0 25px 50px rgba(0,0,0,0.5)'
                        : '0 25px 50px rgba(0,0,0,0.5)',
                    border: video
                        ? '2px solid rgba(255,120,40,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.5s ease',
                }}
            >
                {/* Idle embers inside frame when no video */}
                {!video && (
                    <div className="absolute inset-0">
                        <IdleHearth />
                    </div>
                )}

                {/* Video layer */}
                {video && (
                    <div
                        className="absolute inset-0 z-10 transition-opacity duration-300"
                        style={{ opacity: isTransitioning ? 0 : 1 }}
                    >
                        <video
                            ref={videoRef}
                            key={video.id}
                            src={videoUrl}
                            className="w-full h-full object-contain"
                            style={{
                                colorScheme: 'dark',
                                backgroundColor: '#0a0a0f'
                            }}
                            controls
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => {
                                setIsPlaying(false);
                                markCompleted(video.id);
                            }}
                            onTimeUpdate={(e) => {
                                const current = e.target.currentTime;
                                const duration = e.target.duration;
                                if (duration > 0) {
                                    updateProgress(video.id, current / duration, current);
                                }
                            }}
                        />
                    </div>
                )}

                {/* Clear button - only when video is loaded */}
                {video && !isTransitioning && (
                    <button
                        onClick={onClear}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-40 hover:opacity-100"
                        style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                        title="Clear video"
                    >
                        <span className="text-white text-sm">✕</span>
                    </button>
                )}
            </div>

            {/* Video metadata (only when video active) */}
            {video && !isTransitioning && (
                <div className="mt-4 text-center max-w-2xl">
                    <h2
                        className="text-lg mb-1"
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-wide)',
                            color: 'var(--accent-color)',
                        }}
                    >
                        {video.title}
                    </h2>
                    <div
                        className="text-[11px] text-neutral-500 font-medium"
                        style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
                    >
                        {video.duration} • {video.description}
                    </div>
                </div>
            )}
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO TOKEN - Minimal selector (icon + title + duration, no thumbnail)
// ═══════════════════════════════════════════════════════════════════════════
function VideoToken({ video, isSelected, onClick, isLight }) {
    const icons = {
        featured: '◈',
        foundations: '△',
        explorations: '◇',
        wisdom: '✦',
        // Geometric types
        circle: '◯',
        triangle: '△',
        hex: '⬡'
    };
    const icon = icons[video.iconType] || icons[video.category] || '◆';

    return (
        <button
            onClick={() => onClick(video)}
            className="flex-shrink-0 w-40 p-3 text-left transition-all duration-200 rounded-lg border"
            style={{
                background: isSelected
                    ? isLight
                        ? 'rgba(180, 140, 100, 0.2)'
                        : 'rgba(255,140,50,0.1)'
                    : isLight
                        ? 'rgba(80, 60, 40, 0.08)'
                        : 'rgba(255,255,255,0.02)',
                borderColor: isSelected
                    ? isLight
                        ? 'rgba(180, 140, 100, 0.6)'
                        : 'rgba(255,140,50,0.5)'
                    : isLight
                        ? 'rgba(80, 60, 40, 0.2)'
                        : 'rgba(255,255,255,0.08)',
                boxShadow: isSelected
                    ? isLight
                        ? '0 0 20px rgba(180, 140, 100, 0.3)'
                        : '0 0 20px rgba(255,120,40,0.2)'
                    : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
        >
            {/* Icon + Duration row */}
            <div className="flex justify-between items-center mb-2">
                <span
                    className="text-sm"
                    style={{ color: isSelected 
                        ? isLight ? 'rgba(140, 100, 60, 0.9)' : 'rgba(255,180,100,0.9)' 
                        : isLight ? 'rgba(80, 60, 40, 0.5)' : 'rgba(255,255,255,0.3)' 
                    }}
                >
                    {icon}
                </span>
                <span
                    className="text-[9px] font-mono"
                    style={{ color: isSelected 
                        ? isLight ? 'rgba(140, 100, 60, 0.8)' : 'rgba(255,180,100,0.7)' 
                        : isLight ? 'rgba(80, 60, 40, 0.5)' : 'rgba(255,255,255,0.3)' 
                    }}
                >
                    {video.duration}
                </span>
            </div>
            {/* Title */}
            <h3
                className="text-[11px] leading-tight line-clamp-2"
                style={{
                    color: isSelected 
                        ? isLight ? 'rgba(80, 60, 40, 0.95)' : 'rgba(255,220,180,0.95)' 
                        : isLight ? 'rgba(80, 60, 40, 0.8)' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-wide)',
                }}
            >
                {video.title}
            </h3>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// OFFERING BAND - Horizontal scrolling row with category label
// ═══════════════════════════════════════════════════════════════════════════
function OfferingBand({ label, videos, activeVideoId, onSelect, isLight }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Check scroll state
    const updateScrollState = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        updateScrollState();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', updateScrollState);
            window.addEventListener('resize', updateScrollState);
        }
        return () => {
            if (el) el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [videos]);

    // Scroll by ~80% of visible width
    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = scrollRef.current.clientWidth * 0.8;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    // Don't render empty bands
    if (!videos || videos.length === 0) return null;

    return (
        <div className="mb-6">
            {/* Label with scroll arrows */}
            <div className="flex items-center justify-between mb-3 px-4">
                <div
                    className="text-[10px] uppercase tracking-[0.2em]"
                    style={{
                        color: isLight ? 'rgba(140, 100, 60, 0.8)' : 'rgba(255,200,120,0.6)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                    }}
                >
                    ▶ {label}
                </div>

                {/* Arrow buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                            background: canScrollLeft ? 'rgba(255,180,100,0.15)' : 'transparent',
                            color: canScrollLeft ? 'rgba(255,180,100,0.8)' : 'rgba(255,255,255,0.2)',
                            cursor: canScrollLeft ? 'pointer' : 'default',
                        }}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                            background: canScrollRight ? 'rgba(255,180,100,0.15)' : 'transparent',
                            color: canScrollRight ? 'rgba(255,180,100,0.8)' : 'rgba(255,255,255,0.2)',
                            cursor: canScrollRight ? 'pointer' : 'default',
                        }}
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Horizontal scroll container */}
            <div className="relative">
                {/* Left fade */}
                {canScrollLeft && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                        style={{ background: isLight 
                            ? 'linear-gradient(to right, rgba(250, 245, 235, 1), transparent)' 
                            : 'linear-gradient(to right, rgba(10,10,15,1), transparent)' 
                        }}
                    />
                )}

                {/* Scroll area */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 px-4 pb-2"
                    style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollbarWidth: 'none', // Firefox
                        msOverflowStyle: 'none', // IE
                        WebkitOverflowScrolling: 'touch', // iOS momentum
                    }}
                >
                    <style>{`
                        .offering-scroll::-webkit-scrollbar { display: none; }
                    `}</style>
                    {videos.map(video => (
                        <VideoToken
                            key={video.id}
                            video={video}
                            isSelected={video.id === activeVideoId}
                            onClick={onSelect}
                            isLight={isLight}
                        />
                    ))}
                </div>

                {/* Right fade */}
                {canScrollRight && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                        style={{ background: isLight 
                            ? 'linear-gradient(to left, rgba(250, 245, 235, 1), transparent)' 
                            : 'linear-gradient(to left, rgba(10,10,15,1), transparent)' 
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ASH FADE BOUNDARY - Signals end of space
// ═══════════════════════════════════════════════════════════════════════════
function AshFadeBoundary() {
    return (
        <div
            className="h-24 pointer-events-none"
            style={{
                background: 'linear-gradient(to top, rgba(20,15,12,0.8), transparent)',
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO LIBRARY - Main component (the Hearth)
// ═══════════════════════════════════════════════════════════════════════════
export function VideoLibrary() {
    // Theme context
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Idle state by default (null = no video selected)
    const [activeVideo, setActiveVideo] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Group videos by category (meaningful bands only)
    const featuredVideos = VIDEOS.filter(v => v.isFeatured);
    const allVideos = VIDEOS; // For now, show all in one band since we only have wisdom category

    // The "tending" handler with dissolve transition
    const tendFire = (video) => {
        // Guard: don't reset if selecting same video
        if (activeVideo?.id === video.id) return;

        // Trigger ember flare immediately on selection
        if (window.flareEmbers) window.flareEmbers(35);

        // Dissolve out
        setIsTransitioning(true);

        setTimeout(() => {
            setActiveVideo(video);
            setIsPlaying(false);
            // Dissolve in
            setIsTransitioning(false);
        }, 300);
    };

    // Clear video and return to idle embers
    const clearVideo = () => {
        if (!activeVideo) return;

        // Trigger ember flare on clear too
        if (window.flareEmbers) window.flareEmbers(25);

        setIsTransitioning(true);
        setTimeout(() => {
            setActiveVideo(null);
            setIsPlaying(false);
            setIsTransitioning(false);
        }, 300);
    };

    return (
        <div
            className="w-full min-h-[70vh] flex flex-col relative"
            style={{
                background: isLight
                    ? 'rgba(250, 245, 235, 1)'
                    : 'rgba(10,10,15,1)', // Fully opaque
                zIndex: 50 // Above PathParticles and other decorations
            }}
        >
            {/* THE HEARTH - Always at top, fixed size */}
            <VideoHearth
                video={activeVideo}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                isTransitioning={isTransitioning}
                onClear={clearVideo}
                isLight={isLight}
            />

            {/* THE OFFERINGS - Horizontal bands */}
            <div className="flex-1 py-4">
                {/* Featured band (if any) */}
                {featuredVideos.length > 0 && (
                    <OfferingBand
                        label="Featured"
                        videos={featuredVideos}
                        activeVideoId={activeVideo?.id}
                        onSelect={tendFire}
                        isLight={isLight}
                    />
                )}

                {/* All videos band (meaningful, not catalog) */}
                <OfferingBand
                    label="Library"
                    videos={allVideos}
                    activeVideoId={activeVideo?.id}
                    onSelect={tendFire}
                    isLight={isLight}
                />
            </div>

            {/* ASH BOUNDARY - End of space */}
            <AshFadeBoundary />
        </div>
    );
}

// Note: VideoListCompact is available from VideoPlayer.jsx if needed elsewhere
