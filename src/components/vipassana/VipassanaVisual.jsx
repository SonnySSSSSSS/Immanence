// src/components/vipassana/VipassanaVisual.jsx
// Main orchestrator for Vipassana thought labeling meditation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VIPASSANA_THEMES, VIPASSANA_AUDIO, PRACTICE_INVARIANT } from '../../data/vipassanaThemes';
import { ThoughtLabeling } from './ThoughtLabeling';
import { MiniAvatar } from './MiniAvatar';
import { StaticTimer } from './StaticTimer';
import { SessionSummary } from './SessionSummary';
import { DynamicClouds } from './DynamicClouds';
import { ScrollingFog } from './ScrollingFog';

export function VipassanaVisual({
    themeId = 'dawnSky',
    wallpaperId, // Optional: separate wallpaper selection
    durationSeconds = 300, // 5 min default
    stage = 'flame',
    onComplete,
    onExit,
}) {
    // Use wallpaperId if provided, otherwise fall back to themeId
    const effectiveWallpaperId = wallpaperId || themeId;
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        totalNotices: 0,
        categoryCounts: {},
    });
    const [activeThoughtCount, setActiveThoughtCount] = useState(0);

    const timerRef = useRef(null);
    const audioRef = useRef(null);

    // PHASE 5: Atmospheric Events - Ultra-rare, strictly gated
    const [atmosphericEvent, setAtmosphericEvent] = useState(null);
    const eventTriggeredRef = useRef(false); // Max 1 event per session
    const highAliveTimerRef = useRef(0); // Seconds with alive_rate >= 0.8
    const lastAliveCheckRef = useRef(Date.now());

    // Get theme from themeId (for thought element type)
    const themeData = VIPASSANA_THEMES[themeId] || VIPASSANA_THEMES.dawnSky;
    // Get wallpaper data (may be different from theme)
    const wallpaperData = VIPASSANA_THEMES[effectiveWallpaperId] || VIPASSANA_THEMES.dawnSky;

    // Element type toggle (clouds, birds, leaves, lanterns)
    const ELEMENT_TYPES = ['cloud', 'bird', 'leaf', 'lantern'];
    const ELEMENT_ICONS = { cloud: '☁️', bird: '🐦', leaf: '🍂', lantern: '🏮' };
    const [elementType, setElementType] = useState(themeData?.thoughtElement || 'cloud');

    const cycleElementType = () => {
        const currentIdx = ELEMENT_TYPES.indexOf(elementType);
        const nextIdx = (currentIdx + 1) % ELEMENT_TYPES.length;
        setElementType(ELEMENT_TYPES[nextIdx]);
    };

    // Timer tick
    useEffect(() => {
        if (!isActive) return;

        timerRef.current = setInterval(() => {
            setElapsedSeconds((prev) => {
                const next = prev + 1;
                if (next >= durationSeconds) {
                    clearInterval(timerRef.current);
                    handleSessionEnd();
                    return durationSeconds;
                }
                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isActive, durationSeconds]);

    // Handle session end
    const handleSessionEnd = useCallback(() => {
        setIsActive(false);
        setShowSummary(true);

        // Play session end sound
        try {
            const audio = new Audio(`${import.meta.env.BASE_URL}${VIPASSANA_AUDIO.sessionEnd.file}`);
            audio.volume = VIPASSANA_AUDIO.sessionEnd.volume;
            audio.play().catch(() => { });
        } catch (e) { }
    }, []);

    // Track thought spawns
    const handleThoughtSpawn = useCallback((thought) => {
        setSessionStats((prev) => ({
            totalNotices: prev.totalNotices + 1,
            categoryCounts: {
                ...prev.categoryCounts,
                [thought.category]: (prev.categoryCounts[thought.category] || 0) + 1,
            },
        }));
    }, []);

    // Track active thought count for fog density
    const handleThoughtCountChange = useCallback((count) => {
        setActiveThoughtCount(count);

        // PHASE 5: Track alive_rate for event gating
        const now = Date.now();
        const deltaSeconds = (now - lastAliveCheckRef.current) / 1000;
        lastAliveCheckRef.current = now;

        // Calculate alive_rate (ratio of active thoughts to max)
        const alive_rate = count / PRACTICE_INVARIANT.maxActiveThoughts;

        // Accumulate time with high alive_rate
        if (alive_rate >= 0.80) {
            highAliveTimerRef.current += deltaSeconds;
        }

        // Event gating: trigger after 3min of high alive_rate, max 1 per session
        if (!eventTriggeredRef.current &&
            elapsedSeconds >= 180 &&
            highAliveTimerRef.current >= 180) {

            // 75% of sessions get no events
            if (Math.random() < 0.75) return;

            // Roll for event type
            const roll = Math.random();
            let eventType = null;

            if (roll < 0.15) {
                eventType = 'rainShimmer'; // 15%
            } else if (roll < 0.20) {
                eventType = 'birdsDispersing'; // 5%
            } else if (roll < 0.24) {
                eventType = 'rainbow'; // 4%
            } else if (roll < 0.25 && eventTriggeredRef.current) {
                eventType = 'ufo'; // 1%, only if event already occurred
            }

            if (eventType) {
                eventTriggeredRef.current = true;
                setAtmosphericEvent({ type: eventType, startTime: now });

                // Clear event after duration
                const durations = {
                    rainShimmer: 1500,
                    birdsDispersing: 2000,
                    rainbow: 2000,
                    ufo: 800,
                };
                setTimeout(() => setAtmosphericEvent(null), durations[eventType]);
            }
        }
    }, [elapsedSeconds]);

    // Handle summary close
    const handleSummaryClose = () => {
        setShowSummary(false);
        onComplete?.(sessionStats);
    };

    return (
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 9999 }}>
            {/* Solid black base - blocks main app wallpaper */}
            <div className="absolute inset-0 bg-black" />

            {/* Background wallpaper - never degrades */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}${wallpaperData.wallpaper})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />

            {/* Dynamic cloud layer - appears after first thought */}
            <DynamicClouds
                isVisible={sessionStats.totalNotices > 0}
                opacity={0.08}
            />

            {/* Scrolling fog - lower third, mirrors thought density */}
            <ScrollingFog
                thoughtDensity={Math.min(activeThoughtCount / 30, 1)}
            />

            {/* Thought labeling layer */}
            <ThoughtLabeling
                theme={{ ...themeData, thoughtElement: elementType }}
                onThoughtSpawn={handleThoughtSpawn}
                onThoughtCountChange={handleThoughtCountChange}
                audioEnabled={true}
                atmosphericEvent={atmosphericEvent}
            />

            {/* Static timer - center */}
            <StaticTimer
                elapsedSeconds={elapsedSeconds}
                opacity={0.65}
            />

            {/* Mini avatar - top right */}
            <MiniAvatar
                stage={stage}
                opacity={0.3}
            />

            {/* Exit button - subtle */}
            <button
                onClick={onExit}
                className="fixed top-6 left-6 text-white/30 hover:text-white/50 transition-opacity text-sm z-20"
            >
                ← Exit
            </button>

            {/* Element type toggle - top right, unobtrusive */}
            <button
                onClick={cycleElementType}
                className="fixed top-6 right-6 text-white/40 hover:text-white/60 transition-all z-20 rounded-full px-2 py-1"
                style={{
                    fontSize: '14px',
                    background: 'rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(4px)',
                }}
                title={`Switch element (${elementType})`}
            >
                {ELEMENT_ICONS[elementType]}
            </button>

            {/* Session summary overlay */}
            <SessionSummary
                isVisible={showSummary}
                totalNotices={sessionStats.totalNotices}
                categoryCounts={sessionStats.categoryCounts}
                onContinue={handleSummaryClose}
                onClose={handleSummaryClose}
            />
        </div>
    );
}

export default VipassanaVisual;
