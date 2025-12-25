// src/components/PathParticles.jsx
// Canvas-based particle system - refined FX presets v7

import React, { useRef, useEffect, useCallback } from 'react';
import { getPathFX, getDefaultFX } from '../data/pathFX.js';
import { clampPreset, MAX_PARTICLE_COUNT, MAX_TRAIL_LENGTH } from '../data/ringFXPresets.js';

export function PathParticles({
    pathId,
    fxPreset = null,
    intensity = 0.5,
    ringScale = 1.0,
    ringRadius: ringRadiusProp = null,  // Explicit ring radius in pixels (optional)
    phase = 'rest',
    size = 300,
    accentColor = '#d4af37',
    isActive = true,
    isLight = false  // Light mode flag for color inversion
}) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationRef = useRef(null);
    const lastTimeRef = useRef(0);
    const prevPresetIdRef = useRef(null);
    const cycleDirectionRef = useRef(1);
    const prevPhaseRef = useRef('rest');

    const rawFx = fxPreset ? clampPreset(fxPreset) : (getPathFX(pathId) || getDefaultFX());
    const fx = {
        ...rawFx,
        particleCount: Math.min(rawFx.particleCount || 12, MAX_PARTICLE_COUNT),
        trailLength: Math.min(rawFx.trailLength || 0.3, MAX_TRAIL_LENGTH)
    };
    const breathParams = fx.breathSync[phase] || fx.breathSync.rest;

    useEffect(() => {
        if (prevPhaseRef.current === 'exhale' && phase === 'rest') {
            cycleDirectionRef.current *= -1;
        }
        prevPhaseRef.current = phase;
    }, [phase]);

    const parseColor = useCallback((hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 212, g: 175, b: 55 };
    }, []);

    const getColorVariation = useCallback((particleId, totalParticles) => {
        const numVariations = Math.min(6, Math.max(3, Math.floor(totalParticles / 8)));
        const variationIndex = particleId % numVariations;
        const brightnessOffset = (variationIndex / (numVariations - 1) - 0.5) * 0.4;
        const hueOffset = (variationIndex / (numVariations - 1) - 0.5) * 30;
        return { brightnessOffset, hueOffset };
    }, []);

    const getModifiedColor = useCallback((baseColor, opacity = 1, brightnessBoost = 0, hueBoost = 0) => {
        const { hueShift, saturation, brightness } = fx.colorModifier;
        let { r, g, b } = baseColor;
        const actualBrightness = brightness + brightnessBoost;
        r = Math.min(255, r * actualBrightness);
        g = Math.min(255, g * actualBrightness);
        b = Math.min(255, b * actualBrightness);
        const gray = (r + g + b) / 3;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;
        const totalHueShift = hueShift + hueBoost;
        if (totalHueShift !== 0) {
            const hueRad = totalHueShift * Math.PI / 180;
            const cosH = Math.cos(hueRad);
            const sinH = Math.sin(hueRad);
            const newR = r * (0.213 + cosH * 0.787 - sinH * 0.213) + g * (0.715 - cosH * 0.715 - sinH * 0.715) + b * (0.072 - cosH * 0.072 + sinH * 0.928);
            const newG = r * (0.213 - cosH * 0.213 + sinH * 0.143) + g * (0.715 + cosH * 0.285 + sinH * 0.140) + b * (0.072 - cosH * 0.072 - sinH * 0.283);
            const newB = r * (0.213 - cosH * 0.213 - sinH * 0.787) + g * (0.715 - cosH * 0.715 + sinH * 0.715) + b * (0.072 + cosH * 0.928 + sinH * 0.072);
            r = Math.max(0, Math.min(255, newR));
            g = Math.max(0, Math.min(255, newG));
            b = Math.max(0, Math.min(255, newB));
        }

        // LIGHT MODE: Invert colors to make particles visible on light background
        if (isLight) {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
        }

        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0.1, opacity * fx.colorModifier.opacity)})`;
    }, [fx.colorModifier, isLight]);

    const initParticles = useCallback(() => {
        const particles = [];
        const centerX = size / 2;
        const centerY = size / 2;
        // Use explicit ringRadius prop if provided, otherwise calculate from size
        const ringRadius = ringRadiusProp || (size * 0.4);

        for (let i = 0; i < fx.particleCount; i++) {
            const angle = (i / fx.particleCount) * Math.PI * 2;
            let x, y, distance;
            const colorVar = getColorVariation(i, fx.particleCount);

            switch (fx.motionPattern) {
                case 'ember-mixed':
                    // ALL embers spawn from the ring itself
                    const emberAngle = angle + (Math.random() - 0.5) * 0.3;
                    x = centerX + Math.cos(emberAngle) * ringRadius;
                    y = centerY + Math.sin(emberAngle) * ringRadius;
                    distance = ringRadius;
                    break;
                case 'electric-varied':
                    distance = ringRadius;
                    x = centerX + Math.cos(angle) * distance;
                    y = centerY + Math.sin(angle) * distance;
                    break;
                case 'meteor-cycle':
                    // Wider spread - 40% more (was 0.7, now ~1.0 width)
                    x = centerX + (Math.random() - 0.5) * size * 1.0;
                    y = centerY - size * 0.5 - Math.random() * size * 0.15;
                    distance = 0;
                    break;
                case 'snowglobe-active':
                    distance = Math.random() * ringRadius * 1.1;
                    x = centerX + Math.cos(angle) * distance;
                    y = centerY + Math.sin(angle) * distance;
                    break;
                case 'hyperspace-rays':
                    distance = ringRadius * 1.2;
                    x = centerX + Math.cos(angle) * distance;
                    y = centerY + Math.sin(angle) * distance;
                    break;
                case 'starfield-smooth':
                    distance = ringRadius * (0.2 + Math.random() * 0.8);
                    x = centerX + Math.cos(angle) * distance;
                    y = centerY + Math.sin(angle) * distance;
                    break;
                default:
                    distance = ringRadius * (0.6 + Math.random() * 0.4);
                    x = centerX + Math.cos(angle) * distance;
                    y = centerY + Math.sin(angle) * distance;
            }

            particles.push({
                id: i,
                x, y,
                baseX: x, baseY: y,
                angle, distance,
                baseDistance: distance,
                size: fx.particleSize.min + Math.random() * (fx.particleSize.max - fx.particleSize.min),
                speed: 0.3 + Math.random() * 0.7,
                phase: Math.random() * Math.PI * 2,
                opacity: fx.motionPattern === 'meteor-cycle' ? 0 : (0.4 + Math.random() * 0.6),
                twinklePhase: Math.random() * Math.PI * 2,
                popTimer: Math.random() * 2,
                colorVar,
                rotationSpeed: 0.5 + Math.random() * 1.5,
                rotationDir: Math.random() > 0.5 ? 1 : -1,
                arcLength: 0.3 + Math.random() * 0.4,
                arcSegments: [],
                trail: []
            });
        }
        return particles;
    }, [fx.particleCount, fx.particleSize, fx.motionPattern, size, getColorVariation, ringRadiusProp]);

    const applyMotion = useCallback((particle, dt, centerX, centerY, currentRingScale) => {
        const baseSpeed = breathParams.speed * particle.speed;
        // Use explicit ringRadius prop if provided, otherwise calculate from size
        const baseRingRadius = ringRadiusProp || (size * 0.4);
        // Scale ring radius to match BreathingRing's dynamic scale (default 1.0-1.2)
        const ringRadius = baseRingRadius * currentRingScale;

        switch (fx.motionPattern) {
            // HYPERSPACE-RAYS - Upgraded: breath pulsation + shimmer + dual layers
            case 'hyperspace-rays': {
                const raySpeed = breathParams.raySpeed || 0.5;
                const rayLength = breathParams.rayLength || 1.0;
                const isInhale = phase === 'inhale';
                const isExhale = phase === 'exhale';

                // ★ DUAL RAY LAYERS - assign layer based on particle id
                if (!particle.rayLayer) {
                    particle.rayLayer = particle.id % 3 === 0 ? 'outer' : 'inner';
                    particle.layerLengthMult = particle.rayLayer === 'outer' ? 1.4 : 0.7;
                    particle.layerBrightMult = particle.rayLayer === 'outer' ? 1.0 : 0.6;
                }

                // ★ ANGULAR SHIMMER - subtle ±1° noise each frame
                particle.shimmerPhase = (particle.shimmerPhase || Math.random() * Math.PI * 2) + Math.random() * 0.1;
                const shimmerAngle = Math.sin(particle.shimmerPhase) * 0.017; // ~1 degree

                // ★ BREATH-SYNCED RAY LENGTH PULSATION
                const breathMod = isInhale ? 1.08 : (isExhale ? 0.92 : 1.0);

                if (isInhale) {
                    particle.distance -= dt * raySpeed * 30;
                    if (particle.distance < ringRadius * 0.1) {
                        particle.distance = ringRadius * 0.1;
                    }
                    particle.opacity = 0.7 * particle.layerBrightMult;
                } else if (isExhale) {
                    particle.distance += dt * raySpeed * 120;
                    particle.opacity = Math.max(0, 1 - (particle.distance / (ringRadius * 1.8))) * particle.layerBrightMult;
                } else {
                    particle.distance += dt * raySpeed * 20;
                }

                if (particle.distance > ringRadius * 1.8) {
                    particle.distance = ringRadius * 0.15;
                    particle.opacity = 0.85 * particle.layerBrightMult;
                    particle.angle = Math.random() * Math.PI * 2;
                }

                // Apply layer-adjusted ray length with breath pulsation
                particle.rayLength = rayLength * particle.layerLengthMult * breathMod;

                // Apply shimmer to angle
                const finalAngle = particle.angle + shimmerAngle;
                particle.x = centerX + Math.cos(finalAngle) * particle.distance;
                particle.y = centerY + Math.sin(finalAngle) * particle.distance;
                break;
            }

            // STARFIELD-SMOOTH - Upgraded: radiate bursts + easing + breath sync
            case 'starfield-smooth': {
                const targetScale = breathParams.scale || 1.0;
                const currentScale = particle.currentScale || 1.0;
                particle.currentScale = currentScale + (targetScale - currentScale) * dt * 2;

                // ★ BREATH SYNC: modify behavior based on phase
                const isHold = phase === 'holdIn' || phase === 'holdOut';
                const isInhale = phase === 'inhale';
                const speedMult = isHold ? 0.1 : (isInhale ? 1.5 : 0.8);

                const dx = particle.baseX - centerX;
                const dy = particle.baseY - centerY;

                // ★ CENTER-OUT RADIATING BURST
                particle.burstTimer = (particle.burstTimer || Math.random() * 8) - dt;
                if (particle.burstTimer <= 0 && !particle.isBursting) {
                    // Random chance to start bursting
                    if (Math.random() < 0.15) {
                        particle.isBursting = true;
                        particle.burstProgress = 0;
                        particle.burstDuration = 0.4 + Math.random() * 0.2;
                    }
                    particle.burstTimer = 4 + Math.random() * 4;
                }

                if (particle.isBursting) {
                    particle.burstProgress += dt / particle.burstDuration;
                    // ★ CUBIC EASE OUT for burst expansion
                    const eased = 1 - Math.pow(1 - particle.burstProgress, 3);
                    const burstScale = 1 + eased * 0.5;
                    particle.x = centerX + dx * particle.currentScale * burstScale;
                    particle.y = centerY + dy * particle.currentScale * burstScale;
                    particle.opacity = 1 - eased; // Fade as it expands

                    if (particle.burstProgress >= 1) {
                        particle.isBursting = false;
                        particle.opacity = 0.3;
                    }
                } else {
                    particle.x = centerX + dx * particle.currentScale;
                    particle.y = centerY + dy * particle.currentScale;

                    // ★ CUBIC EASE IN/OUT for opacity (premium fade)
                    particle.lifePhase = (particle.lifePhase || Math.random() * Math.PI * 2) + dt * 0.5 * speedMult;
                    const t = (Math.sin(particle.lifePhase) + 1) / 2; // 0-1
                    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    particle.opacity = 0.2 + eased * 0.6;
                }

                // ★ MULTI-PHASE STAR BEHAVIOR: tiny drift
                particle.driftPhase = (particle.driftPhase || Math.random() * Math.PI * 2) + dt * 0.8;
                const drift = Math.sin(particle.driftPhase) * 2;
                particle.x += drift * dt;
                particle.y += drift * dt * 0.5;

                particle.twinklePhase += dt * 5 * speedMult;
                if (breathParams.twinkle && !particle.isBursting) {
                    particle.opacity = Math.min(particle.opacity, 0.5 + Math.abs(Math.sin(particle.twinklePhase)) * 0.5);
                }
                break;
            }

            // EMBER-MIXED - Upgraded: orbit drift + size flicker + temperature shift
            case 'ember-mixed': {
                // Initialize ember-specific properties
                particle.emberAge = (particle.emberAge || 0) + dt;
                particle.driftPhase = (particle.driftPhase || Math.random() * Math.PI * 2) + dt * 2;
                particle.flickerPhase = (particle.flickerPhase || Math.random() * Math.PI * 2) + dt * 8;

                // Base upward movement
                particle.y -= dt * baseSpeed * 45;

                const riseHeight = Math.max(0, (centerY - particle.y) / (size * 0.4));
                const shimmer = Math.sin(particle.phase * 3 + Date.now() * 0.006) * (6 + riseHeight * 10);

                // ★ MICRO ORBIT DRIFT - sine wave horizontal drift (3-5px)
                const driftAmp = 3 + Math.sin(particle.phase) * 2;
                const orbitDrift = Math.sin(particle.driftPhase) * driftAmp;
                particle.x += (shimmer + orbitDrift) * dt * 2.5;

                // ★ SIZE FLICKER - organic flame-particle feel (±15%)
                const sizeFlicker = 0.85 + Math.sin(particle.flickerPhase) * 0.15 + Math.random() * 0.1;

                particle.popTimer -= dt;
                if (particle.popTimer <= 0) {
                    particle.opacity = Math.min(1, particle.opacity + 0.4);
                    particle.size = Math.min(fx.particleSize.max * 1.5, particle.size * 1.35);
                    particle.popTimer = 0.25 + Math.random() * 0.7;
                } else {
                    particle.size *= (1 - dt * 2.5);
                    if (particle.size < fx.particleSize.min) particle.size = fx.particleSize.min;
                }

                // Apply size flicker
                particle.displaySize = particle.size * sizeFlicker;

                // ★ TEMPERATURE COLOR SHIFT (warm inhale → cooler exhale)
                const isInhale = phase === 'inhale';
                particle.temperatureShift = isInhale ? 15 : -10; // Hue shift

                particle.opacity = Math.max(0.15, particle.opacity - dt * 0.55);

                if (particle.y < centerY - size * 0.42) {
                    if (breathParams.spawn !== false) {
                        // Always spawn from ring
                        const newAngle = Math.random() * Math.PI * 2;
                        particle.x = centerX + Math.cos(newAngle) * ringRadius;
                        particle.y = centerY + Math.sin(newAngle) * ringRadius;
                        particle.opacity = 0.9;
                        particle.size = fx.particleSize.min + Math.random() * (fx.particleSize.max - fx.particleSize.min);
                        particle.emberAge = 0;
                    } else {
                        particle.opacity = 0;
                    }
                }
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // ELECTRIC-VARIED v2: Plasma Conduit - Continuous parametric curve
            // ═══════════════════════════════════════════════════════════════════════════
            case 'electric-varied': {
                // Time-based animation for smooth continuous motion
                particle.time = (particle.time || Math.random() * 100) + dt * 0.8;

                // Generate FULL RING arc points with smooth noise displacement
                const segmentCount = 90; // High resolution for smooth curve
                const noiseAmplitude = 3 + breathParams.intensity * 2; // Subtle: 3-5px displacement
                const microJitterAmp = 1.5; // Very small micro-jitter on top

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;

                    // Smooth noise displacement (simulated with layered sine waves)
                    const noise1 = Math.sin(angle * 3 + particle.time * 2) * 0.4;
                    const noise2 = Math.sin(angle * 7 + particle.time * 1.3) * 0.25;
                    const noise3 = Math.sin(angle * 13 + particle.time * 0.7) * 0.15;
                    const smoothNoise = (noise1 + noise2 + noise3) * noiseAmplitude;

                    // Micro-jitter on top of smooth curve (changes each frame)
                    const microJitter = (Math.random() - 0.5) * microJitterAmp;

                    const r = ringRadius + smoothNoise + microJitter;
                    const px = centerX + Math.cos(angle) * r;
                    const py = centerY + Math.sin(angle) * r;

                    particle.arcSegments.push({ x: px, y: py, angle });
                }

                // Store offset phase for ghost lines
                particle.ghostPhase1 = 0.15;
                particle.ghostPhase2 = 0.35;

                // Particle position for drift spark (subtle, slow circulation)
                particle.angle += dt * 0.3 * particle.rotationDir; // Very slow drift
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;

                // Reduced opacity for subtlety
                particle.opacity = 0.35; // 65% reduction from 1.0
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // PLASMA-DIRECTIONAL: Sci-fi style with visible directional flow
            // ═══════════════════════════════════════════════════════════════════════════
            case 'plasma-directional': {
                // Continuous time for directional sliding
                const flowSpeed = breathParams.flowSpeed || 1.0;
                particle.time = (particle.time || Math.random() * 100) + dt * flowSpeed;

                // Generate FULL RING arc with DIRECTIONAL phase shift
                const segmentCount = 120; // Higher resolution for sharper detail
                const noiseAmplitude = 4 + breathParams.intensity * 3; // Slightly more amplitude
                const microJitterAmp = 2.5; // Sharper micro-jitter

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;

                    // DIRECTIONAL FLOW: noise slides around the ring over time
                    // The key difference: (angle - particle.time * 0.5) creates phase drift
                    const phaseAngle = angle - particle.time * 0.5;

                    // Layered noise with phase offset for directional movement
                    const noise1 = Math.sin(phaseAngle * 4) * 0.5;
                    const noise2 = Math.sin(phaseAngle * 9 + 0.3) * 0.3;
                    const noise3 = Math.sin(phaseAngle * 17 + 0.7) * 0.15;
                    const smoothNoise = (noise1 + noise2 + noise3) * noiseAmplitude;

                    // Sharper micro-jitter for "electric snap" feel
                    const microJitter = (Math.random() - 0.5) * microJitterAmp;

                    const r = ringRadius + smoothNoise + microJitter;
                    const px = centerX + Math.cos(angle) * r;
                    const py = centerY + Math.sin(angle) * r;

                    particle.arcSegments.push({ x: px, y: py, angle });
                }

                // Echo line phase offsets (for 2 trailing lines)
                particle.echo1Phase = 0.08;
                particle.echo2Phase = 0.18;

                // Drift spark position (faster than shimmer, following flow direction)
                particle.angle += dt * 0.8 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;

                // More visible than shimmer, but still restrained
                particle.opacity = 0.55;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // PLASMA-REFINED: v2 with inner core, echo, amplitude variation
            // ═══════════════════════════════════════════════════════════════════════════
            case 'plasma-refined': {
                const flowSpeed = breathParams.flowSpeed || 1.0;
                particle.time = (particle.time || Math.random() * 100) + dt * flowSpeed;

                // Amplitude variation over time (slow breathing)
                particle.ampVar = (particle.ampVar || Math.random() * 100) + dt * 0.3;
                const ampMod = 1 + Math.sin(particle.ampVar) * 0.3; // ±30% variation

                const segmentCount = 120;
                const baseAmplitude = 4 + breathParams.intensity * 3;
                const noiseAmplitude = baseAmplitude * ampMod;
                const microJitterAmp = 2 * ampMod;

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const phaseAngle = angle - particle.time * 0.6;

                    const noise1 = Math.sin(phaseAngle * 4) * 0.5;
                    const noise2 = Math.sin(phaseAngle * 11 + 0.3) * 0.3;
                    const noise3 = Math.sin(phaseAngle * 19 + 0.7) * 0.15;
                    const smoothNoise = (noise1 + noise2 + noise3) * noiseAmplitude;
                    const microJitter = (Math.random() - 0.5) * microJitterAmp;

                    const r = ringRadius + smoothNoise + microJitter;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r, angle });
                }

                particle.hasInnerCore = true;
                particle.echo1Phase = 0.06;
                particle.echo2Phase = 0.14;
                particle.angle += dt * 0.9 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                particle.opacity = 0.6;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // RIBBON-FLOW: Elegant, silk-like flowing energy
            // ═══════════════════════════════════════════════════════════════════════════
            case 'ribbon-flow': {
                const flowSpeed = breathParams.flowSpeed || 0.8;
                particle.time = (particle.time || Math.random() * 100) + dt * flowSpeed;

                const segmentCount = 180; // Very smooth
                const noiseAmplitude = 2 + breathParams.intensity * 1.5; // Low amplitude

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const phaseAngle = angle - particle.time * 0.3;

                    // Very smooth, single-frequency noise (silk-like)
                    const smoothNoise = Math.sin(phaseAngle * 2) * noiseAmplitude;
                    const r = ringRadius + smoothNoise;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
                }

                particle.angle += dt * 0.2 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                particle.opacity = 0.45;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // CIRCUIT-PULSE: Digital, sharp, with pulse animation
            // ═══════════════════════════════════════════════════════════════════════════
            case 'circuit-pulse': {
                const pulseRate = breathParams.pulseRate || 1.0;
                particle.time = (particle.time || Math.random() * 100) + dt * pulseRate;

                const segmentCount = 90;
                const baseJitter = 3 + breathParams.intensity * 2;

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;

                    // Sharp digital jitter (steps not smooth)
                    const step = Math.floor(angle * 8 + particle.time * 3) % 4;
                    const digitalNoise = (step === 0 ? 1 : step === 2 ? -1 : 0) * baseJitter;
                    const spike = Math.random() > 0.95 ? (Math.random() - 0.5) * 8 : 0;

                    const r = ringRadius + digitalNoise + spike;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
                }

                // Pulse opacity
                particle.pulsePhase = (particle.pulsePhase || 0) + dt * pulseRate * 2;
                particle.opacity = 0.5 + Math.sin(particle.pulsePhase) * 0.2;
                particle.angle += dt * 1.0 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // FLARE-TURBULENCE: Heat distortion, turbulent movement
            // ═══════════════════════════════════════════════════════════════════════════
            case 'flare-turbulence': {
                const turbulence = breathParams.turbulence || 1.0;
                particle.time = (particle.time || Math.random() * 100) + dt * turbulence * 0.8;

                const segmentCount = 100;
                const noiseAmp = 5 + breathParams.intensity * 4;

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const phaseAngle = angle + particle.time;

                    // Turbulent, multi-layer noise
                    const turb1 = Math.sin(phaseAngle * 5 + Math.sin(phaseAngle * 3)) * 0.5;
                    const turb2 = Math.sin(phaseAngle * 11 + Math.cos(phaseAngle * 7)) * 0.3;
                    const turb3 = (Math.random() - 0.5) * 0.4 * turbulence;
                    const noise = (turb1 + turb2 + turb3) * noiseAmp;

                    const r = ringRadius + noise;
                    // Store angle for hue gradient
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r, angle });
                }

                particle.isFlare = true;
                particle.angle += dt * 0.4 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                particle.opacity = 0.65;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // WISP-DRIFT: Magical wisps traveling around the ring
            // ═══════════════════════════════════════════════════════════════════════════
            case 'wisp-drift': {
                const wispSpeed = breathParams.wispSpeed || 0.5;
                particle.angle += dt * wispSpeed * particle.rotationDir;

                // Wisps have no arc segments - just particle positions
                particle.arcSegments = null;

                // More pronounced vertical oscillation
                particle.wispPhase = (particle.wispPhase || Math.random() * Math.PI * 2) + dt * 2.0;
                const vertOffset = Math.sin(particle.wispPhase) * 8;

                // Position on ring with wider offset
                const baseR = ringRadius + (Math.random() - 0.5) * 10;
                particle.x = centerX + Math.cos(particle.angle) * baseR;
                particle.y = centerY + Math.sin(particle.angle) * baseR + vertOffset;

                // Higher visibility, slower fade
                particle.lifePhase = (particle.lifePhase || Math.random()) + dt * 0.2;
                particle.opacity = 0.55 + Math.sin(particle.lifePhase * Math.PI) * 0.35;
                particle.wispSize = 1.5 + Math.sin(particle.lifePhase * Math.PI * 0.5) * 0.5;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // CHAOS-ELECTRIC: Aggressive, high amplitude, with branching
            // ═══════════════════════════════════════════════════════════════════════════
            case 'chaos-electric': {
                const chaosLevel = breathParams.chaosLevel || 1.0;
                particle.time = (particle.time || Math.random() * 100) + dt * chaosLevel;

                const segmentCount = 80;
                const baseAmp = 8 + breathParams.intensity * 6;

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const phaseAngle = angle - particle.time * 0.8;

                    // High chaos noise
                    const chaos1 = Math.sin(phaseAngle * 6) * 0.6;
                    const chaos2 = Math.sin(phaseAngle * 13 + particle.time) * 0.4;
                    const chaos3 = (Math.random() - 0.5) * chaosLevel * 0.8;
                    const spike = Math.random() > 0.92 ? (Math.random() - 0.5) * 15 * chaosLevel : 0;
                    const noise = (chaos1 + chaos2 + chaos3) * baseAmp + spike;

                    const r = ringRadius + noise;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r, angle });
                }

                particle.isChaos = true;
                particle.angle += dt * 1.2 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                particle.opacity = 0.7;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // QUANTUM-WAVE: Sine-based radius ripples, futuristic
            // ═══════════════════════════════════════════════════════════════════════════
            case 'quantum-wave': {
                const waveFreq = breathParams.waveFreq || 4;
                const waveAmp = breathParams.waveAmp || 8;  // Much higher amplitude
                particle.time = (particle.time || Math.random() * 100) + dt * 1.2;

                const segmentCount = 120;

                particle.arcSegments = [];

                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;

                    // Stronger sine wave ripples with secondary harmonic
                    const wave1 = Math.sin(angle * waveFreq + particle.time * 2.5) * waveAmp;
                    const wave2 = Math.sin(angle * (waveFreq * 2) + particle.time * 1.5) * (waveAmp * 0.3);
                    const r = ringRadius + wave1 + wave2;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r, angle });
                }

                particle.isQuantum = true;
                particle.angle += dt * 0.6 * particle.rotationDir;
                particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                particle.opacity = 0.7;
                break;
            }

            // SNOWGLOBE-ACTIVE - Upgraded: parallax layers + swirl + twinkle
            case 'snowglobe-active': {
                const globeRadius = ringRadius * 1.15;

                // ★ PARALLAX LAYER SYSTEM - assign layer based on particle id
                if (!particle.snowLayer) {
                    const layerRoll = particle.id % 10;
                    if (layerRoll < 3) {
                        particle.snowLayer = 'foreground'; // 30% - large, fast, bright
                        particle.layerSpeed = 1.4;
                        particle.layerSize = 1.3;
                        particle.layerOpacity = 0.8;
                    } else if (layerRoll < 7) {
                        particle.snowLayer = 'midground'; // 40% - medium
                        particle.layerSpeed = 1.0;
                        particle.layerSize = 1.0;
                        particle.layerOpacity = 0.6;
                    } else {
                        particle.snowLayer = 'background'; // 30% - tiny, slow, dim
                        particle.layerSpeed = 0.6;
                        particle.layerSize = 0.6;
                        particle.layerOpacity = 0.35;
                    }
                }

                // ★ SLOW BOWL ROTATION (swirl around center)
                particle.bowlAngle = (particle.bowlAngle || Math.random() * Math.PI * 2) + dt * 0.15;
                const swirl = Math.sin(particle.bowlAngle) * 3;

                // ★ CURL MOTION - spiral as it falls
                particle.curlPhase = (particle.curlPhase || Math.random() * Math.PI * 2) + dt * 1.5;
                const curl = Math.sin(particle.curlPhase) * 4 * particle.layerSpeed;

                // Layer-adjusted falling speed
                particle.y += dt * baseSpeed * 20 * particle.layerSpeed;
                particle.angle += dt * baseSpeed * 0.3;
                const swirlOffset = Math.sin(particle.angle) * 8;
                particle.x += (swirlOffset + curl + swirl) * dt;

                if (breathParams.shake) {
                    particle.x += (Math.random() - 0.5) * 40 * dt;
                    particle.y += (Math.random() - 0.5) * 25 * dt;
                }

                const dx = particle.x - centerX;
                const dy = particle.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > globeRadius) {
                    particle.x = centerX + (dx / dist) * globeRadius * 0.95;
                    particle.y = centerY + (dy / dist) * globeRadius * 0.95;
                }

                if (particle.y > centerY + globeRadius * 0.9) {
                    particle.y = centerY - globeRadius * 0.85;
                    particle.x = centerX + (Math.random() - 0.5) * globeRadius * 1.8;
                }

                // ★ OCCASIONAL TWINKLE SPARK
                particle.twinkleTimer = (particle.twinkleTimer || Math.random() * 5) - dt;
                if (particle.twinkleTimer <= 0) {
                    particle.isTwinkling = true;
                    particle.twinkleTimer = 3 + Math.random() * 4;
                } else if (particle.twinkleTimer > 0.1) {
                    particle.isTwinkling = false;
                }

                particle.opacity = particle.layerOpacity + Math.random() * 0.15;
                particle.displaySize = particle.size * particle.layerSize;
                break;
            }

            // METEOR-CYCLE - Upgraded: 3-layer streaks + radial drift + dissolve
            case 'meteor-cycle': {
                const meteorPhase = breathParams.phase || 'fade';
                const cloudY = centerY - size * 0.48;
                const direction = cycleDirectionRef.current;

                // ★ 3-LAYER STREAK SYSTEM - assign layer based on particle id
                if (!particle.meteorLayer) {
                    const layerRoll = particle.id % 10;
                    if (layerRoll < 2) {
                        particle.meteorLayer = 'long';    // 20% - bright streaks
                        particle.streakMult = 2.0;
                        particle.brightMult = 1.3;
                    } else if (layerRoll < 6) {
                        particle.meteorLayer = 'medium';  // 40% - standard
                        particle.streakMult = 1.0;
                        particle.brightMult = 1.0;
                    } else {
                        particle.meteorLayer = 'micro';   // 40% - tiny, dim
                        particle.streakMult = 0.5;
                        particle.brightMult = 0.6;
                    }
                }

                // ★ SLOW RADIAL DRIFT - trajectory rotation over time
                particle.driftAngle = (particle.driftAngle || 0) + dt * 0.0015;

                switch (meteorPhase) {
                    case 'cloud':
                        if (particle.opacity < 0.35) {
                            particle.opacity += dt * 0.6;
                        }
                        particle.x += Math.sin(particle.phase + Date.now() * 0.004) * 12 * dt;
                        particle.y += Math.cos(particle.phase * 1.5 + Date.now() * 0.003) * 6 * dt;
                        particle.y += (cloudY - particle.y) * dt * 0.5;
                        if (particle.y > cloudY + size * 0.15) {
                            particle.y = cloudY;
                        }
                        break;

                    case 'stop':
                        particle.x += Math.sin(particle.phase + Date.now() * 0.002) * 5 * dt;
                        particle.y += Math.cos(particle.phase * 1.5 + Date.now() * 0.0015) * 3 * dt;
                        break;

                    case 'rain':
                        const baseAngle = direction > 0 ? Math.PI * 0.35 : Math.PI * 0.65;
                        const streakAngle = baseAngle + particle.driftAngle;
                        const streakSpeed = baseSpeed * 200 * (0.8 + particle.streakMult * 0.2);

                        particle.x += Math.cos(streakAngle) * streakSpeed * dt;
                        particle.y += Math.sin(streakAngle) * streakSpeed * dt;
                        particle.opacity = Math.min(0.8 * particle.brightMult, particle.opacity + dt * 2);
                        particle.streakAngle = streakAngle;
                        particle.streakLength = 8 * particle.streakMult;

                        if (particle.y > centerY + size * 0.4) {
                            // ★ STREAK DISSOLVE - spawn mini-sparks effect
                            particle.isDissolving = true;
                            particle.dissolveTime = 0.15;

                            // Reset
                            particle.x = centerX + (Math.random() - 0.5) * size * 1.0;
                            particle.y = cloudY + Math.random() * size * 0.1;
                            particle.opacity = 0.5;
                            particle.isDissolving = false;
                        }
                        break;

                    case 'fade':
                    default:
                        particle.opacity = Math.max(0, particle.opacity - dt * 1.2);
                        if (particle.opacity <= 0.05) {
                            particle.x = centerX + (Math.random() - 0.5) * size * 1.0;
                            particle.y = cloudY + Math.random() * size * 0.1;
                            particle.opacity = 0;
                        }
                        break;
                }
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // AETHER-FLOW: Flowing river of particles along the ring path
            // ═══════════════════════════════════════════════════════════════════════════
            case 'aether-flow': {
                const flowSpeed = breathParams.flowSpeed || 0.8;
                particle.pathProgress = (particle.pathProgress || Math.random()) + dt * flowSpeed * 0.3;
                if (particle.pathProgress > 1) particle.pathProgress -= 1;

                const angle = particle.pathProgress * Math.PI * 2;
                // Slight radial wobble for organic feel
                const wobble = Math.sin(particle.pathProgress * 8 + Date.now() * 0.002) * 2;
                const r = ringRadius + wobble;

                particle.x = centerX + Math.cos(angle) * r;
                particle.y = centerY + Math.sin(angle) * r;
                particle.opacity = 0.5 + Math.sin(particle.pathProgress * Math.PI * 2) * 0.3;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // SINGULARITY-WARP: Spacetime distortion curves
            // ═══════════════════════════════════════════════════════════════════════════
            case 'singularity-warp': {
                const distortAmp = breathParams.distortAmp || 8;
                const noiseScale = breathParams.noiseScale || 3.0;
                particle.time = (particle.time || Math.random() * 100) + dt * 0.8;

                const segmentCount = 100;
                particle.arcSegments = [];

                // Main distortion ring
                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const noise = Math.sin(angle * noiseScale + particle.time) * distortAmp;
                    const r = ringRadius + noise;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
                }

                // Inner ripple
                particle.innerArcSegments = [];
                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const noise = Math.sin(angle * 3 + particle.time * 0.5) * (distortAmp * 0.5);
                    const r = ringRadius - 4 + noise;
                    particle.innerArcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
                }

                particle.opacity = 0.5;
                particle.x = centerX;
                particle.y = centerY;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // CELESTIAL-OSCILLATE: Mandala-like oscillating rings
            // ═══════════════════════════════════════════════════════════════════════════
            case 'celestial-oscillate': {
                const amplitude = breathParams.amplitude || 6;
                const frequencies = breathParams.frequencies || [3, 5, 7, 9];
                particle.time = (particle.time || 0) + dt * 0.8;

                const segmentCount = 100;
                const layerIndex = particle.id % 4;
                const freq = frequencies[layerIndex] || 3;

                particle.arcSegments = [];
                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const wave = Math.sin(angle * freq + particle.time) * amplitude * (1 + layerIndex * 0.3);
                    const r = ringRadius + wave;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
                }

                // Flash when harmonic phases align
                particle.harmonicFlash = Math.abs(Math.sin(particle.time * freq)) > 0.98 ? 1.5 : 1.0;
                particle.opacity = 0.35 * particle.harmonicFlash;
                particle.x = centerX;
                particle.y = centerY;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // DRAGON-FLOW: Serpentine ley line arcs
            // ═══════════════════════════════════════════════════════════════════════════
            case 'dragon-flow': {
                const amplitude = breathParams.amplitude || 10;
                const jitter = breathParams.jitter || 0.3;
                particle.time = (particle.time || Math.random() * 100) + dt * 0.4;

                const segmentCount = 100;
                particle.arcSegments = [];

                // Primary serpentine path
                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2;
                    const phaseAngle = angle - particle.time * 0.3;
                    const serpentine = Math.sin(phaseAngle * 1.2) * amplitude;
                    const microJitter = (Math.random() - 0.5) * jitter * 2;
                    const r = ringRadius + serpentine + microJitter;
                    particle.arcSegments.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r, angle });
                }

                // Secondary offset arc
                particle.secondaryArc = [];
                for (let i = 0; i <= segmentCount; i++) {
                    const t = i / segmentCount;
                    const angle = t * Math.PI * 2 + 0.07;
                    const serpentine = Math.sin((angle - particle.time * 0.3 + 0.2) * 1.2) * amplitude;
                    const r = ringRadius + serpentine;
                    particle.secondaryArc.push({ x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r });
                }

                particle.opacity = 0.85;
                particle.x = centerX;
                particle.y = centerY;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // ORBITAL-FIRE: Embers orbiting the ring smoothly
            // ═══════════════════════════════════════════════════════════════════════════
            case 'orbital-fire': {
                const orbitSpeed = breathParams.orbitSpeed || 0.8;
                particle.orbitAngle = (particle.orbitAngle || particle.angle) + dt * orbitSpeed * particle.rotationDir;

                // Slight radial noise
                const noise = Math.sin(particle.orbitAngle * 3 + Date.now() * 0.003) * 3;
                const r = ringRadius + noise;

                particle.x = centerX + Math.cos(particle.orbitAngle) * r;
                particle.y = centerY + Math.sin(particle.orbitAngle) * r;

                // Occasional flare
                particle.flareTimer = (particle.flareTimer || Math.random() * 3) - dt;
                if (particle.flareTimer <= 0) {
                    particle.isFlaring = true;
                    particle.flareTimer = 2 + Math.random() * 3;
                } else if (particle.flareTimer > 0.2) {
                    particle.isFlaring = false;
                }

                particle.opacity = particle.isFlaring ? 1.0 : 0.7;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // VOID-PULSE: Radial pulses emanating from the ring
            // ═══════════════════════════════════════════════════════════════════════════
            case 'void-pulse': {
                const pulseRate = breathParams.pulseRate || 0.5;
                const pulseAmp = breathParams.pulseAmp || 30;

                // Initialize pulse
                if (!particle.pulseRadius) {
                    particle.pulseRadius = ringRadius;
                    particle.pulseOpacity = 0.4;
                    particle.pulseDelay = particle.id * 0.5;
                }

                particle.pulseDelay -= dt;
                if (particle.pulseDelay <= 0) {
                    particle.pulseRadius += dt * pulseAmp * pulseRate;
                    particle.pulseOpacity *= 0.97;

                    // Reset when faded
                    if (particle.pulseOpacity < 0.02) {
                        particle.pulseRadius = ringRadius;
                        particle.pulseOpacity = 0.4;
                        particle.pulseDelay = 1.5 + Math.random();
                    }
                }

                particle.x = centerX;
                particle.y = centerY;
                particle.opacity = particle.pulseOpacity;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // PRISMATIC-SPLIT: Refraction sparkles with color splitting
            // ═══════════════════════════════════════════════════════════════════════════
            case 'prismatic-split': {
                const splitChance = breathParams.splitChance || 0.3;
                const hueShift = breathParams.hueShift || 12;

                // Orbit around ring
                particle.angle += dt * baseSpeed * 0.5 * particle.rotationDir;
                const baseR = ringRadius + (Math.random() - 0.5) * 8;
                particle.x = centerX + Math.cos(particle.angle) * baseR;
                particle.y = centerY + Math.sin(particle.angle) * baseR;

                // Splitting behavior
                particle.splitTimer = (particle.splitTimer || Math.random() * 2) - dt;
                if (particle.splitTimer <= 0 && !particle.isSplitting) {
                    if (Math.random() < splitChance) {
                        particle.isSplitting = true;
                        particle.splitProgress = 0;
                        particle.splitHue1 = hueShift;
                        particle.splitHue2 = -hueShift;
                    }
                    particle.splitTimer = 1 + Math.random() * 2;
                }

                if (particle.isSplitting) {
                    particle.splitProgress += dt * 3;
                    if (particle.splitProgress >= 1) {
                        particle.isSplitting = false;
                    }
                }

                particle.opacity = 0.7 + Math.sin(particle.angle * 4) * 0.2;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // STARDUST-DRIFT: Hypnotic dust flowing along the ring
            // ═══════════════════════════════════════════════════════════════════════════
            case 'stardust-drift': {
                const flowSpeed = breathParams.flowSpeed || 0.6;
                const fallChance = breathParams.fallChance || 0.02;

                // Tangential movement along ring
                particle.angle += dt * flowSpeed * 0.4 * particle.rotationDir;

                // Falling behavior
                if (!particle.isFalling && Math.random() < fallChance * dt) {
                    particle.isFalling = true;
                    particle.fallVelocity = 0;
                }

                if (particle.isFalling) {
                    particle.fallVelocity += dt * 20;
                    particle.y += particle.fallVelocity * dt;
                    particle.opacity -= dt * 0.5;

                    if (particle.opacity <= 0 || particle.y > centerY + size * 0.5) {
                        // Reset
                        particle.isFalling = false;
                        particle.angle = Math.random() * Math.PI * 2;
                        particle.opacity = 0.8;
                        particle.fallVelocity = 0;
                    }
                } else {
                    particle.x = centerX + Math.cos(particle.angle) * ringRadius;
                    particle.y = centerY + Math.sin(particle.angle) * ringRadius;
                    particle.opacity = 0.7 + Math.sin(particle.angle * 2) * 0.2;
                }
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // SPIRIT-ORBIT: Two spirit lights chasing each other
            // ═══════════════════════════════════════════════════════════════════════════
            case 'spirit-orbit': {
                const speed1 = breathParams.speed1 || 1.2;
                const speed2 = breathParams.speed2 || 1.5;

                // Assign speeds based on particle id
                const mySpeed = particle.id === 0 ? speed1 : speed2;
                particle.spiritAngle = (particle.spiritAngle || particle.id * Math.PI) + dt * mySpeed;

                particle.x = centerX + Math.cos(particle.spiritAngle) * ringRadius;
                particle.y = centerY + Math.sin(particle.spiritAngle) * ringRadius;

                // Glint when close to other spirit (angle diff < 0.3 rad)
                const otherAngle = particle.id === 0 ? particle.spiritAngle + Math.PI : particle.spiritAngle - Math.PI;
                const angleDiff = Math.abs(Math.sin(particle.spiritAngle - otherAngle * (speed2 / speed1)));
                particle.isGlinting = angleDiff < 0.15;

                particle.opacity = particle.isGlinting ? 1.0 : 0.75;
                break;
            }

            // ═══════════════════════════════════════════════════════════════════════════
            // FOREST-DRIFT: Leaf-shaped particles drifting from the ring
            // ═══════════════════════════════════════════════════════════════════════════
            case 'forest-drift': {
                const fallSpeed = breathParams.fallSpeed || 0.5;
                const rotSpeed = breathParams.rotSpeed || 0.5;

                // Initialize from ring
                if (!particle.hasSpawned) {
                    particle.hasSpawned = true;
                    const spawnAngle = Math.random() * Math.PI * 2;
                    particle.x = centerX + Math.cos(spawnAngle) * ringRadius;
                    particle.y = centerY + Math.sin(spawnAngle) * ringRadius;
                    particle.leafRotation = Math.random() * Math.PI * 2;
                    particle.driftPhase = Math.random() * Math.PI * 2;
                }

                // Falling with gentle sway
                particle.y += dt * fallSpeed * 30;
                particle.driftPhase += dt * 2;
                particle.x += Math.sin(particle.driftPhase) * dt * 15;
                particle.leafRotation += dt * rotSpeed * 2;

                // Reset when fallen too far
                if (particle.y > centerY + size * 0.5) {
                    const spawnAngle = Math.random() * Math.PI * 2;
                    particle.x = centerX + Math.cos(spawnAngle) * ringRadius;
                    particle.y = centerY + Math.sin(spawnAngle) * ringRadius;
                    particle.opacity = 0.5;
                }

                particle.opacity = Math.max(0.1, 0.5 - (particle.y - centerY) / (size * 0.4) * 0.3);
                break;
            }

            // Legacy patterns
            case 'orbit-steady': {
                particle.angle += dt * baseSpeed * 0.3;
                const wobble = Math.sin(particle.phase + Date.now() * 0.002) * 5;
                particle.x = centerX + Math.cos(particle.angle) * (particle.distance + wobble);
                particle.y = centerY + Math.sin(particle.angle) * (particle.distance + wobble);
                break;
            }

            case 'burst': {
                if (breathParams.disperse) {
                    particle.distance += dt * baseSpeed * 50;
                    if (particle.distance > size * 0.5) particle.distance = size * 0.1;
                } else {
                    particle.distance *= 0.99;
                }
                particle.angle += dt * baseSpeed * 0.3;
                particle.x = centerX + Math.cos(particle.angle) * particle.distance;
                particle.y = centerY + Math.sin(particle.angle) * particle.distance;
                break;
            }

            case 'drift': {
                const driftX = Math.sin(particle.phase + Date.now() * 0.0008) * 15;
                const driftY = Math.cos(particle.phase * 1.3 + Date.now() * 0.0006) * 12;
                particle.x = particle.baseX + driftX;
                particle.y = particle.baseY + driftY;
                break;
            }

            default:
                particle.angle += dt * baseSpeed * 0.3;
                particle.x = centerX + Math.cos(particle.angle) * particle.distance;
                particle.y = centerY + Math.sin(particle.angle) * particle.distance;
        }

        return particle;
    }, [fx.motionPattern, fx.particleSize, breathParams, size, phase, ringScale, ringRadiusProp]);

    const drawParticle = useCallback((ctx, particle, color) => {
        const glowIntensity = breathParams.glow * intensity;
        const baseOpacity = particle.opacity * intensity;
        const s = particle.size * (0.8 + intensity * 0.4);
        const colorVar = particle.colorVar || { brightnessOffset: 0, hueOffset: 0 };

        ctx.save();

        // Electric arcs use absolute coordinates, others use translate
        if (fx.particleType === 'lightning-arc') {
            // ═══════════════════════════════════════════════════════════════════════════
            // PLASMA CONDUIT v2: Continuous ring with core + 2 ghost offset lines
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const colorVar = particle.colorVar || { brightnessOffset: 0, hueOffset: 0 };

                // MUCH reduced brightness (60-70% reduction)
                const masterOpacity = baseOpacity * 0.35;

                // Use lighter blending for subtle glow
                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // --- GHOST LINE 1: Faint offset (behind, phase shifted) ---
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.4, colorVar.brightnessOffset - 0.15, colorVar.hueOffset);
                ctx.lineWidth = 2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = getModifiedColor(baseColor, 0.3, colorVar.brightnessOffset, colorVar.hueOffset);

                ctx.beginPath();
                for (let i = 0; i < particle.arcSegments.length; i++) {
                    const seg = particle.arcSegments[i];
                    // Offset by phase shift (use nearby segment with wrap)
                    const offsetIdx = (i + Math.floor(particle.arcSegments.length * (particle.ghostPhase1 || 0.15))) % particle.arcSegments.length;
                    const offsetSeg = particle.arcSegments[offsetIdx];
                    const offsetX = (seg.x - offsetSeg.x) * 0.3;
                    const offsetY = (seg.y - offsetSeg.y) * 0.3;
                    if (i === 0) {
                        ctx.moveTo(seg.x + offsetX, seg.y + offsetY);
                    } else {
                        ctx.lineTo(seg.x + offsetX, seg.y + offsetY);
                    }
                }
                ctx.closePath();
                ctx.stroke();

                // --- GHOST LINE 2: Even fainter offset (different phase) ---
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.25, colorVar.brightnessOffset - 0.2, colorVar.hueOffset + 10);
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 6;

                ctx.beginPath();
                for (let i = 0; i < particle.arcSegments.length; i++) {
                    const seg = particle.arcSegments[i];
                    const offsetIdx = (i + Math.floor(particle.arcSegments.length * (particle.ghostPhase2 || 0.35))) % particle.arcSegments.length;
                    const offsetSeg = particle.arcSegments[offsetIdx];
                    const offsetX = (seg.x - offsetSeg.x) * 0.2;
                    const offsetY = (seg.y - offsetSeg.y) * 0.2;
                    if (i === 0) {
                        ctx.moveTo(seg.x - offsetX, seg.y - offsetY);
                    } else {
                        ctx.lineTo(seg.x - offsetX, seg.y - offsetY);
                    }
                }
                ctx.closePath();
                ctx.stroke();

                // --- MAIN CORE LINE: Sharp, brightest (but still subtle) ---
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.8, colorVar.brightnessOffset, colorVar.hueOffset);
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 4;
                ctx.shadowColor = getModifiedColor(baseColor, 0.5, colorVar.brightnessOffset + 0.1, colorVar.hueOffset);

                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
            }

            // Drift spark at particle position (very subtle, small)
            ctx.shadowBlur = 6;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.5, colorVar.brightnessOffset, colorVar.hueOffset);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (fx.particleType === 'plasma-arc') {
            // ═══════════════════════════════════════════════════════════════════════════
            // PLASMA-ARC: Sci-fi style with sharper core + echo lines + visible sparks
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const colorVar = particle.colorVar || { brightnessOffset: 0, hueOffset: 0 };

                // Higher opacity than shimmer (more sci-fi visible)
                const masterOpacity = baseOpacity * 0.5;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // --- ECHO LINE 1: Trailing offset (faint, behind main) ---
                const echo1Offset = Math.floor(particle.arcSegments.length * (particle.echo1Phase || 0.08));
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.35, colorVar.brightnessOffset - 0.1, colorVar.hueOffset + 5);
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 10;
                ctx.shadowColor = getModifiedColor(baseColor, 0.4, colorVar.brightnessOffset, colorVar.hueOffset);

                ctx.beginPath();
                for (let i = 0; i < particle.arcSegments.length; i++) {
                    const idx = (i + echo1Offset) % particle.arcSegments.length;
                    const seg = particle.arcSegments[idx];
                    if (i === 0) {
                        ctx.moveTo(seg.x, seg.y);
                    } else {
                        ctx.lineTo(seg.x, seg.y);
                    }
                }
                ctx.closePath();
                ctx.stroke();

                // --- ECHO LINE 2: Second trailing offset (even fainter) ---
                const echo2Offset = Math.floor(particle.arcSegments.length * (particle.echo2Phase || 0.18));
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.2, colorVar.brightnessOffset - 0.15, colorVar.hueOffset + 10);
                ctx.lineWidth = 1.8;
                ctx.shadowBlur = 6;

                ctx.beginPath();
                for (let i = 0; i < particle.arcSegments.length; i++) {
                    const idx = (i + echo2Offset) % particle.arcSegments.length;
                    const seg = particle.arcSegments[idx];
                    if (i === 0) {
                        ctx.moveTo(seg.x, seg.y);
                    } else {
                        ctx.lineTo(seg.x, seg.y);
                    }
                }
                ctx.closePath();
                ctx.stroke();

                // --- MAIN CORE LINE: Sharp, bright, visible backbone ---
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 1.0, colorVar.brightnessOffset + 0.1, colorVar.hueOffset);
                ctx.lineWidth = 1.8;
                ctx.shadowBlur = 6;
                ctx.shadowColor = getModifiedColor(baseColor, 0.7, colorVar.brightnessOffset + 0.15, colorVar.hueOffset);

                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
            }

            // Drift spark at particle position (more visible, follows flow)
            ctx.shadowBlur = 10;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.8, colorVar.brightnessOffset + 0.15, colorVar.hueOffset);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Spark glow halo
            ctx.shadowBlur = 15;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.3, colorVar.brightnessOffset, colorVar.hueOffset);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 1.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (fx.particleType === 'plasma-v2') {
            // ═══════════════════════════════════════════════════════════════════════════
            // PLASMA V2: With inner core line + amplitude-modulated rendering
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const colorVar = particle.colorVar || { brightnessOffset: 0, hueOffset: 0 };
                const masterOpacity = baseOpacity * 0.55;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Echo lines
                const echo1Off = Math.floor(particle.arcSegments.length * (particle.echo1Phase || 0.06));
                const echo2Off = Math.floor(particle.arcSegments.length * (particle.echo2Phase || 0.14));

                // Echo 1
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.3, colorVar.brightnessOffset - 0.1, colorVar.hueOffset);
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 10;
                ctx.shadowColor = getModifiedColor(baseColor, 0.4, 0, 0);
                ctx.beginPath();
                for (let i = 0; i < particle.arcSegments.length; i++) {
                    const idx = (i + echo1Off) % particle.arcSegments.length;
                    const seg = particle.arcSegments[idx];
                    if (i === 0) ctx.moveTo(seg.x, seg.y);
                    else ctx.lineTo(seg.x, seg.y);
                }
                ctx.closePath();
                ctx.stroke();

                // Echo 2
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.2, colorVar.brightnessOffset - 0.15, colorVar.hueOffset + 10);
                ctx.lineWidth = 1.8;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                for (let i = 0; i < particle.arcSegments.length; i++) {
                    const idx = (i + echo2Off) % particle.arcSegments.length;
                    const seg = particle.arcSegments[idx];
                    if (i === 0) ctx.moveTo(seg.x, seg.y);
                    else ctx.lineTo(seg.x, seg.y);
                }
                ctx.closePath();
                ctx.stroke();

                // Main core line
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.9, colorVar.brightnessOffset + 0.1, colorVar.hueOffset);
                ctx.lineWidth = 1.8;
                ctx.shadowBlur = 5;
                ctx.shadowColor = getModifiedColor(baseColor, 0.7, 0.15, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // INNER CORE: Sharp 1px bright line
                if (particle.hasInnerCore) {
                    ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 1.2, colorVar.brightnessOffset + 0.25, colorVar.hueOffset - 5);
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = 'rgba(255,255,255,0.6)';
                    ctx.beginPath();
                    ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                    for (let i = 1; i < particle.arcSegments.length; i++) {
                        ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                ctx.globalCompositeOperation = 'source-over';
            }

            // Drift spark
            ctx.shadowBlur = 12;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, colorVar.brightnessOffset + 0.2, colorVar.hueOffset);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.7, 0, Math.PI * 2);
            ctx.fill();

        } else if (fx.particleType === 'plasma-ribbon') {
            // ═══════════════════════════════════════════════════════════════════════════
            // PLASMA RIBBON: Silk-like, smooth flowing glow
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const masterOpacity = baseOpacity * 0.4;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Soft outer glow
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.3, -0.1, 10);
                ctx.lineWidth = 6;
                ctx.shadowBlur = 20;
                ctx.shadowColor = getModifiedColor(baseColor, 0.4, 0, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Core ribbon
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.7, 0.05, 0);
                ctx.lineWidth = 2;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

        } else if (fx.particleType === 'circuit-line') {
            // ═══════════════════════════════════════════════════════════════════════════
            // CIRCUIT LINE: Digital, sharp, pulse animation
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const masterOpacity = baseOpacity * particle.opacity;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'butt'; // Sharp edges for digital look
                ctx.lineJoin = 'miter';

                // Main circuit line
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.8, 0.1, 0);
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 8;
                ctx.shadowColor = getModifiedColor(baseColor, 0.6, 0.15, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

            // Pulse spark
            ctx.shadowBlur = 10;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 1.0, 0.2, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.6, 0, Math.PI * 2);
            ctx.fill();

        } else if (fx.particleType === 'solar-flare') {
            // ═══════════════════════════════════════════════════════════════════════════
            // SOLAR FLARE: Heat distortion with orange-red gradient feel
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const masterOpacity = baseOpacity * 0.6;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Outer corona glow
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.25, -0.1, -20);
                ctx.lineWidth = 8;
                ctx.shadowBlur = 25;
                ctx.shadowColor = getModifiedColor(baseColor, 0.5, 0, -15);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Inner heat core
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.7, 0.15, 0);
                ctx.lineWidth = 2.5;
                ctx.shadowBlur = 10;
                ctx.shadowColor = getModifiedColor(baseColor, 0.8, 0.2, 10);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

            // Flare spark
            ctx.shadowBlur = 15;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, 0.25, 15);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.8, 0, Math.PI * 2);
            ctx.fill();

        } else if (fx.particleType === 'wisp-particle') {
            // ═══════════════════════════════════════════════════════════════════════════
            // WISP PARTICLE: Floating wisps - much more visible now
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';
            const wispMult = particle.wispSize || 1.5;

            // Outer halo (large, faint)
            ctx.shadowBlur = 25;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.6, 0, 5);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.4, -0.1, 10);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 3 * wispMult, 0, Math.PI * 2);
            ctx.fill();

            // Wisp glow (medium)
            ctx.shadowBlur = 18;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.7, 0, 0);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.7, 0.05, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 1.8 * wispMult, 0, Math.PI * 2);
            ctx.fill();

            // Wisp core (bright)
            ctx.shadowBlur = 8;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 1.0, 0.2, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.8 * wispMult, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';

        } else if (fx.particleType === 'chaos-arc') {
            // ═══════════════════════════════════════════════════════════════════════════
            // CHAOS ARC: Aggressive, high contrast, with occasional flicker
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const flickerMod = Math.random() > 0.9 ? 0.5 : 1.0; // Occasional flicker
                const masterOpacity = baseOpacity * 0.65 * flickerMod;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Outer chaos glow
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.4, -0.05, 5);
                ctx.lineWidth = 5;
                ctx.shadowBlur = 18;
                ctx.shadowColor = getModifiedColor(baseColor, 0.6, 0, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Core chaos line
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 1.0, 0.15, 0);
                ctx.lineWidth = 2;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

            // Chaos spark
            ctx.shadowBlur = 12;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 1.0, 0.2, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.7, 0, Math.PI * 2);
            ctx.fill();

        } else if (fx.particleType === 'ripple-wave') {
            // ═══════════════════════════════════════════════════════════════════════════
            // RIPPLE WAVE: Quantum sine-based - much more visible
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const masterOpacity = baseOpacity * 0.7;  // Much higher

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Outer wave glow (wider, brighter)
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 0.5, -0.05, 15);
                ctx.lineWidth = 6;
                ctx.shadowBlur = 20;
                ctx.shadowColor = getModifiedColor(baseColor, 0.6, 0, 10);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Inner wave core (sharper)
                ctx.strokeStyle = getModifiedColor(baseColor, masterOpacity * 1.0, 0.15, 0);
                ctx.lineWidth = 2;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

            // Quantum spark (larger)
            ctx.shadowBlur = 15;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, 0.15, 5);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.8, 0, Math.PI * 2);
            ctx.fill();

        } else if (fx.particleType === 'aether-mote') {
            // ═══════════════════════════════════════════════════════════════════════════
            // AETHER MOTE: Flowing river particles with soft glow
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';

            // Outer glow
            ctx.shadowBlur = 12;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.5, 0, 0);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.5, 0, 10);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.shadowBlur = 6;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, 0.15, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';

        } else if (fx.particleType === 'distortion-arc') {
            // ═══════════════════════════════════════════════════════════════════════════
            // DISTORTION ARC: Spacetime warping rings
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Main distortion ring
                ctx.strokeStyle = getModifiedColor(baseColor, baseOpacity * 0.2, 0, 0);
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = getModifiedColor(baseColor, 0.3, 0, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                // Inner ripple
                if (particle.innerArcSegments && particle.innerArcSegments.length > 1) {
                    ctx.strokeStyle = getModifiedColor(baseColor, baseOpacity * 0.12, -0.1, 10);
                    ctx.lineWidth = 1.5;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.moveTo(particle.innerArcSegments[0].x, particle.innerArcSegments[0].y);
                    for (let i = 1; i < particle.innerArcSegments.length; i++) {
                        ctx.lineTo(particle.innerArcSegments[i].x, particle.innerArcSegments[i].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                ctx.globalCompositeOperation = 'source-over';
            }

        } else if (fx.particleType === 'harmonic-ring') {
            // ═══════════════════════════════════════════════════════════════════════════
            // HARMONIC RING: Mandala-like oscillating curves
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);
                const flashMod = particle.harmonicFlash || 1.0;

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.strokeStyle = getModifiedColor(baseColor, baseOpacity * 0.15 * flashMod, 0.05, 0);
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 8 * flashMod;
                ctx.shadowColor = getModifiedColor(baseColor, 0.4, 0, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

        } else if (fx.particleType === 'dragon-arc') {
            // ═══════════════════════════════════════════════════════════════════════════
            // DRAGON ARC: Serpentine ley line energy
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.arcSegments && particle.arcSegments.length > 1) {
                const baseColor = parseColor(accentColor);

                ctx.globalCompositeOperation = 'lighter';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Secondary arc (behind)
                if (particle.secondaryArc && particle.secondaryArc.length > 1) {
                    ctx.strokeStyle = getModifiedColor(baseColor, baseOpacity * 0.25, -0.1, -15);
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = getModifiedColor(baseColor, 0.4, 0, -10);
                    ctx.beginPath();
                    ctx.moveTo(particle.secondaryArc[0].x, particle.secondaryArc[0].y);
                    for (let i = 1; i < particle.secondaryArc.length; i++) {
                        ctx.lineTo(particle.secondaryArc[i].x, particle.secondaryArc[i].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                // Primary serpentine
                ctx.strokeStyle = getModifiedColor(baseColor, baseOpacity * 0.55, 0.1, 0);
                ctx.lineWidth = 2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = getModifiedColor(baseColor, 0.6, 0.15, 0);
                ctx.beginPath();
                ctx.moveTo(particle.arcSegments[0].x, particle.arcSegments[0].y);
                for (let i = 1; i < particle.arcSegments.length; i++) {
                    ctx.lineTo(particle.arcSegments[i].x, particle.arcSegments[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

        } else if (fx.particleType === 'orbital-ember') {
            // ═══════════════════════════════════════════════════════════════════════════
            // ORBITAL EMBER: Orbiting ember with flare effect
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';
            const flareMod = particle.isFlaring ? 1.8 : 1.0;

            // Outer glow
            ctx.shadowBlur = 15 * flareMod;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.6, 0, -15);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.4 * flareMod, -0.1, -10);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 2.5 * flareMod, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.shadowBlur = 8;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, 0.2, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';

        } else if (fx.particleType === 'bloom-pulse') {
            // ═══════════════════════════════════════════════════════════════════════════
            // BLOOM PULSE: Expanding pulse ring
            // ═══════════════════════════════════════════════════════════════════════════
            if (particle.pulseRadius) {
                const baseColor = parseColor(accentColor);

                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = getModifiedColor(baseColor, particle.pulseOpacity || 0.3, 0, 0);
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = getModifiedColor(baseColor, 0.4, 0, 0);

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.pulseRadius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

        } else if (fx.particleType === 'prism-spark') {
            // ═══════════════════════════════════════════════════════════════════════════
            // PRISM SPARK: Splitting refraction sparkle
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';

            if (particle.isSplitting) {
                const splitOffset = particle.splitProgress * 4;

                // Split shard 1
                ctx.shadowBlur = 10;
                ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.8, 0.1, particle.splitHue1 || 15);
                ctx.beginPath();
                ctx.arc(particle.x + splitOffset, particle.y - splitOffset * 0.5, s * 0.8, 0, Math.PI * 2);
                ctx.fill();

                // Split shard 2
                ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.8, 0.1, particle.splitHue2 || -15);
                ctx.beginPath();
                ctx.arc(particle.x - splitOffset, particle.y + splitOffset * 0.5, s * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Main spark
            ctx.shadowBlur = 12;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.6, 0, 0);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity, 0.2, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';

        } else if (fx.particleType === 'dust-mote') {
            // ═══════════════════════════════════════════════════════════════════════════
            // DUST MOTE: Flowing stardust
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';

            ctx.shadowBlur = 8;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.4, 0, 0);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.6, 0.1, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';

        } else if (fx.particleType === 'spirit-light') {
            // ═══════════════════════════════════════════════════════════════════════════
            // SPIRIT LIGHT: Chasing spirit orb with glint
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';
            const glintMod = particle.isGlinting ? 1.6 : 1.0;

            // Outer halo
            ctx.shadowBlur = 20 * glintMod;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.6, 0, 0);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.3 * glintMod, -0.05, 10);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 3 * glintMod, 0, Math.PI * 2);
            ctx.fill();

            // Middle glow
            ctx.shadowBlur = 12;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.6, 0.05, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.shadowBlur = 6;
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 1.0, 0.2, 0);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, s * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';

        } else if (fx.particleType === 'leaf-mote') {
            // ═══════════════════════════════════════════════════════════════════════════
            // LEAF MOTE: Falling leaf-shaped particle
            // ═══════════════════════════════════════════════════════════════════════════
            ctx.globalCompositeOperation = 'lighter';

            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.leafRotation || 0);

            // Leaf shape (elongated ellipse)
            ctx.shadowBlur = 8;
            ctx.shadowColor = getModifiedColor(parseColor(accentColor), 0.4, 0, 0);
            ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.5, 0, 0);
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.4, s * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.globalCompositeOperation = 'source-over';

        } else {
            ctx.translate(particle.x, particle.y);

            if (glowIntensity > 0.3) {
                ctx.shadowBlur = particle.size * 2 * glowIntensity;
                ctx.shadowColor = color;
            }

            switch (fx.particleType) {
                case 'thin-ray': {
                    const rayLen = s * 5 * (particle.rayLength || 1);
                    ctx.strokeStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, colorVar.brightnessOffset, colorVar.hueOffset);
                    ctx.lineWidth = Math.max(0.5, s * 0.2);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(particle.angle) * rayLen, Math.sin(particle.angle) * rayLen);
                    ctx.stroke();
                    break;
                }

                case 'twinkle-star': {
                    const twinkle = 0.5 + Math.sin(particle.twinklePhase || 0) * 0.5;
                    const rayLen = s * 0.6 * (0.7 + twinkle * 0.4);
                    ctx.strokeStyle = getModifiedColor(parseColor(accentColor), baseOpacity * twinkle, colorVar.brightnessOffset, colorVar.hueOffset);
                    ctx.lineWidth = Math.max(0.5, s * 0.25);
                    ctx.beginPath();
                    ctx.moveTo(0, -rayLen);
                    ctx.lineTo(0, rayLen);
                    ctx.moveTo(-rayLen, 0);
                    ctx.lineTo(rayLen, 0);
                    ctx.stroke();
                    ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * twinkle * 0.7, colorVar.brightnessOffset, colorVar.hueOffset);
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                case 'ember-pop': {
                    const emberGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.2);
                    emberGrad.addColorStop(0, getModifiedColor(parseColor(accentColor), baseOpacity * 1.3, colorVar.brightnessOffset + 0.1, colorVar.hueOffset));
                    emberGrad.addColorStop(0.3, getModifiedColor(parseColor(accentColor), baseOpacity * 0.9, colorVar.brightnessOffset, colorVar.hueOffset));
                    emberGrad.addColorStop(0.7, getModifiedColor(parseColor(accentColor), baseOpacity * 0.4, colorVar.brightnessOffset - 0.1, colorVar.hueOffset));
                    emberGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = emberGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 1.1, colorVar.brightnessOffset + 0.15, colorVar.hueOffset);
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                case 'snow-varied': {
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
                    gradient.addColorStop(0, getModifiedColor(parseColor(accentColor), baseOpacity, colorVar.brightnessOffset, colorVar.hueOffset));
                    gradient.addColorStop(1, getModifiedColor(parseColor(accentColor), 0, colorVar.brightnessOffset, colorVar.hueOffset));
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, s, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                case 'meteor-thin': {
                    const isStreaking = breathParams.phase === 'rain';
                    const elongation = isStreaking ? 7 : 2;
                    const direction = cycleDirectionRef.current;
                    const streakAngle = particle.streakAngle || (direction > 0 ? Math.PI * 0.35 : Math.PI * 0.65);

                    ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity * 0.55, colorVar.brightnessOffset, colorVar.hueOffset);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, s * elongation, s * 0.3, streakAngle, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                case 'soft-circle': {
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
                    gradient.addColorStop(0, getModifiedColor(parseColor(accentColor), baseOpacity, colorVar.brightnessOffset, colorVar.hueOffset));
                    gradient.addColorStop(1, getModifiedColor(parseColor(accentColor), 0, colorVar.brightnessOffset, colorVar.hueOffset));
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, s, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                default:
                    ctx.fillStyle = getModifiedColor(parseColor(accentColor), baseOpacity, colorVar.brightnessOffset, colorVar.hueOffset);
                    ctx.beginPath();
                    ctx.arc(0, 0, s, 0, Math.PI * 2);
                    ctx.fill();
            }
        }

        ctx.restore();
    }, [fx.particleType, breathParams, intensity, accentColor, parseColor, getModifiedColor]);

    useEffect(() => {
        if (!canvasRef.current || !isActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const currentPresetId = fxPreset?.id || pathId;
        if (particlesRef.current.length !== fx.particleCount || prevPresetIdRef.current !== currentPresetId) {
            particlesRef.current = initParticles();
            prevPresetIdRef.current = currentPresetId;
        }

        const animate = (timestamp) => {
            const dt = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
            lastTimeRef.current = timestamp;

            ctx.clearRect(0, 0, size, size);

            const centerX = size / 2;
            const centerY = size / 2;
            const color = accentColor;

            particlesRef.current = particlesRef.current.map(particle => {
                const updated = applyMotion(particle, dt, centerX, centerY, ringScale);

                if (fx.trailLength > 0 && updated.trail && updated.opacity > 0.1 && fx.particleType !== 'lightning-arc') {
                    updated.trail.push({ x: updated.x, y: updated.y });
                    if (updated.trail.length > 10 * fx.trailLength) {
                        updated.trail.shift();
                    }

                    const colorVar = updated.colorVar || { brightnessOffset: 0, hueOffset: 0 };
                    updated.trail.forEach((pos, i) => {
                        const trailOpacity = (i / updated.trail.length) * 0.2 * intensity;
                        ctx.fillStyle = getModifiedColor(parseColor(accentColor), trailOpacity, colorVar.brightnessOffset, colorVar.hueOffset);
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, updated.size * 0.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                if (updated.opacity > 0.05) {
                    drawParticle(ctx, updated, color);
                }
                return updated;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [pathId, fxPreset, isActive, size, accentColor, fx, initParticles, applyMotion, drawParticle, parseColor, getModifiedColor, intensity]);

    useEffect(() => {
        particlesRef.current = initParticles();
    }, [pathId, fxPreset?.id, initParticles]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="absolute inset-0 pointer-events-none"
            style={{
                width: size,
                height: size,
                opacity: 0.9 + intensity * 0.1
            }}
        />
    );
}
