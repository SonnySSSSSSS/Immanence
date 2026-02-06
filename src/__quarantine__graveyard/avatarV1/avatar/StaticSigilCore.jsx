// src/components/avatar/StaticSigilCore.jsx
// Inner sigil core component with stage-aware styling

import React from "react";

export function StaticSigilCore({ stage = "flame", path = null, showCore = true, attention = 'vigilance', variationIndex = 0, hasVariations = false, isPracticing = false, isLight = false, useNewAvatars = false }) {
    const stageLower = stage.toLowerCase();

    const stageColors = {
        'seedling': '#4ade80',
        'ember': '#f97316',
        'flame': '#fcd34d',
        'beacon': '#22d3ee',
        'stellar': '#a78bfa',
    };
    const accentColor = stageColors[stageLower] || '#fcd34d';

    let src;
    if (showCore || !path) {
        src = `${import.meta.env.BASE_URL}avatars/${stageLower}-core.png`;
    } else if (attention && attention !== 'none') {
        const pathLower = path.toLowerCase();
        const attentionLower = attention.toLowerCase();

        if (useNewAvatars) {
            // New naming: avatar-{stage}-{path}-{attention}_0000{n}_.png
            const variationSuffix = `_0000${variationIndex + 1}_`;
            src = `${import.meta.env.BASE_URL}avatars/avatar-${stageLower}-${pathLower}-${attentionLower}${variationSuffix}.png`;
        } else {
            // Old naming: {Stage}-{Path}.png
            const stageCapitalized = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
            const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1).toLowerCase();
            src = `${import.meta.env.BASE_URL}avatars/${stageCapitalized}-${pathCapitalized}.png`;
        }
    } else {
        // Fallback: old naming
        const stageCapitalized = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
        const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1).toLowerCase();
        src = `${import.meta.env.BASE_URL}avatars/${stageCapitalized}-${pathCapitalized}.png`;
    }

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div
                className="absolute pointer-events-none"
                style={{
                    width: "45%",
                    height: "45%",
                    borderRadius: "9999px",
                    background: `conic-gradient(from 0deg, transparent 0%, var(--accent-10) 15%, transparent 30%, var(--accent-10) 45%, transparent 60%, var(--accent-10) 75%, transparent 90%)`,
                    animation: "whirlpool 90s linear infinite",
                    animationPlayState: isPracticing ? 'paused' : 'running',
                    opacity: 0.3,  // Toned down from 0.5 for cleaner look
                }}
            />
            {/* Cyan/teal outer halo - energy "leaks" into frame - DARK MODE ONLY */}
            {!isLight && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: "85%",
                        height: "85%",
                        borderRadius: "9999px",
                        background: `radial-gradient(circle, rgba(220, 170, 90, 0.55) 0%, rgba(200, 150, 70, 0.32) 45%, transparent 75%)`,
                        filter: "blur(55px)",
                        zIndex: 7,
                    }}
                />
            )}
            {/* Warm gold halo for light mode */}
            {isLight && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: "60%",
                        height: "60%",
                        borderRadius: "9999px",
                        background: `radial-gradient(circle, rgba(200, 160, 110, 0.2) 0%, rgba(180, 140, 90, 0.1) 50%, transparent 75%)`,
                        filter: "blur(30px)",
                        zIndex: 7,
                    }}
                />
            )}
            {/* Gem backlight - subtle glow behind the jewel in light mode */}
            {isLight && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: "53%",
                        height: "53%",
                        borderRadius: "9999px",
                        background: `radial-gradient(circle, rgba(200, 160, 110, 0.4) 0%, rgba(180, 140, 90, 0.25) 40%, transparent 70%)`,
                        filter: "blur(20px)",
                        zIndex: 7.5,
                    }}
                />
            )}
            {/* Separation ring - transparent/light-gold for light mode to allow radiance through, black for dark mode - UPDATED 2026-01-01 */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: "52%",
                    height: "52%",
                    borderRadius: "9999px",
                    background: isLight ? "rgba(245, 240, 220, 0.4)" : "#000000",
                    zIndex: 8,
                }}
            />
            {/* Avatar container - scaled to 52.8% (48% + 10%) for black ring separation */}
            <div
                className={`relative pointer-events-none select-none ${isLight ? 'light-orb-rotate' : 'dark-orb-rotate'}`}
                style={{
                    width: "52.8%",  // Scaled to create thin black ring separation (48% * 1.1)
                    height: "52.8%",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    animationPlayState: isPracticing ? 'paused' : 'running',
                    // Glow: teal for dark, gold for light
                    boxShadow: isLight
                        ? `0 0 20px 8px rgba(200, 160, 110, 0.35), 0 0 40px 15px rgba(180, 140, 90, 0.2)`
                        : `0 0 30px 16px rgba(220, 170, 90, 0.55), 0 0 90px 40px rgba(190, 140, 70, 0.35)`,
                    zIndex: 9,
                }}
            >
                <img
                    src={src}
                    alt={`${stage} avatar`}
                    className="absolute top-1/2 left-1/2"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "50% 50%",
                        transform: "translate(-50%, -50%)",
                        mixBlendMode: isLight ? "screen" : "normal",
                        filter: isLight ? "none" : "sepia(0.45) saturate(1.45) hue-rotate(-10deg) brightness(1.08) contrast(1.05)",
                        maskImage: "radial-gradient(circle, black 88%, transparent 100%)",
                        WebkitMaskImage: "radial-gradient(circle, black 88%, transparent 100%)",
                    }}
                />
                {/* Subtle luminous overlay - gold for light, teal for dark */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: isLight
                            ? `radial-gradient(circle, rgba(200, 160, 110, 0.12) 0%, transparent 60%)`
                            : `radial-gradient(circle, rgba(220, 170, 90, 0.25) 0%, transparent 60%)`,
                        mixBlendMode: "screen",
                        pointerEvents: "none",
                    }}
                />
            </div>
            {hasVariations && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: "8%",
                        right: "8%",
                        fontSize: "1.5rem",
                        color: accentColor,
                        textShadow: `0 0 8px ${accentColor}, 0 0 16px ${accentColor}`,
                        animation: "pulse 2s ease-in-out infinite",
                    }}
                >
                    Γ£ª
                </div>
            )}
            {/* Background accent glow - enhanced */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: "56%",  // Slightly larger to account for overscale
                    height: "56%",
                    borderRadius: "9999px",
                    background: accentColor,
                    opacity: stage === "flame" ? 0.7 : 0.55,
                    filter: "blur(22px)",
                    zIndex: -1,
                }}
            />
        </div>
    );
}
