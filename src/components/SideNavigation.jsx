// src/components/SideNavigation.jsx
import React from "react";
import { useDisplayModeStore } from "../state/displayModeStore";

/**
 * SideNavigation Component - "Cymatic Arc" Pattern
 * 
 * Positions 4 circular navigation buttons along a curved arc at the BOTTOM
 * of the avatar (smile curve). The arc remains static while the rune ring spins.
 * 
 * Features:
 * - Mathematical arc positioning for perfect curve
 * - Layered CSS shadows for bioluminescent glow (GPU-accelerated)
 * - Specular shimmer animation using CSS transforms
 * - Subtle SVG arc connector for unified instrument look
 */
export function SideNavigation({ onNavigate, className = "" }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Arc configuration
    const radius = 160; // Distance from center to button positions
    const centerX = 0; // Relative to container center
    const centerY = 0;
    const buttonSize = 90; // Diameter of each button

    // Angles for BOTTOM arc distribution (in degrees)
    // Bottom arc from left to right (210° to 330° = bottom half circle, smile curve)
    // 0° = right, 90° = bottom, 180° = left, 270° = top
    const angles = [150, 120, 60, 30]; // Bottom arc - PRACTICE, WISDOM, APPLICATION, NAVIGATION (left to right)

    const navigationItems = [
        {
            key: 'practice',
            label: 'PRACTICE',
            angle: angles[0], // 210° (bottom-left)
            image: isLight
                ? `${import.meta.env.BASE_URL}modes/mode-practice.png`
                : `${import.meta.env.BASE_URL}modes/darkmode-practice.png`,
        },
        {
            key: 'wisdom',
            label: 'WISDOM',
            angle: angles[1], // 240° (left of bottom-center)
            image: isLight
                ? `${import.meta.env.BASE_URL}modes/mode-wisdom.png`
                : `${import.meta.env.BASE_URL}modes/darkmode-wisdom.png`,
        },
        {
            key: 'application',
            label: 'APPLICATION',
            angle: angles[2], // 270° (bottom-center)
            image: isLight
                ? `${import.meta.env.BASE_URL}modes/mode-application.png`
                : `${import.meta.env.BASE_URL}modes/darkmode-application.png`,
        },
        {
            key: 'navigation',
            label: 'NAVIGATION',
            angle: angles[3], // 300° (bottom-right)
            image: isLight
                ? `${import.meta.env.BASE_URL}modes/mode-navigation.png`
                : `${import.meta.env.BASE_URL}modes/darkmode-navigation.png`,
        }
    ];

    const handleClick = (key) => {
        if (typeof onNavigate === 'function') {
            onNavigate(key);
        }
    };

    // Calculate position for each button on the arc
    const getArcPosition = (angleDeg) => {
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);
        return { x, y };
    };

    // AAA-quality layered glow (GPU-accelerated)
    const getGlowShadow = (isHovered = false) => {
        const baseColor = isLight ? '175, 139, 44' : '139, 92, 246';
        const intensity = isHovered ? 1.5 : 1;

        return `
            0 0 ${2 * intensity}px rgba(${baseColor}, ${0.8 * intensity}),
            0 0 ${15 * intensity}px rgba(${baseColor}, ${0.4 * intensity}),
            0 0 ${45 * intensity}px rgba(${baseColor}, ${0.1 * intensity})
        `;
    };

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ zIndex: 150 }}>
            {/* SVG Arc Connector - subtle line connecting the buttons */}
            <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
                viewBox="-250 -250 500 500"
            >
                <path
                    d={`M ${radius * Math.cos((angles[0] * Math.PI) / 180)} ${radius * Math.sin((angles[0] * Math.PI) / 180)} 
                        A ${radius} ${radius} 0 0 1 ${radius * Math.cos((angles[3] * Math.PI) / 180)} ${radius * Math.sin((angles[3] * Math.PI) / 180)}`}
                    fill="none"
                    stroke={isLight ? 'rgba(175, 139, 44, 0.3)' : 'rgba(255, 255, 255, 0.25)'}
                    strokeWidth="1.5"
                />
            </svg>

            {/* Navigation Buttons */}
            {navigationItems.map((item) => {
                const pos = getArcPosition(item.angle);

                return (
                    <div
                        key={item.key}
                        className="absolute pointer-events-auto"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => handleClick(item.key)}
                            className="group relative overflow-hidden im-nav-pill"
                            data-nav-pill-id={`bottom:${item.key}`}
                            style={{
                                width: `${buttonSize}px`,
                                height: `${buttonSize}px`,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                border: isLight
                                    ? '2px solid rgba(175, 139, 44, 0.4)'
                                    : '2px solid rgba(255, 255, 255, 0.2)',
                                background: isLight
                                    ? 'linear-gradient(135deg, rgba(255, 250, 235, 0.95) 0%, rgba(253, 248, 230, 0.9) 100%)'
                                    : 'linear-gradient(135deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                                boxShadow: getGlowShadow(false),
                                padding: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.08)';
                                e.currentTarget.style.boxShadow = getGlowShadow(true);
                                e.currentTarget.style.borderColor = isLight
                                    ? 'rgba(175, 139, 44, 0.7)'
                                    : 'rgba(139, 92, 246, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = getGlowShadow(false);
                                e.currentTarget.style.borderColor = isLight
                                    ? 'rgba(175, 139, 44, 0.4)'
                                    : 'rgba(255, 255, 255, 0.2)';
                            }}
                            aria-label={item.label}
                        >
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    backgroundImage: `url(${item.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '50%',
                                    opacity: 0.9,
                                    mixBlendMode: isLight ? 'multiply' : 'normal',
                                }}
                            />
                            {/* Label overlay */}
                            <div
                                className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-1.5"
                                style={{
                                    background: isLight
                                        ? 'linear-gradient(to top, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 70%, transparent 100%)'
                                        : 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)',
                                    borderBottomLeftRadius: '50%',
                                    borderBottomRightRadius: '50%',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '8px',
                                        fontWeight: '700',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: isLight ? 'var(--light-accent)' : 'rgba(253, 251, 245, 0.95)',
                                        textShadow: isLight
                                            ? '0 1px 2px rgba(255, 255, 255, 0.8)'
                                            : '0 1px 3px rgba(0, 0, 0, 0.9)',
                                        userSelect: 'none',
                                    }}
                                >
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    </div>
                );
            })}

            {/* CSS Animation for Shimmer */}
            <style>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%) rotate(45deg);
                    }
                    100% {
                        transform: translateX(100%) rotate(45deg);
                    }
                }
            `}</style>
        </div>
    );
}

export default SideNavigation;
