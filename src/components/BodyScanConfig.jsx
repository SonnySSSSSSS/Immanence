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
        tooltip: 'Head & Crown',
        icon: '✨',
        wallpaper: AWARENESS_ASSETS.upper,
        scanIds: ['head'],
        chakraColor: 'rgba(147, 112, 219, 0.5)',
    },
    {
        id: 'middle',
        label: 'MIDDLE',
        tooltip: 'Heart & Solar',
        icon: '💛',
        wallpaper: AWARENESS_ASSETS.middle,
        scanIds: ['chest', 'hands'],
        chakraColor: 'rgba(255, 165, 0, 0.5)',
    },
    {
        id: 'lower',
        label: 'LOWER',
        tooltip: 'Lower Body',
        icon: '🔻',
        wallpaper: AWARENESS_ASSETS.lower,
        scanIds: ['hips', 'feet'],
        chakraColor: 'rgba(220, 20, 60, 0.5)',
    },
    {
        id: 'full',
        label: 'FULL',
        tooltip: 'Full Body',
        icon: '⚡',
        wallpaper: AWARENESS_ASSETS.full,
        scanIds: ['full', 'nadis'],
        chakraColor: 'rgba(212, 175, 55, 0.5)',
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
    const [activeRailId, setActiveRailId] = useState('full');
    
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
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                        border: isSelected
                            ? '2px solid var(--accent-color)'
                            : (isLight ? '2px solid rgba(90,77,60,0.18)' : '2px solid rgba(255,255,255,0.12)'),
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
                    data-testid="region-rail"
                    onWheel={(e) => {
                        // allow trackpad/mouse wheel to scroll the rail horizontally
                        const el = e.currentTarget;
                        if (!el) return;
                        const hasOverflow = el.scrollWidth > el.clientWidth;
                        if (!hasOverflow) return;

                        // If user is wheel-scrolling vertically, translate to horizontal
                        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                            e.preventDefault();
                            el.scrollLeft += e.deltaY;
                        }
                    }}
                    style={{
                        width: '100%',
                        maxWidth: '100%',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '4px 0',
                        marginTop: '10px',
                        marginBottom: '12px',
                        pointerEvents: 'auto',
                        zIndex: 20,
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style>{`
                        [data-testid="region-rail"]::-webkit-scrollbar { display: none; }
                    `}</style>
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
                                    height: '50px',
                                    flex: 1,
                                    padding: '4px 6px',
                                    borderRadius: '14px',
                                    background: isActive ? rail.chakraColor : 'rgba(10,12,14,.35)',
                                    border: isActive ? `2px solid ${rail.chakraColor}` : '1px solid rgba(212,175,55,.18)',
                                    backdropFilter: 'blur(6px)',
                                    cursor: 'pointer',
                                    transition: 'all 200ms ease-out',
                                    boxShadow: isActive
                                        ? `0 0 24px ${rail.chakraColor}, 0 0 12px ${rail.chakraColor}`
                                        : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px',
                                    color: 'rgba(255,255,255,0.92)',
                                    whiteSpace: 'nowrap',
                                }}
                                title={rail.tooltip}
                            >
                                <span style={{ fontSize: '18px', lineHeight: '1' }}>{rail.icon}</span>
                                <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-ui)', opacity: 0.8 }}>{rail.label}</span>
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
                                        ? `0 0 0 1.5px ${rail.chakraColor}, 0 0 12px ${rail.chakraColor}, 0 12px 32px rgba(0,0,0,.4)`
                                        : '0 10px 26px rgba(0,0,0,.25)',
                                    filter: isActive ? 'saturate(1.1) brightness(1.05)' : 'saturate(.9) brightness(.9)',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                }}
                            >
                                {/* Background wallpaper - show region-specific image */}
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
                                        background: isActive
                                            ? `linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.45) 55%, ${rail.chakraColor} 100%)`
                                            : 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.65) 100%)',
                                    }}
                                />

                                {/* Inner frame (chakra colored on active) */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        boxShadow: `
                                            inset 0 0 0 1px rgba(255,255,255,.10)
                                            ${isActive ? `, inset 0 0 0 3px ${rail.chakraColor}, inset 0 0 16px ${rail.chakraColor}` : ''}
                                        `,
                                        borderRadius: '18px',
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
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
