// src/components/VideoLibrary.jsx
// FLAME Video Section - Single-focus hearth with horizontal offering bands
// Selection replaces state, not layout. No modals.

import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../state/videoStore.js';
import { VIDEOS, getEmbedUrl } from '../data/videoData.js';

// ═══════════════════════════════════════════════════════════════════════════
// IDLE HEARTH STATE - Embers animation when no video selected
// ═══════════════════════════════════════════════════════════════════════════
function IdleHearthState() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
            {/* Animated ember glow */}
            <div
                className="w-16 h-16 rounded-full mb-6 animate-pulse"
                style={{
                    background: 'radial-gradient(circle, rgba(255,150,50,0.3) 0%, rgba(255,100,20,0.1) 50%, transparent 70%)',
                    boxShadow: '0 0 60px rgba(255,120,40,0.2)',
                }}
            />
            <p
                className="text-[11px] uppercase tracking-[0.25em] text-neutral-600"
                style={{ fontFamily: 'Georgia, serif' }}
            >
                Select a video to begin
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO HEARTH - The active video player (fixed aspect ratio, centered)
// ═══════════════════════════════════════════════════════════════════════════
function VideoHearth({ video, isPlaying, setIsPlaying, isTransitioning }) {
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
            className="w-full flex flex-col items-center px-4 pt-4 pb-8"
            style={{
                // Subtle warmth when playing
                background: isPlaying
                    ? 'radial-gradient(ellipse at center top, rgba(255,120,40,0.08) 0%, transparent 60%)'
                    : 'transparent',
                transition: 'background 0.5s ease',
            }}
        >
            {/* Fixed aspect ratio container - MUST NOT change height */}
            <div
                className="w-full max-w-3xl rounded-xl overflow-hidden relative"
                style={{
                    aspectRatio: '16 / 9',
                    background: '#0a0a0f',
                    boxShadow: isPlaying
                        ? '0 0 80px rgba(255,120,40,0.15), 0 25px 50px rgba(0,0,0,0.5)'
                        : '0 25px 50px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'box-shadow 0.5s ease',
                }}
            >
                {/* Dissolve transition layer */}
                <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ opacity: isTransitioning ? 0 : 1 }}
                >
                    {video ? (
                        <video
                            ref={videoRef}
                            key={video.id}
                            src={videoUrl}
                            className="w-full h-full object-contain"
                            style={{
                                colorScheme: 'dark',
                                backgroundColor: '#000'
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
                    ) : (
                        <IdleHearthState />
                    )}
                </div>
            </div>

            {/* Video metadata (only when video active) */}
            {video && !isTransitioning && (
                <div className="mt-4 text-center max-w-2xl">
                    <h2
                        className="text-lg mb-1"
                        style={{
                            fontFamily: 'Cinzel, serif',
                            color: 'var(--accent-color)',
                        }}
                    >
                        {video.title}
                    </h2>
                    <div
                        className="text-[11px] text-neutral-500"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
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
function VideoToken({ video, isSelected, onClick }) {
    const icons = {
        featured: '◈',
        foundations: '△',
        explorations: '◇',
        wisdom: '✦',
    };
    const icon = icons[video.category] || '◆';

    return (
        <button
            onClick={() => onClick(video)}
            className="flex-shrink-0 w-40 p-3 text-left transition-all duration-200 rounded-lg border"
            style={{
                background: isSelected
                    ? 'rgba(255,140,50,0.1)'
                    : 'rgba(255,255,255,0.02)',
                borderColor: isSelected
                    ? 'rgba(255,140,50,0.5)'
                    : 'rgba(255,255,255,0.08)',
                boxShadow: isSelected
                    ? '0 0 20px rgba(255,120,40,0.2)'
                    : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
        >
            {/* Icon + Duration row */}
            <div className="flex justify-between items-center mb-2">
                <span
                    className="text-sm"
                    style={{ color: isSelected ? 'rgba(255,180,100,0.9)' : 'rgba(255,255,255,0.3)' }}
                >
                    {icon}
                </span>
                <span
                    className="text-[9px] font-mono"
                    style={{ color: isSelected ? 'rgba(255,180,100,0.7)' : 'rgba(255,255,255,0.3)' }}
                >
                    {video.duration}
                </span>
            </div>
            {/* Title */}
            <h3
                className="text-[11px] leading-tight line-clamp-2"
                style={{
                    color: isSelected ? 'rgba(255,220,180,0.95)' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'Georgia, serif',
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
function OfferingBand({ label, videos, activeVideoId, onSelect }) {
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
                        color: 'rgba(255,200,120,0.6)',
                        fontFamily: 'Georgia, serif',
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
                        style={{ background: 'linear-gradient(to right, rgba(10,10,15,1), transparent)' }}
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
                        />
                    ))}
                </div>

                {/* Right fade */}
                {canScrollRight && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                        style={{ background: 'linear-gradient(to left, rgba(10,10,15,1), transparent)' }}
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

        // Dissolve out
        setIsTransitioning(true);

        setTimeout(() => {
            setActiveVideo(video);
            setIsPlaying(false);
            // Dissolve in
            setIsTransitioning(false);
        }, 300);
    };

    return (
        <div
            className="w-full min-h-[70vh] flex flex-col"
            style={{ background: 'rgba(10,10,15,0.95)' }}
        >
            {/* THE HEARTH - Always at top, fixed size */}
            <VideoHearth
                video={activeVideo}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                isTransitioning={isTransitioning}
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
                    />
                )}

                {/* All videos band (meaningful, not catalog) */}
                <OfferingBand
                    label="Library"
                    videos={allVideos}
                    activeVideoId={activeVideo?.id}
                    onSelect={tendFire}
                />
            </div>

            {/* ASH BOUNDARY - End of space */}
            <AshFadeBoundary />
        </div>
    );
}

// Note: VideoListCompact is available from VideoPlayer.jsx if needed elsewhere
