// src/components/vipassana/ThoughtElement.jsx
// Individual thought event with dissolution animation

import { useState, useEffect, useRef } from 'react';
import { THOUGHT_CATEGORIES, PRACTICE_INVARIANT } from '../../data/vipassanaThemes';
import { STAMP_FILES } from '../../utils/stamps';

export function ThoughtElement({
    id,
    x,
    y,
    category = 'neutral',
    spawnTime,
    baseDuration = PRACTICE_INVARIANT.thoughtLifetime,
    fadeModifier = 1.0,
    isSticky = false,
    vx = 0,
    vy = 0,
    phase = 0,
    bobAmplitude = 0,
    bobFrequency = 0,
    flickerVariance = 0,
    rotationSpeed = 0,
    flipX = false,
    variant = 0,
    elementType = 'cloud',
    onComplete,
    onTap,
    onLongPress,
}) {
    const [renderState, setRenderState] = useState({
        opacity: 0,
        scale: 0.95,
        x: x,
        y: y,
        rotation: 0,
        filter: 'none'
    });

    const elementRef = useRef(null);
    const longPressTimer = useRef(null);
    const animationRef = useRef(null);

    const categoryData = THOUGHT_CATEGORIES[category] || THOUGHT_CATEGORIES.neutral;

    // Naming map for folders
    const pluralize = { cloud: 'clouds', bird: 'birds', leaf: 'leaves', lantern: 'lanterns' };
    const folder = pluralize[elementType] || (elementType + 's');
    const fileNumbers = STAMP_FILES[folder] || [];
    const fileName = fileNumbers[variant] || fileNumbers[0];
    const assetPath = `${import.meta.env.BASE_URL}vipassana/stamps/${folder}/${fileName}.gif`;

    useEffect(() => {
        const animate = () => {
            const now = Date.now();
            const elapsed = now - spawnTime;
            const duration = baseDuration * fadeModifier * 1000;
            const progress = Math.min(elapsed / duration, 1);
            const ageSec = elapsed / 1000;

            // Phase A/B/C logic from VipassanaCanvas
            let opacity = 1;
            let scale = 1;

            if (ageSec < 2.5) {
                opacity = Math.min(1, ageSec / 0.5);
                scale = 0.95 + (opacity * 0.05);
            } else if (ageSec < 8) {
                const releaseProgress = (ageSec - 2.5) / 5.5;
                opacity = 1 - (releaseProgress * 0.75);
                scale = 1;
            } else {
                const ghostProgress = Math.min(1, (ageSec - 8) / 5);
                opacity = 0.25 - (ghostProgress * 0.10);
                opacity = Math.max(0.15, opacity);
                scale = 1 + (ghostProgress * 0.1);
            }

            if (isSticky) {
                opacity = 1;
                scale = 1;
            }

            // Motion logic
            const driftX = ageSec * vx * 15;
            const driftY = ageSec * vy * 15;

            let motionX = 0, motionY = 0;
            let opacityModifier = 1;

            if (bobAmplitude) {
                motionY = Math.sin(now / 1000 * bobFrequency + phase) * bobAmplitude * 20;
                opacityModifier = 0.9 + Math.sin(now / 3000 + phase) * 0.1;
            }

            if (flickerVariance) {
                motionX = Math.sin(now / 200 + phase) * flickerVariance * 5;
                motionY += Math.sin(now / 400 + phase * 1.5) * flickerVariance * 2;
                opacityModifier = 0.7 + Math.sin(now / 800 + phase) * 0.3;
            }

            let rotation = 0;
            if (rotationSpeed) {
                rotation = (ageSec * rotationSpeed + phase) * (180 / Math.PI); // DOM uses degrees for CSS transform
            }

            const currentX = x + driftX + motionX;
            const currentY = y + driftY + motionY;

            // Dissolution filter
            let blur = 0;
            if (progress > PRACTICE_INVARIANT.dissolutionStart) {
                const dissolveProgress = (progress - 0.75) / 0.25;
                blur = dissolveProgress * 4;
            }

            setRenderState({
                opacity: opacity * opacityModifier,
                scale,
                x: currentX,
                y: currentY,
                rotation,
                filter: blur > 0 ? `blur(${blur}px)` : 'none'
            });

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                onComplete?.(id);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [id, vx, vy, bobAmplitude, flickerVariance, rotationSpeed, isSticky, fadeModifier]);

    // Gesture handlers
    const handlePointerDown = (e) => {
        e.stopPropagation();
        longPressTimer.current = setTimeout(() => {
            onLongPress?.(id);
            longPressTimer.current = null;
        }, PRACTICE_INVARIANT.longPressThreshold);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            onTap?.(id);
        }
    };

    return (
        <div
            ref={elementRef}
            className="absolute pointer-events-auto cursor-pointer select-none"
            style={{
                left: renderState.x,
                top: renderState.y,
                transform: `translate(-50%, -50%) scale(${renderState.scale}) rotate(${renderState.rotation}deg) ${flipX ? 'scaleX(-1)' : ''}`,
                opacity: renderState.opacity,
                filter: renderState.filter,
                transition: 'filter 0.5s ease-out',
                zIndex: isSticky ? 20 : 10,
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <div className="relative group">
                {/* GIF Image */}
                <img
                    src={assetPath}
                    alt=""
                    style={{
                        width: '72px',
                        height: '72px',
                        display: 'block',
                        filter: category !== 'neutral'
                            ? `drop-shadow(0 0 12px ${categoryData.color})`
                            : 'none',
                        // Special cloud stretching
                        transform: elementType === 'cloud' ? 'scaleX(1.5)' : 'none'
                    }}
                    draggable={false}
                />

                {/* Sticky Ring */}
                {isSticky && (
                    <div className="absolute inset-0 -m-2 rounded-full border-2 border-amber-300/40 animate-pulse" />
                )}
            </div>
        </div>
    );
}

export default ThoughtElement;
