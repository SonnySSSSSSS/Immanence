// src/components/vipassana/ThoughtElement.jsx
// Individual thought event with dissolution animation

import React, { useState, useEffect, useRef } from 'react';
import { THOUGHT_CATEGORIES, PRACTICE_INVARIANT } from '../../data/vipassanaThemes';

export function ThoughtElement({
    id,
    x,
    y,
    category = 'neutral',
    spawnTime,
    baseDuration = PRACTICE_INVARIANT.thoughtLifetime,
    fadeModifier = 1.0,
    isSticky = false,
    driftDirection = { x: 0.2, y: 0 },
    elementType = 'cloud',
    onComplete,
    onTap,
    onLongPress,
}) {
    const [phase, setPhase] = useState('appearing'); // appearing | present | dissolving | dispersing
    const [opacity, setOpacity] = useState(0);
    const [scale, setScale] = useState(0.95);
    const [position, setPosition] = useState({ x, y });
    const [coherence, setCoherence] = useState(1.0);
    const [showSymbol, setShowSymbol] = useState(false);

    const elementRef = useRef(null);
    const longPressTimer = useRef(null);
    const animationRef = useRef(null);

    const categoryData = THOUGHT_CATEGORIES[category] || THOUGHT_CATEGORIES.neutral;
    const effectiveDuration = baseDuration * fadeModifier * 1000; // to ms

    // Main lifecycle animation
    useEffect(() => {
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / effectiveDuration, 1);

            // Phase transitions
            if (progress < 0.045) {
                // Appearance phase (0-1s of 22s)
                setPhase('appearing');
                setOpacity(progress / 0.045);
                setScale(0.95 + (progress / 0.045) * 0.05);
            } else if (progress < PRACTICE_INVARIANT.dissolutionStart) {
                // Present phase
                setPhase('present');
                setOpacity(1);
                setScale(1);
            } else if (progress < 0.9) {
                // Loosening phase - edges feather
                setPhase('dissolving');
                const dissolveProgress = (progress - 0.75) / 0.15;
                setCoherence(1 - dissolveProgress * 0.4);
                setOpacity(1 - dissolveProgress * 0.3);
            } else {
                // Dispersing phase - shape breaks apart
                setPhase('dispersing');
                const disperseProgress = (progress - 0.9) / 0.1;
                setCoherence(0.6 - disperseProgress * 0.6);
                setOpacity(0.7 - disperseProgress * 0.7);
            }

            // Gentle drift
            const driftAmount = progress * 40; // max 40px drift
            setPosition({
                x: x + driftDirection.x * driftAmount + Math.sin(elapsed / 2000) * 3,
                y: y + driftDirection.y * driftAmount + Math.cos(elapsed / 3000) * 2,
            });

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                onComplete?.(id);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [effectiveDuration, x, y, driftDirection, id, onComplete]);

    // Show symbol briefly on category change
    useEffect(() => {
        if (category !== 'neutral' && categoryData.symbol) {
            setShowSymbol(true);
            const timer = setTimeout(() => setShowSymbol(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [category, categoryData.symbol]);

    // Gesture handlers
    const handlePointerDown = () => {
        longPressTimer.current = setTimeout(() => {
            onLongPress?.(id);
        }, PRACTICE_INVARIANT.longPressThreshold);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            // Short tap - accelerate fade
            onTap?.(id);
        }
    };

    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Dissolution filter based on coherence
    const filterStyle = phase === 'dissolving' || phase === 'dispersing'
        ? `blur(${(1 - coherence) * 4}px)`
        : 'none';

    return (
        <div
            ref={elementRef}
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{
                left: position.x,
                top: position.y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                filter: filterStyle,
                transition: 'filter 0.5s ease-out',
                zIndex: 10,
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
            {/* Thought element visual */}
            <div
                className="relative"
                style={{
                    width: '72px',
                    height: '72px',
                }}
            >
                {/* Main element - cloud/bird/leaf/lantern shape */}
                <svg
                    width="72"
                    height="72"
                    viewBox="0 0 72 72"
                    style={{
                        filter: `drop-shadow(0 4px 12px ${categoryData.color}) drop-shadow(0 0 8px rgba(0,0,0,0.8))`,
                    }}
                >
                    {elementType === 'cloud' && (
                        <circle
                            cx="36"
                            cy="36"
                            r="24"
                            fill={categoryData.color}
                            style={{ opacity: coherence }}
                        />
                    )}
                    {elementType === 'bird' && (
                        <path
                            d="M6 36 Q18 24 36 36 Q54 24 66 36 Q54 42 36 33 Q18 42 6 36"
                            fill={categoryData.color}
                            style={{ opacity: coherence }}
                        />
                    )}
                    {elementType === 'leaf' && (
                        <path
                            d="M36 6 Q60 30 36 66 Q12 30 36 6"
                            fill={categoryData.color}
                            style={{ opacity: coherence }}
                        />
                    )}
                    {elementType === 'lantern' && (
                        <ellipse
                            cx="36"
                            cy="36"
                            rx="30"
                            ry="21"
                            fill={categoryData.color}
                            style={{ opacity: coherence }}
                        />
                    )}
                </svg>

                {/* Category symbol (brief display) */}
                {showSymbol && categoryData.symbol && (
                    <div
                        className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium"
                        style={{
                            animation: 'fadeInOut 1s ease-out forwards',
                        }}
                    >
                        {categoryData.symbol}
                    </div>
                )}

                {/* Sticky marker - thin ring */}
                {isSticky && (
                    <div
                        className="absolute inset-0 rounded-full border pointer-events-none"
                        style={{
                            borderColor: 'rgba(255, 255, 255, 0.25)',
                            borderWidth: '1px',
                        }}
                    />
                )}
            </div>

            <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
        </div>
    );
}

export default ThoughtElement;
