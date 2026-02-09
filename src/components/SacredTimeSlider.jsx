// src/components/SacredTimeSlider.jsx
import React, { useRef, useState, useEffect } from 'react';

// Geometric glyph paths (normalized to 100x100 viewbox)
const GLYPHS = {
    triangle: "M 50 15 L 85 80 L 15 80 Z",
    square: "M 20 20 H 80 V 80 H 20 Z",
    pentagon: "M 50 10 L 90 40 L 75 90 L 25 90 L 10 40 Z",
    hexagon: "M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z",
    circle: "M 50 10 A 40 40 0 1 1 49.99 10"
};

const KEY_DURATIONS = {
    5: 'triangle',
    10: 'square',
    20: 'pentagon',
    30: 'hexagon',
    60: 'circle'
};

export function SacredTimeSlider({ value, onChange, options }) {
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [pulseActive, setPulseActive] = useState(false);
    const audioContextRef = useRef(null);

    const currentIndex = Math.max(0, options.indexOf(value));
    const validIndex = currentIndex >= 0 ? currentIndex : 0;

    // Calculate thumb position as percentage (0-100), clamped to valid range
    const thumbPercent = options.length > 1 ? (validIndex / (options.length - 1)) * 100 : 0;

    // Play subtle click sound
    const playClick = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

            gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
        } catch {
            // Audio not available, silent fail
        }
    };

    // Trigger pulse animation
    const triggerPulse = () => {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 200);
    };

    const handleInteraction = (clientX) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = x / rect.width;
        const rawIndex = percent * (options.length - 1);
        const index = Math.round(rawIndex);
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
        const newValue = options[clampedIndex];
        if (newValue !== value) {
            playClick();
            triggerPulse();
            onChange(newValue);
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleInteraction(e.clientX);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) handleInteraction(e.clientX);
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, value, options]);

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            className="relative w-full select-none"
            style={{
                height: '70px',
                cursor: 'pointer',
                touchAction: 'none',
                paddingLeft: '16px',
                paddingRight: '16px'
            }}
        >
            {/* Track container - this is what we measure for positioning */}
            <div
                ref={trackRef}
                className="absolute"
                style={{
                    left: '16px',
                    right: '16px',
                    top: '20px',
                    height: '30px'
                }}
            >
                {/* Track background line */}
                <div
                    className="absolute left-0 right-0 h-1 rounded-full"
                    style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                />


                {/* Tick marks and labels */}
                {options.map((opt, i) => {
                    const percent = options.length > 1 ? (i / (options.length - 1)) * 100 : 0;
                    const isKey = KEY_DURATIONS[opt];
                    const isActive = opt <= value;
                    const isSelected = opt === value;

                    return (
                        <div
                            key={opt}
                            className="absolute flex flex-col items-center"
                            style={{
                                left: `${percent}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Glyph or dot */}
                            {isKey ? (
                                <svg
                                    viewBox="0 0 100 100"
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        opacity: isActive ? 0.8 : 0.25,
                                        filter: isSelected ? 'drop-shadow(0 0 6px var(--accent-color))' : 'none'
                                    }}
                                >
                                    <path
                                        d={GLYPHS[isKey]}
                                        fill={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
                                        stroke={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.2)'}
                                        strokeWidth="2"
                                    />
                                </svg>
                            ) : (
                                <div
                                    className="rounded-full"
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        background: isActive ? '#D4AF37' : 'rgba(255,255,255,0.15)',
                                        boxShadow: isActive ? '0 0 6px rgba(212, 175, 55, 0.8)' : 'none'
                                    }}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Thumb */}
                <div
                    className="absolute pointer-events-none transition-transform duration-100"
                    style={{
                        left: `${thumbPercent}%`,
                        top: '50%',
                        transform: `translate(-50%, -50%) scale(${pulseActive ? 1.3 : 1})`,
                        width: '28px',
                        height: '28px',
                        zIndex: 10,
                        transition: 'left 80ms ease-out',
                    }}
                >
                    {/* Inner neon core */}
                    <div
                        className="absolute inset-0 rounded-full transition-all duration-100"
                        style={{
                            background: `radial-gradient(circle, var(--accent-color) 40%, transparent 70%)`,
                            boxShadow: pulseActive
                                ? `0 0 30px var(--accent-glow)`
                                : `0 0 20px var(--accent-40)`,
                            transform: 'scale(1)'
                        }}
                    />
                    {/* Outer neon ring */}
                    <div
                        className="w-full h-full rounded-full transition-all duration-100"
                        style={{
                            border: `2px solid var(--accent-color)`,
                            boxShadow: pulseActive
                                ? `0 0 40px var(--accent-color), 0 0 60px var(--accent-50)`
                                : `0 0 30px var(--accent-80)`,
                            background: 'transparent'
                        }}
                    />
                </div>
            </div>

            {/* Number values below slider - selected number glows */}
            <div
                className="absolute flex justify-between"
                style={{
                    left: '16px',
                    right: '16px',
                    top: '52px'
                }}
            >
                {options.map((opt) => {
                    const i = options.indexOf(opt);
                    const percent = options.length > 1 ? (i / (options.length - 1)) * 100 : 0;
                    const isSelected = opt === value;

                    return (
                        <div
                            key={opt}
                            className="relative"
                            style={{
                                position: 'absolute',
                                left: `${percent}%`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <div
                                className="relative font-semibold"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '14px',
                                    fontWeight: isSelected ? 700 : 400,
                                    color: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                                    textShadow: isSelected ? '0 0 12px var(--accent-color), 0 0 24px var(--accent-color)' : 'none',
                                    letterSpacing: '0.05em',
                                    transition: 'all 300ms ease'
                                }}
                            >
                                {opt}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
