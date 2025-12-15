// src/components/vipassana/ThoughtLabeling.jsx
// Core gesture interpreter for thought labeling - Canvas version

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PRACTICE_INVARIANT, VIPASSANA_AUDIO } from '../../data/vipassanaThemes';
import { VipassanaCanvas } from './VipassanaCanvas';
import { RadialDial } from './RadialDial';

let thoughtIdCounter = 0;

// 5 drift behaviors for variety
const DRIFT_BEHAVIORS = [
    { name: 'gentle', speedX: 0.3, speedY: -0.2, wobble: 2, wobbleFreq: 3000 },
    { name: 'lazy', speedX: 0.1, speedY: -0.1, wobble: 4, wobbleFreq: 4000 },
    { name: 'floaty', speedX: 0.2, speedY: -0.4, wobble: 3, wobbleFreq: 2500 },
    { name: 'wander', speedX: 0.4, speedY: 0.1, wobble: 5, wobbleFreq: 2000 },
    { name: 'drift', speedX: -0.2, speedY: -0.15, wobble: 2.5, wobbleFreq: 3500 },
];

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

    // Spawn thought at position with random drift behavior
    const spawnThought = useCallback((x, y, category = 'neutral') => {
        const driftBehavior = DRIFT_BEHAVIORS[Math.floor(Math.random() * DRIFT_BEHAVIORS.length)];
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
            driftBehavior,
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
    }, [playAudio, onThoughtSpawn]);

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

