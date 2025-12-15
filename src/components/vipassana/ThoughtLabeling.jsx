// src/components/vipassana/ThoughtLabeling.jsx
// Core gesture interpreter for thought labeling - Canvas version

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PRACTICE_INVARIANT, VIPASSANA_AUDIO } from '../../data/vipassanaThemes';
import { VipassanaCanvas } from './VipassanaCanvas';
import { RadialDial } from './RadialDial';
import { STAMP_CONFIG } from '../../utils/stamps';

let thoughtIdCounter = 0;

// Helper: random value in range [min, max]
const randomInRange = (min, max) => min + Math.random() * (max - min);

// Theme-specific motion behaviors (AA-Level)
const THEME_BEHAVIORS = {
    cloud: {
        drift: { vx: [0.2, 0.4], vy: [-0.1, 0.1] },
        bob: { amplitude: 0.3, frequency: 0.1 },
        lifecycle: 'dissolve',
    },
    bird: {
        drift: { vx: [0.3, 0.6], vy: [-0.05, 0.05] },
        flap: { rate: [0.25, 0.45], poses: 3 },
        tailWag: { angle: 4 },
        lifecycle: 'flyAway',
    },
    leaf: {
        drift: { vx: [0.1, 0.3], vy: [0.3, 0.5] },
        rotation: { speed: [0.02, 0.08] },
        lifecycle: 'settle',
    },
    lantern: {
        drift: { vx: [-0.05, 0.05], vy: [-0.15, -0.25] },
        flicker: { rate: 0.8, variance: 0.15 },
        lifecycle: 'fadeUp',
    },
};

export function ThoughtLabeling({
    theme,
    onThoughtSpawn,
    onThoughtComplete,
    onThoughtCountChange,
    audioEnabled = true,
}) {
    const [thoughts, setThoughts] = useState([]);
    const [dialState, setDialState] = useState({ visible: false, x: 0, y: 0 });
    const [stickyThoughtId, setStickyThoughtId] = useState(null);

    const longPressTimer = useRef(null);
    const tapStartTime = useRef(null);
    const tapPosition = useRef({ x: 0, y: 0 });
    const audioRefs = useRef({});

    // Notify parent of thought count changes
    useEffect(() => {
        onThoughtCountChange?.(thoughts.length);
    }, [thoughts.length, onThoughtCountChange]);

    // Lifecycle: remove completed thoughts
    useEffect(() => {
        const checkExpired = () => {
            const now = Date.now();
            setThoughts(prev => {
                const remaining = prev.filter(t => {
                    const elapsed = now - t.spawnTime;
                    const duration = t.baseDuration * t.fadeModifier * 1000;
                    const isExpired = elapsed >= duration;
                    if (isExpired) {
                        onThoughtComplete?.(t.id);
                    }
                    return !isExpired;
                });
                return remaining.length !== prev.length ? remaining : prev;
            });
        };

        const interval = setInterval(checkExpired, 500); // Check every 500ms
        return () => clearInterval(interval);
    }, [onThoughtComplete]);

    // Play audio cue (soft, no stacking)
    const playAudio = useCallback((cueKey) => {
        if (!audioEnabled) return;

        const cue = VIPASSANA_AUDIO[cueKey];
        if (!cue) return;

        try {
            if (!audioRefs.current[cueKey]) {
                audioRefs.current[cueKey] = new Audio(`${import.meta.env.BASE_URL}${cue.file}`);
            }
            const audio = audioRefs.current[cueKey];
            audio.volume = cue.volume;
            audio.currentTime = 0;
            audio.play().catch(() => { }); // Ignore autoplay errors
        } catch (e) {
            // Audio not available
        }
    }, [audioEnabled]);

    // Spawn thought at position with theme-specific motion behavior
    const spawnThought = useCallback((x, y, category = 'neutral') => {
        const elementType = theme?.thoughtElement || 'cloud';
        const behavior = THEME_BEHAVIORS[elementType] || THEME_BEHAVIORS.cloud;

        // Get correct variant count for this element type (cloud→clouds, bird→birds, etc)
        const stampKey = elementType + 's'; // clouds, birds, leaves, lanterns
        const variantCount = STAMP_CONFIG[stampKey]?.count || 6;
        const variant = Math.floor(Math.random() * variantCount);

        // Compute per-thought motion parameters from behavior ranges
        const vx = randomInRange(behavior.drift.vx[0], behavior.drift.vx[1]);
        const vy = randomInRange(behavior.drift.vy[0], behavior.drift.vy[1]);
        const phase = Math.random() * Math.PI * 2; // Random phase offset

        // Theme-specific extras
        const flapRate = behavior.flap ? randomInRange(behavior.flap.rate[0], behavior.flap.rate[1]) : 0;
        const rotationSpeed = behavior.rotation ? randomInRange(behavior.rotation.speed[0], behavior.rotation.speed[1]) : 0;
        const bobAmplitude = behavior.bob?.amplitude || 0;
        const bobFrequency = behavior.bob?.frequency || 0;
        const flickerVariance = behavior.flicker?.variance || 0;

        const newThought = {
            id: `thought-${++thoughtIdCounter}`,
            x,
            y,
            originX: x,
            originY: y,
            category,
            spawnTime: Date.now(),
            baseDuration: PRACTICE_INVARIANT.thoughtLifetime,
            fadeModifier: 1.0,
            isSticky: false,
            variant,
            // Motion parameters
            vx,
            vy,
            phase,
            flapRate,
            rotationSpeed,
            rotation: 0, // Current rotation angle
            bobAmplitude,
            bobFrequency,
            flickerVariance,
            lifecycle: behavior.lifecycle,
        };

        setThoughts((prev) => {
            // Graceful coalescing if over max
            let updated = [...prev];
            if (updated.length >= PRACTICE_INVARIANT.maxActiveThoughts) {
                const sorted = [...updated].sort((a, b) => a.spawnTime - b.spawnTime);
                const oldestIdx = updated.findIndex(t => t.id === sorted[0].id);
                if (oldestIdx >= 0) {
                    updated[oldestIdx] = { ...updated[oldestIdx], fadeModifier: updated[oldestIdx].fadeModifier * 0.3 };
                }
            }
            return [...updated, newThought];
        });

        playAudio('thoughtNoticed');
        onThoughtSpawn?.(newThought);
    }, [theme, playAudio, onThoughtSpawn]);

    // Handle tap on empty space - spawn neutral thought
    const handleEmptyTap = (x, y) => {
        spawnThought(x, y, 'neutral');
    };

    // Handle long-press on empty space - open dial
    const handleEmptyLongPress = (x, y) => {
        setDialState({ visible: true, x, y });
    };

    // Handle dial category selection - spawn NEW thought with selected category
    const handleDialSelect = (categoryId) => {
        spawnThought(dialState.x, dialState.y, categoryId);
        setDialState({ visible: false, x: 0, y: 0 });
    };

    // Handle dial dismiss
    const handleDialDismiss = () => {
        setDialState({ visible: false, x: 0, y: 0 });
    };

    // Handle tap on thought element - accelerate fade (release)
    const handleThoughtTap = useCallback((thoughtId) => {
        setThoughts((prev) =>
            prev.map((t) =>
                t.id === thoughtId
                    ? { ...t, fadeModifier: t.fadeModifier * (1 - PRACTICE_INVARIANT.releaseReduction) }
                    : t
            )
        );
        playAudio('thoughtRelease');
    }, [playAudio]);

    // Handle long-press on thought - mark sticky (one at a time)
    const handleThoughtLongPress = useCallback((thoughtId) => {
        if (PRACTICE_INVARIANT.allowOneSticky) {
            setThoughts((prev) =>
                prev.map((t) => ({
                    ...t,
                    isSticky: t.id === thoughtId,
                }))
            );
            setStickyThoughtId(thoughtId);
            playAudio('thoughtSticky'); // Audio feedback for sticky
        }
    }, [playAudio]);

    // Main pointer handlers for EMPTY SPACE (canvas handles thought hit-testing)
    const handlePointerDown = (e) => {
        tapStartTime.current = Date.now();
        tapPosition.current = { x: e.clientX, y: e.clientY };

        longPressTimer.current = setTimeout(() => {
            handleEmptyLongPress(e.clientX, e.clientY);
            longPressTimer.current = null;
        }, PRACTICE_INVARIANT.longPressThreshold);
    };

    const handlePointerUp = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;

            // Was a short tap on empty space
            const elapsed = Date.now() - tapStartTime.current;
            if (elapsed < PRACTICE_INVARIANT.longPressThreshold) {
                handleEmptyTap(e.clientX, e.clientY);
            }
        }
    };

    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Get accumulation-based style modifiers
    const thoughtCount = thoughts.length;
    const { accumulation } = PRACTICE_INVARIANT;
    let saturation = 1.0;

    if (thoughtCount > accumulation.crowded.max) {
        saturation = accumulation.coalescing.saturation;
    } else if (thoughtCount > accumulation.busy.max) {
        saturation = accumulation.crowded.saturation;
    } else if (thoughtCount > accumulation.normal.max) {
        saturation = accumulation.busy.saturation;
    }

    return (
        <div
            className="absolute inset-0 pointer-events-auto"
            style={{
                cursor: 'crosshair',
                filter: `saturate(${saturation})`,
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
            {/* Canvas-based thought rendering */}
            <VipassanaCanvas
                thoughts={thoughts}
                theme={theme}
                onThoughtTap={handleThoughtTap}
                onThoughtLongPress={handleThoughtLongPress}
            />

            {/* Radial dial for classification */}
            <RadialDial
                x={dialState.x}
                y={dialState.y}
                isVisible={dialState.visible}
                onSelect={handleDialSelect}
                onDismiss={handleDialDismiss}
            />
        </div>
    );
}

export default ThoughtLabeling;

