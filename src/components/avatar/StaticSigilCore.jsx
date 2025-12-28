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
                    opacity: 0.5,
                }}
            />
            <div
                className="absolute pointer-events-none"
                style={{
                    width: "50%",
                    height: "50%",
                    borderRadius: "9999px",
                    background: isLight
                        ? "radial-gradient(circle, rgba(10, 25, 20, 0.45) 0%, rgba(10, 25, 20, 0.25) 50%, transparent 85%)"
                        : "#000000",
                    opacity: isLight ? 0.7 : 1,
                }}
            />
            <div
                className={`relative pointer-events-none select-none ${isLight ? 'light-orb-rotate' : 'dark-orb-rotate'}`}
                style={{
                    width: "44%",
                    height: "44%",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    animationPlayState: isPracticing ? 'paused' : 'running',
                    boxShadow: "0 0 5px 2px rgba(0,0,0,0.6)",
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
                        maskImage: "radial-gradient(circle, black 88%, transparent 100%)",
                        WebkitMaskImage: "radial-gradient(circle, black 88%, transparent 100%)",
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
                    ✦
                </div>
            )}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: "48%",
                    height: "48%",
                    borderRadius: "9999px",
                    background: accentColor,
                    opacity: stage === "flame" ? 0.3 : 0.4,
                    filter: "blur(8px)",
                }}
            />
        </div>
    );
}
