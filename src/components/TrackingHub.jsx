// src/components/TrackingHub.jsx
// Swipeable stats dashboard showing domain-specific progress

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useApplicationStore } from '../state/applicationStore.js';
import { DishonorBadge } from './DishonorBadge.jsx';
import { Icon } from '../icons/Icon.jsx';
import SevenDayTrendCurve from './SevenDayTrendCurve.jsx';
import { noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from '../styles/cardMaterial.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { calculateGradientAngle, getAvatarCenter } from '../utils/dynamicLighting.js';
import { SessionHistoryView } from './SessionHistoryView.jsx';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { ARCHIVE_TABS } from './tracking/archiveLinkConstants.js';
import { useUiStore } from '../state/uiStore.js';
import {
    getInitialHeatmapOpen,
    getTrackingArchiveTab,
    getTrackingHubCoordinatorState,
    TRACKING_T_REF,
} from './trackingHubLogic.js';

const REACTED_COLOR = '#b45309';
const CHOSE_COLOR = '#0d9488';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '');
    if (clean.length !== 6) return { r: 128, g: 128, b: 128 };
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return {
        r: Number.isFinite(r) ? r : 128,
        g: Number.isFinite(g) ? g : 128,
        b: Number.isFinite(b) ? b : 128,
    };
}

function interpolateHexColor(start, end, t) {
    const s = hexToRgb(start);
    const e = hexToRgb(end);
    const ratio = clamp(t, 0, 1);
    const r = Math.round(s.r + ((e.r - s.r) * ratio));
    const g = Math.round(s.g + ((e.g - s.g) * ratio));
    const b = Math.round(s.b + ((e.b - s.b) * ratio));
    return { r, g, b };
}

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
    const theme = useTheme();
    
    // Calculate hue rotation to match stage accent
    // Green orbs are ~120deg hue, so we rotate from that baseline
    const primaryColor = theme?.accent?.primary || '#4ade80';
    const baseHue = 120; // Green baseline of the orbs/progress bar
    // Parse hex to get approximate hue
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
        const d = max - min;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    const targetHue = Math.round(h * 360);
    const stageHueRotate = targetHue - baseHue;

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const avatarCenter = getAvatarCenter();
            calculateGradientAngle(rect, avatarCenter);
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
            className="relative overflow-hidden"
            style={{
                backgroundImage: 'none',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: 'none',
                boxShadow: 'none',
                // Exaggerated organic parchment edges
                borderRadius: '28px 35px 30px 33px',
                transform: 'rotate(-0.3deg)',
                filter: isLight
                    ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.12)) drop-shadow(0 10px 20px rgba(0,0,0,0.06))'
                    : 'drop-shadow(0 4px 12px rgba(0,0,0,0.4)) drop-shadow(0 12px 28px rgba(0,0,0,0.25))'
            }}
        >
            {/* Parchment image already includes all background decoration */}
            
            {/* Texture overlays */}
            <div style={{ ...noiseOverlayStyle, opacity: 0.02, zIndex: 2 }} />
            <div style={{ ...sheenOverlayStyle, zIndex: 2 }} />
            <div style={{ ...innerGlowStyle, zIndex: 2 }} />

            {/* Subtle parchment texture overlay (LIGHT MODE ONLY) */}
            {isLight && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/textures/parchment-subtle.webp)`,
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
                        Peak (7d): {Math.max(...(stats.last7Days || [0]))} min
                    </div>
                </div>
            </div>

            {/* Tier 1: Hero Stats - Proportional Grid */}
            <div className="grid grid-cols-3 gap-2 mb-9 items-end px-5 relative z-10">
                {/* SESSIONS */}
                <div className="text-center">
                    <div
                        className="font-semibold mb-1"
                        style={{
                            fontSize: '2.4rem',
                            lineHeight: '1',
                            color: isLight ? 'rgba(140, 100, 50, 0.95)' : '#d4b87a',
                            letterSpacing: '0.02em',
                            opacity: 0.9,
                            fontFamily: 'var(--font-display)',
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
                        PRACTICE SESSIONS
                    </div>
                </div>

                {/* MINUTES - THE HEARTBEAT - STANDS OUT */}
                <div className="text-center">
                    <div
                        className="font-bold mb-1"
                        style={{
                            fontSize: '2.8rem',
                            lineHeight: '1',
                            color: isLight ? 'rgba(120, 80, 40, 1)' : '#fff8e6',
                            letterSpacing: '0.03em',
                            textShadow: isLight ? 'none' : '0 0 12px rgba(255, 235, 200, 0.45)',
                            fontFamily: 'var(--font-display)',
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
                        ALL ACTIVITY MIN
                    </div>
                </div>

                {/* HONOR */}
                <div className="text-center">
                    <div
                        className="font-semibold mb-1"
                        style={{
                            fontSize: '2.4rem',
                            lineHeight: '1',
                            color: isLight ? 'rgba(140, 100, 50, 0.9)' : '#c9a86e',
                            letterSpacing: '0.02em',
                            opacity: 0.9,
                            fontFamily: 'var(--font-display)',
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
                        HONOR LOGS
                    </div>
                </div>
            </div>

            {/* MIDDLE: Curve - Performance Vector */}
            <div className="relative px-5 -mt-6 z-10">
                {/* Semantic label */}
                <div
                    className="text-[10px] font-bold mb-2 text-center -mt-5 relative font-mono opacity-60"
                    style={{
                        color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                        letterSpacing: '0.15em',
                        zIndex: 11,
                    }}
                >
                    ⟨ PERFORMANCE.VECTOR ⟩
                </div>
                <div
                    className="text-[9px] font-bold mb-2 text-center relative font-mono opacity-40"
                    style={{
                        color: isLight ? 'rgba(90, 77, 60, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                        letterSpacing: '0.2em',
                        zIndex: 11,
                    }}
                >
                    LAST 7 DAYS
                </div>

                {/* Curve container - elevated height */}
                <div className="relative h-[88px] w-full -mx-4 px-7 overflow-hidden">
                    <SevenDayTrendCurve last7Days={stats.last7Days || [0, 0, 0, 0, 0, 0, 0]} />
                </div>
            </div>

            {/* Regiment Progress Section - Shortened to avoid feather overlap */}
            <div className="px-5 mb-4 relative z-10">
                <div className="flex items-center justify-between mb-1" style={{ width: '140px' }}>
                    <span
                        className="text-[9px] font-bold tracking-widest opacity-40 uppercase"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Regiment Progress
                    </span>
                    <span
                        className="text-[9px] font-bold opacity-60"
                        style={{ color: isLight ? 'var(--gold-deep)' : 'var(--accent-color)' }}
                    >
                        {Math.min(100, Math.floor(((stats.totalMinutes || 0) / 100) * 100))}%
                    </span>
                </div>
                <div
                    className="h-[14px] rounded-full relative overflow-hidden"
                    style={{
                        width: '140px',
                        background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        border: isLight ? '0.5px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                    }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                            width: `${Math.min(100, ((stats.totalMinutes || 0) / 100) * 100)}%`,
                            backgroundImage: `url(/stats/tracking_card/progress_texture.webp)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow: isLight ? 'none' : '0 0 10px rgba(212, 184, 122, 0.4)',
                            filter: `hue-rotate(${stageHueRotate}deg)`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                </div>
            </div>

            {/* LOWER: Intensity Orbs & Weekdays */}
            <div className="px-5 pb-[18px] pt-2 border-t border-white/5 relative z-10">
                <div className="relative pt-4 pb-2">
                    {/* Flowing Wave Ribbon Background */}
                    <div
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 pointer-events-none opacity-60 mix-blend-screen"
                        style={{
                            backgroundImage: `url(/stats/tracking_card/wave_ribbon.webp)`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            filter: isLight ? 'brightness(0.8) contrast(1.2)' : 'none'
                        }}
                    />

                    {/* Dual-Visual Orbs: Background = Intensity, Foreground = Precision */}
                    <div className="flex items-center justify-between px-2 relative z-20">
                        {(() => {
                            const days = stats.last7Days || [0, 0, 0, 0, 0, 0, 0];
                            const maxMinutes = Math.max(...days);
                            const peakIndex = days.indexOf(maxMinutes);

                            // Precision proxy: use avgAccuracy as a domain-level quality metric
                            // TODO: Track per-day precision when instrumentation is available
                            const avgAccuracy = stats.avgAccuracy || null;

                            return days.map((minutes, i) => {
                                const isPeakDay = (i === peakIndex && maxMinutes > 0);

                                let orbImg = 'orb_empty.png';
                                let scale = 1.0;
                                let glow = 'none';

                                if (isPeakDay) {
                                    orbImg = 'orb_peak.png';
                                    scale = 1.2;
                                    glow = '0 0 15px rgba(255, 240, 180, 0.4)';
                                } else if (minutes > 30) {
                                    orbImg = 'orb_high.png';
                                    scale = 1.1;
                                } else if (minutes >= 15) {
                                    orbImg = 'orb_medium.png';
                                    scale = 1.0;
                                } else if (minutes > 0) {
                                    orbImg = 'orb_low.png';
                                    scale = 0.9;
                                }

                                // Precision indicator logic (only show if practiced that day)
                                let precisionIcon = null;
                                if (minutes > 0 && avgAccuracy !== null) {
                                    if (avgAccuracy >= 90) {
                                        // High precision: Bullseye with high-contrast background
                                        precisionIcon = (
                                            <svg className="absolute inset-0 pointer-events-none" width="40" height="40" viewBox="0 0 40 40">
                                                {/* High-contrast background circle */}
                                                <circle cx="20" cy="20" r="13" fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)'} />
                                                {/* Bullseye */}
                                                <circle cx="20" cy="20" r="5" fill={isLight ? 'rgba(180, 120, 40, 1)' : 'rgba(255, 220, 120, 1)'} />
                                                <circle cx="20" cy="20" r="8.5" fill="none" stroke={isLight ? 'rgba(180, 120, 40, 0.9)' : 'rgba(255, 220, 120, 0.9)'} strokeWidth="3" />
                                                <circle cx="20" cy="20" r="12" fill="none" stroke={isLight ? 'rgba(180, 120, 40, 0.6)' : 'rgba(255, 220, 120, 0.6)'} strokeWidth="2" />
                                            </svg>
                                        );
                                    } else if (avgAccuracy >= 70) {
                                        // Medium precision: Crosshair with high-contrast background
                                        precisionIcon = (
                                            <svg className="absolute inset-0 pointer-events-none" width="40" height="40" viewBox="0 0 40 40">
                                                {/* High-contrast background circle */}
                                                <circle cx="20" cy="20" r="13" fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)'} />
                                                {/* Crosshair */}
                                                <line x1="20" y1="8" x2="20" y2="32" stroke={isLight ? 'rgba(180, 120, 40, 1)' : 'rgba(255, 220, 120, 1)'} strokeWidth="3" strokeLinecap="round" />
                                                <line x1="8" y1="20" x2="32" y2="20" stroke={isLight ? 'rgba(180, 120, 40, 1)' : 'rgba(255, 220, 120, 1)'} strokeWidth="3" strokeLinecap="round" />
                                                <circle cx="20" cy="20" r="11" fill="none" stroke={isLight ? 'rgba(180, 120, 40, 0.6)' : 'rgba(255, 220, 120, 0.6)'} strokeWidth="2" />
                                            </svg>
                                        );
                                    } else if (avgAccuracy >= 50) {
                                        // Low precision: Partial ring with high-contrast background
                                        precisionIcon = (
                                            <svg className="absolute inset-0 pointer-events-none" width="40" height="40" viewBox="0 0 40 40">
                                                {/* High-contrast background circle */}
                                                <circle cx="20" cy="20" r="13" fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)'} />
                                                {/* Dashed ring */}
                                                <circle cx="20" cy="20" r="11" fill="none" stroke={isLight ? 'rgba(180, 120, 40, 0.8)' : 'rgba(255, 220, 120, 0.8)'} strokeWidth="3.5" strokeDasharray="10 5" opacity="1" />
                                            </svg>
                                        );
                                    }
                                    // Below 50%: no precision indicator (just shows intensity orb)
                                }

                                return (
                                    <div key={i} className="relative flex flex-col items-center">
                                        {/* Background: Intensity Orb */}
                                        <div
                                            className="w-10 h-10 bg-contain bg-center bg-no-repeat transition-transform duration-500"
                                            style={{
                                                backgroundImage: `url(${import.meta.env.BASE_URL}stats/tracking_card/${orbImg})`,
                                                transform: `scale(${scale})`,
                                                filter: `${isLight && minutes === 0 ? 'grayscale(0.5) opacity(0.3)' : ''} ${stageHueRotate ? `hue-rotate(${stageHueRotate}deg)` : ''}`.trim() || 'none',
                                                boxShadow: glow
                                            }}
                                        >
                                            {/* Foreground: Precision Overlay */}
                                            {precisionIcon}
                                        </div>
                                        {isPeakDay && (
                                            <div
                                                className="absolute -top-4 text-[7px] font-bold text-amber-200/80 uppercase tracking-tighter"
                                                style={{ fontFamily: 'var(--font-display)' }}
                                            >
                                                Peak
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div className="flex justify-between px-4 text-[8px] font-display tracking-[0.3em] opacity-30 mt-2">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                            <div key={i} className="w-6 text-center">{day}</div>
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

function getHeatmapCellStyle(cell, isLight) {
    if (!cell || cell.total === 0) {
        return {
            backgroundColor: isLight ? 'rgba(90, 77, 60, 0.08)' : 'rgba(253, 251, 245, 0.08)',
            border: isLight ? '1px solid rgba(90, 77, 60, 0.1)' : '1px solid rgba(253, 251, 245, 0.12)',
            boxShadow: 'none',
        };
    }

    const mixed = interpolateHexColor(REACTED_COLOR, CHOSE_COLOR, cell.dominance);
    const alpha = clamp(0.15 + (cell.intensity * 0.85), 0, 1);
    return {
        backgroundColor: `rgba(${mixed.r}, ${mixed.g}, ${mixed.b}, ${alpha})`,
        border: isLight ? '1px solid rgba(90, 77, 60, 0.2)' : '1px solid rgba(253, 251, 245, 0.18)',
        boxShadow: cell.intensity > 0.7 ? `0 0 8px rgba(${mixed.r}, ${mixed.g}, ${mixed.b}, 0.35)` : 'none',
    };
}

export function TrackingHub({ streakInfo: propStreakInfo }) {
    const {
        getDomainStats,
        getPrimaryDomain
    } = useProgressStore();
    const trackerItemsRaw = useApplicationStore(s => s.trackerConfig?.items || []);
    const trackerByDate = useApplicationStore(s => s.trackerDaily?.byDate || {});
    const addTrackerItem = useApplicationStore(s => s.addTrackerItem);
    const updateTrackerItemLabel = useApplicationStore(s => s.updateTrackerItemLabel);
    const reorderTrackerItems = useApplicationStore(s => s.reorderTrackerItems);
    const removeTrackerItem = useApplicationStore(s => s.removeTrackerItem);
    const logTrackerCount = useApplicationStore(s => s.logTrackerCount);
    const getTrackerRange = useApplicationStore(s => s.getTrackerRange);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [showHistory, setShowHistory] = useState(false);
    const [historyTab, setHistoryTab] = useState(ARCHIVE_TABS.ALL);
    const [isHeatmapOpen, setIsHeatmapOpen] = useState(() => getInitialHeatmapOpen(trackerItemsRaw));
    const [newItemLabel, setNewItemLabel] = useState('');
    const [itemLabelDrafts, setItemLabelDrafts] = useState({});
    const autoOpenedFromItemsRef = useRef(false);
    const heatmapAnchorRef = useRef(null);
    const {
        trackerItems,
        todayDateKey,
        trackerRange,
        primaryDomainObj,
    } = useMemo(() => getTrackingHubCoordinatorState({
        trackerItemsRaw,
        getTrackerRange,
        getPrimaryDomain,
    }), [getPrimaryDomain, getTrackerRange, trackerItemsRaw]);
    void trackerByDate;
    const stats = getDomainStats(primaryDomainObj.id);

    // Derived data - use prop if provided, otherwise get from store
    void propStreakInfo;

    useEffect(() => {
        if (!autoOpenedFromItemsRef.current && trackerItems.length > 0) {
            autoOpenedFromItemsRef.current = true;
            const frame = requestAnimationFrame(() => {
                setIsHeatmapOpen(true);
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [trackerItems.length]);

    useEffect(() => {
        const launchCtx = useUiStore.getState().consumeTrackerLaunchContext();
        if (launchCtx?.target !== 'applicationHeatmap') return;
        const frame = requestAnimationFrame(() => {
            setIsHeatmapOpen(true);
            heatmapAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const commitItemLabel = (itemId) => {
        const nextLabel = String(itemLabelDrafts[itemId] ?? '').trim();
        const currentItem = trackerItems.find((item) => item.id === itemId);
        if (!currentItem) return;
        if (!nextLabel) {
            setItemLabelDrafts((prev) => ({ ...prev, [itemId]: currentItem.label }));
            return;
        }
        if (nextLabel !== currentItem.label) {
            updateTrackerItemLabel(itemId, nextLabel);
        }
    };

    const moveTrackerItem = (itemId, direction) => {
        const ids = trackerItems.map((item) => item.id);
        const currentIndex = ids.indexOf(itemId);
        const nextIndex = currentIndex + direction;
        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
        [ids[currentIndex], ids[nextIndex]] = [ids[nextIndex], ids[currentIndex]];
        reorderTrackerItems(ids);
    };

    const handleAddTrackerItem = () => {
        const label = String(newItemLabel || '').trim();
        if (!label) return;
        const created = addTrackerItem(label);
        if (created) {
            setNewItemLabel('');
            setIsHeatmapOpen(true);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header with semantic label */}
            <div
                className="text-[10px] mb-4 uppercase tracking-[0.15em] text-center"
                style={{
                    color: isLight ? 'var(--light-accent)' : 'var(--accent-color)',
                    textShadow: isLight ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.5)',
                }}
            >
                ⟨ PRACTICE HUB ⟩
            </div>

            {/* Single domain stats card */}
            <StatsCard domain={primaryDomainObj} stats={stats} isLight={isLight} />

            <div
                ref={heatmapAnchorRef}
                className="mt-6 rounded-2xl p-4"
                style={{
                    background: isLight ? 'rgba(255, 250, 240, 0.8)' : 'rgba(253, 251, 245, 0.04)',
                    border: isLight ? '1px solid rgba(90, 77, 60, 0.15)' : '1px solid rgba(253, 251, 245, 0.1)',
                }}
            >
                <button
                    type="button"
                    onClick={() => setIsHeatmapOpen((open) => !open)}
                    className="w-full flex items-center justify-between"
                >
                    <div
                        className="text-[10px] uppercase font-black tracking-[0.2em]"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.85)' : 'rgba(253, 251, 245, 0.85)' }}
                    >
                        Application Awareness Wins
                    </div>
                    <div
                        className="text-xs font-black"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.7)' : 'rgba(253, 251, 245, 0.7)' }}
                    >
                        {isHeatmapOpen ? '▾' : '▸'}
                    </div>
                </button>

                {isHeatmapOpen && (
                    <div className="mt-4 space-y-3">
                        <div
                            className="text-[8px] uppercase tracking-[0.15em]"
                            style={{ color: isLight ? 'rgba(60, 45, 35, 0.55)' : 'rgba(253, 251, 245, 0.55)' }}
                        >
                            Last 84 local days · Awareness Wins · Reacted vs Chose · T_REF={TRACKING_T_REF}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newItemLabel}
                                onChange={(e) => setNewItemLabel(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddTrackerItem();
                                }}
                                disabled={trackerItems.length >= 4}
                                placeholder={trackerItems.length >= 4 ? 'Max 4 tracker items' : 'Add tracker item'}
                                className="flex-1 rounded-lg px-3 py-2 text-[11px] outline-none"
                                style={{
                                    background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(10, 15, 25, 0.6)',
                                    border: isLight ? '1px solid rgba(90, 77, 60, 0.22)' : '1px solid rgba(253,251,245,0.12)',
                                    color: isLight ? 'rgba(60,45,35,0.9)' : 'rgba(253,251,245,0.9)',
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddTrackerItem}
                                disabled={trackerItems.length >= 4}
                                className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-40"
                                style={{
                                    background: isLight ? 'rgba(90, 77, 60, 0.12)' : 'rgba(253,251,245,0.12)',
                                    color: isLight ? 'rgba(60,45,35,0.85)' : 'rgba(253,251,245,0.85)',
                                }}
                            >
                                Add
                            </button>
                        </div>

                        {trackerItems.length === 0 && (
                            <div
                                className="rounded-xl px-3 py-4 text-[11px]"
                                style={{
                                    background: isLight ? 'rgba(90, 77, 60, 0.08)' : 'rgba(253, 251, 245, 0.08)',
                                    color: isLight ? 'rgba(60, 45, 35, 0.65)' : 'rgba(253, 251, 245, 0.65)',
                                }}
                            >
                                Add a tracker item to begin.
                            </div>
                        )}

                        {trackerItems.length > 0 && (
                            <div className="overflow-x-auto pb-2">
                                <div className="min-w-max space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <div
                                            className="w-52 shrink-0 text-[8px] uppercase tracking-[0.15em]"
                                            style={{ color: isLight ? 'rgba(60,45,35,0.5)' : 'rgba(253,251,245,0.5)' }}
                                        >
                                            Item / Today Controls
                                        </div>
                                        <div
                                            className="grid gap-1"
                                            style={{ gridTemplateColumns: `repeat(${trackerRange.dates.length}, minmax(10px, 10px))` }}
                                        >
                                            {trackerRange.dates.map((dateKey, idx) => (
                                                <div
                                                    key={`date-${dateKey}`}
                                                    className="h-4 text-[7px] flex items-center justify-center"
                                                    style={{ color: isLight ? 'rgba(60,45,35,0.45)' : 'rgba(253,251,245,0.45)' }}
                                                >
                                                    {idx % 7 === 0 ? dateKey.slice(5).replace('-', '/') : ''}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {trackerRange.rows.map((row, rowIndex) => {
                                        const isFirst = rowIndex === 0;
                                        const isLast = rowIndex === trackerRange.rows.length - 1;
                                        const draftValue = itemLabelDrafts[row.itemId] ?? row.label;
                                        return (
                                            <div key={row.itemId} className="flex gap-2 items-start">
                                                <div
                                                    className="w-52 shrink-0 rounded-xl p-2"
                                                    style={{
                                                        background: isLight ? 'rgba(90, 77, 60, 0.06)' : 'rgba(253, 251, 245, 0.06)',
                                                        border: isLight ? '1px solid rgba(90,77,60,0.12)' : '1px solid rgba(253,251,245,0.1)',
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        value={draftValue}
                                                        onChange={(e) => setItemLabelDrafts((prev) => ({ ...prev, [row.itemId]: e.target.value }))}
                                                        onBlur={() => commitItemLabel(row.itemId)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                commitItemLabel(row.itemId);
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                        className="w-full bg-transparent text-[11px] font-semibold outline-none"
                                                        style={{ color: isLight ? 'rgba(60,45,35,0.9)' : 'rgba(253,251,245,0.9)' }}
                                                    />
                                                    <div className="mt-2 flex flex-wrap items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => logTrackerCount({ itemId: row.itemId, dateKey: todayDateKey, reactedDelta: 1 })}
                                                            className="px-2 py-1 rounded text-[9px] font-black"
                                                            style={{
                                                                background: 'rgba(180, 83, 9, 0.2)',
                                                                color: isLight ? 'rgba(120, 60, 20, 0.95)' : 'rgba(255, 225, 190, 0.95)',
                                                            }}
                                                        >
                                                            +Reacted
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => logTrackerCount({ itemId: row.itemId, dateKey: todayDateKey, choseDelta: 1 })}
                                                            className="px-2 py-1 rounded text-[9px] font-black"
                                                            style={{
                                                                background: 'rgba(13, 148, 136, 0.22)',
                                                                color: isLight ? 'rgba(10, 95, 85, 0.95)' : 'rgba(198, 252, 247, 0.95)',
                                                            }}
                                                        >
                                                            +Chose
                                                        </button>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            disabled={isFirst}
                                                            onClick={() => moveTrackerItem(row.itemId, -1)}
                                                            className="px-1.5 py-0.5 rounded text-[9px] disabled:opacity-35"
                                                            style={{
                                                                background: isLight ? 'rgba(90,77,60,0.15)' : 'rgba(253,251,245,0.15)',
                                                                color: isLight ? 'rgba(60,45,35,0.75)' : 'rgba(253,251,245,0.75)',
                                                            }}
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isLast}
                                                            onClick={() => moveTrackerItem(row.itemId, 1)}
                                                            className="px-1.5 py-0.5 rounded text-[9px] disabled:opacity-35"
                                                            style={{
                                                                background: isLight ? 'rgba(90,77,60,0.15)' : 'rgba(253,251,245,0.15)',
                                                                color: isLight ? 'rgba(60,45,35,0.75)' : 'rgba(253,251,245,0.75)',
                                                            }}
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTrackerItem(row.itemId)}
                                                            className="px-1.5 py-0.5 rounded text-[9px]"
                                                            style={{
                                                                background: isLight ? 'rgba(120, 40, 40, 0.15)' : 'rgba(255, 120, 120, 0.15)',
                                                                color: isLight ? 'rgba(120,40,40,0.9)' : 'rgba(255,195,195,0.95)',
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                                <div
                                                    className="grid gap-1"
                                                    style={{ gridTemplateColumns: `repeat(${row.cells.length}, minmax(10px, 10px))` }}
                                                >
                                                    {row.cells.map((cell) => (
                                                        <div
                                                            key={`${row.itemId}-${cell.dateKey}`}
                                                            className="w-[10px] h-[10px] rounded-[2px]"
                                                            style={getHeatmapCellStyle(cell, isLight)}
                                                            title={`${row.label} · ${cell.dateKey} · Reacted ${cell.reacted} · Chose ${cell.chose}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div
                            className="text-[8px] uppercase tracking-[0.15em]"
                            style={{ color: isLight ? 'rgba(60,45,35,0.45)' : 'rgba(253,251,245,0.45)' }}
                        >
                            Max Daily Total: {trackerRange.maxTotal} · T_REF: {trackerRange.tRef}
                        </div>
                    </div>
                )}
            </div>

            {/* History Button */}
            <button
                onClick={() => {
                    setHistoryTab(getTrackingArchiveTab(primaryDomainObj.id));
                    setShowHistory(true);
                }}
                className="mt-6 w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)',
                    border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div
                    className="text-[10px] uppercase font-black tracking-[0.2em]"
                    style={{ color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(253,251,245,0.5)' }}
                >
                    Tracking Archive
                </div>
            </button>

            {/* Overlay View */}
            <AnimatePresence>
                {showHistory && (
                    <SessionHistoryView
                        onClose={() => setShowHistory(false)}
                        initialTab={historyTab}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
