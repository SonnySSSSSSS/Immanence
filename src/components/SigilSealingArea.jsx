// src/components/SigilSealingArea.jsx
// Permanent sigil sealing interface for Application section
// Replaces the tracking view with an always-available awareness logging tool

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApplicationStore } from '../state/applicationStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { getPathById } from '../data/navigationData.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function SigilSealingArea() {
    const [currentPath, setCurrentPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
    const svgRef = useRef(null);

    const { logAwareness, intention, setIntention } = useApplicationStore();
    const { activePath } = useNavigationStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const [isEditingIntention, setIsEditingIntention] = useState(false);
    const [intentionInput, setIntentionInput] = useState(intention || '');

    const handlePointerDown = (e) => {
        if (!activePath) return;
        setIsDrawing(true);
        const point = getPoint(e);
        setCurrentPath([point]);
    };

    const handlePointerMove = (e) => {
        if (!isDrawing) return;
        const point = getPoint(e);
        setCurrentPath(prev => [...prev, point]);
    };

    const handlePointerUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        // If a path was drawn, log it as awareness
        if (currentPath.length > 10 && activePath) {
            // Log the gesture (using a generic category for sigil tracing)
            logAwareness('awareness-traced', activePath.activePathId);

            // Show success feedback
            setShowSuccessFeedback(true);
            setTimeout(() => {
                setShowSuccessFeedback(false);
                setCurrentPath([]);
            }, 1200);
        } else {
            // Too short, just clear
            setCurrentPath([]);
        }
    };

    const getPoint = (e) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleClear = () => {
        setCurrentPath([]);
    };

    const path = activePath ? getPathById(activePath.activePathId) : null;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Header Instruction */}
            <div className="text-center px-4">
                <div
                    className="text-[11px] uppercase tracking-[0.3em] mb-2"
                    style={{
                        color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(253, 251, 245, 0.5)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600
                    }}
                >
                    Sigil Sealing
                </div>
                <p
                    className="text-[13px] italic leading-relaxed max-w-md mx-auto"
                    style={{
                        color: isLight ? 'rgba(60, 45, 35, 0.7)' : 'rgba(253, 251, 245, 0.6)',
                        fontFamily: 'var(--font-body)',
                        letterSpacing: '0.01em'
                    }}
                >
                    Draw a symbol of your awareness — trace your will into the field
                </p>
            </div>

            {/* Sigil Drawing Canvas */}
            <div
                className="relative w-full aspect-square max-w-md mx-auto rounded-[2rem] overflow-hidden border-2 shadow-2xl"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.95), rgba(248, 244, 235, 0.9))'
                        : 'linear-gradient(135deg, rgba(10, 5, 15, 0.95), rgba(5, 5, 8, 0.98))',
                    borderColor: isLight ? 'rgba(180, 120, 40, 0.3)' : 'rgba(255, 220, 120, 0.15)',
                    boxShadow: isLight
                        ? '0 12px 40px rgba(100, 80, 50, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.4)'
                        : '0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                }}
            >
                {/* Background sacred geometry hint */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255, 220, 120, 0.1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Success Flare */}
                {showSuccessFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-[2rem] pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(255, 220, 120, 0.3) 0%, transparent 70%)'
                        }}
                    />
                )}

                {/* SVG Drawing Surface */}
                <svg
                    ref={svgRef}
                    className="w-full h-full touch-none cursor-crosshair"
                    style={{
                        touchAction: 'none',
                        overscrollBehavior: 'none'
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={() => isDrawing && handlePointerUp()}
                >
                    {/* Drawn Path */}
                    {currentPath.length > 1 && (
                        <polyline
                            points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={isLight ? 'rgba(180, 120, 40, 0.8)' : 'rgba(255, 220, 120, 0.8)'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                filter: `drop-shadow(0 0 6px ${isLight ? 'rgba(180, 120, 40, 0.4)' : 'rgba(255, 220, 120, 0.4)'})`,
                                opacity: 0.9
                            }}
                        />
                    )}
                </svg>

                {/* Empty State Prompt */}
                {currentPath.length === 0 && !showSuccessFeedback && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8">
                        <div
                            className="text-[96px] mb-4 opacity-10"
                            style={{ filter: 'blur(1px)' }}
                        >
                            ⟨⟩
                        </div>
                        <p
                            className="text-[12px] italic text-center"
                            style={{
                                color: isLight ? 'rgba(100, 80, 60, 0.4)' : 'rgba(253, 251, 245, 0.2)',
                                fontFamily: 'var(--font-body)'
                            }}
                        >
                            Touch to trace
                        </p>
                    </div>
                )}

                {/* Success Message */}
                {showSuccessFeedback && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div
                                className="text-[18px] font-black uppercase tracking-[0.3em]"
                                style={{
                                    color: isLight ? 'rgba(180, 120, 40, 1)' : 'rgba(255, 220, 120, 1)',
                                    fontFamily: 'var(--font-display)',
                                    textShadow: isLight ? 'none' : '0 2px 8px rgba(255, 220, 120, 0.5)'
                                }}
                            >
                                Sealed
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Clear Button (only when drawing) */}
                {currentPath.length > 0 && !showSuccessFeedback && (
                    <button
                        onClick={handleClear}
                        className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider transition-all"
                        style={{
                            background: isLight ? 'rgba(255, 250, 240, 0.9)' : 'rgba(10, 5, 15, 0.8)',
                            color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(253, 251, 245, 0.4)',
                            border: `1px solid ${isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 220, 120, 0.1)'}`,
                            fontFamily: 'var(--font-display)'
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Intention Display/Editor */}
            <div className="max-w-md mx-auto px-4">
                <div
                    className="rounded-2xl px-5 py-4 transition-all duration-300"
                    style={{
                        background: isLight
                            ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(248, 244, 235, 0.5))'
                            : 'rgba(10, 15, 25, 0.5)',
                        border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                        boxShadow: isLight
                            ? 'inset 0 2px 6px rgba(0, 0, 0, 0.04)'
                            : 'inset 0 2px 6px rgba(0, 0, 0, 0.4)'
                    }}
                >
                    <div
                        className="text-[9px] uppercase tracking-[0.2em] mb-3 text-center opacity-50"
                        style={{ color: isLight ? 'rgba(100, 80, 60, 0.75)' : 'rgba(253, 251, 245, 0.5)' }}
                    >
                        Current Intention
                    </div>

                    {isEditingIntention ? (
                        <div className="space-y-3">
                            <textarea
                                autoFocus
                                value={intentionInput}
                                onChange={(e) => setIntentionInput(e.target.value)}
                                placeholder="When I notice [pattern], I will..."
                                className="w-full border rounded-2xl px-4 py-3 text-sm placeholder:italic focus:outline-none resize-none text-center transition-all"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)',
                                    borderColor: isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 220, 120, 0.15)',
                                    color: isLight ? 'rgba(60, 45, 35, 0.9)' : 'rgba(253, 251, 245, 0.9)',
                                    fontFamily: 'var(--font-body)'
                                }}
                                rows={3}
                            />
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => {
                                        setIntentionInput(intention || '');
                                        setIsEditingIntention(false);
                                    }}
                                    className="text-[10px] uppercase tracking-widest transition-colors px-3 py-1"
                                    style={{
                                        color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(253, 251, 245, 0.3)',
                                        fontFamily: 'var(--font-display)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setIntention(intentionInput);
                                        setIsEditingIntention(false);
                                    }}
                                    className="text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full transition-all"
                                    style={{
                                        background: isLight ? 'rgba(180, 120, 40, 0.9)' : 'rgba(255, 220, 120, 0.9)',
                                        color: isLight ? '#ffffff' : '#050508',
                                        fontFamily: 'var(--font-display)',
                                        boxShadow: isLight
                                            ? '0 2px 8px rgba(180, 120, 40, 0.3)'
                                            : '0 2px 8px rgba(255, 220, 120, 0.3)'
                                    }}
                                >
                                    Seal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsEditingIntention(true)}
                            className="cursor-pointer group py-2 px-4 rounded-xl transition-all"
                            style={{
                                background: isLight ? 'transparent' : 'transparent'
                            }}
                        >
                            {intention ? (
                                <p
                                    className="text-[13px] text-center italic leading-relaxed"
                                    style={{
                                        color: isLight ? 'rgba(60, 45, 35, 0.85)' : 'rgba(253, 251, 245, 0.7)',
                                        fontFamily: 'var(--font-body)'
                                    }}
                                >
                                    "{intention}"
                                </p>
                            ) : (
                                <p
                                    className="text-[12px] text-center italic opacity-40"
                                    style={{
                                        color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(253, 251, 245, 0.3)',
                                        fontFamily: 'var(--font-body)'
                                    }}
                                >
                                    Tap to set your intention...
                                </p>
                            )}

                            {/* Decorative underline on hover */}
                            <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-40 transition-opacity">
                                <div
                                    className="h-px w-16"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${isLight ? 'rgba(180, 120, 40, 0.5)' : 'rgba(255, 220, 120, 0.5)'}, transparent)`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SigilSealingArea;
