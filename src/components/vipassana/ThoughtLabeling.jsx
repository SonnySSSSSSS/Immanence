// src/components/vipassana/ThoughtLabeling.jsx
// Core gesture interpreter for thought labeling - Hybrid DOM/Canvas version

import { useState, useEffect, useRef, useCallback } from 'react';
import { PRACTICE_INVARIANT, VIPASSANA_AUDIO } from '../../data/vipassanaThemes';
import { VipassanaCanvas } from './VipassanaCanvas';
import { RadialDial } from './RadialDial';
import { STAMP_CONFIG } from '../../utils/stamps';
import { ThoughtElement } from './ThoughtElement';

let thoughtIdCounter = 0;

// Helper: random value in range [min, max]
const randomInRange = (min, max) => min + Math.random() * (max - min);

// Theme-specific motion behaviors (AA-Level)
const THEME_BEHAVIORS = {
    cloud: {
        drift: { vx: [0.1, 0.5], vy: [-0.2, 0.15] },
        bob: { amplitude: [0.2, 0.5], frequency: [0.08, 0.15] },
        lifecycle: 'dissolve',
    },
    bird: {
        drift: { vx: [0.2, 0.8], vy: [-0.15, 0.1] },
        flap: { rate: [0.2, 0.5], poses: 3 },
        tailWag: { angle: 4 },
        lifecycle: 'flyAway',
    },
    leaf: {
        drift: { vx: [-0.3, 0.4], vy: [0.2, 0.6] },
        rotation: { speed: [0.03, 0.12] },
        lifecycle: 'settle',
    },
    lantern: {
        drift: { vx: [-0.1, 0.1], vy: [-0.3, -0.1] },
        flicker: { rate: 0.8, variance: [0.1, 0.25] },
        lifecycle: 'fadeUp',
    },
};

export function ThoughtLabeling({
    theme,
    onThoughtSpawn,
    onThoughtComplete,
    onThoughtCountChange,
    audioEnabled = true,
    atmosphericEvent = null,
}) {
    const [thoughts, setThoughts] = useState([]);
    const [dialState, setDialState] = useState({ visible: false, x: 0, y: 0 });
    const [_stickyThoughtId, setStickyThoughtId] = useState(null);
    const [ripples, setRipples] = useState([]);

    const lastSpawnTimeRef = useRef(0);
    const lastLifetimeCategoryRef = useRef(null);
    const longPressTimer = useRef(null);
    const tapStartTime = useRef(null);
    const tapPosition = useRef({ x: 0, y: 0 });
    const audioRefs = useRef({});

    useEffect(() => {
        onThoughtCountChange?.(thoughts.length);
    }, [thoughts.length, onThoughtCountChange]);

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
        const interval = setInterval(checkExpired, 500);
        return () => clearInterval(interval);
    }, [onThoughtComplete]);

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
            audio.play().catch(() => { });
        } catch { }
    }, [audioEnabled]);

    const spawnThought = useCallback((x, y, category = 'neutral') => {
        const now = Date.now();
        const timeSinceLastSpawn = now - lastSpawnTimeRef.current;
        const baseRefractoryMs = 2000;
        const heavyRefractoryMs = 4000;
        const requiredRefractory = lastLifetimeCategoryRef.current === 'heavy' ? heavyRefractoryMs : baseRefractoryMs;

        if (timeSinceLastSpawn < requiredRefractory) {
            const refractoryProgress = timeSinceLastSpawn / requiredRefractory;
            const spawnChance = refractoryProgress * 0.7;
            if (Math.random() > spawnChance) return;
        }

        const elementType = theme?.thoughtElement || 'cloud';
        const behavior = THEME_BEHAVIORS[elementType] || THEME_BEHAVIORS.cloud;
        const stampKey = elementType + 's';
        const variantCount = STAMP_CONFIG[stampKey]?.count || 6;
        const variant = Math.floor(Math.random() * variantCount);

        const vx = randomInRange(behavior.drift.vx[0], behavior.drift.vx[1]);
        const vy = randomInRange(behavior.drift.vy[0], behavior.drift.vy[1]);
        const phase = Math.random() * Math.PI * 2;

        const flapRate = behavior.flap ? randomInRange(behavior.flap.rate[0], behavior.flap.rate[1]) : 0;
        const rotationSpeed = behavior.rotation ? randomInRange(behavior.rotation.speed[0], behavior.rotation.speed[1]) : 0;
        const bobAmplitude = behavior.bob ? randomInRange(behavior.bob.amplitude[0], behavior.bob.amplitude[1]) : 0;
        const bobFrequency = behavior.bob ? randomInRange(behavior.bob.frequency[0], behavior.bob.frequency[1]) : 0;
        const flickerVariance = behavior.flicker ? randomInRange(behavior.flicker.variance[0], behavior.flicker.variance[1]) : 0;

        const flipX = elementType === 'bird' && Math.random() < 0.5;
        const directionMultiplier = flipX ? -1 : 1;

        const newThought = {
            id: `thought-${++thoughtIdCounter}`,
            x,
            y,
            category,
            elementType,
            spawnTime: now,
            baseDuration: PRACTICE_INVARIANT.getWeightedLifetime(),
            fadeModifier: 1.0,
            isSticky: false,
            variant,
            vx: vx * directionMultiplier,
            vy,
            phase,
            flapRate,
            rotationSpeed,
            bobAmplitude,
            bobFrequency,
            flickerVariance,
            flipX,
        };

        lastSpawnTimeRef.current = now;
        const lifetime = newThought.baseDuration;
        lastLifetimeCategoryRef.current = lifetime < 10 ? 'fleeting' : lifetime < 25 ? 'sticky' : 'heavy';

        setThoughts((prev) => {
            let updated = [...prev].map(thought => {
                const age = (now - thought.spawnTime) / 1000;
                if (age > 8) {
                    const ghostAge = age - 8;
                    const pressureFactor = 0.92 - (ghostAge * 0.01);
                    return { ...thought, fadeModifier: thought.fadeModifier * Math.max(0.85, pressureFactor) };
                }
                return thought;
            });
            if (updated.length >= PRACTICE_INVARIANT.maxActiveThoughts) {
                const sorted = [...updated].sort((a, b) => a.spawnTime - b.spawnTime);
                const oldestIdx = updated.findIndex(t => t.id === sorted[0].id);
                if (oldestIdx >= 0) updated[oldestIdx] = { ...updated[oldestIdx], fadeModifier: updated[oldestIdx].fadeModifier * 0.3 };
            }
            return [...updated, newThought].sort((a, b) => a.y - b.y);
        });

        playAudio('thoughtNoticed');
        onThoughtSpawn?.(newThought);
    }, [theme, playAudio, onThoughtSpawn]);

    const handleEmptyTap = (x, y) => {
        spawnThought(x, y, 'neutral');
        const rippleId = Date.now();
        setRipples(prev => [...prev, { id: rippleId, x, y }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rippleId)), 600);
    };

    const handleEmptyLongPress = (x, y) => setDialState({ visible: true, x, y });
    const handleDialSelect = (categoryId) => {
        spawnThought(dialState.x, dialState.y, categoryId);
        setDialState({ visible: false, x: 0, y: 0 });
    };
    const handleDialDismiss = () => setDialState({ visible: false, x: 0, y: 0 });

    const handleThoughtTap = useCallback((thoughtId) => {
        setThoughts((prev) => prev.map((t) => t.id === thoughtId ? { ...t, fadeModifier: t.fadeModifier * (1 - PRACTICE_INVARIANT.releaseReduction) } : t));
        playAudio('thoughtRelease');
    }, [playAudio]);

    const handleThoughtLongPress = useCallback((thoughtId) => {
        if (PRACTICE_INVARIANT.allowOneSticky) {
            const now = Date.now();
            setThoughts((prev) => prev.map((t) => ({ ...t, isSticky: t.id === thoughtId, stickyStartTime: t.id === thoughtId ? now : undefined })));
            setStickyThoughtId(thoughtId);
            playAudio('thoughtSticky');
        }
    }, [playAudio]);

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
            const elapsed = Date.now() - tapStartTime.current;
            if (elapsed < PRACTICE_INVARIANT.longPressThreshold) handleEmptyTap(e.clientX, e.clientY);
        }
    };

    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const thoughtCount = thoughts.length;
    const accumulation = PRACTICE_INVARIANT.accumulation;
    let saturation = 1.0;
    if (thoughtCount > accumulation.crowded.max) saturation = accumulation.coalescing.saturation;
    else if (thoughtCount > accumulation.busy.max) saturation = accumulation.crowded.saturation;
    else if (thoughtCount > accumulation.normal.max) saturation = accumulation.busy.saturation;

    return (
        <div
            className="absolute inset-0 pointer-events-auto"
            style={{ cursor: 'crosshair', filter: `saturate(${saturation})` }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
            <VipassanaCanvas
                thoughts={thoughts}
                theme={theme}
                atmosphericEvent={atmosphericEvent}
                showStamps={false}
            />

            <div className="absolute inset-0 pointer-events-none">
                {thoughts.map(thought => (
                    <ThoughtElement
                        key={thought.id}
                        {...thought}
                        onTap={handleThoughtTap}
                        onLongPress={handleThoughtLongPress}
                    />
                ))}
            </div>

            {ripples.map((ripple) => (
                <div key={ripple.id} className="absolute pointer-events-none" style={{ left: ripple.x, top: ripple.y, transform: 'translate(-50%, -50%)' }}>
                    <div className="absolute inset-0 rounded-full border-2 border-white/30" style={{ width: '40px', height: '40px', left: '-20px', top: '-20px', animation: 'rippleExpand 0.6s ease-out forwards' }} />
                </div>
            ))}

            <RadialDial x={dialState.x} y={dialState.y} isVisible={dialState.visible} onSelect={handleDialSelect} onDismiss={handleDialDismiss} />

            <style>{`
                @keyframes rippleExpand {
                    from { transform: scale(0.5); opacity: 0.8; }
                    to { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default ThoughtLabeling;
