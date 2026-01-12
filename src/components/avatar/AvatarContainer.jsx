// src/components/avatar/AvatarContainer.jsx
// Main layout orchestrator combining all avatar layers

import React from "react";
import { AvatarLuminousCanvas } from "../AvatarLuminousCanvas.jsx";
import MoonOrbit from "../MoonOrbit.jsx";
import { useDisplayModeStore } from "../../state/displayModeStore";
import { useLunarStore } from "../../state/lunarStore";
import { useSettingsStore } from "../../state/settingsStore";
import { STAGE_GLOW_COLORS } from "./constants";
import { BreathingAura } from "./BreathingAura";
import { RuneRingLayer } from "./RuneRingLayer";
import { StaticSigilCore } from "./StaticSigilCore";
import { RadiantHalo } from "./RadiantHalo";

export function AvatarContainer({
    mode,
    breathPattern,
    stage = "flame",
    path = null,
    showCore = true,
    attention = 'vigilance',
    variationIndex = 0,
    hasVariations = false,
    weeklyConsistency = 0,
    weeklyPracticeLog = [],
    breathState,
    isPracticing = false,
    ringSpeedMultiplier = 1.0,
}) {
    const glowColor = STAGE_GLOW_COLORS[stage] || STAGE_GLOW_COLORS.flame;
    const { h, s, l } = glowColor;
    const isLight = useDisplayModeStore((state) => state.colorScheme === 'light');
    const moonProgress = useLunarStore(s => s.progress);
    const useNewAvatars = useSettingsStore(s => s.useNewAvatars);

    const moonAngle = (moonProgress / 12) * (Math.PI * 2) - Math.PI / 2;
    const shadowDist = isLight ? 10 : 0;
    const shadowX = -Math.cos(moonAngle) * shadowDist;
    const shadowY = -Math.sin(moonAngle) * shadowDist;

    return (
        <div className="relative flex items-center justify-center overflow-visible" style={{ width: 'min(70vw, 300px)', height: 'min(70vw, 300px)' }}>
            {!isLight && (
                <>
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, hsla(${h}, ${s}%, ${l}%, 0.45) 0%, hsla(${h}, ${s}%, ${l - 5}%, 0.32) 35%, hsla(${h}, ${s}%, ${l - 10}%, 0.18) 60%, hsla(${h}, ${s}%, ${l - 15}%, 0.08) 80%, hsla(${h}, ${s}%, ${l - 20}%, 0.01) 90%, transparent 95%)`,
                            filter: "blur(100px)",
                            borderRadius: "50%",
                            animation: "breathingPulse 8s ease-in-out infinite",
                            animationPlayState: isPracticing ? 'paused' : 'running',
                        }}
                    />
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, hsla(${h}, ${s + 5}%, ${l + 10}%, 0.6) 0%, hsla(${h}, ${s}%, ${l + 5}%, 0.4) 30%, hsla(${h}, ${s - 5}%, ${l}%, 0.15) 55%, transparent 75%)`,
                            filter: "blur(50px)",
                            borderRadius: "50%",
                            animation: "breathingPulse 8s ease-in-out infinite 0.2s",
                            animationPlayState: isPracticing ? 'paused' : 'running',
                        }}
                    />
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, hsla(${h}, ${s + 10}%, ${l + 15}%, 0.5) 0%, hsla(${h}, ${s + 5}%, ${l + 10}%, 0.25) 25%, transparent 50%)`,
                            filter: "blur(30px)",
                            borderRadius: "50%",
                            animation: "breathingPulse 8s ease-in-out infinite 0.4s",
                            animationPlayState: isPracticing ? 'paused' : 'running',
                        }}
                    />
                </>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                <div className="absolute w-[64%] h-[64%] flex items-center justify-center overflow-visible pointer-events-none">
                    {/* LAYER 0: Base Plate (Behind everything, provides contrast for core/rings) */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
                        {/* Flame-specific dark backer: moves behind the web but provides contrast */}
                        {stage === "flame" && !isLight && (
                            <div
                                className="absolute w-[88%] h-[88%]"
                                style={{
                                    borderRadius: "9999px",
                                    background: "radial-gradient(circle, transparent 45%, #2b2418 55%, #4a3a1d 100%)",
                                }}
                            />
                        )}
                        {/* Universal shadow backer for rune visibility */}
                        {!isLight && (
                            <div
                                className="absolute w-[88%] h-[88%]"
                                style={{
                                    borderRadius: "9999px",
                                    background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.15) 70%, transparent 80%)",
                                }}
                            />
                        )}
                        {/* Ring rim shadow */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                width: "48.5%",
                                height: "48.5%",
                                borderRadius: "50%",
                                boxShadow: isLight
                                    ? `inset 0 0 1px 1px rgba(${h * 2.5}, ${s * 1.2}, ${l * 0.8}, 0.08)`
                                    : "inset 0 0 2px 2px rgba(0,0,0,0.8)",
                            }}
                        />
                    </div>

                    {/* LAYER 1: Background Atmosphere/Web - Dark mode only */}
                    {!isLight && (
                        <div className="absolute inset-0" style={{ zIndex: 1 }}>
                            <AvatarLuminousCanvas
                                breathState={breathState}
                                weeklyPracticeLog={weeklyPracticeLog}
                                weeklyConsistency={weeklyConsistency}
                            />
                        </div>
                    )}

                    {/* LAYER 1.5: Radiant Star Halo - Light mode only */}
                    {isLight && <RadiantHalo size={280} stage={stage} />}

                    {/* LAYER 2: Rune Ring Layer */}
                    <div className="absolute inset-0" style={{ zIndex: 5 }}>
                        <RuneRingLayer stage={stage} isPracticing={isPracticing} speedMultiplier={ringSpeedMultiplier} />
                    </div>

                    {/* LAYER 3: Decorative Outline Rings - Dark mode only */}
                    {!isLight && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                width: "100%",
                                height: "100%",
                                zIndex: 6
                            }}
                        >
                            <div
                                className="absolute"
                                style={{
                                    width: "108%",
                                    height: "108%",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    borderRadius: "50%",
                                    border: `1px solid hsla(${h}, ${s}%, ${l}%, 0.25)`,
                                    boxShadow: `inset 0 0 1px hsla(${h}, ${s}%, ${l}%, 0.2)`,
                                }}
                            />
                            <div
                                className="absolute"
                                style={{
                                    width: "102%",
                                    height: "102%",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    borderRadius: "50%",
                                    border: `1.5px solid hsla(${h}, ${s}%, ${l}%, 0.45)`,
                                    boxShadow: `inset 0 0 1px hsla(${h}, ${s}%, ${l}%, 0.4)`,
                                }}
                            >
                                <div
                                    className="absolute"
                                    style={{
                                        width: "2px",
                                        height: "10px",
                                        top: "-5px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: `hsla(${h}, ${s}%, ${l}%, 0.98)`,
                                        boxShadow: `0 0 8px hsla(${h}, ${s}%, ${l}%, 0.9), 0 0 12px hsla(${h}, ${s}%, ${l}%, 0.4)`,
                                        zIndex: 20
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* LAYER 4: Mode-specific Glow/Feedback */}
                    {isLight && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                background: `radial-gradient(circle, hsla(${h}, ${s}%, ${l}%, ${stage === 'seedling' ? 0.28 : 0.18}) 0%, hsla(${h}, ${s}%, ${l}%, 0.08) 45%, transparent 70%)`,
                                mixBlendMode: "plus-lighter",
                                opacity: isPracticing ? 0.25 : 0.18,
                                transition: "opacity 1.5s ease-in-out",
                                zIndex: 2,
                            }}
                        />
                    )}

                    {/* LAYER 5: Inner Shadow / Depth Layer */}
                    <div
                        className="absolute pointer-events-none shadow-inner"
                        style={{
                            width: "50.5%",
                            height: "50.5%",
                            borderRadius: "50%",
                            boxShadow: isLight
                                ? `inset ${shadowX}px ${shadowY}px 12px rgba(120, 100, 80, 0.15)` // Toned down from black 0.45
                                : "inset 0 0 10px rgba(0, 0, 0, 0.45)",
                            zIndex: 7,
                            transition: 'box-shadow 0.8s ease-out'
                        }}
                    />

                    {/* LAYER 6: Sigil Core */}
                    <StaticSigilCore
                        stage={stage}
                        path={path}
                        showCore={showCore}
                        attention={attention}
                        variationIndex={variationIndex}
                        hasVariations={hasVariations}
                        isPracticing={isPracticing}
                        isLight={isLight}
                        useNewAvatars={useNewAvatars}
                    />
                </div>

                {mode === "practice" && (
                    <BreathingAura key={stage} breathPattern={breathPattern} />
                )}

                {/* Moon Orbit - Dark mode only */}
                {!isLight && (
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                        viewBox="0 0 600 600"
                        style={{ overflow: 'visible', zIndex: 100 }}
                    >
                        <MoonOrbit avatarRadius={138} centerX={300} centerY={300} />
                    </svg>
                )}

                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        borderRadius: "50%",
                        opacity: 0.025,
                        mixBlendMode: "overlay",
                        background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctels='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        zIndex: 200
                    }}
                />
            </div>
        </div>
    );
}
