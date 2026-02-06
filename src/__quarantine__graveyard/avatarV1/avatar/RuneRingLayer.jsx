// src/components/avatar/RuneRingLayer.jsx
// Rotating rune ring layer component

import React from "react";
import { useDisplayModeStore } from "../../../state/displayModeStore";
import { useSettingsStore } from "../../../state/settingsStore";
import { STAGE_RUNE_COLORS } from "./constants";

export function RuneRingLayer({ stage = "flame", isPracticing = false, speedMultiplier = 1.0 }) {
    const isLight = useDisplayModeStore((state) => state.colorScheme === "light");
    const glowColor = STAGE_RUNE_COLORS[stage] || STAGE_RUNE_COLORS.flame;
    const ringType = useSettingsStore(s => s.lightModeRingType);
    const isAstrolabe = ringType === 'astrolabe';

    // Calculate animation duration based on speed multiplier
    // Base: 60s for light, 120s for dark. Slower = longer duration.
    const lightBaseDuration = 60;
    const darkBaseDuration = 120;
    const lightDuration = speedMultiplier > 0 ? lightBaseDuration / speedMultiplier : lightBaseDuration;
    const darkDuration = speedMultiplier > 0 ? darkBaseDuration / speedMultiplier : darkBaseDuration;

    if (isLight) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className="light-ring-rotate relative w-[100%] h-[100%] flex items-center justify-center"
                    style={{
                        transition: 'opacity 0.5s ease, animation-duration 0.5s ease',
                        animationPlayState: isPracticing ? 'paused' : 'running',
                        animationDuration: `${lightDuration}s`,
                    }}
                >
                    <img
                        src={`${import.meta.env.BASE_URL}sigils/${isAstrolabe ? 'ring-structure.webp' : 'light-rune-ring.png'}`}
                        alt="Instrument ring"
                        className="absolute top-1/2 left-1/2 object-contain"
                        style={{
                            width: "100%",
                            height: "100%",
                            opacity: isPracticing ? 0.95 : 1,
                            filter: isAstrolabe
                                ? `sepia(0.22) contrast(1.05) brightness(0.96) drop-shadow(0 2px 6px var(--light-shadow-tint)) drop-shadow(0 0 2px #D4AF37) drop-shadow(0 0 4px #B8860B)`
                                : `drop-shadow(0 2px 8px var(--light-shadow-tint)) drop-shadow(0 0 2px #D4AF37) drop-shadow(0 0 4px #B8860B)`,
                            transition: 'transform 0.5s ease, opacity 0.5s ease',
                            transform: isPracticing
                                ? `translate(-50.35%, ${isAstrolabe ? '-49.2%' : '-48.0%'}) ${isAstrolabe ? 'scale(1.15)' : 'scale(1.08)'}`
                                : `translate(-50.35%, ${isAstrolabe ? '-49.2%' : '-48.0%'}) ${isAstrolabe ? 'scale(1.1)' : 'scale(1.05)'}`,
                        }}
                    />
                    {isAstrolabe && (
                        <img
                            src={`${import.meta.env.BASE_URL}sigils/ring-inner-lip.webp`}
                            alt="Mechanical lip"
                            className="absolute"
                            style={{
                                width: "48.5%",
                                height: "48.5%",
                                opacity: 0.12,
                                mixBlendMode: "multiply",
                                pointerEvents: "none"
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
                className="dark-ring-rotate w-[88%] h-[88%] relative flex items-center justify-center"
                style={{
                    animationPlayState: isPracticing ? 'paused' : 'running',
                    animationDuration: `${darkDuration}s`,
                    zIndex: 5
                }}
            >
                <div className="absolute inset-0 hairline-ring opacity-40 scale-[1.005]" />
                <img
                    src={`${import.meta.env.BASE_URL}sigils/${stage === 'flame' ? 'rune-ring2.png' : 'rune-ring.png'}`}
                    alt="Rune ring"
                    className="w-full h-full object-contain"
                    style={{
                        filter: `brightness(1.15) saturate(1.55) contrast(1.12) sepia(0.28) drop-shadow(0 0 10px rgba(230, 180, 90, 0.65)) drop-shadow(0 0 18px rgba(200, 150, 70, 0.35))`,
                        opacity: 1,
                    }}
                />
                {/* Inner bevel/shadow for depth */}
                <div
                    className="absolute inset-[15%] rounded-full pointer-events-none"
                    style={{
                        boxShadow: `inset 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 -2px 8px rgba(200, 160, 80, 0.10)`,
                    }}
                />
                <div className="absolute inset-0 pointer-events-none">
                    {['SOMA', 'PRANA', 'DHYANA', 'DRISHTI'].map((label, i) => (
                        <div
                            key={label}
                            className="absolute text-[6px] text-suspended text-white/30"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-32%)`,
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
