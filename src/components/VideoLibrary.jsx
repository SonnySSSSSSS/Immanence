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
function VideoHearth({ video, isPlaying, setIsPlaying, isTransitioning, onClear, isLight, recommendedBudgetMin }) {
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
            data-tutorial="wisdom-videos-hearth"
            className="w-full flex flex-col items-center justify-center px-4 pt-4 pb-8 relative z-10"
            style={{
                background: isLight
                    ? 'rgba(244, 249, 250, 0.92)'
                    : 'linear-gradient(180deg, rgba(6, 14, 22, 0.88) 0%, rgba(5, 11, 18, 0.94) 100%)',
                border: isLight
                    ? '1px solid rgba(91, 165, 177, 0.18)'
                    : '1px solid rgba(101, 211, 224, 0.12)',
                borderRadius: '20px',
                boxShadow: isPlaying
                    ? isLight
                        ? 'inset 0 0 60px rgba(91, 165, 177, 0.08)'
                        : 'inset 0 0 60px rgba(78, 214, 226, 0.06)'
                    : 'inset 0 1px 0 rgba(168, 241, 248, 0.04)',
                transition: 'all 0.5s ease',
            }}
        >
            {/* Video frame with ember border glow when playing */}
            <div
                className="w-full max-w-3xl rounded-xl overflow-hidden relative"
                style={{
                    aspectRatio: '16 / 9',
                    background: '#071019',
                    boxShadow: video
                        ? '0 0 28px rgba(78, 214, 226, 0.10), 0 20px 42px rgba(0,0,0,0.42)'
                        : '0 20px 42px rgba(0,0,0,0.42)',
                    border: video
                        ? '1px solid rgba(101, 211, 224, 0.26)'
                        : '1px solid rgba(101, 211, 224, 0.12)',
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
                            backgroundColor: '#071019'
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
                            background: 'rgba(6, 14, 22, 0.86)',
                            border: '1px solid rgba(101, 211, 224, 0.18)',
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
                        {video.duration}
                        {typeof recommendedBudgetMin === 'number' ? ` • Suggested ${recommendedBudgetMin}m` : ''}
                        {video.description ? ` • ${video.description}` : ''}
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
            data-card="true"
            data-card-id="video-token"
            className="flex-shrink-0 w-40 p-3 text-left transition-all duration-200 rounded-lg border im-card"
            style={{
                background: isSelected
                    ? isLight
                        ? 'rgba(120, 202, 214, 0.16)'
                        : 'rgba(78, 214, 226, 0.08)'
                    : isLight
                        ? 'rgba(82, 124, 132, 0.07)'
                        : 'rgba(10, 18, 26, 0.72)',
                borderColor: isSelected
                    ? isLight
                        ? 'rgba(97, 177, 190, 0.42)'
                        : 'rgba(101, 211, 224, 0.28)'
                    : isLight
                        ? 'rgba(91, 165, 177, 0.18)'
                        : 'rgba(101, 211, 224, 0.10)',
                boxShadow: isSelected
                    ? isLight
                        ? '0 0 16px rgba(91, 165, 177, 0.16)'
                        : '0 0 18px rgba(78, 214, 226, 0.08)'
                    : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
        >
            {/* Icon + Duration row */}
            <div className="flex justify-between items-center mb-2">
                <span
                    className="text-sm"
                    style={{ color: isSelected 
                        ? isLight ? 'rgba(72, 136, 146, 0.9)' : 'rgba(152, 232, 238, 0.86)' 
                        : isLight ? 'rgba(80, 60, 40, 0.5)' : 'rgba(170, 230, 236, 0.34)' 
                    }}
                >
                    {icon}
                </span>
                <span
                    className="text-[9px] font-mono"
                    style={{ color: isSelected 
                        ? isLight ? 'rgba(72, 136, 146, 0.78)' : 'rgba(152, 232, 238, 0.7)' 
                        : isLight ? 'rgba(80, 60, 40, 0.5)' : 'rgba(170, 230, 236, 0.28)' 
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
                        ? isLight ? 'rgba(40, 66, 72, 0.95)' : 'rgba(233, 252, 255, 0.92)' 
                        : isLight ? 'rgba(80, 60, 40, 0.8)' : 'rgba(225, 239, 242, 0.58)',
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
        <div
            data-tutorial={label === 'Featured' ? 'wisdom-videos-featured-band' : (label === 'Library' ? 'wisdom-videos-library-band' : undefined)}
            className="mb-7"
        >
            {/* Label with scroll arrows */}
            <div className="flex items-center justify-between mb-4 px-4">
                <div>
                    <div
                        className="text-[10px] uppercase tracking-[0.2em]"
                        style={{
                            color: isLight ? 'rgba(72, 136, 146, 0.84)' : 'rgba(170, 230, 236, 0.72)',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-mythic)',
                        }}
                    >
                        {`\u25b8 ${label}`}
                    </div>
                    {label === 'Featured' && (
                        <div
                            className="text-[8px] italic mt-0.5"
                            style={{ color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(170, 230, 236, 0.38)' }}
                        >
                            Curated picks
                        </div>
                    )}
                    {label === 'Library' && (
                        <div
                            className="text-[8px] italic mt-0.5"
                            style={{ color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(170, 230, 236, 0.38)' }}
                        >
                            All videos
                        </div>
                    )}
                </div>

                {/* Arrow buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                            background: canScrollLeft ? 'rgba(78, 214, 226, 0.12)' : 'transparent',
                            color: canScrollLeft ? 'rgba(152, 232, 238, 0.76)' : 'rgba(255,255,255,0.2)',
                            cursor: canScrollLeft ? 'pointer' : 'default',
                            opacity: canScrollLeft ? 0.7 : 0.15,
                        }}
                    >
                        {'\u2190'}
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                            background: canScrollRight ? 'rgba(78, 214, 226, 0.12)' : 'transparent',
                            color: canScrollRight ? 'rgba(152, 232, 238, 0.76)' : 'rgba(255,255,255,0.2)',
                            cursor: canScrollRight ? 'pointer' : 'default',
                            opacity: canScrollRight ? 0.7 : 0.15,
                        }}
                    >
                        {'\u2192'}
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
                    className="flex gap-3 px-4 pb-3"
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
                background: 'linear-gradient(to top, rgba(7, 14, 20, 0.8), transparent)',
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO LIBRARY - Main component (the Hearth)
// ═══════════════════════════════════════════════════════════════════════════
export function VideoLibrary({ initialVideoId = null, initialVideoBudgetMin = null }) {
    // Theme context
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Idle state by default (null = no video selected)
    const [activeVideo, setActiveVideo] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [recommendedBudgetMin, setRecommendedBudgetMin] = useState(null);

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
            setRecommendedBudgetMin(
                video?.id && video.id === initialVideoId && typeof initialVideoBudgetMin === 'number'
                    ? initialVideoBudgetMin
                    : null
            );
            // Dissolve in
            setIsTransitioning(false);
        }, 300);
    };

    // Allow other surfaces (paths/curriculum) to deep-link into a specific video.
    useEffect(() => {
        if (!initialVideoId) return;
        const v = VIDEOS.find(x => x.id === initialVideoId);
        if (v) {
            setRecommendedBudgetMin(typeof initialVideoBudgetMin === 'number' ? initialVideoBudgetMin : null);
            tendFire(v);
        }
    }, [initialVideoId, initialVideoBudgetMin]);

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
            setRecommendedBudgetMin(null);
        }, 300);
    };

    return (
        <div
            data-tutorial="wisdom-videos-root"
            className="w-full min-h-[70vh] flex flex-col relative"
            style={{
                background: isLight
                    ? 'rgba(250, 245, 235, 1)'
                    : 'linear-gradient(180deg, rgba(7, 14, 21, 0.88) 0%, rgba(4, 9, 16, 0.92) 100%)',
                border: isLight
                    ? '1px solid rgba(91, 165, 177, 0.16)'
                    : '1px solid rgba(101, 211, 224, 0.10)',
                borderRadius: '22px',
                boxShadow: isLight
                    ? 'inset 0 1px 0 rgba(255,255,255,0.45)'
                    : 'inset 0 1px 0 rgba(168, 241, 248, 0.04)',
                zIndex: 50
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
                recommendedBudgetMin={recommendedBudgetMin}
            />

            {/* THE OFFERINGS - Horizontal bands */}
            <div className="flex-1 pt-6 pb-4">
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
