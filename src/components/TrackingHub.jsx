// src/components/TrackingHub.jsx
// Swipeable stats dashboard showing domain-specific progress

import React, { useState, useRef, useEffect } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { DishonorBadge } from './DishonorBadge.jsx';
import { Icon } from '../icons/Icon.jsx';
import SevenDayTrendCurve from './SevenDayTrendCurve.jsx';
import { plateauMaterial, plateauMaterialElevated, plateauMaterialClear, noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from '../styles/cardMaterial.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from '../utils/dynamicLighting.js';

// Domain configuration - using icon names for Icon component
const DOMAINS = [
    { id: 'breathwork', label: 'Breathwork', iconName: 'breathwork' },
    { id: 'visualization', label: 'Visualization', iconName: 'visualization' },
    { id: 'wisdom', label: 'Wisdom', iconName: 'wisdom' }
];

// Cymatic glyphs - sacred geometry for each domain
const CYMATIC_GLYPHS = {
    // BREATHWORK (Wave) - Concentric circles: rhythmic flow of life-force
    breathwork: (isActive, isLight) => (
        <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="7" fill="none"
                stroke={isActive ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                strokeWidth={isActive ? "1.2" : "0.8"}
                strokeDasharray={isActive ? "none" : "2 2"}
                opacity={isActive ? "0.4" : "0.5"} />
            <circle cx="10" cy="10" r="5" fill="none"
                stroke={isActive ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.3)')}
                strokeWidth={isActive ? "1.5" : "1"}
                opacity={isActive ? "0.7" : "0.6"} />
            <circle cx="10" cy="10" r="2.5"
                fill={isActive ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.2)' : 'rgba(253,251,245,0.15)')}
                opacity={isActive ? "0.6" : "0.4"} />
        </svg>
    ),

    // VISUALIZATION (Sword) - Hexagon: precision of directed consciousness
    visualization: (isActive, isLight) => (
        <svg width="20" height="20" viewBox="0 0 20 20">
            <path
                d="M10 2 L16.33 6 L16.33 14 L10 18 L3.67 14 L3.67 6 Z"
                fill="none"
                stroke={isActive ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                strokeWidth={isActive ? "1.5" : "1"}
                strokeDasharray={isActive ? "none" : "1.5 1.5"}
                style={{
                    transition: 'all 0.4s ease',
                    transform: isActive ? 'rotate(30deg)' : 'rotate(0deg)',
                    transformOrigin: 'center',
                    opacity: isActive ? 1 : 0.6
                }}
            />
            {isActive && (
                <circle cx="10" cy="10" r="1.5" fill="var(--accent-color)" opacity="0.5" />
            )}
        </svg>
    ),

    // WISDOM (Mirror) - Square: stable foundation of recognition
    wisdom: (isActive, isLight) => (
        <svg width="20" height="20" viewBox="0 0 20 20">
            <rect x="5" y="5" width="10" height="10"
                fill="none"
                stroke={isActive ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                strokeWidth={isActive ? "1.5" : "1"}
                strokeDasharray={isActive ? "none" : "3 1"}
                opacity={isActive ? 1 : 0.6} />
            <rect x="7.5" y="7.5" width="5" height="5"
                fill={isActive ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.15)' : 'rgba(253,251,245,0.1)')}
                opacity={isActive ? "0.3" : "0.25"} />
        </svg>
    )
};

/**
 * Individual stats card component with dynamic lighting and mythic aesthetics
 */
function StatsCard({ domain, stats, isLight }) {
    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const avatarCenter = getAvatarCenter();
            const angle = calculateGradientAngle(rect, avatarCenter);
            setGradientAngle(angle);
        }
    }, [isLight]);

    // Format relative time (original utility)
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
        <div
            ref={cardRef}
            className="relative rounded-3xl overflow-hidden"
            style={isLight ? {
                border: '2px solid transparent',
                backgroundImage: `
                  linear-gradient(rgba(255, 252, 245, 0.82), rgba(255, 252, 245, 0.82)),
                  ${getDynamicGoldGradient(gradientAngle, true)}
                `,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: `
                  0 0 0 0.5px #AF8B2C,
                  inset -1px -1px 0 0.5px rgba(255, 250, 235, 0.8),
                  inset 1px 1px 0 0.5px rgba(101, 67, 33, 0.6),
                  0 4px 24px rgba(100, 80, 50, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6)
                `
            } : {
                ...plateauMaterialClear,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: `
                  ${plateauMaterialClear.boxShadow || ''},
                  inset 0 0 20px rgba(253, 220, 145, 0.08),
                  inset 0 1px 0 rgba(253, 220, 145, 0.1)
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

            {/* Texture overlays */}
            <div style={{ ...noiseOverlayStyle, opacity: 0.02, zIndex: 2 }} />
            <div style={{ ...sheenOverlayStyle, zIndex: 2 }} />
            <div style={{ ...innerGlowStyle, zIndex: 2 }} />

            {/* Subtle parchment texture overlay (LIGHT MODE ONLY) */}
            {isLight && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}textures/parchment-subtle.png)`,
                        backgroundSize: '300px 300px',
                        backgroundRepeat: 'repeat',
                        opacity: 0.08,
                        mixBlendMode: 'multiply',
                        zIndex: 2,
                    }}
                />
            )}

            {/* Domain header with Metadata on Right */}
            <div className="flex items-center justify-between mb-3 px-5 pt-4 relative z-10">
                {/* Left: Icon + Label */}
                <div className="flex items-center gap-2">
                    <span className="text-xl" style={{ color: isLight ? 'rgba(140, 100, 50, 0.9)' : 'var(--accent-color)' }}>
                        <Icon name={domain.iconName} size={22} />
                    </span>
                    <span
                        className="text-sm font-semibold"
                        style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.9)' : 'white',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase'
                        }}
                    >
                        {domain.label}
                    </span>
                </div>

                {/* Right: Metadata (Last Practiced + Peak) */}
                <div className="flex flex-col items-end gap-0.5 text-right opacity-60">
                    <div
                        className="text-[9px] font-light uppercase tracking-wider"
                        style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(253, 251, 245, 0.9)',
                            fontFamily: 'var(--font-ui)',
                            lineHeight: '1',
                        }}
                    >
                        {formatLastPracticed(stats.lastPracticed)}
                    </div>
                    <div
                        className="text-[9px] font-light uppercase tracking-wider"
                        style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(253, 251, 245, 0.7)',
                            fontFamily: 'var(--font-ui)',
                            lineHeight: '1.2',
                        }}
                    >
                        Peak: {Math.max(...(stats.last7Days || [0]))} min
                    </div>
                </div>
            </div>

            {/* Tier 1: Hero Stats - Proportional Grid */}
            <div className="grid grid-cols-3 gap-2 mb-9 items-end px-5 relative z-10">
                {/* SESSIONS */}
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
                        {stats.totalSessions || 0}
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

                {/* MINUTES - THE HEARTBEAT - STANDS OUT */}
                <div className="text-center">
                    <div
                        className="font-black mb-1"
                        style={{
                            fontSize: '2.8rem',
                            lineHeight: '1',
                            color: isLight ? 'rgba(120, 80, 40, 1)' : '#fff8e6',
                            letterSpacing: '-0.05em',
                            textShadow: isLight ? 'none' : '0 0 12px rgba(255, 235, 200, 0.45)',
                        }}
                    >
                        {stats.totalMinutes || 0}
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

                {/* HONOR */}
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
                        {stats.totalHonor || 0}
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

            {/* MIDDLE: Curve - Performance Vector */}
            <div className="relative px-5 -mt-6 z-10">
                {/* Semantic label */}
                <div
                    className="text-[10px] font-bold mb-4 text-center -mt-5 relative font-mono opacity-60"
                    style={{
                        color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                        letterSpacing: '0.15em',
                        zIndex: 11,
                    }}
                >
                    ⟨ PERFORMANCE.VECTOR ⟩
                </div>

                {/* Curve container - elevated height */}
                <div className="relative h-[88px] w-full -mx-4 px-7 overflow-hidden">
                    <SevenDayTrendCurve last7Days={stats.last7Days || [0, 0, 0, 0, 0, 0, 0]} />
                </div>
            </div>

            {/* LOWER: Intensity Dots & Weekdays */}
            <div className="px-5 pb-[18px] pt-[18px] border-t border-white/5 relative z-10">
                <div className="relative">
                    {/* Intensity dots with PEAK markers */}
                    <div className="flex items-center justify-between px-2 relative mb-2">
                        {(() => {
                            const days = stats.last7Days || [0, 0, 0, 0, 0, 0, 0];
                            const maxMinutes = Math.max(...days);
                            const peakIndex = days.indexOf(maxMinutes);

                            return days.map((minutes, i) => {
                                const isPeakDay = (i === peakIndex && maxMinutes > 0);

                                // Base intensity logic
                                const getIntensity = (min, isPeak) => {
                                    if (min === 0) return { bg: 'rgba(255,255,255,0.08)', glow: 'none', scale: 1 };
                                    if (isPeak) return {
                                        bg: 'linear-gradient(135deg, rgba(255,220,130,1) 0%, rgba(255,240,180,1) 100%)',
                                        glow: '0 0 12px rgba(255,200,100,0.6)',
                                        scale: 1.4
                                    };
                                    if (min < 15) return { bg: 'rgba(253,220,145,0.3)', glow: 'none', scale: 1 };
                                    return { bg: 'rgba(253,220,145,0.7)', glow: '0 0 6px rgba(253,220,145,0.3)', scale: 1.1 };
                                };
                                const intensity = getIntensity(minutes, isPeakDay);

                                return (
                                    <div key={i} className="relative">
                                        {isPeakDay && (
                                            <div
                                                className="absolute left-1/2 -translate-x-1/2 text-[8px] text-amber-200 font-display opacity-80 whitespace-nowrap tracking-wider"
                                                style={{ bottom: '16px' }}
                                            >
                                                ⭐ PEAK
                                            </div>
                                        )}
                                        <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{
                                                background: intensity.bg,
                                                boxShadow: intensity.glow,
                                                transform: `scale(${intensity.scale})`
                                            }}
                                        />
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div
                        className="text-[9px] font-bold text-center opacity-40 mb-1.5"
                        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.2em' }}
                    >
                        DAYS PRACTICED
                    </div>

                    <div className="flex justify-between px-2 text-[8px] font-display tracking-widest opacity-30">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                            <div key={i} className="w-1.5 text-center">{day}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Domain-specific insights (positioned at bottom) */}
            <div className="px-5 pb-3">
                <DomainInsights domain={domain.id} stats={stats} />
            </div>
        </div>
    );
}

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
                                opacity: index === currentIndex ? 1 : 0.75,
                                transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)'
                            }}
                        >
                            {CYMATIC_GLYPHS[domain.id](index === currentIndex, isLight)}
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
                    {orderedDomains.map((domain) => {
                        const stats = getDomainStats(domain.id);
                        return (
                            <div key={domain.id} className="w-full flex-shrink-0 px-0 py-2">
                                <StatsCard domain={domain} stats={stats} isLight={isLight} />
                            </div>
                        );
                    })}                </div>
            </div>

            {/* Dishonor Badge - only shows when ratio > 50% and ≥10 practices */}
            <div className="mt-4">
                <DishonorBadge />
            </div>

        </div>
    );
}
