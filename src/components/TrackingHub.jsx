// src/components/TrackingHub.jsx
// Swipeable stats dashboard showing domain-specific progress

import React, { useState, useRef } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { DishonorBadge } from './DishonorBadge.jsx';
import { Icon } from '../icons/Icon.jsx';
import SevenDayTrendCurve from './SevenDayTrendCurve.jsx';
import { plateauMaterial, plateauMaterialElevated, plateauMaterialClear, noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from '../styles/cardMaterial.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

// Domain configuration - using icon names for Icon component
const DOMAINS = [
    { id: 'breathwork', label: 'Breathwork', iconName: 'breathwork' },
    { id: 'visualization', label: 'Visualization', iconName: 'visualization' },
    { id: 'wisdom', label: 'Wisdom', iconName: 'wisdom' }
];

// Cymatic glyphs - sacred geometry for each domain
const CYMATIC_GLYPHS = {
    // BREATHWORK (Wave) - Concentric circles: rhythmic flow of life-force
    breathwork: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="7" fill="none"
                stroke={isActive ? 'var(--accent-color)' : 'rgba(253,251,245,0.15)'}
                strokeWidth={isActive ? "1.2" : "0.5"}
                strokeDasharray={isActive ? "none" : "2 2"}
                opacity={isActive ? "0.4" : "0.2"} />
            <circle cx="10" cy="10" r="5" fill="none"
                stroke={isActive ? 'var(--accent-color)' : 'rgba(253,251,245,0.2)'}
                strokeWidth={isActive ? "1.5" : "0.8"}
                opacity={isActive ? "0.7" : "0.3"} />
            <circle cx="10" cy="10" r="2.5"
                fill={isActive ? 'var(--accent-color)' : 'rgba(253,251,245,0.1)'}
                opacity={isActive ? "0.6" : "0.2"} />
        </svg>
    ),

    // VISUALIZATION (Sword) - Hexagon: precision of directed consciousness
    visualization: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 20 20">
            <path
                d="M10 2 L16.33 6 L16.33 14 L10 18 L3.67 14 L3.67 6 Z"
                fill="none"
                stroke={isActive ? 'var(--accent-color)' : 'rgba(253,251,245,0.15)'}
                strokeWidth={isActive ? "1.5" : "0.8"}
                strokeDasharray={isActive ? "none" : "1.5 1.5"}
                style={{
                    transition: 'all 0.4s ease',
                    transform: isActive ? 'rotate(30deg)' : 'rotate(0deg)',
                    transformOrigin: 'center',
                    opacity: isActive ? 1 : 0.4
                }}
            />
            {isActive && (
                <circle cx="10" cy="10" r="1.5" fill="var(--accent-color)" opacity="0.5" />
            )}
        </svg>
    ),

    // WISDOM (Mirror) - Square: stable foundation of recognition
    wisdom: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 20 20">
            <rect x="5" y="5" width="10" height="10"
                fill="none"
                stroke={isActive ? 'var(--accent-color)' : 'rgba(253,251,245,0.15)'}
                strokeWidth={isActive ? "1.5" : "0.8"}
                strokeDasharray={isActive ? "none" : "3 1"}
                opacity={isActive ? 1 : 0.4} />
            <rect x="7.5" y="7.5" width="5" height="5"
                fill={isActive ? 'var(--accent-color)' : 'rgba(253,251,245,0.05)'}
                opacity={isActive ? "0.3" : "0.1"} />
        </svg>
    )
};

/**
 * Domain-specific insights component
 * Always renders with appropriate content for each domain
 */
function DomainInsights({ domain, stats }) {
    // Breathwork: Show pattern usage (using subType which is a string like "Box", "4-7-8", etc.)
    if (domain === 'breathwork') {
        const patterns = stats.patterns || {};
        const patternEntries = Object.entries(patterns).filter(([key]) => key !== 'unknown' && key !== 'null');

        if (patternEntries.length > 0) {
            return (
                <div className="flex flex-wrap gap-1">
                    {patternEntries.slice(0, 4).map(([pattern, count]) => (
                        <span
                            key={pattern}
                            className="text-[9px] px-2 py-0.5 rounded-full"
                            style={{
                                background: 'var(--accent-10)',
                                color: 'var(--accent-70)'
                            }}
                        >
                            {pattern}: {count}
                        </span>
                    ))}
                </div>
            );
        }

        // Empty state for breathwork
        return (
            <div className="text-[9px] text-[rgba(253,251,245,0.35)] italic">
                Complete a session to see pattern insights
            </div>
        );
    }

    // Visualization: Show geometry types practiced
    if (domain === 'visualization') {
        const geometries = stats.geometries || {};
        const geoEntries = Object.entries(geometries);

        if (geoEntries.length > 0) {
            return (
                <div className="flex flex-wrap gap-1">
                    {geoEntries.slice(0, 4).map(([geo, count]) => (
                        <span
                            key={geo}
                            className="text-[9px] px-2 py-0.5 rounded-full"
                            style={{
                                background: 'var(--accent-10)',
                                color: 'var(--accent-70)'
                            }}
                        >
                            {geo}: {count}
                        </span>
                    ))}
                </div>
            );
        }

        return (
            <div className="text-[9px] text-[rgba(253,251,245,0.35)] italic">
                Sacred geometry, cymatics, and visual focus
            </div>
        );
    }

    // Wisdom: Show reading progress or encouragement
    if (domain === 'wisdom') {
        const sectionsCount = stats.sectionsViewed?.length || 0;
        const bookmarks = stats.bookmarks?.length || 0;

        if (sectionsCount > 0 || bookmarks > 0) {
            return (
                <div className="flex gap-3">
                    {sectionsCount > 0 && (
                        <span className="text-[9px] text-[rgba(253,251,245,0.5)]">
                            📖 {sectionsCount} sections explored
                        </span>
                    )}
                    {bookmarks > 0 && (
                        <span className="text-[9px] text-[rgba(253,251,245,0.5)]">
                            🔖 {bookmarks} bookmarks
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className="text-[9px] text-[rgba(253,251,245,0.35)] italic">
                Treatise study and contemplative reading
            </div>
        );
    }

    // Default fallback
    return (
        <div className="text-[9px] text-[rgba(253,251,245,0.35)] italic">
            Track your practice to see insights
        </div>
    );
}

export function TrackingHub() {
    const {
        getStreakInfo,
        getDomainStats,
        getWeeklyPattern,
        getPrimaryDomain,
        setDisplayPreference,
        displayPreference,
        userSelectedDomain
    } = useProgressStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.mode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const contentMaxWidth = isSanctuary ? 'max-w-5xl' : 'max-w-2xl';

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const containerRef = useRef(null);

    // Get primary domain and reorder domains to show it first
    const primaryDomain = getPrimaryDomain();
    const primaryDomainObj = DOMAINS.find(d => d.id === primaryDomain) || DOMAINS[0];
    const orderedDomains = [
        primaryDomainObj,
        ...DOMAINS.filter(d => d.id !== primaryDomainObj.id)
    ];

    // Derived data
    const streakInfo = getStreakInfo();
    const weeklyPattern = getWeeklyPattern();



    // Touch/mouse handlers for swipe
    const handleDragStart = (clientX) => {
        setIsDragging(true);
        setStartX(clientX);
    };

    const handleDragMove = (clientX) => {
        if (!isDragging) return;
        const diff = clientX - startX;
        setTranslateX(diff);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 80;
        if (translateX < -threshold && currentIndex < orderedDomains.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (translateX > threshold && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
        setTranslateX(0);
    };

    // Long press to pin
    const longPressTimer = useRef(null);

    const handleLongPressStart = (domainId) => {
        longPressTimer.current = setTimeout(() => {
            setDisplayPreference('userSelected', domainId);
        }, 600);
    };

    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Format relative time
    const formatLastPracticed = (isoDate) => {
        if (!isoDate) return 'Never';

        const now = new Date();
        const then = new Date(isoDate);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return then.toLocaleDateString();
    };

    return (
        <div className="w-full transition-all duration-500">
            {/* Simplified header - cymatic pagination glyphs only */}
            <div className="mb-3">
                {/* Cymatic pagination glyphs */}
                <div className="flex items-center justify-center gap-3">
                    {orderedDomains.map((domain, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className="transition-all duration-300"
                            style={{
                                opacity: index === currentIndex ? 1 : 0.4,
                                transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)'
                            }}
                        >
                            {CYMATIC_GLYPHS[domain.id](index === currentIndex)}
                        </button>
                    ))}
                </div>

                {/* Swipe hint - visual chevrons instead of text */}
                {currentIndex === 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-30">
                            <path d="M8 2 L4 6 L8 10" fill="none" stroke="rgba(253,251,245,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-30">
                            <path d="M4 2 L8 6 L4 10" fill="none" stroke="rgba(253,251,245,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Swipeable cards container */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-2xl"
                style={{ touchAction: 'pan-y' }}
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onMouseMove={(e) => handleDragMove(e.clientX)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                onTouchEnd={handleDragEnd}
            >
                <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                        transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                >
                    {orderedDomains.map((domain, index) => {
                        const stats = getDomainStats(domain.id);
                        const isPrimary = index === 0;

                        return (
                            <div
                                key={domain.id}
                                className="w-full flex-shrink-0 px-0 py-2"
                                onMouseDown={() => handleLongPressStart(domain.id)}
                                onMouseUp={handleLongPressEnd}
                                onTouchStart={() => handleLongPressStart(domain.id)}
                                onTouchEnd={handleLongPressEnd}
                            >
                                {/* Stats Card - Three-Layer Hierarchy */}
                                <div
                                    className="relative rounded-3xl overflow-hidden"
                                    style={isLight ? {
                                        border: '2px solid transparent',
                                        backgroundImage: `
                                          linear-gradient(rgba(255, 252, 245, 0.82), rgba(255, 252, 245, 0.82)),
                                          linear-gradient(135deg, #AF8B2C 0%, #D4AF37 25%, #FBF5B7 50%, #D4AF37 75%, #AF8B2C 100%)
                                        `,
                                        backgroundOrigin: 'padding-box, border-box',
                                        backgroundClip: 'padding-box, border-box',
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        boxShadow: `
                                          0 0 0 0.5px #AF8B2C,
                                          inset 1px 1px 0 0.5px rgba(255, 250, 235, 0.9),
                                          0 4px 24px rgba(100, 80, 50, 0.08),
                                          inset 0 1px 0 rgba(255, 255, 255, 0.6)
                                        `
                                    } : {
                                        ...plateauMaterialClear,
                                        border: '2px solid transparent',
                                        backgroundImage: `
                                          linear-gradient(rgba(10, 12, 15, 0.85), rgba(10, 12, 15, 0.85)),
                                          linear-gradient(135deg, #AF8B2C 0%, #D4AF37 25%, #FBF5B7 50%, #D4AF37 75%, #AF8B2C 100%)
                                        `,
                                        backgroundOrigin: 'padding-box, border-box',
                                        backgroundClip: 'padding-box, border-box',
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        boxShadow: `
                                          ${plateauMaterialClear.boxShadow || ''},
                                          0 0 0 0.5px #AF8B2C,
                                          inset 1px 1px 0 0.5px rgba(255, 250, 235, 0.6),
                                          inset 0 0 20px rgba(253, 220, 145, 0.06),
                                          inset 0 1px 0 rgba(253, 220, 145, 0.08)
                                        `
                                    }}
                                >
                                    {/* Wave lines decoration - ambient background */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: `url(${import.meta.env.BASE_URL}stats/wave-lines.png)`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'top center',
                                            backgroundRepeat: 'no-repeat',
                                            opacity: 0.35,
                                            mixBlendMode: 'screen',
                                            maskImage: 'linear-gradient(to bottom, white 0%, white 50%, transparent 70%)',
                                            WebkitMaskImage: 'linear-gradient(to bottom, white 0%, white 50%, transparent 70%)',
                                            zIndex: 1,
                                        }}
                                    />

                                    {/* Noise texture overlay - reduced to 2% */}
                                    <div style={{ ...noiseOverlayStyle, opacity: 0.02, zIndex: 2 }} />

                                    {/* Sheen overlay */}
                                    <div style={{ ...sheenOverlayStyle, zIndex: 2 }} />

                                    {/* Inner ember glow */}
                                    <div style={{ ...innerGlowStyle, zIndex: 2 }} />

                                    {/* Domain header with Metadata on Right */}
                                    <div className="flex items-center justify-between mb-3 px-5 pt-4">
                                        {/* Left: Icon + Label */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl" style={{ color: 'var(--accent-color)' }}>
                                                <Icon name={domain.iconName} size={22} />
                                            </span>
                                            <span
                                                className="text-sm font-semibold"
                                                style={{
                                                    color: 'var(--accent-color)',
                                                    fontFamily: 'var(--font-display)',
                                                    letterSpacing: 'var(--tracking-wide)'
                                                }}
                                            >
                                                {domain.label}
                                            </span>
                                            {userSelectedDomain === domain.id && (
                                                <span className="text-[10px] text-[rgba(253,251,245,0.4)]">📌</span>
                                            )}
                                        </div>

                                        {/* Right: Metadata (Time + Peak) */}
                                        <div className="flex flex-col items-end gap-0.5 text-right">
                                            <div
                                                className="text-[0.55rem] font-light"
                                                style={{
                                                    color: 'rgba(255, 255, 255, 0.50)',
                                                    fontFamily: 'var(--font-ui)',
                                                    lineHeight: '1.2',
                                                }}
                                            >
                                                {formatLastPracticed(stats.lastPracticed)}
                                            </div>
                                            <div
                                                className="text-[0.55rem] font-light"
                                                style={{
                                                    color: 'rgba(255, 255, 255, 0.45)',
                                                    fontFamily: 'var(--font-ui)',
                                                    lineHeight: '1.2',
                                                }}
                                            >
                                                Peak: {Math.max(...(stats.last7Days || [0]))} min
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tier 1: Hero Stats - 2.5rem, bold, golden glow */}
                                    <div className="grid grid-cols-3 gap-4 mb-9 items-end">
                                        <div className="text-center">
                                            <div
                                                className="font-black mb-1"
                                                style={{
                                                    fontSize: '2.4rem',
                                                    lineHeight: '1',
                                                    color: isLight ? 'rgba(140, 100, 50, 0.95)' : '#d4b87a',
                                                    letterSpacing: '-0.04em',
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {stats.totalSessions}
                                            </div>
                                            <div
                                                className="text-[0.65rem] font-bold"
                                                style={{
                                                    color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(255, 255, 255, 0.5)',
                                                    fontFamily: 'var(--font-ui)',
                                                    letterSpacing: '0.2em',
                                                }}
                                            >
                                                SESSIONS
                                            </div>
                                        </div>
                                        {/* MINUTES - THE HEARTBEAT - DRAMATICALLY BRIGHTER */}
                                        <div className="text-center">
                                            <div
                                                className="font-black mb-1"
                                                style={{
                                                    fontSize: '2.8rem',
                                                    lineHeight: '1',
                                                    color: isLight ? 'rgba(120, 80, 40, 1)' : '#fff8e6',
                                                    letterSpacing: '-0.05em',
                                                }}
                                            >
                                                {stats.totalMinutes}
                                            </div>
                                            <div
                                                className="text-[0.7rem] font-bold"
                                                style={{
                                                    color: isLight ? 'rgba(100, 70, 30, 0.95)' : 'rgba(255, 248, 230, 0.95)',
                                                    fontFamily: 'var(--font-ui)',
                                                    letterSpacing: '0.15em',
                                                    textShadow: isLight ? 'none' : '0 0 10px rgba(255, 235, 200, 0.4)',
                                                }}
                                            >
                                                MINUTES
                                            </div>
                                        </div>
                                        {/* HONOR - with micro-outline and 'Character' metadata */}
                                        <div className="text-center">
                                            <div
                                                className="font-black mb-1"
                                                style={{
                                                    fontSize: '2.4rem',
                                                    lineHeight: '1',
                                                    color: isLight ? 'rgba(140, 100, 50, 0.9)' : '#c9a86e',
                                                    letterSpacing: '-0.04em',
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {stats.totalHonor}
                                            </div>
                                            <div
                                                className="text-[0.65rem] font-bold"
                                                style={{
                                                    color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(255, 255, 255, 0.5)',
                                                    fontFamily: 'var(--font-ui)',
                                                    letterSpacing: '0.2em',
                                                }}
                                            >
                                                HONOR
                                            </div>
                                        </div>
                                    </div>

                                    {/* MIDDLE: Curve - The Energetic River (Option 1: Magical Overlap) */}
                                    <div className="relative px-5 -mt-6">
                                        {/* Top fade mask - prevents curve glow from interfering with numbers */}
                                        <div
                                            className="absolute top-0 left-0 right-0 h-8 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(to bottom, rgba(10,10,18,0.85) 0%, rgba(10,10,18,0) 100%)',
                                                zIndex: 10,
                                            }}
                                        />

                                        {/* Semantic label - floats cleanly between numbers and curve */}
                                        <div
                                            className="text-[10px] font-bold mb-4 text-center -mt-5 relative font-mono"
                                            style={{
                                                color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                                                letterSpacing: '0.1em',
                                                zIndex: 11,
                                            }}
                                        >
                                            ⟨ PERFORMANCE.VECTOR ⟩
                                        </div>
                                        {/* Curve container - extends 16px beyond edges for continuous rhythm */}
                                        <div className="relative h-[88px] w-full -mx-4 px-7 overflow-hidden">
                                            <SevenDayTrendCurve last7Days={stats.last7Days || [0, 0, 0, 0, 0, 0, 0]} />
                                        </div>
                                    </div>

                                    {/* LOWER: Timeline - The Stepping Stones */}
                                    {/* Reordered: curve → PEAK → dots → DAYS PRACTICED → weekdays */}
                                    <div className="px-5 pb-[18px] pt-[18px] border-t border-white/5">
                                        {/* Intensity dots with PEAK label above */}
                                        <div className="relative">
                                            {/* Dots row */}
                                            <div className="flex items-center justify-between px-2 relative">
                                                {(() => {
                                                    const days = stats.last7Days || [0, 0, 0, 0, 0, 0, 0];
                                                    const maxMinutes = Math.max(...days);
                                                    const peakIndex = days.indexOf(maxMinutes);

                                                    return days.map((minutes, i) => {
                                                        const isPeakDay = (i === peakIndex && maxMinutes > 0);

                                                        // Base intensity
                                                        const getIntensity = (min, isPeak) => {
                                                            if (min === 0) return {
                                                                bg: 'rgba(255,255,255,0.08)',
                                                                glow: 'none',
                                                                scale: 1
                                                            };
                                                            if (isPeak) return {
                                                                // PEAK DAY: Dynamic halo pulse - matches curve apex
                                                                bg: 'linear-gradient(135deg, rgba(255,220,130,1) 0%, rgba(255,240,180,1) 100%)',
                                                                glow: `
                                                                    0 0 6px rgba(255,220,150,0.95),
                                                                    0 0 14px rgba(255,200,100,0.7),
                                                                    0 0 20px rgba(255,180,80,0.3)
                                                                `,
                                                                scale: 1.5
                                                            };
                                                            if (min < 5) return {
                                                                bg: 'rgba(253,220,145,0.25)',
                                                                glow: '0 0 4px rgba(253,220,145,0.2)',
                                                                scale: 1
                                                            };
                                                            if (min < 15) return {
                                                                bg: 'rgba(253,220,145,0.45)',
                                                                glow: '0 0 5px rgba(253,220,145,0.3)',
                                                                scale: 1
                                                            };
                                                            if (min < 30) return {
                                                                bg: 'rgba(253,220,145,0.65)',
                                                                glow: '0 0 6px rgba(253,220,145,0.4)',
                                                                scale: 1.05
                                                            };
                                                            return {
                                                                bg: 'rgba(253,220,145,0.85)',
                                                                glow: '0 0 8px rgba(253,220,145,0.5)',
                                                                scale: 1.1
                                                            };
                                                        };
                                                        const intensity = getIntensity(minutes, isPeakDay);

                                                        return (
                                                            <div key={i} className="relative">
                                                                {/* GOD RAY: Vertical beam - stops 6px above PEAK label */}
                                                                {isPeakDay && (
                                                                    <div
                                                                        className="absolute bottom-full left-1/2 -translate-x-1/2 w-[1.5px] pointer-events-none"
                                                                        style={{
                                                                            height: '80px', // Shortened - stops above PEAK label
                                                                            bottom: '26px', // Offset to clear PEAK label
                                                                            background: 'linear-gradient(to top, rgba(180,130,60,0) 0%, rgba(200,140,70,0.25) 30%, rgba(220,160,90,0.45) 100%)',
                                                                            boxShadow: '0 0 2px rgba(220,160,90,0.3)',
                                                                            zIndex: 0,
                                                                        }}
                                                                    />
                                                                )}

                                                                {/* PEAK label - 10px above dot center */}
                                                                {isPeakDay && (
                                                                    <div
                                                                        className="absolute left-1/2 -translate-x-1/2 text-[9px] text-amber-200 font-display opacity-80 whitespace-nowrap tracking-wider"
                                                                        style={{ bottom: '18px' }}
                                                                    >
                                                                        ⭐ PEAK
                                                                    </div>
                                                                )}

                                                                <div
                                                                    className="w-2 h-2 rounded-full transition-all duration-300 relative z-10"
                                                                    style={{
                                                                        background: intensity.bg,
                                                                        boxShadow: intensity.glow,
                                                                        transform: `scale(${intensity.scale})`,
                                                                        animation: isPeakDay ? 'peakPulse 2s ease-in-out infinite' : 'none',
                                                                    }}
                                                                    title={`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}: ${minutes} min${isPeakDay ? ' ⭐ PEAK' : ''}`}
                                                                />
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>

                                            {/* DAYS PRACTICED label - 8px below dots */}
                                            <div
                                                className="text-[10px] font-bold text-center mt-2"
                                                style={{
                                                    color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(255, 255, 255, 0.4)',
                                                    fontFamily: 'var(--font-display)',
                                                    letterSpacing: 'var(--tracking-mythic)',
                                                }}
                                            >
                                                DAYS PRACTICED
                                            </div>

                                            {/* Weekday Labels - 6px below DAYS PRACTICED */}
                                            <div className="flex justify-between px-2 mt-1.5 text-[9px] font-display tracking-widest text-[#6b5e43]">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                                    <div key={i} className="w-2 text-center">{day}</div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Debug info - absolute bottom right */}
                                        <div className="absolute bottom-2 right-4 text-[9px] text-[#6b5e43] opacity-50 font-mono">
                                            mock: {stats.sessions}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dishonor Badge - only shows when ratio > 50% and ≥10 practices */}
            <div className="mt-4">
                <DishonorBadge />
            </div>

        </div>
    );
}
