// src/components/vipassana/ThoughtLabeling.jsx
// Core gesture interpreter for thought labeling

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PRACTICE_INVARIANT, VIPASSANA_AUDIO } from '../../data/vipassanaThemes';
import { ThoughtElement } from './ThoughtElement';
import { RadialDial } from './RadialDial';

let thoughtIdCounter = 0;

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

    // Spawn neutral thought at position
    const spawnThought = useCallback((x, y, category = 'neutral') => {
        const newThought = {
            id: `thought-${++thoughtIdCounter}`,
            x,
            y,
            category,
            spawnTime: Date.now(),
            baseDuration: PRACTICE_INVARIANT.thoughtLifetime,
            fadeModifier: 1.0,
            isSticky: false,
        };

        setThoughts((prev) => {
            // Graceful coalescing if over max
            if (prev.length >= PRACTICE_INVARIANT.maxActiveThoughts) {
                const sorted = [...prev].sort((a, b) => a.spawnTime - b.spawnTime);
                sorted[0].fadeModifier *= 0.3; // Accelerate oldest
            }
            return [...prev, newThought];
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

    // Handle dial category selection - classify most recent unclassified
    const handleDialSelect = (categoryId) => {
        setThoughts((prev) => {
            const neutralThoughts = prev.filter((t) => t.category === 'neutral');
            if (neutralThoughts.length === 0) return prev;

            const mostRecent = neutralThoughts[neutralThoughts.length - 1];
            return prev.map((t) =>
                t.id === mostRecent.id ? { ...t, category: categoryId } : t
            );
        });

        setDialState({ visible: false, x: 0, y: 0 });
    };

    // Handle dial dismiss
    const handleDialDismiss = () => {
        setDialState({ visible: false, x: 0, y: 0 });
    };

    // Handle tap on thought element - accelerate fade (release)
    const handleThoughtTap = (thoughtId) => {
        setThoughts((prev) =>
            prev.map((t) =>
                t.id === thoughtId
                    ? { ...t, fadeModifier: t.fadeModifier * (1 - PRACTICE_INVARIANT.releaseReduction) }
                    : t
            )
        );
        playAudio('thoughtRelease');
    };

    // Handle long-press on thought - mark sticky (one at a time)
    const handleThoughtLongPress = (thoughtId) => {
        if (PRACTICE_INVARIANT.allowOneSticky) {
            // Remove previous sticky marker
            setThoughts((prev) =>
                prev.map((t) => ({
                    ...t,
                    isSticky: t.id === thoughtId,
                }))
            );
            setStickyThoughtId(thoughtId);
        }
    };

    // Handle thought completion
    const handleThoughtComplete = (thoughtId) => {
        setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
        onThoughtComplete?.(thoughtId);
    };

    // Main pointer handlers
    const handlePointerDown = (e) => {
        // Ignore if tapping on a thought element
        if (e.target.closest('[data-thought]')) return;

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

            // Was a short tap
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
    let motionContrast = 1.0;

    if (thoughtCount > accumulation.crowded.max) {
        saturation = accumulation.coalescing.saturation;
        motionContrast = accumulation.coalescing.motionContrast;
    } else if (thoughtCount > accumulation.busy.max) {
        saturation = accumulation.crowded.saturation;
        motionContrast = accumulation.crowded.motionContrast;
    } else if (thoughtCount > accumulation.normal.max) {
        saturation = accumulation.busy.saturation;
        motionContrast = accumulation.busy.motionContrast;
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
            {/* Thought elements layer */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    // Motion contrast applied to thought layer only
                    opacity: motionContrast,
                }}
            >
                {thoughts.map((thought) => (
                    <div key={thought.id} data-thought>
                        <ThoughtElement
                            {...thought}
                            driftDirection={theme?.driftDirection || { x: 0.2, y: 0 }}
                            elementType={theme?.thoughtElement || 'cloud'}
                            onComplete={handleThoughtComplete}
                            onTap={handleThoughtTap}
                            onLongPress={handleThoughtLongPress}
                        />
                    </div>
                ))}
            </div>

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
