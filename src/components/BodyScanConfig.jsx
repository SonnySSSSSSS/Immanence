// src/components/BodyScanConfig.jsx
// Configuration panel for Body Scan type selection
// Shows categorized body scan options with swipeable region rail cards

import React, { useRef, useState } from 'react';
import { getAllBodyScans } from '../data/bodyScanPrompts.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { AWARENESS_ASSETS } from '../config/awarenessAssets.js';

// Define region rails (4 swipeable cards)
const REGION_RAILS = [
    {
        id: 'upper',
        label: 'UPPER',
        subtitle: 'Head & Crown',
        icon: '👁️',
        wallpaper: AWARENESS_ASSETS.upper,
        scanIds: ['head'],
    },
    {
        id: 'middle',
        label: 'MIDDLE',
        subtitle: 'Heart & Hands',
        icon: '💛',
        wallpaper: AWARENESS_ASSETS.middle,
        scanIds: ['heart', 'hands'],
    },
    {
        id: 'lower',
        label: 'LOWER',
        subtitle: 'Root & Feet',
        icon: '🔻',
        wallpaper: AWARENESS_ASSETS.lower,
        scanIds: ['root', 'feet'],
    },
    {
        id: 'full',
        label: 'FULL',
        subtitle: 'Complete Integration',
        icon: '⚡',
        wallpaper: AWARENESS_ASSETS.full,
        scanIds: ['full', 'nadis'],
    },
];

export function BodyScanConfig({
    scanType = 'full',
    setScanType,
    isLight: isLightProp,
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = isLightProp ?? (colorScheme === 'light');

    // Drag-scroll refs (from SensorySession pattern)
    const scrollContainerRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const scrollStartRef = useRef(0);

    // Card refs for smooth scroll-into-view
    const cardRefs = useRef({});

    // Active rail state
    const allScans = getAllBodyScans();
    const [activeRailId, setActiveRailId] = useState('upper');
    
    // Get scans for active rail
    const activeRail = REGION_RAILS.find(r => r.id === activeRailId);
    const activeScans = activeRail 
        ? allScans.filter(s => activeRail.scanIds.includes(s.id))
        : [];

    const textColors = {
        primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.9)',
        secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.7)',
        muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.4)',
    };

    // Drag-scroll handlers (from SensorySession)
    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        isDraggingRef.current = true;
        dragStartXRef.current = e.pageX;
        scrollStartRef.current = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const dx = e.pageX - dragStartXRef.current;
        scrollContainerRef.current.scrollLeft = scrollStartRef.current - dx;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    // Touch handlers
    const handleTouchStart = (e) => {
        if (!scrollContainerRef.current) return;
        isDraggingRef.current = true;
        dragStartXRef.current = e.touches[0].pageX;
        scrollStartRef.current = scrollContainerRef.current.scrollLeft;
    };

    const handleTouchMove = (e) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        const dx = e.touches[0].pageX - dragStartXRef.current;
        scrollContainerRef.current.scrollLeft = scrollStartRef.current - dx;
    };

    const handleTouchEnd = () => {
        isDraggingRef.current = false;
    };

    const renderScanOption = (scan) => {
        const isSelected = scanType === scan.id;
        
        return (
            <button
                key={scan.id}
                onClick={() => setScanType?.(scan.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                    background: isSelected
                        ? (isLight ? 'rgba(160,120,60,0.12)' : 'rgba(255,147,0,0.12)')
                        : 'transparent',
                    border: isSelected
                        ? (isLight ? '1px solid rgba(160,120,60,0.35)' : '1px solid rgba(255,147,0,0.35)')
                        : '1px solid transparent',
                }}
            >
                {/* Radio indicator */}
                <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                        border: isSelected
                            ? '2px solid var(--accent-color)'
                            : (isLight ? '2px solid rgba(90,77,60,0.3)' : '2px solid rgba(255,255,255,0.2)'),
                        background: isSelected ? 'var(--accent-color)' : 'transparent',
                    }}
                >
                    {isSelected && (
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: isLight ? '#fff' : '#000' }}
                        />
                    )}
                </div>

                {/* Icon */}
                <span className="text-lg flex-shrink-0">{scan.icon}</span>

                {/* Label */}
                <span
                    className="font-medium text-sm"
                    style={{
                        fontFamily: 'var(--font-display)',
                        color: isSelected ? textColors.primary : textColors.secondary,
                    }}
                >
                    {scan.name}
                </span>
            </button>
        );
    };

    return (
        <div className="body-scan-config">
            {/* Header */}
            <div
                className="mb-3 text-center"
                style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-mythic)',
                    textTransform: 'uppercase',
                    color: textColors.muted,
                }}
            >
                Body Scan Region
            </div>

            {/* Swipeable Region Rail Cards + Vertical Rail */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                {/* Region rail (docked) */}
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '10px',
                        marginBottom: '12px',
                        pointerEvents: 'auto',
                        zIndex: 5,
                    }}
                >
                    {REGION_RAILS.map((rail) => {
                        const isActive = activeRailId === rail.id;
                        return (
                            <button
                                key={`rail-${rail.id}`}
                                onClick={() => {
                                    setActiveRailId(rail.id);
                                    setTimeout(() => {
                                        const card = document.querySelector(`[data-rail-id="${rail.id}"]`);
                                        if (card) {
                                            card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                        }
                                    }, 0);
                                }}
                                style={{
                                    height: '44px',
                                    minWidth: '84px',
                                    padding: '0 10px',
                                    borderRadius: '14px',
                                    background: 'rgba(10,12,14,.35)',
                                    border: isActive ? '1.5px solid rgba(212,175,55,.65)' : '1px solid rgba(212,175,55,.18)',
                                    backdropFilter: 'blur(6px)',
                                    cursor: 'pointer',
                                    transition: 'all 200ms ease-out',
                                    boxShadow: isActive ? '0 0 18px rgba(212,175,55,.22)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    color: 'rgba(255,255,255,0.92)',
                                }}
                                title={rail.label}
                            >
                                <span style={{ fontSize: '16px', lineHeight: '1' }}>{rail.icon}</span>
                                <span
                                    style={{
                                        fontSize: '12px',
                                        letterSpacing: '0.14em',
                                        textTransform: 'uppercase',
                                        opacity: isActive ? 1 : 0.88,
                                    }}
                                >
                                    {rail.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 3-card peek layout with scroll snap */}
                <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="regionRailRow flex overflow-x-auto"
                    style={{
                        cursor: 'grab',
                        display: 'flex',
                        gap: '14px',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        padding: '8px 18px 6px 18px',
                        paddingRight: '110px',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {REGION_RAILS.map(rail => {
                        const isActive = activeRailId === rail.id;
                        return (
                            <button
                                key={rail.id}
                                data-rail-id={rail.id}
                                ref={(el) => { if (el && !cardRefs.current[rail.id]) cardRefs.current[rail.id] = el; }}
                                onClick={() => setActiveRailId(rail.id)}
                                className="relative overflow-hidden transition-all duration-300 flex-shrink-0"
                                style={{
                                    minWidth: '230px',
                                    height: '240px',
                                    borderRadius: '18px',
                                    scrollSnapAlign: 'center',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: isActive
                                        ? '0 0 0 2px rgba(212,175,55,.45), 0 8px 26px rgba(0,0,0,.35)'
                                        : '0 10px 26px rgba(0,0,0,.25)',
                                    filter: isActive ? 'saturate(1) brightness(1)' : 'saturate(.9) brightness(.9)',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                }}
                            >
                                {/* Background wallpaper */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `url(${rail.wallpaper})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                                
                                {/* Dark vignette overlay */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.65) 100%)',
                                    }}
                                />

                                {/* Inner frame (subtle on non-active, gold on active) */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        boxShadow: `
                                            inset 0 0 0 1px rgba(255,255,255,.10)
                                            ${isActive ? ', inset 0 0 0 2px rgba(212,175,55,.18)' : ''}
                                        `,
                                        borderRadius: '18px',
                                    }}
                                />

                                {/* Label content */}
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center"
                                    style={{
                                        padding: '18px 16px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '22px',
                                            fontWeight: 700,
                                            letterSpacing: '0.16em',
                                            textTransform: 'uppercase',
                                            textShadow: '0 2px 12px rgba(0,0,0,.65)',
                                            color: 'rgba(255,255,255,0.98)',
                                            lineHeight: '1.1',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        {rail.label}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '12px',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            color: 'rgba(255,255,255,0.85)',
                                            opacity: 0.85,
                                            lineHeight: '1.2',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {rail.subtitle}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dots indicator */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                }}
            >
                {REGION_RAILS.map(rail => {
                    const isActive = activeRailId === rail.id;
                    return (
                        <button
                            key={`dot-${rail.id}`}
                            onClick={() => {
                                setActiveRailId(rail.id);
                                requestAnimationFrame(() => {
                                    const el = cardRefs.current[rail.id];
                                    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                });
                            }}
                            style={{
                                width: isActive ? '16px' : '6px',
                                height: '6px',
                                borderRadius: '999px',
                                background: isActive ? 'rgba(212,175,55,.9)' : 'rgba(212,175,55,.35)',
                                transition: 'all 200ms ease-out',
                                cursor: 'pointer',
                                border: 'none',
                                padding: 0,
                                opacity: isActive ? 1 : 0.6,
                            }}
                            aria-label={`Jump to ${rail.label}`}
                        />
                    );
                })}
            </div>

            {/* Options for selected rail */}
            <div
                style={{
                    borderRadius: '16px',
                    padding: '12px 8px',
                    background: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(18,18,28,0.45)',
                    border: isLight ? '1px solid rgba(160,120,60,0.15)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.06)' : '0 8px 24px rgba(0,0,0,0.2)',
                }}
            >
                <div className="flex flex-col gap-1">
                    {activeScans.map(renderScanOption)}
                </div>
            </div>
        </div>
    );
}
