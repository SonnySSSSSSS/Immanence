// src/components/vipassana/VipassanaVisual.jsx
// Main orchestrator for Vipassana thought labeling meditation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VIPASSANA_THEMES, VIPASSANA_AUDIO, PRACTICE_INVARIANT } from '../../data/vipassanaThemes';
import { ThoughtLabeling } from './ThoughtLabeling';
import { MiniAvatar } from './MiniAvatar';
import { StaticTimer } from './StaticTimer';
import { SessionSummary } from './SessionSummary';
import { ScrollingFog } from './ScrollingFog';
import { VipassanaVideoLayer } from './VipassanaVideoLayer';

export function VipassanaVisual({
    themeId = 'dawnSky',
    wallpaperId, // Optional: separate wallpaper selection
    durationSeconds = 300, // 5 min default
    stage = 'flame',
    onComplete,
    onExit,
}) {
    // Theme keys for cycling
    const themeKeys = Object.keys(VIPASSANA_THEMES);

    // State for current theme and wallpaper (can cycle independently)
    const [currentThemeId, setCurrentThemeId] = useState(themeId);
    const [currentWallpaperId, setCurrentWallpaperId] = useState(wallpaperId || themeId);

    // Use wallpaperId if provided, otherwise fall back to currentWallpaperId
    const effectiveWallpaperId = currentWallpaperId;
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [wallpaperTransition, setWallpaperTransition] = useState(false);
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

    // Get theme from currentThemeId (for thought element type)
    const themeData = VIPASSANA_THEMES[currentThemeId] || VIPASSANA_THEMES.dawnSky;
    // Get wallpaper data (may be different from theme)
    const wallpaperData = VIPASSANA_THEMES[effectiveWallpaperId] || VIPASSANA_THEMES.dawnSky;

    // Element type from currentThemeId (bird, cloud, leaf, lantern)
    const elementType = themeData?.thoughtElement || currentThemeId || 'cloud';

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

    // Keyboard controls: W = cycle wallpaper, T = cycle theme/stamps
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if summary is showing
            if (showSummary) return;

            const key = e.key.toLowerCase();

            if (key === 'escape') {
                onExit?.();
            } else if (key === 'w') {
                // Cycle wallpaper
                setCurrentWallpaperId(prev => {
                    const currentIndex = themeKeys.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % themeKeys.length;
                    return themeKeys[nextIndex];
                });
            } else if (key === 't') {
                // Cycle theme (stamps/thought elements)
                setCurrentThemeId(prev => {
                    const currentIndex = themeKeys.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % themeKeys.length;
                    return themeKeys[nextIndex];
                });
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showSummary, themeKeys, onExit]);

    return (
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 9999 }}>
            {/* Solid black base - blocks main app wallpaper */}
            <div className="absolute inset-0 bg-black" />

            {/* Background wallpaper with crossfade transition */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}${wallpaperData.wallpaper})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: wallpaperTransition ? 0 : 1,
                }}
            />

            {/* Video midground layer - transparent loops for depth */}
            <VipassanaVideoLayer
                videoType={themeData.videoType || 'leaves'}
                enabled={!!themeData.videoType}
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
                audioEnabled={false}
                atmosphericEvent={atmosphericEvent}
            />

            {/* Static timer - center */}
            <StaticTimer
                elapsedSeconds={elapsedSeconds}
                opacity={0.85}
            />

            {/* Mini avatar - top right */}
            <MiniAvatar
                stage={stage}
                opacity={0.3}
            />

            {/* Exit button - improved visibility */}
            <button
                onClick={onExit}
                className="fixed top-6 left-6 text-white/50 hover:text-white/80 transition-all text-sm z-20 flex items-center gap-2 group"
            >
                <span>← Exit</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity">(ESC)</span>
            </button>

            {/* Keyboard hints - subtle overlay */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div
                    className="text-[10px] uppercase tracking-wider text-white/30 text-center space-y-1"
                    style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                >
                    <div>Tap to notice • Long-press for details</div>
                    <div className="text-[9px] text-white/20">W: Wallpaper • T: Stamps</div>
                </div>
            </div>



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
