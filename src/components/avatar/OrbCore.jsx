// src/components/avatar/OrbCore.jsx
// New orb-based avatar core for light mode
// Implements crossfade animation for orb loop and particles

import React, { useState, useEffect } from "react";

export function OrbCore({ 
    isPracticing = false, 
    reduced = false, // For Sakshi/Vipassana modes
    variantProps = {}, // Phase 3: Config for gem parameterization
    stage = 'flame' // Stage from component tree
}) {
    const [orbFrame, setOrbFrame] = useState(0);
    const [particleFrame, setParticleFrame] = useState(0);

    // Stage-based presets (Light Mode)
    const stagePresets = {
        seedling: { hueShift: 0, saturation: 0.9, luminance: 1.02, contrast: 0.92, scale: 1.12 },
        ember: { hueShift: 8, saturation: 1.05, luminance: 0.98, contrast: 1.02, scale: 1.12 },
        flame: { hueShift: 18, saturation: 1.15, luminance: 0.95, contrast: 1.08, scale: 1.12 },
        beacon: { hueShift: -6, saturation: 0.85, luminance: 1.05, contrast: 0.95, scale: 1.12 },
        stellar: { hueShift: -12, saturation: 0.8, luminance: 1.1, contrast: 0.9, scale: 1.15 },
    };

    // Helper to clamp values for safety/scaling to 90+
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    // Get base preset or fallback to flame
    const baseConfig = stagePresets[stage] || stagePresets.flame;
    
    // Merge overrides
    const merged = { ...baseConfig, ...variantProps };

    // Apply strict parameter guardrails
    const variantConfig = {
        hueShift: merged.hueShift ?? 0,
        luminance: clamp(merged.luminance ?? 1.0, 0.82, 1.08),
        contrast: clamp(merged.contrast ?? 1.0, 0.85, 1.15),
        saturation: clamp(merged.saturation ?? 1.0, 0.75, 1.25),
        scale: clamp(merged.scale ?? 1.12, 1.06, 1.18),
    };

    // Orb loop animation: 4 frames, 14s total loop
    useEffect(() => {
        if (isPracticing) return; // Pause during practice
        
        const orbInterval = setInterval(() => {
            setOrbFrame(prev => (prev + 1) % 4);
        }, 3500); // 14s / 4 frames = 3.5s per frame
        
        return () => clearInterval(orbInterval);
    }, [isPracticing]);

    // Particle loop animation: 3 frames, 21s total loop, offset from orb
    useEffect(() => {
        if (isPracticing || reduced) return; // Pause during practice or in reduced mode
        
        // Offset by 2s from orb loop
        const timeout = setTimeout(() => {
            const particleInterval = setInterval(() => {
                setParticleFrame(prev => (prev + 1) % 3);
            }, 7000); // 21s / 3 frames = 7s per frame
            
            return () => clearInterval(particleInterval);
        }, 2000);
        
        return () => clearTimeout(timeout);
    }, [isPracticing, reduced]);

    const orbFrames = [
        'orb_loop_light_0003.png',
        'orb_loop_light_0004.png',
        'orb_loop_light_0005.png',
        'orb_loop_light_0006.png',
    ];

    const particleFrames = [
        'orb_particles_light_0003.png',
        'orb_particles_light_0004.png',
        'orb_particles_light_0005.png',
    ];

    // Variant config is now calculated at top of component

    return (
        <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 10 }}
        >
            {/* 1. VESSEL: Frame Ring (LOCKED) */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: '94.375%', // 302/320
                    height: '94.375%',
                    zIndex: 1,
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.12))',
                }}
            >
                <img
                    src={`${import.meta.env.BASE_URL}assets/avatar_v2/avatar_frame_light.png`}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            </div>

            {/* 2. VESSEL: Instrument Ring (LOCKED) */}
            {!reduced && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: '84.375%', // 270/320
                        height: '84.375%',
                        opacity: 0.25,
                        zIndex: 2,
                        animation: 'instrumentRotate 120s linear infinite',
                        animationPlayState: isPracticing ? 'paused' : 'running',
                    }}
                >
                    <img
                        src={`${import.meta.env.BASE_URL}assets/avatar_v2/avatar_instrument_light.png`}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}

            {/* 3. VESSEL: AMBIENT GLOW (PHASE 4: Reintroduced) */}
            {!reduced && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: '80%', // Larger than orb
                        height: '80%',
                        top: '10%',
                        left: '10%',
                        opacity: 0.35, // Phase 4: Set to ≤ 40% (0.35)
                        zIndex: 0, 
                        filter: 'blur(16px)', 
                        mixBlendMode: 'screen',
                    }}
                >
                    <img
                        src={`${import.meta.env.BASE_URL}assets/avatar_v2/orb_glow_light.png`}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}

            {/* CIRCULAR CLIP WRAPPER - The Seated Gem */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: '71.25%', // 228/320
                    height: '71.25%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    zIndex: 3,
                    // Inner shadow for depth (LOCKED)
                    boxShadow: 'inset 0 8px 18px rgba(0, 0, 0, 0.18), inset 0 -10px 18px rgba(255, 255, 255, 0.10)',
                }}
            >
                {/* 1. CORE: Gem/Mineral (Normalized & Parameterized) */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        // Phase 3: Applied via CSS filters (Surgical scoping: CORE sibling only)
                        filter: `
                            hue-rotate(${variantConfig.hueShift}deg) 
                            brightness(${variantConfig.luminance}) 
                            contrast(${variantConfig.contrast}) 
                            saturate(${variantConfig.saturation})
                        `,
                        // Phase 2: Consolidated single scaling knob
                        transform: `scale(${variantConfig.scale})`,
                        // HARD-MASK THE SEAT: Hide edge artifacts with 2px feather
                        maskImage: 'radial-gradient(circle, black 98%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(circle, black 98%, transparent 100%)',
                    }}
                >
                    {variantProps.gemSrc ? (
                        <img
                            src={variantProps.gemSrc}
                            alt=""
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        orbFrames.map((frame, idx) => (
                            <img
                                key={frame}
                                src={`${import.meta.env.BASE_URL}assets/avatar_v2/${frame}`}
                                alt=""
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover', // Phase 2: Normalized
                                    opacity: orbFrame === idx ? 1 : 0,
                                    transition: 'opacity 1000ms ease-in-out',
                                }}
                            />
                        ))
                    )}
                </div>

                {/* 2. OPTICS: Inner Shadow Mask (LOCKED) */}
                {!reduced && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: 2, opacity: 0.6 }}
                    >
                        <img
                            src={`${import.meta.env.BASE_URL}assets/avatar_v2/optical_shadow.png`}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                )}

                {/* 3. OPTICS: Glass Lens Overlay (LOCKED) */}
                {!reduced && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: 3, opacity: 0.8 }}
                    >
                        <img
                            src={`${import.meta.env.BASE_URL}assets/avatar_v2/optical_lens.png`}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                )}

                {/* 4. OPTICS: Specular Highlight Mask (LOCKED) */}
                {!reduced && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: 4, opacity: 0.7 }}
                    >
                        <img
                            src={`${import.meta.env.BASE_URL}assets/avatar_v2/optical_highlight.png`}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                )}

                {/* 5. ENERGY: Particle Layer (PHASE 4: Reintroduced) */}
                {!reduced && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            opacity: 0.22, // Phase 4: ≤ 0.22
                            zIndex: 5,
                        }}
                    >
                        {particleFrames.map((frame, idx) => (
                            <img
                                key={frame}
                                src={`${import.meta.env.BASE_URL}assets/avatar_v2/${frame}`}
                                alt=""
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    opacity: particleFrame === idx ? 1 : 0,
                                    transition: 'opacity 1200ms ease-in-out',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
