// src/components/dashboard/QuickDashboardTiles.jsx
// Pure dashboard tiles display component
// Renders 5 key metrics: minutes, sessions, days, completion%, on-time%
// Plus hubCard variant with SVG infographics

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAvatarV3State } from '../../state/avatarV3Store.js';

/**
 * Render a single dashboard tile
 * @param {Object} tile - { id, label, value, subvalue?, unit? }
 * @param {boolean} isLight - Light mode flag
 */
function DashboardTile({ tile, isLight }) {
    const { id, label, value, unit } = tile;

    // Format value based on tile type
    let displayValue = value;
    if (value === null || value === undefined) {
        displayValue = '—';
    } else if (typeof value === 'number') {
        // For percent tiles, show with one decimal max
        if (id === 'completion_rate' || id === 'on_time_rate') {
            displayValue = `${Math.round(value)}%`;
        } else {
            // For count tiles, ensure integer
            displayValue = Math.round(value);
        }
    }

    return (
        <div
            className="rounded-lg p-3 backdrop-blur-sm"
            style={{
                background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isLight
                    ? 'rgba(200, 160, 100, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)'}`,
                flex: '1 1 auto',
                minWidth: '120px',
            }}
        >
            <div
                className="type-label mb-1.5"
                style={{
                    color: isLight
                        ? 'rgba(100, 80, 60, 0.6)'
                        : 'rgba(255, 255, 255, 0.5)',
                }}
            >
                {label}
            </div>
            <div
                className="type-metric text-[20px]"
                style={{
                    color: isLight
                        ? 'rgba(45, 35, 25, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    lineHeight: '1.2',
                }}
            >
                {displayValue}
            </div>
            {unit && (
                <div
                    className="type-caption text-[9px] mt-0.5"
                    style={{
                        color: isLight
                            ? 'rgba(100, 80, 60, 0.5)'
                            : 'rgba(255, 255, 255, 0.4)',
                    }}
                >
                    {unit}
                </div>
            )}
        </div>
    );
}

/**
 * Sessions infographic: horizontal bar + number
 */
function SessionsModule({ value, isLight, isSanctuary = false }) {

    const readabilityStyle = isSanctuary && !isLight ? {
        background: 'rgba(0, 0, 0, 0.24)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: '12px',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    } : {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="type-metric text-[20px]" style={{ color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)', ...readabilityStyle }}>
                {Math.round(value)}
            </div>
            <div className="type-label text-[9px]" style={{ color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                Sessions
            </div>
        </div>
    );
}

/**
 * Active Days infographic: dot strip (14 dots) + number
 */
function ActiveDaysModule({ value, isLight, isSanctuary = false }) {

    const readabilityStyle = isSanctuary && !isLight ? {
        background: 'rgba(0, 0, 0, 0.24)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: '12px',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    } : {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="type-metric text-[20px]" style={{ color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)', ...readabilityStyle }}>
                {Math.round(value)}
            </div>
            <div className="type-label text-[9px]" style={{ color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                Active Days
            </div>
        </div>
    );
}

/**
 * Donut ring infographic for rates (completion/on-time)
 */
function RateRingModule({ value, label, isLight, isSanctuary = false }) {
    const r = 20;
    const circumference = 2 * Math.PI * r;
    const progress = value === null ? 0 : Math.max(0, Math.min(value / 100, 1));
    const dashLength = progress * circumference;

    const ringColor = isLight ? 'rgba(100, 80, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    const fillColor = isLight
        ? (value === null ? ringColor : 'rgba(100, 80, 60, 0.8)')
        : (value === null ? ringColor : 'rgba(76, 175, 80, 0.8)');

    const displayValue = value === null ? '—' : `${Math.round(value)}%`;

    // Sanctuary mode: put percent inside circle, keep label below
    if (isSanctuary && !isLight) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible', position: 'absolute' }}>
                        {/* Background ring */}
                        <circle
                            cx="30"
                            cy="30"
                            r={r}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="4"
                        />
                        {/* Progress ring */}
                        {value !== null && (
                            <circle
                                cx="30"
                                cy="30"
                                r={r}
                                fill="none"
                                stroke={fillColor}
                                strokeWidth="4"
                                strokeDasharray={`${dashLength} ${circumference}`}
                                strokeLinecap="round"
                                transform="rotate(-90 30 30)"
                            />
                        )}
                    </svg>
                    {/* Percent overlay inside circle */}
                    <div className="type-metric text-[16px]" style={{ position: 'relative', zIndex: 1, color: 'rgba(255, 255, 255, 0.95)', textAlign: 'center' }}>
                        {displayValue}
                    </div>
                </div>
                <div className="type-label text-[9px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {label}
                </div>
            </div>
        );
    }

    // Hearth mode / Light mode: keep percent below circle
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
                {/* Background ring */}
                <circle
                    cx="30"
                    cy="30"
                    r={r}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="4"
                />
                {/* Progress ring */}
                {value !== null && (
                    <circle
                        cx="30"
                        cy="30"
                        r={r}
                        fill="none"
                        stroke={fillColor}
                        strokeWidth="4"
                        strokeDasharray={`${dashLength} ${circumference}`}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                    />
                )}
            </svg>
            <div className="type-metric text-[16px]" style={{ color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                {displayValue}
            </div>
            <div className="type-label text-[9px]" style={{ color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                {label}
            </div>
        </div>
    );
}

/**
 * QuickDashboardTiles — Read-only dashboard summary
 * @param {Object} props
 * @param {Object} props.tiles - Tiles object from getQuickDashboardTiles()
 *                                 Shape: { minutes_total, sessions_total, days_active, completion_rate, on_time_rate }
 * @param {string} props.variant - 'default' (5 tiles), 'hub' (4 KPI compact), or 'hubCard' (infographic card)
 * @param {Function} props.onOpenDetails - Optional callback when details button clicked (hub variants only)
 * @param {boolean} props.isSanctuary - Sanctuary mode flag for layout adjustments
 */
export function QuickDashboardTiles({
    tiles = {},
    variant = 'default',
    onOpenDetails = null,
    metricOrder = null,
    isStudent = false,
    isSanctuary = false,
    devCardActive = null,
    devCardCarouselId = null,
}) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

    // Get theme for accent color (matches DailyPracticeCard border styling)
    const theme = useTheme();
    const primaryHex = theme?.accent?.primary || '#4ade80';

    // Get current avatar stage for wallpaper
    const { stage: avatarStage } = useAvatarV3State();
    const stageLower = String(avatarStage || 'seedling').toLowerCase();
    const bgAsset = isLight ? 'ancient_relic_focus.png' : `card_bg_comet_${stageLower}.png`;

    if (!tiles || Object.keys(tiles).length === 0) {
        return null;
    }

    // Define tile labels
    const tileLabels = {
        minutes_total: 'Total Minutes',
        sessions_total: 'Sessions',
        days_active: 'Active Days',
        completion_rate: 'Completion Rate',
        on_time_rate: 'On-Time Rate',
    };

    // Tile order based on variant
    const tileOrder = (variant === 'hub' || variant === 'hubCard')
        ? ['sessions_total', 'days_active', 'completion_rate', 'on_time_rate']
        : ['minutes_total', 'sessions_total', 'days_active', 'completion_rate', 'on_time_rate'];

    // Build ordered tiles with labels from tiles object
    const orderedTiles = tileOrder.map(id => ({
        id,
        label: tileLabels[id] || id,
        value: tiles[id],
        unit: id === 'minutes_total' ? 'min' : '',
    }));

    if (variant === 'hubCard') {
        const shouldUseStudentHubOrder =
            isStudent === true &&
            Array.isArray(metricOrder) &&
            metricOrder.includes('completion_rate') &&
            metricOrder.includes('on_time_rate');

        return (
            <div
                className={`im-card ${isFirefox ? '' : 'glassCardShadowWrap'}`}
                data-card="true"
                data-card-id="homeHubProgress"
                data-card-active={import.meta.env.DEV && typeof devCardActive === 'boolean' ? String(devCardActive) : undefined}
                data-card-carousel={import.meta.env.DEV && devCardCarouselId ? String(devCardCarouselId) : undefined}
                style={{
                    position: 'relative',
                    marginBottom: '8px',
                    borderRadius: '24px',
                    ...(isFirefox ? {
                        boxShadow: isLight
                            ? '0 14px 34px rgba(0,0,0,0.12), 0 6px 14px rgba(0,0,0,0.08)'
                            : '0 18px 40px rgba(0,0,0,0.28), 0 6px 14px rgba(0,0,0,0.18), 0 0 18px rgba(95,255,170,0.08)',
                    } : {
                        '--glass-radius': '24px',
                        '--glass-shadow-1': isLight ? '0 14px 34px rgba(0,0,0,0.12)' : '0 18px 40px rgba(0,0,0,0.28)',
                        '--glass-shadow-2': isLight ? '0 6px 14px rgba(0,0,0,0.08)' : '0 6px 14px rgba(0,0,0,0.18)',
                        '--glass-shadow-aura': isLight ? '0 0 0 rgba(0,0,0,0)' : '0 0 18px rgba(95,255,170,0.08)',
                    }),
                }}
            >
                <div
                    className={isFirefox ? 'relative overflow-hidden' : 'glassCardShell'}
                    style={{
                        position: 'relative',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '12px',
                        ...(isFirefox ? {
                            background: isLight
                                ? '#faf6ee'
                                : 'rgba(0, 0, 0, 0.73)',
                            boxShadow: `
                                inset 0 0 0 1px ${isLight ? `${primaryHex}30` : `${primaryHex}40`},
                                0 0 0 1px ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)'}
                            `.trim().replace(/\\s+/g, ' '),
                        } : {
                            background: 'transparent',
                            '--glass-radius': '24px',
                            '--glass-bg': isLight
                                ? '#faf6ee'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 55%), rgba(0, 0, 0, 0.73)',
                            '--glass-blur': isLight ? '0px' : '16px',
                            '--glass-stroke': isLight ? `${primaryHex}30` : `${primaryHex}40`,
                            '--glass-outline': isLight ? 'rgba(0,0,0,0.06)' : 'rgba(25, 30, 35, 0.45)',
                        }),
                    }}
                >
                {/* Wallpaper Background Layer - matches DailyPracticeCard */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${bgAsset})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: isLight ? 0.21 : 0.36,
                        mixBlendMode: isLight ? 'multiply' : 'screen',
                        filter: 'none',
                        borderRadius: '24px',
                        overflow: 'hidden',
                    }}
                />

                {/* Gradient Overlay for text legibility */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: isLight
                            ? 'linear-gradient(180deg, rgba(250, 246, 238, 0.42) 0%, rgba(250, 246, 238, 0.62) 100%)'
                            : 'linear-gradient(180deg, rgba(20, 15, 25, 0.48) 0%, rgba(20, 15, 25, 0.72) 100%)',
                        borderRadius: '24px',
                    }}
                />

                {/* Canvas Grain Texture (Light mode only) */}
                {isLight && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/canvas_grain.png)`,
                            backgroundSize: '200px',
                            mixBlendMode: 'multiply',
                            borderRadius: '24px',
                        }}
                    />
                )}

                {/* Content layer */}
                <div className="glassCardContent relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                {/* 2x2 infographic grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                    }}
                >
                    {shouldUseStudentHubOrder ? (
                        <>
                            <RateRingModule value={tiles.completion_rate ?? null} label="Completion" isLight={isLight} isSanctuary={isSanctuary} />
                            <RateRingModule value={tiles.on_time_rate ?? null} label="On-Time" isLight={isLight} isSanctuary={isSanctuary} />
                            <SessionsModule value={tiles.sessions_total || 0} isLight={isLight} isSanctuary={isSanctuary} />
                            <ActiveDaysModule value={tiles.days_active || 0} isLight={isLight} isSanctuary={isSanctuary} />
                        </>
                    ) : (
                        <>
                            <SessionsModule value={tiles.sessions_total || 0} isLight={isLight} isSanctuary={isSanctuary} />
                            <ActiveDaysModule value={tiles.days_active || 0} isLight={isLight} isSanctuary={isSanctuary} />
                            <RateRingModule value={tiles.completion_rate ?? null} label="Completion" isLight={isLight} isSanctuary={isSanctuary} />
                            <RateRingModule value={tiles.on_time_rate ?? null} label="On-Time" isLight={isLight} isSanctuary={isSanctuary} />
                        </>
                    )}
                </div>

                {/* Details button - matches START SETUP styling */}
                {onOpenDetails && (
                    <button
                        onClick={onOpenDetails}
                        className="type-label px-4 py-2 rounded-full font-bold transition-all hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                            color: '#fff',
                            boxShadow: '0 3px 10px var(--accent-30)',
                            width: '100%',
                        }}
                    >
                        View Details
                    </button>
                )}
                </div>
                </div>
            </div>
        );
    }

    // Hub variant: compact 4-KPI card with details button
    if (variant === 'hub') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '8px',
                    marginBottom: '8px',
                }}
            >
                {/* 4-tile compact grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                    }}
                >
                    {orderedTiles.map(tile => (
                        <DashboardTile key={tile.id} tile={tile} isLight={isLight} />
                    ))}
                </div>

                {/* Details button */}
                {onOpenDetails && (
                    <button
                        onClick={onOpenDetails}
                        className="type-label text-[11px]"
                        style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            background: isLight
                                ? 'rgba(100, 80, 60, 0.2)'
                                : 'rgba(255, 255, 255, 0.1)',
                            color: isLight
                                ? 'rgba(45, 35, 25, 0.8)'
                                : 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            transition: 'all 150ms ease-out',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = isLight
                                ? 'rgba(100, 80, 60, 0.3)'
                                : 'rgba(255, 255, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = isLight
                                ? 'rgba(100, 80, 60, 0.2)'
                                : 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        View Details
                    </button>
                )}
            </div>
        );
    }

    // Default variant: 5-tile horizontal layout
    return (
        <div
            style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '16px',
            }}
        >
            {orderedTiles.map(tile => (
                <DashboardTile key={tile.id} tile={tile} isLight={isLight} />
            ))}
        </div>
    );
}

export default QuickDashboardTiles;
