// src/components/SensorySession.jsx
// Main container for all sensory meditation practices

import React, { useState, useEffect, useRef } from 'react';
import { PromptDisplay } from './PromptDisplay.jsx';
import { SakshiVisual } from './SakshiVisual.jsx';
import { BodyScanVisual } from './BodyScanVisual.jsx';
import { SENSORY_TYPES } from '../data/sensoryTypes.js';
import { SAKSHI_PROMPTS } from '../data/sakshiPrompts.js';
import { BODY_SCANS, getAllBodyScans } from '../data/bodyScanPrompts.js';
import { getEmotionPrompts } from '../data/emotionPractices.js';
import { getAllRituals, getRitualById } from '../data/rituals/index.js';
import RitualSession from './RitualSession.jsx';
import { Icon } from '../icons/Icon.jsx';
import { BODY_SCAN_ASSETS } from '../config/awarenessAssets.js';

// DEV MODE - flip to false when shipping
const DEV_PROMPT_PREVIEW = false;

export function SensorySession({
    sensoryType,
    duration, // in minutes
    onStop,
    onTimeUpdate,
    scanType,
    onScanTypeChange,
    emotionMode,
    emotionPromptMode,
    isLight = false,
}) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [mode, setMode] = useState('noting'); // unused, kept for future
    const [selectedRitualId, setSelectedRitualId] = useState('standingMeditation'); // for bhakti default
    const [selectedScanId, setSelectedScanId] = useState(scanType ?? 'full'); // for bodyScan localized scans
    const [devPromptIndex, setDevPromptIndex] = useState(0); // DEV: manual prompt navigation
    
    // Timer state for step-by-step countdown
    const [stepIndex, setStepIndex] = useState(0);
    const [stepRemainingSec, setStepRemainingSec] = useState(0);
    const [sessionRemainingSec, setSessionRemainingSec] = useState(duration * 60);
    const [sessionComplete, setSessionComplete] = useState(false);

    // Timer Refs
    const startTimeRef = useRef(performance.now());
    const intervalRef = useRef(null);
    const onStopCalledRef = useRef(false);

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
            case 'bodyScan':
                return BODY_SCANS[selectedScanId]?.prompts || BODY_SCANS.full.prompts;
            case 'emotion':
                return getEmotionPrompts(emotionMode, emotionPromptMode);
            default:
                return [];
        }
    };

    const allPrompts = getAllPrompts();

    // Auto-advance timer with even distribution
    const timeoutRef = useRef(null);
    const intervalRef2 = useRef(null);

    // Calculate step durations for even distribution
    const calculateStepDurations = (durationMin, numSteps) => {
        if (numSteps <= 0) return [];
        const totalSec = durationMin * 60;
        const base = Math.floor(totalSec / numSteps);
        const rem = totalSec % numSteps;
        const durations = [];
        for (let i = 0; i < numSteps; i++) {
            durations[i] = base + (i < rem ? 1 : 0);
        }
        return durations;
    };

    // Timer countdown effect - runs every second to update remaining time
    useEffect(() => {
        if (sensoryType === 'bhakti' || DEV_PROMPT_PREVIEW) return;

        const numSteps = allPrompts.length || 1;
        const stepDurations = calculateStepDurations(duration, numSteps);

        // Initialize first step duration
        if (stepIndex === 0 && stepRemainingSec === 0) {
            setStepRemainingSec(stepDurations[0] || 1);
            setSessionRemainingSec(duration * 60);
        }

        // Set up 1-second interval for countdown
        intervalRef2.current = setInterval(() => {
            setSessionRemainingSec((sessPrev) => {
                const newSessionRemaining = Math.max(0, sessPrev - 1);

                // Check if session time has reached 0 (auto-complete)
                if (newSessionRemaining === 0) {
                    setSessionComplete(true);
                    return 0;
                }

                return newSessionRemaining;
            });

            setStepRemainingSec((prev) => {
                const newStepRemaining = Math.max(0, prev - 1);

                // When step completes
                if (newStepRemaining === 0) {
                    const nextStepIdx = stepIndex + 1;

                    if (nextStepIdx < numSteps) {
                        // Move to next step
                        setStepIndex(nextStepIdx);
                        setDevPromptIndex(nextStepIdx);
                        return stepDurations[nextStepIdx] || 1;
                    } else {
                        // Session complete - signal via state, not direct callback
                        setSessionComplete(true);
                        return 0;
                    }
                }

                return newStepRemaining;
            });
        }, 1000);

        return () => {
            if (intervalRef2.current) {
                clearInterval(intervalRef2.current);
            }
        };
    }, [duration, allPrompts, sensoryType, onStop, stepIndex, stepRemainingSec]);

    // Handle session completion (fire onStop once, outside of render)
    useEffect(() => {
        if (sessionComplete && !onStopCalledRef.current && onStop) {
            onStopCalledRef.current = true;
            onStop();
        }
    }, [sessionComplete, onStop]);

    // Update prompts (Standard Sensory only)
    useEffect(() => {
        if (sensoryType === 'bhakti') return;

        // Use devPromptIndex for auto-advance (even when not in dev preview)
        if (allPrompts[devPromptIndex]) {
            const prompt = allPrompts[devPromptIndex];
            // Handle both string prompts (emotion) and object prompts (bodyScan, sakshi)
            const promptText = typeof prompt === 'string' ? prompt : prompt.text;
            setCurrentPrompt(promptText);
        }
    }, [devPromptIndex, sensoryType, allPrompts]);

    // Reset when practice/mode/scan changes
    useEffect(() => {
        setDevPromptIndex(0);
        setElapsedSeconds(0);
        startTimeRef.current = performance.now();
    }, [sensoryType, mode, selectedScanId]);

    // Sync local scan selection with external scanType changes
    useEffect(() => {
        if (scanType && scanType !== selectedScanId) {
            setSelectedScanId(scanType);
        }
    }, [scanType, selectedScanId]);

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
                    <div className={`${isLight ? 'bg-white/40' : 'bg-black/40'} backdrop-blur-md rounded-full pointer-events-auto p-1 border ${isLight ? 'border-[#5A4D3C]/10' : 'border-white/10'} flex gap-2 max-w-[90vw] overflow-x-auto scrollbar-hide`}>
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
                            isLight={isLight}
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
        switch (sensoryType) {
            case 'sakshi':
                return <SakshiVisual elapsedSeconds={elapsedSeconds} />;
            case 'bodyScan': {
                const activeScan = BODY_SCANS[selectedScanId] || BODY_SCANS.full;
                const scanImageSrc = BODY_SCAN_ASSETS?.[selectedScanId] ?? null;
                const currentPointId = allPrompts[stepIndex]?.point || null;
                return (
                    <BodyScanVisual
                        elapsedSeconds={elapsedSeconds}
                        activePointId={currentPointId}
                        scanPoints={activeScan.points}
                        scanPrompts={activeScan.prompts}
                        image={scanImageSrc}
                        isLight={isLight}
                    />
                );
            }
            case 'emotion':
                // Emotion practice: just show empty space for focused listening
                return <div className="w-full h-24" />;
            default:
                return null;
        }
    };

    // Helper to format seconds to mm:ss
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Get current point name for display
    const getCurrentPointName = () => {
        if (sensoryType !== 'bodyScan') return '';
        const activeScan = BODY_SCANS[selectedScanId] || BODY_SCANS.full;
        const pointId = allPrompts[devPromptIndex]?.point;
        const point = activeScan.points.find(p => p.id === pointId);
        return point?.name || '';
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center relative w-full">
                <div className="flex items-center justify-center mb-1" style={{ color: 'var(--accent-color)' }}>
                    <Icon name={sensoryType} size={32} />
                </div>
                <div
                    className="text-sm font-semibold text-[var(--accent-color)] tracking-widest mb-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {config?.label}
                </div>
            </div>

            {/* Visual */}
            <div className="w-full">
                {renderVisual()}
            </div>

            {/* Timer and Point Display (for Body Scan) */}
            {sensoryType === 'bodyScan' && (
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="text-lg font-semibold text-[var(--accent-color)]">
                        {getCurrentPointName()}
                    </div>
                    <div className="flex gap-4 text-sm text-[var(--accent-60)]">
                        <div>
                            Step: <span className="font-mono font-bold text-[var(--accent-color)]">{stepIndex + 1}/{allPrompts.length}</span>
                        </div>
                        <div>
                            Step time: <span className="font-mono font-bold text-[var(--accent-color)]">{formatTime(stepRemainingSec)}</span>
                        </div>
                        <div>
                            Session time: <span className="font-mono font-bold text-[var(--accent-color)]">{formatTime(sessionRemainingSec)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Timer Display for Emotion (session time only) */}
            {sensoryType === 'emotion' && (
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="text-sm text-[var(--accent-60)]">
                        Session time: <span className="font-mono font-bold text-[var(--accent-color)]">{formatTime(sessionRemainingSec)}</span>
                    </div>
                </div>
            )}

            {/* Prompt Display */}
            {currentPrompt && (
                <PromptDisplay
                    text={currentPrompt}
                    onAudioPlay={(text) => console.log('[Audio placeholder]:', text)}
                />
            )}

            {/* Stop Button */}
            <div className="flex justify-center mt-4">
                <button
                    onClick={onStop}
                    className="px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-widest transition-all"
                    style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                >
                    Stop
                </button>
            </div>
        </div>
    );
}
