// src/components/SensorySession.jsx
// Main container for all sensory meditation practices

import React, { useState, useEffect, useRef } from 'react';
import { PromptDisplay } from './PromptDisplay.jsx';
import { SakshiVisual } from './SakshiVisual.jsx';
import { VipassanaVisual } from './VipassanaVisual.jsx';
import { BodyScanVisual } from './BodyScanVisual.jsx';
import { SENSORY_TYPES } from '../data/sensoryTypes.js';
import { SAKSHI_PROMPTS } from '../data/sakshiPrompts.js';
import { VIPASSANA_PROMPTS } from '../data/vipassanaPrompts.js';
import { BODY_SCAN_PROMPTS } from '../data/bodyScanPrompts.js';
import { getAllRituals, getRitualById } from '../data/rituals/index.js';
import RitualSession from './RitualSession.jsx';
import { Icon } from '../icons/Icon.jsx';

// DEV MODE - flip to false when shipping
const DEV_PROMPT_PREVIEW = true;

export function SensorySession({
    sensoryType,
    duration, // in minutes
    onStop,
    onTimeUpdate,
}) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [mode, setMode] = useState('noting'); // for vipassana
    const [selectedRitualId, setSelectedRitualId] = useState('standingMeditation'); // for bhakti default
    const [devPromptIndex, setDevPromptIndex] = useState(0); // DEV: manual prompt navigation

    // Timer Refs
    const startTimeRef = useRef(performance.now());
    const intervalRef = useRef(null);

    // Scroll Refs
    const scrollContainerRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const scrollStartRef = useRef(0);

    const config = SENSORY_TYPES[sensoryType];
    const totalSeconds = duration * 60;

    // Fetch available rituals if in bhakti mode
    const availableRituals = sensoryType === 'bhakti' ? getAllRituals() : [];

    // Get all prompts for current practice/mode (Legacy/Standard Sensory)
    const getAllPrompts = () => {
        switch (sensoryType) {
            case 'sakshi':
                return SAKSHI_PROMPTS;
            case 'vipassana':
                return VIPASSANA_PROMPTS[mode] || VIPASSANA_PROMPTS.noting;
            case 'bodyScan':
                return BODY_SCAN_PROMPTS;
            default:
                return [];
        }
    };

    const allPrompts = getAllPrompts();

    // Timer (only runs when not in dev preview mode AND NOT in bhakti mode)
    useEffect(() => {
        // Bhakti rituals manage their own timer in RitualSession
        if (sensoryType === 'bhakti') return;

        if (DEV_PROMPT_PREVIEW) {
            if (allPrompts[devPromptIndex]) {
                setCurrentPrompt(allPrompts[devPromptIndex].text);
            }
            return;
        }

        startTimeRef.current = performance.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Math.floor((performance.now() - startTimeRef.current) / 1000);
            setElapsedSeconds(elapsed);

            if (onTimeUpdate) {
                onTimeUpdate(totalSeconds - elapsed);
            }

            // Auto-stop when time is up
            if (elapsed >= totalSeconds) {
                if (onStop) onStop();
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [duration, totalSeconds, onStop, onTimeUpdate, devPromptIndex, allPrompts, sensoryType]);

    // Update prompts (Standard Sensory only)
    useEffect(() => {
        if (sensoryType === 'bhakti' || DEV_PROMPT_PREVIEW) return;

        let activePrompt = allPrompts[0];
        for (const prompt of allPrompts) {
            if (elapsedSeconds >= prompt.timing) {
                activePrompt = prompt;
            } else {
                break;
            }
        }
        if (activePrompt) {
            setCurrentPrompt(activePrompt.text);
        }
    }, [elapsedSeconds, sensoryType, mode, allPrompts]);

    // Reset devPromptIndex when practice/mode changes
    useEffect(() => {
        setDevPromptIndex(0);
    }, [sensoryType, mode]);

    // Drag handlers
    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        isDraggingRef.current = true;
        dragStartXRef.current = e.pageX;
        scrollStartRef.current = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const dx = e.pageX - dragStartXRef.current;
        scrollContainerRef.current.scrollLeft = scrollStartRef.current - dx;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    // Render Logic
    if (sensoryType === 'bhakti') {
        const ritual = getRitualById(selectedRitualId);

        // If we have a selected ritual, show it (or the selector if we want to allow switching)
        // For now, let's keep the selector visible at top if we are in 'intro' state perhaps?
        // But RitualSession takes over the whole view. 
        // Let's render the selector ONLY if we haven't started (but RitualSession handles 'intro').
        // Actually, let's just let RitualSession take over, but we need a way to SELECT the ritual first.

        // Modified approach: Show selector above, render RitualSession below.
        // RitualSession has its own "intro" state.

        return (
            <div className="w-full h-full flex flex-col relative">
                {/* Ritual Selector (Overlay or Top Bar) */}
                <div className="absolute top-0 left-0 right-0 z-[60] p-4 flex justify-center pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md rounded-full pointer-events-auto p-1 border border-white/10 flex gap-2 max-w-[90vw] overflow-x-auto scrollbar-hide">
                        {availableRituals.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedRitualId(r.id)}
                                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${selectedRitualId === r.id
                                    ? 'bg-[var(--accent-primary)] text-black font-bold'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {r.iconName ? <Icon name={r.iconName} size={14} /> : r.icon} {r.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* The Ritual Player - with top padding to avoid overlap */}
                {ritual ? (
                    <div className="pt-20 h-full">
                        <RitualSession
                            key={ritual.id} // Re-mount on change
                            ritual={ritual}
                            onComplete={onStop}
                            onExit={onStop}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/50">
                        Select a ritual to begin
                    </div>
                )}
            </div>
        );
    }

    // Standard Sensory Rendering
    const renderVisual = () => {
        const currentPointId = DEV_PROMPT_PREVIEW && sensoryType === 'bodyScan' && allPrompts[devPromptIndex]
            ? allPrompts[devPromptIndex].point
            : null;

        switch (sensoryType) {
            case 'sakshi':
                return <SakshiVisual elapsedSeconds={elapsedSeconds} />;
            case 'vipassana':
                return <VipassanaVisual elapsedSeconds={elapsedSeconds} />;
            case 'bodyScan':
                return <BodyScanVisual elapsedSeconds={elapsedSeconds} activePointId={currentPointId} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center mb-1" style={{ color: 'var(--accent-color)' }}>
                    <Icon name={sensoryType} size={32} />
                </div>
                <div className="text-sm font-[Georgia] text-[var(--accent-color)] tracking-widest">
                    {config?.label}
                </div>
            </div>

            {/* Mode toggle for Vipassana */}
            {sensoryType === 'vipassana' && (
                <div className="flex gap-2">
                    {['noting', 'watching'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider transition-all"
                            style={{
                                fontFamily: 'Georgia, serif',
                                background: mode === m ? 'var(--accent-color)' : 'transparent',
                                color: mode === m ? '#050508' : 'rgba(253,251,245,0.5)',
                                border: `1px solid ${mode === m ? 'var(--accent-color)' : 'var(--accent-20)'}`,
                            }}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            )}

            {/* Visual */}
            <div className="w-full">
                {renderVisual()}
            </div>

            {/* DEV Controls for Standard Sensory */}
            {DEV_PROMPT_PREVIEW && allPrompts.length > 0 && (
                <div className="w-full max-w-md flex items-center justify-between gap-4 px-4">
                    <button
                        onClick={() => setDevPromptIndex(Math.max(0, devPromptIndex - 1))}
                        disabled={devPromptIndex === 0}
                        className="px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-30 border border-[var(--accent-20)] bg-white/10 text-white/80"
                    >
                        ← Prev
                    </button>
                    <div className="text-center flex-1 font-[Georgia] text-[10px] text-[var(--accent-color)]">
                        {devPromptIndex + 1} / {allPrompts.length}
                        <div style={{ fontSize: '8px', opacity: 0.5 }}>
                            @{allPrompts[devPromptIndex]?.timing || 0}s
                        </div>
                    </div>
                    <button
                        onClick={() => setDevPromptIndex(Math.min(allPrompts.length - 1, devPromptIndex + 1))}
                        disabled={devPromptIndex >= allPrompts.length - 1}
                        className="px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-30 border border-[var(--accent-20)] bg-white/10 text-white/80"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Prompt Display */}
            {currentPrompt && (
                <PromptDisplay
                    text={currentPrompt}
                    onAudioPlay={(text) => console.log('[Audio placeholder]:', text)}
                />
            )}
        </div>
    );
}
