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
        } catch (e) {
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
                        background: 'rgba(0,0,0,0.4)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                />

                {/* Active fill line */}
                <div
                    className="absolute left-0 h-0.5 rounded-full"
                    style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: `${thumbPercent}%`,
                        background: 'linear-gradient(90deg, #C9A961, #D4AF37)',
                        boxShadow: '0 0 12px rgba(201, 169, 97, 0.6)',
                        opacity: 0.9
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
                                        width: '4px',
                                        height: '4px',
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
                        zIndex: 10
                    }}
                >
                    {/* Inner emerald core */}
                    <div
                        className="absolute inset-0 rounded-full transition-all duration-100"
                        style={{
                            background: '#00C896',
                            boxShadow: pulseActive
                                ? '0 0 20px rgba(0, 200, 150, 0.8)'
                                : '0 0 12px rgba(0, 200, 150, 0.6)',
                            transform: 'scale(0.7)'
                        }}
                    />
                    {/* Outer golden ring */}
                    <div
                        className="w-full h-full rounded-full transition-all duration-100"
                        style={{
                            border: '2px solid #D4AF37',
                            boxShadow: pulseActive
                                ? '0 0 28px rgba(212, 175, 55, 0.7), 0 0 48px rgba(212, 175, 55, 0.4)'
                                : '0 0 16px rgba(212, 175, 55, 0.5), 0 0 32px rgba(212, 175, 55, 0.3)',
                            background: 'transparent'
                        }}
                    />
                </div>
            </div>

            {/* Labels row - show ALL durations */}
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
                    const isKey = KEY_DURATIONS[opt];

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
                            {/* Golden ring around active number */}
                            {isSelected && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '28px',
                                        height: '28px',
                                        border: '2px solid #D4AF37',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 16px rgba(213, 168, 75, 0.6)',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 0
                                    }}
                                />
                            )}
                            <div
                                className="relative font-semibold"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: isKey ? '11px' : '9px',
                                    color: isSelected ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                                    fontWeight: isSelected ? '700' : '500',
                                    textShadow: isSelected ? '0 0 8px rgba(212, 175, 55, 0.5)' : 'none',
                                    letterSpacing: '0.05em',
                                    opacity: 1,
                                    zIndex: 1
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
