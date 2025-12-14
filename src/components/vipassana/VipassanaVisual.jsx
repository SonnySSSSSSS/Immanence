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
    durationSeconds = 300, // 5 min default
    stage = 'flame',
    onComplete,
    onExit,
}) {
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

    const theme = VIPASSANA_THEMES[themeId] || VIPASSANA_THEMES.dawnSky;

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
    }, []);

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
                    backgroundImage: `url(${import.meta.env.BASE_URL}${theme.wallpaper})`,
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
                theme={theme}
                onThoughtSpawn={handleThoughtSpawn}
                onThoughtCountChange={handleThoughtCountChange}
                audioEnabled={true}
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
